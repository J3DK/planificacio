import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, BarChart2, Activity, AlertTriangle, Zap,
  LineChart, Factory, PieChart, RefreshCw, Save, Eye, EyeOff,
  SlidersHorizontal, GripVertical, ChevronUp, ChevronDown
} from 'lucide-react';
import { fetchMetricas, updateMetrica, updateOrdenMetricas } from '@/services/dataService';

const ICON_MAP = { TrendingUp, BarChart2, Activity, AlertTriangle, Zap, LineChart, Factory, PieChart, SlidersHorizontal };

const GRADIENT_MAP = {
  TrendingUp:    'from-blue-600/20 to-blue-400/5 border-blue-500/30',
  BarChart2:     'from-emerald-600/20 to-emerald-400/5 border-emerald-500/30',
  Activity:      'from-violet-600/20 to-violet-400/5 border-violet-500/30',
  AlertTriangle: 'from-red-600/20 to-red-400/5 border-red-500/30',
  Zap:           'from-amber-600/20 to-amber-400/5 border-amber-500/30',
  LineChart:     'from-cyan-600/20 to-cyan-400/5 border-cyan-500/30',
  Factory:       'from-indigo-600/20 to-indigo-400/5 border-indigo-500/30',
  PieChart:      'from-pink-600/20 to-pink-400/5 border-pink-500/30',
};

const ICON_COLOR_MAP = {
  TrendingUp: 'text-blue-400', BarChart2: 'text-emerald-400', Activity: 'text-violet-400',
  AlertTriangle: 'text-red-400', Zap: 'text-amber-400', LineChart: 'text-cyan-400',
  Factory: 'text-indigo-400', PieChart: 'text-pink-400',
};

