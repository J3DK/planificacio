import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Save, FileText, Clock, AlertTriangle, PenTool, 
  Settings, Image as ImageIcon, Box, History, Camera,
  Plus, Trash2, ArrowLeft, CheckCircle2, AlertOctagon,
  Wrench, Activity, Maximize2, Minimize2, RefreshCw
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export const LOCAL_ESTADO_OT_COLORS = {
  'abierta': 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  'en curso': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'pendiente repuesto': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'cerrada': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
};

export const LOCAL_PRIORIDAD_COLORS = {
  'critica': 'bg-red-500/20 text-red-400 border-red-500/30',
  'alta': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'media': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'baja': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
};

export const LOCAL_TIPO_OT_COLORS = {
  'correctivo': 'bg-red-500/10 text-red-400 border-red-500/20',
  'preventivo': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'predictivo': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
};

export default function OTDetallePanel({
  isOpen, onClose, onSave, ot, isCreate, saving,
  activos = [], operariosList = [], ots = [], repuestosList = [],
  onGenerarPDF
}) {
  const { perfil, user } = useAuth();
  const [formData, setFormData] = useState({});
  const [activeTab, setActiveTab] = useState('datos');
  const [lightboxFoto, setLightboxFoto] = useState(null);
  
  // Repuestos state inside OT
  const [repuestoSel, setRepuestoSel] = useState('');
  const [repCantidad, setRepCantidad] = useState(1);

  useEffect(() => {
    if (isOpen) {
      if (isCreate) {
        setFormData({
          tipo: 'correctivo', prioridad: 'alta', estado: 'abierta', 
          linea: 'Línea 1', tiempoEst: 60, tiempoReal: 0, costeTotal: 0, 
          turno: 'Turno Mañana',
          fotos: [], bitacora: [], repuestos: []
        });
      } else {
        setFormData({
          ...ot,
          fotos: Array.isArray(ot.fotos) ? ot.fotos : [],
          bitacora: Array.isArray(ot.bitacora) ? ot.bitacora : [],
          repuestos: Array.isArray(ot.repuestos) ? ot.repuestos : []
        });
      }
      setActiveTab('datos');
      setLightboxFoto(null);
      setRepuestoSel('');
      setRepCantidad(1);
    }
  }, [isOpen, ot, isCreate]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveWrapper = () => {
    onSave(formData);
  };

  const isClosed = formData.estado?.toLowerCase() === 'cerrada';

  // Flat activos logic
  const flatActivos = useMemo(() => {
    const list = [];
    const traverse = (node, pathLabel) => {
      const currentLabel = pathLabel ? `${pathLabel} > ${node.nombre}` : node.nombre;
      list.push({ value: node.id, label: currentLabel });
      if (node.hijos) node.hijos.forEach(h => traverse(h, currentLabel));
    };
    activos.forEach(a => traverse(a, ''));
    return list;
  }, [activos]);

  // Historial activo
  const historialActivo = useMemo(() => {
    if (!formData.activoId) return [];
    return ots.filter(o => o.id !== formData.id && o.activoId === formData.activoId && o.estado === 'cerrada');
  }, [ots, formData.activoId, formData.id]);

  const addRepuestoToOT = () => {
    if (!repuestoSel || repCantidad <= 0) return;
    const rep = repuestosList.find(r => r.id === repuestoSel);
    if (!rep) return;
    
    const newRep = {
      id: Date.now().toString(),
      repuestoId: rep.id,
      codigo: rep.codigo,
      nombre: rep.nombre,
      cantidad: Number(repCantidad),
      costeUnitario: rep.coste_unitario || 0
    };
    
    const currRepuestos = formData.repuestos || [];
    handleChange('repuestos', [...currRepuestos, newRep]);
    
    // Recalcular coste total
    const costExtra = newRep.cantidad * newRep.costeUnitario;
    handleChange('costeTotal', Number(formData.costeTotal || 0) + costExtra);
    
    setRepuestoSel('');
    setRepCantidad(1);
  };

  const removeRepuesto = (idToRemove) => {
    const currRepuestos = formData.repuestos || [];
    const toRemove = currRepuestos.find(r => r.id === idToRemove);
    if (toRemove) {
      const costLess = toRemove.cantidad * toRemove.costeUnitario;
      handleChange('costeTotal', Math.max(0, Number(formData.costeTotal || 0) - costLess));
    }
    handleChange('repuestos', currRepuestos.filter(r => r.id !== idToRemove));
  };

  const tabs = [
    { id: 'datos', label: 'Datos Generales', icon: <FileText className="w-4 h-4" /> },
    { id: 'bitacora', label: 'Bitácora', icon: <History className="w-4 h-4" /> },
    { id: 'fotos', label: 'Fotos', icon: <ImageIcon className="w-4 h-4" /> },
    { id: 'repuestos', label: 'Repuestos', icon: <Box className="w-4 h-4" /> },
    { id: 'historial', label: 'Historial del Activo', icon: <Activity className="w-4 h-4" /> },
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed inset-0 z-50 bg-slate-950 flex flex-col overflow-hidden"
      >
        {/* Cabecera Fija */}
        <div className="flex-none bg-slate-900 border-b border-slate-800 p-4 shadow-xl z-10 flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <button 
                onClick={onClose} 
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors mr-2"
                title="Cerrar y volver al listado"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Wrench className="w-6 h-6 text-indigo-400" />
                  {isCreate ? 'Nueva Orden de Trabajo' : `${formData.codigo || 'OT'} - ${formData.titulo}`}
                </h2>
                {!isCreate && (
                  <div className="flex gap-2 mt-2">
                    <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold border uppercase ${LOCAL_TIPO_OT_COLORS[formData.tipo?.toLowerCase()]}`}>
                      {formData.tipo}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold border uppercase ${LOCAL_PRIORIDAD_COLORS[formData.prioridad?.toLowerCase()]}`}>
                      PRIORIDAD {formData.prioridad}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold border uppercase ${LOCAL_ESTADO_OT_COLORS[formData.estado?.toLowerCase()]}`}>
                      {formData.estado}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {onGenerarPDF && !isCreate && (
                <button
                  onClick={() => onGenerarPDF(formData)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white rounded-xl text-sm font-bold transition-all shadow-lg"
                >
                  <FileText className="w-4 h-4 text-blue-400" /> Generar Informe PDF
                </button>
              )}
              <button
                onClick={handleSaveWrapper}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-black transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Guardando...' : 'Guardar OT'}
              </button>
            </div>
          </div>

          {/* Banner recomendación PDF si cerrada */}
          {!isCreate && isClosed && (
             <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h4 className="text-sm font-bold text-emerald-400">Orden de Trabajo Cerrada</h4>
                    <p className="text-xs text-slate-300">Has marcado esta OT como cerrada. Se recomienda generar el informe PDF final para el archivo documental.</p>
                  </div>
                </div>
                {onGenerarPDF && (
                  <button onClick={() => onGenerarPDF(formData)} className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors">
                    Generar y Descargar PDF
                  </button>
                )}
             </div>
          )}

          {/* Tabs */}
          <div className="flex overflow-x-auto custom-scrollbar gap-2 pb-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${
                  activeTab === tab.id 
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' 
                    : 'bg-slate-800/50 text-slate-400 border border-transparent hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                {tab.icon} {tab.label}
                {tab.id === 'fotos' && formData.fotos?.length > 0 && <span className="ml-1 bg-indigo-500/30 text-indigo-200 px-1.5 py-0.5 rounded text-[10px]">{formData.fotos.length}</span>}
                {tab.id === 'bitacora' && formData.bitacora?.length > 0 && <span className="ml-1 bg-indigo-500/30 text-indigo-200 px-1.5 py-0.5 rounded text-[10px]">{formData.bitacora.length}</span>}
                {tab.id === 'repuestos' && formData.repuestos?.length > 0 && <span className="ml-1 bg-indigo-500/30 text-indigo-200 px-1.5 py-0.5 rounded text-[10px]">{formData.repuestos.length}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Content Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="max-w-6xl mx-auto">
            
            {/* TAB: DATOS GENERALES */}
            {activeTab === 'datos' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  
                  {/* Identificacion */}
                  <div className="card p-5 border border-slate-800 bg-slate-900/50 space-y-4">
                    <h3 className="text-sm font-black text-indigo-400 flex items-center gap-2 uppercase tracking-wider mb-2">
                      <FileText className="w-4 h-4" /> Identificación
                    </h3>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">Título de la OT</label>
                      <input type="text" value={formData.titulo || ''} onChange={e => handleChange('titulo', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">Tipo de Intervención</label>
                      <select value={formData.tipo || 'correctivo'} onChange={e => handleChange('tipo', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none">
                        <option value="correctivo">🛠 Correctivo (Avería / Rotura)</option>
                        <option value="preventivo">📅 Preventivo (Programado / Horas)</option>
                        <option value="predictivo">📡 Predictivo (Condición / Sensores)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">Prioridad</label>
                      <select value={formData.prioridad || 'media'} onChange={e => handleChange('prioridad', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none">
                        <option value="critica">🚨 Crítica (Parada de línea inmediata)</option>
                        <option value="alta">🔴 Alta (Afecta rendimiento)</option>
                        <option value="media">🟠 Media (Mantenimiento regular)</option>
                        <option value="baja">🟢 Baja (Revisión menor)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">Estado</label>
                      <select value={formData.estado || 'abierta'} onChange={e => handleChange('estado', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none">
                        <option value="abierta">Abierta</option>
                        <option value="en curso">En Curso</option>
                        <option value="pendiente repuesto">Pendiente de Repuesto</option>
                        <option value="cerrada">Cerrada</option>
                      </select>
                    </div>
                  </div>

                  {/* Asignacion */}
                  <div className="card p-5 border border-slate-800 bg-slate-900/50 space-y-4">
                    <h3 className="text-sm font-black text-blue-400 flex items-center gap-2 uppercase tracking-wider mb-2">
                      <Settings className="w-4 h-4" /> Ubicación y Asignación
                    </h3>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">Activo Afectado</label>
                      <select value={formData.activoId || ''} onChange={e => handleChange('activoId', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none">
                        <option value="">-- Seleccionar activo en jerarquía --</option>
                        {flatActivos.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">Línea (Filtro MES)</label>
                      <select value={formData.linea || 'Línea 1'} onChange={e => handleChange('linea', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none">
                        <option value="Línea 1">Línea 1</option>
                        <option value="Línea 2">Línea 2</option>
                        <option value="Línea 3">Línea 3</option>
                        <option value="Línea 4">Línea 4</option>
                        <option value="Línea 5">Línea 5</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">Técnico Asignado</label>
                      <select value={formData.tecnico || ''} onChange={e => handleChange('tecnico', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none">
                        <option value="">-- Seleccionar técnico --</option>
                        {operariosList.map(op => <option key={op.nombre} value={op.nombre}>{op.nombre} ({op.rol || 'Técnico'})</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">Turno</label>
                      <select value={formData.turno || 'Turno Mañana'} onChange={e => handleChange('turno', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none">
                        <option value="Turno Mañana">Turno Mañana</option>
                        <option value="Turno Tarde">Turno Tarde</option>
                        <option value="Turno Noche">Turno Noche</option>
                      </select>
                    </div>
                  </div>

                  {/* Tiempos y Costes */}
                  <div className="card p-5 border border-slate-800 bg-slate-900/50 space-y-4">
                    <h3 className="text-sm font-black text-amber-400 flex items-center gap-2 uppercase tracking-wider mb-2">
                      <Clock className="w-4 h-4" /> Ejecución y Costes
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1">Tiempo Est. (min)</label>
                        <input type="number" min="0" value={formData.tiempoEst || 60} onChange={e => handleChange('tiempoEst', Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1">Tiempo Real (min)</label>
                        <input type="number" min="0" value={formData.tiempoReal || 0} onChange={e => handleChange('tiempoReal', Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">Coste Total (€) - Auto</label>
                      <input type="number" min="0" value={formData.costeTotal || 0} onChange={e => handleChange('costeTotal', Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none font-mono text-emerald-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">Causa Raíz / Comentarios</label>
                      <textarea value={formData.causaRaiz || ''} onChange={e => handleChange('causaRaiz', e.target.value)} rows={3}
                        placeholder="ej: ERR-MEC-01 Desgaste de eje"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none resize-none" />
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* TAB: BITÁCORA */}
            {activeTab === 'bitacora' && (
              <div className="max-w-3xl mx-auto space-y-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
                  <h3 className="text-sm font-black text-indigo-400 flex items-center gap-2 uppercase tracking-wider mb-4">
                    <PenTool className="w-4 h-4" /> Añadir Entrada a Bitácora
                  </h3>
                  <div className="flex flex-col gap-3">
                    <textarea
                      id="bitacora-input"
                      placeholder="Registra avances, descubrimientos, o acciones tomadas en la intervención..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none min-h-[100px]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById('bitacora-input');
                        if (!input || !input.value.trim()) return;
                        const current = Array.isArray(formData.bitacora) ? formData.bitacora : [];
                        const newEntry = {
                          id: Date.now().toString(),
                          fecha: new Date().toISOString(),
                          autor: perfil?.nombre || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || formData.tecnico || 'Usuario',
                          texto: input.value.trim()
                        };
                        handleChange('bitacora', [newEntry, ...current]);
                        input.value = '';
                      }}
                      className="self-end px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg"
                    >
                      Añadir Nota
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-400 mb-2">Historial Cronológico de la Intervención</h3>
                  {(!formData.bitacora || formData.bitacora.length === 0) ? (
                    <div className="text-center py-12 bg-slate-900/30 rounded-2xl border border-dashed border-slate-800">
                      <History className="w-8 h-8 text-slate-600 mx-auto mb-3 opacity-50" />
                      <p className="text-slate-500 italic text-sm">No hay entradas en la bitácora todavía.</p>
                    </div>
                  ) : (
                    formData.bitacora.map(entry => (
                      <div key={entry.id} className="relative pl-6">
                        <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-indigo-500 ring-4 ring-slate-950"></div>
                        <div className="absolute left-0.5 top-3.5 bottom-[-16px] w-px bg-slate-800"></div>
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-black text-indigo-400 bg-indigo-900/20 px-2.5 py-0.5 rounded-lg border border-indigo-500/20">
                              {entry.autor || 'Sistema'}
                            </span>
                            <span className="text-xs text-slate-500 font-medium bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                              {new Date(entry.fecha).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-sm text-slate-300 leading-relaxed break-words whitespace-pre-wrap">{entry.texto}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB: FOTOS */}
            {activeTab === 'fotos' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                  <div>
                    <h3 className="text-sm font-black text-slate-200">Evidencias Fotográficas</h3>
                    <p className="text-xs text-slate-400">Captura o adjunta fotos del estado de la máquina, roturas o reparaciones finalizadas.</p>
                  </div>
                  <label className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl cursor-pointer transition-all shadow-lg text-sm font-black">
                    <Camera className="w-4 h-4" /> Tomar / Adjuntar Foto
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const dataUrl = event.target.result;
                          const current = Array.isArray(formData.fotos) ? formData.fotos : [];
                          const newPic = {
                            id: Date.now().toString(),
                            fecha: new Date().toISOString(),
                            dataUrl: dataUrl,
                            etiqueta: 'Evidencia visual'
                          };
                          handleChange('fotos', [...current, newPic]);
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                </div>

                {(!formData.fotos || formData.fotos.length === 0) ? (
                  <div className="text-center py-20 bg-slate-900/30 rounded-2xl border border-dashed border-slate-800">
                    <ImageIcon className="w-10 h-10 text-slate-600 mx-auto mb-3 opacity-50" />
                    <p className="text-slate-500 font-bold">Sin evidencias fotográficas.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {formData.fotos.map(pic => (
                      <div key={pic.id} className="group flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg transition-transform hover:-translate-y-1">
                        <div className="relative aspect-video bg-black overflow-hidden cursor-pointer" onClick={() => setLightboxFoto(pic)}>
                          <img src={pic.dataUrl} alt="Evidencia" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                            <Maximize2 className="w-5 h-5 text-white/80" />
                          </div>
                        </div>
                        <div className="p-3 flex items-center justify-between gap-2 bg-slate-900">
                          <select
                            value={pic.etiqueta}
                            onChange={(e) => {
                              const current = formData.fotos.map(p => p.id === pic.id ? { ...p, etiqueta: e.target.value } : p);
                              handleChange('fotos', current);
                            }}
                            className="flex-1 bg-slate-800 text-xs text-white border border-slate-700 rounded-lg p-1.5 focus:border-indigo-500 outline-none truncate"
                          >
                            <option value="Antes">Antes de reparación</option>
                            <option value="Durante">Durante intervención</option>
                            <option value="Después">Después (Finalizado)</option>
                            <option value="Detalle del fallo">Detalle específico del fallo</option>
                            <option value="Evidencia visual">Evidencia visual genérica</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => {
                              const current = formData.fotos.filter(p => p.id !== pic.id);
                              handleChange('fotos', current);
                            }}
                            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors border border-red-500/20"
                            title="Eliminar foto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: REPUESTOS */}
            {activeTab === 'repuestos' && (
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
                  <h3 className="text-sm font-black text-indigo-400 flex items-center gap-2 uppercase tracking-wider mb-4">
                    <Box className="w-4 h-4" /> Añadir Repuesto Utilizado
                  </h3>
                  <div className="flex flex-col sm:flex-row gap-3 items-end">
                    <div className="flex-1 w-full">
                      <label className="block text-xs font-bold text-slate-400 mb-1">Buscar en Catálogo de Almacén</label>
                      <select 
                        value={repuestoSel} onChange={e => setRepuestoSel(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none"
                      >
                        <option value="">-- Selecciona un repuesto --</option>
                        {repuestosList.map(r => (
                          <option key={r.id} value={r.id}>
                            {r.codigo} - {r.nombre} (Stock: {r.stock_actual} | Coste: {r.coste_unitario}€)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-full sm:w-24">
                      <label className="block text-xs font-bold text-slate-400 mb-1">Cant.</label>
                      <input 
                        type="number" min="1" value={repCantidad} onChange={e => setRepCantidad(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white text-center focus:border-indigo-500 outline-none"
                      />
                    </div>
                    <button
                      onClick={addRepuestoToOT}
                      disabled={!repuestoSel || repCantidad < 1}
                      className="w-full sm:w-auto px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white rounded-xl text-sm font-bold transition-all whitespace-nowrap shadow-lg"
                    >
                      Añadir a OT
                    </button>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-950 border-b border-slate-800 text-xs text-slate-400 uppercase tracking-wider">
                        <th className="p-3 font-bold">Código / Repuesto</th>
                        <th className="p-3 font-bold text-center">Cant.</th>
                        <th className="p-3 font-bold text-right">Coste U.</th>
                        <th className="p-3 font-bold text-right">Coste Total</th>
                        <th className="p-3 font-bold text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {(!formData.repuestos || formData.repuestos.length === 0) ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-500 italic text-sm">
                            No se han registrado repuestos para esta OT.
                          </td>
                        </tr>
                      ) : (
                        formData.repuestos.map((r, i) => (
                          <tr key={r.id || i} className="hover:bg-slate-800/30 transition-colors">
                            <td className="p-3">
                              <div className="text-sm font-bold text-slate-200">{r.codigo}</div>
                              <div className="text-xs text-slate-500">{r.nombre}</div>
                            </td>
                            <td className="p-3 text-center text-sm text-slate-300 font-mono">{r.cantidad}</td>
                            <td className="p-3 text-right text-sm text-slate-400">{Number(r.costeUnitario || 0).toFixed(2)} €</td>
                            <td className="p-3 text-right text-sm text-emerald-400 font-mono font-bold">{(r.cantidad * (r.costeUnitario || 0)).toFixed(2)} €</td>
                            <td className="p-3 text-center">
                              <button onClick={() => removeRepuesto(r.id)} className="p-1.5 text-slate-500 hover:text-red-400 transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                  <div className="bg-slate-950 p-4 flex justify-end items-center border-t border-slate-800">
                    <span className="text-sm font-bold text-slate-400 mr-4">Total Repuestos en OT:</span>
                    <span className="text-lg font-black text-emerald-400 font-mono">
                      {Number((formData.repuestos || []).reduce((acc, r) => acc + (r.cantidad * (r.costeUnitario || 0)), 0)).toFixed(2)} €
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: HISTORIAL DEL ACTIVO */}
            {activeTab === 'historial' && (
              <div className="space-y-6 max-w-4xl mx-auto">
                {!formData.activoId ? (
                  <div className="text-center py-20 bg-slate-900/30 rounded-2xl border border-dashed border-slate-800">
                    <AlertOctagon className="w-10 h-10 text-amber-500/50 mx-auto mb-3" />
                    <p className="text-amber-500/80 font-bold">Selecciona un Activo en "Datos Generales" primero.</p>
                  </div>
                ) : (
                  <>
                    <h3 className="text-sm font-black text-slate-300 mb-2 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-indigo-400" /> 
                      Intervenciones pasadas de: <span className="text-indigo-300">{formData.activoNombre || formData.activoId}</span>
                    </h3>
                    
                    {historialActivo.length === 0 ? (
                      <div className="text-center py-12 bg-slate-900/30 rounded-2xl border border-slate-800">
                        <History className="w-8 h-8 text-slate-600 mx-auto mb-3 opacity-50" />
                        <p className="text-slate-500 font-bold text-sm">Este activo no tiene OTs cerradas anteriores.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {historialActivo.map(hOt => (
                          <div key={hOt.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex justify-between items-start">
                            <div>
                              <div className="flex gap-2 items-center mb-1">
                                <span className="text-xs text-slate-500 font-mono">{hOt.codigo}</span>
                                <span className="text-xs text-slate-400 font-bold">{new Date(hOt.fechaCierre || hOt.fechaApertura).toLocaleDateString()}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold border ${LOCAL_TIPO_OT_COLORS[hOt.tipo?.toLowerCase()]}`}>{hOt.tipo}</span>
                              </div>
                              <h4 className="text-sm font-bold text-slate-200">{hOt.titulo}</h4>
                              <p className="text-xs text-slate-400 mt-1 line-clamp-1"><span className="font-bold text-slate-500">Causa:</span> {hOt.causaRaiz || 'Sin causa registrada'}</p>
                            </div>
                            {onGenerarPDF && (
                              <button onClick={() => onGenerarPDF(hOt)} className="p-2 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-lg transition-colors border border-slate-700" title="Descargar Informe de OT antigua">
                                <FileText className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

          </div>
        </div>

        {/* Lightbox para Fotos */}
        <AnimatePresence>
          {lightboxFoto && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/95 flex flex-col"
            >
              <div className="p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 z-10">
                <div className="bg-black/50 px-3 py-1 rounded-lg border border-white/10 backdrop-blur-sm">
                  <span className="text-white font-bold text-sm">{lightboxFoto.etiqueta}</span>
                  <span className="text-slate-400 text-xs ml-3">{new Date(lightboxFoto.fecha).toLocaleString()}</span>
                </div>
                <button onClick={() => setLightboxFoto(null)} className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-sm transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex-1 flex justify-center items-center p-4">
                <img src={lightboxFoto.dataUrl} alt="Vista ampliada" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
    </AnimatePresence>
  );
}
