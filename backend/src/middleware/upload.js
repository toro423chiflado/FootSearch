import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const carpeta = path.join(__dirname, "..", "..", "uploads");

if (!fs.existsSync(carpeta)) fs.mkdirSync(carpeta, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, carpeta),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-z0-9]/gi, "_").slice(0, 40);
    cb(null, `${Date.now()}_${base}${ext}`);
  },
});

// Solo videos, máximo 100 MB
export const subidaVideo = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("video/")) cb(null, true);
    else cb(new Error("Solo se permiten archivos de video."));
  },
});

// Imágenes (foto de perfil y portada), máximo 8 MB cada una
export const subidaImagenes = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Solo se permiten archivos de imagen."));
  },
}).fields([
  { name: "foto_perfil", maxCount: 1 },
  { name: "foto_portada", maxCount: 1 },
]);
