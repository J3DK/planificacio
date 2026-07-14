import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';
import {
  History, Filter, Factory, Activity, CheckSquare, AlertTriangle,
  BarChart2, TrendingUp, RefreshCw
} from 'lucide-react';
import {
  fetchLineas, fetchHistorial
} from '@/services/dataService';

export default function Historial() {
  const [lineas,   setLineas]   = useState([]);
  const [historial, setHistorial] = useState([]);
  const [loading,  setLoading]  = useState(true);

  const [histFiltroLinea,    setHistFiltroLinea]    = useState('todas');
  const [histFiltroProducto, setHistFiltroProducto] = useState('todos');
  const [histFiltroTurno,    setHistFiltroTurno]    = useState('todos');
  const [histFiltroPeriodo,  setHistFiltroPeriodo]  = useState('semana');

  const loadAll = async () => {
    setLoading(true);
    const [resL, resH] = await Promise.all([fetchLineas(), fetchHistorial()]);
    if (resL.data) setLineas(resL.data);
    if (resH.data) setHistorial(resH.data);
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  // ─── Filtrado ────────────────────────────────────────────────────────────────
  const historialFiltrado = useMemo(() => {
    const hoy   = '2026-07-14';
    const hace7 = '2026-07-07';
    const hace30= '2026-06-14';
    return historial.filter(r => {
      if (histFiltroLinea    !== 'todas' && r.linea    !== histFiltroLinea)    return false;
      if (histFiltroProducto !== 'todos' && r.producto !== histFiltroProducto) return false;
      if (histFiltroTurno    !== 'todos' && r.turno    !== histFiltroTurno)    return false;
      if (histFiltroPeriodo === 'hoy'    && r.fecha !== hoy)   return false;
      if (histFiltroPeriodo === 'semana' && r.fecha < hace7)   return false;
      if (histFiltroPeriodo === 'mes'    && r.fecha < hace30)  return false;
      return true;
    });
  }, [historial, histFiltroLinea, histFiltroProducto, histFiltroTurno, histFiltroPeriodo]);

  const histKpis = useMemo(() => {
    if (!historialFiltrado.length) return { producido: 0, oee: '0.0', calidad: '0.0', paradas: 0 };
    const producido = historialFiltrado.reduce((s, r) => s + r.producido, 0);
    const oee       = historialFiltrado.reduce((s, r) => s + r.oee, 0) / historialFiltrado.length;
    const calidad   = historialFiltrado.reduce((s, r) => s + r.calidad, 0) / historialFiltrado.length;
    const paradas   = historialFiltrado.reduce((s, r) => s + r.paradas, 0);
    return { producido, oee: oee.toFixed(1), calidad: calidad.toFixed(1), paradas };
  }, [historialFiltrado]);

  const histGrafico = useMemo(() => {
    const byDate = {};
    historialFiltrado.forEach(r => {
      if (!byDate[r.fecha]) byDate[r.fecha] = { fecha: r.fecha, dia: r.dia, producido: 0, objetivo: 0, oeeSum: 0, count: 0 };
      byDate[r.fecha].producido += r.producido;
      byDate[r.fecha].objetivo  += r.objetivo;
      byDate[r.fecha].oeeSum    += r.oee;
      byDate[r.fecha].count     += 1;
    });
    return Object.values(byDate)
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
      .map(d => ({ ...d, oee: parseFloat((d.oeeSum / d.count).toFixed(1)), label: `${d.dia} ${d.fecha.slice(5)}` }));
  }, [historialFiltrado]);

  const productosUnicos = useMemo(() => [...new Set(historial.map(r => r.producto))], [historial]);

  // ─── KPI cards config ────────────────────────────────────────────────────────
  const kpiCards = [
    { label: 'Total Producido', value: histKpis.producido.toLocaleString(), unit: 'uds',     icon: Factory,       color: 'violet' },
    { label: 'OEE Medio',       value: histKpis.oee,                        unit: '%',        icon: Activity,      color: 'emerald' },
    { label: 'Calidad Media',   value: histKpis.calidad,                    unit: '%',        icon: CheckSquare,   color: 'blue' },
    { label: 'Paradas Totales', value: histKpis.paradas,                    unit: 'eventos',  icon: AlertTriangle, color: 'amber' },
  ];

  const colorMap = {
    violet:  { card: 'border-violet-500/30 from-violet-950/15',  text: 'text-violet-400',  icon: 'text-violet-400' },
    emerald: { card: 'border-emerald-500/30 from-emerald-950/15', text: 'text-emerald-400', icon: 'text-emerald-400' },
    blue:    { card: 'border-blue-500/30 from-blue-950/15',       text: 'text-blue-400',    icon: 'text-blue-400' },
    amber:   { card: 'border-amber-500/30 from-amber-950/15',     text: 'text-amber-400',   icon: 'text-amber-400' },
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">

      {/* CABECERA */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3">
            <History className="w-7 h-7 text-violet-400" />
            Historial de Producción
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">Métricas históricas por línea, producto, turno y período</p>
        </div>
        <button onClick={loadAll} disabled={loading}
          className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-all">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </motion.div>

      {/* FILTROS */}
      <div className="card p-5 border-violet-500/30 bg-gradient-to-br from-violet-950/15 to-slate-900">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-black text-white">Filtros</h3>
            <p className="text-xs text-slate-500">Selecciona línea, producto, turno y período</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Línea */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Línea</label>
            <select value={histFiltroLinea} onChange={e => setHistFiltroLinea(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-violet-500">
              <option value="todas">Todas las líneas</option>
              {lineas.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
            </select>
          </div>
          {/* Producto */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Producto</label>
            <select value={histFiltroProducto} onChange={e => setHistFiltroProducto(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-violet-500">
              <option value="todos">Todos los productos</option>
              {productosUnicos.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          {/* Turno */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Turno</label>
            <select value={histFiltroTurno} onChange={e => setHistFiltroTurno(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-violet-500">
              <option value="todos">Todos los turnos</option>
              <option value="Mañana">Mañana (06-14h)</option>
              <option value="Tarde">Tarde (14-22h)</option>
              <option value="Noche">Noche (22-06h)</option>
            </select>
          </div>
          {/* Período */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Período</label>
            <div className="flex gap-1">
              {['hoy', 'semana', 'mes'].map(p => (
                <button key={p} onClick={() => setHistFiltroPeriodo(p)}
                  className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${
                    histFiltroPeriodo === p ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}>
                  {p === 'hoy' ? 'Hoy' : p === 'semana' ? '7d' : '30d'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiCards.map(k => {
          const c = colorMap[k.color];
          return (
            <div key={k.label} className={`card p-5 border bg-gradient-to-br to-slate-900 ${c.card}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-slate-400 uppercase">{k.label}</span>
                <k.icon className={`w-4 h-4 ${c.icon}`} />
              </div>
              <div className="flex items-baseline gap-1">
                <span className={`text-3xl font-black font-mono ${c.text}`}>{k.value}</span>
                <span className="text-xs text-slate-500 font-bold">{k.unit}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* GRÁFICOS */}
      {histGrafico.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Barras: Producción Real vs Objetivo */}
          <div className="card p-5">
            <h4 className="font-black text-white text-sm mb-4 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-violet-400" />
              Producción Real vs Objetivo por Día
            </h4>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={histGrafico} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12, color: '#fff', fontSize: 12 }}
                  cursor={{ fill: 'rgba(139,92,246,0.08)' }} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                <Bar dataKey="objetivo" name="Objetivo" fill="#334155" radius={[4,4,0,0]} />
                <Bar dataKey="producido" name="Producido" fill="#7c3aed" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Líneas: Evolución OEE */}
          <div className="card p-5">
            <h4 className="font-black text-white text-sm mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Evolución OEE (%) en el Período
            </h4>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={histGrafico} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <YAxis domain={[60, 100]} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12, color: '#fff', fontSize: 12 }} />
                <ReferenceLine y={85} stroke="#f59e0b" strokeDasharray="5 5"
                  label={{ value: 'Obj. 85%', fill: '#f59e0b', fontSize: 10, position: 'right' }} />
                <Line type="monotone" dataKey="oee" name="OEE %" stroke="#10b981" strokeWidth={3}
                  dot={{ fill: '#10b981', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="card p-10 text-center text-slate-500">
          <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-bold">No hay registros para los filtros seleccionados</p>
          <p className="text-xs mt-1">Prueba a ampliar el período o cambiar los filtros</p>
        </div>
      )}

      {/* TABLA DETALLADA */}
      {historialFiltrado.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800 flex justify-between items-center">
            <h4 className="font-black text-white text-sm">
              Detalle por Turno — <span className="text-violet-400">{historialFiltrado.length} registros</span>
            </h4>
            <span className="text-xs text-slate-500 font-mono">Filtrado</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] text-slate-400 uppercase">
                  {['Fecha','Línea','Turno','Producto','Producido','Objetivo','OEE%','Calidad%','Paradas'].map(h => (
                    <th key={h} className="table-header text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs font-bold">
                {historialFiltrado.map(r => {
                  const cumple = r.producido >= r.objetivo;
                  return (
                    <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="table-cell font-mono text-slate-300">{r.fecha}</td>
                      <td className="table-cell text-white">{r.lineaNombre}</td>
                      <td className="table-cell">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                          r.turno === 'Mañana' ? 'bg-amber-500/20 text-amber-300' :
                          r.turno === 'Tarde'  ? 'bg-blue-500/20 text-blue-300' :
                                                 'bg-slate-700 text-slate-300'
                        }`}>{r.turno}</span>
                      </td>
                      <td className="table-cell font-mono text-cyan-400">{r.producto}</td>
                      <td className={`table-cell font-mono ${cumple ? 'text-emerald-400' : 'text-amber-400'}`}>{r.producido}</td>
                      <td className="table-cell font-mono text-slate-400">{r.objetivo}</td>
                      <td className={`table-cell font-mono ${r.oee >= 85 ? 'text-emerald-400' : r.oee >= 75 ? 'text-amber-400' : 'text-red-400'}`}>{r.oee}%</td>
                      <td className={`table-cell font-mono ${r.calidad >= 97 ? 'text-emerald-400' : 'text-amber-400'}`}>{r.calidad}%</td>
                      <td className={`table-cell font-mono ${r.paradas > 2 ? 'text-red-400' : r.paradas > 0 ? 'text-amber-400' : 'text-slate-500'}`}>{r.paradas}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
