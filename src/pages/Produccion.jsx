import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Cell, Legend
} from 'recharts';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import { 
  fetchProduccion, 
  agregarProduccionPorHora, 
  agregarProduccionDiaria, 
  agregarProduccionSemanal, 
  agregarVelocidadPorLinea, 
  agregarKpisProduccion 
} from '@/services/dataService';
import KPICard from '@/components/shared/KPICard';

const TABS = ['Por hora', 'Diario', 'Semanal', 'Por línea'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-slate-400 font-bold mb-1">{label}</p>
      {payload.map(p => p.value !== null && (
        <p key={p.name} style={{ color: p.color }} className="font-bold">{p.name}: {p.value} uds/h</p>
      ))}
    </div>
  );
};

export default function Produccion() {
  const [tab, setTab] = useState(0);
  const [produccionRaw, setProduccionRaw] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    const { data } = await fetchProduccion();
    if (data) setProduccionRaw(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  useRealtimeSync('produccion', loadData);

  const produccionPorHora = useMemo(() => agregarProduccionPorHora(produccionRaw), [produccionRaw]);
  const produccionHistorica = useMemo(() => agregarProduccionDiaria(produccionRaw), [produccionRaw]);
  const produccionSemanal = useMemo(() => agregarProduccionSemanal(produccionRaw), [produccionRaw]);
  const velocidadPorHora = useMemo(() => agregarVelocidadPorLinea(produccionRaw), [produccionRaw]);
  const kpis = useMemo(() => agregarKpisProduccion(produccionRaw), [produccionRaw]);

  // Fallbacks if data is empty
  const hasData = produccionRaw.length > 0;
  const hasTodayData = produccionPorHora.length > 0;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-black text-white">Producción</h2>
        <p className="text-slate-500 text-sm">Seguimiento producción real vs objetivo</p>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard title="Producción Real" value={kpis.produccionReal.toLocaleString('es')} unit="uds" color="blue" size="lg" />
        <KPICard title="Plan del Día" value={kpis.produccionPlanificada.toLocaleString('es')} unit="uds" color="slate" size="lg" />
        <KPICard title="Desviación" value={kpis.desviacionAcumulada} unit="uds" sub={`${kpis.desviacionPct}% vs plan`} color={kpis.desviacionAcumulada >= 0 || kpis.desviacionAcumulada.startsWith('+') ? 'green' : 'red'} size="lg" />
        <KPICard title="Ritmo Actual" value={kpis.ritmoReal} unit="uds/h" sub={`Obj: ${kpis.ritmoObjetivo} uds/h`} color="purple" size="lg" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800 w-fit">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${tab === i ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Chart */}
      <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-6">
        {tab === 0 && (
          <>
            <h3 className="section-title mb-4">Producción por Hora — Hoy (uds/h)</h3>
            {!hasTodayData ? (
              <div className="flex items-center justify-center h-[280px] bg-slate-900/50 rounded-xl border border-dashed border-slate-700 text-slate-500">
                Aún no hay datos suficientes de hoy
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={produccionPorHora} margin={{ top: 5, right: 10, left: -10, bottom: 0 }} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="hora" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis domain={[180, 240]} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={215} stroke="#f59e0b" strokeDasharray="5 5" strokeWidth={1.5} label={{ value: 'Obj 215', fill: '#f59e0b', fontSize: 10 }} />
                  <Bar dataKey="plan" fill="#1d4ed8" radius={[4, 4, 0, 0]} name="Plan" maxBarSize={28} />
                  <Bar dataKey="real" radius={[4, 4, 0, 0]} name="Real" maxBarSize={28}>
                    {produccionPorHora.map((e, i) => (
                      <Cell key={i} fill={e.real === null ? '#1e293b' : e.real >= 215 ? '#10b981' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </>
        )}
        {tab === 1 && (
          <>
            <h3 className="section-title mb-4">Producción Diaria — Semana actual</h3>
            {!hasData || produccionHistorica.length === 0 ? (
              <div className="flex items-center justify-center h-[280px] bg-slate-900/50 rounded-xl border border-dashed border-slate-700 text-slate-500">
                Aún no hay datos suficientes de esta semana
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={produccionHistorica} margin={{ top: 5, right: 10, left: -10, bottom: 0 }} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="dia" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis domain={[1100, 1350]} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={1250} stroke="#f59e0b" strokeDasharray="5 5" strokeWidth={1.5} />
                  <Bar dataKey="plan" fill="#1d4ed8" radius={[4, 4, 0, 0]} name="Plan" maxBarSize={32} />
                  <Bar dataKey="real" radius={[4, 4, 0, 0]} name="Real" maxBarSize={32}>
                    {produccionHistorica.map((e, i) => (
                      <Cell key={i} fill={e.real >= e.plan ? '#10b981' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </>
        )}
        {tab === 2 && (
          <>
            <h3 className="section-title mb-4">Producción Semanal</h3>
            {!hasData || produccionSemanal.length === 0 ? (
              <div className="flex items-center justify-center h-[280px] bg-slate-900/50 rounded-xl border border-dashed border-slate-700 text-slate-500">
                Aún no hay datos suficientes históricos
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={produccionSemanal} margin={{ top: 5, right: 10, left: -10, bottom: 0 }} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="semana" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis domain={[5800, 6600]} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={6250} stroke="#f59e0b" strokeDasharray="5 5" strokeWidth={1.5} />
                  <Bar dataKey="plan" fill="#1d4ed8" radius={[4, 4, 0, 0]} name="Plan" maxBarSize={36} />
                  <Bar dataKey="real" radius={[4, 4, 0, 0]} name="Real" maxBarSize={36}>
                    {produccionSemanal.map((e, i) => (
                      <Cell key={i} fill={e.real >= e.plan ? '#10b981' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </>
        )}
        {tab === 3 && (
          <>
            <h3 className="section-title mb-4">Velocidad por Línea y Hora (uds/h)</h3>
            {!hasTodayData ? (
              <div className="flex items-center justify-center h-[280px] bg-slate-900/50 rounded-xl border border-dashed border-slate-700 text-slate-500">
                Aún no hay datos de velocidad de hoy
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={velocidadPorHora} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="hora" tick={{ fill: '#64748b', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    {[
                      { key: 'l1', color: '#3b82f6' },
                      { key: 'l2', color: '#10b981' },
                      { key: 'l3', color: '#ef4444' },
                      { key: 'l4', color: '#8b5cf6' },
                      { key: 'l5', color: '#f59e0b' },
                    ].map(l => (
                      <Line key={l.key} type="monotone" dataKey={l.key} stroke={l.color} strokeWidth={2} dot={{ r: 3, fill: l.color }} name={l.key.toUpperCase()} connectNulls={false} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
                <div className="flex gap-4 justify-center mt-3 flex-wrap">
                  {[['L1','#3b82f6'],['L2','#10b981'],['L3','#ef4444'],['L4','#8b5cf6'],['L5','#f59e0b']].map(([l,c]) => (
                    <span key={l} className="flex items-center gap-1.5 text-[10px] text-slate-400">
                      <span className="w-3 h-1 rounded-full inline-block" style={{ backgroundColor: c }} />{l}
                    </span>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}
