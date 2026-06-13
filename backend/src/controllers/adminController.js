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
