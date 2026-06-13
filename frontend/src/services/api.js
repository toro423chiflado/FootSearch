// Cliente HTTP para hablar con el backend de FootSearch.
// Maneja el access token en memoria y refresca automáticamente con el refresh token.

const BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

let accessToken = null;
let refreshToken = null;

export function setTokens(at, rt) {
  accessToken = at;
  refreshToken = rt;
  // El refresh token se guarda para reanudar sesión tras recargar.
  if (rt) localStorage.setItem("fs_refresh", rt);
  else localStorage.removeItem("fs_refresh");
}
export function getRefreshGuardado() {
  return localStorage.getItem("fs_refresh");
}
export function limpiarTokens() {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem("fs_refresh");
}

async function pedir(ruta, opciones = {}, reintentar = true) {
  const headers = { ...(opciones.headers || {}) };
  if (!(opciones.body instanceof FormData)) headers["Content-Type"] = "application/json";
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const res = await fetch(`${BASE}${ruta}`, { ...opciones, headers });

  // Si el access token expiró, intenta refrescar una vez
  if (res.status === 401 && reintentar && refreshToken) {
    const ok = await intentarRefresh();
    if (ok) return pedir(ruta, opciones, false);
  }

  const texto = await res.text();
  const data = texto ? JSON.parse(texto) : {};
  if (!res.ok) throw new Error(data.error || "Error en la solicitud.");
  return data;
}

async function intentarRefresh() {
  try {
    const res = await fetch(`${BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    setTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

export const api = {
  // --- auth ---
  register: (body) => pedir("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body) => pedir("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  logout: () => pedir("/auth/logout", { method: "POST", body: JSON.stringify({ refreshToken }) }),
  me: () => pedir("/auth/me"),
  refrescarSesion: async () => {
    const rt = getRefreshGuardado();
    if (!rt) return null;
    refreshToken = rt;
    const ok = await intentarRefresh();
    if (!ok) { limpiarTokens(); return null; }
    return pedir("/auth/me");
  },

  // --- jugadores ---
  jugadores: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return pedir(`/jugadores${qs ? "?" + qs : ""}`);
  },
  jugador: (id) => pedir(`/jugadores/${id}`),
  actualizarMiPerfil: (body) => pedir("/jugadores/me", { method: "PUT", body: JSON.stringify(body) }),
  subirVideo: (formData) => pedir("/jugadores/me/videos", { method: "POST", body: formData }),
  eliminarVideo: (videoId) => pedir(`/jugadores/me/videos/${videoId}`, { method: "DELETE" }),
  subirImagenesJugador: (formData) => pedir("/jugadores/me/imagenes", { method: "POST", body: formData }),

  // --- clubes ---
  clubes: () => pedir("/clubes"),
  club: (id) => pedir(`/clubes/${id}`),
  miClub: () => pedir("/clubes/mi"),
  editarMiClub: (body) => pedir("/clubes/mi", { method: "PUT", body: JSON.stringify(body) }),
  subirImagenesClub: (formData) => pedir("/clubes/mi/imagenes", { method: "POST", body: formData }),

  // --- favoritos ---
  favoritos: () => pedir("/favoritos"),
  alternarFavorito: (jugadorId) => pedir(`/favoritos/${jugadorId}`, { method: "POST" }),
};
