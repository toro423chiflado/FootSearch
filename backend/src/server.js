import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";

import router from "./routes/index.js";
import { conectarMongo } from "./config/mongo.js";
import { probarConexionPg } from "./config/postgres.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 4000;

// ---------- Middleware global ----------
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir los videos subidos
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// ---------- Rutas ----------
app.use("/api", router);

// 404
app.use((req, res) => res.status(404).json({ error: "Ruta no encontrada." }));

// Manejador de errores (incluye errores de multer)
app.use((err, req, res, next) => {
  console.error("[error]", err.message);
  const code = err.message?.includes("video") ? 400 : 500;
  res.status(code).json({ error: err.message || "Error interno del servidor." });
});

// ---------- Arranque ----------
async function iniciar() {
  try {
    const ahora = await probarConexionPg();
    console.log("[postgres] conectado:", ahora.toISOString());
    await conectarMongo();

    // Siembra de datos de prueba SOLO si se pide y la base está vacía.
    // Nunca borra datos existentes.
    if (process.env.SEED_ON_START === "true") {
      const { sembrarSiVacio } = await import("./db/seed.js");
      try { await sembrarSiVacio(); }
      catch (e) { console.error("[seed] falló (continuo igual):", e.message); }
    }

    app.listen(PORT, () => console.log(`[api] escuchando en http://localhost:${PORT}`));
  } catch (e) {
    console.error("No se pudo iniciar el servidor:", e.message);
    console.error("¿Están corriendo las bases de datos? Prueba: docker compose up -d");
    process.exit(1);
  }
}

iniciar();
