import { useState, useEffect, useRef } from "react";
import { api } from "../services/api";
import { colorDe, iniciales } from "../components/Componentes";
import { IconPlay, IconTrofeo } from "../components/Iconos";

const POSICIONES = [
  "Portero", "Lateral derecho", "Lateral izquierdo", "Defensa central",
  "Mediocampista defensivo", "Mediocampista central", "Mediocampista ofensivo",
  "Extremo derecho", "Extremo izquierdo", "Delantero centro",
];
const PIERNAS = ["Derecha", "Izquierda", "Ambas"];
const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:4000/api").replace("/api", "");

function urlMedia(p) { return p ? (p.startsWith("http") ? p : API_BASE + p) : null; }
function edadDesde(fecha) {
  if (!fecha) return null;
  const hoy = new Date(), nac = new Date(fecha);
  let e = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) e--;
  return e;
}

export default function MiPerfilJugador({ volver, onActualizar }) {
  const [me, setMe] = useState(null);
  const [datos, setDatos] = useState(null);     // detalle (videos, logros)
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [f, setF] = useState({});
  const [tituloVideo, setTituloVideo] = useState("");
  const fotoRef = useRef(), portadaRef = useRef(), videoRef = useRef();

  async function cargar() {
    setCargando(true); setError("");
    try {
      const meData = await api.me();
      setMe(meData);
      const j = meData.jugador;
      setF({
        nombres: j.nombres || "", apellidoPaterno: j.apellido_paterno || "",
        apellidoMaterno: j.apellido_materno || "", nacionalidad: j.nacionalidad || "",
        fechaNacimiento: j.fecha_nacimiento ? j.fecha_nacimiento.slice(0, 10) : "",
        posicion: j.posicion || "", pierna: j.pierna || "",
        estatura: j.estatura_cm || "", peso: j.peso_kg || "",
        ciudad: j.ciudad || "", bio: j.bio || "",
        disponible: j.disponible, profesional: j.profesional,
      });
      const det = await api.jugador(j.id);
      setDatos(det);
    } catch (e) { setError(e.message); }
    finally { setCargando(false); }
  }
  useEffect(() => { cargar(); }, []);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const toggle = (k) => () => setF({ ...f, [k]: !f[k] });

  async function guardar() {
    setGuardando(true); setMsg(""); setError("");
    try {
      await api.actualizarMiPerfil({
        nombres: f.nombres, apellidoPaterno: f.apellidoPaterno, apellidoMaterno: f.apellidoMaterno,
        nacionalidad: f.nacionalidad, fechaNacimiento: f.fechaNacimiento || null,
        posicion: f.posicion, pierna: f.pierna,
        estatura: f.estatura ? Number(f.estatura) : null,
        peso: f.peso ? Number(f.peso) : null,
        ciudad: f.ciudad, bio: f.bio,
        disponible: f.disponible, profesional: f.profesional,
      });
      setMsg("Perfil actualizado correctamente.");
      onActualizar && onActualizar();
      cargar();
    } catch (e) { setError(e.message); }
    finally { setGuardando(false); }
  }

  async function subirImagen(campo, file) {
    if (!file) return;
    setMsg(""); setError("");
    const fd = new FormData();
    fd.append(campo, file);
    try {
      await api.subirImagenesJugador(fd);
      setMsg("Imagen actualizada.");
      onActualizar && onActualizar();
      cargar();
    } catch (e) { setError(e.message); }
  }

  async function subirVideo(file) {
    if (!file) return;
    setMsg(""); setError("");
    const fd = new FormData();
    fd.append("video", file);
    fd.append("titulo", tituloVideo || file.name);
    try {
      await api.subirVideo(fd);
      setMsg("Video subido.");
      setTituloVideo("");
      cargar();
    } catch (e) { setError(e.message); }
  }

  async function borrarVideo(videoId) {
    try { await api.eliminarVideo(videoId); cargar(); }
    catch (e) { setError(e.message); }
  }

  if (cargando) return <main className="contenedor perfil"><p style={{ color: "var(--gris)" }}>Cargando tu perfil...</p></main>;
  if (error && !me) return <main className="contenedor perfil"><div className="aviso err">{error}</div></main>;

  const j = me.jugador;
  const videos = datos?.videos || [];
  const logros = datos?.logros || [];
  const edad = edadDesde(f.fechaNacimiento);
  const fotoPerfil = urlMedia(j.foto_perfil);
  const fotoPortada = urlMedia(j.foto_portada);

  return (
    <main className="contenedor perfil">
      <button className="perfil-volver" onClick={volver}>&larr; Volver</button>

      {msg && <div className="aviso" style={{ marginBottom: 16 }}>{msg}</div>}
      {error && <div className="aviso err" style={{ marginBottom: 16 }}>{error}</div>}

      {/* Portada + foto de perfil editables */}
      <div className="card perfil-cabecera">
        <div className="portada" style={fotoPortada ? { backgroundImage: `url(${fotoPortada})` } : {}}>
          <button className="btn-foto portada-btn" onClick={() => portadaRef.current.click()}>Cambiar portada</button>
          <input ref={portadaRef} type="file" accept="image/*" hidden
            onChange={(e) => subirImagen("foto_portada", e.target.files[0])} />
        </div>
        <div className="cabecera-info">
          <div className="avatar-grande-wrap">
            {fotoPerfil
              ? <img className="avatar-grande" src={fotoPerfil} alt="perfil" />
              : <div className="avatar-grande" style={{ background: colorDe(j.nombres || "J") }}>{iniciales((f.nombres || "") + " " + (f.apellidoPaterno || ""))}</div>}
            <button className="btn-foto avatar-btn" onClick={() => fotoRef.current.click()}>Editar</button>
            <input ref={fotoRef} type="file" accept="image/*" hidden
              onChange={(e) => subirImagen("foto_perfil", e.target.files[0])} />
          </div>
          <div className="cabecera-datos">
            <h1>{[f.nombres, f.apellidoPaterno, f.apellidoMaterno].filter(Boolean).join(" ") || "Tu nombre"}</h1>
            <div className="sub">{f.posicion || "Posicion"}{f.nacionalidad ? ` · ${f.nacionalidad}` : ""}{edad !== null ? ` · ${edad} años` : ""}</div>
            <div className="toggle-disp">
              <span>Disponibilidad:</span>
              <button className={"chip-toggle " + (f.disponible ? "on" : "")} onClick={toggle("disponible")}>
                {f.disponible ? "● Disponible para pruebas" : "○ No disponible"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="perfil-grid">
        {/* Edición de datos */}
        <div>
          <div className="card bloque">
            <h3>Datos personales</h3>
            <div className="fila">
              <div className="campo"><label>Nombres</label><input value={f.nombres} onChange={set("nombres")} /></div>
              <div className="campo"><label>Ap. paterno</label><input value={f.apellidoPaterno} onChange={set("apellidoPaterno")} /></div>
            </div>
            <div className="fila">
              <div className="campo"><label>Ap. materno</label><input value={f.apellidoMaterno} onChange={set("apellidoMaterno")} /></div>
              <div className="campo"><label>Nacionalidad</label><input value={f.nacionalidad} onChange={set("nacionalidad")} /></div>
            </div>
            <div className="campo">
              <label>Fecha de nacimiento</label>
              <div className="fecha-edad">
                <input type="date" value={f.fechaNacimiento} onChange={set("fechaNacimiento")} max={new Date().toISOString().slice(0,10)} />
                {edad !== null && <div className="edad-pill"><span className="edad-num">{edad}</span><span className="edad-lbl">años</span></div>}
              </div>
            </div>
            <div className="campo"><label>Ciudad</label><input value={f.ciudad} onChange={set("ciudad")} /></div>
          </div>

          <div className="card bloque">
            <h3>Datos físicos y deportivos</h3>
            <div className="fila">
              <div className="campo"><label>Estatura (cm)</label><input type="number" value={f.estatura} onChange={set("estatura")} /></div>
              <div className="campo"><label>Peso (kg)</label><input type="number" value={f.peso} onChange={set("peso")} /></div>
            </div>
            <div className="fila">
              <div className="campo">
                <label>Posicion</label>
                <select value={f.posicion} onChange={set("posicion")}>
                  <option value="">Selecciona...</option>
                  {POSICIONES.map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div className="campo">
                <label>Pierna</label>
                <select value={f.pierna} onChange={set("pierna")}>
                  <option value="">Selecciona...</option>
                  {PIERNAS.map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className="campo">
              <label>Nivel</label>
              <button className={"chip-toggle " + (f.profesional ? "on" : "")} onClick={toggle("profesional")}>
                {f.profesional ? "Profesional" : "Amateur"}
              </button>
            </div>
            <div className="campo"><label>Sobre mi</label><textarea rows={3} value={f.bio} onChange={set("bio")} /></div>
          </div>

          <button className="btn btn-rojo btn-bloque" onClick={guardar} disabled={guardando}>
            {guardando ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>

        {/* Estadísticas (solo lectura) + multimedia */}
        <div>
          <div className="card bloque">
            <h3>Estadísticas</h3>
            <div className="stats-grid">
              <div className="stat-box"><div className="n">{j.partidos}</div><div className="l">Partidos</div></div>
              <div className="stat-box"><div className="n">{j.goles}</div><div className="l">Goles</div></div>
              <div className="stat-box"><div className="n">{j.asistencias}</div><div className="l">Asistencias</div></div>
              <div className="stat-box"><div className="n">{j.minutos}</div><div className="l">Minutos</div></div>
            </div>
            <div className="ayuda" style={{ marginTop: 12 }}>Las estadísticas las gestiona FootSearch y no se editan desde aquí.</div>
          </div>

          <div className="card bloque">
            <h3>Videos / multimedia</h3>
            <div className="subir-video">
              <input type="text" placeholder="Título del video" value={tituloVideo} onChange={(e) => setTituloVideo(e.target.value)} />
              <button className="btn btn-fantasma btn-sm" onClick={() => videoRef.current.click()}>Subir video</button>
              <input ref={videoRef} type="file" accept="video/*" hidden onChange={(e) => subirVideo(e.target.files[0])} />
            </div>
            {videos.length === 0 ? (
              <p style={{ color: "var(--gris)", fontSize: 14, marginTop: 10 }}>Aún no has subido videos.</p>
            ) : videos.map((v) => (
              <div className="video-item" key={v._id}>
                <div className="play"><IconPlay /></div>
                <span style={{ flex: 1 }}>{v.titulo}</span>
                {v.url && <a className="ver-link" href={urlMedia(v.url)} target="_blank" rel="noreferrer">ver</a>}
                <button className="borrar-x" onClick={() => borrarVideo(v._id)}>✕</button>
              </div>
            ))}
          </div>

          <div className="card bloque">
            <h3>Logros</h3>
            {logros.length === 0 ? <p style={{ color: "var(--gris)", fontSize: 14 }}>Sin logros aún.</p>
              : logros.map((l, i) => <div className="logro-item" key={i}><IconTrofeo size={14} /> {l}</div>)}
          </div>
        </div>
      </div>
    </main>
  );
}
