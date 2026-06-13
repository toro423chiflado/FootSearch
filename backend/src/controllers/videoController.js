import { MediaJugador } from "../models/MediaJugador.js";
import { query } from "../config/postgres.js";

// Devuelve el id de jugador del usuario autenticado
async function jugadorIdDeUsuario(usuarioId) {
  const r = await query("SELECT id FROM jugadores WHERE usuario_id = $1", [usuarioId]);
  return r.rows[0]?.id || null;
}

// GET /api/jugadores/:id/videos
export async function listar(req, res) {
  try {
    const media = await MediaJugador.findOne({ jugadorId: req.params.id }).lean();
    return res.json({ videos: media?.videos || [] });
  } catch (e) {
    return res.status(500).json({ error: "No se pudieron obtener los videos." });
  }
}

// POST /api/jugadores/me/videos  (multipart: archivo "video" + campo "titulo")
export async function subir(req, res) {
  try {
    const jugadorId = await jugadorIdDeUsuario(req.usuario.id);
    if (!jugadorId) return res.status(404).json({ error: "No tienes perfil de jugador." });

    const titulo = req.body.titulo || req.file?.originalname || "Video destacado";
    const nuevo = {
      titulo,
      url: req.file ? `/uploads/${req.file.filename}` : req.body.url || null,
      nombreArchivo: req.file?.filename || null,
      tipo: req.body.tipo || "highlight",
    };

    const media = await MediaJugador.findOneAndUpdate(
      { jugadorId },
      { $push: { videos: nuevo } },
      { upsert: true, new: true }
    );
    return res.status(201).json({ videos: media.videos });
  } catch (e) {
    console.error("[videos.subir]", e.message);
    return res.status(500).json({ error: "No se pudo subir el video." });
  }
}

// PUT /api/jugadores/me/videos/:videoId  (body: { titulo })
export async function renombrar(req, res) {
  const { titulo } = req.body;
  if (!titulo || !titulo.trim()) return res.status(400).json({ error: "El título no puede estar vacío." });
  try {
    const jugadorId = await jugadorIdDeUsuario(req.usuario.id);
    if (!jugadorId) return res.status(404).json({ error: "No tienes perfil de jugador." });

    const media = await MediaJugador.findOneAndUpdate(
      { jugadorId, "videos._id": req.params.videoId },
      { $set: { "videos.$.titulo": titulo.trim() } },
      { new: true }
    );
    return res.json({ videos: media?.videos || [] });
  } catch (e) {
    console.error("[videos.renombrar]", e.message);
    return res.status(500).json({ error: "No se pudo renombrar el video." });
  }
}

// DELETE /api/jugadores/me/videos/:videoId
export async function eliminar(req, res) {
  try {
    const jugadorId = await jugadorIdDeUsuario(req.usuario.id);
    if (!jugadorId) return res.status(404).json({ error: "No tienes perfil de jugador." });

    const media = await MediaJugador.findOneAndUpdate(
      { jugadorId },
      { $pull: { videos: { _id: req.params.videoId } } },
      { new: true }
    );
    return res.json({ videos: media?.videos || [] });
  } catch (e) {
    return res.status(500).json({ error: "No se pudo eliminar el video." });
  }
}
