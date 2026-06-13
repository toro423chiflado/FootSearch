import bcrypt from "bcryptjs";
import { pool, query } from "../config/postgres.js";
import {
  firmarAccessToken,
  firmarRefreshToken,
  verificarToken,
  fechaExpiracionRefresh,
} from "../config/jwt.js";

// Calcula edad a partir de la fecha de nacimiento
function calcularEdad(fechaNacimiento) {
  if (!fechaNacimiento) return null;
  const hoy = new Date();
  const nac = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
}

function emitirTokens(usuario) {
  const payload = { id: usuario.id, tipo: usuario.tipo, nombre: usuario.nombre };
  return {
    accessToken: firmarAccessToken(payload),
    refreshToken: firmarRefreshToken(payload),
  };
}

// =================== REGISTRO ===================
export async function registrar(req, res) {
  const { tipo, correo, password } = req.body;
  let { nombre } = req.body;

  // Validaciones base
  if (!tipo || !correo || !password) {
    return res.status(400).json({ error: "tipo, correo y password son obligatorios." });
  }
  if (!["jugador", "cazatalentos", "club"].includes(tipo)) {
    return res.status(400).json({ error: "Tipo de usuario no válido." });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres." });
  }

  // Para jugadores, el nombre completo se arma desde nombres + apellidos
  if (tipo === "jugador") {
    const { nombres, apellidoPaterno, apellidoMaterno } = req.body;
    if (!nombres || !nombres.trim() || !apellidoPaterno || !apellidoPaterno.trim()) {
      return res.status(400).json({ error: "Nombres y apellido paterno son obligatorios." });
    }
    nombre = [nombres, apellidoPaterno, apellidoMaterno].filter(Boolean).join(" ").trim();
  }

  if (!nombre || !nombre.trim()) {
    return res.status(400).json({
      error: tipo === "club" ? "El nombre del club es obligatorio." : "El nombre es obligatorio.",
    });
  }

  const cliente = await pool.connect();
  try {
    await cliente.query("BEGIN");

    // Correo único
    const existe = await cliente.query("SELECT 1 FROM usuarios WHERE correo = $1", [
      correo.toLowerCase(),
    ]);
    if (existe.rowCount > 0) {
      await cliente.query("ROLLBACK");
      return res.status(409).json({ error: "Ya existe una cuenta con ese correo." });
    }

    // --- Validación específica de CLUB: necesita un código de un solo uso ---
    let codigoClub = null;
    if (tipo === "club") {
      const { idClub } = req.body;
      if (!idClub) {
        await cliente.query("ROLLBACK");
        return res.status(400).json({
          error: "Necesitas un ID de club. Solicítalo al área de Soporte de FootSearch.",
        });
      }
      // Bloquea la fila para que dos registros no usen el mismo código a la vez
      const r = await cliente.query(
        "SELECT * FROM codigos_club WHERE UPPER(codigo) = UPPER($1) FOR UPDATE",
        [idClub.trim()]
      );
      if (r.rowCount === 0) {
        await cliente.query("ROLLBACK");
        return res.status(400).json({
          error: "Ese ID de club no existe. Contacta a Soporte FootSearch.",
        });
      }
      if (r.rows[0].usado) {
        await cliente.query("ROLLBACK");
        return res.status(409).json({
          error: "Ese ID de club ya fue utilizado. Cada ID sirve una sola vez.",
        });
      }
      codigoClub = r.rows[0].codigo;
    }

    // Crear usuario
    const hash = await bcrypt.hash(password, 10);
    const u = await cliente.query(
      `INSERT INTO usuarios (correo, password_hash, tipo, nombre)
       VALUES ($1, $2, $3, $4) RETURNING id, correo, tipo, nombre`,
      [correo.toLowerCase(), hash, tipo, nombre.trim()]
    );
    const usuario = u.rows[0];

    // Crear el perfil correspondiente
    if (tipo === "jugador") {
      const {
        nombres, apellidoPaterno, apellidoMaterno, nacionalidad,
        fechaNacimiento, posicion, pierna, estatura, peso, club, ciudad, celular,
      } = req.body;
      // Resolver club por nombre (opcional)
      let clubId = null;
      if (club) {
        const c = await cliente.query("SELECT id FROM clubes WHERE nombre = $1", [club]);
        clubId = c.rows[0]?.id || null;
      }
      await cliente.query(
        `INSERT INTO jugadores
           (usuario_id, nombres, apellido_paterno, apellido_materno, nacionalidad,
            fecha_nacimiento, posicion, pierna, estatura_cm, peso_kg, ciudad, club_id, contacto, celular)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
        [usuario.id, nombres || null, apellidoPaterno || null, apellidoMaterno || null,
         nacionalidad || null, fechaNacimiento || null, posicion || null, pierna || null,
         estatura || null, peso || null, ciudad || null, clubId, correo.toLowerCase(), celular || null]
      );
    } else if (tipo === "cazatalentos") {
      const { club } = req.body;
      let clubId = null;
      if (club) {
        const c = await cliente.query("SELECT id FROM clubes WHERE nombre = $1", [club]);
        clubId = c.rows[0]?.id || null;
      }
      await cliente.query(
        "INSERT INTO cazatalentos (usuario_id, club_id) VALUES ($1, $2)",
        [usuario.id, clubId]
      );
    } else if (tipo === "club") {
      // Crea el club con el nombre dado y consume el código (un solo uso)
      const iniciales = nombre.trim().split(/\s+/).map((p) => p[0]).slice(0, 3).join("").toUpperCase();
      const nuevoClub = await cliente.query(
        `INSERT INTO clubes (codigo, nombre, iniciales) VALUES ($1, $2, $3) RETURNING id`,
        [codigoClub, nombre.trim(), iniciales]
      );
      const clubId = nuevoClub.rows[0].id;
      await cliente.query(
        "UPDATE codigos_club SET usado = true, usado_por = $1, usado_en = now() WHERE codigo = $2",
        [clubId, codigoClub]
      );
      await cliente.query(
        "INSERT INTO cuentas_club (usuario_id, club_id) VALUES ($1, $2)",
        [usuario.id, clubId]
      );
    }

    // Emitir tokens y guardar refresh
    const { accessToken, refreshToken } = emitirTokens(usuario);
    await cliente.query(
      "INSERT INTO refresh_tokens (usuario_id, token, expira_en) VALUES ($1, $2, $3)",
      [usuario.id, refreshToken, fechaExpiracionRefresh()]
    );

    await cliente.query("COMMIT");
    return res.status(201).json({
      usuario: { id: usuario.id, correo: usuario.correo, tipo: usuario.tipo, nombre: usuario.nombre },
      accessToken,
      refreshToken,
    });
  } catch (e) {
    await cliente.query("ROLLBACK");
    console.error("[registrar]", e.message);
    return res.status(500).json({ error: "No se pudo completar el registro." });
  } finally {
    cliente.release();
  }
}

// =================== LOGIN ===================
export async function login(req, res) {
  const { correo, password } = req.body;
  if (!correo || !password) {
    return res.status(400).json({ error: "Correo y contraseña son obligatorios." });
  }

  try {
    const r = await query("SELECT * FROM usuarios WHERE correo = $1", [correo.toLowerCase()]);
    if (r.rowCount === 0) {
      return res.status(401).json({ error: "Correo o contraseña incorrectos." });
    }
    const usuario = r.rows[0];
    const ok = await bcrypt.compare(password, usuario.password_hash);
    if (!ok) {
      return res.status(401).json({ error: "Correo o contraseña incorrectos." });
    }

    const { accessToken, refreshToken } = emitirTokens(usuario);
    await query(
      "INSERT INTO refresh_tokens (usuario_id, token, expira_en) VALUES ($1, $2, $3)",
      [usuario.id, refreshToken, fechaExpiracionRefresh()]
    );

    return res.json({
      usuario: { id: usuario.id, correo: usuario.correo, tipo: usuario.tipo, nombre: usuario.nombre },
      accessToken,
      refreshToken,
    });
  } catch (e) {
    console.error("[login]", e.message);
    return res.status(500).json({ error: "No se pudo iniciar sesión." });
  }
}

// =================== REFRESH ===================
export async function refrescar(req, res) {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: "Falta el refresh token." });

  try {
    // Debe existir en la BD (no fue revocado)
    const r = await query("SELECT * FROM refresh_tokens WHERE token = $1", [refreshToken]);
    if (r.rowCount === 0) {
      return res.status(401).json({ error: "Sesión no válida. Inicia sesión de nuevo." });
    }
    const payload = verificarToken(refreshToken); // lanza si expiró
    const u = await query("SELECT id, correo, tipo, nombre FROM usuarios WHERE id = $1", [payload.id]);
    if (u.rowCount === 0) return res.status(401).json({ error: "Usuario no encontrado." });

    const usuario = u.rows[0];
    // Rotación: invalida el viejo y emite uno nuevo
    await query("DELETE FROM refresh_tokens WHERE token = $1", [refreshToken]);
    const tokens = emitirTokens(usuario);
    await query(
      "INSERT INTO refresh_tokens (usuario_id, token, expira_en) VALUES ($1, $2, $3)",
      [usuario.id, tokens.refreshToken, fechaExpiracionRefresh()]
    );
    return res.json(tokens);
  } catch (e) {
    return res.status(401).json({ error: "Sesión expirada. Inicia sesión de nuevo." });
  }
}

// =================== LOGOUT ===================
export async function logout(req, res) {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await query("DELETE FROM refresh_tokens WHERE token = $1", [refreshToken]);
  }
  return res.json({ ok: true });
}

// =================== PERFIL PROPIO (/me) ===================
export async function yo(req, res) {
  try {
    const u = await query("SELECT id, correo, tipo, nombre, creado_en FROM usuarios WHERE id = $1", [
      req.usuario.id,
    ]);
    if (u.rowCount === 0) return res.status(404).json({ error: "Usuario no encontrado." });
    const usuario = u.rows[0];
    let extra = {};

    if (usuario.tipo === "jugador") {
      const j = await query("SELECT * FROM jugadores WHERE usuario_id = $1", [usuario.id]);
      if (j.rowCount > 0) {
        extra = { jugador: j.rows[0], edad: calcularEdad(j.rows[0].fecha_nacimiento) };
      }
    } else if (usuario.tipo === "cazatalentos") {
      const c = await query(
        `SELECT cz.club_id, cl.nombre AS club_nombre
         FROM cazatalentos cz LEFT JOIN clubes cl ON cl.id = cz.club_id
         WHERE cz.usuario_id = $1`,
        [usuario.id]
      );
      extra = c.rows[0] || {};
    } else if (usuario.tipo === "club") {
      const c = await query(
        `SELECT cc.club_id, cl.nombre AS club_nombre, cl.codigo
         FROM cuentas_club cc JOIN clubes cl ON cl.id = cc.club_id
         WHERE cc.usuario_id = $1`,
        [usuario.id]
      );
      extra = c.rows[0] || {};
    }

    return res.json({ usuario, ...extra });
  } catch (e) {
    console.error("[yo]", e.message);
    return res.status(500).json({ error: "No se pudo obtener el perfil." });
  }
}

// =================== RECUPERAR CONTRASEÑA ===================
// Maqueta: no hay servicio de email, así que el "token" se devuelve directamente
// para que el usuario pueda restablecer en el momento. En producción se enviaría
// por correo y nunca se devolvería en la respuesta.
export async function solicitarReset(req, res) {
  const { correo } = req.body;
  if (!correo) return res.status(400).json({ error: "Indica tu correo." });
  try {
    const r = await query("SELECT id FROM usuarios WHERE correo = $1", [correo.toLowerCase()]);
    // Por seguridad no revelamos si el correo existe o no... salvo en esta maqueta,
    // donde sí devolvemos el token para poder probar el flujo sin email real.
    if (r.rowCount === 0) {
      return res.json({ ok: true, existe: false, mensaje: "Si el correo existe, podrás restablecer la contraseña." });
    }
    const token = firmarAccessToken({ id: r.rows[0].id, tipo: "reset", nombre: "reset" });
    return res.json({
      ok: true,
      existe: true,
      tokenReset: token,                 // SOLO en maqueta
      mensaje: "Usa este token para establecer una nueva contraseña.",
    });
  } catch (e) {
    console.error("[solicitarReset]", e.message);
    return res.status(500).json({ error: "No se pudo procesar la solicitud." });
  }
}

export async function restablecer(req, res) {
  const { tokenReset, nuevaPassword } = req.body;
  if (!tokenReset || !nuevaPassword) return res.status(400).json({ error: "Falta el token o la nueva contraseña." });
  if (String(nuevaPassword).length < 6) return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres." });
  try {
    const payload = verificarToken(tokenReset);
    const hash = await bcrypt.hash(nuevaPassword, 10);
    await query("UPDATE usuarios SET password_hash = $1 WHERE id = $2", [hash, payload.id]);
    // invalida sesiones anteriores
    await query("DELETE FROM refresh_tokens WHERE usuario_id = $1", [payload.id]);
    return res.json({ ok: true, mensaje: "Contraseña actualizada. Ya puedes iniciar sesión." });
  } catch (e) {
    return res.status(401).json({ error: "Token inválido o expirado. Solicita uno nuevo." });
  }
}
