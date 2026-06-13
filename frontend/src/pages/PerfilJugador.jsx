import { useState, useEffect } from "react";
import { api } from "../services/api";
import { colorDe, iniciales } from "../components/Componentes";
import { IconPlay, IconTrofeo, IconEstrella } from "../components/Iconos";

export default function PerfilJugador({ id, usuario, volver, verClub, favoritos, toggleFav }) {
  const [modal, setModal] = useState(false);
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setCargando(true); setError("");
      try {
        const data = await api.jugador(id);
        setDatos(data);
      } catch (e) { setError(e.message); }
      finally { setCargando(false); }
    })();
  }, [id]);

  if (cargando) return <main className="contenedor perfil"><p style={{ color: "var(--gris)" }}>Cargando perfil...</p></main>;
  if (error || !datos) return <main className="contenedor perfil"><div className="aviso err">{error || "No se encontro el jugador."}</div></main>;

  const j = datos.jugador;
  const logros = datos.logros || [];
  const videos = datos.videos || [];
  const puedeContactar = usuario.tipo !== "jugador";
  const esFav = favoritos.includes(j.id);

  return (
    <main className="contenedor perfil">
      <button className="perfil-volver" onClick={volver}>&larr; Volver a la busqueda</button>

      <div className="card perfil-head">
        <div className="foto-g" style={{ background: colorDe(j.nombre) }}>{iniciales(j.nombre)}</div>
        <div>
          <h1>{j.nombre}</h1>
          <div className="sub">{j.posicion || "Sin posicion"} - {j.ciudad || "Peru"}{j.club_nombre ? ` - ${j.club_nombre}` : " - Sin club"}</div>
          <div className="badges">
            <span className={"badge " + (j.disponible ? "badge-disp" : "badge-nodisp")}>
              {j.disponible ? "Disponible para pruebas" : "No disponible"}
            </span>
            <span className={"badge " + (j.profesional ? "badge-pro" : "badge-ama")}>
              {j.profesional ? "Profesional" : "Amateur"}
            </span>
          </div>
        </div>
        {puedeContactar && (
          <div className="perfil-acciones">
            <button className="btn btn-rojo" onClick={() => setModal(true)}>Contactar</button>
            <button className={"btn " + (esFav ? "btn-dorado" : "btn-fantasma")} onClick={() => toggleFav(j.id)}>
              <IconEstrella size={16} llena={esFav} /> {esFav ? "Guardado" : "Guardar"}
            </button>
          </div>
        )}
      </div>

      <div className="perfil-grid">
        <div>
          <div className="card bloque">
            <h3>Ficha deportiva</h3>
            <div className="dato"><span className="k">Edad</span><span className="v">{j.edad ?? "-"} anos</span></div>
            <div className="dato"><span className="k">Estatura</span><span className="v">{j.estatura_cm ? j.estatura_cm + " cm" : "-"}</span></div>
            <div className="dato"><span className="k">Peso</span><span className="v">{j.peso_kg ? j.peso_kg + " kg" : "-"}</span></div>
            <div className="dato"><span className="k">Pierna habil</span><span className="v">{j.pierna || "-"}</span></div>
            <div className="dato"><span className="k">Posicion</span><span className="v">{j.posicion || "-"}</span></div>
            <div className="dato">
              <span className="k">Club</span>
              {j.club_uuid
                ? <span className="v enlace" onClick={() => verClub(j.club_uuid)}>{j.club_nombre} &rarr;</span>
                : <span className="v">Agente libre</span>}
            </div>
          </div>

          <div className="card bloque">
            <h3>Sobre el jugador</h3>
            <p style={{ color: "var(--gris-claro)", fontSize: 15 }}>{j.bio || "Este jugador aun no agrego una descripcion."}</p>
          </div>
        </div>

        <div>
          <div className="card bloque">
            <h3>Estadisticas de la temporada</h3>
            <div className="stats-grid">
              <div className="stat-box"><div className="n">{j.partidos}</div><div className="l">Partidos</div></div>
              <div className="stat-box"><div className="n">{j.goles}</div><div className="l">Goles</div></div>
              <div className="stat-box"><div className="n">{j.asistencias}</div><div className="l">Asistencias</div></div>
              <div className="stat-box"><div className="n">{j.minutos}</div><div className="l">Minutos</div></div>
            </div>
          </div>

          <div className="card bloque">
            <h3>Videos destacados</h3>
            {videos.length === 0 ? (
              <p style={{ color: "var(--gris)", fontSize: 14 }}>Sin videos por ahora.</p>
            ) : videos.map((v, i) => (
              <div className="video-item" key={v._id || i}>
                <div className="play"><IconPlay /></div>
                <span>{v.titulo}</span>
              </div>
            ))}
          </div>

          <div className="card bloque">
            <h3>Logros</h3>
            {logros.length === 0 ? (
              <p style={{ color: "var(--gris)", fontSize: 14 }}>Sin logros registrados.</p>
            ) : logros.map((l, i) => (
              <div className="logro-item" key={i}><IconTrofeo size={14} /> {l}</div>
            ))}
          </div>
        </div>
      </div>

      {modal && (
        <div className="modal-bg" onClick={() => setModal(false)}>
          <div className="card modal" onClick={(e) => e.stopPropagation()}>
            <h3>Contactar a {j.nombre.split(" ")[0]}</h3>
            <p>En la plataforma real se abriria un canal de mensajeria directa.</p>
            <div className="correo">{j.contacto || "contacto@footsearch.pe"}</div>
            <p style={{ fontSize: 13, color: "var(--gris)" }}>Boton de demostracion - sin envio real.</p>
            <button className="btn btn-rojo btn-bloque" style={{ marginTop: 16 }} onClick={() => setModal(false)}>Cerrar</button>
          </div>
        </div>
      )}
    </main>
  );
}
