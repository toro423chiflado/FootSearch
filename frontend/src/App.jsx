import { useState, useEffect, useCallback } from "react";
import { Navbar, Footer } from "./components/Componentes";
import Landing from "./pages/Landing";
import { Login, Registro } from "./pages/Auth";
import Buscar from "./pages/Buscar";
import PerfilJugador from "./pages/PerfilJugador";
import PerfilClub from "./pages/PerfilClub";
import MiPerfilJugador from "./pages/MiPerfilJugador";
import MiClub from "./pages/MiClub";
import { api, setTokens, limpiarTokens } from "./services/api";

export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [perfil, setPerfil] = useState(null);      // datos extra (jugador.id, club_id)
  const [cargandoSesion, setCargandoSesion] = useState(true);
  const [vista, setVista] = useState("landing");
  const [jugadorSel, setJugadorSel] = useState(null);
  const [clubSel, setClubSel] = useState(null);
  const [favoritos, setFavoritos] = useState([]);

  const ir = (v) => { window.scrollTo(0, 0); setVista(v); };

  // Reanudar sesión al cargar
  useEffect(() => {
    (async () => {
      try {
        const data = await api.refrescarSesion();
        if (data?.usuario) {
          setUsuario(data.usuario);
          setPerfil(data);
          setVista("buscar");
        }
      } catch { /* sin sesión previa */ }
      setCargandoSesion(false);
    })();
  }, []);

  const recargarFavoritos = useCallback(async () => {
    if (usuario && usuario.tipo !== "jugador") {
      try {
        const data = await api.favoritos();
        setFavoritos(data.ids || []);
      } catch { setFavoritos([]); }
    }
  }, [usuario]);

  useEffect(() => { recargarFavoritos(); }, [recargarFavoritos]);

  async function entrar(data) {
    setTokens(data.accessToken, data.refreshToken);
    setUsuario(data.usuario);
    // cargar perfil completo (jugador.id / club_id)
    try { const me = await api.me(); setPerfil(me); } catch { setPerfil(data); }
    ir("buscar");
  }
  async function salir() {
    try { await api.logout(); } catch { /* ignore */ }
    limpiarTokens();
    setUsuario(null); setPerfil(null); setFavoritos([]);
    ir("landing");
  }
  function verJugador(id) { setJugadorSel(id); ir("jugador"); }
  function verClub(id) { setClubSel(id); ir("club"); }

  async function toggleFav(id) {
    try {
      const { favorito } = await api.alternarFavorito(id);
      setFavoritos((f) => (favorito ? [...f, id] : f.filter((x) => x !== id)));
    } catch (e) { alert(e.message); }
  }

  if (cargandoSesion) {
    return (
      <div className="app" style={{ display: "grid", placeItems: "center" }}>
        <div className="cargando-marca">FootSearch</div>
      </div>
    );
  }

  const requiereSesion = ["buscar", "favoritos", "jugador", "club", "miperfil", "miclub"];
  const vistaActual = (!usuario && requiereSesion.includes(vista)) ? "login" : vista;

  return (
    <div className="app">
      <Navbar usuario={usuario} perfil={perfil} ir={ir} salir={salir} />

      {vistaActual === "landing" && <Landing ir={ir} />}
      {vistaActual === "login" && <Login ir={ir} entrar={entrar} />}
      {vistaActual === "registro" && <Registro ir={ir} entrar={entrar} />}
      {vistaActual === "buscar" && (
        <Buscar usuario={usuario} verJugador={verJugador}
          favoritos={favoritos} toggleFav={toggleFav} />
      )}
      {vistaActual === "favoritos" && (
        <Buscar usuario={usuario} verJugador={verJugador}
          favoritos={favoritos} toggleFav={toggleFav} soloFavoritos />
      )}
      {vistaActual === "jugador" && (
        <PerfilJugador id={jugadorSel} usuario={usuario}
          volver={() => ir("buscar")} verClub={verClub}
          favoritos={favoritos} toggleFav={toggleFav} />
      )}
      {vistaActual === "club" && (
        <PerfilClub id={clubSel} volver={() => ir("buscar")} verJugador={verJugador} />
      )}
      {vistaActual === "miperfil" && (
        <MiPerfilJugador volver={() => ir("buscar")} onActualizar={async () => {
          try { const me = await api.me(); setPerfil(me); } catch { /* */ }
        }} />
      )}
      {vistaActual === "miclub" && (
        <MiClub verJugador={verJugador} />
      )}

      <Footer ir={ir} />
    </div>
  );
}
