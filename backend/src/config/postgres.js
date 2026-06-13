import pg from "pg";
import "dotenv/config";

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.PG_HOST || "localhost",
  port: Number(process.env.PG_PORT) || 5432,
  user: process.env.PG_USER || "footsearch",
  password: process.env.PG_PASSWORD || "footsearch_secret",
  database: process.env.PG_DATABASE || "footsearch",
  max: 10,
  idleTimeoutMillis: 30000,
});

pool.on("error", (err) => {
  console.error("[postgres] error inesperado en el pool:", err.message);
});

// Helper para consultas simples
export const query = (text, params) => pool.query(text, params);

export async function probarConexionPg() {
  const { rows } = await pool.query("SELECT NOW() as ahora");
  return rows[0].ahora;
}
