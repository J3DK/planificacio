import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Zap, AlertTriangle, Wrench, ChevronRight, RefreshCw, Plus,
  Pencil, Trash2, Users, UserCheck, ShieldCheck, Star, X, CheckCircle2, LayoutGrid, List, Info
} from 'lucide-react';
import {
  fetchLineas, insertLinea, updateLinea, deleteLinea, getCurrentShiftInfo,
  fetchOrdenesTrabajo, fetchParadas, fetchOperarios, updateOperario
} from '@/services/dataService';
import MiniGauge from '@/components/shared/MiniGauge';
import StatusBadge from '@/components/shared/StatusBadge';
import CrudModal from '@/components/shared/CrudModal';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';

const LINEA_FIELDS = [
  { key: 'id',                label: 'ID (ej: L6)',         type: 'text',   required: true, placeholder: 'L6' },
  { key: 'nombre',            label: 'Nombre',              type: 'text',   required: true, placeholder: 'Línea 6' },
  { key: 'descripcion',       label: 'Descripción',         type: 'text',   placeholder: 'Ensamblaje baterías...' },
  { key: 'estado',            label: 'Estado',              type: 'select', required: true,
    options: [{ value: 'en_marcha', label: 'En Marcha' }, { value: 'parada', label: 'Parada' }, { value: 'mantenimiento', label: 'Mantenimiento' }] },
  { key: 'turno',             label: 'Turno',               type: 'select', required: true,
    options: ['Mañana', 'Tarde', 'Noche'] },
  { key: 'operarios',        label: 'Operarios (Meta)',     type: 'number', min: 0, default: 0 },
  { key: 'oee',               label: 'OEE (%)',             type: 'number', min: 0, max: 100, step: 0.1, default: 0 },
  { key: 'disponibilidad',    label: 'Disponibilidad (%)',  type: 'number', min: 0, max: 100, step: 0.1, default: 0 },
  { key: 'rendimiento',       label: 'Rendimiento (%)',     type: 'number', min: 0, max: 100, step: 0.1, default: 0 },
  { key: 'calidad',           label: 'Calidad (%)',         type: 'number', min: 0, max: 100, step: 0.1, default: 0 },
  { key: 'produccionHoy',     label: 'Producción Hoy (uds)',type: 'number', min: 0, default: 0 },
  { key: 'objetivoHoy',       label: 'Objetivo Hoy (uds)', type: 'number', min: 0, default: 0 },
  { key: 'velocidadActual',   label: 'Velocidad Actual',    type: 'number', min: 0, default: 0 },
  { key: 'velocidadNominal',  label: 'Velocidad Nominal',   type: 'number', min: 0, default: 0 },
  { key: 'producto',          label: 'Producto',            type: 'text',   placeholder: 'BAT-48V-100Ah' },
  { key: 'cliente',           label: 'Cliente',             type: 'text',   placeholder: 'Cliente A' },
  { key: 'proximoMantenimiento', label: 'Próx. Mantenimiento', type: 'text', placeholder: '02/06/2024' },
  { key: 'motivoParada',      label: 'Motivo Parada',       type: 'textarea', placeholder: 'Descripción del motivo...' },
];

