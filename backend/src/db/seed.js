import bcrypt from "bcryptjs";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "../config/postgres.js";
import { conectarMongo } from "../config/mongo.js";
import { MediaJugador } from "../models/MediaJugador.js";
import mongoose from "mongoose";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Genera un código de club complejo: FS-XXXX-XXXX-XXXX (sin caracteres ambiguos)
const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function generarCodigo() {
  const bloque = () => Array.from({ length: 4 },
    () => ALFABETO[crypto.randomInt(ALFABETO.length)]).join("");
  return `FS-${bloque()}-${bloque()}-${bloque()}`;
}

// Carga las 100 licencias fijas del archivo (las que se entregan por escrito)
function licenciasFijas() {
  try {
    const txt = fs.readFileSync(path.join(__dirname, "licencias.txt"), "utf8");
    return txt.split("\n").map((l) => l.trim()).filter(Boolean);
  } catch { return []; }
}

const fechaNac = (edad) => `${new Date().getFullYear() - edad}-06-15`;

// ---- Pocos jugadores demo (estadísticas en 0; se editan por endpoint admin) ----
const JUGADORES = [
  { correo: "diego@demo.pe",   nombres: "Diego",  apPaterno: "Quispe",   apMaterno: "Mamani", nacionalidad: "Perú", edad: 19, posicion: "Delantero centro",       estatura: 178, peso: 72, pierna: "Derecha",   ciudad: "Cusco",    disponible: true,  profesional: false, bio: "Delantero rápido con olfato de gol. Busca dar el salto a primera.", logros: ["Goleador Liga 2 sub-20"], videos: ["Hat-trick vs rival regional"] },
  { correo: "luis@demo.pe",    nombres: "Luis",   apPaterno: "Mendoza",  apMaterno: "Vargas", nacionalidad: "Perú", edad: 17, posicion: "Extremo izquierdo",       estatura: 170, peso: 64, pierna: "Derecha",   ciudad: "Arequipa", disponible: true,  profesional: false, bio: "Joven talento amateur que busca su primera oportunidad.",            logros: ["MVP juvenil 2025"],     videos: ["Regate y gol"] },
  { correo: "andres@demo.pe",  nombres: "Andrés", apPaterno: "Huamán",   apMaterno: "Soto",   nacionalidad: "Perú", edad: 21, posicion: "Portero",                 estatura: 190, peso: 82, pierna: "Derecha",   ciudad: "Cusco",    disponible: true,  profesional: true,  bio: "Portero ágil con buen juego de pies. Abierto a propuestas.",       logros: ["Valla menos vencida 2024"], videos: ["Triple atajada"] },
  { correo: "joaquin@demo.pe", nombres: "Joaquín",apPaterno: "Vega",     apMaterno: "Castro", nacionalidad: "Perú", edad: 18, posicion: "Mediocampista ofensivo",  estatura: 173, peso: 67, pierna: "Izquierda", ciudad: "Trujillo", disponible: true,  profesional: false, bio: "Enganche zurdo, creativo, busca club que apueste por jóvenes.",     logros: ["Goleador liga norte 2025"], videos: ["Tiro libre"] },
];

// ---- Clubes poco conocidos, ya creados, con su cuenta de acceso ----
const CLUBES = [
  { correo: "atletico.condores@demo.pe", nombre: "Atlético Cóndores FC", ciudad: "Huaraz", fundado: 2014, color: "#1F7A4D", iniciales: "ACF", descripcion: "Club de altura formador de talento ancashino." },
  { correo: "deportivo.manglar@demo.pe", nombre: "Deportivo Manglar", ciudad: "Tumbes", fundado: 2009, color: "#0E6E8C", iniciales: "DM", descripcion: "Cantera norteña con identidad ofensiva." },
  { correo: "union.amazonica@demo.pe", nombre: "Unión Amazónica", ciudad: "Iquitos", fundado: 2016, color: "#8C4A0E", iniciales: "UA", descripcion: "Fútbol de la selva con garra y velocidad." },
  { correo: "real.altiplano@demo.pe", nombre: "Real Altiplano", ciudad: "Puno", fundado: 2011, color: "#5413EC", iniciales: "RA", descripcion: "Resistencia y disciplina a 3800 msnm." },
];

