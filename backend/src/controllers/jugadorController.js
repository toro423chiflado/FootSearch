import { query } from "../config/postgres.js";
import { MediaJugador } from "../models/MediaJugador.js";

function calcularEdad(fechaNacimiento) {
  if (!fechaNacimiento) return null;
  const hoy = new Date();
  const nac = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
}

// GET /api/jugadores?q=&posicion=&disponible=&nivel=&pierna=&nacionalidad=
//   &estaturaMin=&estaturaMax=&pesoMin=&pesoMax=&edadMin=&edadMax=
export async function listar(req, res) {
  const {
    q, posicion, disponible, nivel, pierna, nacionalidad,
    estaturaMin, estaturaMax, pesoMin, pesoMax, edadMin, edadMax,
  } = req.query;
  const where = [];
  const params = [];
  const add = (cond, val) => { params.push(val); where.push(cond.replace("$$", `$${params.length}`)); };

  if (q) add("u.nombre ILIKE $$", `%${q}%`);
  if (posicion) add("j.posicion = $$", posicion);
  if (pierna) add("j.pierna = $$", pierna);
  if (nacionalidad) add("j.nacionalidad ILIKE $$", `%${nacionalidad}%`);
  if (disponible === "si") where.push("j.disponible = true");
  if (disponible === "no") where.push("j.disponible = false");
  if (nivel === "pro") where.push("j.profesional = true");
  if (nivel === "ama") where.push("j.profesional = false");
  if (estaturaMin) add("j.estatura_cm >= $$", Number(estaturaMin));
  if (estaturaMax) add("j.estatura_cm <= $$", Number(estaturaMax));
  if (pesoMin) add("j.peso_kg >= $$", Number(pesoMin));
  if (pesoMax) add("j.peso_kg <= $$", Number(pesoMax));
  // edad → se traduce a rango de fecha de nacimiento
  if (edadMin) add("j.fecha_nacimiento <= $$", `${new Date().getFullYear() - Number(edadMin)}-12-31`);
  if (edadMax) add("j.fecha_nacimiento >= $$", `${new Date().getFullYear() - Number(edadMax)}-01-01`);

  const sql = `
    SELECT j.id, u.nombre, j.nombres, j.apellido_paterno, j.apellido_materno, j.nacionalidad,
           j.posicion, j.fecha_nacimiento, j.estatura_cm, j.peso_kg,
           j.pierna, j.ciudad, j.disponible, j.profesional, j.foto_perfil, j.foto_portada,
           j.partidos, j.goles, j.asistencias, j.minutos,
           cl.nombre AS club_nombre, cl.id AS club_id
    FROM jugadores j
    JOIN usuarios u ON u.id = j.usuario_id
    LEFT JOIN clubes cl ON cl.id = j.club_id
    ${where.length ? "WHERE " + where.join(" AND ") : ""}
    ORDER BY j.goles DESC, u.nombre ASC`;

  try {
    const r = await query(sql, params);
    const data = r.rows.map((j) => ({ ...j, edad: calcularEdad(j.fecha_nacimiento) }));
    return res.json({ total: data.length, jugadores: data });
  } catch (e) {
    console.error("[jugadores.listar]", e.message);
    return res.status(500).json({ error: "No se pudo listar jugadores." });
  }
}

// GET /api/jugadores/:id  → perfil completo + videos (Mongo) + logros
export async function detalle(req, res) {
  try {
    const r = await query(
      `SELECT j.*, u.nombre, cl.nombre AS club_nombre, cl.id AS club_uuid
       FROM jugadores j
       JOIN usuarios u ON u.id = j.usuario_id
       LEFT JOIN clubes cl ON cl.id = j.club_id
       WHERE j.id = $1`,
      [req.params.id]
    );
    if (r.rowCount === 0) return res.status(404).json({ error: "Jugador no encontrado." });
    const jugador = r.rows[0];
    jugador.edad = calcularEdad(jugador.fecha_nacimiento);

    // Privacidad: el celular (contacto) solo lo ven el propio jugador,
    // los cazatalentos y los clubes. No se expone en el perfil para otros.
    const esDueno = req.usuario && req.usuario.id === jugador.usuario_id;
    const puedeVerContacto = esDueno || (req.usuario && (req.usuario.tipo === "cazatalentos" || req.usuario.tipo === "club"));
    if (!puedeVerContacto) {
      delete jugador.celular;
      delete jugador.contacto;
    }

    const logros = await query("SELECT titulo FROM logros WHERE jugador_id = $1", [jugador.id]);
    const media = await MediaJugador.findOne({ jugadorId: jugador.id }).lean();

    return res.json({
      jugador,
      logros: logros.rows.map((x) => x.titulo),
      videos: media?.videos || [],
    });
  } catch (e) {
    console.error("[jugadores.detalle]", e.message);
    return res.status(500).json({ error: "No se pudo obtener el jugador." });
  }
}

