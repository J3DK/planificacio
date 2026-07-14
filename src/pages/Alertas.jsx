import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Wrench, Clock, TrendingDown, Package, CheckCircle2, BarChart2, Bell, Check, Plus, Pencil, Trash2, RefreshCw } from 'lucide-react';
import { fetchAlertas, insertAlerta, updateAlerta, deleteAlerta } from '@/services/dataService';
import CrudModal from '@/components/shared/CrudModal';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

const iconMap = { AlertTriangle, Wrench, Clock, TrendingDown, Package, CheckCircle: CheckCircle2, BarChart2 };
const tipoConfig = {
  critica:    { cls: 'border-red-500/30 bg-red-500/5',     badge: 'badge-danger', label: 'Crítica',     iconCls: 'text-red-400' },
  advertencia:{ cls: 'border-amber-500/30 bg-amber-500/5', badge: 'badge-warn',   label: 'Advertencia', iconCls: 'text-amber-400' },
  info:       { cls: 'border-blue-500/20 bg-blue-500/5',   badge: 'badge-info',   label: 'Info',        iconCls: 'text-blue-400' },
};
const moduloLabel = { materias_primas: 'Materias Primas', paradas: 'Paradas', secuencia: 'Secuencia', lineas: 'Líneas', produccion: 'Producción' };

const ALERTA_FIELDS = [
  { key: 'tipo',        label: 'Tipo',        type: 'select', required: true,
    options: [{ value: 'critica', label: 'Crítica' }, { value: 'advertencia', label: 'Advertencia' }, { value: 'info', label: 'Info' }] },
  { key: 'titulo',      label: 'Título',      type: 'text',   required: true, placeholder: 'Ruptura de stock...' },
  { key: 'descripcion', label: 'Descripción', type: 'textarea', placeholder: 'Descripción detallada...' },
  { key: 'modulo',      label: 'Módulo',      type: 'select',
    options: [{ value: 'materias_primas', label: 'Materias Primas' }, { value: 'paradas', label: 'Paradas' }, { value: 'secuencia', label: 'Secuencia' }, { value: 'lineas', label: 'Líneas' }, { value: 'produccion', label: 'Producción' }] },
  { key: 'linea',       label: 'Línea',       type: 'text',   placeholder: 'Línea 3' },
  { key: 'icono',       label: 'Icono',       type: 'select',
    options: ['AlertTriangle', 'Wrench', 'Clock', 'TrendingDown', 'Package', 'CheckCircle', 'BarChart2'] },
];

