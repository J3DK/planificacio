import React, { useState, useEffect } from 'react';
import { useAppConfig } from '@/services/configService';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import {
  fetchParadas, insertParada, updateParada, deleteParada,
  fetchParadasPredeterminadas, insertParadaPredeterminada, updateParadaPredeterminada, deleteParadaPredeterminada,
  generarOtDesdeParada, getCurrentShiftInfo, fetchOrdenesTrabajo
} from '@/services/dataService';
import { paradasPorTipo, oeeWaterfall } from '@/data/mockParadas';
import {
  Clock, AlertTriangle, Wrench, Filter, Plus, Pencil, Trash2, RefreshCw,
  Settings, Layers, Tag, Search, CheckCircle2, Sliders, ArrowRight, ShieldAlert, Sparkles, LayoutGrid, List, X
} from 'lucide-react';
import CrudModal from '@/components/shared/CrudModal';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

const TIPO_COLORS = { averia: '#ef4444', mantenimiento: '#f59e0b', cambio: '#3b82f6', calidad: '#8b5cf6' };
const TIPO_LABELS = { averia: 'Avería', mantenimiento: 'Mant.', cambio: 'Cambio ref.', calidad: 'Calidad' };
const TIPO_ICONS = {
  averia: <AlertTriangle className="w-3.5 h-3.5 text-red-400" />,
  mantenimiento: <Wrench className="w-3.5 h-3.5 text-amber-400" />,
  cambio: <Filter className="w-3.5 h-3.5 text-blue-400" />,
  calidad: <Clock className="w-3.5 h-3.5 text-purple-400" />,
};

const PARADA_FIELDS = [
  { key: 'linea',    label: 'Línea',     type: 'select', required: true,
    options: ['Línea 1', 'Línea 2', 'Línea 3', 'Línea 4', 'Línea 5'] },
  { key: 'inicio',   label: 'Inicio',    type: 'text', required: true, placeholder: '07:15' },
  { key: 'fin',      label: 'Fin',       type: 'text', placeholder: '07:42 (vacío = En curso)' },
  { key: 'duracion', label: 'Duración (min)', type: 'number', min: 0, default: 0 },
  { key: 'tipo',     label: 'Categoría / Tipo', type: 'select', required: true,
    options: [{ value: 'averia', label: '🔴 Avería' }, { value: 'mantenimiento', label: '🟠 Mantenimiento' }, { value: 'cambio', label: '🔵 Cambio ref.' }, { value: 'calidad', label: '🟣 Calidad' }] },
  { key: 'causa',    label: 'Causa (Puede autocompletarse)', type: 'textarea', required: true, placeholder: 'Descripción detallada de la causa...' },
  { key: 'impacto',  label: 'Impacto (uds pérdidas)', type: 'number', min: 0, default: 0 },
  { key: 'estado',   label: 'Estado',    type: 'select', required: true,
    options: [{ value: 'abierta', label: 'Abierta' }, { value: 'cerrada', label: 'Cerrada' }] },
];

const PARADA_PRED_FIELDS = [
  { key: 'codigo', label: 'Código MES / Referencia', type: 'text', required: true, placeholder: 'ej: ERR-MEC-01 o MNT-05' },
  {
    key: 'categoria', label: 'Categoría / Tipo de Parada', type: 'select', required: true,
    options: [
      { value: 'averia', label: '🔴 Avería (Mecánica, Eléctrica, Neumática...)' },
      { value: 'mantenimiento', label: '🟠 Mantenimiento (Preventivo, Lubricación, Limpieza...)' },
      { value: 'cambio', label: '🔵 Cambio de Referencia / Ajuste de Utillajes' },
      { value: 'calidad', label: '🟣 Control de Calidad / Inspección / Retrabajo' }
    ]
  },
  { key: 'causa', label: 'Descripción / Causa Predeterminada', type: 'textarea', required: true, placeholder: 'ej: Atasco en cinta o falta de stock de conectores en línea...' },
  { key: 'tiempoEst', label: 'Tiempo Est. Teórico (minutos)', type: 'number', min: 1, default: 15 },
  { key: 'impactoHora', label: 'Impacto Teórico (uds perjudiciales/hora)', type: 'number', min: 0, default: 100 },
];

