import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchParadas, insertParada, updateParada, deleteParada } from '@/services/dataService';
import { paradasPorTipo, oeeWaterfall } from '@/data/mockParadas';
import { Clock, AlertTriangle, Wrench, Filter, Plus, Pencil, Trash2, RefreshCw } from 'lucide-react';
import CrudModal from '@/components/shared/CrudModal';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

const TIPO_COLORS = { averia: '#ef4444', mantenimiento: '#f59e0b', cambio: '#3b82f6', calidad: '#8b5cf6' };
const TIPO_LABELS = { averia: 'Avería', mantenimiento: 'Mant.', cambio: 'Cambio', calidad: 'Calidad' };
const TIPO_ICONS = {
  averia: <AlertTriangle className="w-3.5 h-3.5" />,
  mantenimiento: <Wrench className="w-3.5 h-3.5" />,
  cambio: <Filter className="w-3.5 h-3.5" />,
  calidad: <Clock className="w-3.5 h-3.5" />,
};

const PARADA_FIELDS = [
  { key: 'linea',    label: 'Línea',     type: 'select', required: true,
    options: ['Línea 1', 'Línea 2', 'Línea 3', 'Línea 4', 'Línea 5'] },
  { key: 'inicio',   label: 'Inicio',    type: 'text', required: true, placeholder: '07:15' },
  { key: 'fin',      label: 'Fin',       type: 'text', placeholder: '07:42 (vacío = En curso)' },
  { key: 'duracion', label: 'Duración (min)', type: 'number', min: 0, default: 0 },
  { key: 'tipo',     label: 'Tipo',      type: 'select', required: true,
    options: [{ value: 'averia', label: 'Avería' }, { value: 'mantenimiento', label: 'Mantenimiento' }, { value: 'cambio', label: 'Cambio ref.' }, { value: 'calidad', label: 'Calidad' }] },
  { key: 'causa',    label: 'Causa',     type: 'textarea', required: true, placeholder: 'Descripción de la causa...' },
  { key: 'impacto',  label: 'Impacto (uds)', type: 'number', min: 0, default: 0 },
  { key: 'estado',   label: 'Estado',    type: 'select', required: true,
    options: [{ value: 'abierta', label: 'Abierta' }, { value: 'cerrada', label: 'Cerrada' }] },
];

const totalMin = paradasPorTipo.reduce((s, p) => s + p.minutos, 0);

