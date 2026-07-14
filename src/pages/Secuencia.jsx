import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GripVertical, Clock, AlertTriangle, CheckCircle2, Circle, ChevronUp, ChevronDown, Plus, Pencil, Trash2, RefreshCw } from 'lucide-react';
import { fetchSecuencia, insertSecuencia, updateSecuencia, deleteSecuencia } from '@/services/dataService';
import StatusBadge from '@/components/shared/StatusBadge';
import CrudModal from '@/components/shared/CrudModal';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

const statusIcon = {
  a_tiempo:  <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
  en_riesgo: <Clock className="w-4 h-4 text-amber-400" />,
  retrasado: <AlertTriangle className="w-4 h-4 text-red-400" />,
  pendiente: <Circle className="w-4 h-4 text-slate-600" />,
};

const SECUENCIA_FIELDS = [
  { key: 'referencia',       label: 'Referencia (producto)', type: 'text',   required: true, placeholder: 'BAT-48V-100Ah' },
  { key: 'cliente',          label: 'Cliente',               type: 'text',   required: true, placeholder: 'Cliente A' },
  { key: 'fechaCompromiso',  label: 'Fecha Compromiso',      type: 'text',   required: true, placeholder: '31/05/2024 07:30' },
  { key: 'estado',           label: 'Estado',                type: 'select', required: true,
    options: [{ value: 'a_tiempo', label: 'A tiempo' }, { value: 'en_riesgo', label: 'En riesgo' }, { value: 'retrasado', label: 'Retrasado' }, { value: 'pendiente', label: 'Pendiente' }] },
  { key: 'progreso',         label: 'Progreso (%)',          type: 'number', min: 0, max: 100, default: 0 },
  { key: 'cumplimiento',     label: 'Cumplimiento (%)',      type: 'number', min: 0, max: 100, default: 0 },
  { key: 'desvio',           label: 'Desvío (uds)',          type: 'number', default: 0 },
];

