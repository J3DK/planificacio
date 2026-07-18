import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell
} from 'recharts';
import {
  TrendingUp, TrendingDown, Clock, ClipboardList,
  MessageSquare, AlertTriangle, CheckCircle2, ArrowUp, ArrowDown, Wrench,
  X, Sliders, RefreshCw, Layers
} from 'lucide-react';
import {
  kpis, cumplimientoAcumulado, produccionPorHora,
  cumplimientoPorLinea, causasDesviacion, objetivoVsCumplimientoLinea, mensajeClave
} from '@/data/mockDashboard';
import { alertas as mockAlertas } from '@/data/mockAlertas';
import KPICard from '@/components/shared/KPICard';
import { fetchLineas, fetchMateriasPrimas, fetchCalidad, fetchSecuencia, updateLinea, getCurrentShiftInfo , generarSintesisAutomatica } from '@/services/dataService';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';


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

const SemiCircleGauge = ({ value = 0, color = '#84cc16' }) => {
  const r = 44;
  const arcLength = Math.PI * r;
  const dash = Math.min(1, Math.max(0, value / 100)) * arcLength;

  return (
    <div className="relative w-28 h-16 mx-auto my-1 flex items-end justify-center">
      <svg viewBox="0 0 120 65" className="w-full h-full absolute inset-0">
        <path d="M 16 55 A 44 44 0 0 1 104 55" fill="none" stroke="#334155" strokeWidth="10" strokeLinecap="round" />
        <path
          d="M 16 55 A 44 44 0 0 1 104 55"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${arcLength}`}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <span className="relative z-10 text-xl font-black text-white pb-0.5 tracking-tight">
        {Number(value).toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
      </span>
    </div>
  );
};

export default function Dashboard() {
  const alertasMtoCriticas = mockAlertas.filter(a => a.modulo === 'mantenimiento' && a.tipo === 'critica' && !a.leida);

  const [modalFicha, setModalFicha] = useState(null); // null | 'cumplimiento' | 'tiempo'
  const [lineasData, setLineasData] = useState([]);
  const [guardandoLineas, setGuardandoLineas] = useState(false);

  const [kpisMain, setKpisMain] = useState(() => {
    const shiftInfo = getCurrentShiftInfo();
    return {
      cumplimientoPlan: kpis.cumplimientoPlan,
      cumplimientoPlanObjetivo: kpis.cumplimientoPlanObjetivo,
      cumplimientoPlanVsAyer: kpis.cumplimientoPlanVsAyer,
      produccionPlanificada: kpis.produccionPlanificada,
      produccionReal: kpis.produccionReal,
      desviacionAcumulada: kpis.desviacionAcumulada,
      desviacionPct: kpis.desviacionPct,
      ritmoReal: kpis.ritmoReal,
      ritmoObjetivo: kpis.ritmoObjetivo,
      tiempoRestante: shiftInfo.tiempoRestante,
      tiempoRestanteLabel: shiftInfo.tiempoRestanteLabel,
      turno: shiftInfo.label,
      horarioTurno: `${shiftInfo.horario} (Rotativo según reloj)`,
      ordenesDia: kpis.ordenesDia,
      unidad: kpis.unidad,
    };
  });

  const [indicadores, setIndicadores] = useState({
    disponibilidad: 92.6,
    rendimiento: 97.4,
    calidad: 98.8,
    oee: 88.7,
    tiempoCiclo: 6.2,
    scrap: 640,
    disponibilidadMaterial: 96.5,
  });

    useRealtimeSync('lineas', () => window.dispatchEvent(new CustomEvent('lineas_updated')));
  useRealtimeSync('paradas', () => window.dispatchEvent(new CustomEvent('paradas_updated')));
  useRealtimeSync('calidad', () => window.dispatchEvent(new CustomEvent('calidad_updated')));
  useRealtimeSync('alertas', () => window.dispatchEvent(new CustomEvent('alertas_updated')));
  useRealtimeSync('ordenes_trabajo', () => window.dispatchEvent(new CustomEvent('mantenimiento_updated')));


  useEffect(() => {
    const loadSintesis = async () => {
      const txt = await generarSintesisAutomatica('dashboard');
      setSintesis(txt);
    };
    loadSintesis();
    window.addEventListener('dashboard_updated', loadSintesis);
    window.addEventListener('lineas_updated', loadSintesis); // fallback for dashboard
    return () => {
      window.removeEventListener('dashboard_updated', loadSintesis);
      window.removeEventListener('lineas_updated', loadSintesis);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const cargarIndicadores = async () => {
      try {
        const [resLineas, resMat, resCal, resSec] = await Promise.all([
          fetchLineas(),
          fetchMateriasPrimas(),
          fetchCalidad(),
          fetchSecuencia()
        ]);
        if (!mounted) return;

        const lineas = resLineas?.data || [];
        const materiales = resMat?.data || [];
        const calidadList = resCal?.data || [];
        const secuenciaList = resSec?.data || [];

        setLineasData(lineas);

        // ── 1. CÁLCULO DINÁMICO DE FICHAS PRINCIPALES (ROW 1) ────────────────
        if (lineas.length > 0) {
          const totalPlan = lineas.reduce((acc, l) => acc + (Number(l.objetivoHoy ?? l.objetivo_hoy) || 0), 0);
          const totalReal = lineas.reduce((acc, l) => acc + (Number(l.produccionHoy ?? l.produccion_hoy) || 0), 0);
          
          const cump = totalPlan > 0 ? Number(((totalReal / totalPlan) * 100).toFixed(1)) : kpis.cumplimientoPlan;
          const desv = totalReal - totalPlan;
          const desvPct = totalPlan > 0 ? Number(((desv / totalPlan) * 100).toFixed(1)) : kpis.desviacionPct;

          const activas = lineas.filter(l => (Number(l.velocidadActual ?? l.velocidad_actual) || 0) > 0);
          const velReal = activas.length > 0
            ? Math.round(activas.reduce((acc, l) => acc + Number(l.velocidadActual ?? l.velocidad_actual), 0) / activas.length)
            : kpis.ritmoReal;
          const velObj = activas.length > 0
            ? Math.round(activas.reduce((acc, l) => acc + Number(l.velocidadNominal ?? l.velocidad_nominal), 0) / activas.length)
            : kpis.ritmoObjetivo;

          const shiftInfo = getCurrentShiftInfo();
          const ordCount = secuenciaList.length > 0 ? secuenciaList.length : kpis.ordenesDia;

          setKpisMain({
            cumplimientoPlan: cump || 97.6,
            cumplimientoPlanObjetivo: 100,
            cumplimientoPlanVsAyer: +1.8,
            produccionPlanificada: totalPlan > 0 ? totalPlan : kpis.produccionPlanificada,
            produccionReal: totalReal > 0 ? totalReal : kpis.produccionReal,
            desviacionAcumulada: totalPlan > 0 ? desv : kpis.desviacionAcumulada,
            desviacionPct: totalPlan > 0 ? desvPct : kpis.desviacionPct,
            ritmoReal: velReal || kpis.ritmoReal,
            ritmoObjetivo: velObj || kpis.ritmoObjetivo,
            tiempoRestante: shiftInfo.tiempoRestante,
            tiempoRestanteLabel: shiftInfo.tiempoRestanteLabel,
            turno: shiftInfo.label,
            horarioTurno: `${shiftInfo.horario} (Rotativo según reloj)`,
            ordenesDia: ordCount,
            unidad: 'uds',
          });
        }

        // ── 2. CÁLCULO DE INDICADORES CLAVE DE RENDIMIENTO ───────────────────
        let disp = 92.6;
        let rend = 97.4;
        let cal = 98.8;
        let oee = 88.7;
        let tiempoCiclo = 6.2;
        let scrap = 640;
        let dispMat = 96.5;

        if (lineas.length > 0) {
          const sumDisp = lineas.reduce((acc, l) => acc + (Number(l.disponibilidad) || 0), 0);
          const sumRend = lineas.reduce((acc, l) => acc + (Number(l.rendimiento) || 0), 0);
          const sumCal = lineas.reduce((acc, l) => acc + (Number(l.calidad) || 0), 0);
          const sumOee = lineas.reduce((acc, l) => acc + (Number(l.oee) || 0), 0);

          disp = Number((sumDisp / lineas.length).toFixed(1));
          rend = Number((sumRend / lineas.length).toFixed(1));
          cal = Number((sumCal / lineas.length).toFixed(1));
          oee = Number((sumOee / lineas.length).toFixed(1));

          const activas = lineas.filter(l => Number(l.velocidadActual) > 0);
          if (activas.length > 0) {
            const avgVel = activas.reduce((acc, l) => acc + Number(l.velocidadActual), 0) / activas.length;
            if (avgVel > 0) tiempoCiclo = Number((60 / (avgVel / 35)).toFixed(1));
          }
        }

        if (calidadList.length > 0) {
          const def = calidadList.reduce((acc, c) => acc + (Number(c.defectos) || 0), 0);
          if (def > 0) scrap = Math.round((def / 1250) * 10000);
        }

        if (materiales.length > 0) {
          const dispList = materiales.filter(m => (Number(m.stockActual || 0) - (Number(m.stockReservado) || 0)) >= (Number(m.stockMinimo) || 0));
          dispMat = Number(((dispList.length / materiales.length) * 100).toFixed(1));
        }

        setIndicadores({
          disponibilidad: disp,
          rendimiento: rend,
          calidad: cal,
          oee: oee,
          tiempoCiclo: tiempoCiclo,
          scrap: scrap,
          disponibilidadMaterial: dispMat,
        });
      } catch (e) {
        console.error('Error al cargar indicadores en vivo:', e);
      }
    };

    cargarIndicadores();
    const handler = () => cargarIndicadores();
    window.addEventListener('lineas_updated', handler);
    window.addEventListener('materiales_updated', handler);
    window.addEventListener('calidad_updated', handler);
    window.addEventListener('secuencia_updated', handler);
    window.addEventListener('mantenimiento_updated', handler);
    window.addEventListener('paradas_updated', handler);
    window.addEventListener('produccion_updated', handler);

    return () => {
      mounted = false;
      window.removeEventListener('lineas_updated', handler);
      window.removeEventListener('materiales_updated', handler);
      window.removeEventListener('calidad_updated', handler);
      window.removeEventListener('secuencia_updated', handler);
      window.removeEventListener('mantenimiento_updated', handler);
      window.removeEventListener('paradas_updated', handler);
      window.removeEventListener('produccion_updated', handler);
    };
  }, []);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Banner de alerta de OTs críticas si existen en Mantenimiento */}
      {alertasMtoCriticas.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse flex-shrink-0">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-red-400 uppercase tracking-wider">Alerta de Mantenimiento / OEE</span>
                <span className="px-2 py-0.2 rounded-full bg-red-500 text-slate-950 text-[10px] font-black">{alertasMtoCriticas.length} CRÍTICAS</span>
              </div>
              <p className="text-sm font-bold text-white mt-0.5">{alertasMtoCriticas[0].titulo} · <span className="text-slate-300 font-normal">{alertasMtoCriticas[0].descripcion}</span></p>
            </div>
          </div>
          <Link to="/mantenimiento" className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-slate-950 text-xs font-black transition-all whitespace-nowrap self-start md:self-auto flex items-center gap-1.5 shadow-md">
            <span>Ver Mantenimiento y OTs</span> <TrendingUp className="w-3.5 h-3.5" />
          </Link>
        </motion.div>
      )}

      {/* ── SECCIÓN: INDICADORES CLAVE DE RENDIMIENTO (En vivo) ──────────────── */}
      <motion.div {...fadeUp(0)} className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-indigo-300 flex items-center gap-2">
            Indicadores Clave de Rendimiento
          </h3>
          <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Datos sincronizados en vivo
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {/* 1. DISPONIBILIDAD */}
          <div className="card p-3 flex flex-col justify-between text-center border-slate-800/80 bg-slate-900 hover:border-slate-700 transition-all">
            <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-300 min-h-[28px] flex items-center justify-center">Disponibilidad</p>
            <SemiCircleGauge value={indicadores.disponibilidad} color="#84cc16" />
            <div className="mt-1 text-center border-t border-slate-800/60 pt-1.5">
              <p className="text-[11px] font-bold text-slate-300">Obj: 90%</p>
              <p className="text-[11px] font-bold text-emerald-400 flex items-center justify-center gap-0.5 mt-0.5">
                vs ayer: ▲ +1,2 pp
              </p>
            </div>
          </div>

          {/* 2. RENDIMIENTO (PERFORMANCE) */}
          <div className="card p-3 flex flex-col justify-between text-center border-slate-800/80 bg-slate-900 hover:border-slate-700 transition-all">
            <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-300 min-h-[28px] flex items-center justify-center">Rendimiento (Performance)</p>
            <SemiCircleGauge value={indicadores.rendimiento} color="#84cc16" />
            <div className="mt-1 text-center border-t border-slate-800/60 pt-1.5">
              <p className="text-[11px] font-bold text-slate-300">Obj: 95%</p>
              <p className="text-[11px] font-bold text-emerald-400 flex items-center justify-center gap-0.5 mt-0.5">
                vs ayer: ▲ +0,9 pp
              </p>
            </div>
          </div>

          {/* 3. CALIDAD (FIRST PASS YIELD) */}
          <div className="card p-3 flex flex-col justify-between text-center border-slate-800/80 bg-slate-900 hover:border-slate-700 transition-all">
            <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-300 min-h-[28px] flex items-center justify-center">Calidad (First Pass Yield)</p>
            <SemiCircleGauge value={indicadores.calidad} color="#84cc16" />
            <div className="mt-1 text-center border-t border-slate-800/60 pt-1.5">
              <p className="text-[11px] font-bold text-slate-300">Obj: 98%</p>
              <p className="text-[11px] font-bold text-emerald-400 flex items-center justify-center gap-0.5 mt-0.5">
                vs ayer: ▲ +0,4 pp
              </p>
            </div>
          </div>

          {/* 4. OEE */}
          <div className="card p-3 flex flex-col justify-between text-center border-slate-800/80 bg-slate-900 hover:border-slate-700 transition-all">
            <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-300 min-h-[28px] flex items-center justify-center">OEE</p>
            <SemiCircleGauge value={indicadores.oee} color="#6366f1" />
            <div className="mt-1 text-center border-t border-slate-800/60 pt-1.5">
              <p className="text-[11px] font-bold text-slate-300">Obj: 85%</p>
              <p className="text-[11px] font-bold text-emerald-400 flex items-center justify-center gap-0.5 mt-0.5">
                vs ayer: ▲ +1,6 pp
              </p>
            </div>
          </div>

          {/* 5. TIEMPO CICLO PROMEDIO */}
          <div className="card p-3 flex flex-col justify-between text-center border-slate-800/80 bg-slate-900 hover:border-slate-700 transition-all">
            <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-300 min-h-[28px] flex items-center justify-center">Tiempo Ciclo Promedio</p>
            <div className="h-16 flex items-baseline justify-center gap-1.5 my-1">
              <span className="text-2xl font-black text-white tracking-tight">{indicadores.tiempoCiclo.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
              <span className="text-xs font-bold text-slate-300">min/ud</span>
            </div>
            <div className="mt-1 text-center border-t border-slate-800/60 pt-1.5">
              <p className="text-[11px] font-bold text-slate-300">Obj: 6,5 min/ud</p>
              <p className="text-[11px] font-bold text-emerald-400 flex items-center justify-center gap-0.5 mt-0.5">
                vs ayer: ▲ -0,2 min
              </p>
            </div>
          </div>

          {/* 6. SCRAP (PPM) */}
          <div className="card p-3 flex flex-col justify-between text-center border-slate-800/80 bg-slate-900 hover:border-slate-700 transition-all">
            <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-300 min-h-[28px] flex items-center justify-center">Scrap (PPM)</p>
            <div className="h-16 flex items-center justify-center my-1">
              <span className="text-3xl font-black text-red-400 tracking-tight">{indicadores.scrap}</span>
            </div>
            <div className="mt-1 text-center border-t border-slate-800/60 pt-1.5">
              <p className="text-[11px] font-bold text-slate-300">Obj: &lt; 800</p>
              <p className="text-[11px] font-bold text-emerald-400 flex items-center justify-center gap-0.5 mt-0.5">
                vs ayer: ▲ -120
              </p>
            </div>
          </div>

          {/* 7. DISPONIBILIDAD MATERIAL */}
          <div className="card p-3 flex flex-col justify-between text-center border-slate-800/80 bg-slate-900 hover:border-slate-700 transition-all">
            <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-300 min-h-[28px] flex items-center justify-center">Disponibilidad Material</p>
            <SemiCircleGauge value={indicadores.disponibilidadMaterial} color="#84cc16" />
            <div className="mt-1 text-center border-t border-slate-800/60 pt-1.5">
              <p className="text-[11px] font-bold text-slate-300">Obj: 95%</p>
              <p className="text-[11px] font-bold text-emerald-400 flex items-center justify-center gap-0.5 mt-0.5">
                vs ayer: ▲ +2,1 pp
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── ROW 1: KPIs principales (Interactivos y dinámicos) ─────────── */}
      <motion.div {...fadeUp(0.05)} className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
        {/* Cumplimiento plan — grande e interactivo */}
        <div
          onClick={() => setModalFicha('cumplimiento')}
          className="col-span-2 md:col-span-1 xl:col-span-1 card p-5 flex flex-col items-center justify-center text-center relative overflow-hidden cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 border-slate-800 hover:border-blue-500/50 shadow-lg hover:shadow-xl group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-transparent group-hover:from-blue-600/20 transition-all" />
          <p className="section-title mb-3 flex items-center gap-1.5">
            % Cumplimiento Plan <Sliders className="w-3.5 h-3.5 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </p>
          <div className="relative w-24 h-24 mb-2">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#1e293b" strokeWidth="10"/>
              <circle cx="50" cy="50" r="40" fill="none" stroke="#2563eb" strokeWidth="10"
                strokeDasharray={`${2 * Math.PI * 40 * Math.min(100, Math.max(0, kpisMain.cumplimientoPlan)) / 100} ${2 * Math.PI * 40}`}
                strokeLinecap="round" className="transition-all duration-1000"/>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-blue-400">{kpisMain.cumplimientoPlan}%</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-500">Obj: {kpisMain.cumplimientoPlanObjetivo}%</p>
          <div className="flex items-center gap-1 mt-1 text-emerald-400 text-xs font-bold">
            <TrendingUp className="w-3 h-3" />
            <span>vs ayer: +{kpisMain.cumplimientoPlanVsAyer} pp</span>
          </div>
        </div>

        {/* Producción Planificada */}
        <KPICard
          title="Producción Planificada"
          value={kpisMain.produccionPlanificada.toLocaleString('es')}
          unit={kpisMain.unidad}
          sub="Plan del día (Clic para ajustar)"
          color="slate"
          onClick={() => setModalFicha('cumplimiento')}
        />

        {/* Producción Real */}
        <KPICard
          title="Producción Real"
          value={kpisMain.produccionReal.toLocaleString('es')}
          unit={kpisMain.unidad}
          sub="Acumulado día (En vivo)"
          color="blue"
          onClick={() => setModalFicha('cumplimiento')}
        />

        {/* Desviación Acumulada */}
        <KPICard
          title="Desviación Acumulada"
          value={kpisMain.desviacionAcumulada > 0 ? `+${kpisMain.desviacionAcumulada}` : kpisMain.desviacionAcumulada}
          unit={kpisMain.unidad}
          sub={`${kpisMain.desviacionPct > 0 ? `+${kpisMain.desviacionPct}` : kpisMain.desviacionPct}% vs plan`}
          trendValue={kpisMain.desviacionPct}
          trend={kpisMain.desviacionAcumulada >= 0 ? 'good' : 'bad'}
          color={kpisMain.desviacionAcumulada >= 0 ? 'green' : 'red'}
          onClick={() => setModalFicha('cumplimiento')}
        />

        {/* Ritmo Real */}
        <KPICard
          title="Ritmo Real"
          value={kpisMain.ritmoReal}
          unit="uds/h"
          sub={`Obj: ${kpisMain.ritmoObjetivo} uds/h`}
          color="blue"
          onClick={() => setModalFicha('cumplimiento')}
        />

        {/* Tiempo Restante */}
        <div
          onClick={() => setModalFicha('tiempo')}
          className="card p-4 flex flex-col justify-between cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 hover:border-amber-500/40 shadow-lg hover:shadow-xl group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent group-hover:from-amber-500/10 transition-all" />
          <div className="flex items-center justify-between">
            <p className="section-title">Tiempo Restante</p>
            <Clock className="w-4 h-4 text-amber-400 opacity-60 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="flex items-center gap-2 my-2">
            <span className="text-2xl font-black text-amber-400">{kpisMain.tiempoRestante}</span>
          </div>
          <p className="text-[10px] text-slate-500 font-medium">{kpisMain.tiempoRestanteLabel}</p>
        </div>

        {/* Órdenes del día */}
        <Link
          to="/secuencia"
          className="card p-4 flex flex-col justify-between cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 hover:border-purple-500/40 shadow-lg hover:shadow-xl group relative overflow-hidden block"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent group-hover:from-purple-500/10 transition-all" />
          <div className="flex items-center justify-between">
            <p className="section-title">Órdenes del Día</p>
            <ClipboardList className="w-4 h-4 text-purple-400 opacity-60 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="flex items-center gap-2 my-2">
            <span className="text-3xl font-black text-purple-400">{kpisMain.ordenesDia}</span>
          </div>
          <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1 group-hover:text-purple-300 transition-colors">
            <span>Gestionar en Secuencia</span> <ArrowUp className="w-2.5 h-2.5 rotate-45" />
          </p>
        </Link>
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

      {/* ── MODAL INTERACTIVO DE FICHAS DE CUMPLIMIENTO / PRODUCCIÓN ────────── */}
      {modalFicha === 'cumplimiento' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto border-slate-800 bg-slate-900 shadow-2xl space-y-6"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
                  <Sliders className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">Desglose y Edición en Vivo de Producción</h3>
                  <p className="text-xs text-slate-400">Ajusta los objetivos y producción real por cada línea para actualizar las fichas del Dashboard al instante.</p>
                </div>
              </div>
              <button onClick={() => setModalFicha(null)} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Resumen Superior en Modal */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              <div className="text-center">
                <p className="text-[10px] uppercase font-black text-slate-500">Total Planificado</p>
                <p className="text-xl font-black text-slate-200 mt-1">{kpisMain.produccionPlanificada.toLocaleString('es')} uds</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] uppercase font-black text-slate-500">Total Real</p>
                <p className="text-xl font-black text-blue-400 mt-1">{kpisMain.produccionReal.toLocaleString('es')} uds</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] uppercase font-black text-slate-500">Cumplimiento Global</p>
                <p className="text-xl font-black text-emerald-400 mt-1">{kpisMain.cumplimientoPlan}%</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] uppercase font-black text-slate-500">Desviación Total</p>
                <p className={`text-xl font-black mt-1 ${kpisMain.desviacionAcumulada >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {kpisMain.desviacionAcumulada >= 0 ? `+${kpisMain.desviacionAcumulada}` : kpisMain.desviacionAcumulada} uds
                </p>
              </div>
            </div>

            {/* Tabla interactiva de líneas */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/40">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] font-black uppercase text-slate-500 bg-slate-900/80">
                    <th className="py-3 px-4">Línea</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4">Objetivo Hoy (uds)</th>
                    <th className="py-3 px-4">Producción Hoy (uds)</th>
                    <th className="py-3 px-4">% Cumplimiento</th>
                    <th className="py-3 px-4">Velocidad Actual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {lineasData.map((l, idx) => {
                    const obj = Number(l.objetivoHoy ?? l.objetivo_hoy) || 0;
                    const prod = Number(l.produccionHoy ?? l.produccion_hoy) || 0;
                    const c = obj > 0 ? Number(((prod / obj) * 100).toFixed(1)) : 0;
                    const des = prod - obj;

                    const handleUpdateLineaField = (field, val) => {
                      const updated = lineasData.map((item, i) => i === idx ? { ...item, [field]: Number(val) || 0 } : item);
                      setLineasData(updated);
                    };

                    return (
                      <tr key={l.id || idx} className="hover:bg-slate-900/50 transition-colors">
                        <td className="py-3 px-4 font-black text-white">{l.nombre || `Línea ${idx+1}`}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${l.estado === 'en_marcha' ? 'bg-emerald-500/20 text-emerald-400' : l.estado === 'parada' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
                            {l.estado === 'en_marcha' ? 'En Marcha' : l.estado === 'parada' ? 'Parada' : 'Mantenimiento'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            value={obj}
                            onChange={(e) => handleUpdateLineaField('objetivoHoy', e.target.value)}
                            className="w-24 bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-lg px-2 py-1 text-white font-bold text-xs"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            value={prod}
                            onChange={(e) => handleUpdateLineaField('produccionHoy', e.target.value)}
                            className="w-24 bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-lg px-2 py-1 text-white font-bold text-xs"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <span className={`font-black ${c >= 100 ? 'text-emerald-400' : c >= 90 ? 'text-blue-400' : 'text-amber-400'}`}>
                            {c}% ({des >= 0 ? `+${des}` : des} uds)
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-300">
                          {l.velocidadActual ?? l.velocidad_actual} uds/h
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <Link to="/lineas" onClick={() => setModalFicha(null)} className="text-xs text-blue-400 font-bold hover:underline flex items-center gap-1">
                Ir a gestión avanzada de Líneas &rarr;
              </Link>
              <div className="flex items-center gap-3">
                <button onClick={() => setModalFicha(null)} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all">
                  Cancelar
                </button>
                <button
                  disabled={guardandoLineas}
                  onClick={async () => {
                    setGuardandoLineas(true);
                    for (const l of lineasData) {
                      await updateLinea(l.id, l);
                    }
                    window.dispatchEvent(new Event('lineas_updated'));
                    setGuardandoLineas(false);
                    setModalFicha(null);
                  }}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-blue-900/30"
                >
                  {guardandoLineas ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sliders className="w-4 h-4" />}
                  <span>{guardandoLineas ? 'Guardando...' : 'Aplicar y Recalcular en Vivo'}</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── MODAL INTERACTIVO DE TIEMPO RESTANTE / TURNO ────────── */}
      {modalFicha === 'tiempo' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card p-6 max-w-lg w-full border-slate-800 bg-slate-900 shadow-2xl space-y-5"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Estado del Turno Actual</h3>
                  <p className="text-xs text-slate-400">Sincronización horaria con el reloj del sistema MES</p>
                </div>
              </div>
              <button onClick={() => setModalFicha(null)} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Turno en curso:</span>
                <span className="text-sm font-black text-white">Turno {getCurrentShiftInfo().shift}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Tiempo restante:</span>
                <span className="text-lg font-black text-amber-400 font-mono">{kpisMain.tiempoRestante || getCurrentShiftInfo().tiempoRestante}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Horario oficial:</span>
                <span className="text-xs font-bold text-slate-300">{kpisMain.horarioTurno || `${getCurrentShiftInfo().horario} (Rotativo según reloj)`}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Link to="/paradas" onClick={() => setModalFicha(null)} className="text-xs text-blue-400 font-bold hover:underline">
                Ver registro de paradas de turno &rarr;
              </Link>
              <button onClick={() => setModalFicha(null)} className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all">
                Cerrar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
