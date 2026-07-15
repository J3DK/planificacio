import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, Calendar, Move, Edit2, Trash2, X, Check, RefreshCw, AlertCircle, Clock, Package, FileText, ArrowRight, Layers, Filter, Search, ShieldAlert, Zap, ArrowLeftCircle } from 'lucide-react';
import { fetchLineas, fetchPlanificacion, insertOrdenPlanificacion, updateOrdenPlanificacion, deleteOrdenPlanificacion, reordenarSecuenciaEnGantt } from '@/services/dataService';

const SEMANA_DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const HORAS = Array.from({ length: 16 }, (_, i) => `${String(i + 6).padStart(2, '0')}:00`);

const COLORS = ['#2563eb', '#7c3aed', '#0891b2', '#dc2626', '#059669', '#d97706', '#db2777', '#4f46e5'];

export default function PlanificacionLineas() {
  const [lineas, setLineas] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  const [diaSeleccionado, setDiaSeleccionado] = useState(0);
  const [loading, setLoading] = useState(true);

  // Reloj de tiempo real para la línea roja/ámbar de "Tiempo Actual" en el Gantt
  const [nowDate, setNowDate] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNowDate(new Date()), 15000); // actualizar cada 15s
    return () => clearInterval(timer);
  }, []);

  const currentHourFloat = nowDate.getHours() + nowDate.getMinutes() / 60;
  const isTimeInRange = currentHourFloat >= 6 && currentHourFloat <= 22;
  const currentTimeX = (currentHourFloat - 6) * 60; // CELL_W es 60
  const currentTimeFormatted = nowDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Drag & Drop state
  const [draggedOrden, setDraggedOrden] = useState(null);
  const [dropTarget, setDropTarget] = useState(null); // { lineaId, horaInicio }

  // Filtros de Backlog
  const [backlogPlegado, setBacklogPlegado] = useState(false);
  const [filtroPrioridad, setFiltroPrioridad] = useState('todas');
  const [busquedaBacklog, setBusquedaBacklog] = useState('');

  // Modal de edición/creación
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [formOrden, setFormOrden] = useState({
    codigo: 'OF-2024-105',
    sinAsignar: false,
    linea: 'L1',
    dia: 0,
    horaInicio: 6,
    duracion: 4,
    ref: 'BAT-48V-100Ah',
    cliente: 'Cliente A',
    cantidad: 500,
    materiales: 'Celdas LFP 100Ah (x16), BMS 48V (x1), Carcasa Metálica',
    fechaCompromiso: '31/05/2024',
    prioridad: 'normal', // 'normal' | 'alta' | 'urgente'
    color: '#2563eb'
  });
  const [saving, setSaving] = useState(false);

  // Modal rápido para asignar una orden del Backlog desde botón
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignOrden, setAssignOrden] = useState(null);
  const [assignForm, setAssignForm] = useState({ linea: 'L1', dia: 0, horaInicio: 8 });

  const CELL_W = 60; // px por hora

  const loadData = async () => {
    setLoading(true);
    const [resL, resP] = await Promise.all([fetchLineas(), fetchPlanificacion()]);
    if (resL.data) setLineas(resL.data);
    if (resP.data) setOrdenes(resP.data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Escuchar reordenamiento desde Secuencia → recargar el Gantt
  useEffect(() => {
    const handler = () => loadData();
    window.addEventListener('secuencia_reordenada', handler);
    return () => window.removeEventListener('secuencia_reordenada', handler);
  }, []);

  // Separar órdenes en Gantt (asignadas) vs Backlog (sin asignar)
  const ordenesGantt = ordenes.filter(o => o.linea !== null && o.linea !== 'BACKLOG' && o.linea !== '' && o.dia !== null && o.dia !== undefined);
  const ordenesBacklog = ordenes.filter(o => o.linea === null || o.linea === 'BACKLOG' || o.linea === '' || o.dia === null || o.dia === undefined);

  // Filtrado de pendientes
  const backlogFiltrado = ordenesBacklog.filter(o => {
    if (filtroPrioridad !== 'todas' && o.prioridad !== filtroPrioridad) return false;
    if (busquedaBacklog.trim()) {
      const q = busquedaBacklog.toLowerCase();
      return (o.codigo || '').toLowerCase().includes(q) ||
             (o.ref || '').toLowerCase().includes(q) ||
             (o.cliente || '').toLowerCase().includes(q) ||
             (o.materiales || '').toLowerCase().includes(q);
    }
    return true;
  });

  // ─── Drag & Drop Handlers ──────────────────────────────────────────────────
  const handleDragStart = (e, orden) => {
    setDraggedOrden(orden);
    e.dataTransfer.setData('text/plain', orden.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, lineaId, horaIdx) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const nuevaHora = horaIdx + 6;
    if (!dropTarget || dropTarget.lineaId !== lineaId || dropTarget.horaInicio !== nuevaHora) {
      setDropTarget({ lineaId, horaInicio: nuevaHora });
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, lineaId, horaIdx) => {
    e.preventDefault();
    setDropTarget(null);
    if (!draggedOrden) return;

    const nuevaHora = horaIdx + 6;
    const dur = draggedOrden.duracion || 4;
    const maximaHora = 22 - dur;
    const horaFinal = Math.min(Math.max(6, nuevaHora), maximaHora);

    if (draggedOrden.linea === lineaId && draggedOrden.horaInicio === horaFinal && draggedOrden.dia === diaSeleccionado) {
      setDraggedOrden(null);
      return;
    }

    const updated = {
      ...draggedOrden,
      linea: lineaId,
      dia: diaSeleccionado,
      horaInicio: horaFinal
    };

    setOrdenes(prev => prev.map(o => o.id === draggedOrden.id ? updated : o));
    setDraggedOrden(null);

    await updateOrdenPlanificacion(draggedOrden.id, {
      linea: lineaId,
      dia: diaSeleccionado,
      horaInicio: horaFinal
    });
    // planificacion_updated ya lo emite syncGanttToRestOfApp en dataService
    const resL = await fetchLineas();
    if (resL.data) setLineas(resL.data);
  };

  // Drop sobre el Backlog (Desasignar si arrastras desde el Gantt)
  const handleDropToBacklog = async (e) => {
    e.preventDefault();
    if (!draggedOrden || draggedOrden.linea === null) return;
    const updated = { ...draggedOrden, linea: null, dia: null };
    setOrdenes(prev => prev.map(o => o.id === draggedOrden.id ? updated : o));
    setDraggedOrden(null);
    await updateOrdenPlanificacion(draggedOrden.id, { linea: null, dia: null });
    // planificacion_updated ya lo emite syncGanttToRestOfApp en dataService
  };

  // ─── Modal Handlers ────────────────────────────────────────────────────────
  const openCreateModal = (isBacklogDefault = false) => {
    const numOF = Math.floor(100 + Math.random() * 900);
    setFormOrden({
      id: null,
      codigo: `OF-2026-${numOF}`,
      sinAsignar: isBacklogDefault,
      linea: isBacklogDefault ? '' : (lineas[0]?.id || 'L1'),
      dia: isBacklogDefault ? 0 : diaSeleccionado,
      horaInicio: 8,
      duracion: 6,
      ref: 'BAT-48V-100Ah-PRO',
      cliente: 'Cliente A Industrial',
      cantidad: 500,
      materiales: 'Celdas LFP 100Ah (x16), BMS 48V (x1), Carcasa Metálica, Conectores IP67',
      fechaCompromiso: new Date(Date.now() + 5 * 86400000).toLocaleDateString('es-ES'),
      prioridad: isBacklogDefault ? 'normal' : 'normal',
      color: COLORS[Math.floor(Math.random() * COLORS.length)]
    });
    setModalMode('create');
    setModalOpen(true);
  };

  const openEditModal = (orden, e) => {
    if (e) e.stopPropagation();
    const isSinAsignar = orden.linea === null || orden.linea === 'BACKLOG' || orden.linea === '';
    setFormOrden({
      ...orden,
      sinAsignar: isSinAsignar,
      linea: isSinAsignar ? (lineas[0]?.id || 'L1') : orden.linea,
      dia: orden.dia !== null && orden.dia !== undefined ? orden.dia : diaSeleccionado,
      horaInicio: orden.horaInicio || 8,
      duracion: orden.duracion || 6,
      cantidad: orden.cantidad || 500,
      materiales: orden.materiales || 'Componentes estándar y subconjuntos electrónicos',
      prioridad: orden.prioridad || 'normal',
      codigo: orden.codigo || `OF-${orden.id || '2026'}`
    });
    setModalMode('edit');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    const dataToSave = {
      ...formOrden,
      linea: formOrden.sinAsignar ? null : formOrden.linea,
      dia: formOrden.sinAsignar ? null : Number(formOrden.dia),
      horaInicio: Number(formOrden.horaInicio),
      duracion: Number(formOrden.duracion),
      cantidad: Number(formOrden.cantidad)
    };
    delete dataToSave.sinAsignar;

    if (modalMode === 'create') {
      const { data } = await insertOrdenPlanificacion(dataToSave);
      if (data) setOrdenes(prev => [...prev, data]);
    } else {
      const { data } = await updateOrdenPlanificacion(formOrden.id, dataToSave);
      if (data) setOrdenes(prev => prev.map(o => o.id === formOrden.id ? data : o));
    }

    const resL = await fetchLineas();
    if (resL.data) setLineas(resL.data);

    setSaving(false);
    setModalOpen(false);
  };

  const handleDelete = async () => {
    if (!formOrden.id) return;
    setSaving(true);
    await deleteOrdenPlanificacion(formOrden.id);
    setOrdenes(prev => prev.filter(o => o.id !== formOrden.id));
    const resL = await fetchLineas();
    if (resL.data) setLineas(resL.data);
    setSaving(false);
    setModalOpen(false);
  };

  const handleDevolverABacklog = async () => {
    if (!formOrden.id) return;
    setSaving(true);
    await updateOrdenPlanificacion(formOrden.id, { linea: null, dia: null });
    setOrdenes(prev => prev.map(o => o.id === formOrden.id ? { ...o, linea: null, dia: null } : o));
    const resL = await fetchLineas();
    if (resL.data) setLineas(resL.data);
    setSaving(false);
    setModalOpen(false);
  };

  // Asignación por modal rápido desde tarjeta de Backlog
  const openQuickAssign = (o) => {
    setAssignOrden(o);
    setAssignForm({
      linea: lineas[0]?.id || 'L1',
      dia: diaSeleccionado,
      horaInicio: 8
    });
    setAssignModalOpen(true);
  };

  const handleConfirmQuickAssign = async (e) => {
    e.preventDefault();
    if (!assignOrden) return;
    setSaving(true);
    await updateOrdenPlanificacion(assignOrden.id, {
      linea: assignForm.linea,
      dia: Number(assignForm.dia),
      horaInicio: Number(assignForm.horaInicio)
    });
    setOrdenes(prev => prev.map(o => o.id === assignOrden.id ? {
      ...o,
      linea: assignForm.linea,
      dia: Number(assignForm.dia),
      horaInicio: Number(assignForm.horaInicio)
    } : o));
    const resL = await fetchLineas();
    if (resL.data) setLineas(resL.data);
    setSaving(false);
    setAssignModalOpen(false);
    setAssignOrden(null);
  };

  const getPrioridadBadge = (prio) => {
    if (prio === 'urgente') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse shadow-sm shadow-red-900/50">
          🔥 URGENTE
        </span>
      );
    }
    if (prio === 'alta') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500/20 text-amber-400 border border-amber-500/40">
          ⚡ ALTA
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase bg-blue-500/20 text-blue-400 border border-blue-500/40">
        ℹ️ NORMAL
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Header principal */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4"
      >
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3">
            Planificación Maestro y Órdenes de Producción
          </h2>
          <p className="text-slate-500 text-sm flex items-center gap-2 mt-0.5">
            Semana 22 · Planta 1 <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded text-[10px] font-black">⚡ Arrastra fichas desde el Backlog a las líneas de Gantt o viceversa</span>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={loadData} disabled={loading} className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => openCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-indigo-900/30 border border-indigo-400/30"
          >
            <Plus className="w-4 h-4" /> Nueva Ficha Pendiente (Backlog)
          </button>
          <button
            onClick={() => openCreateModal(false)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-blue-900/30"
          >
            <Plus className="w-4 h-4" /> Asignar Orden a Línea
          </button>
        </div>
      </motion.div>

      {/* 📋 SECCIÓN: BACKLOG / ÓRDENES SIN ASIGNAR */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div
          onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
          onDrop={handleDropToBacklog}
          className={`card border-2 transition-all ${
            draggedOrden && draggedOrden.linea !== null ? 'border-indigo-500/70 bg-indigo-950/20 shadow-2xl scale-[1.005]' : 'border-slate-800 bg-slate-900/70'
          }`}
        >
          {/* Cabecera Backlog */}
          <div className="px-5 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-black text-base">Órdenes Pendientes sin Asignar a Línea (Pool / Backlog)</h3>
                  <span className="px-2 py-0.5 rounded-full text-xs font-black bg-indigo-600 text-white shadow-sm">
                    {ordenesBacklog.length}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Fichas pendientes de programación. Arrástralas y suéltalas sobre cualquier franja horaria en el Gantt de las líneas de producción.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Buscador en Backlog */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar producto, código, material..."
                  value={busquedaBacklog}
                  onChange={e => setBusquedaBacklog(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-52"
                />
              </div>

              {/* Filtro Prioridad */}
              <div className="flex items-center bg-slate-950 border border-slate-700 rounded-xl p-1 text-xs">
                {['todas', 'urgente', 'alta', 'normal'].map((prio) => (
                  <button
                    key={prio}
                    onClick={() => setFiltroPrioridad(prio)}
                    className={`px-2.5 py-1 rounded-lg font-bold capitalize transition-all ${
                      filtroPrioridad === prio ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {prio}
                  </button>
                ))}
              </div>

              {/* Plegar / Desplegar */}
              <button
                onClick={() => setBacklogPlegado(!backlogPlegado)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
              >
                {backlogPlegado ? 'Mostrar Fichas' : 'Plegar Panel'}
              </button>
            </div>
          </div>

          {/* Tarjetas de Órdenes Pendientes */}
          <AnimatePresence>
            {!backlogPlegado && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="p-5 overflow-hidden"
              >
                {backlogFiltrado.length === 0 ? (
                  <div className="py-8 text-center border-2 border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
                    <Package className="w-10 h-10 text-slate-600 mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-bold text-slate-400">No hay fichas pendientes que coincidan con el filtro</p>
                    <button
                      onClick={() => openCreateModal(true)}
                      className="mt-3 px-4 py-2 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-xl text-xs font-bold border border-indigo-500/40 transition-all"
                    >
                      + Añadir Ficha de Orden al Backlog
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {backlogFiltrado.map((o) => {
                      const isBeingDragged = draggedOrden && draggedOrden.id === o.id;
                      return (
                        <motion.div
                          key={o.id}
                          layout
                          draggable
                          onDragStart={(e) => handleDragStart(e, o)}
                          className={`card border bg-slate-950/90 hover:bg-slate-900 transition-all p-4 flex flex-col justify-between cursor-grab active:cursor-grabbing relative overflow-hidden group shadow-lg ${
                            isBeingDragged ? 'opacity-30 scale-95 border-dashed border-2 border-indigo-400' : 'border-slate-800 hover:border-indigo-500/50 hover:shadow-indigo-900/20'
                          }`}
                        >
                          {/* Franja de color superior */}
                          <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: o.color || '#6366f1' }} />

                          <div>
                            {/* Fila 1: Código y Prioridad */}
                            <div className="flex items-center justify-between mb-2 pt-1">
                              <span className="font-mono text-xs font-black text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                                {o.codigo || `OF-${o.id}`}
                              </span>
                              {getPrioridadBadge(o.prioridad || 'normal')}
                            </div>

                            {/* Producto y Cliente */}
                            <h4 className="text-sm font-black text-white leading-tight mb-0.5 group-hover:text-indigo-300 transition-colors">
                              {o.ref}
                            </h4>
                            <p className="text-xs text-slate-400 truncate mb-3">{o.cliente}</p>

                            {/* Datos: Cantidad, Duración y Fecha Compromiso */}
                            <div className="grid grid-cols-2 gap-2 bg-slate-900/80 rounded-xl p-2.5 mb-3 text-xs border border-slate-800/80">
                              <div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase block">Cantidad</span>
                                <span className="font-black text-white">{o.cantidad || 500} uds</span>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase block">Duración est.</span>
                                <span className="font-black text-indigo-400">{o.duracion || 6} horas</span>
                              </div>
                              <div className="col-span-2 border-t border-slate-800/80 pt-1.5 mt-1 flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Entrega Límite</span>
                                <span className="font-mono font-bold text-emerald-400 text-xs">{o.fechaCompromiso || 'Pendiente'}</span>
                              </div>
                            </div>

                            {/* Materiales y receta */}
                            {o.materiales && (
                              <div className="mb-4">
                                <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1 mb-1">
                                  <Package className="w-3 h-3 text-slate-400" /> Materiales requeridos
                                </span>
                                <p className="text-[11px] text-slate-300 leading-relaxed bg-slate-900/50 p-2 rounded-lg border border-slate-800/60 line-clamp-2" title={o.materiales}>
                                  {o.materiales}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Fila inferior de acciones rápidas */}
                          <div className="flex items-center gap-1.5 pt-3 border-t border-slate-800/80 mt-auto">
                            <button
                              onClick={() => openQuickAssign(o)}
                              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-black transition-all shadow-md shadow-indigo-900/30 active:scale-95"
                              title="Asignar rápidamente a línea y horario"
                            >
                              <ArrowRight className="w-3.5 h-3.5" /> Asignar
                            </button>
                            <button
                              onClick={(e) => openEditModal(o, e)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
                              title="Editar ficha completa"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Indicador sutil de drag */}
                          <div className="absolute bottom-1 right-2 text-[9px] text-slate-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 pointer-events-none">
                            <Move className="w-2.5 h-2.5" /> Arrastra al Gantt
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Selector de día y capacidad actual */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setDiaSeleccionado(prev => Math.max(0, prev - 1))} disabled={diaSeleccionado === 0} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 transition-all">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex gap-1 overflow-x-auto no-scrollbar">
            {SEMANA_DIAS.map((dia, i) => (
              <button
                key={dia}
                onClick={() => setDiaSeleccionado(i)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  diaSeleccionado === i ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                }`}
              >
                {dia} {i === 0 && <span className="text-[9px] ml-1 opacity-80 bg-blue-500 px-1.5 py-0.5 rounded">HOY</span>}
              </button>
            ))}
          </div>
          <button onClick={() => setDiaSeleccionado(prev => Math.min(SEMANA_DIAS.length - 1, prev + 1))} disabled={diaSeleccionado === SEMANA_DIAS.length - 1} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 transition-all">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="text-xs text-slate-400 font-bold bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-400" />
          <span>Viendo: <strong className="text-white">{SEMANA_DIAS[diaSeleccionado]}</strong> — {ordenesGantt.filter(o => Number(o.dia) === diaSeleccionado).length} órdenes programadas hoy</span>
        </div>
      </motion.div>

      {/* Capacidad resumen sincronizada en tiempo real */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {lineas.map(l => (
          <motion.div
            key={l.id}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="card p-4 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800/80"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{l.nombre}</span>
              <span className={`w-2 h-2 rounded-full ${l.estado === 'en_marcha' ? 'bg-emerald-400 shadow-sm shadow-emerald-500' : l.estado === 'parada' ? 'bg-red-400' : 'bg-amber-400'}`} />
            </div>
            <div className="text-sm font-black text-white truncate">{l.producto}</div>
            <div className="text-[11px] text-slate-400 truncate mb-2">{l.cliente}</div>
            <div>
              <div className="flex justify-between text-[10px] text-slate-500 mb-1 font-bold">
                <span>Carga {diaSeleccionado === 0 ? 'Hoy' : SEMANA_DIAS[diaSeleccionado]}</span>
                <span className="text-slate-300">{Math.round((l.produccionHoy / (l.objetivoHoy || 1)) * 100)}%</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${l.produccionHoy >= l.objetivoHoy ? 'bg-emerald-500' : 'bg-blue-500'}`}
                  style={{ width: `${Math.min(100, (l.produccionHoy / (l.objetivoHoy || 1)) * 100)}%` }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Diagrama de Gantt */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="card overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              <h3 className="section-title mb-0 text-white font-black">Diagrama de Gantt — {SEMANA_DIAS[diaSeleccionado]} 31/05/2024</h3>
            </div>
            <span className="text-xs text-slate-400 font-bold hidden sm:inline flex items-center gap-1.5">
              <Move className="w-3.5 h-3.5 text-blue-400" /> Arrastra horizontal (hora) o vertical (línea) · Clic para editar ficha
            </span>
          </div>
          <div className="overflow-x-auto no-scrollbar">
            <div className="relative" style={{ minWidth: CELL_W * 16 + 120 }}>
              {/* Horas header — contiene también la etiqueta de hora actual */}
              <div className="flex border-b border-slate-800 bg-slate-900/60">
                <div className="w-28 flex-shrink-0 bg-slate-900/90 px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center">
                  Línea
                </div>
                {/* Área temporal: mismo sistema de coordenadas que las líneas por fila */}
                <div className="relative flex-1 flex">
                  {HORAS.map((h, idx) => (
                    <div key={h} style={{ width: CELL_W }} className="flex-shrink-0 text-center text-[11px] text-slate-400 py-2.5 border-l border-slate-800 font-mono font-bold">
                      {h}
                    </div>
                  ))}
                  {/* Etiqueta de hora actual — misma posición que las líneas rojas por fila */}
                  {diaSeleccionado === 0 && isTimeInRange && (
                    <div
                      className="absolute top-0 bottom-0 z-30 pointer-events-none flex items-center transition-all duration-1000"
                      style={{ left: currentTimeX }}
                    >
                      <div className="bg-red-600 text-white font-black text-[11px] font-mono px-2 py-0.5 rounded-full shadow-lg shadow-red-600/60 -translate-x-1/2 flex items-center gap-1.5 border border-red-300 whitespace-nowrap">
                        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                        <span>{currentTimeFormatted}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Filas de Líneas */}
              {lineas.map(l => {
                const ordenesDia = ordenesGantt.filter(o => o.linea === l.id && Number(o.dia) === diaSeleccionado);
                return (
                  <div key={l.id} className="flex border-b border-slate-800/60 hover:bg-slate-900/40 transition-colors group relative">
                    {/* Cabecera de línea */}
                    <div className="w-28 flex-shrink-0 flex flex-col justify-center px-3 py-3 border-r border-slate-800 bg-slate-950/80">
                      <span className="text-xs font-black text-white">{l.nombre}</span>
                      <span className={`text-[10px] font-bold mt-0.5 ${l.estado === 'en_marcha' ? 'text-emerald-400' : l.estado === 'parada' ? 'text-red-400' : 'text-amber-400'}`}>
                        {l.estado === 'en_marcha' ? 'En marcha' : l.estado === 'parada' ? 'Parada' : 'Mant.'}
                      </span>
                    </div>

                    {/* Contenedor temporal de celdas y barras */}
                    <div className="relative flex-1" style={{ height: 60 }}>
                      {/* Celdas receptoras de Drag & Drop por hora */}
                      {HORAS.map((_, i) => {
                        const isDropTargetHover = dropTarget && dropTarget.lineaId === l.id && dropTarget.horaInicio === (i + 6);
                        return (
                          <div
                            key={i}
                            onDragOver={(e) => handleDragOver(e, l.id, i)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, l.id, i)}
                            className={`absolute top-0 bottom-0 border-l border-slate-800/40 transition-colors ${
                              isDropTargetHover ? 'bg-blue-500/25 border-blue-400 z-20' : ''
                            }`}
                            style={{ left: i * CELL_W, width: CELL_W }}
                          />
                        );
                      })}

                      {/* Línea de tiempo actual dentro de la fila (si es HOY y está en rango) */}
                      {diaSeleccionado === 0 && isTimeInRange && (
                        <div className="absolute top-0 bottom-0 w-0.5 bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.8)] z-10 pointer-events-none transition-all duration-1000" style={{ left: currentTimeX }} />
                      )}

                      {/* Barras de Órdenes */}
                      {ordenesDia.map((o) => {
                        const isBeingDragged = draggedOrden && draggedOrden.id === o.id;
                        return (
                          <div
                            key={o.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, o)}
                            onClick={(e) => openEditModal(o, e)}
                            className={`absolute top-2 bottom-2 rounded-xl flex items-center px-3 overflow-hidden cursor-grab active:cursor-grabbing shadow-md transition-all hover:scale-[1.01] hover:brightness-125 z-15 ${
                              isBeingDragged ? 'opacity-30 scale-95 border-dashed border-2' : ''
                            }`}
                            style={{
                              left: (o.horaInicio - 6) * CELL_W + 3,
                              width: (o.duracion || 4) * CELL_W - 6,
                              backgroundColor: o.color ? `${o.color}26` : '#2563eb26',
                              border: `1.5px solid ${o.color || '#2563eb'}`,
                            }}
                          >
                            <div className="flex items-center justify-between w-full min-w-0">
                              <div className="min-w-0 truncate pr-1">
                                <p className="text-xs font-black text-white truncate leading-tight flex items-center gap-1.5" style={{ color: o.color || '#60a5fa' }}>
                                  <Move className="w-3 h-3 flex-shrink-0 opacity-70" />
                                  {o.codigo ? `[${o.codigo}] ` : ''}{o.ref}
                                </p>
                                <p className="text-[10px] text-slate-300 truncate leading-none mt-0.5">
                                  {o.cliente} · {o.cantidad ? `${o.cantidad}uds · ` : ''}{o.duracion}h
                                </p>
                              </div>
                              <Edit2 className="w-3.5 h-3.5 text-white opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                            </div>
                          </div>
                        );
                      })}

                      {ordenesDia.length === 0 && !dropTarget && (
                        <div className="absolute inset-x-4 inset-y-3 border border-dashed border-slate-800 rounded-xl flex items-center justify-center pointer-events-none opacity-40">
                          <span className="text-[10px] font-bold text-slate-500">Sin órdenes en esta franja (arrastra una orden aquí)</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Leyenda y ayudas */}
          <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/40 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              {diaSeleccionado === 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="w-0.5 h-4 bg-amber-400" />
                  <span className="text-[11px] font-bold text-slate-400">Tiempo actual (11:15)</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-3 bg-blue-600/30 border border-blue-500/60 rounded" />
                <span className="text-[11px] font-bold text-slate-400">Orden planificada en línea</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-3 bg-indigo-600/30 border border-indigo-500/60 rounded" />
                <span className="text-[11px] font-bold text-slate-400">Fichas en Backlog sin asignar</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 font-bold flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-blue-400" /> Los cambios en Gantt sincronizan el producto y cadencia con Planta y Secuencia
            </p>
          </div>
        </div>
      </motion.div>

      {/* ─── MODAL CREAR / EDITAR FICHA Y ORDEN ──────────────────────────────── */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="card p-6 max-w-xl w-full bg-slate-900 border border-slate-700 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between mb-5 border-b border-slate-800 pb-3">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  {modalMode === 'create' ? <Plus className="w-5 h-5 text-indigo-400" /> : <Edit2 className="w-5 h-5 text-indigo-400" />}
                  {modalMode === 'create' ? 'Nueva Ficha de Producción (OF)' : `Editar Ficha ${formOrden.codigo || ''}`}
                </h3>
                <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                {/* Selector de Destino: Backlog o Línea */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase block">Estado y Programación de la Orden</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormOrden({ ...formOrden, sinAsignar: true })}
                      className={`py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 border transition-all ${
                        formOrden.sinAsignar
                          ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500 shadow-sm'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      <Layers className="w-4 h-4" /> En Backlog / Sin Asignar
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormOrden({ ...formOrden, sinAsignar: false, linea: formOrden.linea || lineas[0]?.id || 'L1' })}
                      className={`py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 border transition-all ${
                        !formOrden.sinAsignar
                          ? 'bg-blue-600/20 text-blue-300 border-blue-500 shadow-sm'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      <Calendar className="w-4 h-4" /> Asignada a Línea de Gantt
                    </button>
                  </div>
                </div>

                {/* Si está asignada a línea, mostrar campos horarias */}
                {!formOrden.sinAsignar && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3 bg-blue-950/20 p-3.5 rounded-xl border border-blue-900/40">
                    <span className="text-[10px] font-black uppercase text-blue-400 block">Coordenadas de Programación en Línea</span>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Línea de Producción</label>
                        <select
                          value={formOrden.linea}
                          onChange={e => setFormOrden({ ...formOrden, linea: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-blue-500"
                        >
                          {lineas.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Día programación</label>
                        <select
                          value={formOrden.dia}
                          onChange={e => setFormOrden({ ...formOrden, dia: Number(e.target.value) })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-blue-500"
                        >
                          {SEMANA_DIAS.map((d, idx) => <option key={idx} value={idx}>{d} {idx === 0 ? '(Hoy)' : ''}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Hora Inicio</label>
                        <select
                          value={formOrden.horaInicio}
                          onChange={e => setFormOrden({ ...formOrden, horaInicio: Number(e.target.value) })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-blue-500"
                        >
                          {HORAS.map((h, idx) => <option key={idx} value={idx + 6}>{h}</option>)}
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Código OF y Prioridad */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Código de Orden (OF)</label>
                    <input
                      type="text"
                      value={formOrden.codigo || ''}
                      onChange={e => setFormOrden({ ...formOrden, codigo: e.target.value })}
                      placeholder="OF-2026-105"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-indigo-500 font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Prioridad del Pedido</label>
                    <select
                      value={formOrden.prioridad || 'normal'}
                      onChange={e => setFormOrden({ ...formOrden, prioridad: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="normal">Normal</option>
                      <option value="alta">Alta</option>
                      <option value="urgente">🔥 Urgente</option>
                    </select>
                  </div>
                </div>

                {/* Producto y Cliente */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Producto / Referencia</label>
                    <input
                      type="text"
                      value={formOrden.ref}
                      onChange={e => setFormOrden({ ...formOrden, ref: e.target.value })}
                      placeholder="BAT-48V-300Ah-PRO"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-indigo-500 font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Cliente / Destino</label>
                    <input
                      type="text"
                      value={formOrden.cliente}
                      onChange={e => setFormOrden({ ...formOrden, cliente: e.target.value })}
                      placeholder="Iberia Energy Corp"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>

                {/* Cantidad, Duración y Fecha Compromiso */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Cantidad (uds)</label>
                    <input
                      type="number" min="1"
                      value={formOrden.cantidad || 500}
                      onChange={e => setFormOrden({ ...formOrden, cantidad: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Duración est. (h)</label>
                    <input
                      type="number" min="1" max="14"
                      value={formOrden.duracion}
                      onChange={e => setFormOrden({ ...formOrden, duracion: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Fecha Límite</label>
                    <input
                      type="text"
                      value={formOrden.fechaCompromiso || '31/05/2024'}
                      onChange={e => setFormOrden({ ...formOrden, fechaCompromiso: e.target.value })}
                      placeholder="05/06/2024"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>

                {/* Lista de Materiales / Receta */}
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Especificación de Materiales y Componentes</label>
                  <textarea
                    rows={2}
                    value={formOrden.materiales || ''}
                    onChange={e => setFormOrden({ ...formOrden, materiales: e.target.value })}
                    placeholder="Celdas LFP 300Ah (x16), BMS CAN-Bus 48V, Sensor térmico PT100 (x4)..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Color de etiqueta */}
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Color corporativo de la orden</label>
                  <div className="flex items-center gap-2 py-1">
                    {COLORS.map(color => (
                      <button
                        key={color} type="button"
                        onClick={() => setFormOrden({ ...formOrden, color })}
                        className={`w-7 h-7 rounded-lg transition-transform ${formOrden.color === color ? 'scale-125 ring-2 ring-white shadow-lg' : 'opacity-60 hover:opacity-100'}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Botones de acción del modal */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  <div className="flex items-center gap-2">
                    {modalMode === 'edit' && (
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={saving}
                        className="px-3.5 py-2 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Eliminar
                      </button>
                    )}
                    {modalMode === 'edit' && !formOrden.sinAsignar && (
                      <button
                        type="button"
                        onClick={handleDevolverABacklog}
                        disabled={saving}
                        className="px-3.5 py-2 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all"
                        title="Desasignar de la línea y devolver al Backlog"
                      >
                        <ArrowLeftCircle className="w-3.5 h-3.5" /> Devolver a Backlog
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-black transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-lg shadow-indigo-900/40 transition-all"
                    >
                      <Check className="w-3.5 h-3.5" /> {saving ? 'Guardando...' : formOrden.sinAsignar ? 'Guardar en Backlog' : 'Guardar y Asignar'}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── MODAL ASIGNACIÓN RÁPIDA DESDE BOTÓN EN TARJETA ──────────────────── */}
      <AnimatePresence>
        {assignModalOpen && assignOrden && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card p-6 max-w-sm w-full bg-slate-900 border border-slate-700 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-indigo-400" /> Programar Orden en Línea
                </h3>
                <button onClick={() => setAssignModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-4 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                <span className="font-mono font-bold text-indigo-400">{assignOrden.codigo || 'OF'}</span> · <strong className="text-white">{assignOrden.ref}</strong>
                <p className="text-slate-400 text-[11px] mt-0.5">{assignOrden.cliente} · {assignOrden.cantidad || 500} uds ({assignOrden.duracion || 6}h)</p>
              </div>

              <form onSubmit={handleConfirmQuickAssign} className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Línea de Fabricación</label>
                  <select
                    value={assignForm.linea}
                    onChange={e => setAssignForm({ ...assignForm, linea: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
                  >
                    {lineas.map(l => <option key={l.id} value={l.id}>{l.nombre} — {l.descripcion}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Día de Programación</label>
                  <select
                    value={assignForm.dia}
                    onChange={e => setAssignForm({ ...assignForm, dia: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
                  >
                    {SEMANA_DIAS.map((d, idx) => <option key={idx} value={idx}>{d} {idx === 0 ? '(Hoy)' : ''}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Hora de Comienzo</label>
                  <select
                    value={assignForm.horaInicio}
                    onChange={e => setAssignForm({ ...assignForm, horaInicio: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
                  >
                    {HORAS.map((h, idx) => <option key={idx} value={idx + 6}>{h}</option>)}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setAssignModalOpen(false)}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-black"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-lg shadow-indigo-900/40"
                  >
                    <Check className="w-3.5 h-3.5" /> Confirmar Programación
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
