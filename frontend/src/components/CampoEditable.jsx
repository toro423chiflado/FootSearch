import { useState } from "react";

// Icono de lápiz
export function IconLapiz({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

// Campo con edición inline: muestra el valor + lápiz; al pulsar se vuelve editable.
// tipo: text | number | date | textarea | select
export function CampoEditable({ etiqueta, valor, tipo = "text", opciones = [], sufijo = "", onGuardar, placeholder }) {
  const [editando, setEditando] = useState(false);
  const [v, setV] = useState(valor ?? "");
  const [guardando, setGuardando] = useState(false);

  function abrir() { setV(valor ?? ""); setEditando(true); }
  async function confirmar() {
    setGuardando(true);
    try { await onGuardar(v); setEditando(false); }
    finally { setGuardando(false); }
  }

  return (
    <div className="ce">
      <div className="ce-label">{etiqueta}</div>
      {!editando ? (
        <div className="ce-vista" onClick={abrir}>
          <span className="ce-valor">{valor ? `${valor}${sufijo}` : <em className="ce-vacio">{placeholder || "Sin definir"}</em>}</span>
          <button className="ce-lapiz" title="Editar"><IconLapiz /></button>
        </div>
      ) : (
        <div className="ce-edit">
          {tipo === "textarea" ? (
            <textarea autoFocus rows={3} value={v} onChange={(e) => setV(e.target.value)} placeholder={placeholder} />
          ) : tipo === "select" ? (
            <select autoFocus value={v} onChange={(e) => setV(e.target.value)}>
              <option value="">Selecciona...</option>
              {opciones.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : (
            <input autoFocus type={tipo} value={v} onChange={(e) => setV(e.target.value)} placeholder={placeholder}
              max={tipo === "date" ? new Date().toISOString().slice(0,10) : undefined}
              onKeyDown={(e) => { if (e.key === "Enter" && tipo !== "textarea") confirmar(); if (e.key === "Escape") setEditando(false); }} />
          )}
          <div className="ce-acciones">
            <button className="ce-ok" onClick={confirmar} disabled={guardando}>{guardando ? "..." : "Guardar"}</button>
            <button className="ce-cancel" onClick={() => setEditando(false)}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}
