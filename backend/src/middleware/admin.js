import "dotenv/config";

// Protege los endpoints de administración con una clave secreta.
// Se envía en el header:  x-admin-key: <tu_clave>
// La clave se define en la variable de entorno ADMIN_KEY.
export function requiereAdmin(req, res, next) {
  const clave = req.headers["x-admin-key"];
  const esperada = process.env.ADMIN_KEY;

  if (!esperada) {
    return res.status(500).json({ error: "ADMIN_KEY no está configurada en el servidor." });
  }
  if (!clave || clave !== esperada) {
    return res.status(401).json({ error: "Clave de administración inválida." });
  }
  next();
}
