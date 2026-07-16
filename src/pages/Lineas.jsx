import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Activity, Zap, AlertTriangle, Wrench, ChevronRight, RefreshCw, Plus, Pencil, Trash2 } from 'lucide-react';
import { fetchLineas, insertLinea, updateLinea, deleteLinea, getCurrentShiftInfo, fetchOrdenesTrabajo, fetchParadas } from '@/services/dataService';
import MiniGauge from '@/components/shared/MiniGauge';
import StatusBadge from '@/components/shared/StatusBadge';
import CrudModal from '@/components/shared/CrudModal';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

const LINEA_FIELDS = [
  { key: 'id',                label: 'ID (ej: L6)',         type: 'text',   required: true, placeholder: 'L6' },
  { key: 'nombre',            label: 'Nombre',              type: 'text',   required: true, placeholder: 'Línea 6' },
  { key: 'descripcion',       label: 'Descripción',         type: 'text',   placeholder: 'Ensamblaje baterías...' },
  { key: 'estado',            label: 'Estado',              type: 'select', required: true,
    options: [{ value: 'en_marcha', label: 'En Marcha' }, { value: 'parada', label: 'Parada' }, { value: 'mantenimiento', label: 'Mantenimiento' }] },
  { key: 'turno',             label: 'Turno',               type: 'select', required: true,
    options: ['Mañana', 'Tarde', 'Noche'] },
  { key: 'operarios',        label: 'Operarios',            type: 'number', min: 0, default: 0 },
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
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

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
    const [resL, resO, resP] = await Promise.all([
      fetchLineas(),
      fetchOrdenesTrabajo(),
      fetchParadas()
    ]);
    setLineasRaw(resL?.data || []);
    setOts(resO?.data || []);
    setParadasList(resP?.data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const handler = () => loadData();
    window.addEventListener('lineas_updated', handler);
    window.addEventListener('mantenimiento_updated', handler);
    window.addEventListener('paradas_updated', handler);
    window.addEventListener('materiales_updated', handler);
    return () => {
      window.removeEventListener('lineas_updated', handler);
      window.removeEventListener('mantenimiento_updated', handler);
      window.removeEventListener('paradas_updated', handler);
      window.removeEventListener('materiales_updated', handler);
    };
  }, []);

  // Cálculo de estado en vivo / automático
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
      if (!error) setLineasRaw(prev => prev.map(l => l.id === editItem.id ? (updated || { ...l, ...data }) : l));
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
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">Líneas de Producción</h2>
          <p className="text-slate-500 text-sm">Estado en tiempo real · Turno {getCurrentShiftInfo().shift}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadData} disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-bold transition-all disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Sincronizar
          </button>
          <button onClick={openCreate}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-black transition-all shadow-lg shadow-blue-900/30">
            <Plus className="w-3.5 h-3.5" />
            Nueva Línea
          </button>
        </div>
      </motion.div>

      {/* Tarjetas */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {lineas.map((linea, i) => (
          <motion.div key={linea.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            onClick={() => setSelected(selected === linea.id ? null : linea.id)}
            className={`card p-5 cursor-pointer transition-all duration-200 hover:border-blue-500/40 group ${selected === linea.id ? 'border-blue-500/60 bg-blue-500/5' : ''}`}>
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${linea.estado === 'en_marcha' ? 'bg-emerald-400' : linea.estado === 'parada' ? 'bg-red-400' : 'bg-amber-400'}`} />
                  <h3 className="font-black text-white">{linea.nombre}</h3>
                </div>
                <p className="text-xs text-slate-500">{linea.descripcion}</p>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                <button onClick={e => openEdit(e, linea)}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-blue-400 hover:bg-blue-400/10 opacity-0 group-hover:opacity-100 transition-all"
                  title="Editar datos manuales de respaldo">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={e => openDelete(e, linea)}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-all"
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

            <div className="bg-slate-800/50 rounded-xl p-3 mb-4">
              <p className="text-[9px] text-slate-500 uppercase font-bold mb-1">Fabricando</p>
              <p className="text-sm font-black text-white font-mono">{linea.producto}</p>
              <p className="text-xs text-slate-400">{linea.cliente}</p>
            </div>

            <div className="flex justify-around mb-4">
              <MiniGauge value={linea.disponibilidad} color="auto" label="Disp." size={72} />
              <MiniGauge value={linea.rendimiento} color="auto" label="Rend." size={72} />
              <MiniGauge value={linea.calidad} color="auto" label="Cal." size={72} />
            </div>

            <div className="flex items-center justify-between bg-slate-800/50 rounded-xl px-4 py-2.5">
              <div>
                <p className="text-[9px] text-slate-500 uppercase font-bold">OEE</p>
                <p className={`text-xl font-black ${linea.oee >= 85 ? 'text-emerald-400' : linea.oee >= 75 ? 'text-amber-400' : 'text-red-400'}`}>{linea.oee?.toFixed(1)}%</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-slate-500 uppercase font-bold">Prod. Hoy</p>
                <p className="text-sm font-black text-white">{linea.produccionHoy} <span className="text-slate-500 font-normal text-xs">/ {linea.objetivoHoy}</span></p>
              </div>
            </div>

            {(linea.estado === 'parada' || linea.estado === 'mantenimiento') && linea.motivoParada && (
              <div className="mt-3 flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5">
                {linea.estado === 'parada' ? <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" /> : <Wrench className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />}
                <div>
                  <p className="text-xs text-amber-300 font-medium">{linea.motivoParada}</p>
                  {linea.enVivo && (
                    <p className="text-[10px] text-blue-400/90 font-bold mt-0.5 flex items-center gap-1">
                      <Zap className="w-2.5 h-2.5 inline" /> {linea.origenVivo}
                    </p>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

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
