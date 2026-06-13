import { useState, useEffect, useRef } from "react";
import { api } from "../services/api";
import { colorDe, iniciales } from "../components/Componentes";
import { CampoEditable, IconLapiz } from "../components/CampoEditable";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:4000/api").replace("/api", "");
function urlMedia(p) { return p ? (p.startsWith("http") ? p : API_BASE + p) : null; }

export default function MiClub({ verJugador }) {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const escudoRef = useRef(), portadaRef = useRef();

  async function cargar() {
    setCargando(true); setError("");
    try { setDatos(await api.miClub()); }
    catch (e) { setError(e.message); }
    finally { setCargando(false); }
  }
  useEffect(() => { cargar(); }, []);
  function flash(t) { setMsg(t); setTimeout(() => setMsg(""), 2500); }

  async function guardarCampo(campo, valor) {
    await api.editarMiClub({ [campo]: valor === "" ? null : valor });
    flash("Guardado."); await cargar();
  }
  async function subirImagen(campo, file) {
    if (!file) return;
    const fd = new FormData(); fd.append(campo, file);
    try { await api.subirImagenesClub(fd); flash("Imagen actualizada."); await cargar(); }
    catch (e) { setError(e.message); }
  }

  if (cargando) return <main className="contenedor perfil"><p style={{ color: "var(--gris)" }}>Cargando tu club...</p></main>;
  if (error && !datos) return <main className="contenedor perfil"><div className="aviso err">{error}</div></main>;

  const club = datos.club;
  const plantel = datos.plantel || [];
  const cupoMax = datos.cupoMax || 52;
  const pct = Math.round((plantel.length / cupoMax) * 100);
  const escudo = urlMedia(club.foto_perfil);
  const portada = urlMedia(club.foto_portada);

  return (
    <main className="contenedor perfil">
      {msg && <div className="toast-ok">{msg}</div>}
      {error && <div className="aviso err" style={{ marginBottom: 16 }}>{error}</div>}

      {/* Cabecera estilo boceto */}
      <div className="card club-cabecera">
        <div className="club-portada" style={portada ? { backgroundImage: `linear-gradient(180deg, rgba(22,24,29,.15), rgba(22,24,29,.6)), url(${portada})` } : {}}>
          <button className="btn-foto portada-btn" onClick={() => portadaRef.current.click()}><IconLapiz size={13} /> Portada</button>
          <input ref={portadaRef} type="file" accept="image/*" hidden onChange={(e) => subirImagen("foto_portada", e.target.files[0])} />
          <div className="club-cupo-badge">{plantel.length}/{cupoMax}</div>
        </div>
        <div className="club-escudo-wrap">
          {escudo
            ? <img className="club-escudo-img" src={escudo} alt="escudo" />
            : <div className="club-escudo-img" style={{ background: club.color || "#E2231A" }}>{club.iniciales}</div>}
          <button className="hp-avatar-edit" onClick={() => escudoRef.current.click()} title="Cambiar escudo"><IconLapiz size={14} /></button>
          <input ref={escudoRef} type="file" accept="image/*" hidden onChange={(e) => subirImagen("foto_perfil", e.target.files[0])} />
        </div>
        <div className="club-nombre-zona">
          <h1>{club.nombre}</h1>
          <div className="sub">{club.ciudad || "Ciudad"}{club.fundado ? ` · Fundado en ${club.fundado}` : ""} · ID {club.codigo}</div>
        </div>
      </div>

      <div className="perfil-grid">
        <div>
          <div className="card bloque">
            <h3>Datos del club</h3>
            <CampoEditable etiqueta="Nombre" valor={club.nombre} onGuardar={(v) => guardarCampo("nombre", v)} />
            <CampoEditable etiqueta="Ciudad" valor={club.ciudad} onGuardar={(v) => guardarCampo("ciudad", v)} />
            <CampoEditable etiqueta="Año de fundación" tipo="number" valor={club.fundado} onGuardar={(v) => guardarCampo("fundado", v ? Number(v) : null)} />
            <CampoEditable etiqueta="Iniciales del escudo" valor={club.iniciales} onGuardar={(v) => guardarCampo("iniciales", v)} />
            <CampoEditable etiqueta="Descripción" tipo="textarea" valor={club.descripcion} placeholder="Historia, valores, categorías..." onGuardar={(v) => guardarCampo("descripcion", v)} />
          </div>
        </div>

        <div>
          <div className="card bloque">
            <h3>Plantel · {plantel.length}/{cupoMax}</h3>
            <div className="cupo">
              <div className="cupo-barra"><div className="cupo-fill" style={{ width: pct + "%" }} /></div>
              <span className="cupo-txt">{cupoMax - plantel.length} cupos disponibles</span>
            </div>
            {plantel.length === 0 ? (
              <p style={{ color: "var(--gris)", marginTop: 14 }}>Aún no hay jugadores con tu club como club actual.</p>
            ) : (
              <div className="plantel" style={{ marginTop: 14 }}>
                {plantel.map((jx) => (
                  <div className="mini-jug" key={jx.id} onClick={() => verJugador(jx.id)}>
                    {urlMedia(jx.foto_perfil)
                      ? <img className="f" src={urlMedia(jx.foto_perfil)} alt="" style={{ objectFit: "cover" }} />
                      : <div className="f" style={{ background: colorDe(jx.nombre) }}>{iniciales(jx.nombre)}</div>}
                    <div>
                      <div className="mn">{jx.nombre}</div>
                      <div className="mp">{jx.posicion || "Sin posición"}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
