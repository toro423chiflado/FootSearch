import { EmblemaFootSearch, IconBuscar, IconEstrella } from "./Iconos";

const PALETA = ["#E2231A", "#0F4C9E", "#0B2E59", "#B11226", "#2E7D32", "#6A1B9A", "#00838F", "#D4A24E"];
export function colorDe(texto = "") {
  let h = 0;
  for (let i = 0; i < texto.length; i++) h = texto.charCodeAt(i) + ((h << 5) - h);
  return PALETA[Math.abs(h) % PALETA.length];
}
export function iniciales(nombre = "") {
  return nombre.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export function Navbar({ usuario, perfil, ir, salir }) {
  return (
    <nav className="nav">
      <div className="contenedor nav-inner">
        <div className="nav-logo" onClick={() => ir(usuario ? "buscar" : "landing")}>
          <EmblemaFootSearch size={36} />
          <span className="marca">Foot<b>Search</b></span>
        </div>
        <div className="nav-spacer" />
        {usuario ? (
          <>
            <button className="nav-link" onClick={() => ir("buscar")}>
              <IconBuscar size={15} /> Buscar
            </button>
            {usuario.tipo !== "jugador" && (
              <button className="nav-link ocultable" onClick={() => ir("favoritos")}>
                <IconEstrella size={15} /> Favoritos
              </button>
            )}
            {usuario.tipo === "jugador" && (
              <button className="nav-link ocultable" onClick={() => ir("miperfil")}>Mi perfil</button>
            )}
            {usuario.tipo === "club" && (
              <button className="nav-link ocultable" onClick={() => ir("miclub")}>Mi club</button>
            )}
            <div className="nav-user">
              <small>{usuario.tipo}</small>
              <div className="avatar" style={{ background: colorDe(usuario.nombre) }}>
                {iniciales(usuario.nombre)}
              </div>
              <button className="nav-link salir" onClick={salir}>Salir</button>
            </div>
          </>
        ) : (
          <>
            <button className="nav-link" onClick={() => ir("login")}>Iniciar sesion</button>
            <button className="btn btn-rojo btn-sm" onClick={() => ir("registro")}>Registrarse</button>
          </>
        )}
      </div>
    </nav>
  );
}

export function Footer({ ir }) {
  return (
    <footer className="footer">
      <div className="contenedor">
        <div className="footer-top">
          <div className="footer-marca">
            <div className="nav-logo" style={{ cursor: "default" }}>
              <EmblemaFootSearch size={42} />
              <span className="marca" style={{ fontSize: 24 }}>Foot<b>Search</b></span>
            </div>
            <p>
              Nacimos en Peru para que ningun talento se quede sin ser visto.
              Conectamos a quien juega con quien busca, sin intermediarios ni vueltas.
            </p>
          </div>
          <div className="footer-cols">
            <div className="footer-col">
              <h4>Plataforma</h4>
              <button onClick={() => ir && ir("buscar")}>Buscar jugadores</button>
              <button onClick={() => ir && ir("registro")}>Crear cuenta</button>
              <button onClick={() => ir && ir("login")}>Iniciar sesion</button>
            </div>
            <div className="footer-col">
              <h4>Para quien</h4>
              <span>Jugadores y promesas</span>
              <span>Cazatalentos</span>
              <span>Clubes y academias</span>
            </div>
            <div className="footer-col">
              <h4>Soporte</h4>
              <span>Centro de ayuda</span>
              <span>Verificacion de clubes</span>
              <span>Contacto</span>
            </div>
          </div>
        </div>
        <div className="footer-base">
          <small>FootSearch Peru - Hecho con futbol en mente</small>
          <small>Maqueta de demostracion - Datos ficticios - {new Date().getFullYear()}</small>
        </div>
      </div>
    </footer>
  );
}

export function RadarDeco() {
  return (
    <svg className="radar" viewBox="0 0 560 560" aria-hidden="true">
      <circle className="anillo" cx="280" cy="280" r="240" />
      <circle className="anillo" cx="280" cy="280" r="170" />
      <circle className="anillo" cx="280" cy="280" r="100" />
      <line className="cruz" x1="40" y1="280" x2="520" y2="280" />
      <line className="cruz" x1="280" y1="40" x2="280" y2="520" />
      <g className="barrido">
        <path d="M280 280 L280 40 A240 240 0 0 1 460 150 Z" fill="rgba(226,35,26,.22)" />
        <line x1="280" y1="280" x2="280" y2="40" stroke="var(--rojo)" strokeWidth="2" />
      </g>
      <circle className="blip" cx="360" cy="200" r="6" />
      <circle className="blip" cx="200" cy="360" r="5" />
      <circle className="blip" cx="390" cy="350" r="4" />
    </svg>
  );
}