export async function generarCodigosClub(cliente, cantidad = 1000) {
  const set = new Set();
  // Primero las 100 licencias fijas (las que se entregan por escrito)
  licenciasFijas().forEach((l) => set.add(l));
  // Luego completar con aleatorias hasta la cantidad pedida
  while (set.size < cantidad) set.add(generarCodigo());
  const codigos = [...set];
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

    const pass = "demo1234";
    const hash = await bcrypt.hash(pass, 10);

    // ---- Clubes (creados + cuenta de acceso, consumiendo un código) ----
    console.log("Insertando clubes demo…");
    const clubPorNombre = {};
    const licenciaPorClub = {};
    for (let i = 0; i < CLUBES.length; i++) {
      const cl = CLUBES[i];
      const codigo = codigos[i]; // consume un código del pool
      const clubRow = await c.query(
        `INSERT INTO clubes (codigo, nombre, ciudad, fundado, color, iniciales, descripcion)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
        [codigo, cl.nombre, cl.ciudad, cl.fundado, cl.color, cl.iniciales, cl.descripcion]
      );
      const clubId = clubRow.rows[0].id;
      clubPorNombre[cl.nombre] = clubId;
      licenciaPorClub[cl.nombre] = codigo;
      await c.query("UPDATE codigos_club SET usado=true, usado_por=$1, usado_en=now() WHERE codigo=$2", [clubId, codigo]);
      const u = await c.query(
        "INSERT INTO usuarios (correo, password_hash, tipo, nombre) VALUES ($1,$2,'club',$3) RETURNING id",
        [cl.correo, hash, cl.nombre]
      );
      await c.query("INSERT INTO cuentas_club (usuario_id, club_id) VALUES ($1,$2)", [u.rows[0].id, clubId]);
    }

    // ---- Jugadores (algunos asignados a los clubes demo) ----
    console.log("Insertando jugadores demo (estadísticas en 0)…");
    const asignacion = { "diego@demo.pe": "Atlético Cóndores FC", "andres@demo.pe": "Deportivo Manglar" };
    for (const j of JUGADORES) {
      const nombre = [j.nombres, j.apPaterno, j.apMaterno].filter(Boolean).join(" ");
      const u = await c.query(
        "INSERT INTO usuarios (correo, password_hash, tipo, nombre) VALUES ($1,$2,'jugador',$3) RETURNING id",
        [j.correo, hash, nombre]
      );
      const clubId = asignacion[j.correo] ? clubPorNombre[asignacion[j.correo]] : null;
      const jr = await c.query(
        `INSERT INTO jugadores
           (usuario_id, nombres, apellido_paterno, apellido_materno, nacionalidad,
            fecha_nacimiento, posicion, estatura_cm, peso_kg, pierna, ciudad, club_id, disponible, profesional, bio, contacto, celular)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING id`,
        [u.rows[0].id, j.nombres, j.apPaterno, j.apMaterno, j.nacionalidad,
         fechaNac(j.edad), j.posicion, j.estatura, j.peso, j.pierna, j.ciudad, clubId, j.disponible, j.profesional, j.bio, j.correo, j.celular || "+51 999 000 000"]
      );
      const jugadorId = jr.rows[0].id;
      for (const t of j.logros) await c.query("INSERT INTO logros (jugador_id, titulo) VALUES ($1,$2)", [jugadorId, t]);
      await MediaJugador.create({ jugadorId, videos: j.videos.map((t) => ({ titulo: t, tipo: "highlight" })) });
    }

    // ---- Un cazatalentos ----
    console.log("Insertando cazatalentos demo…");
    const cz = await c.query(
      "INSERT INTO usuarios (correo, password_hash, tipo, nombre) VALUES ($1,$2,'cazatalentos',$3) RETURNING id",
      ["scout@demo.pe", hash, "Ana Scout"]
    );
    await c.query("INSERT INTO cazatalentos (usuario_id, club_id) VALUES ($1,$2)", [cz.rows[0].id, clubPorNombre["Atlético Cóndores FC"]]);

    console.log("\n========================================");
    console.log("  SEED COMPLETO — usuarios de prueba");
    console.log("  (todos con la contraseña: demo1234)");
    console.log("========================================");
    console.log("\n  CLUBES (editables) — correo / licencia usada:");
    CLUBES.forEach((cl) => console.log(`    ${cl.correo}  →  ${cl.nombre}  (licencia: ${licenciaPorClub[cl.nombre]})`));
    console.log("\n  JUGADORES (editables):");
    JUGADORES.forEach((j) => console.log(`    ${j.correo}`));
    console.log("\n  CAZATALENTOS:");
    console.log("    scout@demo.pe");
    console.log("\n  Licencias LIBRES para registrar nuevos clubes (ejemplos):");
    codigos.slice(CLUBES.length, CLUBES.length + 6).forEach((x) => console.log("    " + x));
    const libres = await c.query("SELECT COUNT(*) FILTER (WHERE usado=false)::int n FROM codigos_club");
    console.log(`\n  Total de licencias libres: ${libres.rows[0].n} de 1000`);
    console.log("========================================\n");
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
  // Por defecto NO borra: solo siembra si la base está vacía (protege tus datos).
  // Con --reset (o npm run seed:reset) borra y vuelve a sembrar desde cero.
  const forzar = process.argv.includes("--reset");
  const accion = forzar
    ? sembrar()
    : sembrarSiVacio().then((sembro) => {
        if (!sembro) console.log("[seed] No se sembró nada. Usa 'npm run seed:reset' para reiniciar desde cero.");
      }).finally(async () => { await pool.end(); await mongoose.disconnect(); });
  accion.then(() => process.exit(0)).catch((e) => { console.error(e.message); process.exit(1); });
}
