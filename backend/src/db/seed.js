import bcrypt from "bcryptjs";
import crypto from "crypto";
import { pool } from "../config/postgres.js";
import { conectarMongo } from "../config/mongo.js";
import { MediaJugador } from "../models/MediaJugador.js";
import mongoose from "mongoose";

// Genera un código de club complejo: FS-XXXX-XXXX-XXXX (sin caracteres ambiguos)
const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin O,0,I,1,L
function generarCodigo() {
  const bloque = () => Array.from({ length: 4 },
    () => ALFABETO[crypto.randomInt(ALFABETO.length)]).join("");
  return `FS-${bloque()}-${bloque()}-${bloque()}`;
}

const fechaNac = (edad) => `${new Date().getFullYear() - edad}-06-15`;

// Jugadores demo (estadísticas en 0 según lo pedido; se editan por endpoint admin)
const JUGADORES = [
  { nombres: "Diego", apPaterno: "Quispe", apMaterno: "Mamani", nacionalidad: "Perú", edad: 19, posicion: "Delantero centro", estatura: 178, peso: 72, pierna: "Derecha", ciudad: "Cusco", disponible: true, profesional: false, bio: "Delantero rápido con olfato de gol.", logros: ["Goleador Liga 2 sub-20"], videos: ["Hat-trick vs rival regional"] },
  { nombres: "Mateo", apPaterno: "Flores", apMaterno: "Ramos", nacionalidad: "Perú", edad: 23, posicion: "Mediocampista central", estatura: 175, peso: 70, pierna: "Izquierda", ciudad: "Lima", disponible: false, profesional: true, bio: "Volante de creación con buena visión.", logros: ["Campeón Liga 1 2024"], videos: ["Asistencia de taco"] },
  { nombres: "Luis", apPaterno: "Mendoza", apMaterno: "Vargas", nacionalidad: "Perú", edad: 17, posicion: "Extremo izquierdo", estatura: 170, peso: 64, pierna: "Derecha", ciudad: "Arequipa", disponible: true, profesional: false, bio: "Joven talento amateur.", logros: ["MVP juvenil 2025"], videos: ["Regate y gol"] },
  { nombres: "Carlos", apPaterno: "Rojas", apMaterno: "Díaz", nacionalidad: "Perú", edad: 28, posicion: "Defensa central", estatura: 188, peso: 84, pierna: "Derecha", ciudad: "Lima", disponible: false, profesional: true, bio: "Central experimentado y líder.", logros: ["Capitán 2023-2025"], videos: ["Despeje salvador"] },
  { nombres: "Andrés", apPaterno: "Huamán", apMaterno: "Soto", nacionalidad: "Perú", edad: 21, posicion: "Portero", estatura: 190, peso: 82, pierna: "Derecha", ciudad: "Cusco", disponible: true, profesional: true, bio: "Portero ágil, abierto a propuestas.", logros: ["Valla menos vencida 2024"], videos: ["Triple atajada"] },
  { nombres: "Sebastián", apPaterno: "Ríos", apMaterno: "León", nacionalidad: "Perú", edad: 20, posicion: "Lateral derecho", estatura: 176, peso: 71, pierna: "Derecha", ciudad: "Lima", disponible: true, profesional: true, bio: "Lateral con proyección ofensiva.", logros: ["Revelación 2024"], videos: ["Centro para el gol"] },
  { nombres: "Joaquín", apPaterno: "Vega", apMaterno: "Castro", nacionalidad: "Perú", edad: 18, posicion: "Mediocampista ofensivo", estatura: 173, peso: 67, pierna: "Izquierda", ciudad: "Trujillo", disponible: true, profesional: false, bio: "Enganche zurdo y creativo.", logros: ["Goleador liga norte 2025"], videos: ["Tiro libre"] },
  { nombres: "Renato", apPaterno: "Paredes", apMaterno: "Gómez", nacionalidad: "Perú", edad: 25, posicion: "Delantero centro", estatura: 182, peso: 78, pierna: "Derecha", ciudad: "Arequipa", disponible: false, profesional: true, bio: "Nueve de área contundente.", logros: ["Botín de oro 2023"], videos: ["4 goles en un partido"] },
];

