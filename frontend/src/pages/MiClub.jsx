import { useState, useEffect, useRef } from "react";
import { api } from "../services/api";
import { colorDe, iniciales } from "../components/Componentes";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:4000/api").replace("/api", "");
function urlMedia(p) { return p ? (p.startsWith("http") ? p : API_BASE + p) : null; }

export default function MiClub({ verJugador }) {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [editando, setEditando] = useState(false);
  const [f, setF] = useState({});
  const [guardando, setGuardando] = useState(false);
  const escudoRef = useRef(), portadaRef = useRef();

  async function cargar() {
    setCargando(true); setError("");
    try {
      const data = await api.miClub();
      setDatos(data);
      const c = data.club;
      setF({
        nombre: c.nombre || "", ciudad: c.ciudad || "",
        fundado: c.fundado || "", color: c.color || "#E2231A",
        iniciales: c.iniciales || "", descripcion: c.descripcion || "",
      });
    } catch (e) { setError(e.message); }
    finally { setCargando(false); }
  }
  useEffect(() => { cargar(); }, []);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function guardar() {
    setGuardando(true); setMsg(""); setError("");
    try {
      await api.editarMiClub({
        nombre: f.nombre, ciudad: f.ciudad,
        fundado: f.fundado ? Number(f.fundado) : null,
        color: f.color, iniciales: f.iniciales, descripcion: f.descripcion,
      });
      setMsg("Club actualizado.");
      setEditando(false);
      cargar();
    } catch (e) { setError(e.message); }
    finally { setGuardando(false); }
  }

  async function subirImagen(campo, file) {
    if (!file) return;
    setMsg(""); setError("");
    const fd = new FormData();
    fd.append(campo, file);
    try { await api.subirImagenesClub(fd); setMsg("Imagen actualizada."); cargar(); }
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
      {msg && <div className="aviso" style={{ marginBottom: 16 }}>{msg}</div>}
      {error && <div className="aviso err" style={{ marginBottom: 16 }}>{error}</div>}

      {/* Cabecera estilo boceto: portada de fondo, escudo centrado, nombre, X/52 */}
      <div className="card club-cabecera">
        <div className="club-portada" style={portada ? { backgroundImage: `url(${portada})` } : {}}>
          <button className="btn-foto portada-btn" onClick={() => portadaRef.current.click()}>Cambiar portada</button>
          <input ref={portadaRef} type="file" accept="image/*" hidden onChange={(e) => subirImagen("foto_portada", e.target.files[0])} />
          <div className="club-cupo-badge">{plantel.length}/{cupoMax}</div>
        </div>
        <div className="club-escudo-wrap">
          {escudo
            ? <img className="club-escudo-img" src={escudo} alt="escudo" />
            : <div className="club-escudo-img" style={{ background: club.color || "#E2231A" }}>{club.iniciales}</div>}
          <button className="btn-foto escudo-btn" onClick={() => escudoRef.current.click()}>Editar escudo</button>
          <input ref={escudoRef} type="file" accept="image/*" hidden onChange={(e) => subirImagen("foto_perfil", e.target.files[0])} />
        </div>
        <div className="club-nombre-zona">
          <h1>{club.nombre}</h1>
          <div className="sub">{club.ciudad || "Ciudad"}{club.fundado ? ` · Fundado en ${club.fundado}` : ""} · ID {club.codigo}</div>
        </div>
        <button className="btn btn-fantasma btn-sm club-editar-btn" onClick={() => setEditando(!editando)}>
          {editando ? "Cancelar" : "Editar datos"}
        </button>
      </div>

      {/* Formulario de edición */}
      {editando && (
        <div className="card bloque">
          <h3>Editar datos del club</h3>
          <div className="fila">
            <div className="campo"><label>Nombre</label><input value={f.nombre} onChange={set("nombre")} /></div>
            <div className="campo"><label>Ciudad</label><input value={f.ciudad} onChange={set("ciudad")} /></div>
          </div>
          <div className="fila">
            <div className="campo"><label>Año de fundación</label><input type="number" value={f.fundado} onChange={set("fundado")} /></div>
            <div className="campo"><label>Iniciales (escudo)</label><input maxLength={4} value={f.iniciales} onChange={set("iniciales")} /></div>
          </div>
          <div className="campo">
            <label>Color del club</label>
            <input type="color" value={f.color} onChange={set("color")} style={{ height: 44, padding: 4 }} />
          </div>
          <div className="campo"><label>Descripción</label><textarea rows={3} value={f.descripcion} onChange={set("descripcion")} placeholder="Historia, valores, categorías..." /></div>
          <button className="btn btn-rojo btn-bloque" onClick={guardar} disabled={guardando}>
            {guardando ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      )}

      {club.descripcion && !editando && (
        <div className="card bloque"><h3>Sobre el club</h3><p style={{ color: "var(--gris-claro)", fontSize: 15 }}>{club.descripcion}</p></div>
      )}

      {/* Plantel (cupo X/52) */}
      <div className="card bloque">
        <h3>Plantel · {plantel.length}/{cupoMax}</h3>
        <div className="cupo">
          <div className="cupo-barra"><div className="cupo-fill" style={{ width: pct + "%" }} /></div>
          <span className="cupo-txt">{cupoMax - plantel.length} cupos disponibles</span>
        </div>
        {plantel.length === 0 ? (
          <p style={{ color: "var(--gris)", marginTop: 14 }}>Aún no hay jugadores que tengan tu club como club actual.</p>
        ) : (
          <div className="plantel" style={{ marginTop: 14 }}>
            {plantel.map((j) => (
              <div className="mini-jug" key={j.id} onClick={() => verJugador(j.id)}>
                {urlMedia(j.foto_perfil)
                  ? <img className="f" src={urlMedia(j.foto_perfil)} alt="" style={{ objectFit: "cover" }} />
                  : <div className="f" style={{ background: colorDe(j.nombre) }}>{iniciales(j.nombre)}</div>}
                <div>
                  <div className="mn">{j.nombre}</div>
                  <div className="mp">{j.posicion || "Sin posicion"}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
