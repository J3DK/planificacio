import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, CalendarDays, ListOrdered, Factory,
  BarChart2, CheckSquare, StopCircle, Package, FileBarChart,
  Bell, Menu, X, ChevronRight, Zap, SlidersHorizontal, Cpu, History
} from 'lucide-react';
import { alertas } from '@/data/mockAlertas';

const navItems = [
  { path: '/',                   label: 'Resumen',              icon: LayoutDashboard, exact: true },
  { path: '/panel-operario',     label: 'Terminal Operario',    icon: Cpu },
  { path: '/planificacion',      label: 'Planificación',        icon: CalendarDays },
  { path: '/secuencia',          label: 'Secuencia',            icon: ListOrdered },
  { path: '/lineas',             label: 'Líneas',               icon: Factory },
  { path: '/produccion',         label: 'Producción',           icon: BarChart2 },
  { path: '/calidad',            label: 'Calidad',              icon: CheckSquare },
  { path: '/paradas',            label: 'Paradas',              icon: StopCircle },
  { path: '/materias-primas',    label: 'Materias Primas',      icon: Package },
  { path: '/informes',           label: 'Informes',             icon: FileBarChart },
  { path: '/alertas',            label: 'Alertas',              icon: Bell },
  { path: '/metricas',           label: 'Métricas',             icon: SlidersHorizontal },
  { path: '/historial',          label: 'Historial',            icon: History },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const alertasNoLeidas = alertas.filter(a => !a.leida).length;

  const NavItem = ({ item }) => {
    const isActive = item.exact
      ? location.pathname === item.path
      : location.pathname.startsWith(item.path);

    return (
      <NavLink
        to={item.path}
        onClick={() => setMobileOpen(false)}
        className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative ${
          isActive
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
            : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
        }`}
      >
        <item.icon className={`flex-shrink-0 ${collapsed ? 'w-5 h-5' : 'w-4 h-4'}`} />
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
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-950 border-r border-slate-800">
      {/* Logo */}
      <div className={`flex items-center gap-3 p-4 border-b border-slate-800 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-900/50">
          <Zap className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-white font-black text-sm leading-none tracking-tight">MPS</p>
            <p className="text-slate-500 text-[9px] font-bold uppercase tracking-[0.15em] mt-0.5">Producción</p>
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
        {navItems.map(item => (
          <NavItem key={item.path} item={item} />
        ))}
      </nav>

      {/* Footer info */}
      {!collapsed && (
        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-900 rounded-xl p-3">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-1">Turno Activo</p>
            <p className="text-xs font-bold text-blue-400">Mañana 06:00-14:00</p>
            <p className="text-[10px] text-slate-500 mt-0.5">31/05/2024 · Planta 1</p>
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