// Genera N códigos únicos y los inserta. Devuelve algunos de muestra.
export async function generarCodigosClub(cliente, cantidad = 1000) {
  const set = new Set();
  while (set.size < cantidad) set.add(generarCodigo());
  const codigos = [...set];
  // Inserción por lotes
  const LOTE = 200;
  for (let i = 0; i < codigos.length; i += LOTE) {
    const trozo = codigos.slice(i, i + LOTE);
    const valores = trozo.map((_, k) => `($${k + 1})`).join(",");
    await cliente.query(`INSERT INTO codigos_club (codigo) VALUES ${valores} ON CONFLICT DO NOTHING`, trozo);
  }
  return codigos;
}

export async function sembrar({ gestionarConexion = true } = {}) {
  const c = await pool.connect();
  try {
    console.log("Limpiando datos previos…");
    await c.query("TRUNCATE usuarios, clubes, codigos_club RESTART IDENTITY CASCADE");
    if (mongoose.connection.readyState === 0) await conectarMongo();
    await MediaJugador.deleteMany({});

    console.log("Generando 1000 códigos de club…");
    const codigos = await generarCodigosClub(c, 1000);

    console.log("Insertando jugadores demo (estadísticas en 0)…");
    const hash = await bcrypt.hash("demo1234", 10);
    for (const j of JUGADORES) {
      const nombre = [j.nombres, j.apPaterno, j.apMaterno].filter(Boolean).join(" ");
      const correo = nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z]/g, ".") + "@footsearch.pe";
      const u = await c.query(
        "INSERT INTO usuarios (correo, password_hash, tipo, nombre) VALUES ($1,$2,'jugador',$3) RETURNING id",
        [correo, hash, nombre]
      );
      const jr = await c.query(
        `INSERT INTO jugadores
           (usuario_id, nombres, apellido_paterno, apellido_materno, nacionalidad,
            fecha_nacimiento, posicion, estatura_cm, peso_kg, pierna, ciudad, disponible, profesional, bio, contacto)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id`,
        [u.rows[0].id, j.nombres, j.apPaterno, j.apMaterno, j.nacionalidad,
         fechaNac(j.edad), j.posicion, j.estatura, j.peso, j.pierna, j.ciudad, j.disponible, j.profesional, j.bio, correo]
      );
      const jugadorId = jr.rows[0].id;
      for (const t of j.logros) {
        await c.query("INSERT INTO logros (jugador_id, titulo) VALUES ($1,$2)", [jugadorId, t]);
      }
      await MediaJugador.create({ jugadorId, videos: j.videos.map((t) => ({ titulo: t, tipo: "highlight" })) });
    }

    // Cuenta demo de cazatalentos
    await c.query(
      "INSERT INTO usuarios (correo, password_hash, tipo, nombre) VALUES ($1,$2,'cazatalentos',$3)",
      ["scout@footsearch.pe", hash, "Scout Demo"]
    );

    console.log("\n✅ Seed completo.");
    console.log("   Cazatalentos demo:  scout@footsearch.pe / demo1234");
    console.log("   Jugadores demo (demo1234), p.ej.: diego.quispe@footsearch.pe");
    console.log("   Códigos de club generados: 1000 (de un solo uso)");
    console.log("   Ejemplos de código válido para registrar un club:");
    codigos.slice(0, 5).forEach((x) => console.log("     " + x));
    console.log("");
  } catch (e) {
    console.error("Error en seed:", e.message);
    throw e;
  } finally {
    c.release();
    if (gestionarConexion) { await pool.end(); await mongoose.disconnect(); }
  }
}

export async function sembrarSiVacio() {
  const r = await pool.query("SELECT COUNT(*)::int AS n FROM usuarios");
  if (r.rows[0].n > 0) {
    console.log("[seed] La base ya tiene datos; no se siembra (se preservan los existentes).");
    return false;
  }
  console.log("[seed] Base vacía: sembrando datos de prueba…");
  await sembrar({ gestionarConexion: false });
  return true;
}

const ejecutadoDirecto = process.argv[1] && process.argv[1].endsWith("seed.js");
if (ejecutadoDirecto) {
  sembrar().then(() => process.exit(0)).catch(() => process.exit(1));
}
