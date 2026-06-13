import { useState, useEffect, useRef } from "react";
import { api } from "../services/api";
import { colorDe, iniciales } from "../components/Componentes";
import { IconPlay, IconTrofeo } from "../components/Iconos";
import { CampoEditable, IconLapiz } from "../components/CampoEditable";

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
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [tituloVideo, setTituloVideo] = useState("");
  const fotoRef = useRef(), portadaRef = useRef(), videoRef = useRef();

  async function cargar() {
    setCargando(true); setError("");
    try {
      const meData = await api.me();
      setMe(meData);
      const det = await api.jugador(meData.jugador.id);
      setDatos(det);
    } catch (e) { setError(e.message); }
    finally { setCargando(false); }
  }
  useEffect(() => { cargar(); }, []);

  function flash(t) { setMsg(t); setTimeout(() => setMsg(""), 2500); }

  async function guardarCampo(campo, valor) {
    await api.actualizarMiPerfil({ [campo]: valor === "" ? null : valor });
    flash("Guardado.");
    onActualizar && onActualizar();
    await cargar();
  }
  async function toggleDisponible() {
    await api.actualizarMiPerfil({ disponible: !me.jugador.disponible });
    onActualizar && onActualizar();
    await cargar();
  }
  async function toggleNivel() {
    await api.actualizarMiPerfil({ profesional: !me.jugador.profesional });
    await cargar();
  }
  async function subirImagen(campo, file) {
    if (!file) return;
    const fd = new FormData(); fd.append(campo, file);
    try { await api.subirImagenesJugador(fd); flash("Imagen actualizada."); onActualizar && onActualizar(); await cargar(); }
    catch (e) { setError(e.message); }
  }
  async function subirVideo(file) {
    if (!file) return;
    const fd = new FormData(); fd.append("video", file); fd.append("titulo", tituloVideo || file.name);
    try { await api.subirVideo(fd); flash("Video subido."); setTituloVideo(""); await cargar(); }
    catch (e) { setError(e.message); }
  }
  async function borrarVideo(id) { try { await api.eliminarVideo(id); await cargar(); } catch (e) { setError(e.message); } }

  if (cargando) return <main className="contenedor perfil"><p style={{ color: "var(--gris)" }}>Cargando tu perfil...</p></main>;
  if (error && !me) return <main className="contenedor perfil"><div className="aviso err">{error}</div></main>;

  const j = me.jugador;
  const videos = datos?.videos || [];
  const logros = datos?.logros || [];
  const edad = edadDesde(j.fecha_nacimiento);
  const fotoPerfil = urlMedia(j.foto_perfil);
  const fotoPortada = urlMedia(j.foto_portada);
  const nombreCompleto = [j.nombres, j.apellido_paterno, j.apellido_materno].filter(Boolean).join(" ");

  return (
    <main className="contenedor perfil">
      <button className="perfil-volver" onClick={volver}>&larr; Volver</button>
      {msg && <div className="toast-ok">{msg}</div>}
      {error && <div className="aviso err" style={{ marginBottom: 16 }}>{error}</div>}

      {/* Cabecera atractiva */}
      <div className="card hero-perfil">
        <div className="hp-portada" style={fotoPortada ? { backgroundImage: `linear-gradient(180deg, rgba(22,24,29,.1), rgba(22,24,29,.85)), url(${fotoPortada})` } : {}}>
          <button className="btn-foto portada-btn" onClick={() => portadaRef.current.click()}><IconLapiz size={13} /> Portada</button>
          <input ref={portadaRef} type="file" accept="image/*" hidden onChange={(e) => subirImagen("foto_portada", e.target.files[0])} />
        </div>
        <div className="hp-cuerpo">
          <div className="hp-avatar-wrap">
            {fotoPerfil
              ? <img className="hp-avatar" src={fotoPerfil} alt="perfil" />
              : <div className="hp-avatar" style={{ background: colorDe(nombreCompleto) }}>{iniciales(nombreCompleto)}</div>}
            <button className="hp-avatar-edit" onClick={() => fotoRef.current.click()} title="Cambiar foto"><IconLapiz size={14} /></button>
            <input ref={fotoRef} type="file" accept="image/*" hidden onChange={(e) => subirImagen("foto_perfil", e.target.files[0])} />
          </div>
          <div className="hp-info">
            <h1>{nombreCompleto || "Tu nombre"}</h1>
            <div className="hp-sub">{j.posicion || "Posición"}{j.nacionalidad ? ` · ${j.nacionalidad}` : ""}{j.ciudad ? ` · ${j.ciudad}` : ""}</div>
            <div className="hp-chips">
              {edad !== null && <span className="hp-chip"><b>{edad}</b> años</span>}
              {j.estatura_cm && <span className="hp-chip"><b>{j.estatura_cm}</b> cm</span>}
              {j.peso_kg && <span className="hp-chip"><b>{j.peso_kg}</b> kg</span>}
              {j.pierna && <span className="hp-chip">{j.pierna}</span>}
            </div>
          </div>
          <div className="hp-estado">
            <button className={"chip-toggle " + (j.disponible ? "on" : "")} onClick={toggleDisponible}>
              {j.disponible ? "● Disponible" : "○ No disponible"}
            </button>
            <button className={"chip-toggle " + (j.profesional ? "on-dorado" : "")} onClick={toggleNivel}>
              {j.profesional ? "Profesional" : "Amateur"}
            </button>
          </div>
        </div>
      </div>

      <div className="perfil-grid">
        <div>
          <div className="card bloque">
            <h3>Datos personales</h3>
            <CampoEditable etiqueta="Nombres" valor={j.nombres} onGuardar={(v) => guardarCampo("nombres", v)} />
            <CampoEditable etiqueta="Apellido paterno" valor={j.apellido_paterno} onGuardar={(v) => guardarCampo("apellidoPaterno", v)} />
            <CampoEditable etiqueta="Apellido materno" valor={j.apellido_materno} onGuardar={(v) => guardarCampo("apellidoMaterno", v)} />
            <CampoEditable etiqueta="Nacionalidad" valor={j.nacionalidad} onGuardar={(v) => guardarCampo("nacionalidad", v)} />
            <CampoEditable etiqueta="Fecha de nacimiento" tipo="date" valor={j.fecha_nacimiento ? j.fecha_nacimiento.slice(0,10) : ""} onGuardar={(v) => guardarCampo("fechaNacimiento", v)} />
            <CampoEditable etiqueta="Ciudad" valor={j.ciudad} onGuardar={(v) => guardarCampo("ciudad", v)} />
          </div>

          <div className="card bloque">
            <h3>Datos físicos y deportivos</h3>
            <CampoEditable etiqueta="Estatura" tipo="number" sufijo=" cm" valor={j.estatura_cm} onGuardar={(v) => guardarCampo("estatura", v ? Number(v) : null)} />
            <CampoEditable etiqueta="Peso" tipo="number" sufijo=" kg" valor={j.peso_kg} onGuardar={(v) => guardarCampo("peso", v ? Number(v) : null)} />
            <CampoEditable etiqueta="Posición" tipo="select" opciones={POSICIONES} valor={j.posicion} onGuardar={(v) => guardarCampo("posicion", v)} />
            <CampoEditable etiqueta="Pierna dominante" tipo="select" opciones={PIERNAS} valor={j.pierna} onGuardar={(v) => guardarCampo("pierna", v)} />
            <CampoEditable etiqueta="Sobre mí (descripción)" tipo="textarea" valor={j.bio} placeholder="Cuéntale a los scouts cómo juegas..." onGuardar={(v) => guardarCampo("bio", v)} />
          </div>
        </div>

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
              <button className="btn btn-fantasma btn-sm" onClick={() => videoRef.current.click()}>Subir</button>
              <input ref={videoRef} type="file" accept="video/*" hidden onChange={(e) => subirVideo(e.target.files[0])} />
            </div>
            {videos.length === 0 ? <p style={{ color: "var(--gris)", fontSize: 14, marginTop: 10 }}>Aún no has subido videos.</p>
              : videos.map((v) => (
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
