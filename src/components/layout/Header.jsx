import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Bell, RefreshCw, Clock, Cpu, ShieldCheck } from 'lucide-react';
import SupabaseStatus from '@/components/shared/SupabaseStatus';
import { getCurrentShiftInfo, fetchAlertas } from '@/services/dataService';

const routeTitles = {
  '/':              { title: 'Dashboard · Resumen',           sub: 'Plan Maestro de Producción — MPS' },
  '/panel-operario':{ title: 'Terminal Operario · Captura Manual', sub: 'Declaración en planta de producción, paradas y consumos' },
  '/panel-calidad': { title: 'Terminal Calidad · Inspector en Planta', sub: 'Registro ágil de defectos, retrabajos, scrap, checklist y retenciones' },
  '/planificacion': { title: 'Planificación de Líneas',       sub: 'Gestión de capacidad y carga' },
  '/secuencia':     { title: 'Secuencia de Fabricación',      sub: 'Órdenes MTO priorizadas' },
  '/lineas':        { title: 'Líneas de Producción',          sub: 'Estado y OEE por línea · Asignación en vivo de personal' },
  '/operarios':     { title: 'Operarios & Plantilla',         sub: 'Fichas individuales, skills y asignación de turno por línea' },
  '/cualificaciones':{ title: 'Skills, Formación & Permisos',  sub: 'Catálogo Maestro de Cualificaciones y Matriz de Competencias' },
  '/productos':     { title: 'Catálogo de Productos y BOM',   sub: 'Listado de productos terminados, fórmulas y escandallos' },
  '/produccion':    { title: 'Producción',                    sub: 'Seguimiento producción real vs objetivo' },
  '/calidad':       { title: 'Calidad',                       sub: 'FPY · Scrap · Retrabajos' },
  '/paradas':       { title: 'Paradas',                       sub: 'Registro y análisis de paradas' },
  '/mantenimiento': { title: 'Mantenimiento & Activos (GMAO)',sub: 'Gestión de OT, repuestos y sensores predictivos' },
  '/materias-primas':{ title: 'Materias Primas',              sub: 'Stock · Consumo · Pedidos pendientes' },
  '/informes':      { title: 'Informes',                      sub: 'Generación y exportación de informes' },
  '/alertas':       { title: 'Centro de Alertas',             sub: 'Notificaciones activas' },
  '/metricas':      { title: 'Métricas del Dashboard',        sub: 'Configura widgets y umbrales del panel' },
  '/historial':     { title: 'Historial de Operaciones',      sub: 'Auditoría y trazabilidad' },
  '/configuracion': { title: 'Configuración de Empresa',      sub: 'Preferencias, turnos y personalización' },
};

export default function Header() {
  const location = useLocation();
  const route = routeTitles[location.pathname] || { title: location.pathname, sub: '' };
  const [alertas, setAlertas] = useState([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await fetchAlertas();
      if (data) setAlertas(data);
    };
    load();
    const h = () => load();
    window.addEventListener('alertas_updated', h);
    return () => window.removeEventListener('alertas_updated', h);
  }, []);

  const alertasNoLeidas = alertas.filter(a => !a.leida).length;
  const now = new Date();
  const timeStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  const shiftInfo = getCurrentShiftInfo();

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

        {/* Botón rápido Terminal Calidad */}
        <Link
          to="/panel-calidad"
          className="flex items-center gap-1.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs px-3 py-1.5 rounded-lg shadow-md shadow-red-900/30 transition-all active:scale-95"
          title="Abrir Terminal de Calidad e Inspección en Planta"
        >
          <ShieldCheck className="w-3.5 h-3.5 animate-pulse" />
          <span className="hidden sm:inline">Modo Calidad</span>
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
        <div className={`hidden md:flex items-center gap-2 border rounded-lg px-3 py-1.5 ${
          shiftInfo.shift === 'Mañana' ? 'bg-amber-500/20 border-amber-500/30 text-amber-300' :
          shiftInfo.shift === 'Tarde'  ? 'bg-blue-500/20 border-blue-500/30 text-blue-300' :
                                         'bg-purple-500/20 border-purple-500/30 text-purple-300'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
            shiftInfo.shift === 'Mañana' ? 'bg-amber-400' :
            shiftInfo.shift === 'Tarde'  ? 'bg-blue-400' :
                                           'bg-purple-400'
          }`} />
          <span className="text-xs font-bold">Turno {shiftInfo.shift}</span>
        </div>
      </div>
    </header>
  );
}
