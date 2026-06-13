import jwt from "jsonwebtoken";
import "dotenv/config";

const SECRET = process.env.JWT_SECRET || "dev_secret_inseguro";
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || "15m";
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES || "7d";

// Token de acceso: corto, viaja en cada petición protegida
export function firmarAccessToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: ACCESS_EXPIRES, subject: payload.id });
}

// Token de refresco: largo, sirve para pedir nuevos access tokens
export function firmarRefreshToken(payload) {
  return jwt.sign({ id: payload.id, kind: "refresh" }, SECRET, {
    expiresIn: REFRESH_EXPIRES,
    subject: payload.id,
  });
}

export function verificarToken(token) {
  return jwt.verify(token, SECRET); // lanza si es inválido o expiró
}

// Calcula la fecha de expiración del refresh token para guardarla en BD
export function fechaExpiracionRefresh() {
  const dias = parseInt(REFRESH_EXPIRES) || 7;
  return new Date(Date.now() + dias * 24 * 60 * 60 * 1000);
}
