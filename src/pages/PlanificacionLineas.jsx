import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, Calendar } from 'lucide-react';
import { lineas } from '@/data/mockLineas';

const SEMANA_DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const HORAS = Array.from({ length: 16 }, (_, i) => `${String(i + 6).padStart(2, '0')}:00`);

const ordenesGantt = [
  { linea: 'L1', dia: 0, horaInicio: 6, duracion: 4, ref: 'BAT-48V-100Ah', cliente: 'Cliente A', color: '#2563eb' },
  { linea: 'L1', dia: 0, horaInicio: 10, duracion: 6, ref: 'BAT-48V-200Ah', cliente: 'Cliente D', color: '#7c3aed' },
  { linea: 'L2', dia: 0, horaInicio: 6, duracion: 8, ref: 'BAT-24V-200Ah', cliente: 'Cliente B', color: '#0891b2' },
  { linea: 'L3', dia: 0, horaInicio: 8, duracion: 5, ref: 'BAT-12V-100Ah', cliente: 'Cliente C', color: '#dc2626' },
  { linea: 'L4', dia: 0, horaInicio: 6, duracion: 10, ref: 'BAT-48V-200Ah', cliente: 'Cliente D', color: '#059669' },
  { linea: 'L5', dia: 0, horaInicio: 6, duracion: 8, ref: 'BAT-24V-100Ah', cliente: 'Cliente E', color: '#d97706' },
  { linea: 'L1', dia: 1, horaInicio: 6, duracion: 8, ref: 'BAT-48V-100Ah', cliente: 'Cliente A', color: '#2563eb' },
  { linea: 'L2', dia: 1, horaInicio: 6, duracion: 6, ref: 'BAT-24V-100Ah', cliente: 'Cliente E', color: '#0891b2' },
  { linea: 'L3', dia: 1, horaInicio: 7, duracion: 9, ref: 'BAT-12V-200Ah', cliente: 'Cliente C', color: '#dc2626' },
  { linea: 'L4', dia: 1, horaInicio: 6, duracion: 8, ref: 'BAT-48V-100Ah', cliente: 'Cliente A', color: '#059669' },
  { linea: 'L5', dia: 2, horaInicio: 6, duracion: 7, ref: 'BAT-24V-200Ah', cliente: 'Cliente B', color: '#d97706' },
  { linea: 'L1', dia: 2, horaInicio: 6, duracion: 6, ref: 'BAT-48V-200Ah', cliente: 'Cliente D', color: '#2563eb' },
];

export default function PlanificacionLineas() {
  const [diaSeleccionado, setDiaSeleccionado] = useState(0);
  const CELL_W = 60; // px por hora

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h2 className="text-2xl font-black text-white">Planificación de Líneas</h2>
          <p className="text-slate-500 text-sm">Semana 22 · Planta 1</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-all active:scale-95">
            <Plus className="w-4 h-4" /> Nueva Orden
          </button>
        </div>
      </motion.div>

      {/* Selector de día */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="flex items-center gap-2">
        <button className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {SEMANA_DIAS.map((dia, i) => (
            <button
              key={dia}
              onClick={() => setDiaSeleccionado(i)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                diaSeleccionado === i ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {dia} {i === 0 && <span className="text-[9px] ml-1 opacity-70">HOY</span>}
            </button>
          ))}
        </div>
        <button className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all">
          <ChevronRight className="w-4 h-4" />
        </button>
      </motion.div>

      {/* Capacidad resumen */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {lineas.map(l => (
          <motion.div
            key={l.id}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="card p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{l.nombre}</span>
              <span className={`w-2 h-2 rounded-full ${l.estado === 'en_marcha' ? 'bg-emerald-400' : l.estado === 'parada' ? 'bg-red-400' : 'bg-amber-400'}`} />
            </div>
            <div className="text-sm font-bold text-slate-200 truncate">{l.producto}</div>
            <div className="mt-2">
              <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                <span>Carga</span>
                <span className="font-bold text-white">{Math.round((l.produccionHoy / l.objetivoHoy) * 100)}%</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${l.produccionHoy >= l.objetivoHoy ? 'bg-emerald-500' : 'bg-blue-500'}`}
                  style={{ width: `${Math.min(100, (l.produccionHoy / l.objetivoHoy) * 100)}%` }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Gantt */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-400" />
            <h3 className="section-title mb-0">Diagrama de Gantt — {SEMANA_DIAS[diaSeleccionado]} 31/05/2024</h3>
          </div>
          <div className="overflow-x-auto">
            <div style={{ minWidth: CELL_W * 16 + 120 }}>
              {/* Horas header */}
              <div className="flex border-b border-slate-800">
                <div className="w-24 flex-shrink-0 bg-slate-900/50" />
                {HORAS.map(h => (
                  <div key={h} style={{ width: CELL_W }} className="flex-shrink-0 text-center text-[10px] text-slate-600 py-2 border-l border-slate-800 font-mono">
                    {h}
                  </div>
                ))}
              </div>
              {/* Líneas */}
              {lineas.map(l => {
                const ordenes = ordenesGantt.filter(o => o.linea === l.id && o.dia === diaSeleccionado);
                return (
                  <div key={l.id} className="flex border-b border-slate-800/50 hover:bg-slate-800/20 group">
                    <div className="w-24 flex-shrink-0 flex flex-col justify-center px-3 py-2 border-r border-slate-800">
                      <span className="text-[10px] font-black text-slate-300">{l.nombre}</span>
                      <span className={`text-[9px] font-bold mt-0.5 ${l.estado === 'en_marcha' ? 'text-emerald-400' : l.estado === 'parada' ? 'text-red-400' : 'text-amber-400'}`}>
                        {l.estado === 'en_marcha' ? 'En marcha' : l.estado === 'parada' ? 'Parada' : 'Mant.'}
                      </span>
                    </div>
                    <div className="relative flex-1" style={{ height: 48 }}>
                      {/* Grid lines */}
                      {HORAS.map((_, i) => (
                        <div key={i} className="absolute top-0 bottom-0 border-l border-slate-800/50" style={{ left: i * CELL_W }} />
                      ))}
                      {/* Current time marker */}
                      <div className="absolute top-0 bottom-0 w-0.5 bg-amber-400/60 z-10" style={{ left: 5.25 * CELL_W }} />
                      {/* Orders */}
                      {ordenes.map((o, i) => (
                        <div
                          key={i}
                          className="absolute top-2 bottom-2 rounded-lg flex items-center px-2 overflow-hidden cursor-pointer hover:brightness-110 transition-all"
                          style={{
                            left: (o.horaInicio - 6) * CELL_W + 2,
                            width: o.duracion * CELL_W - 4,
                            backgroundColor: o.color + '33',
                            border: `1px solid ${o.color}60`,
                          }}
                        >
                          <span className="text-[9px] font-bold text-white truncate" style={{ color: o.color }}>{o.ref}</span>
                        </div>
                      ))}
                      {ordenes.length === 0 && (
                        <div className="absolute inset-2 border border-dashed border-slate-700/50 rounded-lg flex items-center justify-center">
                          <span className="text-[9px] text-slate-700">Sin planificar</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Leyenda */}
          <div className="px-5 py-3 border-t border-slate-800 flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5"><div className="w-0.5 h-4 bg-amber-400/60" /><span className="text-[10px] text-slate-500">Tiempo actual</span></div>
            <div className="flex items-center gap-1.5"><div className="w-4 h-3 bg-blue-600/30 border border-blue-500/50 rounded" /><span className="text-[10px] text-slate-500">Orden planificada</span></div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
