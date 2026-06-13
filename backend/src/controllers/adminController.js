import { query } from "../config/postgres.js";

// PUT /api/admin/jugadores/:id/estadisticas
// Endpoint PRIVADO. Solo lo usas tú con la clave secreta (header x-admin-key).
// Permite editar partidos, goles, asistencias y minutos de cualquier jugador.
export async function editarEstadisticas(req, res) {
  const { partidos, goles, asistencias, minutos } = req.body;

  // Validación: deben ser enteros >= 0 si vienen
  const campos = { partidos, goles, asistencias, minutos };
  for (const [k, v] of Object.entries(campos)) {
    if (v !== undefined && v !== null) {
      if (!Number.isInteger(v) || v < 0) {
        return res.status(400).json({ error: `'${k}' debe ser un entero >= 0.` });
      }
    }
  }

  try {
    const j = await query("SELECT id FROM jugadores WHERE id = $1", [req.params.id]);
    if (j.rowCount === 0) return res.status(404).json({ error: "Jugador no encontrado." });

    const r = await query(
      `UPDATE jugadores SET
         partidos    = COALESCE($1, partidos),
         goles       = COALESCE($2, goles),
         asistencias = COALESCE($3, asistencias),
         minutos     = COALESCE($4, minutos),
         actualizado_en = now()
       WHERE id = $5
       RETURNING id, partidos, goles, asistencias, minutos`,
      [partidos ?? null, goles ?? null, asistencias ?? null, minutos ?? null, req.params.id]
    );
    return res.json({ ok: true, estadisticas: r.rows[0] });
  } catch (e) {
    console.error("[admin.editarEstadisticas]", e.message);
    return res.status(500).json({ error: "No se pudieron actualizar las estadísticas." });
  }
}

// GET /api/admin/jugadores  → lista compacta para localizar IDs (privado)
export async function listarParaAdmin(req, res) {
  try {
    const r = await query(
      `SELECT j.id, u.nombre, j.partidos, j.goles, j.asistencias, j.minutos
       FROM jugadores j JOIN usuarios u ON u.id = j.usuario_id
       ORDER BY u.nombre`
    );
    return res.json({ jugadores: r.rows });
  } catch (e) {
    return res.status(500).json({ error: "Error al listar." });
  }
}

// GET /api/admin/licencias?estado=libres|usadas|todas&limit=100  (privado)
// Lista los códigos de club (licencias).
export async function listarLicencias(req, res) {
  const { estado = "libres", limit = 100 } = req.query;
  let cond = "";
  if (estado === "libres") cond = "WHERE usado = false";
  else if (estado === "usadas") cond = "WHERE usado = true";
  try {
    const r = await query(
      `SELECT codigo, usado FROM codigos_club ${cond} ORDER BY codigo LIMIT $1`,
      [Math.min(Number(limit) || 100, 1000)]
    );
    const total = await query("SELECT COUNT(*) FILTER (WHERE usado=false)::int libres, COUNT(*)::int total FROM codigos_club");
    return res.json({ licencias: r.rows, resumen: total.rows[0] });
  } catch (e) {
    return res.status(500).json({ error: "Error al listar licencias." });
  }
}

// ============ GESTIÓN DE LOGROS (admin) ============

// GET /api/admin/jugadores/:id/logros
export async function listarLogros(req, res) {
  try {
    const r = await query("SELECT id, titulo FROM logros WHERE jugador_id = $1 ORDER BY id", [req.params.id]);
    return res.json({ logros: r.rows });
  } catch (e) {
    return res.status(500).json({ error: "Error al listar logros." });
  }
}

// POST /api/admin/jugadores/:id/logros   body: { titulo }
export async function agregarLogro(req, res) {
  const { titulo } = req.body;
  if (!titulo || !titulo.trim()) return res.status(400).json({ error: "El título del logro es obligatorio." });
  try {
    const j = await query("SELECT id FROM jugadores WHERE id = $1", [req.params.id]);
    if (j.rowCount === 0) return res.status(404).json({ error: "Jugador no encontrado." });
    const r = await query(
      "INSERT INTO logros (jugador_id, titulo) VALUES ($1, $2) RETURNING id, titulo",
      [req.params.id, titulo.trim()]
    );
    return res.status(201).json({ logro: r.rows[0] });
  } catch (e) {
    return res.status(500).json({ error: "No se pudo agregar el logro." });
  }
}

// DELETE /api/admin/logros/:logroId
export async function eliminarLogro(req, res) {
  try {
    const r = await query("DELETE FROM logros WHERE id = $1 RETURNING id", [req.params.logroId]);
    if (r.rowCount === 0) return res.status(404).json({ error: "Logro no encontrado." });
    return res.json({ ok: true, eliminado: r.rows[0].id });
  } catch (e) {
    return res.status(500).json({ error: "No se pudo eliminar el logro." });
  }
}

// ============ GESTIÓN DE USUARIOS (admin) ============

// GET /api/admin/usuarios?tipo=jugador|cazatalentos|club  (tipo opcional)
export async function listarUsuarios(req, res) {
  const { tipo } = req.query;
  const where = [];
  const params = [];
  if (tipo) { params.push(tipo); where.push(`u.tipo = $${params.length}`); }
  try {
    const r = await query(
      `SELECT u.id, u.correo, u.tipo, u.nombre, u.creado_en
       FROM usuarios u
       ${where.length ? "WHERE " + where.join(" AND ") : ""}
       ORDER BY u.tipo, u.creado_en DESC`,
      params
    );
    return res.json({ total: r.rowCount, usuarios: r.rows });
  } catch (e) {
    return res.status(500).json({ error: "Error al listar usuarios." });
  }
}

// GET /api/admin/clubes
export async function listarClubesAdmin(req, res) {
  try {
    const r = await query(
      `SELECT cl.id, cl.nombre, cl.ciudad, cl.codigo,
              (SELECT COUNT(*) FROM jugadores j WHERE j.club_id = cl.id)::int AS jugadores
       FROM clubes cl ORDER BY cl.nombre`
    );
    return res.json({ total: r.rowCount, clubes: r.rows });
  } catch (e) {
    return res.status(500).json({ error: "Error al listar clubes." });
  }
}

// DELETE /api/admin/usuarios/:id   → elimina un usuario (y en cascada su perfil)
export async function eliminarUsuario(req, res) {
  try {
    const r = await query("DELETE FROM usuarios WHERE id = $1 RETURNING id, correo, tipo", [req.params.id]);
    if (r.rowCount === 0) return res.status(404).json({ error: "Usuario no encontrado." });
    return res.json({ ok: true, eliminado: r.rows[0] });
  } catch (e) {
    console.error("[admin.eliminarUsuario]", e.message);
    return res.status(500).json({ error: "No se pudo eliminar el usuario." });
  }
}

// DELETE /api/admin/clubes/:id   → elimina un club (libera su licencia)
export async function eliminarClub(req, res) {
  try {
    const club = await query("SELECT codigo FROM clubes WHERE id = $1", [req.params.id]);
    if (club.rowCount === 0) return res.status(404).json({ error: "Club no encontrado." });
    // liberar la licencia para que pueda reutilizarse
    await query("UPDATE codigos_club SET usado = false, usado_por = NULL, usado_en = NULL WHERE codigo = $1", [club.rows[0].codigo]);
    await query("DELETE FROM clubes WHERE id = $1", [req.params.id]);
    return res.json({ ok: true, licencia_liberada: club.rows[0].codigo });
  } catch (e) {
    console.error("[admin.eliminarClub]", e.message);
    return res.status(500).json({ error: "No se pudo eliminar el club." });
  }
}