export default function Alertas() {
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [soloNoLeidas, setSoloNoLeidas] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [editItem, setEditItem] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const { data } = await fetchAlertas();
    setAlertas(data || []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const marcarLeida = async (id) => {
    await updateAlerta(id, { leida: true });
    setAlertas(prev => prev.map(a => a.id === id ? { ...a, leida: true } : a));
  };
  const marcarTodasLeidas = () => {
    alertas.forEach(a => !a.leida && updateAlerta(a.id, { leida: true }));
    setAlertas(prev => prev.map(a => ({ ...a, leida: true })));
  };

  const alertasFiltradas = alertas.filter(a => {
    const matchTipo = filtroTipo === 'todos' || a.tipo === filtroTipo;
    const matchLeida = !soloNoLeidas || !a.leida;
    return matchTipo && matchLeida;
  });

  const noLeidas = alertas.filter(a => !a.leida).length;
  const criticas = alertas.filter(a => a.tipo === 'critica').length;
  const advertencias = alertas.filter(a => a.tipo === 'advertencia').length;

  const openCreate = () => { setEditItem({ tipo: 'info', leida: false, timestamp: new Date().toISOString() }); setModalMode('create'); setModalOpen(true); };
  const openEdit = (e, alerta) => { e.stopPropagation(); setEditItem(alerta); setModalMode('edit'); setModalOpen(true); };
  const openDelete = (e, alerta) => { e.stopPropagation(); setDeleteTarget(alerta); setConfirmOpen(true); };

  const handleSave = async (data) => {
    setSaving(true);
    const payload = { ...data, timestamp: data.timestamp || new Date().toISOString(), leida: false };
    if (modalMode === 'create') {
      const { data: newItem, error } = await insertAlerta(payload);
      if (!error) setAlertas(prev => [newItem || { ...payload, id: Date.now() }, ...prev]);
    } else {
      const { data: updated, error } = await updateAlerta(editItem.id, data);
      if (!error) setAlertas(prev => prev.map(a => a.id === editItem.id ? (updated || { ...a, ...data }) : a));
    }
    setSaving(false);
    setModalOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await deleteAlerta(deleteTarget.id);
    if (!error) setAlertas(prev => prev.filter(a => a.id !== deleteTarget.id));
    setDeleting(false);
    setConfirmOpen(false);
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">Centro de Alertas</h2>
          <p className="text-slate-500 text-sm">Notificaciones activas y registro</p>
        </div>
        <div className="flex items-center gap-2">
          {noLeidas > 0 && (
            <button onClick={marcarTodasLeidas}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all">
              <Check className="w-3.5 h-3.5" /> Marcar leídas
            </button>
          )}
          <button onClick={loadData} disabled={loading}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={openCreate}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black transition-all shadow-lg shadow-blue-900/30">
            <Plus className="w-3.5 h-3.5" /> Nueva Alerta
          </button>
        </div>
      </motion.div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
          <p className="text-3xl font-black text-red-400">{criticas}</p>
          <p className="text-[10px] uppercase font-black text-slate-500 mt-1">Críticas</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
          <p className="text-3xl font-black text-amber-400">{advertencias}</p>
          <p className="text-[10px] uppercase font-black text-slate-500 mt-1">Advertencias</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-slate-700 bg-slate-800/50 p-4">
          <p className="text-3xl font-black text-white">{noLeidas}</p>
          <p className="text-[10px] uppercase font-black text-slate-500 mt-1">Sin leer</p>
        </motion.div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          {['todos','critica','advertencia','info'].map(t => (
            <button key={t} onClick={() => setFiltroTipo(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${filtroTipo === t ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
              {t === 'todos' ? 'Todos' : tipoConfig[t]?.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <div onClick={() => setSoloNoLeidas(!soloNoLeidas)}
            className={`w-10 h-5 rounded-full transition-all relative ${soloNoLeidas ? 'bg-blue-600' : 'bg-slate-700'}`}>
            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${soloNoLeidas ? 'left-5' : 'left-0.5'}`} />
          </div>
          <span className="text-sm text-slate-400 font-medium">Solo no leídas</span>
        </label>
      </div>

      {/* Lista */}
      <div className="space-y-3">
        <AnimatePresence>
          {alertasFiltradas.map((alerta, i) => {
            const cfg = tipoConfig[alerta.tipo];
            const Icon = iconMap[alerta.icono] || Bell;
            return (
              <motion.div key={alerta.id} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ delay: i * 0.04 }}
                className={`relative border rounded-2xl p-4 transition-all group ${cfg.cls} ${alerta.leida ? 'opacity-50' : ''}`}>
                {!alerta.leida && <div className="absolute top-4 right-4 w-2 h-2 bg-blue-400 rounded-full animate-pulse" />}
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.cls}`}>
                    <Icon className={`w-4 h-4 ${cfg.iconCls}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${cfg.badge}`}>{cfg.label}</span>
                      {alerta.linea && <span className="badge-neutral px-2 py-0.5 rounded-lg text-[10px] font-black">{alerta.linea}</span>}
                      <span className="text-[10px] text-slate-600">{moduloLabel[alerta.modulo]}</span>
                    </div>
                    <h4 className="font-black text-white text-sm mb-1">{alerta.titulo}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{alerta.descripcion}</p>
                    <p className="text-[10px] text-slate-600 mt-2 font-mono">
                      {new Date(alerta.timestamp).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    {!alerta.leida && (
                      <button onClick={() => marcarLeida(alerta.id)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all" title="Marcar leída">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button onClick={e => openEdit(e, alerta)}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-blue-400 hover:bg-blue-400/10 transition-all">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={e => openDelete(e, alerta)}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {alertasFiltradas.length === 0 && (
          <div className="text-center py-16 text-slate-600">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-bold">No hay alertas con los filtros seleccionados</p>
          </div>
        )}
      </div>

      <CrudModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave}
        title={modalMode === 'create' ? 'Nueva Alerta' : 'Editar Alerta'}
        fields={ALERTA_FIELDS} initialData={editItem} saving={saving} />
      <ConfirmDialog isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete}
        title={`Eliminar alerta`} message={`Se eliminará "${deleteTarget?.titulo}". ¿Estás seguro?`} deleting={deleting} />
    </div>
  );
}