export default function Secuencia() {
  const [ordenes, setOrdenes] = useState([]);
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
    const { data } = await fetchSecuencia();
    setOrdenes(data || []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const mover = (idx, dir) => {
    const newOrdenes = [...ordenes];
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= newOrdenes.length) return;
    [newOrdenes[idx], newOrdenes[targetIdx]] = [newOrdenes[targetIdx], newOrdenes[idx]];
    newOrdenes.forEach((o, i) => { o.secuencia = i + 1; });
    setOrdenes(newOrdenes);
  };

  const resumen = {
    a_tiempo:  ordenes.filter(o => o.estado === 'a_tiempo').length,
    en_riesgo: ordenes.filter(o => o.estado === 'en_riesgo').length,
    retrasado: ordenes.filter(o => o.estado === 'retrasado').length,
    pendiente: ordenes.filter(o => o.estado === 'pendiente').length,
  };

  const openCreate = () => {
    setEditItem({ estado: 'pendiente', progreso: 0, cumplimiento: 0, desvio: 0, secuencia: ordenes.length + 1, id: Date.now() });
    setModalMode('create');
    setModalOpen(true);
  };
  const openEdit = (orden) => { setEditItem(orden); setModalMode('edit'); setModalOpen(true); };
  const openDelete = (orden) => { setDeleteTarget(orden); setConfirmOpen(true); };

  const handleSave = async (data) => {
    setSaving(true);
    const payload = { ...data, secuencia: data.secuencia || ordenes.length + 1, id: data.id || Date.now() };
    if (modalMode === 'create') {
      const { data: newItem, error } = await insertSecuencia(payload);
      if (!error) setOrdenes(prev => [...prev, newItem || payload]);
    } else {
      const { data: updated, error } = await updateSecuencia(editItem.id, data);
      if (!error) setOrdenes(prev => prev.map(o => o.id === editItem.id ? (updated || { ...o, ...data }) : o));
    }
    setSaving(false);
    setModalOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await deleteSecuencia(deleteTarget.id);
    if (!error) {
      const filtered = ordenes.filter(o => o.id !== deleteTarget.id);
      filtered.forEach((o, i) => { o.secuencia = i + 1; });
      setOrdenes(filtered);
    }
    setDeleting(false);
    setConfirmOpen(false);
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">Secuencia de Fabricación</h2>
          <p className="text-slate-500 text-sm">Órdenes MTO · Turno Mañana</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadData} disabled={loading}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={openCreate}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black transition-all shadow-lg shadow-blue-900/30">
            <Plus className="w-3.5 h-3.5" /> Nueva Orden
          </button>
        </div>
      </motion.div>

      {/* Resumen */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { key: 'a_tiempo',  label: 'A tiempo',  cls: 'border-emerald-500/20 bg-emerald-500/10', txt: 'text-emerald-400' },
          { key: 'en_riesgo', label: 'En riesgo', cls: 'border-amber-500/20 bg-amber-500/10',   txt: 'text-amber-400' },
          { key: 'retrasado', label: 'Retrasado', cls: 'border-red-500/20 bg-red-500/10',       txt: 'text-red-400' },
          { key: 'pendiente', label: 'Pendiente', cls: 'border-slate-700 bg-slate-800/50',      txt: 'text-slate-400' },
        ].map(({ key, label, cls, txt }) => (
          <motion.div key={key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`rounded-2xl border p-4 ${cls}`}>
            <p className={`text-3xl font-black ${txt}`}>{resumen[key]}</p>
            <p className="text-[10px] uppercase font-black text-slate-500 mt-1">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Lista ordenable */}
      <div className="space-y-2">
        {ordenes.map((orden, idx) => (
          <motion.div key={orden.id} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.04 }}
            className="card px-4 py-3 flex items-center gap-4 group hover:border-slate-600/60 transition-all">
            {/* Seq + reorder */}
            <div className="flex flex-col items-center gap-0.5">
              <button onClick={() => mover(idx, -1)} disabled={idx === 0}
                className="p-0.5 rounded text-slate-700 hover:text-slate-300 disabled:opacity-20 transition-colors">
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-black text-slate-600 w-5 text-center">{orden.secuencia}</span>
              <button onClick={() => mover(idx, 1)} disabled={idx === ordenes.length - 1}
                className="p-0.5 rounded text-slate-700 hover:text-slate-300 disabled:opacity-20 transition-colors">
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            <GripVertical className="w-4 h-4 text-slate-800 group-hover:text-slate-600 transition-colors flex-shrink-0" />

            {/* Estado */}
            <div className="flex-shrink-0">{statusIcon[orden.estado]}</div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-black text-white font-mono">{orden.referencia}</span>
                <StatusBadge status={orden.estado} />
              </div>
              <p className="text-xs text-slate-500">{orden.cliente} · <span className="font-mono">{orden.fechaCompromiso}</span></p>
            </div>

            {/* Progreso */}
            <div className="w-28 hidden md:block">
              <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                <span>Progreso</span>
                <span className="font-black text-white">{orden.progreso}%</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <motion.div className={`h-full rounded-full ${orden.estado === 'retrasado' ? 'bg-red-500' : orden.estado === 'en_riesgo' ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  initial={{ width: 0 }} animate={{ width: `${orden.progreso}%` }} transition={{ delay: idx * 0.05 }} />
              </div>
            </div>

            {/* Desvío */}
            {orden.desvio !== 0 && (
              <div className="text-right hidden lg:block">
                <p className={`text-sm font-black ${orden.desvio < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {orden.desvio > 0 ? '+' : ''}{orden.desvio} uds
                </p>
                <p className="text-[10px] text-slate-600">desvío</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
              <button onClick={() => openEdit(orden)} className="p-1.5 rounded-lg text-slate-600 hover:text-blue-400 hover:bg-blue-400/10 transition-all">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => openDelete(orden)} className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-all">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <CrudModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave}
        title={modalMode === 'create' ? 'Nueva Orden de Fabricación' : 'Editar Orden'}
        fields={SECUENCIA_FIELDS} initialData={editItem} saving={saving} />
      <ConfirmDialog isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete}
        title="Eliminar Orden" message={`Se eliminará la orden "${deleteTarget?.referencia}" del ${deleteTarget?.cliente}. ¿Estás seguro?`} deleting={deleting} />
    </div>
  );
}
