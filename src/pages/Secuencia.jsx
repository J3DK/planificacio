import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GripVertical, Clock, AlertTriangle, CheckCircle2, Circle,
  ChevronUp, ChevronDown, Plus, Pencil, Trash2, RefreshCw,
  MoreVertical, ArrowRightLeft, FileWarning, Wrench, X, Check,
  Factory, AlertCircle, Loader2
} from 'lucide-react';
import {
  fetchSecuencia, insertSecuencia, updateSecuencia, deleteSecuencia,
  fetchLineas, updateOrdenPlanificacion, fetchPlanificacion,
  reordenarSecuenciaEnGantt, saveIncidenciaSecuencia,
  insertOrdenTrabajoDesdeSecuencia
} from '@/services/dataService';
import StatusBadge from '@/components/shared/StatusBadge';
import CrudModal from '@/components/shared/CrudModal';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

const statusIcon = {
  a_tiempo:  <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
  en_riesgo: <Clock className="w-4 h-4 text-amber-400" />,
  retrasado: <AlertTriangle className="w-4 h-4 text-red-400" />,
  pendiente: <Circle className="w-4 h-4 text-slate-600" />,
};

const LINEA_COLORS = {
  L1: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  L2: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
  L3: 'bg-red-500/20 text-red-300 border-red-500/40',
  L4: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  L5: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
};

const MOTIVOS_INCIDENCIA = [
  { value: 'falta_material',    label: '📦 Falta de material' },
  { value: 'averia',            label: '🔧 Avería / fallo mecánico' },
  { value: 'cambio_prioridad',  label: '🔀 Cambio de prioridad' },
  { value: 'otro',              label: '📝 Otro motivo' },
];

const SECUENCIA_FIELDS = [
  { key: 'referencia',       label: 'Referencia (producto)', type: 'text',   required: true, placeholder: 'BAT-48V-100Ah' },
  { key: 'cliente',          label: 'Cliente',               type: 'text',   required: true, placeholder: 'Cliente A' },
  { key: 'fechaCompromiso',  label: 'Fecha Compromiso',      type: 'text',   required: true, placeholder: '31/05/2024 07:30' },
  { key: 'estado',           label: 'Estado',                type: 'select', required: true,
    options: [
      { value: 'a_tiempo',  label: 'A tiempo' },
      { value: 'en_riesgo', label: 'En riesgo' },
      { value: 'retrasado', label: 'Retrasado' },
      { value: 'pendiente', label: 'Pendiente' },
    ]},
  { key: 'progreso',     label: 'Progreso (%)',     type: 'number', min: 0, max: 100, default: 0 },
  { key: 'cumplimiento', label: 'Cumplimiento (%)', type: 'number', min: 0, max: 100, default: 0 },
  { key: 'desvio',       label: 'Desvío (uds)',     type: 'number', default: 0 },
];

