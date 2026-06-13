import { query } from "../config/postgres.js";

const CUPO_MAX = 52;

// GET /api/clubes
export async function listar(req, res) {
  try {
    const r = await query("SELECT id, codigo, nombre, ciudad, fundado, color, iniciales, foto_perfil FROM clubes ORDER BY nombre");
    return res.json({ clubes: r.rows });
  } catch (e) {
    return res.status(500).json({ error: "No se pudo listar clubes." });
  }
}

// GET /api/clubes/mi  → el club autenticado obtiene su propio perfil (para editar)
export async function miClub(req, res) {
  try {
    const cc = await query("SELECT club_id FROM cuentas_club WHERE usuario_id = $1", [req.usuario.id]);
    if (cc.rowCount === 0) return res.status(404).json({ error: "Tu cuenta no está vinculada a un club." });
    return detallePorId(cc.rows[0].club_id, res);
  } catch (e) {
    return res.status(500).json({ error: "No se pudo obtener tu club." });
  }
}

async function detallePorId(clubId, res) {
  const c = await query("SELECT * FROM clubes WHERE id = $1", [clubId]);
  if (c.rowCount === 0) return res.status(404).json({ error: "Club no encontrado." });
  const plantel = await query(
    `SELECT j.id, u.nombre, j.posicion, j.foto_perfil
     FROM jugadores j JOIN usuarios u ON u.id = j.usuario_id
     WHERE j.club_id = $1 ORDER BY u.nombre`,
    [clubId]
  );
  const convocatorias = await query(
    "SELECT id, titulo, descripcion, creado_en FROM convocatorias WHERE club_id = $1 ORDER BY creado_en DESC",
    [clubId]
  );
  return res.json({ club: c.rows[0], cupoMax: CUPO_MAX, plantel: plantel.rows, convocatorias: convocatorias.rows });
}

// GET /api/clubes/:id → club + plantel + convocatorias
export async function detalle(req, res) {
  try {
    return await detallePorId(req.params.id, res);
  } catch (e) {
    console.error("[clubes.detalle]", e.message);
    return res.status(500).json({ error: "No se pudo obtener el club." });
  }
}

// PUT /api/clubes/mi  → editar datos del club (todo editable)
export async function editarMiClub(req, res) {
  const { nombre, ciudad, fundado, color, iniciales, descripcion } = req.body;
  try {
    const cc = await query("SELECT club_id FROM cuentas_club WHERE usuario_id = $1", [req.usuario.id]);
    if (cc.rowCount === 0) return res.status(403).json({ error: "Tu cuenta no está vinculada a un club." });

    await query(
      `UPDATE clubes SET
         nombre      = COALESCE($1, nombre),
         ciudad      = COALESCE($2, ciudad),
         fundado     = COALESCE($3, fundado),
         color       = COALESCE($4, color),
         iniciales   = COALESCE($5, iniciales),
         descripcion = COALESCE($6, descripcion)
       WHERE id = $7`,
      [nombre, ciudad, fundado, color, iniciales, descripcion, cc.rows[0].club_id]
    );
    return res.json({ ok: true });
  } catch (e) {
    console.error("[clubes.editar]", e.message);
    return res.status(500).json({ error: "No se pudo actualizar el club." });
  }
}

// POST /api/clubes/mi/imagenes  (multipart: foto_perfil escudo, foto_portada)
export async function subirImagenesClub(req, res) {
  try {
    const cc = await query("SELECT club_id FROM cuentas_club WHERE usuario_id = $1", [req.usuario.id]);
    if (cc.rowCount === 0) return res.status(403).json({ error: "Tu cuenta no está vinculada a un club." });

    const perfil = req.files?.foto_perfil?.[0];
    const portada = req.files?.foto_portada?.[0];
    if (!perfil && !portada) return res.status(400).json({ error: "No se envió ninguna imagen." });

    await query(
      `UPDATE clubes SET
         foto_perfil  = COALESCE($1, foto_perfil),
         foto_portada = COALESCE($2, foto_portada)
       WHERE id = $3`,
      [perfil ? `/uploads/${perfil.filename}` : null,
       portada ? `/uploads/${portada.filename}` : null,
       cc.rows[0].club_id]
    );
    const r = await query("SELECT foto_perfil, foto_portada FROM clubes WHERE id = $1", [cc.rows[0].club_id]);
    return res.json(r.rows[0]);
  } catch (e) {
    console.error("[clubes.subirImagenes]", e.message);
    return res.status(500).json({ error: "No se pudieron subir las imágenes." });
  }
}

// POST /api/clubes/convocatorias  (solo cuentas de club)
export async function crearConvocatoria(req, res) {
  const { titulo, descripcion } = req.body;
  if (!titulo) return res.status(400).json({ error: "El título es obligatorio." });
  try {
    const cc = await query("SELECT club_id FROM cuentas_club WHERE usuario_id = $1", [req.usuario.id]);
    if (cc.rowCount === 0) return res.status(403).json({ error: "Tu cuenta no está vinculada a un club." });

    const r = await query(
      "INSERT INTO convocatorias (club_id, titulo, descripcion) VALUES ($1, $2, $3) RETURNING *",
      [cc.rows[0].club_id, titulo, descripcion || null]
    );
    return res.status(201).json({ convocatoria: r.rows[0] });
  } catch (e) {
    return res.status(500).json({ error: "No se pudo crear la convocatoria." });
  }
}
