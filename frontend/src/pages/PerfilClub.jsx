import { useState, useEffect } from "react";
import { api } from "../services/api";
import { colorDe, iniciales } from "../components/Componentes";
import { IconEstrella, IconTrofeo } from "../components/Iconos";

export default function PerfilClub({ id, volver, verJugador }) {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setCargando(true); setError("");
      try {
        const data = await api.club(id);
        setDatos(data);
      } catch (e) { setError(e.message); }
      finally { setCargando(false); }
    })();
  }, [id]);

  if (cargando) return <main className="contenedor perfil"><p style={{ color: "var(--gris)" }}>Cargando club...</p></main>;
  if (error || !datos) return <main className="contenedor perfil"><div className="aviso err">{error || "No se encontro el club."}</div></main>;

  const club = datos.club;
  const plantel = datos.plantel || [];
  const convocatorias = datos.convocatorias || [];
  const cupoMax = datos.cupoMax || 52;
  const pct = Math.round((plantel.length / cupoMax) * 100);

  return (
    <main className="contenedor perfil">
      <button className="perfil-volver" onClick={volver}>&larr; Volver</button>

      <div className="card club-head">
        <div className="club-escudo" style={{ background: club.color || "#E2231A" }}>{club.iniciales}</div>
        <div style={{ flex: 1 }}>
          <h1>{club.nombre}</h1>
          <div className="sub" style={{ color: "var(--gris-claro)" }}>
            {club.ciudad}{club.fundado ? ` - Fundado en ${club.fundado}` : ""}
          </div>
          <div className="cupo">
            <div className="cupo-barra"><div className="cupo-fill" style={{ width: pct + "%" }} /></div>
            <span className="cupo-txt">{plantel.length} / {cupoMax} jugadores</span>
          </div>
        </div>
        <button className="btn btn-fantasma"
          onClick={() => alert("Boton sin funcionalidad - maqueta. Aqui seguirias al club.")}>
          <IconEstrella size={16} /> Seguir club
        </button>
      </div>

      <div className="card bloque">
        <h3>Plantel registrado</h3>
        {plantel.length === 0 ? (
          <p style={{ color: "var(--gris)" }}>Este club aun no tiene jugadores registrados en FootSearch.</p>
        ) : (
          <div className="plantel">
            {plantel.map((j) => (
              <div className="mini-jug" key={j.id} onClick={() => verJugador(j.id)}>
                <div className="f" style={{ background: colorDe(j.nombre) }}>{iniciales(j.nombre)}</div>
                <div>
                  <div className="mn">{j.nombre}</div>
                  <div className="mp">{j.posicion || "Sin posicion"}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card bloque">
        <h3>Convocatorias abiertas</h3>
        {convocatorias.length === 0 ? (
          <p style={{ color: "var(--gris)", fontSize: 14 }}>No hay convocatorias abiertas por ahora.</p>
        ) : convocatorias.map((c) => (
          <div className="video-item" key={c.id}>
            <div className="play" style={{ background: "var(--dorado)", color: "var(--carbon)" }}><IconTrofeo size={16} /></div>
            <div>
              <div style={{ fontWeight: 600 }}>{c.titulo}</div>
              <div style={{ fontSize: 13, color: "var(--gris)" }}>{c.descripcion || "Convocatoria abierta"}</div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