// ─── Modal de Reasignación de Línea ──────────────────────────────────────────
function ModalReasignar({ orden, lineas, onConfirm, onClose }) {
  const [lineaSeleccionada, setLineaSeleccionada] = useState(orden.lineaAsignada || '');
  const [saving, setSaving] = useState(false);

  const handleConfirm = async () => {
    if (!lineaSeleccionada) return;
    setSaving(true);
    await onConfirm(orden, lineaSeleccionada);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 w-full max-w-md"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-black text-base flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-blue-400" />
            Reasignar Línea
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mb-4 p-3 rounded-xl bg-slate-800/60 border border-slate-700">
          <p className="text-xs font-black text-slate-400 uppercase mb-1">Orden</p>
          <p className="text-sm font-black text-white">{orden.referencia}</p>
          <p className="text-xs text-slate-500">{orden.cliente}</p>
          {orden.lineaNombre && (
            <p className="text-xs text-slate-500 mt-1">
              Línea actual: <span className="text-blue-400 font-bold">{orden.lineaNombre}</span>
            </p>
          )}
        </div>

        <div className="mb-6">
          <label className="text-xs font-black text-slate-400 uppercase block mb-2">Nueva línea destino</label>
          <div className="space-y-2">
            {lineas.map(l => (
              <button
                key={l.id}
                onClick={() => setLineaSeleccionada(l.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                  lineaSeleccionada === l.id
                    ? 'border-blue-500 bg-blue-500/15'
                    : 'border-slate-700 bg-slate-800/40 hover:border-slate-600'
                }`}
              >
                <Factory className={`w-4 h-4 flex-shrink-0 ${lineaSeleccionada === l.id ? 'text-blue-400' : 'text-slate-500'}`} />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-black text-white">{l.nombre}</span>
                  <span className={`text-xs ml-2 ${l.estado === 'en_marcha' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {l.estado === 'en_marcha' ? '● En marcha' : '● Parada'}
                  </span>
                </div>
                {lineaSeleccionada === l.id && <Check className="w-4 h-4 text-blue-400 flex-shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 text-sm font-bold hover:bg-slate-800 transition-all">
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!lineaSeleccionada || saving}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-black transition-all disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {saving ? 'Reasignando…' : 'Confirmar'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Modal de Reporte de Incidencia ──────────────────────────────────────────
function ModalIncidencia({ orden, onConfirm, onClose }) {
  const [motivo, setMotivo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [notificarMto, setNotificarMto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exito, setExito] = useState(null); // null | 'incidencia' | 'mto'

  const handleGuardar = async () => {
    if (!motivo) return;
    setSaving(true);
    await onConfirm({ orden, motivo, descripcion, notificarMto });
    setExito(notificarMto ? 'mto' : 'incidencia');
    setSaving(false);
  };

  if (exito) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center"
        >
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <p className="text-white font-black text-base mb-1">
            {exito === 'mto' ? '¡Aviso enviado a Mantenimiento!' : 'Incidencia registrada'}
          </p>
          <p className="text-slate-500 text-sm mb-5">
            {exito === 'mto'
              ? 'Se ha creado una OT correctiva en el módulo de Mantenimiento.'
              : 'La incidencia queda registrada en el histórico de esta orden.'}
          </p>
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm transition-all">
            Cerrar
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 w-full max-w-md"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-black text-base flex items-center gap-2">
            <FileWarning className="w-4 h-4 text-amber-400" />
            Reportar Incidencia
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mb-4 p-3 rounded-xl bg-slate-800/60 border border-slate-700">
          <p className="text-xs font-black text-slate-400 uppercase mb-0.5">Orden afectada</p>
          <p className="text-sm font-black text-white">{orden.referencia} · {orden.cliente}</p>
          {orden.lineaNombre && (
            <p className="text-xs text-slate-500">{orden.lineaNombre}</p>
          )}
        </div>

        <div className="mb-4">
          <label className="text-xs font-black text-slate-400 uppercase block mb-2">Motivo del retraso *</label>
          <div className="grid grid-cols-2 gap-2">
            {MOTIVOS_INCIDENCIA.map(m => (
              <button
                key={m.value}
                onClick={() => { setMotivo(m.value); if (m.value !== 'averia') setNotificarMto(false); }}
                className={`p-3 rounded-xl border text-left text-xs font-bold transition-all ${
                  motivo === m.value
                    ? 'border-amber-500 bg-amber-500/15 text-amber-300'
                    : 'border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-600'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="text-xs font-black text-slate-400 uppercase block mb-2">Descripción adicional</label>
          <textarea
            value={descripcion}
            onChange={e => setDescripcion(e.target.value)}
            rows={3}
            placeholder="Detalla el problema observado…"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-slate-500 resize-none"
          />
        </div>

        {/* Notificar Mantenimiento — solo si motivo === avería */}
        <AnimatePresence>
          {motivo === 'averia' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden"
            >
              <button
                onClick={() => setNotificarMto(v => !v)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                  notificarMto
                    ? 'border-orange-500 bg-orange-500/15'
                    : 'border-slate-700 bg-slate-800/40 hover:border-slate-600'
                }`}
              >
                <Wrench className={`w-4 h-4 flex-shrink-0 ${notificarMto ? 'text-orange-400' : 'text-slate-500'}`} />
                <div className="flex-1">
                  <p className={`text-sm font-black ${notificarMto ? 'text-orange-300' : 'text-slate-300'}`}>
                    Notificar a Mantenimiento
                  </p>
                  <p className="text-xs text-slate-500">Crea una OT correctiva en el módulo de Mantenimiento</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  notificarMto ? 'border-orange-500 bg-orange-500' : 'border-slate-600'
                }`}>
                  {notificarMto && <Check className="w-3 h-3 text-white" />}
                </div>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 text-sm font-bold hover:bg-slate-800 transition-all">
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={!motivo || saving}
            className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-black transition-all disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {saving ? 'Guardando…' : 'Registrar'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Menú contextual ─────────────────────────────────────────────────────────
function MenuAcciones({ orden, onReasignar, onIncidencia }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="p-1.5 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-amber-400/10 transition-all"
        title="Acciones sobre esta orden"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            className="absolute right-0 top-full mt-1 z-40 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl shadow-black/50 overflow-hidden min-w-[200px]"
          >
            <div className="px-3 py-2 border-b border-slate-800">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Acciones rápidas</p>
            </div>
            <button
              onClick={() => { setOpen(false); onReasignar(orden); }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-left"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
              Reasignar línea
            </button>
            <button
              onClick={() => { setOpen(false); onIncidencia(orden); }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-left"
            >
              <FileWarning className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              Reportar incidencia
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function Secuencia() {
  const [ordenes, setOrdenes] = useState([]);
  const [lineas, setLineas]   = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen]   = useState(false);
  const [modalMode, setModalMode]   = useState('create');
  const [editItem, setEditItem]     = useState({});
  const [saving, setSaving]         = useState(false);
  const [confirmOpen, setConfirmOpen]   = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);

  // Modales de acciones
  const [reasignarOrden, setReasignarOrden]   = useState(null);
  const [incidenciaOrden, setIncidenciaOrden] = useState(null);

  // Toast de confirmación
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    const [resS, resL] = await Promise.all([fetchSecuencia(), fetchLineas()]);
    setOrdenes(resS.data || []);
    setLineas(resL.data || []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  // Escuchar cambios de Planificación (Gantt) → refrescar datos
  useEffect(() => {
    const handler = () => loadData();
    window.addEventListener('planificacion_updated', handler);
    return () => window.removeEventListener('planificacion_updated', handler);
  }, []);

  // ─── Reordenamiento de prioridad ──────────────────────────────────────────
  const mover = (idx, dir) => {
    const newOrdenes = [...ordenes];
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= newOrdenes.length) return;
    [newOrdenes[idx], newOrdenes[targetIdx]] = [newOrdenes[targetIdx], newOrdenes[idx]];
    newOrdenes.forEach((o, i) => { o.secuencia = i + 1; });
    setOrdenes(newOrdenes);
    // Propagar cambio de orden al Gantt (para órdenes con línea asignada)
    reordenarSecuenciaEnGantt(newOrdenes);
    // Notificar a Planificación para que recargue
    window.dispatchEvent(new CustomEvent('secuencia_reordenada', { detail: newOrdenes }));
  };

  // ─── CRUD ─────────────────────────────────────────────────────────────────
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
  const openEdit   = (orden) => { setEditItem(orden); setModalMode('edit'); setModalOpen(true); };
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

  // ─── Reasignación de línea ─────────────────────────────────────────────────
  const handleReasignar = async (orden, nuevaLineaId) => {
    const nuevaLinea = lineas.find(l => l.id === nuevaLineaId);
    if (!orden.ganttId || !nuevaLinea) { setReasignarOrden(null); return; }

    // Actualizar en el Gantt
    await updateOrdenPlanificacion(orden.ganttId, { linea: nuevaLineaId });

    // Actualizar estado local de Secuencia
    setOrdenes(prev => prev.map(o =>
      o.id === orden.id
        ? { ...o, lineaAsignada: nuevaLineaId, lineaNombre: nuevaLinea.nombre }
        : o
    ));

    setReasignarOrden(null);
    showToast(`Orden reasignada a ${nuevaLinea.nombre}`);

    // El evento planificacion_updated lo emitirá syncGanttToRestOfApp al guardar
  };

  // ─── Reporte de incidencia ─────────────────────────────────────────────────
  const handleIncidencia = async ({ orden, motivo, descripcion, notificarMto }) => {
    // Guardar en histórico de incidencias
    saveIncidenciaSecuencia({
      ordenId: orden.id,
      ganttId: orden.ganttId,
      referencia: orden.referencia,
      cliente: orden.cliente,
      lineaAsignada: orden.lineaAsignada,
      lineaNombre: orden.lineaNombre,
      motivo,
      descripcion,
    });

    // Crear OT en Mantenimiento si es avería y el usuario lo marcó
    if (notificarMto && motivo === 'averia') {
      await insertOrdenTrabajoDesdeSecuencia(orden, 'Avería', descripcion);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] px-5 py-3 rounded-2xl bg-emerald-600 text-white font-black text-sm shadow-2xl shadow-emerald-900/50 flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cabecera */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">Secuencia de Fabricación</h2>
          <p className="text-slate-500 text-sm">Órdenes MTO · Turno Mañana · Sincronizado con Planificación</p>
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
          { key: 'en_riesgo', label: 'En riesgo', cls: 'border-amber-500/20 bg-amber-500/10',     txt: 'text-amber-400'   },
          { key: 'retrasado', label: 'Retrasado', cls: 'border-red-500/20 bg-red-500/10',         txt: 'text-red-400'     },
          { key: 'pendiente', label: 'Pendiente', cls: 'border-slate-700 bg-slate-800/50',        txt: 'text-slate-400'   },
        ].map(({ key, label, cls, txt }) => (
          <motion.div key={key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`rounded-2xl border p-4 ${cls}`}>
            <p className={`text-3xl font-black ${txt}`}>{resumen[key]}</p>
            <p className="text-[10px] uppercase font-black text-slate-500 mt-1">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Lista ordenable */}
      <div className="space-y-2">
        {ordenes.map((orden, idx) => {
          const esRiesgoORetraso = orden.estado === 'en_riesgo' || orden.estado === 'retrasado';
          const lineaColor = orden.lineaAsignada ? (LINEA_COLORS[orden.lineaAsignada] || 'bg-slate-700/40 text-slate-400 border-slate-600') : null;

          return (
            <motion.div
              key={orden.id}
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03 }}
              className={`card px-4 py-3 flex items-center gap-4 group hover:border-slate-600/60 transition-all ${
                esRiesgoORetraso ? 'border-l-2 border-l-amber-500/60' : ''
              }`}
            >
              {/* Seq + reorder */}
              <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
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
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="text-sm font-black text-white font-mono">{orden.referencia}</span>
                  <StatusBadge status={orden.estado} />
                  {/* Badge de línea asignada */}
                  {orden.lineaNombre ? (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black border ${lineaColor}`}>
                      <Factory className="w-2.5 h-2.5" />
                      {orden.lineaNombre}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black border border-slate-700 bg-slate-800/50 text-slate-500">
                      <Circle className="w-2.5 h-2.5" />
                      Sin planificar
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  {orden.cliente} · <span className="font-mono">{orden.fechaCompromiso}</span>
                </p>
              </div>

              {/* Progreso */}
              <div className="w-28 hidden md:block flex-shrink-0">
                <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                  <span>Progreso</span>
                  <span className="font-black text-white">{orden.progreso}%</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${
                      orden.estado === 'retrasado' ? 'bg-red-500' :
                      orden.estado === 'en_riesgo' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${orden.progreso}%` }}
                    transition={{ delay: idx * 0.05 }}
                  />
                </div>
              </div>

              {/* Desvío */}
              {orden.desvio !== 0 && (
                <div className="text-right hidden lg:block flex-shrink-0">
                  <p className={`text-sm font-black ${orden.desvio < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {orden.desvio > 0 ? '+' : ''}{orden.desvio} uds
                  </p>
                  <p className="text-[10px] text-slate-600">desvío</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {/* Menú ⋮ de acciones rápidas — solo en riesgo o retrasado */}
                {esRiesgoORetraso && (
                  <MenuAcciones
                    orden={orden}
                    onReasignar={setReasignarOrden}
                    onIncidencia={setIncidenciaOrden}
                  />
                )}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <button onClick={() => openEdit(orden)} className="p-1.5 rounded-lg text-slate-600 hover:text-blue-400 hover:bg-blue-400/10 transition-all">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => openDelete(orden)} className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Modales CRUD */}
      <CrudModal
        isOpen={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave}
        title={modalMode === 'create' ? 'Nueva Orden de Fabricación' : 'Editar Orden'}
        fields={SECUENCIA_FIELDS} initialData={editItem} saving={saving}
      />
      <ConfirmDialog
        isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete}
        title="Eliminar Orden"
        message={`Se eliminará la orden "${deleteTarget?.referencia}" del ${deleteTarget?.cliente}. ¿Estás seguro?`}
        deleting={deleting}
      />

      {/* Modal Reasignar Línea */}
      <AnimatePresence>
        {reasignarOrden && (
          <ModalReasignar
            orden={reasignarOrden}
            lineas={lineas}
            onConfirm={handleReasignar}
            onClose={() => setReasignarOrden(null)}
          />
        )}
      </AnimatePresence>

      {/* Modal Reportar Incidencia */}
      <AnimatePresence>
        {incidenciaOrden && (
          <ModalIncidencia
            orden={incidenciaOrden}
            onConfirm={handleIncidencia}
            onClose={() => setIncidenciaOrden(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