// PUT /api/jugadores/me  → el jugador edita su propio perfil
// NOTA: las estadísticas (partidos, goles, asistencias, minutos) NO se editan
// aquí. Solo el endpoint admin puede modificarlas.
export async function actualizarMiPerfil(req, res) {
  const {
    nombres, apellidoPaterno, apellidoMaterno, nacionalidad,
    fechaNacimiento, posicion, estatura, peso, pierna, ciudad,
    disponible, profesional, bio, celular,
  } = req.body;

  try {
    const j = await query("SELECT id FROM jugadores WHERE usuario_id = $1", [req.usuario.id]);
    if (j.rowCount === 0) return res.status(404).json({ error: "Perfil de jugador no encontrado." });

    await query(
      `UPDATE jugadores SET
         nombres         = COALESCE($1, nombres),
         apellido_paterno= COALESCE($2, apellido_paterno),
         apellido_materno= COALESCE($3, apellido_materno),
         nacionalidad    = COALESCE($4, nacionalidad),
         fecha_nacimiento= COALESCE($5, fecha_nacimiento),
         posicion   = COALESCE($6, posicion),
         estatura_cm= COALESCE($7, estatura_cm),
         peso_kg    = COALESCE($8, peso_kg),
         pierna     = COALESCE($9, pierna),
         ciudad     = COALESCE($10, ciudad),
         disponible = COALESCE($11, disponible),
         profesional= COALESCE($12, profesional),
         bio        = COALESCE($13, bio),
         celular    = COALESCE($14, celular),
         actualizado_en = now()
       WHERE usuario_id = $15`,
      [nombres, apellidoPaterno, apellidoMaterno, nacionalidad,
       fechaNacimiento, posicion, estatura, peso, pierna, ciudad,
       disponible, profesional, bio, celular, req.usuario.id]
    );
    // Si cambió el nombre, actualizar también usuarios.nombre (para mostrar)
    if (nombres || apellidoPaterno || apellidoMaterno) {
      const r = await query("SELECT nombres, apellido_paterno, apellido_materno FROM jugadores WHERE usuario_id=$1", [req.usuario.id]);
      const f = r.rows[0];
      const completo = [f.nombres, f.apellido_paterno, f.apellido_materno].filter(Boolean).join(" ");
      if (completo) await query("UPDATE usuarios SET nombre=$1 WHERE id=$2", [completo, req.usuario.id]);
    }
    return res.json({ ok: true });
  } catch (e) {
    console.error("[jugadores.actualizar]", e.message);
    return res.status(500).json({ error: "No se pudo actualizar el perfil." });
  }
}

// POST /api/jugadores/me/imagenes  (multipart: foto_perfil y/o foto_portada)
export async function subirImagenes(req, res) {
  try {
    const j = await query("SELECT id FROM jugadores WHERE usuario_id = $1", [req.usuario.id]);
    if (j.rowCount === 0) return res.status(404).json({ error: "Perfil de jugador no encontrado." });

    const perfil = req.files?.foto_perfil?.[0];
    const portada = req.files?.foto_portada?.[0];
    if (!perfil && !portada) return res.status(400).json({ error: "No se envió ninguna imagen." });

    await query(
      `UPDATE jugadores SET
         foto_perfil  = COALESCE($1, foto_perfil),
         foto_portada = COALESCE($2, foto_portada),
         actualizado_en = now()
       WHERE usuario_id = $3`,
      [perfil ? `/uploads/${perfil.filename}` : null,
       portada ? `/uploads/${portada.filename}` : null,
       req.usuario.id]
    );
    const r = await query("SELECT foto_perfil, foto_portada FROM jugadores WHERE usuario_id = $1", [req.usuario.id]);
    return res.json(r.rows[0]);
  } catch (e) {
    console.error("[jugadores.subirImagenes]", e.message);
    return res.status(500).json({ error: "No se pudieron subir las imágenes." });
  }
}
