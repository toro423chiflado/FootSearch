import { verificarToken } from "../config/jwt.js";

// Exige un access token válido en el header Authorization: Bearer <token>
export function requiereAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [esquema, token] = header.split(" ");

  if (esquema !== "Bearer" || !token) {
    return res.status(401).json({ error: "Falta el token de acceso." });
  }

  try {
    const payload = verificarToken(token);
    if (payload.kind === "refresh") {
      return res.status(401).json({ error: "Token inválido para esta operación." });
    }
    req.usuario = { id: payload.id, tipo: payload.tipo, nombre: payload.nombre };
    next();
  } catch (e) {
    const msg = e.name === "TokenExpiredError" ? "El token expiró." : "Token inválido.";
    return res.status(401).json({ error: msg });
  }
}

// Restringe una ruta a ciertos tipos de usuario
export function requiereTipo(...tipos) {
  return (req, res, next) => {
    if (!req.usuario || !tipos.includes(req.usuario.tipo)) {
      return res.status(403).json({ error: "No tienes permiso para esta acción." });
    }
    next();
  };
}
