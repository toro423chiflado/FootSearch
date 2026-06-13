import { useState, useEffect, useCallback } from "react";
import { api } from "../services/api";
import { colorDe, iniciales } from "../components/Componentes";
import { IconEstrella } from "../components/Iconos";

const POSICIONES = [
  "Portero", "Lateral derecho", "Lateral izquierdo", "Defensa central",
  "Mediocampista defensivo", "Mediocampista central", "Mediocampista ofensivo",
  "Extremo derecho", "Extremo izquierdo", "Delantero centro",
];
const PIERNAS = ["Derecha", "Izquierda", "Ambas"];
const NACIONALIDADES = [
  "Perú", "Argentina", "Bolivia", "Brasil", "Chile", "Colombia", "Ecuador",
  "Paraguay", "Uruguay", "Venezuela", "México", "España", "Italia", "Otra",
];
const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:4000/api").replace("/api", "");
function urlMedia(p) { return p ? (p.startsWith("http") ? p : API_BASE + p) : null; }

export default function Buscar({ usuario, verJugador, verClub, favoritos, toggleFav, soloFavoritos = false }) {
  const [tab, setTab] = useState("jugadores");
  const [verFiltros, setVerFiltros] = useState(false);
  const [f, setF] = useState({
    q: "", pos: "", disp: "", nivel: "", pierna: "", nac: "",
    estMin: "", estMax: "", pesoMin: "", pesoMax: "", edadMin: "", edadMax: "",
    golesMin: "", asisMin: "", partidosMin: "", logrosMin: "",
  });
  const [qClub, setQClub] = useState("");
  const [ciudadClub, setCiudadClub] = useState("");
  const [jugadores, setJugadores] = useState([]);
  const [clubes, setClubes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const set = (k) => (e) => setF((prev) => ({ ...prev, [k]: e.target.value }));
  const puedeFav = usuario.tipo !== "jugador";
  const busquedaAvanzada = usuario.tipo !== "jugador"; // jugador = búsqueda simple

  const cargarJugadores = useCallback(async () => {
    setCargando(true); setError("");
    try {
      if (soloFavoritos) {
        const data = await api.favoritos();
        setJugadores(data.jugadores || []);
      } else {
        const params = {};
        if (f.q) params.q = f.q;
        if (f.pos) params.posicion = f.pos;
        if (f.disp) params.disponible = f.disp;
        if (busquedaAvanzada) {
          if (f.nivel) params.nivel = f.nivel;
          if (f.pierna) params.pierna = f.pierna;
          if (f.nac) params.nacionalidad = f.nac;
          if (f.estMin) params.estaturaMin = f.estMin;
          if (f.estMax) params.estaturaMax = f.estMax;
          if (f.pesoMin) params.pesoMin = f.pesoMin;
          if (f.pesoMax) params.pesoMax = f.pesoMax;
          if (f.edadMin) params.edadMin = f.edadMin;
          if (f.edadMax) params.edadMax = f.edadMax;
          if (f.golesMin) params.golesMin = f.golesMin;
          if (f.asisMin) params.asistenciasMin = f.asisMin;
          if (f.partidosMin) params.partidosMin = f.partidosMin;
          if (f.logrosMin) params.logrosMin = f.logrosMin;
        }
        const data = await api.jugadores(params);
        setJugadores(data.jugadores || []);
      }
    } catch (e) { setError(e.message); }
    finally { setCargando(false); }
  }, [f, soloFavoritos, busquedaAvanzada]);

  const cargarClubes = useCallback(async () => {
    setCargando(true); setError("");
    try {
      const params = {};
      if (qClub) params.q = qClub;
      if (ciudadClub) params.ciudad = ciudadClub;
      const data = await api.clubes(params);
      setClubes(data.clubes || []);
    } catch (e) { setError(e.message); }
    finally { setCargando(false); }
  }, [qClub, ciudadClub]);

  useEffect(() => {
    if (soloFavoritos || tab === "jugadores") { const t = setTimeout(cargarJugadores, 300); return () => clearTimeout(t); }
    else { const t = setTimeout(cargarClubes, 300); return () => clearTimeout(t); }
  }, [tab, cargarJugadores, cargarClubes, soloFavoritos]);

  function limpiar() {
    setF({ q: "", pos: "", disp: "", nivel: "", pierna: "", nac: "",
      estMin: "", estMax: "", pesoMin: "", pesoMax: "", edadMin: "", edadMax: "",
      golesMin: "", asisMin: "", partidosMin: "", logrosMin: "" });
  }

  function TarjetaJugador({ j }) {
    const portada = urlMedia(j.foto_portada);
    const foto = urlMedia(j.foto_perfil);
    const esFav = favoritos?.includes(j.id);
    return (
      <div className="jug-card" onClick={() => verJugador(j.id)}>
        <div className="jc-portada" style={portada ? { backgroundImage: `linear-gradient(180deg, rgba(22,24,29,.15), rgba(22,24,29,.85)), url(${portada})` } : {}}>
          {j.disponible && <span className="jc-badge-disp">Disponible</span>}
          {puedeFav && (
            <button className={"jc-fav" + (esFav ? " on" : "")} onClick={(e) => { e.stopPropagation(); toggleFav(j.id); }}>
              <IconEstrella size={16} />
            </button>
          )}
        </div>
        <div className="jc-cuerpo">
          {foto ? <img className="jc-foto" src={foto} alt="" /> : <div className="jc-foto" style={{ background: colorDe(j.nombre) }}>{iniciales(j.nombre)}</div>}
          <div className="jc-nombre">{j.nombre}</div>
          <div className="jc-pos">{j.posicion || "Sin posición"}</div>
          <div className="jc-meta">
            {j.edad ? `${j.edad} años` : ""}{j.estatura_cm ? ` · ${j.estatura_cm}cm` : ""}{j.nacionalidad ? ` · ${j.nacionalidad}` : ""}
          </div>
          {j.club_nombre && (
            <button className="jc-club" onClick={(e) => { e.stopPropagation(); verClub && verClub(j.club_id); }}>
              {j.club_nombre}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <main className="contenedor buscar">
      <div className="buscar-head">
        <h1>{soloFavoritos ? "Mis favoritos" : "Explorar talento"}</h1>
        {!soloFavoritos && (
          <div className="tabs">
            <button className={"tab" + (tab === "jugadores" ? " act" : "")} onClick={() => setTab("jugadores")}>Jugadores</button>
            <button className={"tab" + (tab === "clubes" ? " act" : "")} onClick={() => setTab("clubes")}>Clubes</button>
          </div>
        )}
      </div>

      {/* ---------- JUGADORES ---------- */}
      {(soloFavoritos || tab === "jugadores") && (
        <>
          {!soloFavoritos && (
            <div className="filtros">
              {/* Fila básica: siempre visible */}
              <div className="filtros-basicos">
                <input className="busca-input" placeholder="Buscar por nombre..." value={f.q} onChange={set("q")} />
                <select value={f.pos} onChange={set("pos")}>
                  <option value="">Cualquier posición</option>
                  {POSICIONES.map((p) => <option key={p}>{p}</option>)}
                </select>
                <select value={f.disp} onChange={set("disp")}>
                  <option value="">Disponibilidad</option>
                  <option value="si">Disponible</option>
                  <option value="no">No disponible</option>
                </select>
                {busquedaAvanzada && (
                  <button className="btn btn-fantasma btn-sm" onClick={() => setVerFiltros(!verFiltros)}>
                    {verFiltros ? "Menos filtros" : "Más filtros"}
                  </button>
                )}
              </div>

              {/* Filtros avanzados: solo scouts/clubes, en grid ordenado debajo */}
              {busquedaAvanzada && verFiltros && (
                <div className="filtros-avanzados">
                  <div className="fa-grupo">
                    <label>Nivel</label>
                    <select value={f.nivel} onChange={set("nivel")}>
                      <option value="">Cualquiera</option>
                      <option value="pro">Profesional</option>
                      <option value="ama">Amateur</option>
                    </select>
                  </div>
                  <div className="fa-grupo">
                    <label>Pierna</label>
                    <select value={f.pierna} onChange={set("pierna")}>
                      <option value="">Cualquiera</option>
                      {PIERNAS.map((p) => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="fa-grupo">
                    <label>Nacionalidad</label>
                    <select value={f.nac} onChange={set("nac")}>
                      <option value="">Cualquiera</option>
                      {NACIONALIDADES.map((n) => <option key={n}>{n}</option>)}
                    </select>
                  </div>
                  <div className="fa-grupo">
                    <label>Estatura (cm)</label>
                    <div className="rango"><input type="number" placeholder="mín" value={f.estMin} onChange={set("estMin")} /><span>—</span><input type="number" placeholder="máx" value={f.estMax} onChange={set("estMax")} /></div>
                  </div>
                  <div className="fa-grupo">
                    <label>Peso (kg)</label>
                    <div className="rango"><input type="number" placeholder="mín" value={f.pesoMin} onChange={set("pesoMin")} /><span>—</span><input type="number" placeholder="máx" value={f.pesoMax} onChange={set("pesoMax")} /></div>
                  </div>
                  <div className="fa-grupo">
                    <label>Edad</label>
                    <div className="rango"><input type="number" placeholder="mín" value={f.edadMin} onChange={set("edadMin")} /><span>—</span><input type="number" placeholder="máx" value={f.edadMax} onChange={set("edadMax")} /></div>
                  </div>
                  <div className="fa-grupo">
                    <label>Goles (mínimo)</label>
                    <input type="number" placeholder="0" value={f.golesMin} onChange={set("golesMin")} />
                  </div>
                  <div className="fa-grupo">
                    <label>Asistencias (mínimo)</label>
                    <input type="number" placeholder="0" value={f.asisMin} onChange={set("asisMin")} />
                  </div>
                  <div className="fa-grupo">
                    <label>Partidos (mínimo)</label>
                    <input type="number" placeholder="0" value={f.partidosMin} onChange={set("partidosMin")} />
                  </div>
                  <div className="fa-grupo">
                    <label>Logros (mínimo)</label>
                    <input type="number" placeholder="0" value={f.logrosMin} onChange={set("logrosMin")} />
                  </div>
                  <div className="fa-limpiar"><button className="link-sm" onClick={limpiar}>Limpiar filtros</button></div>
                </div>
              )}
            </div>
          )}

          {error && <div className="aviso err">{error}</div>}
          {cargando ? <p style={{ color: "var(--gris)" }}>Cargando...</p>
            : jugadores.length === 0 ? <p style={{ color: "var(--gris)" }}>No se encontraron jugadores con esos filtros.</p>
            : (
              <>
                <div className="resultados-info">{jugadores.length} jugador(es)</div>
                <div className="grid-jug">{jugadores.map((j) => <TarjetaJugador key={j.id} j={j} />)}</div>
              </>
            )}
        </>
      )}

      {/* ---------- CLUBES ---------- */}
      {!soloFavoritos && tab === "clubes" && (
        <>
          <div className="filtros">
            <div className="filtros-basicos">
              <input className="busca-input" placeholder="Buscar club por nombre..." value={qClub} onChange={(e) => setQClub(e.target.value)} />
              <input className="filtro-ciudad" placeholder="Filtrar por ciudad" value={ciudadClub} onChange={(e) => setCiudadClub(e.target.value)} />
            </div>
          </div>
          {error && <div className="aviso err">{error}</div>}
          {cargando ? <p style={{ color: "var(--gris)" }}>Cargando...</p>
            : clubes.length === 0 ? <p style={{ color: "var(--gris)" }}>No se encontraron clubes.</p>
            : (
              <>
                <div className="resultados-info">{clubes.length} club(es)</div>
                <div className="grid-jug">
                  {clubes.map((c) => {
                    const portada = urlMedia(c.foto_portada);
                    const escudo = urlMedia(c.foto_perfil);
                    return (
                      <div className="jug-card" key={c.id} onClick={() => verClub && verClub(c.id)}>
                        <div className="jc-portada" style={portada ? { backgroundImage: `linear-gradient(180deg, rgba(22,24,29,.15), rgba(22,24,29,.85)), url(${portada})` } : {}} />
                        <div className="jc-cuerpo">
                          {escudo ? <img className="jc-foto redondo" src={escudo} alt="" /> : <div className="jc-foto redondo" style={{ background: c.color || "#E2231A" }}>{c.iniciales}</div>}
                          <div className="jc-nombre">{c.nombre}</div>
                          <div className="jc-pos">{c.ciudad || "Ciudad"}</div>
                          <div className="jc-meta">{c.jugadores ?? 0} jugador(es){c.fundado ? ` · ${c.fundado}` : ""}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
        </>
      )}
    </main>
  );
}