export default function Lineas() {
  const [lineasRaw, setLineasRaw] = useState([]);
  const [ots, setOts] = useState([]);
  const [paradasList, setParadasList] = useState([]);
  const [operariosList, setOperariosList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // CRUD state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [editItem, setEditItem] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const [resL, resO, resP, resOp] = await Promise.all([
      fetchLineas(),
      fetchOrdenesTrabajo(),
      fetchParadas(),
      fetchOperarios()
    ]);
    setLineasRaw(resL?.data || []);
    setOts(resO?.data || []);
    setParadasList(resP?.data || []);
    setOperariosList(resOp?.data || []);
    setLoading(false);
  };

  useRealtimeSync('lineas', () => window.dispatchEvent(new CustomEvent('lineas_updated')));
  useRealtimeSync('paradas', () => window.dispatchEvent(new CustomEvent('paradas_updated')));
  useRealtimeSync('ordenes_trabajo', () => window.dispatchEvent(new CustomEvent('mantenimiento_updated')));
  useRealtimeSync('operarios', () => window.dispatchEvent(new CustomEvent('operarios_updated')));

  useEffect(() => {
    loadData();
    const handler = () => loadData();
    window.addEventListener('lineas_updated', handler);
    window.addEventListener('mantenimiento_updated', handler);
    window.addEventListener('paradas_updated', handler);
    window.addEventListener('materiales_updated', handler);
    window.addEventListener('operarios_updated', handler);
    window.addEventListener('cualificaciones_updated', handler);
    return () => {
      window.removeEventListener('lineas_updated', handler);
      window.removeEventListener('mantenimiento_updated', handler);
      window.removeEventListener('paradas_updated', handler);
      window.removeEventListener('materiales_updated', handler);
      window.removeEventListener('operarios_updated', handler);
      window.removeEventListener('cualificaciones_updated', handler);
    };
  }, []);

  // AGREGADOR EN VIVO: Prioridad 1 Mantenimiento crítico -> Prioridad 2 Parada avería -> Base manual
  const lineas = useMemo(() => {
    return lineasRaw.map(l => {
      // 1. OT crítica en mantenimiento
      const otCritica = ots.find(ot => {
        const matchLinea = ot.linea === l.nombre || ot.linea === l.id || ot.linea?.toLowerCase() === l.nombre?.toLowerCase();
        const matchEstado = ['abierta', 'en curso'].includes((ot.estado || '').toLowerCase());
        const matchPrioridad = (ot.prioridad || '').toLowerCase() === 'critica';
        return matchLinea && matchEstado && matchPrioridad;
      });

      if (otCritica) {
        return {
          ...l,
          _estadoManual: l.estado,
          _motivoManual: l.motivoParada,
          estado: 'mantenimiento',
          motivoParada: otCritica.titulo || otCritica.causaRaiz || `OT Crítica activa (${otCritica.codigo || ''})`,
          enVivo: true,
          origenVivo: `OT Crítica Mantenimiento (${otCritica.codigo || 'Activa'})`
        };
      }

      // 2. Parada activa de avería en Paradas
      const paradaActiva = paradasList.find(p => {
        const matchLinea = p.linea === l.nombre || p.linea === l.id || p.linea?.toLowerCase() === l.nombre?.toLowerCase();
        const matchAbierta = p.fin === null || (p.estado || '').toLowerCase() === 'abierta' || (p.estado || '').toLowerCase() === 'en_curso';
        const matchTipo = (p.tipo || '').toLowerCase() === 'averia';
        return matchLinea && matchAbierta && matchTipo;
      });

      if (paradaActiva) {
        return {
          ...l,
          _estadoManual: l.estado,
          _motivoManual: l.motivoParada,
          estado: 'parada',
          motivoParada: paradaActiva.causa || 'Parada por avería activa en planta',
          enVivo: true,
          origenVivo: `Parada Avería Activa (${paradaActiva.causa || 'Sin cierre'})`
        };
      }

      // 3. Estado base / manual
      return {
        ...l,
        _estadoManual: l.estado,
        _motivoManual: l.motivoParada,
        enVivo: false
      };
    });
  }, [lineasRaw, ots, paradasList]);

  const lineaSeleccionada = lineas.find(l => l.id === selected);

  // Asignar / Desasignar operario a una línea en vivo
  const handleAsignarOperarioLinea = async (opId, newLineaId) => {
    const op = operariosList.find(o => o.id === opId);
    if (!op) return;
    const updated = { ...op, lineaActualId: newLineaId };
    const { data } = await updateOperario(opId, updated);
    if (data) {
      setOperariosList(prev => prev.map(o => o.id === opId ? data : o));
    }
  };

  const openCreate = () => {
    setEditItem({});
    setModalMode('create');
    setModalOpen(true);
  };

  const openEdit = (e, linea) => {
    e.stopPropagation();
    setEditItem({
      ...linea,
      estado: linea._estadoManual || linea.estado,
      motivoParada: linea._motivoManual || linea.motivoParada
    });
    setModalMode('edit');
    setModalOpen(true);
  };

  const openDelete = (e, linea) => {
    e.stopPropagation();
    setDeleteTarget(linea);
    setConfirmOpen(true);
  };

  const handleSave = async (data) => {
    setSaving(true);
    if (modalMode === 'create') {
      const { data: newItem, error } = await insertLinea(data);
      if (!error) setLineasRaw(prev => [...prev, newItem || data]);
    } else {
      const { data: updated, error } = await updateLinea(editItem.id, data);
      if (!error) setLineasRaw(prev => prev.map(l => l.id === editItem.id ? (updated || data) : l));
    }
    setSaving(false);
    setModalOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await deleteLinea(deleteTarget.id);
    if (!error) {
      setLineasRaw(prev => prev.filter(l => l.id !== deleteTarget.id));
      if (selected === deleteTarget.id) setSelected(null);
    }
    setDeleting(false);
    setConfirmOpen(false);
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-12 animate-fade-in">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white">Líneas de Producción & Asignación de Personal</h2>
          <p className="text-slate-400 text-xs font-medium mt-0.5">
            Estado en tiempo real · Turno {getCurrentShiftInfo().shift} · <span className="text-amber-400 font-bold">{operariosList.filter(o => o.lineaActualId && o.estado === 'activo').length} operarios activos asignados en planta</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadData} disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-bold transition-all disabled:opacity-50 shadow-md">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sincronizar</span>
          </button>
          <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 shrink-0 self-center">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
              title="Vista en Fichas"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
              title="Vista en Listado / Tabla"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black transition-all shadow-lg shadow-blue-900/40">
            <Plus className="w-3.5 h-3.5" />
            <span>Nueva Línea</span>
          </button>
        </div>
      </motion.div>

      {/* Tarjetas o Listado de Líneas */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {lineas.map((linea, i) => {
          const operariosEnEstaLinea = operariosList.filter(o => o.lineaActualId === linea.id && o.estado === 'activo');

          return (
            <motion.div key={linea.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              onClick={() => setSelected(selected === linea.id ? null : linea.id)}
              className={`bg-slate-900/90 border rounded-3xl p-5 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:border-blue-500/40 group flex flex-col justify-between ${
                selected === linea.id ? 'border-blue-500 bg-blue-500/5 shadow-2xl shadow-blue-950/50' : 'border-slate-800'
              }`}>
              <div>
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-3 h-3 rounded-full ${
                        linea.estado === 'en_marcha' ? 'bg-emerald-400 animate-pulse shadow-lg shadow-emerald-500/50'
                        : linea.estado === 'parada' ? 'bg-rose-500 animate-bounce'
                        : 'bg-amber-400 animate-pulse'
                      }`} />
                      <h3 className="font-black text-white text-lg tracking-tight">{linea.nombre}</h3>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1">{linea.descripcion}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    <button onClick={e => openEdit(e, linea)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-blue-400/10 opacity-0 group-hover:opacity-100 transition-all"
                      title="Editar datos manuales de respaldo">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={e => openDelete(e, linea)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 opacity-0 group-hover:opacity-100 transition-all"
                      title="Eliminar línea">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <StatusBadge status={linea.estado} />
                    {linea.enVivo ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/20 border border-blue-500/40 text-blue-300 text-[10px] font-black animate-pulse shadow-sm" title={`Cálculo automático en vivo: ${linea.origenVivo}`}>
                        <Zap className="w-2.5 h-2.5 text-blue-400" />
                        En vivo
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded-md bg-slate-800 border border-slate-700/60 text-slate-400 text-[9px] font-medium" title="Estado manual / base del registro">
                        Manual
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3 mb-4">
                  <p className="text-[9px] text-slate-500 uppercase font-black tracking-wider mb-0.5">Fabricando Actualmente</p>
                  <p className="text-sm font-black text-white font-mono">{linea.producto}</p>
                  <p className="text-xs text-slate-400 font-medium">{linea.cliente}</p>
                </div>

                <div className="flex justify-around mb-4 py-1">
                  <MiniGauge value={linea.disponibilidad} color="auto" label="Disp." size={72} />
                  <MiniGauge value={linea.rendimiento} color="auto" label="Rend." size={72} />
                  <MiniGauge value={linea.calidad} color="auto" label="Cal." size={72} />
                </div>

                <div className="flex items-center justify-between bg-slate-950/60 border border-slate-800/80 rounded-2xl px-4 py-2.5">
                  <div>
                    <p className="text-[9px] text-slate-500 uppercase font-black tracking-wider flex items-center gap-1">
                      OEE Global
                      {linea._fuenteOee === 'fallback' && (
                        <Info className="w-3 h-3 text-slate-500 hover:text-slate-300 transition-colors" title="Estimado — datos insuficientes del turno actual" />
                      )}
                    </p>
                    <p className={`text-xl font-black ${linea.oee >= 85 ? 'text-emerald-400' : linea.oee >= 75 ? 'text-amber-400' : 'text-rose-400'}`}>{linea.oee?.toFixed(1)}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-slate-500 uppercase font-black tracking-wider">Prod. Hoy</p>
                    <p className="text-sm font-black text-white">{linea.produccionHoy} <span className="text-slate-500 font-normal text-xs">/ {linea.objetivoHoy}</span></p>
                  </div>
                </div>

                {(linea.estado === 'parada' || linea.estado === 'mantenimiento') && linea.motivoParada && (
                  <div className="mt-3 flex items-start gap-2.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3">
                    {linea.estado === 'parada' ? <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" /> : <Wrench className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />}
                    <div>
                      <p className="text-xs text-amber-300 font-bold leading-snug">{linea.motivoParada}</p>
                      {linea.enVivo && (
                        <p className="text-[10px] text-blue-400/90 font-bold mt-1 flex items-center gap-1">
                          <Zap className="w-2.5 h-2.5 inline" /> {linea.origenVivo}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* ── SECCIÓN DE OPERARIOS ASIGNADOS EN VIVO EN ESTA LÍNEA ── */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-blue-400" />
                    <span>Equipo Asignado ({operariosEnEstaLinea.length})</span>
                  </span>
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) handleAsignarOperarioLinea(e.target.value, linea.id);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-slate-950 hover:bg-slate-800 border border-blue-500/40 rounded-lg px-2 py-1 text-[11px] font-black text-amber-300 focus:outline-none cursor-pointer transition-colors shadow-sm"
                  >
                    <option value="">+ Vincular Operario</option>
                    {operariosList.filter(o => o.estado === 'activo' && o.lineaActualId !== linea.id).map(op => (
                      <option key={op.id} value={op.id}>👷 {op.nombre} ({op.rol})</option>
                    ))}
                  </select>
                </div>

                {operariosEnEstaLinea.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {operariosEnEstaLinea.map(op => (
                      <div
                        key={op.id}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-slate-200 shadow-sm hover:border-slate-700 transition-colors group/op"
                      >
                        {op.avatar ? (
                          <img src={op.avatar} alt={op.nombre} className="w-4 h-4 rounded-full object-cover border border-slate-700" />
                        ) : (
                          <span className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center font-black text-[9px] text-white">
                            {op.nombre?.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                        <span className="font-bold truncate max-w-[110px] text-[11px]">{op.nombre}</span>
                        <button
                          onClick={() => handleAsignarOperarioLinea(op.id, null)}
                          className="text-slate-500 hover:text-rose-400 font-black ml-0.5 opacity-60 group-hover/op:opacity-100 transition-opacity"
                          title="Desvincular de esta línea en vivo"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-950/40 border border-dashed border-slate-800 rounded-xl p-2 text-center">
                    <p className="text-[11px] text-slate-500 italic">Sin personal activo vinculado ahora</p>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
      ) : (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/80 text-slate-400 text-xs font-black uppercase border-b border-slate-800 tracking-wider">
                  <th className="py-3.5 px-4">Línea</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4">Turno</th>
                  <th className="py-3.5 px-4 text-center">OEE</th>
                  <th className="py-3.5 px-4 text-center">Disponib.</th>
                  <th className="py-3.5 px-4 text-center">Rendim.</th>
                  <th className="py-3.5 px-4 text-center">Calidad</th>
                  <th className="py-3.5 px-4 text-center">Producción Hoy</th>
                  <th className="py-3.5 px-4 text-center">Personal</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs font-bold text-slate-200">
                {lineas.map((linea) => {
                  const operariosEnEstaLinea = operariosList.filter(o => o.lineaActualId === linea.id && o.estado === 'activo');
                  return (
                    <tr key={linea.id} onClick={() => setSelected(selected === linea.id ? null : linea.id)} className={`cursor-pointer hover:bg-slate-800/40 transition-colors ${selected === linea.id ? 'bg-blue-500/10' : ''}`}>
                      <td className="py-3 px-4 font-black text-white flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${linea.estado === 'en_marcha' ? 'bg-emerald-400' : linea.estado === 'parada' ? 'bg-rose-500' : 'bg-amber-400'}`} />
                        <div>
                          <span>{linea.nombre}</span>
                          <span className="block text-[10px] text-slate-400 font-normal line-clamp-1">{linea.descripcion}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={linea.estado} />
                      </td>
                      <td className="py-3 px-4 text-slate-300">{linea.turno || 'Mañana'}</td>
                      <td className="py-3 px-4 text-center font-mono font-black text-blue-400">{linea.oee}%</td>
                      <td className="py-3 px-4 text-center font-mono text-slate-300">{linea.disponibilidad}%</td>
                      <td className="py-3 px-4 text-center font-mono text-slate-300">{linea.rendimiento}%</td>
                      <td className="py-3 px-4 text-center font-mono text-emerald-400">{linea.calidad}%</td>
                      <td className="py-3 px-4 text-center font-mono text-white">
                        {linea.produccionHoy} <span className="text-[10px] text-slate-400 font-normal">/ {linea.objetivoHoy || 2000}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">
                          {operariosEnEstaLinea.length} ops
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={e => openEdit(e, linea)} className="p-1.5 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white transition-all" title="Editar línea">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={e => openDelete(e, linea)} className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-500/30 text-slate-400 hover:text-rose-300 transition-all" title="Eliminar línea">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── PANEL DRAWER SUPERVISOR CUANDO SE SELECCIONA UNA LÍNEA ── */}
      <AnimatePresence>
        {lineaSeleccionada && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: 20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: 20 }}
            className="bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/60 border border-blue-500/40 rounded-3xl p-6 shadow-2xl overflow-hidden mt-6"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-black uppercase tracking-wider border border-blue-500/30">
                      Supervisor Planta
                    </span>
                    <span className="text-xs text-slate-400 font-bold">Línea {lineaSeleccionada.id}</span>
                  </div>
                  <h3 className="text-xl font-black text-white mt-0.5">Matriz de Operarios & Competencias: {lineaSeleccionada.nombre}</h3>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all self-end md:self-auto"
              >
                Cerrar Panel
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
              {/* Operarios Actualmente en la Línea */}
              <div className="space-y-3">
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span>Equipo Trabajando Ahora En Vivo ({operariosList.filter(o => o.lineaActualId === lineaSeleccionada.id && o.estado === 'activo').length})</span>
                </h4>
                <div className="space-y-2">
                  {operariosList.filter(o => o.lineaActualId === lineaSeleccionada.id && o.estado === 'activo').map(op => (
                    <div key={op.id} className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {op.avatar ? (
                          <img src={op.avatar} alt={op.nombre} className="w-10 h-10 rounded-xl object-cover border border-slate-700" />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white text-xs">
                            {op.nombre?.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-black text-white text-sm">{op.nombre}</p>
                          <p className="text-xs text-slate-400 font-bold">{op.rol} · <span className="text-amber-400 font-normal">{op.skills?.length || 0} skills</span></p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAsignarOperarioLinea(op.id, null)}
                        className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold transition-colors border border-rose-500/20"
                      >
                        Desvincular
                      </button>
                    </div>
                  ))}
                  {operariosList.filter(o => o.lineaActualId === lineaSeleccionada.id && o.estado === 'activo').length === 0 && (
                    <div className="py-6 text-center text-slate-500 font-bold bg-slate-950/40 rounded-2xl border border-dashed border-slate-800 text-xs">
                      No hay operarios trabajando en esta línea actualmente. Selecciona en el recuadro superior o en la lista de disponibles.
                    </div>
                  )}
                </div>
              </div>

              {/* Operarios Capacitados / Autorizados Disponibles para esta Línea */}
              <div className="space-y-3">
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  <span>Personal Habilitado / Con Permiso Disponible ({operariosList.filter(o => o.estado === 'activo' && o.lineaActualId !== lineaSeleccionada.id && (o.lineas?.includes(lineaSeleccionada.id) || o.permisos?.some(p => p.equipoId === lineaSeleccionada.id))).length})</span>
                </h4>
                <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar">
                  {operariosList
                    .filter(o => o.estado === 'activo' && o.lineaActualId !== lineaSeleccionada.id && (o.lineas?.includes(lineaSeleccionada.id) || o.permisos?.some(p => p.equipoId === lineaSeleccionada.id)))
                    .map(op => {
                      const tienePermisoEsp = op.permisos?.some(p => p.equipoId === lineaSeleccionada.id);
                      return (
                        <div key={op.id} className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5 flex items-center justify-between gap-3 hover:border-blue-500/40 transition-colors">
                          <div className="flex items-center gap-3">
                            {op.avatar ? (
                              <img src={op.avatar} alt={op.nombre} className="w-10 h-10 rounded-xl object-cover border border-slate-700" />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-black text-slate-300 text-xs">
                                {op.nombre?.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-black text-white text-sm">{op.nombre}</p>
                                {tienePermisoEsp && (
                                  <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[9px] font-black border border-purple-500/30" title="Permiso específico de operación certificado">
                                    🛡️ Certificado
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-400 font-medium">
                                Turno: <strong className="text-slate-300">{op.turno}</strong> · Actualmente en: <strong className={op.lineaActualId ? 'text-amber-400' : 'text-slate-500'}>{op.lineaActualId || 'Fuera de línea'}</strong>
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleAsignarOperarioLinea(op.id, lineaSeleccionada.id)}
                            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black transition-all shadow-md active:scale-95 shrink-0"
                          >
                            + Asignar a Línea
                          </button>
                        </div>
                      );
                    })}
                  {operariosList.filter(o => o.estado === 'activo' && o.lineaActualId !== lineaSeleccionada.id && (o.lineas?.includes(lineaSeleccionada.id) || o.permisos?.some(p => p.equipoId === lineaSeleccionada.id))).length === 0 && (
                    <div className="py-6 text-center text-slate-500 font-bold bg-slate-950/40 rounded-2xl border border-dashed border-slate-800 text-xs">
                      No hay otros operarios con capacitación habilitada o permiso para esta línea disponibles ahora.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <CrudModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        title={modalMode === 'create' ? 'Nueva Línea de Producción' : `Editar ${editItem.nombre}`}
        fields={modalMode === 'edit' ? LINEA_FIELDS.filter(f => f.key !== 'id') : LINEA_FIELDS}
        initialData={editItem}
        saving={saving}
      />
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        title={`Eliminar ${deleteTarget?.nombre}`}
        message={`Se eliminará permanentemente la línea "${deleteTarget?.nombre}" y todos sus datos. ¿Estás seguro?`}
        deleting={deleting}
      />
    </div>
  );
}
