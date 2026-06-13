import { RadarDeco } from "../components/Componentes";
import { EmblemaFootSearch, IconBalon, IconRadar, IconEscudo } from "../components/Iconos";

export default function Landing({ ir }) {
  return (
    <main>
      <section className="hero">
        <RadarDeco />
        <div className="contenedor hero-grid">
          <div>
            <span className="eyebrow">Scouting de talento · Peru</span>
            <h1>El radar del<br /><em>futbol</em> peruano</h1>
            <p>
              Jugadores, scouts y clubes en una sola cancha. Crea tu perfil deportivo,
              encuentra talento y abre la puerta a tu proxima oportunidad.
            </p>
            <div className="hero-cta">
              <button className="btn btn-rojo" onClick={() => ir("registro")}>Crear cuenta</button>
              <button className="btn btn-fantasma" onClick={() => ir("login")}>Ya tengo cuenta</button>
            </div>
          </div>
          <div className="hero-logo">
            <div className="hero-emblema">
              <EmblemaFootSearch size={300} />
              <div className="hero-wordmark">Foot<b>Search</b></div>
              <div className="hero-tagline">Scouting talent · Building future</div>
            </div>
          </div>
        </div>
      </section>

      <section className="seccion contenedor">
        <div className="seccion-titulo">
          <span className="eyebrow">Tres formas de jugar</span>
          <h2>Elige tu perfil</h2>
        </div>
        <div className="roles">
          <article className="card rol">
            <span className="num">01</span>
            <div className="icono rojo"><IconBalon /></div>
            <h3>Jugadores</h3>
            <p>Profesionales, amateurs y jovenes promesas con un mismo objetivo: ser vistos.</p>
            <ul>
              <li>Perfil con foto y highlights</li>
              <li>Posicion, fisico y pierna habil</li>
              <li>Estadisticas y logros</li>
              <li>Disponibilidad para pruebas</li>
            </ul>
          </article>
          <article className="card rol">
            <span className="num">02</span>
            <div className="icono dorado"><IconRadar /></div>
            <h3>Cazatalentos</h3>
            <p>Explora la base de datos, filtra por lo que necesitas y contacta directo.</p>
            <ul>
              <li>Busqueda y filtros avanzados</li>
              <li>Guarda perfiles favoritos</li>
              <li>Contacto directo con jugadores</li>
              <li>Asociado a un club existente</li>
            </ul>
          </article>
          <article className="card rol">
            <span className="num">03</span>
            <div className="icono azul"><IconEscudo /></div>
            <h3>Clubes</h3>
            <p>Tu institucion con perfil propio, plantel y convocatorias abiertas.</p>
            <ul>
              <li>Perfil institucional</li>
              <li>Plantel de hasta 52 jugadores</li>
              <li>Publica pruebas y convocatorias</li>
              <li>Requiere ID de club verificado</li>
            </ul>
          </article>
        </div>
        <div style={{ textAlign: "center", marginTop: 44 }}>
          <button className="btn btn-rojo" onClick={() => ir("registro")}>Entrar a la plataforma</button>
        </div>
      </section>
    </main>
  );
}
