import mongoose from "mongoose";

// Colección no relacional: cada documento agrupa el contenido multimedia
// de un jugador (videos destacados). Va aquí y no en SQL porque es
// contenido flexible, de tamaño variable y no requiere joins.
const videoSchema = new mongoose.Schema(
  {
    titulo: { type: String, required: true, trim: true },
    url: { type: String, default: null },          // ruta del archivo subido
    nombreArchivo: { type: String, default: null },
    tipo: { type: String, default: "highlight" },   // highlight | entrenamiento | partido
    duracionSeg: { type: Number, default: null },
    subidoEn: { type: Date, default: Date.now },
  },
  { _id: true }
);

const mediaJugadorSchema = new mongoose.Schema(
  {
    // Referencia al UUID del jugador en PostgreSQL (puente entre ambas BDs)
    jugadorId: { type: String, required: true, index: true, unique: true },
    videos: [videoSchema],
  },
  { timestamps: true, collection: "media_jugadores" }
);

export const MediaJugador = mongoose.model("MediaJugador", mediaJugadorSchema);
