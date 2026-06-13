import { query } from "../config/postgres.js";

function calcularEdad(f) {
  if (!f) return null;
  const hoy = new Date(), nac = new Date(f);
  let e = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) e--;
  return e;
}

// GET /api/favoritos
export async function listar(req, res) {
  try {
    const r = await query(
      `SELECT j.id, u.nombre, j.nombres, j.apellido_paterno, j.apellido_materno, j.nacionalidad,
              j.posicion, j.fecha_nacimiento, j.estatura_cm, j.peso_kg, j.disponible, j.profesional,
              j.foto_perfil, j.foto_portada,
              j.partidos, j.goles, j.asistencias, cl.nombre AS club_nombre, cl.id AS club_id
       FROM favoritos f
       JOIN jugadores j ON j.id = f.jugador_id
       JOIN usuarios u ON u.id = j.usuario_id
       LEFT JOIN clubes cl ON cl.id = j.club_id
       WHERE f.usuario_id = $1
       ORDER BY f.creado_en DESC`,
      [req.usuario.id]
    );
    const data = r.rows.map((j) => ({ ...j, edad: calcularEdad(j.fecha_nacimiento) }));
    return res.json({ jugadores: data, ids: data.map((x) => x.id) });
  } catch (e) {
    return res.status(500).json({ error: "No se pudieron obtener los favoritos." });
  }
}

// POST /api/favoritos/:jugadorId  → alterna favorito
export async function alternar(req, res) {
  const { jugadorId } = req.params;
  try {
    const existe = await query(
      "SELECT 1 FROM favoritos WHERE usuario_id = $1 AND jugador_id = $2",
      [req.usuario.id, jugadorId]
    );
    if (existe.rowCount > 0) {
      await query("DELETE FROM favoritos WHERE usuario_id = $1 AND jugador_id = $2", [
        req.usuario.id, jugadorId,
      ]);
      return res.json({ favorito: false });
    }
    await query("INSERT INTO favoritos (usuario_id, jugador_id) VALUES ($1, $2)", [
      req.usuario.id, jugadorId,
    ]);
    return res.json({ favorito: true });
  } catch (e) {
    return res.status(500).json({ error: "No se pudo actualizar el favorito." });
  }
}
