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

// GET /api/jugadores?q=&posicion=&disponible=&nivel=
export async function listar(req, res) {
  const { q, posicion, disponible, nivel } = req.query;
  const where = [];
  const params = [];

  if (q) {
    params.push(`%${q}%`);
    where.push(`u.nombre ILIKE $${params.length}`);
  }
  if (posicion) {
    params.push(posicion);
    where.push(`j.posicion = $${params.length}`);
  }
  if (disponible === "si") where.push("j.disponible = true");
  if (disponible === "no") where.push("j.disponible = false");
  if (nivel === "pro") where.push("j.profesional = true");
  if (nivel === "ama") where.push("j.profesional = false");

  const sql = `
    SELECT j.id, u.nombre, j.posicion, j.fecha_nacimiento, j.estatura_cm, j.peso_kg,
           j.pierna, j.ciudad, j.disponible, j.profesional, j.foto_perfil,
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
    fechaNacimiento, posicion, estatura, peso, pierna, ciudad,
    disponible, profesional, bio,
  } = req.body;

  try {
    const j = await query("SELECT id FROM jugadores WHERE usuario_id = $1", [req.usuario.id]);
    if (j.rowCount === 0) return res.status(404).json({ error: "Perfil de jugador no encontrado." });

    await query(
      `UPDATE jugadores SET
         fecha_nacimiento = COALESCE($1, fecha_nacimiento),
         posicion   = COALESCE($2, posicion),
         estatura_cm= COALESCE($3, estatura_cm),
         peso_kg    = COALESCE($4, peso_kg),
         pierna     = COALESCE($5, pierna),
         ciudad     = COALESCE($6, ciudad),
         disponible = COALESCE($7, disponible),
         profesional= COALESCE($8, profesional),
         bio        = COALESCE($9, bio),
         actualizado_en = now()
       WHERE usuario_id = $10`,
      [fechaNacimiento, posicion, estatura, peso, pierna, ciudad,
       disponible, profesional, bio, req.usuario.id]
    );
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
