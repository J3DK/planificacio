import React, { useState, useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, CalendarDays, ListOrdered, Factory, Users,
  BarChart2, CheckSquare, StopCircle, Package, FileBarChart,
  Bell, Menu, X, ChevronRight, Zap, SlidersHorizontal, Cpu, History, Settings, Boxes, Wrench, Award
} from 'lucide-react';
import { alertas } from '@/data/mockAlertas';
import { useAppConfig } from '@/services/configService';
import { getCurrentShiftInfo } from '@/services/dataService';

const ICON_MAP = {
  LayoutDashboard, CalendarDays, ListOrdered, Factory, Users, Boxes,
  BarChart2, CheckSquare, StopCircle, Package, FileBarChart,
  Bell, SlidersHorizontal, Cpu, History, Settings, Wrench, Award
};

const navItems = [
  { path: '/',                   label: 'Resumen',              iconName: 'LayoutDashboard', exact: true },
  { path: '/panel-operario',     label: 'Terminal Operario',    iconName: 'Cpu' },
  { path: '/planificacion',      label: 'Planificación',        iconName: 'CalendarDays' },
  { path: '/secuencia',          label: 'Secuencia',            iconName: 'ListOrdered' },
  { path: '/lineas',             label: 'Líneas',               iconName: 'Factory' },
  { path: '/operarios',          label: 'Operarios',            iconName: 'Users' },
  { path: '/cualificaciones',    label: 'Cualificación & Cursos',   iconName: 'Award' },
  { path: '/productos',          label: 'Productos',            iconName: 'Boxes' },
  { path: '/produccion',         label: 'Producción',           iconName: 'BarChart2' },
  { path: '/calidad',            label: 'Calidad',              iconName: 'CheckSquare' },
  { path: '/paradas',            label: 'Paradas',              iconName: 'StopCircle' },
  { path: '/mantenimiento',      label: 'Mantenimiento',        iconName: 'Wrench' },
  { path: '/materias-primas',    label: 'Materias Primas',      iconName: 'Package' },
  { path: '/informes',           label: 'Informes',             iconName: 'FileBarChart' },
  { path: '/alertas',            label: 'Alertas',              iconName: 'Bell' },
  { path: '/metricas',           label: 'Métricas',             iconName: 'SlidersHorizontal' },
  { path: '/historial',          label: 'Historial',            iconName: 'History' },
  { path: '/configuracion',      label: 'Configuración',        iconName: 'Settings' },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const appConfig = useAppConfig();
  const shiftInfo = getCurrentShiftInfo();

  const activeNavList = useMemo(() => {
    const baseList = (appConfig.menuOrder && Array.isArray(appConfig.menuOrder) && appConfig.menuOrder.length > 0)
      ? appConfig.menuOrder.filter(i => i.visible !== false)
      : navItems;

    let list = [...baseList];
    if (!list.some(i => i.path === '/cualificaciones')) {
      const opIdx = list.findIndex(i => i.path === '/operarios');
      const cualifItem = { path: '/cualificaciones', label: 'Cualificación & Cursos', iconName: 'Award', visible: true };
      if (opIdx >= 0) {
        list.splice(opIdx + 1, 0, cualifItem);
      } else {
        list.push(cualifItem);
      }
    }
    return list;
  }, [appConfig.menuOrder]);

  const alertasNoLeidas = alertas.filter(a => !a.leida).length;

  const NavItem = ({ item }) => {
    const isActive = item.exact
      ? location.pathname === item.path
      : location.pathname.startsWith(item.path);

    const IconComponent = item.icon || ICON_MAP[item.iconName] || Zap;

    const currentTab = new URLSearchParams(location.search).get('tab') || 'skills';

    return (
      <div className="space-y-1">
        <NavLink
          to={item.path}
          onClick={() => setMobileOpen(false)}
          className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative ${
            isActive
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
          }`}
        >
          <IconComponent className={`flex-shrink-0 ${collapsed ? 'w-5 h-5' : 'w-4 h-4'}`} />
          {!collapsed && (
            <span className="text-sm font-semibold truncate">{item.label}</span>
          )}
          {/* Badge alertas */}
          {item.path === '/alertas' && alertasNoLeidas > 0 && (
            <span className={`absolute ${collapsed ? 'top-0.5 right-0.5' : 'right-3'} bg-red-500 text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center`}>
              {alertasNoLeidas}
            </span>
          )}
          {!collapsed && isActive && <ChevronRight className="w-3 h-3 ml-auto opacity-60" />}
        </NavLink>

        {/* Submenú de Cualificación y Cursos en Sidebar principal */}
        {item.path === '/cualificaciones' && isActive && !collapsed && (
          <div className="ml-4 pl-3 border-l-2 border-slate-800/80 space-y-1 pt-1 pb-1">
            <NavLink
              to="/cualificaciones?tab=skills"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currentTab === 'skills'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <span>⭐ Skills & Habilidades</span>
            </NavLink>
            <NavLink
              to="/cualificaciones?tab=formaciones"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currentTab === 'formaciones'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <span>🎓 Cursos & Formaciones</span>
            </NavLink>
            <NavLink
              to="/cualificaciones?tab=capacitaciones"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currentTab === 'capacitaciones'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <span>🎯 Planes de Capacitación</span>
            </NavLink>
            <NavLink
              to="/cualificaciones?tab=permisos"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currentTab === 'permisos'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <span>🛡️ Permisos por Equipo</span>
            </NavLink>
            <NavLink
              to="/cualificaciones?tab=matriz"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currentTab === 'matriz'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <span>📊 Matriz ILUO (Polivalencia)</span>
            </NavLink>
          </div>
        )}
      </div>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-950 border-r border-slate-800">
      {/* Logo */}
      <div className={`flex items-center gap-3 p-4 border-b border-slate-800 ${collapsed ? 'justify-center' : ''}`}>
        {appConfig.logoUrl ? (
          <img
            src={appConfig.logoUrl}
            alt="Logo Empresa"
            className={`object-contain transition-all flex-shrink-0 ${collapsed ? 'w-8 h-8 rounded-lg' : 'h-8 max-w-[100px]'}`}
          />
        ) : (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-900/50">
            <Zap className="w-4 h-4 text-white" />
          </div>
        )}
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-white font-black text-sm leading-none tracking-tight truncate">{appConfig.nombreEmpresa || 'MPS'}</p>
            <p className="text-slate-500 text-[9px] font-bold uppercase tracking-[0.15em] mt-0.5 truncate">{appConfig.subtituloEmpresa || 'Producción'}</p>
          </div>
        )}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="ml-auto text-slate-600 hover:text-slate-300 transition-colors"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="flex justify-center p-2 text-slate-600 hover:text-slate-300 transition-colors border-b border-slate-800"
        >
          <Menu className="w-4 h-4" />
        </button>
      )}

      {/* Nav items */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto no-scrollbar">
        {!collapsed && (
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-700 px-3 py-2">Módulos</p>
        )}
        {activeNavList.map(item => (
          <React.Fragment key={item.path}>
            {item.path === '/configuracion' && !collapsed && (
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-700 px-3 pt-4 pb-1 mt-3 border-t border-slate-800/80">Sistema</p>
            )}
            <NavItem item={item} />
          </React.Fragment>
        ))}
      </nav>

      {/* Footer info */}
      {!collapsed && (
        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-900 rounded-xl p-3">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-1">Turno Activo</p>
            <p className={`text-xs font-bold ${shiftInfo.shift === 'Mañana' ? 'text-amber-400' : shiftInfo.shift === 'Tarde' ? 'text-blue-400' : 'text-purple-400'}`}>{shiftInfo.shortLabel}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{shiftInfo.dateStr} · Planta 1</p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col fixed inset-y-0 left-0 z-30 transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'}`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile toggle */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 bg-slate-900 border border-slate-700 rounded-xl p-2 text-slate-300"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <aside className="absolute left-0 top-0 bottom-0 w-64 z-50">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
