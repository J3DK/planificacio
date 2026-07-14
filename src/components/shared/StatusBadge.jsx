import React from 'react';

const configs = {
  a_tiempo:      { label: 'A tiempo',     cls: 'badge-ok' },
  en_riesgo:     { label: 'En riesgo',    cls: 'badge-warn' },
  retrasado:     { label: 'Retrasado',    cls: 'badge-danger' },
  pendiente:     { label: 'Pendiente',    cls: 'badge-neutral' },
  en_marcha:     { label: 'En marcha',    cls: 'badge-ok' },
  parada:        { label: 'Parada',       cls: 'badge-danger' },
  mantenimiento: { label: 'Mantenimiento',cls: 'badge-warn' },
  abierta:       { label: 'Abierta',      cls: 'badge-danger' },
  cerrada:       { label: 'Cerrada',      cls: 'badge-neutral' },
  critica:       { label: 'Crítica',      cls: 'badge-danger' },
  advertencia:   { label: 'Advertencia',  cls: 'badge-warn' },
  info:          { label: 'Info',         cls: 'badge-info' },
  alta:          { label: 'Alta',         cls: 'badge-danger' },
  media:         { label: 'Media',        cls: 'badge-warn' },
  baja:          { label: 'Baja',         cls: 'badge-ok' },
  up:            { label: '▲',            cls: 'badge-ok' },
  down:          { label: '▼',            cls: 'badge-danger' },
};

export default function StatusBadge({ status, className = '' }) {
  const cfg = configs[status] || { label: status, cls: 'badge-neutral' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${cfg.cls} ${className}`}>
      {cfg.label}
    </span>
  );
}
