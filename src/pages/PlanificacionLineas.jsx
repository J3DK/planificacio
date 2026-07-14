import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, Calendar, Move, Edit2, Trash2, X, Check, RefreshCw, AlertCircle } from 'lucide-react';
import { fetchLineas, fetchPlanificacion, insertOrdenPlanificacion, updateOrdenPlanificacion, deleteOrdenPlanificacion } from '@/services/dataService';

const SEMANA_DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const HORAS = Array.from({ length: 16 }, (_, i) => `${String(i + 6).padStart(2, '0')}:00`);

const COLORS = ['#2563eb', '#7c3aed', '#0891b2', '#dc2626', '#059669', '#d97706', '#db2777', '#4f46e5'];

export default function PlanificacionLineas() {
  const [lineas, setLineas] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  const [diaSeleccionado, setDiaSeleccionado] = useState(0);
  const [loading, setLoading] = useState(true);

  // Drag & Drop state
  const [draggedOrden, setDraggedOrden] = useState(null);
  const [dropTarget, setDropTarget] = useState(null); // { lineaId, horaInicio }

  // Modal de edición/creación
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [formOrden, setFormOrden] = useState({
    linea: 'L1',
    dia: 0,
    horaInicio: 6,
    duracion: 4,
    ref: 'BAT-48V-100Ah',
    cliente: 'Cliente A',
    color: '#2563eb'
  });
  const [saving, setSaving] = useState(false);

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
    // Evitar desbordamiento de las 22:00
    const maximaHora = 22 - draggedOrden.duracion;
    const horaFinal = Math.min(Math.max(6, nuevaHora), maximaHora);

    if (draggedOrden.linea === lineaId && draggedOrden.horaInicio === horaFinal) {
      setDraggedOrden(null);
      return;
    }

    const updated = { ...draggedOrden, linea: lineaId, horaInicio: horaFinal };
    setOrdenes(prev => prev.map(o => o.id === draggedOrden.id ? updated : o));
    setDraggedOrden(null);

    await updateOrdenPlanificacion(draggedOrden.id, { linea: lineaId, horaInicio: horaFinal });
    // Refrescar líneas para ver la sincronización activa si es hoy
    const resL = await fetchLineas();
    if (resL.data) setLineas(resL.data);
  };

  // ─── Modal Handlers ────────────────────────────────────────────────────────
  const openCreateModal = () => {
    setFormOrden({
      linea: lineas[0]?.id || 'L1',
      dia: diaSeleccionado,
      horaInicio: 8,
      duracion: 4,
      ref: 'BAT-48V-100Ah',
      cliente: 'Cliente A',
      color: COLORS[Math.floor(Math.random() * COLORS.length)]
    });
    setModalMode('create');
    setModalOpen(true);
  };

  const openEditModal = (orden, e) => {
    e.stopPropagation();
    setFormOrden({ ...orden });
    setModalMode('edit');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    if (modalMode === 'create') {
      const { data } = await insertOrdenPlanificacion({ ...formOrden, dia: Number(formOrden.dia) });
      if (data) setOrdenes(prev => [...prev, data]);
    } else {
      const { data } = await updateOrdenPlanificacion(formOrden.id, { ...formOrden, dia: Number(formOrden.dia) });
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

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3">
            Planificación de Líneas
          </h2>
          <p className="text-slate-500 text-sm flex items-center gap-2 mt-0.5">
            Semana 22 · Planta 1 <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded text-[10px] font-black">⚡ Arrastra las barras para mover entre líneas u horas</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadData} disabled={loading} className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={openCreateModal} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-blue-900/30">
            <Plus className="w-4 h-4" /> Nueva Orden
          </button>
        </div>
      </motion.div>

      {/* Selector de día */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="flex items-center gap-2">
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
              <Move className="w-3.5 h-3.5 text-blue-400" /> Arrastra horizontal (hora) o vertical (línea) · Clic para editar
            </span>
          </div>
          <div className="overflow-x-auto no-scrollbar">
            <div style={{ minWidth: CELL_W * 16 + 120 }}>
              {/* Horas header */}
              <div className="flex border-b border-slate-800 bg-slate-900/60">
                <div className="w-28 flex-shrink-0 bg-slate-900/90 px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center">
                  Línea
                </div>
                {HORAS.map((h, idx) => (
                  <div key={h} style={{ width: CELL_W }} className="flex-shrink-0 text-center text-[11px] text-slate-400 py-2.5 border-l border-slate-800 font-mono font-bold">
                    {h}
                  </div>
                ))}
              </div>

              {/* Filas de Líneas */}
              {lineas.map(l => {
                const ordenesDia = ordenes.filter(o => o.linea === l.id && Number(o.dia) === diaSeleccionado);
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

                      {/* Línea de tiempo actual (si es HOY) */}
                      {diaSeleccionado === 0 && (
                        <div className="absolute top-0 bottom-0 w-0.5 bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)] z-10 pointer-events-none" style={{ left: 5.25 * CELL_W }} />
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
                              width: o.duracion * CELL_W - 6,
                              backgroundColor: o.color ? `${o.color}26` : '#2563eb26',
                              border: `1.5px solid ${o.color || '#2563eb'}`,
                            }}
                          >
                            <div className="flex items-center justify-between w-full min-w-0">
                              <div className="min-w-0 truncate pr-1">
                                <p className="text-xs font-black text-white truncate leading-tight flex items-center gap-1.5" style={{ color: o.color || '#60a5fa' }}>
                                  <Move className="w-3 h-3 flex-shrink-0 opacity-70" />
                                  {o.ref}
                                </p>
                                <p className="text-[10px] text-slate-300 truncate leading-none mt-0.5">{o.cliente} · {o.duracion}h</p>
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
                <span className="text-[11px] font-bold text-slate-400">Orden planificada (clic para editar)</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 font-bold flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-blue-400" /> Los cambios en Gantt actualizan automáticamente el producto activo en Líneas y la Secuencia de producción
            </p>
          </div>
        </div>
      </motion.div>

      {/* Modal Crear / Editar Orden */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card p-6 max-w-md w-full bg-slate-900 border border-slate-700 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5 border-b border-slate-800 pb-3">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  {modalMode === 'create' ? <Plus className="w-5 h-5 text-blue-400" /> : <Edit2 className="w-5 h-5 text-blue-400" />}
                  {modalMode === 'create' ? 'Nueva Orden de Fabricación' : 'Editar Orden Planificada'}
                </h3>
                <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Línea de Producción</label>
                  <select
                    value={formOrden.linea}
                    onChange={e => setFormOrden({ ...formOrden, linea: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-blue-500"
                  >
                    {lineas.map(l => <option key={l.id} value={l.id}>{l.nombre} — {l.descripcion}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Día de la semana</label>
                    <select
                      value={formOrden.dia}
                      onChange={e => setFormOrden({ ...formOrden, dia: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-blue-500"
                    >
                      {SEMANA_DIAS.map((d, idx) => <option key={idx} value={idx}>{d} {idx === 0 ? '(Hoy)' : ''}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Hora Inicio</label>
                    <select
                      value={formOrden.horaInicio}
                      onChange={e => setFormOrden({ ...formOrden, horaInicio: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-blue-500"
                    >
                      {HORAS.map((h, idx) => <option key={idx} value={idx + 6}>{h}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Duración (horas)</label>
                    <input
                      type="number" min="1" max="14"
                      value={formOrden.duracion}
                      onChange={e => setFormOrden({ ...formOrden, duracion: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Color de orden</label>
                    <div className="flex items-center gap-1.5 py-1">
                      {COLORS.slice(0, 6).map(color => (
                        <button
                          key={color} type="button"
                          onClick={() => setFormOrden({ ...formOrden, color })}
                          className={`w-7 h-7 rounded-lg transition-transform ${formOrden.color === color ? 'scale-125 ring-2 ring-white' : 'opacity-70 hover:opacity-100'}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Referencia (Producto)</label>
                  <input
                    type="text"
                    value={formOrden.ref}
                    onChange={e => setFormOrden({ ...formOrden, ref: e.target.value })}
                    placeholder="BAT-48V-100Ah"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-blue-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Cliente</label>
                  <input
                    type="text"
                    value={formOrden.cliente}
                    onChange={e => setFormOrden({ ...formOrden, cliente: e.target.value })}
                    placeholder="Cliente A"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  {modalMode === 'edit' ? (
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={saving}
                      className="px-4 py-2.5 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Eliminar Orden
                    </button>
                  ) : <div />}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-black transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-lg shadow-blue-900/40 transition-all"
                    >
                      <Check className="w-3.5 h-3.5" /> {saving ? 'Guardando...' : 'Guardar y Sincronizar'}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
