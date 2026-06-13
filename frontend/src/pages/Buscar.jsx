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
const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:4000/api").replace("/api", "");
function urlMedia(p) { return p ? (p.startsWith("http") ? p : API_BASE + p) : null; }

export default function Buscar({ usuario, verJugador, verClub, favoritos, toggleFav, soloFavoritos = false }) {
  const [tab, setTab] = useState("jugadores");
  const [verFiltros, setVerFiltros] = useState(false);
  // filtros jugadores
  const [q, setQ] = useState("");
  const [pos, setPos] = useState("");
  const [disp, setDisp] = useState("");
  const [nivel, setNivel] = useState("");
  const [pierna, setPierna] = useState("");
  const [nac, setNac] = useState("");
  const [estMin, setEstMin] = useState("");
  const [estMax, setEstMax] = useState("");
  const [pesoMin, setPesoMin] = useState("");
  const [pesoMax, setPesoMax] = useState("");
  const [edadMin, setEdadMin] = useState("");
  const [edadMax, setEdadMax] = useState("");
  // filtros clubes
  const [qClub, setQClub] = useState("");
  const [ciudadClub, setCiudadClub] = useState("");

  const [jugadores, setJugadores] = useState([]);
  const [clubes, setClubes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const puedeFav = usuario.tipo !== "jugador";
  const busquedaAvanzada = usuario.tipo !== "jugador"; // jugador ve búsqueda simple

  const cargarJugadores = useCallback(async () => {
    setCargando(true); setError("");
    try {
      if (soloFavoritos) {
        const data = await api.favoritos();
        setJugadores(data.jugadores || []);
      } else {
        const params = {};
        if (q) params.q = q;
        if (pos) params.posicion = pos;
        if (disp) params.disponible = disp;
        if (nivel) params.nivel = nivel;
        if (pierna) params.pierna = pierna;
        if (nac) params.nacionalidad = nac;
        if (estMin) params.estaturaMin = estMin;
        if (estMax) params.estaturaMax = estMax;
        if (pesoMin) params.pesoMin = pesoMin;
        if (pesoMax) params.pesoMax = pesoMax;
        if (edadMin) params.edadMin = edadMin;
        if (edadMax) params.edadMax = edadMax;
        const data = await api.jugadores(params);
        setJugadores(data.jugadores || []);
      }
    } catch (e) { setError(e.message); }
    finally { setCargando(false); }
  }, [q, pos, disp, nivel, pierna, nac, estMin, estMax, pesoMin, pesoMax, edadMin, edadMax, soloFavoritos]);

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
    setQ(""); setPos(""); setDisp(""); setNivel(""); setPierna(""); setNac("");
    setEstMin(""); setEstMax(""); setPesoMin(""); setPesoMax(""); setEdadMin(""); setEdadMax("");
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
              <div className="filtros-fila">
                <input className="busca-input" placeholder="Buscar por nombre..." value={q} onChange={(e) => setQ(e.target.value)} />
                <select value={pos} onChange={(e) => setPos(e.target.value)}>
                  <option value="">Cualquier posición</option>
                  {POSICIONES.map((p) => <option key={p}>{p}</option>)}
                </select>
                <select value={disp} onChange={(e) => setDisp(e.target.value)}>
                  <option value="">Disponibilidad</option>
                  <option value="si">Disponible</option>
                  <option value="no">No disponible</option>
                </select>
                {busquedaAvanzada && (
                  <>
                    <select value={nivel} onChange={(e) => setNivel(e.target.value)}>
                      <option value="">Nivel</option>
                      <option value="pro">Profesional</option>
                      <option value="ama">Amateur</option>
                    </select>
                    <button className="btn btn-fantasma btn-sm" onClick={() => setVerFiltros(!verFiltros)}>
                      {verFiltros ? "Menos filtros" : "Más filtros"}
                    </button>
                  </>
                )}
              </div>
              {busquedaAvanzada && verFiltros && (
                <div className="filtros-avanzados">
                  <div className="fa-grupo">
                    <label>Pierna</label>
                    <select value={pierna} onChange={(e) => setPierna(e.target.value)}>
                      <option value="">Cualquiera</option>
                      {PIERNAS.map((p) => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="fa-grupo">
                    <label>Nacionalidad</label>
                    <input value={nac} onChange={(e) => setNac(e.target.value)} placeholder="Ej. Perú" />
                  </div>
                  <div className="fa-grupo">
                    <label>Estatura (cm)</label>
                    <div className="rango"><input type="number" placeholder="mín" value={estMin} onChange={(e) => setEstMin(e.target.value)} /><span>—</span><input type="number" placeholder="máx" value={estMax} onChange={(e) => setEstMax(e.target.value)} /></div>
                  </div>
                  <div className="fa-grupo">
                    <label>Peso (kg)</label>
                    <div className="rango"><input type="number" placeholder="mín" value={pesoMin} onChange={(e) => setPesoMin(e.target.value)} /><span>—</span><input type="number" placeholder="máx" value={pesoMax} onChange={(e) => setPesoMax(e.target.value)} /></div>
                  </div>
                  <div className="fa-grupo">
                    <label>Edad</label>
                    <div className="rango"><input type="number" placeholder="mín" value={edadMin} onChange={(e) => setEdadMin(e.target.value)} /><span>—</span><input type="number" placeholder="máx" value={edadMax} onChange={(e) => setEdadMax(e.target.value)} /></div>
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
                <div className="grid-jug">
                  {jugadores.map((j) => {
                    const portada = urlMedia(j.foto_portada);
                    const foto = urlMedia(j.foto_perfil);
                    const esFav = favoritos?.includes(j.id);
                    return (
                      <div className="jug-card" key={j.id} onClick={() => verJugador(j.id)}>
                        <div className="jc-portada" style={portada ? { backgroundImage: `linear-gradient(180deg, rgba(22,24,29,.2), rgba(22,24,29,.9)), url(${portada})` } : {}}>
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
                  })}
                </div>
              </>
            )}
        </>
      )}

      {/* ---------- CLUBES ---------- */}
      {!soloFavoritos && tab === "clubes" && (
        <>
          <div className="filtros">
            <div className="filtros-fila">
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
                        <div className="jc-portada" style={portada ? { backgroundImage: `linear-gradient(180deg, rgba(22,24,29,.2), rgba(22,24,29,.9)), url(${portada})` } : {}} />
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