const totalMin = paradasPorTipo.reduce((s, p) => s + p.minutos, 0);

export default function Paradas() {
  const appConfig = useAppConfig();
  const [activeTab, setActiveTab] = useState('turno'); // 'turno' | 'predeterminadas'
  const [paradas, setParadas] = useState([]);
  const [predeterminadas, setPredeterminadas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modales Turno
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [editItem, setEditItem] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [otConfirmOpen, setOtConfirmOpen] = useState(false);
  const [otTarget, setOtTarget] = useState(null);
  const [generatingOt, setGeneratingOt] = useState(false);

  // Modales Paradas Predeterminadas
  const [predModalOpen, setPredModalOpen] = useState(false);
  const [predModalMode, setPredModalMode] = useState('create');
  const [editPredItem, setEditPredItem] = useState({});
  const [predConfirmOpen, setPredConfirmOpen] = useState(false);
  const [deletePredTarget, setDeletePredTarget] = useState(null);

  // Filtros Paradas Predeterminadas
  const [filtroCatPred, setFiltroCatPred] = useState('todas');
  const [busquedaPred, setBusquedaPred] = useState('');
  const [viewModePred, setViewModePred] = useState(appConfig?.defaultViewMode || 'grid'); // 'grid' | 'table'

  const loadData = async () => {
    setLoading(true);
    const [resTurno, resPred] = await Promise.all([
      fetchParadas(),
      fetchParadasPredeterminadas()
    ]);
    setParadas(resTurno.data || []);
    setPredeterminadas(resPred.data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const handler = () => loadData();
    window.addEventListener('paradas_updated', handler);
    window.addEventListener('mantenimiento_updated', handler);
    window.addEventListener('lineas_updated', handler);
    return () => {
      window.removeEventListener('paradas_updated', handler);
      window.removeEventListener('mantenimiento_updated', handler);
      window.removeEventListener('lineas_updated', handler);
    };
  }, []);

  // Handlers Turno
  const openCreate = () => { setEditItem({ estado: 'abierta', duracion: 0, impacto: 0, tipo: 'averia' }); setModalMode('create'); setModalOpen(true); };
  const openEdit = (parada) => { setEditItem(parada); setModalMode('edit'); setModalOpen(true); };
  const openDelete = (parada) => { setDeleteTarget(parada); setConfirmOpen(true); };
  const openConfirmOt = (parada) => {
    if (parada.estado === 'cerrada') {
      alert('⚠️ No se puede vincular ni generar una Orden de Trabajo (OT) para una parada que ya está cerrada.');
      return;
    }
    setOtTarget(parada);
    setOtConfirmOpen(true);
  };

  const handleConfirmGenerarOt = async () => {
    if (!otTarget) return;
    setGeneratingOt(true);
    const { data: newOt } = await generarOtDesdeParada(otTarget);
    setGeneratingOt(false);
    setOtConfirmOpen(false);
    if (newOt) {
      setParadas(prev => prev.map(p => p.id === otTarget.id ? { ...p, otAsignada: newOt.codigo, otId: newOt.id } : p));
      alert(`✅ Orden de Trabajo (${newOt?.codigo || 'OT'}) generada y vinculada en Mantenimiento para la parada #${otTarget.id}.`);
    }
  };

  const handleSave = async (data) => {
    setSaving(true);
    let targetId = editItem.id || Date.now();

    // Verificación si se intenta cerrar una parada vinculada a OT
    if (modalMode === 'edit' && data.estado === 'cerrada' && editItem.estado !== 'cerrada') {
      const { data: ots = [] } = await fetchOrdenesTrabajo();
      const otVinculada = ots.find(o => String(o.paradaId) === String(editItem.id) || o.id === editItem.otId || o.codigo === editItem.otAsignada);
      
      if (otVinculada && otVinculada.estado !== 'completada' && otVinculada.estado !== 'cerrada') {
        alert(`🔒 No se puede cerrar la parada #${editItem.id} porque tiene asignada la Orden de Trabajo abierta [${otVinculada.codigo}].\n\n⚠️ Si se le asigna una OT, solo Mantenimiento la puede cerrar una vez se complete la intervención en el módulo de Mantenimiento.`);
        setSaving(false);
        return;
      } else if (editItem.otAsignada || editItem.otId || otVinculada) {
        if (!window.confirm(`⚠️ Esta parada está vinculada a la OT (${editItem.otAsignada || editItem.otId || otVinculada?.codigo}).\n\n¿Confirmas que actúas por parte de Mantenimiento y que la intervención ha concluido para poder cerrar la parada?`)) {
          setSaving(false);
          return;
        }
      }
    }

    if (modalMode === 'create') {
      const { data: newItem, error } = await insertParada(data);
      if (!error) {
        const created = newItem || { ...data, id: targetId };
        setParadas(prev => [...prev, created]);
        targetId = created.id;
        // Si la categoría es Avería y no está cerrada, preguntar para generar OT en mantenimiento
        if (data.tipo === 'averia' && data.estado !== 'cerrada' && window.confirm('Esta parada se ha clasificado como "Avería". ¿Deseas generar automáticamente una Orden de Trabajo (OT) vinculada en el módulo de Mantenimiento?')) {
          await generarOtDesdeParada(created);
        }
      }
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

  // Handlers Predeterminadas
  const openCreatePred = () => {
    setEditPredItem({
      codigo: `PAR-${Math.floor(100 + Math.random() * 900)}`,
      categoria: 'averia',
      causa: '',
      tiempoEst: 15,
      impactoHora: 100
    });
    setPredModalMode('create');
    setPredModalOpen(true);
  };

  const openEditPred = (item) => { setEditPredItem(item); setPredModalMode('edit'); setPredModalOpen(true); };
  const openDeletePred = (item) => { setDeletePredTarget(item); setPredConfirmOpen(true); };

  const handleSavePred = async (data) => {
    setSaving(true);
    const itemToSave = {
      ...data,
      tiempoEst: Number(data.tiempoEst) || 15,
      impactoHora: Number(data.impactoHora) || 0
    };
    if (predModalMode === 'create') {
      const { data: newItem } = await insertParadaPredeterminada(itemToSave);
      if (newItem) setPredeterminadas(prev => [...prev, newItem]);
    } else {
      const { data: updated } = await updateParadaPredeterminada(editPredItem.id, itemToSave);
      if (updated) setPredeterminadas(prev => prev.map(p => p.id === editPredItem.id ? updated : p));
    }
    setSaving(false);
    setPredModalOpen(false);
  };

  const handleDeletePred = async () => {
    if (!deletePredTarget) return;
    setDeleting(true);
    await deleteParadaPredeterminada(deletePredTarget.id);
    setPredeterminadas(prev => prev.filter(p => p.id !== deletePredTarget.id));
    setDeleting(false);
    setPredConfirmOpen(false);
    setDeletePredTarget(null);
  };

  // Autocompletar parada del turno desde una predeterminada al crear
  const seleccionarPredeterminadaEnTurno = (pred) => {
    setEditItem(prev => ({
      ...prev,
      tipo: pred.categoria,
      causa: `[${pred.codigo}] ${pred.causa}`,
      duracion: pred.tiempoEst,
      impacto: Math.round((pred.tiempoEst / 60) * (pred.impactoHora || 100))
    }));
  };

  // Filtrado de Predeterminadas
  const predeterminadasFiltradas = predeterminadas.filter(p => {
    if (filtroCatPred !== 'todas' && p.categoria !== filtroCatPred) return false;
    if (busquedaPred.trim()) {
      const q = busquedaPred.toLowerCase();
      return (p.codigo || '').toLowerCase().includes(q) || (p.causa || '').toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto">
      {/* Header superior con Pestañas */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3">
            Gestión Integral de Paradas & OEE
          </h2>
          <p className="text-slate-500 text-sm flex items-center gap-2 mt-0.5">
            Registro del turno y configuración del catálogo maestro de paradas predeterminadas
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Navegador de Pestañas */}
          <div className="bg-slate-900 border border-slate-800 p-1 rounded-xl flex items-center gap-1">
            <button
              onClick={() => setActiveTab('turno')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all ${
                activeTab === 'turno' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" /> Registro Turno ({paradas.length})
            </button>
            <button
              onClick={() => setActiveTab('predeterminadas')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all ${
                activeTab === 'predeterminadas' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Settings className="w-3.5 h-3.5" /> Paradas Predeterminadas ({predeterminadas.length})
            </button>
          </div>

          <button onClick={loadData} disabled={loading}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {activeTab === 'turno' ? (
          /* ─── PESTAÑA 1: REGISTRO Y OEE DEL TURNO ─────────────────────────── */
          <motion.div key="turno" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            <div className="flex items-center justify-between bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-black">
                  OEE
                </div>
                <div>
                  <h3 className="text-white font-black text-sm">Monitoreo de Pérdidas por Parada — Turno {getCurrentShiftInfo().shift}</h3>
                  <p className="text-xs text-slate-400">Las paradas abiertas impactan dinámicamente en el KPI de Disponibilidad de la planta</p>
                </div>
              </div>
              <button onClick={openCreate}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black transition-all shadow-lg shadow-blue-900/30 active:scale-95">
                <Plus className="w-4 h-4" /> Registrar Nueva Parada
              </button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {paradasPorTipo.map(p => (
                <div key={p.tipo} className="rounded-2xl border p-4 transition-all hover:scale-[1.01]" style={{ borderColor: p.color + '40', background: p.color + '10' }}>
                  <div className="flex items-center gap-2 mb-2" style={{ color: p.color }}>
                    {TIPO_ICONS[p.tipo.toLowerCase() || 'averia']}
                    <span className="text-[10px] font-black uppercase tracking-widest">{p.tipo}</span>
                  </div>
                  <p className="text-2xl font-black text-white">{p.minutos} <span className="text-sm font-normal text-slate-400">min</span></p>
                  <p className="text-[11px] text-slate-500 mt-1">{p.pct}% tiempo parado total</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Pie */}
              <div className="card p-5 border border-slate-800 bg-slate-950">
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
              <div className="card p-5 col-span-1 lg:col-span-2 border border-slate-800 bg-slate-950">
                <h3 className="section-title">Análisis OEE — Cascada de pérdidas por Paradas y Calidad</h3>
                <div className="space-y-2">
                  {oeeWaterfall.map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-[11px] text-slate-400 w-44 truncate font-bold">{item.nombre}</span>
                      <div className="flex-1 h-6 bg-slate-900 rounded-lg overflow-hidden relative border border-slate-800/80">
                        <motion.div
                          className={`absolute top-0 left-0 h-full rounded-lg flex items-center px-2 shadow-sm ${
                            item.tipo === 'resultado' ? 'bg-blue-600' : item.tipo === 'kpi' ? 'bg-slate-700' : 'bg-red-500/80'
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: item.tipo === 'perdida' ? `${Math.abs(item.valor) * 5}%` : `${item.valor}%` }}
                          transition={{ delay: i * 0.08, duration: 0.4 }}
                        >
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

            {/* Tabla de paradas del turno */}
            <div className="card overflow-hidden border border-slate-800 bg-slate-950">
              <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
                <h3 className="section-title mb-0 text-white font-black">Registro de Paradas — Turno {getCurrentShiftInfo().shift}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">{paradas.filter(p => p.estado === 'abierta').length} paradas activas</span>
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-ping" />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/50">
                      {['Línea','Inicio','Fin','Duración','Categoría / Tipo','Causa','Impacto','Estado','Acciones'].map(h => (
                        <th key={h} className="table-header text-left py-3 px-4">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paradas.map(p => (
                      <tr key={p.id} className={`hover:bg-slate-900/80 transition-colors group border-b border-slate-800/40 ${p.estado === 'abierta' ? 'bg-red-500/10' : ''}`}>
                        <td className="table-cell font-black text-white px-4 py-3">{p.linea}</td>
                        <td className="table-cell font-mono text-xs font-bold text-slate-300 px-4">{p.inicio}</td>
                        <td className="table-cell font-mono text-xs px-4">{p.fin || <span className="text-red-400 font-bold animate-pulse">⚡ En curso</span>}</td>
                        <td className="table-cell font-black text-white px-4">{p.duracion} min</td>
                        <td className="table-cell px-4">
                          <div className="flex items-center gap-1.5 font-bold text-xs" style={{ color: TIPO_COLORS[p.tipo] || '#94a3b8' }}>
                            {TIPO_ICONS[p.tipo] || <AlertTriangle className="w-3.5 h-3.5" />}
                            <span className="uppercase">{TIPO_LABELS[p.tipo] || p.tipo}</span>
                          </div>
                        </td>
                        <td className="table-cell text-slate-300 max-w-sm px-4"><span className="text-xs font-medium">{p.causa}</span></td>
                        <td className="table-cell text-amber-400 font-black px-4">-{p.impacto} uds</td>
                        <td className="table-cell px-4">
                          <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                            p.estado === 'abierta' ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {p.estado}
                          </span>
                        </td>
                        <td className="table-cell px-4">
                          <div className="flex items-center gap-1">
                            {p.estado !== 'cerrada' ? (
                              <button onClick={() => openConfirmOt(p)} className="p-2 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-400/10 transition-all" title="Vincular / Generar OT en Mantenimiento">
                                <Wrench className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button disabled className="p-2 rounded-lg text-slate-700 cursor-not-allowed opacity-40" title="Parada cerrada (No se puede generar OT)">
                                <Wrench className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button onClick={() => openEdit(p)} className="p-2 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 transition-all" title="Editar parada">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => openDelete(p)} className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all" title="Eliminar parada">
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

            {/* Modal para añadir/editar Parada del Turno */}
            <CrudModal
              isOpen={modalOpen}
              onClose={() => setModalOpen(false)}
              onSave={handleSave}
              title={modalMode === 'create' ? 'Registrar Parada en Turno' : 'Editar Parada'}
              fields={PARADA_FIELDS}
              initialData={editItem}
              saving={saving}
              extraHeaderContent={
                modalMode === 'create' ? (
                  <div className="mb-4 bg-slate-900 border border-indigo-500/30 p-3 rounded-xl">
                    <label className="text-[11px] font-black uppercase text-indigo-400 block mb-2 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Opcional: Autocompletar desde Parada Predeterminada
                    </label>
                    <select
                      onChange={(e) => {
                        const sel = predeterminadas.find(x => x.id === e.target.value);
                        if (sel) seleccionarPredeterminadaEnTurno(sel);
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg text-xs text-white p-2 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">-- Seleccionar causa predeterminada del catálogo --</option>
                      {predeterminadas.map(pred => (
                        <option key={pred.id} value={pred.id}>
                          [{pred.codigo}] {TIPO_LABELS[pred.categoria] || pred.categoria.toUpperCase()} — {pred.causa} ({pred.tiempoEst} min est.)
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null
              }
            />
          </motion.div>
        ) : (
          /* ─── PESTAÑA 2: GESTIÓN DE PARADAS PREDETERMINADAS & CATEGORÍAS ─── */
          <motion.div key="pred" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            {/* Banner superior de explicación */}
            <div className="card p-5 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-950 border-2 border-indigo-500/30 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                  <Tag className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    Catálogo y Categorías de Paradas Predeterminadas
                  </h3>
                  <p className="text-xs text-slate-300 max-w-3xl mt-1 leading-relaxed">
                    Configura aquí las causas estandarizadas y su categoría asignada (<strong className="text-red-400">Avería</strong>, <strong className="text-amber-400">Mantenimiento</strong>, <strong className="text-blue-400">Cambio de Referencia</strong> o <strong className="text-purple-400">Calidad</strong>). Al registrarlas en la planta, los operarios las seleccionarán en 1 clic para garantizar la fiabilidad del OEE.
                  </p>
                </div>
              </div>

              <button
                onClick={openCreatePred}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-black transition-all shadow-xl shadow-indigo-900/40 active:scale-95 flex-shrink-0"
              >
                <Plus className="w-4 h-4" /> + Nueva Parada Predeterminada
              </button>
            </div>

            {/* Controles de búsqueda y filtros por Categoría */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-slate-400 mr-2 flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-indigo-400" /> Categorías:
                </span>
                {[
                  { id: 'todas', label: 'Todas las Categorías' },
                  { id: 'averia', label: '🔴 Avería' },
                  { id: 'mantenimiento', label: '🟠 Mantenimiento' },
                  { id: 'cambio', label: '🔵 Cambio Ref.' },
                  { id: 'calidad', label: '🟣 Calidad' }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setFiltroCatPred(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                      filtroCatPred === cat.id
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40'
                        : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar por código, causa..."
                    value={busquedaPred}
                    onChange={e => setBusquedaPred(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex bg-slate-950 border border-slate-700 rounded-xl p-1 shrink-0">
                  <button
                    onClick={() => setViewModePred('grid')}
                    className={`p-1.5 rounded-lg transition-all ${viewModePred === 'grid' ? 'bg-indigo-600 text-white font-black shadow-md' : 'text-slate-400 hover:text-white'}`}
                    title="Vista en Fichas"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewModePred('table')}
                    className={`p-1.5 rounded-lg transition-all ${viewModePred === 'table' ? 'bg-indigo-600 text-white font-black shadow-md' : 'text-slate-400 hover:text-white'}`}
                    title="Vista en Listado / Tabla"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Grid vs Table de Paradas Predeterminadas */}
            {viewModePred === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {predeterminadasFiltradas.map(pred => (
                  <motion.div
                    key={pred.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="card p-5 border border-slate-800 bg-slate-950 hover:border-slate-700 transition-all flex flex-col justify-between group relative shadow-lg"
                  >
                    <div>
                      {/* Fila superior: Código y Badge de Categoría */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="font-mono text-xs font-black text-slate-300 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                          {pred.codigo}
                        </span>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black border uppercase tracking-wider ${
                          pred.categoria === 'averia' ? 'bg-red-500/15 text-red-400 border-red-500/30' :
                          pred.categoria === 'mantenimiento' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' :
                          pred.categoria === 'cambio' ? 'bg-blue-500/15 text-blue-400 border-blue-500/30' :
                          'bg-purple-500/15 text-purple-400 border-purple-500/30'
                        }`}>
                          {TIPO_ICONS[pred.categoria] || <Clock className="w-3 h-3" />}
                          {TIPO_LABELS[pred.categoria] || pred.categoria}
                        </span>
                      </div>

                      {/* Descripción de la causa */}
                      <h4 className="text-sm font-black text-white leading-snug mb-4 group-hover:text-indigo-300 transition-colors">
                        {pred.causa}
                      </h4>
                    </div>

                    <div>
                      {/* Datos teóricos */}
                      <div className="grid grid-cols-2 gap-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 mb-4 text-xs">
                        <div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase block">Duración Media Est.</span>
                          <span className="font-black text-slate-200">{pred.tiempoEst} minutos</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase block">Impacto de Pérdidas</span>
                          <span className="font-black text-amber-400">-{pred.impactoHora || 100} uds/h</span>
                        </div>
                      </div>

                      {/* Fila de acciones */}
                      <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800/80">
                        <button
                          onClick={() => openEditPred(pred)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all"
                        >
                          <Pencil className="w-3.5 h-3.5" /> Modificar y Configurar
                        </button>
                        <button
                          onClick={() => openDeletePred(pred)}
                          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all"
                          title="Borrar parada predeterminada"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {predeterminadasFiltradas.length === 0 && (
                  <div className="col-span-full card p-12 text-center border-dashed border-slate-800 bg-slate-950/40">
                    <Layers className="w-10 h-10 text-slate-600 mx-auto mb-3 opacity-50" />
                    <p className="text-slate-400 font-bold text-sm">No se encontraron paradas predeterminadas con este filtro</p>
                    <button onClick={openCreatePred} className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black transition-all">
                      + Añadir la primera
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-950/80 text-slate-400 text-xs font-black uppercase border-b border-slate-800 tracking-wider">
                        <th className="py-3.5 px-4">Código / Referencia</th>
                        <th className="py-3.5 px-4">Categoría</th>
                        <th className="py-3.5 px-4">Causa Predeterminada</th>
                        <th className="py-3.5 px-4 text-center">Duración Media Est.</th>
                        <th className="py-3.5 px-4 text-center">Impacto de Pérdidas</th>
                        <th className="py-3.5 px-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-xs font-bold text-slate-200">
                      {predeterminadasFiltradas.map(pred => (
                        <tr key={pred.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 font-mono text-indigo-400 font-black">{pred.codigo}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              pred.categoria === 'averia' ? 'bg-red-500/15 text-red-400 border border-red-500/30' :
                              pred.categoria === 'mantenimiento' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                              pred.categoria === 'cambio' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' :
                              'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                            }`}>
                              {TIPO_ICONS[pred.categoria]} {TIPO_LABELS[pred.categoria] || pred.categoria}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-black text-white max-w-md">{pred.causa}</td>
                          <td className="py-3 px-4 text-center font-mono font-black text-slate-200">{pred.tiempoEst} min</td>
                          <td className="py-3 px-4 text-center font-mono text-amber-400">-{pred.impactoHora || 100} uds/h</td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button onClick={() => openEditPred(pred)} className="p-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white transition-all" title="Modificar">
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button onClick={() => openDeletePred(pred)} className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-500/30 text-slate-400 hover:text-rose-300 transition-all" title="Eliminar">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {predeterminadasFiltradas.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-500 font-bold">
                            No se encontraron paradas predeterminadas con este filtro
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Modales de Paradas Predeterminadas */}
            <CrudModal
              isOpen={predModalOpen}
              onClose={() => setPredModalOpen(false)}
              onSave={handleSavePred}
              title={predModalMode === 'create' ? 'Añadir Nueva Parada Predeterminada' : 'Modificar Parada y Configurar Categoría'}
              fields={PARADA_PRED_FIELDS}
              initialData={editPredItem}
              saving={saving}
            />
            <ConfirmDialog
              isOpen={predConfirmOpen}
              onClose={() => setPredConfirmOpen(false)}
              onConfirm={handleDeletePred}
              title="Borrar Parada Predeterminada"
              message={`¿Estás seguro de que deseas eliminar la causa predeterminada "${deletePredTarget?.causa}" [${deletePredTarget?.codigo}]?`}
              deleting={deleting}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ConfirmDialog de Turno */}
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Eliminar Parada del Turno"
        message={`Se eliminará la parada "${deleteTarget?.causa}" registrada en ${deleteTarget?.linea}. ¿Confirmas?`}
        deleting={deleting}
      />

      {/* Modal / Popup Confirmar Generar OT en Mantenimiento */}
      <AnimatePresence>
        {otConfirmOpen && otTarget && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => !generatingOt && setOtConfirmOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 12 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="relative w-full max-w-md bg-slate-900 border border-amber-500/30 rounded-2xl shadow-2xl shadow-amber-900/20 overflow-hidden z-10"
              onClick={e => e.stopPropagation()}
            >
              <div className="h-1.5 w-full bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-400" />
              <div className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                    <Wrench className="w-6 h-6 text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-black text-base leading-tight">¿Vincular / Generar OT en Mantenimiento?</h3>
                    <p className="text-slate-300 text-xs mt-1.5 leading-relaxed">
                      Se generará automáticamente una nueva Orden de Trabajo (OT) en el módulo de Mantenimiento para atender esta parada:
                    </p>
                  </div>
                  <button
                    disabled={generatingOt}
                    onClick={() => setOtConfirmOpen(false)}
                    className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 mb-5 text-xs space-y-1">
                  <div className="flex justify-between text-slate-400 font-bold">
                    <span>Línea: <strong className="text-white">{otTarget.linea}</strong></span>
                    <span className="text-amber-400 uppercase tracking-wider">{otTarget.tipo}</span>
                  </div>
                  <div className="text-slate-300 font-medium">Causa: {otTarget.causa}</div>
                  {otTarget.duracion > 0 && <div className="text-slate-500 text-[11px]">Duración acumulada: {otTarget.duracion} min</div>}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={generatingOt}
                    onClick={() => setOtConfirmOpen(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white font-bold text-xs transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={generatingOt}
                    onClick={handleConfirmGenerarOt}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {generatingOt ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Generando OT...
                      </>
                    ) : (
                      <>
                        <Wrench className="w-4 h-4" /> Sí, Generar OT
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
