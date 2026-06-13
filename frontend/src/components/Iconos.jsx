// Íconos SVG vectoriales nítidos — reemplazan los emojis "tipo png".
// Heredan el color con currentColor salvo el emblema, que usa la paleta de marca.

export function EmblemaFootSearch({ size = 120 }) {
  // Mitad pelota de futbol (izquierda) + mitad radar de scouting (derecha).
  const uid = "fs";
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="FootSearch">
      <defs>
        <radialGradient id={uid + "-radar"} cx="60%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#FF4438" />
          <stop offset="60%" stopColor="#E2231A" />
          <stop offset="100%" stopColor="#A8120C" />
        </radialGradient>
        <clipPath id={uid + "-disco"}><circle cx="100" cy="100" r="74" /></clipPath>
        <clipPath id={uid + "-izq"}><rect x="22" y="22" width="78" height="156" /></clipPath>
        <clipPath id={uid + "-der"}><rect x="100" y="22" width="78" height="156" /></clipPath>
      </defs>

      {/* Aro exterior */}
      <circle cx="100" cy="100" r="86" fill="#16181D" />
      <circle cx="100" cy="100" r="86" fill="none" stroke="#E2231A" strokeWidth="6" />

      <g clipPath={`url(#${uid}-disco)`}>
        {/* ---------- Mitad izquierda: PELOTA ---------- */}
        <g clipPath={`url(#${uid}-izq)`}>
          <rect x="22" y="22" width="78" height="156" fill="#F4F2EC" />
          {/* pentagono central (negro) */}
          <path d="M100 78 L116 90 L110 109 L90 109 L84 90 Z" fill="#16181D" />
          {/* costuras desde el pentagono hacia afuera */}
          <g stroke="#16181D" strokeWidth="3.2" strokeLinecap="round" fill="none">
            <path d="M100 78 L100 50" />
            <path d="M84 90 L60 80" />
            <path d="M90 109 L80 134" />
          </g>
          {/* parches negros parciales en el borde */}
          <path d="M100 50 L100 28 A72 72 0 0 0 64 40 L60 62 L84 72 Z" fill="#16181D" opacity="0.9" />
          <path d="M44 96 L30 86 A72 72 0 0 0 40 150 L66 132 L60 104 Z" fill="#16181D" opacity="0.9" />
          {/* contorno interno del disco */}
          <circle cx="100" cy="100" r="74" fill="none" stroke="#16181D" strokeWidth="2" opacity="0.18" />
        </g>

        {/* ---------- Mitad derecha: RADAR ---------- */}
        <g clipPath={`url(#${uid}-der)`}>
          <rect x="100" y="22" width="78" height="156" fill={`url(#${uid}-radar)`} />
          {/* anillos */}
          <g fill="none" stroke="#FFFFFF" strokeWidth="1.6" opacity="0.55">
            <circle cx="100" cy="100" r="56" />
            <circle cx="100" cy="100" r="36" />
            <circle cx="100" cy="100" r="16" />
          </g>
          {/* ejes */}
          <g stroke="#FFFFFF" strokeWidth="1.4" opacity="0.5">
            <line x1="100" y1="26" x2="100" y2="174" />
            <line x1="100" y1="100" x2="174" y2="100" />
          </g>
          {/* barrido */}
          <path d="M100 100 L100 28 A72 72 0 0 1 165 60 Z" fill="#FFFFFF" opacity="0.22" />
          <line x1="100" y1="100" x2="160" y2="52" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round" />
          {/* blips dorados */}
          <circle cx="150" cy="76" r="4.5" fill="#FFCF6B" />
          <circle cx="132" cy="130" r="3.6" fill="#FFCF6B" />
          <circle cx="118" cy="150" r="3" fill="#FFCF6B" />
        </g>
      </g>

      {/* linea divisoria vertical */}
      <line x1="100" y1="26" x2="100" y2="174" stroke="#16181D" strokeWidth="3.5" />

      {/* nucleo central */}
      <circle cx="100" cy="100" r="8.5" fill="#16181D" />
      <circle cx="100" cy="100" r="7" fill="#F4F2EC" />
      <circle cx="100" cy="100" r="3.5" fill="#E2231A" />
    </svg>
  );
}

export function MarcaFootSearch({ tam = 22 }) {
  return (
    <span className="marca" style={{ fontSize: tam }}>
      Foot<b>Search</b>
    </span>
  );
}

export function IconBalon({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9.5" />
      <path d="M12 6.5 L15.5 9 L14 13 L10 13 L8.5 9 Z" fill="currentColor" stroke="none" />
      <path d="M12 6.5 L8.5 9 M15.5 9 L18.5 8 M14 13 L16 16.5 M10 13 L8 16.5 M8.5 9 L5.5 8" />
    </svg>
  );
}

export function IconRadar({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="9.5" />
      <circle cx="12" cy="12" r="5" opacity="0.6" />
      <line x1="12" y1="12" x2="19" y2="7" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="16.5" cy="8.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconEscudo({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
      <path d="M12 2.5 L20 5.5 V11 C20 16 16.5 19.5 12 21.5 C7.5 19.5 4 16 4 11 V5.5 Z" />
      <path d="M12 7 L14.5 9 L13.5 12 L10.5 12 L9.5 9 Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconBuscar({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="7" />
      <line x1="16" y1="16" x2="21" y2="21" />
    </svg>
  );
}

export function IconEstrella({ size = 20, llena = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={llena ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
      <path d="M12 3 L14.8 8.6 L21 9.5 L16.5 13.9 L17.6 20 L12 17.1 L6.4 20 L7.5 13.9 L3 9.5 L9.2 8.6 Z" />
    </svg>
  );
}

export function IconPlay({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5 L19 12 L8 19 Z" />
    </svg>
  );
}

export function IconTrofeo({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round">
      <path d="M7 4 H17 V9 A5 5 0 0 1 7 9 Z" />
      <path d="M7 5 H4 V7 A3 3 0 0 0 7 10 M17 5 H20 V7 A3 3 0 0 1 17 10" />
      <line x1="12" y1="14" x2="12" y2="17" /><path d="M8.5 20 H15.5 L15 17 H9 Z" />
    </svg>
  );
}
