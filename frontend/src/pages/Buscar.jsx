import { useState, useEffect, useCallback } from "react";
import { api } from "../services/api";
import { colorDe, iniciales } from "../components/Componentes";
import { IconEstrella } from "../components/Iconos";

const POSICIONES = [
  "Portero", "Lateral derecho", "Lateral izquierdo", "Defensa central",
  "Mediocampista defensivo", "Mediocampista central", "Mediocampista ofensivo",
  "Extremo derecho", "Extremo izquierdo", "Delantero centro",
];

export default function Buscar({ usuario, verJugador, favoritos, toggleFav, soloFavoritos = false }) {
  const [q, setQ] = useState("");
  const [pos, setPos] = useState("");
  const [disp, setDisp] = useState("");
  const [nivel, setNivel] = useState("");
  const [jugadores, setJugadores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const puedeFav = usuario.tipo !== "jugador";

  const cargar = useCallback(async () => {
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
        const data = await api.jugadores(params);
        setJugadores(data.jugadores || []);
      }
    } catch (e) { setError(e.message); }
    finally { setCargando(false); }
  }, [q, pos, disp, nivel, soloFavoritos]);

  // Debounce de la busqueda
  useEffect(() => {
    const t = setTimeout(cargar, 250);
    return () => clearTimeout(t);
  }, [cargar]);

  function limpiar() { setQ(""); setPos(""); setDisp(""); setNivel(""); }

  return (
    <main>
      <div className="contenedor busq-top">
        <h1>{soloFavoritos ? "Perfiles favoritos" : "Buscar jugadores"}</h1>
        <p>
          {soloFavoritos
            ? "Los jugadores que guardaste para revisar despues."
            : "Filtra la base de datos y encuentra al jugador que tu club necesita."}
        </p>
      </div>

      {!soloFavoritos && (
        <div className="contenedor">
          <div className="card filtros">
            <div className="campo">
              <label>Buscar por nombre</label>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ej. Diego..." />
            </div>
            <div className="campo">
              <label>Posicion</label>
              <select value={pos} onChange={(e) => setPos(e.target.value)}>
                <option value="">Todas</option>
                {POSICIONES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="campo">
              <label>Disponibilidad</label>
              <select value={disp} onChange={(e) => setDisp(e.target.value)}>
                <option value="">Todos</option>
                <option value="si">Disponible</option>
                <option value="no">No disponible</option>
              </select>
            </div>
            <div className="campo">
              <label>Nivel</label>
              <select value={nivel} onChange={(e) => setNivel(e.target.value)}>
                <option value="">Todos</option>
                <option value="pro">Profesional</option>
                <option value="ama">Amateur</option>
              </select>
            </div>
            <button className="btn btn-fantasma" onClick={limpiar}>Limpiar</button>
          </div>
        </div>
      )}

      <div className="contenedor">
        {error && <div className="aviso err" style={{ marginTop: 20 }}>{error}</div>}
        <div className="resultados-info">
          {cargando ? "Buscando..." : `${jugadores.length} jugador${jugadores.length !== 1 ? "es" : ""} encontrado${jugadores.length !== 1 ? "s" : ""}`}
        </div>

        {!cargando && jugadores.length === 0 ? (
          <div className="vacio">
            <div className="big"><IconEstrella size={48} /></div>
            <p>{soloFavoritos ? "Aun no has guardado favoritos. Marca jugadores con la estrella." : "Ningun jugador coincide con tu busqueda. Ajusta los filtros."}</p>
          </div>
        ) : (
          <div className="grid-jug">
            {jugadores.map((j) => (
              <article key={j.id} className="card jcard" onClick={() => verJugador(j.id)}>
                <div className="jcard-top">
                  <div className="foto" style={{ background: colorDe(j.nombre) }}>{iniciales(j.nombre)}</div>
                  <div>
                    <div className="nom">{j.nombre}</div>
                    <div className="pos">{j.posicion || "Sin posicion"}</div>
                  </div>
                  {puedeFav && (
                    <button
                      className={"fav-btn" + (favoritos.includes(j.id) ? " on" : "")}
                      onClick={(e) => { e.stopPropagation(); toggleFav(j.id); }}
                      title="Guardar como favorito">
                      <IconEstrella size={20} llena={favoritos.includes(j.id)} />
                    </button>
                  )}
                </div>
                <div className="jcard-meta">
                  <span className={"badge " + (j.disponible ? "badge-disp" : "badge-nodisp")}>
                    {j.disponible ? "Disponible" : "No disponible"}
                  </span>
                  <span className={"badge " + (j.profesional ? "badge-pro" : "badge-ama")}>
                    {j.profesional ? "Pro" : "Amateur"}
                  </span>
                  {j.club_nombre && <span className="badge badge-nodisp">{j.club_nombre}</span>}
                </div>
                <div className="jcard-stats">
                  <div className="s"><div className="sv">{j.edad ?? "-"}</div><div className="sl">Edad</div></div>
                  <div className="s"><div className="sv">{j.goles}</div><div className="sl">Goles</div></div>
                  <div className="s"><div className="sv">{j.partidos}</div><div className="sl">Partidos</div></div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