export default function Metricas() {
  const [widgets, setWidgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [editingUmbral, setEditingUmbral] = useState(null);

  const loadData = async () => {
    setLoading(true);
    const { data } = await fetchMetricas();
    setWidgets([...data].sort((a, b) => a.orden - b.orden));
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const toggleActivo = async (id) => {
    const updated = widgets.map(w => w.id === id ? { ...w, activo: !w.activo } : w);
    setWidgets(updated);
    const widget = updated.find(w => w.id === id);
    await updateMetrica(id, { activo: widget.activo });
  };

  const moverWidget = (idx, dir) => {
    const newWidgets = [...widgets];
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= newWidgets.length) return;
    [newWidgets[idx], newWidgets[targetIdx]] = [newWidgets[targetIdx], newWidgets[idx]];
    newWidgets.forEach((w, i) => { w.orden = i + 1; });
    setWidgets(newWidgets);
  };

  const handleUmbralChange = (id, value) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, umbral: parseFloat(value) || null } : w));
  };

  const saveAll = async () => {
    setSaving(true);
    await Promise.all(widgets.map(w => updateMetrica(w.id, { activo: w.activo, orden: w.orden, umbral: w.umbral })));
    await updateOrdenMetricas(widgets.map(w => ({ id: w.id, orden: w.orden })));
    setSaving(false);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2500);
  };

  const activeCount = widgets.filter(w => w.activo).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">Métricas del Dashboard</h2>
          <p className="text-slate-500 text-sm">Configura qué widgets y KPIs deseas ver en el panel principal</p>
        </div>
        <button onClick={saveAll} disabled={saving}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black transition-all shadow-lg disabled:opacity-60 ${savedMsg ? 'bg-emerald-600 shadow-emerald-900/40' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/30'}`}>
          <Save className="w-4 h-4" />
          {savedMsg ? '¡Guardado!' : saving ? 'Guardando…' : 'Guardar Cambios'}
        </button>
      </motion.div>

      {/* Stats bar */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-3 gap-3">
        <div className="card p-4 text-center">
          <p className="text-3xl font-black text-blue-400">{activeCount}</p>
          <p className="text-[10px] uppercase font-black text-slate-500 mt-1">Widgets Activos</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-3xl font-black text-slate-400">{widgets.length - activeCount}</p>
          <p className="text-[10px] uppercase font-black text-slate-500 mt-1">Desactivados</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-3xl font-black text-violet-400">{widgets.length}</p>
          <p className="text-[10px] uppercase font-black text-slate-500 mt-1">Total Disponibles</p>
        </div>
      </motion.div>

      {/* Info banner */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
        className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl px-4 py-3">
        <SlidersHorizontal className="w-4 h-4 text-blue-400 flex-shrink-0" />
        <p className="text-xs text-blue-300">
          Activa o desactiva cada widget con el toggle · Reordénalos con las flechas · Ajusta los umbrales de alerta de KPIs · Pulsa <strong>Guardar Cambios</strong> para persistir en la base de datos.
        </p>
      </motion.div>

      {/* Widget cards */}
      <div className="space-y-3">
        {widgets.map((widget, idx) => {
          const Icon = ICON_MAP[widget.icono] || Activity;
          const gradient = GRADIENT_MAP[widget.icono] || 'from-slate-600/20 to-slate-400/5 border-slate-500/30';
          const iconColor = ICON_COLOR_MAP[widget.icono] || 'text-slate-400';

          return (
            <motion.div key={widget.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
              className={`relative overflow-hidden rounded-2xl border bg-gradient-to-r transition-all duration-300 ${widget.activo ? gradient : 'border-slate-800 from-slate-900 to-slate-900 opacity-60'}`}>
              <div className="flex items-center gap-4 px-5 py-4">
                {/* Orden */}
                <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
                  <button onClick={() => moverWidget(idx, -1)} disabled={idx === 0}
                    className="p-0.5 rounded text-slate-700 hover:text-slate-300 disabled:opacity-20 transition-colors">
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] font-black text-slate-600">{widget.orden}</span>
                  <button onClick={() => moverWidget(idx, 1)} disabled={idx === widgets.length - 1}
                    className="p-0.5 rounded text-slate-700 hover:text-slate-300 disabled:opacity-20 transition-colors">
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                <GripVertical className="w-4 h-4 text-slate-700 flex-shrink-0" />

                {/* Icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${widget.activo ? gradient : 'border-slate-800 bg-slate-800/50'}`}>
                  <Icon className={`w-5 h-5 ${widget.activo ? iconColor : 'text-slate-600'}`} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className={`font-black text-sm ${widget.activo ? 'text-white' : 'text-slate-500'}`}>{widget.widget_nombre}</h3>
                  <p className="text-xs text-slate-600 mt-0.5 truncate">{widget.descripcion}</p>
                </div>

                {/* Umbral */}
                {widget.umbral !== null && widget.umbral !== undefined && (
                  <div className="flex flex-col items-end flex-shrink-0 mr-2">
                    <p className="text-[9px] text-slate-600 uppercase font-bold mb-1">{widget.umbral_label}</p>
                    {editingUmbral === widget.id ? (
                      <input
                        type="number"
                        value={widget.umbral ?? ''}
                        onChange={e => handleUmbralChange(widget.id, e.target.value)}
                        onBlur={() => setEditingUmbral(null)}
                        autoFocus
                        step="0.1"
                        className="w-20 bg-slate-800 border border-blue-500 rounded-lg px-2 py-1 text-xs font-black text-white text-right focus:outline-none"
                      />
                    ) : (
                      <button onClick={() => setEditingUmbral(widget.id)}
                        className="text-right hover:text-blue-400 transition-colors group/umbral">
                        <span className={`text-lg font-black ${widget.activo ? iconColor : 'text-slate-600'}`}>{widget.umbral}%</span>
                        <span className="block text-[8px] text-slate-700 group-hover/umbral:text-blue-500 transition-colors">Click para editar</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Toggle */}
                <button onClick={() => toggleActivo(widget.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-black transition-all flex-shrink-0 ${
                    widget.activo
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                      : 'bg-slate-800/50 border-slate-700 text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                  }`}>
                  {widget.activo ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  {widget.activo ? 'Activo' : 'Oculto'}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer note */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        className="text-center py-4">
        <p className="text-xs text-slate-700">Los cambios se aplican al Dashboard en el próximo refresh de página · La configuración se guarda en Supabase</p>
      </motion.div>
    </div>
  );
}
