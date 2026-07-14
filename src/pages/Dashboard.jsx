import React from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell
} from 'recharts';
import {
  TrendingUp, TrendingDown, Clock, ClipboardList,
  MessageSquare, AlertTriangle, CheckCircle2, ArrowUp, ArrowDown
} from 'lucide-react';
import {
  kpis, cumplimientoAcumulado, produccionPorHora,
  cumplimientoPorLinea, causasDesviacion, objetivoVsCumplimientoLinea, mensajeClave
} from '@/data/mockDashboard';
import KPICard from '@/components/shared/KPICard';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay },
});

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-slate-400 font-bold mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }} className="font-bold">
          {p.name}: {p.value} {p.name !== 'plan' && p.name !== 'objetivo' ? 'uds/h' : '%'}
        </p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">

      {/* ── ROW 1: KPIs principales ─────────────────────────── */}
      <motion.div {...fadeUp(0)} className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
        {/* Cumplimiento plan — grande */}
        <div className="col-span-2 md:col-span-1 xl:col-span-1 card p-5 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent" />
          <p className="section-title mb-3">% Cumplimiento Plan</p>
          {/* Gauge ring */}
          <div className="relative w-24 h-24 mb-2">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#1e293b" strokeWidth="10"/>
              <circle cx="50" cy="50" r="40" fill="none" stroke="#2563eb" strokeWidth="10"
                strokeDasharray={`${2 * Math.PI * 40 * kpis.cumplimientoPlan / 100} ${2 * Math.PI * 40}`}
                strokeLinecap="round" className="transition-all duration-1000"/>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-blue-400">{kpis.cumplimientoPlan}%</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-500">Obj: {kpis.cumplimientoPlanObjetivo}%</p>
          <div className="flex items-center gap-1 mt-1 text-emerald-400 text-xs font-bold">
            <TrendingUp className="w-3 h-3" />
            <span>vs ayer: +{kpis.cumplimientoPlanVsAyer} pp</span>
          </div>
        </div>

        <KPICard title="Producción Planificada" value={kpis.produccionPlanificada.toLocaleString('es')} unit={kpis.unidad} sub="Plan del día" color="slate" />
        <KPICard title="Producción Real" value={kpis.produccionReal.toLocaleString('es')} unit={kpis.unidad} sub="Acumulado día" color="blue" />
        <KPICard
          title="Desviación Acumulada"
          value={kpis.desviacionAcumulada}
          unit={kpis.unidad}
          sub={`${kpis.desviacionPct}% vs plan`}
          color={kpis.desviacionAcumulada >= 0 ? 'green' : 'red'}
        />
        <KPICard title="Ritmo Real" value={kpis.ritmoReal} unit="uds/h" sub={`Obj: ${kpis.ritmoObjetivo} uds/h`} color="blue" />

        {/* Tiempo restante */}
        <div className="card p-4 flex flex-col justify-between">
          <p className="section-title">Tiempo Restante</p>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <span className="text-2xl font-black text-amber-400">{kpis.tiempoRestante}</span>
          </div>
          <p className="text-[10px] text-slate-500">{kpis.tiempoRestanteLabel}</p>
        </div>

        {/* Órdenes del día */}
        <div className="card p-4 flex flex-col justify-between">
          <p className="section-title">Órdenes del Día</p>
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-purple-400 flex-shrink-0" />
            <span className="text-3xl font-black text-purple-400">{kpis.ordenesDia}</span>
          </div>
          <p className="text-[10px] text-slate-500">Unitarias (MTO)</p>
        </div>
      </motion.div>

      {/* ── ROW 2: Gráficos ─────────────────────────────────── */}
      <motion.div {...fadeUp(0.1)} className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Cumplimiento acumulado */}
        <div className="card p-5">
          <h3 className="section-title mb-0">Cumplimiento Acumulado del Plan (%)</h3>
          <div className="flex items-center gap-4 mb-3 mt-2">
            <span className="flex items-center gap-1.5 text-[10px] text-slate-400"><span className="w-3 h-0.5 bg-blue-500 inline-block rounded"/>Plan acumulado</span>
            <span className="flex items-center gap-1.5 text-[10px] text-slate-400"><span className="w-3 h-0.5 bg-emerald-400 inline-block rounded"/>Real acumulado</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={cumplimientoAcumulado} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="hora" tick={{ fill: '#64748b', fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={100} stroke="#f59e0b" strokeDasharray="4 4" />
              <Line type="monotone" dataKey="plan" stroke="#3b82f6" strokeWidth={2} dot={false} name="Plan" />
              <Line type="monotone" dataKey="real" stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', r: 3 }} name="Real" />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex justify-end gap-4 mt-2 text-[10px] text-slate-500">
            <span>Plan: 68%</span>
            <span>Real: <span className="text-emerald-400 font-bold">66%</span></span>
            <span>Desv: <span className="text-red-400 font-bold">-1.9 pp</span></span>
          </div>
        </div>

        {/* Producción por hora */}
        <div className="card p-5">
          <h3 className="section-title mb-0">Producción por Hora (uds/h)</h3>
          <div className="flex items-center gap-4 mb-3 mt-2">
            <span className="flex items-center gap-1.5 text-[10px] text-slate-400"><span className="w-3 h-3 bg-blue-700 inline-block rounded"/>Plan</span>
            <span className="flex items-center gap-1.5 text-[10px] text-slate-400"><span className="w-3 h-3 bg-emerald-500 inline-block rounded"/>Real</span>
            <span className="flex items-center gap-1.5 text-[10px] text-slate-400"><span className="w-3 h-0.5 bg-amber-400 inline-block rounded"/>Objetivo</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={produccionPorHora} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="hora" tick={{ fill: '#64748b', fontSize: 10 }} />
              <YAxis domain={[180, 240]} tick={{ fill: '#64748b', fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={215} stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={1.5} />
              <Bar dataKey="plan" fill="#1d4ed8" radius={[3, 3, 0, 0]} name="Plan" maxBarSize={20} />
              <Bar dataKey="real" radius={[3, 3, 0, 0]} name="Real" maxBarSize={20}>
                {produccionPorHora.map((entry, i) => (
                  <Cell key={i} fill={entry.real >= 215 ? '#10b981' : entry.real !== null ? '#ef4444' : '#334155'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* ── ROW 3: Cumplimiento por línea + Causas + Mensaje ── */}
      <motion.div {...fadeUp(0.2)} className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Cumplimiento por línea */}
        <div className="card p-5">
          <h3 className="section-title">% Cumplimiento Plan por Línea</h3>
          <table className="w-full text-sm">
            <thead>
              <tr>
                {['Línea','Obj.','Cum.','Desv.','Estado'].map(h => (
                  <th key={h} className="table-header text-left first:pl-0">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cumplimientoPorLinea.map(row => (
                <tr key={row.linea} className="hover:bg-slate-800/40 transition-colors">
                  <td className="table-cell font-bold text-slate-200 pl-0">{row.linea}</td>
                  <td className="table-cell text-slate-400">{row.objetivo}%</td>
                  <td className="table-cell font-bold text-white">{row.cumplimiento}%</td>
                  <td className={`table-cell font-bold ${row.desvio >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {row.desvio > 0 ? '+' : ''}{row.desvio} pp
                  </td>
                  <td className="table-cell">
                    {row.estado === 'up'
                      ? <ArrowUp className="w-4 h-4 text-emerald-400" />
                      : <ArrowDown className="w-4 h-4 text-red-400" />}
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-slate-700">
                <td className="px-3 py-2 font-black text-white text-xs pl-0">TOTAL PLANTA</td>
                <td className="px-3 py-2 text-slate-400 text-xs">100%</td>
                <td className="px-3 py-2 font-black text-blue-400 text-xs">97.6%</td>
                <td className="px-3 py-2 font-black text-red-400 text-xs">-2.4 pp</td>
                <td className="px-3 py-2"><ArrowDown className="w-4 h-4 text-red-400" /></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Causas de desviación */}
        <div className="card p-5">
          <h3 className="section-title">Top 5 Causas de Desviación</h3>
          <div className="space-y-3">
            {causasDesviacion.map((c, i) => (
              <div key={i}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-slate-300 font-medium truncate pr-2">{c.causa}</span>
                  <span className="text-xs font-black text-white flex-shrink-0">{c.uds} uds <span className="text-slate-500">({c.pct}%)</span></span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${c.tipo === 'averia' ? 'bg-red-500' : c.tipo === 'material' ? 'bg-amber-500' : c.tipo === 'calidad' ? 'bg-purple-500' : 'bg-blue-500'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${c.pct}%` }}
                    transition={{ delay: 0.3 + i * 0.05, duration: 0.5 }}
                  />
                </div>
              </div>
            ))}
            <div className="pt-2 border-t border-slate-800">
              <div className="flex justify-between text-xs font-bold text-slate-400">
                <span>TOTAL</span><span>7.9 uds · 100%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Objetivo vs Cumplimiento + Mensaje clave */}
        <div className="flex flex-col gap-4">
          {/* Barras obj vs real */}
          <div className="card p-5 flex-1">
            <h3 className="section-title">Objetivo vs Cumplimiento por Línea (uds)</h3>
            <div className="space-y-2">
              {objetivoVsCumplimientoLinea.map(row => (
                <div key={row.linea}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-slate-400">{row.linea}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500">{row.objetivo}</span>
                      <span className={`text-[10px] font-black ${row.diferencia >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {row.diferencia > 0 ? '+' : ''}{row.diferencia}
                      </span>
                    </div>
                  </div>
                  <div className="relative h-2.5 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      className="absolute top-0 left-0 h-full bg-blue-700 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ delay: 0.3, duration: 0.5 }}
                    />
                    <motion.div
                      className={`absolute top-0 left-0 h-full rounded-full ${row.diferencia >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${(row.cumplimiento / row.objetivo) * 100}%` }}
                      transition={{ delay: 0.4, duration: 0.6 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mensaje clave */}
          <div className="card p-4 border-l-4 border-blue-500 bg-blue-500/5">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Mensaje Clave</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{mensajeClave}</p>
          </div>
        </div>
      </motion.div>

      {/* ── ROW 4: Tabla órdenes MTO ────────────────────────── */}
      <motion.div {...fadeUp(0.3)}>
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="section-title mb-0">Seguimiento de Secuencia — Órdenes Unitarias (MTO)</h3>
            <span className="text-[10px] text-slate-500">Última actualización: {kpis.ultimaActualizacion}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  {['Seq','Referencia','Cliente','Fecha Compromiso','Progreso','Cumpl.','Desv.','Estado'].map(h => (
                    <th key={h} className="table-header text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { seq: 1, ref: 'BAT-48V-100Ah', cliente: 'Cliente A', fecha: '31/05/2024 07:30', progreso: 100, cumpl: 100, desv: 0,   estado: 'a_tiempo' },
                  { seq: 2, ref: 'BAT-24V-200Ah', cliente: 'Cliente B', fecha: '31/05/2024 08:11', progreso: 100, cumpl: 100, desv: 0,   estado: 'a_tiempo' },
                  { seq: 3, ref: 'BAT-48V-100Ah', cliente: 'Cliente A', fecha: '31/05/2024 09:00', progreso: 100, cumpl: 100, desv: 0,   estado: 'a_tiempo' },
                  { seq: 4, ref: 'BAT-12V-100Ah', cliente: 'Cliente C', fecha: '31/05/2024 10:30', progreso: 68,  cumpl: 60,  desv: -8,  estado: 'en_riesgo' },
                  { seq: 5, ref: 'BAT-48V-200Ah', cliente: 'Cliente B', fecha: '31/05/2024 11:45', progreso: 42,  cumpl: 0,   desv: -34, estado: 'retrasado' },
                  { seq: 6, ref: 'BAT-24V-100Ah', cliente: 'Cliente D', fecha: '31/05/2024 12:00', progreso: 0,   cumpl: 0,   desv: 0,   estado: 'pendiente' },
                  { seq: 7, ref: 'BAT-48V-100Ah', cliente: 'Cliente A', fecha: '31/05/2024 13:00', progreso: 0,   cumpl: 0,   desv: 0,   estado: 'pendiente' },
                  { seq: 8, ref: 'BAT-12V-200Ah', cliente: 'Cliente E', fecha: '31/05/2024 13:30', progreso: 0,   cumpl: 0,   desv: 0,   estado: 'pendiente' },
                ].map(row => (
                  <tr key={row.seq} className="hover:bg-slate-800/30 transition-colors border-b border-slate-800/50">
                    <td className="table-cell font-mono text-slate-400">{row.seq}</td>
                    <td className="table-cell font-bold text-white font-mono text-xs">{row.ref}</td>
                    <td className="table-cell text-slate-400">{row.cliente}</td>
                    <td className="table-cell text-slate-400 font-mono text-xs">{row.fecha}</td>
                    <td className="table-cell w-32">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${row.estado === 'a_tiempo' ? 'bg-emerald-500' : row.estado === 'en_riesgo' ? 'bg-amber-500' : row.estado === 'retrasado' ? 'bg-red-500' : 'bg-slate-700'}`}
                            style={{ width: `${row.progreso}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 w-8 text-right">{row.progreso}%</span>
                      </div>
                    </td>
                    <td className="table-cell text-center">{row.cumpl > 0 ? `${row.cumpl}%` : '—'}</td>
                    <td className={`table-cell font-bold text-center ${row.desv < 0 ? 'text-red-400' : row.desv > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {row.desv !== 0 ? `${row.desv > 0 ? '+' : ''}${row.desv}` : '—'}
                    </td>
                    <td className="table-cell">
                      <span className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                        row.estado === 'a_tiempo'  ? 'badge-ok' :
                        row.estado === 'en_riesgo' ? 'badge-warn' :
                        row.estado === 'retrasado' ? 'badge-danger' : 'badge-neutral'
                      }`}>
                        {row.estado === 'a_tiempo' ? 'A tiempo' : row.estado === 'en_riesgo' ? 'En riesgo' : row.estado === 'retrasado' ? 'Retrasado' : 'Pendiente'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
