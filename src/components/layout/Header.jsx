import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Bell, RefreshCw, Clock, Cpu } from 'lucide-react';
import { alertas } from '@/data/mockAlertas';
import SupabaseStatus from '@/components/shared/SupabaseStatus';

const routeTitles = {
  '/':              { title: 'Dashboard · Resumen',           sub: 'Plan Maestro de Producción — MPS' },
  '/panel-operario':{ title: 'Terminal Operario · Captura Manual', sub: 'Declaración en planta de producción, paradas y consumos' },
  '/planificacion': { title: 'Planificación de Líneas',       sub: 'Gestión de capacidad y carga' },
  '/secuencia':     { title: 'Secuencia de Fabricación',      sub: 'Órdenes MTO priorizadas' },
  '/lineas':        { title: 'Líneas de Producción',          sub: 'Estado y OEE por línea' },
  '/produccion':    { title: 'Producción',                    sub: 'Seguimiento producción real vs objetivo' },
  '/calidad':       { title: 'Calidad',                       sub: 'FPY · Scrap · Retrabajos' },
  '/paradas':       { title: 'Paradas',                       sub: 'Registro y análisis de paradas' },
  '/materias-primas':{ title: 'Materias Primas',              sub: 'Stock · Consumo · Pedidos pendientes' },
  '/informes':      { title: 'Informes',                      sub: 'Generación y exportación de informes' },
  '/alertas':       { title: 'Centro de Alertas',             sub: 'Notificaciones activas' },
  '/metricas':      { title: 'Métricas del Dashboard',         sub: 'Configura widgets y umbrales del panel' },
};

export default function Header() {
  const location = useLocation();
  const route = routeTitles[location.pathname] || { title: location.pathname, sub: '' };
  const alertasNoLeidas = alertas.filter(a => !a.leida).length;
  const now = new Date();
  const timeStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-60 z-20 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-6 py-3 flex items-center gap-4 transition-all duration-300">
      {/* Title area — offset for mobile hamburger */}
      <div className="flex-1 min-w-0 pl-10 lg:pl-0">
        <h1 className="text-white font-black text-base leading-tight tracking-tight truncate">{route.title}</h1>
        <p className="text-slate-500 text-[10px] font-medium uppercase tracking-widest">{route.sub}</p>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Botón rápido Terminal Operario */}
        <Link
          to="/panel-operario"
          className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs px-3 py-1.5 rounded-lg shadow-md shadow-blue-900/30 transition-all active:scale-95"
          title="Abrir Terminal de Operario (Modo Planta Independiente)"
        >
          <Cpu className="w-3.5 h-3.5 animate-pulse" />
          <span className="hidden sm:inline">Modo Operario</span>
        </Link>

        {/* Clock */}
        <div className="hidden sm:flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5">
          <Clock className="w-3 h-3 text-slate-500" />
          <span className="text-xs font-bold text-slate-300 font-mono">{timeStr}</span>
        </div>

        {/* Refresh */}
        <button className="p-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all">
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* Alertas */}
        <Link to="/alertas" className="relative p-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all">
          <Bell className="w-4 h-4" />
          {alertasNoLeidas > 0 && (
            <span className="absolute top-1 right-1 bg-red-500 rounded-full w-2 h-2 animate-pulse" />
          )}
        </Link>

        {/* Supabase Connection Status */}
        <SupabaseStatus />

        {/* Turno badge */}
        <div className="hidden md:flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 rounded-lg px-3 py-1.5">
          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
          <span className="text-blue-400 text-xs font-bold">Turno Mañana</span>
        </div>
      </div>
    </header>
  );
}