export default function Paradas() {
  const [paradas, setParadas] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [editItem, setEditItem] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const { data } = await fetchParadas();
    setParadas(data || []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const openCreate = () => { setEditItem({ estado: 'abierta', duracion: 0, impacto: 0 }); setModalMode('create'); setModalOpen(true); };
  const openEdit = (parada) => { setEditItem(parada); setModalMode('edit'); setModalOpen(true); };
  const openDelete = (parada) => { setDeleteTarget(parada); setConfirmOpen(true); };

  const handleSave = async (data) => {
    setSaving(true);
    if (modalMode === 'create') {
      const { data: newItem, error } = await insertParada(data);
      if (!error) setParadas(prev => [...prev, newItem || { ...data, id: Date.now() }]);
    } else {
      const { data: updated, error } = await updateParada(editItem.id, data);
      if (!error) setParadas(prev => prev.map(p => p.id === editItem.id ? (updated || { ...p, ...data }) : p));
    }
    setSaving(false);
    setModalOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await deleteParada(deleteTarget.id);
    if (!error) setParadas(prev => prev.filter(p => p.id !== deleteTarget.id));
    setDeleting(false);
    setConfirmOpen(false);
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">Paradas</h2>
          <p className="text-slate-500 text-sm">Registro y análisis de paradas · Turno Mañana</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadData} disabled={loading}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={openCreate}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black transition-all shadow-lg shadow-blue-900/30">
            <Plus className="w-3.5 h-3.5" /> Nueva Parada
          </button>
        </div>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {paradasPorTipo.map(p => (
          <motion.div key={p.tipo} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border p-4" style={{ borderColor: p.color + '40', background: p.color + '10' }}>
            <div className="flex items-center gap-2 mb-2" style={{ color: p.color }}>
              {TIPO_ICONS[p.tipo]}
              <span className="text-[10px] font-black uppercase tracking-widest">{p.tipo}</span>
            </div>
            <p className="text-2xl font-black text-white">{p.minutos} <span className="text-sm font-normal text-slate-400">min</span></p>
            <p className="text-[11px] text-slate-500 mt-1">{p.pct}% tiempo parado</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pie */}
        <div className="card p-5">
          <h3 className="section-title">Distribución por Tipo</h3>
          <div className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={paradasPorTipo} dataKey="minutos" cx="50%" cy="50%" outerRadius={75} paddingAngle={3}>
                  {paradasPorTipo.map((p, i) => <Cell key={i} fill={p.color} />)}
                </Pie>
                <Tooltip formatter={(v) => [`${v} min`, '']} contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-full space-y-1.5 mt-2">
              {paradasPorTipo.map(p => (
                <div key={p.tipo} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: p.color }} />
                  <span className="text-xs text-slate-400 flex-1">{p.tipo}</span>
                  <span className="text-xs font-black text-white">{p.minutos} min</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 border-t border-slate-800 text-xs font-black">
                <span className="text-slate-400">Total</span>
                <span className="text-white">{totalMin} min</span>
              </div>
            </div>
          </div>
        </div>

        {/* OEE Waterfall */}
        <div className="card p-5 col-span-1 lg:col-span-2">
          <h3 className="section-title">Análisis OEE — Cascada de pérdidas</h3>
          <div className="space-y-2">
            {oeeWaterfall.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-[10px] text-slate-500 w-40 truncate font-medium">{item.nombre}</span>
                <div className="flex-1 h-6 bg-slate-800 rounded-lg overflow-hidden relative">
                  <motion.div
                    className={`absolute top-0 left-0 h-full rounded-lg flex items-center px-2 ${item.tipo === 'resultado' ? 'bg-blue-600' : item.tipo === 'kpi' ? 'bg-slate-600' : 'bg-red-500/70'}`}
                    initial={{ width: 0 }}
                    animate={{ width: item.tipo === 'perdida' ? `${Math.abs(item.valor) * 5}%` : `${item.valor}%` }}
                    transition={{ delay: i * 0.08, duration: 0.4 }}>
                    <span className="text-[10px] font-black text-white whitespace-nowrap">{item.valor}%</span>
                  </motion.div>
                </div>
                <span className={`text-sm font-black w-16 text-right ${item.tipo === 'resultado' ? 'text-blue-400' : item.tipo === 'perdida' ? 'text-red-400' : 'text-slate-300'}`}>
                  {item.valor}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabla de paradas */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="section-title mb-0">Registro de Paradas — Turno Mañana</h3>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500">{paradas.filter(p => p.estado === 'abierta').length} abiertas</span>
            <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                {['Línea','Inicio','Fin','Duración','Tipo','Causa','Impacto','Estado',''].map(h => (
                  <th key={h} className="table-header text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paradas.map(p => (
                <tr key={p.id} className={`hover:bg-slate-800/30 transition-colors group ${p.estado === 'abierta' ? 'bg-red-500/5' : ''}`}>
                  <td className="table-cell font-bold text-slate-200">{p.linea}</td>
                  <td className="table-cell font-mono text-xs text-slate-400">{p.inicio}</td>
                  <td className="table-cell font-mono text-xs text-slate-400">{p.fin || <span className="text-red-400 animate-pulse">En curso</span>}</td>
                  <td className="table-cell font-bold text-white">{p.duracion} min</td>
                  <td className="table-cell">
                    <div className="flex items-center gap-1.5" style={{ color: TIPO_COLORS[p.tipo] }}>
                      {TIPO_ICONS[p.tipo]}
                      <span className="text-[10px] font-bold uppercase">{TIPO_LABELS[p.tipo]}</span>
                    </div>
                  </td>
                  <td className="table-cell text-slate-400 max-w-xs"><span className="text-xs">{p.causa}</span></td>
                  <td className="table-cell text-amber-400 font-bold">-{p.impacto} uds</td>
                  <td className="table-cell">
                    <span className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${p.estado === 'abierta' ? 'badge-danger' : 'badge-neutral'}`}>
                      {p.estado}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-slate-600 hover:text-blue-400 hover:bg-blue-400/10 transition-all">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => openDelete(p)} className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <CrudModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave}
        title={modalMode === 'create' ? 'Nueva Parada' : 'Editar Parada'}
        fields={PARADA_FIELDS} initialData={editItem} saving={saving} />
      <ConfirmDialog isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete}
        title="Eliminar Parada" message={`Se eliminará la parada "${deleteTarget?.causa}" en ${deleteTarget?.linea}. ¿Estás seguro?`} deleting={deleting} />
    </div>
  );
}
