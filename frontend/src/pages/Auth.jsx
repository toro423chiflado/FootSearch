import { useState, useEffect } from "react";
import { api } from "../services/api";
import { EmblemaFootSearch, IconBalon, IconRadar, IconEscudo } from "../components/Iconos";

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

function edadDesde(fecha) {
  if (!fecha) return null;
  const hoy = new Date(), nac = new Date(fecha);
  let e = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) e--;
  return e >= 0 && e < 100 ? e : null;
}

/* ---- LOGIN ---- */
export function Login({ ir, entrar }) {
  const [correo, setCorreo] = useState("");
  const [pass, setPass] = useState("");
  const [verPass, setVerPass] = useState(false);
  const [err, setErr] = useState("");
  const [cargando, setCargando] = useState(false);
  // recuperación de contraseña
  const [modoReset, setModoReset] = useState(false);
  const [tokenReset, setTokenReset] = useState("");
  const [nuevaPass, setNuevaPass] = useState("");
  const [info, setInfo] = useState("");

  async function submit() {
    setErr("");
    if (!correo || !pass) { setErr("Ingresa tu correo y contrasena."); return; }
    setCargando(true);
    try {
      const data = await api.login({ correo, password: pass });
      entrar(data);
    } catch (e) { setErr(e.message); }
    finally { setCargando(false); }
  }

  async function pedirReset() {
    setErr(""); setInfo("");
    if (!correo) { setErr("Escribe tu correo arriba y vuelve a pulsar."); return; }
    try {
      const r = await api.recuperarPassword(correo);
      if (r.tokenReset) {
        setTokenReset(r.tokenReset);
        setModoReset(true);
        setInfo("Verificamos tu correo. Ahora escribe tu nueva contraseña.");
      } else {
        setInfo(r.mensaje || "Si el correo existe, podrás restablecerla.");
      }
    } catch (e) { setErr(e.message); }
  }

  async function confirmarReset() {
    setErr(""); setInfo("");
    if (!nuevaPass || nuevaPass.length < 6) { setErr("La nueva contraseña debe tener al menos 6 caracteres."); return; }
    try {
      await api.restablecerPassword(tokenReset, nuevaPass);
      setInfo("Contraseña actualizada. Ya puedes iniciar sesión.");
      setModoReset(false); setPass(nuevaPass); setNuevaPass("");
    } catch (e) { setErr(e.message); }
  }

  return (
    <div className="auth-wrap">
      <div className="card auth-card">
        <div className="auth-head">
          <EmblemaFootSearch size={58} />
          <h2>{modoReset ? "Recuperar contraseña" : "Iniciar sesion"}</h2>
          <p>{modoReset ? "Define una nueva contraseña para tu cuenta." : "Vuelve al radar y sigue explorando talento."}</p>
        </div>
        {err && <div className="aviso err">{err}</div>}
        {info && <div className="aviso">{info}</div>}

        {!modoReset ? (
          <>
            <div className="campo">
              <label>Correo</label>
              <input type="email" value={correo} placeholder="tu@correo.com"
                onChange={(e) => setCorreo(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()} />
            </div>
            <div className="campo">
              <label>Contrasena</label>
              <div className="campo-pass">
                <input type={verPass ? "text" : "password"} value={pass} placeholder="********"
                  onChange={(e) => setPass(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submit()} />
                <button type="button" className="ver-pass" onClick={() => setVerPass(!verPass)}>
                  {verPass ? "Ocultar" : "Ver"}
                </button>
              </div>
            </div>
            <div style={{ textAlign: "right", marginTop: -4, marginBottom: 10 }}>
              <button className="link-sm" onClick={pedirReset}>¿Olvidaste tu contraseña?</button>
            </div>
            <button className="btn btn-rojo btn-bloque" onClick={submit} disabled={cargando}>
              {cargando ? "Entrando..." : "Entrar"}
            </button>
            <div className="auth-pie">
              No tienes cuenta? <button onClick={() => ir("registro")}>Registrate</button>
            </div>
          </>
        ) : (
          <>
            <div className="campo">
              <label>Nueva contraseña</label>
              <div className="campo-pass">
                <input type={verPass ? "text" : "password"} value={nuevaPass} placeholder="Mínimo 6 caracteres"
                  onChange={(e) => setNuevaPass(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && confirmarReset()} />
                <button type="button" className="ver-pass" onClick={() => setVerPass(!verPass)}>
                  {verPass ? "Ocultar" : "Ver"}
                </button>
              </div>
            </div>
            <button className="btn btn-rojo btn-bloque" onClick={confirmarReset}>Guardar nueva contraseña</button>
            <div className="auth-pie">
              <button onClick={() => { setModoReset(false); setErr(""); setInfo(""); }}>Volver a iniciar sesión</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ---- REGISTRO ---- */
const TIPOS = [
  { id: "jugador", icono: <IconBalon size={24} />, t: "Jugador" },
  { id: "cazatalentos", icono: <IconRadar size={24} />, t: "Cazatalentos" },
  { id: "club", icono: <IconEscudo size={24} />, t: "Club" },
];

export function Registro({ ir, entrar }) {
  const [tipo, setTipo] = useState("jugador");
  const [f, setF] = useState({});
  const [err, setErr] = useState("");
  const [cargando, setCargando] = useState(false);
  const [clubes, setClubes] = useState([]);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  useEffect(() => {
    (async () => {
      try {
        const data = await api.clubes();
        setClubes(data.clubes || []);
      } catch { setClubes([]); }
    })();
  }, []);

  async function submit() {
    setErr("");
    const esClub = tipo === "club";

    if (esClub) {
      if (!f.club || !f.club.trim()) { setErr("El nombre del club es obligatorio."); return; }
      if (!f.idClub) { setErr("Necesitas un ID de club. Solicitalo a Soporte FootSearch."); return; }
    } else if (tipo === "jugador") {
      if (!f.nombres || !f.nombres.trim()) { setErr("Los nombres son obligatorios."); return; }
      if (!f.apellidoPaterno || !f.apellidoPaterno.trim()) { setErr("El apellido paterno es obligatorio."); return; }
    } else {
      if (!f.nombre || !f.nombre.trim()) { setErr("El nombre es obligatorio."); return; }
    }
    if (!f.correo) { setErr("El correo es obligatorio."); return; }
    if (!f.password || f.password.length < 6) { setErr("La contrasena debe tener al menos 6 caracteres."); return; }

    const body = { tipo, correo: f.correo, password: f.password };
    if (tipo === "jugador") {
      Object.assign(body, {
        nombres: f.nombres,
        apellidoPaterno: f.apellidoPaterno,
        apellidoMaterno: f.apellidoMaterno || null,
        nacionalidad: f.nacionalidad || null,
        fechaNacimiento: f.fechaNacimiento || null,
        posicion: f.posicion || null,
        pierna: f.pierna || null,
        estatura: f.estatura ? Number(f.estatura) : null,
        peso: f.peso ? Number(f.peso) : null,
        ciudad: f.ciudad || null,
        club: f.clubActual || null,
      });
    } else if (tipo === "cazatalentos") {
      body.nombre = f.nombre;
      body.club = f.clubActual || null;
    } else if (tipo === "club") {
      body.nombre = f.club;
      body.idClub = f.idClub;
    }

    setCargando(true);
    try {
      const data = await api.register(body);
      entrar(data);
    } catch (e) { setErr(e.message); }
    finally { setCargando(false); }
  }

  const edad = edadDesde(f.fechaNacimiento);
  const anchoExtra = tipo === "jugador";

  return (
    <div className="auth-wrap">
      <div className={"card auth-card " + (anchoExtra ? "tm" : "ancho")}>
        <div className="auth-head">
          <EmblemaFootSearch size={58} />
          <h2>Crear cuenta</h2>
          <p>Empieza a ser visto por miles de cazatalentos.</p>
        </div>

        <div className="tipos">
          {TIPOS.map((x) => (
            <button key={x.id} className={"tipo" + (tipo === x.id ? " sel" : "")}
              onClick={() => { setTipo(x.id); setErr(""); }}>
              <div className="ic">{x.icono}</div>
              <div className="t">{x.t}</div>
            </button>
          ))}
        </div>

        {err && <div className="aviso err">{err}</div>}

        {/* ============ JUGADOR: ficha estilo Transfermarkt ============ */}
        {tipo === "jugador" && (
          <div className="tm-form">
            {/* vista previa de ficha */}
            <div className="tm-preview">
              <div className="tm-foto">{(f.nombres?.[0] || "?") + (f.apellidoPaterno?.[0] || "")}</div>
              <div className="tm-pv-datos">
                <div className="tm-pv-nombre">
                  {[f.nombres, f.apellidoPaterno, f.apellidoMaterno].filter(Boolean).join(" ") || "Nombre del jugador"}
                </div>
                <div className="tm-pv-meta">
                  {f.posicion || "Posicion"}{f.nacionalidad ? ` · ${f.nacionalidad}` : ""}
                </div>
                <div className="tm-pv-chips">
                  {edad !== null && <span className="tm-chip"><b>{edad}</b> años</span>}
                  {f.estatura && <span className="tm-chip"><b>{f.estatura}</b> cm</span>}
                  {f.peso && <span className="tm-chip"><b>{f.peso}</b> kg</span>}
                  {f.pierna && <span className="tm-chip">{f.pierna}</span>}
                </div>
              </div>
            </div>

            {/* Datos personales */}
            <div className="tm-seccion">
              <div className="tm-seccion-tit">Datos personales</div>
              <div className="fila3">
                <div className="campo">
                  <label>Nombres</label>
                  <input value={f.nombres || ""} onChange={set("nombres")} placeholder="Ej. Diego" />
                </div>
                <div className="campo">
                  <label>Apellido paterno</label>
                  <input value={f.apellidoPaterno || ""} onChange={set("apellidoPaterno")} placeholder="Ej. Quispe" />
                </div>
                <div className="campo">
                  <label>Apellido materno</label>
                  <input value={f.apellidoMaterno || ""} onChange={set("apellidoMaterno")} placeholder="Ej. Mamani" />
                </div>
              </div>
              <div className="fila">
                <div className="campo">
                  <label>Nacionalidad</label>
                  <select value={f.nacionalidad || ""} onChange={set("nacionalidad")}>
                    <option value="">Selecciona...</option>
                    {NACIONALIDADES.map((n) => <option key={n}>{n}</option>)}
                  </select>
                </div>
                <div className="campo">
                  <label>Ciudad</label>
                  <input value={f.ciudad || ""} onChange={set("ciudad")} placeholder="Ej. Cusco" />
                </div>
              </div>
              <div className="campo">
                <label>Fecha de nacimiento</label>
                <div className="fecha-edad">
                  <input type="date" value={f.fechaNacimiento || ""} onChange={set("fechaNacimiento")} max={new Date().toISOString().slice(0,10)} />
                  {edad !== null && (
                    <div className="edad-pill" title="Edad calculada">
                      <span className="edad-num">{edad}</span>
                      <span className="edad-lbl">años</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Datos físicos */}
            <div className="tm-seccion">
              <div className="tm-seccion-tit">Datos físicos</div>
              <div className="fila3">
                <div className="campo">
                  <label>Estatura (cm)</label>
                  <input type="number" min="120" max="230" value={f.estatura || ""} onChange={set("estatura")} placeholder="178" />
                </div>
                <div className="campo">
                  <label>Peso (kg)</label>
                  <input type="number" min="40" max="150" value={f.peso || ""} onChange={set("peso")} placeholder="72" />
                </div>
                <div className="campo">
                  <label>Pierna dominante</label>
                  <select value={f.pierna || ""} onChange={set("pierna")}>
                    <option value="">Selecciona...</option>
                    {PIERNAS.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Datos deportivos */}
            <div className="tm-seccion">
              <div className="tm-seccion-tit">Datos deportivos</div>
              <div className="fila">
                <div className="campo">
                  <label>Posicion</label>
                  <select value={f.posicion || ""} onChange={set("posicion")}>
                    <option value="">Selecciona...</option>
                    {POSICIONES.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div className="campo">
                  <label>Club actual (opcional)</label>
                  <select value={f.clubActual || ""} onChange={set("clubActual")}>
                    <option value="">Sin club / agente libre</option>
                    {clubes.map((c) => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
                  </select>
                </div>
              </div>
              <div className="ayuda">Las estadisticas (goles, asistencias, partidos) las gestiona FootSearch y arrancan en 0.</div>
            </div>

            {/* Cuenta */}
            <div className="tm-seccion">
              <div className="tm-seccion-tit">Datos de la cuenta</div>
              <div className="fila">
                <div className="campo">
                  <label>Correo</label>
                  <input type="email" value={f.correo || ""} onChange={set("correo")} placeholder="tu@correo.com" />
                </div>
                <div className="campo">
                  <label>Contrasena</label>
                  <input type="password" value={f.password || ""} onChange={set("password")} placeholder="Minimo 6 caracteres" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============ CAZATALENTOS ============ */}
        {tipo === "cazatalentos" && (
          <>
            <div className="campo">
              <label>Nombre y apellido</label>
              <input value={f.nombre || ""} onChange={set("nombre")} placeholder="Ej. Maria Torres" />
            </div>
            <div className="fila">
              <div className="campo">
                <label>Correo</label>
                <input type="email" value={f.correo || ""} onChange={set("correo")} placeholder="tu@correo.com" />
              </div>
              <div className="campo">
                <label>Contrasena</label>
                <input type="password" value={f.password || ""} onChange={set("password")} placeholder="Minimo 6 caracteres" />
              </div>
            </div>
            <div className="campo">
              <label>Club que representas</label>
              <select value={f.clubActual || ""} onChange={set("clubActual")}>
                <option value="">Selecciona un club...</option>
                {clubes.map((c) => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
              </select>
              <div className="ayuda">Un club puede tener varios cazatalentos. Es solo un dato de tu perfil; no apareceras en las busquedas.</div>
            </div>
          </>
        )}

        {/* ============ CLUB ============ */}
        {tipo === "club" && (
          <>
            <div className="campo">
              <label>Nombre del club</label>
              <input value={f.club || ""} onChange={set("club")} placeholder="Ej. Sporting Cristal" />
            </div>
            <div className="fila">
              <div className="campo">
                <label>Correo</label>
                <input type="email" value={f.correo || ""} onChange={set("correo")} placeholder="club@correo.com" />
              </div>
              <div className="campo">
                <label>Contrasena</label>
                <input type="password" value={f.password || ""} onChange={set("password")} placeholder="Minimo 6 caracteres" />
              </div>
            </div>
            <div className="campo">
              <label>ID de club</label>
              <input value={f.idClub || ""} onChange={set("idClub")} placeholder="FS-XXXX-XXXX-XXXX" />
              <div className="ayuda">El ID lo otorga el area de Soporte de FootSearch y es de un solo uso. Formato: <b>FS-XXXX-XXXX-XXXX</b>.</div>
            </div>
            <div className="aviso">
              <span>No tienes ID? Solicitalo a nuestro equipo de soporte.
                <button type="button" className="btn btn-dorado btn-sm" style={{ marginLeft: 10 }}
                  onClick={() => alert("Boton sin funcionalidad - maqueta. Aqui se abriria el contacto con Soporte FootSearch.")}>
                  Contactar Soporte
                </button>
              </span>
            </div>
          </>
        )}

        <button className="btn btn-rojo btn-bloque" style={{ marginTop: 8 }} onClick={submit} disabled={cargando}>
          {cargando ? "Creando cuenta..." : `Registrarme como ${TIPOS.find((t) => t.id === tipo).t}`}
        </button>
        <div className="auth-pie">
          Ya tienes cuenta? <button onClick={() => ir("login")}>Inicia sesion</button>
        </div>
      </div>
    </div>
  );
}
