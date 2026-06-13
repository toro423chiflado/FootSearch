import { Router } from "express";
import * as auth from "../controllers/authController.js";
import * as jugadores from "../controllers/jugadorController.js";
import * as clubes from "../controllers/clubController.js";
import * as favoritos from "../controllers/favoritoController.js";
import * as videos from "../controllers/videoController.js";
import * as admin from "../controllers/adminController.js";
import { requiereAuth, requiereTipo } from "../middleware/auth.js";
import { requiereAdmin } from "../middleware/admin.js";
import { subidaVideo, subidaImagenes } from "../middleware/upload.js";

const router = Router();

// ---------- Salud ----------
router.get("/health", (req, res) => res.json({ ok: true, servicio: "footsearch-api" }));

// ---------- Autenticación ----------
router.post("/auth/register", auth.registrar);
router.post("/auth/login", auth.login);
router.post("/auth/refresh", auth.refrescar);
router.post("/auth/logout", auth.logout);
router.post("/auth/recuperar", auth.solicitarReset);
router.post("/auth/restablecer", auth.restablecer);
router.get("/auth/me", requiereAuth, auth.yo);

// ---------- Jugadores ----------
router.get("/jugadores", requiereAuth, jugadores.listar);
router.put("/jugadores/me", requiereAuth, requiereTipo("jugador"), jugadores.actualizarMiPerfil);
router.post("/jugadores/me/imagenes", requiereAuth, requiereTipo("jugador"), subidaImagenes, jugadores.subirImagenes);
router.get("/jugadores/:id", requiereAuth, jugadores.detalle);

// ---------- Videos / multimedia (MongoDB + disco) ----------
router.get("/jugadores/:id/videos", requiereAuth, videos.listar);
router.post("/jugadores/me/videos", requiereAuth, requiereTipo("jugador"), subidaVideo.single("video"), videos.subir);
router.put("/jugadores/me/videos/:videoId", requiereAuth, requiereTipo("jugador"), videos.renombrar);
router.delete("/jugadores/me/videos/:videoId", requiereAuth, requiereTipo("jugador"), videos.eliminar);

// ---------- Clubes ----------
router.get("/clubes", clubes.listar);
router.get("/clubes/mi", requiereAuth, requiereTipo("club"), clubes.miClub);
router.put("/clubes/mi", requiereAuth, requiereTipo("club"), clubes.editarMiClub);
router.post("/clubes/mi/imagenes", requiereAuth, requiereTipo("club"), subidaImagenes, clubes.subirImagenesClub);
router.post("/clubes/convocatorias", requiereAuth, requiereTipo("club"), clubes.crearConvocatoria);
router.get("/clubes/:id", requiereAuth, clubes.detalle);

// ---------- Favoritos (cazatalentos y club) ----------
router.get("/favoritos", requiereAuth, requiereTipo("cazatalentos", "club"), favoritos.listar);
router.post("/favoritos/:jugadorId", requiereAuth, requiereTipo("cazatalentos", "club"), favoritos.alternar);

// ---------- ADMIN (privado, protegido por x-admin-key) ----------
router.get("/admin/jugadores", requiereAdmin, admin.listarParaAdmin);
router.get("/admin/licencias", requiereAdmin, admin.listarLicencias);
router.put("/admin/jugadores/:id/estadisticas", requiereAdmin, admin.editarEstadisticas);

export default router;
