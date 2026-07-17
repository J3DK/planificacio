import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  Wrench, Activity, Clock, ShieldCheck, AlertTriangle, Cpu, Layers,
  Calendar, CheckCircle2, Plus, Pencil, Trash2, Search, Filter,
  ArrowUpRight, ArrowDownRight, RefreshCw, Box, ChevronRight, ChevronDown,
  Sparkles, FileText, Link2, DollarSign, Settings, X, Save, ChevronUp,
  Zap, Factory, LayoutGrid, List
} from 'lucide-react';
import {
  fetchOrdenesTrabajo, insertOrdenTrabajo, updateOrdenTrabajo, deleteOrdenTrabajo,
  fetchActivosMantenimientoEditable,
  fetchRepuestos, insertRepuesto, updateRepuesto, deleteRepuesto,
  fetchPlanesPreventivos, updatePlanPreventivo, insertPlanPreventivo, deletePlanPreventivo,
  addChecklistItem, updateChecklistItem, removeChecklistItem,
  fetchSensoresPredictivos, insertSensorPredictivo, updateSensorPredictivo, deleteSensorPredictivo,
  insertEquipoEnLinea, updateEquipoEnArbol, deleteEquipoEnArbol, insertComponenteEnEquipo,
  getEquiposPlanos, fetchOperarios, registrarHistorialOperario, fetchParadas, updateParada
} from '@/services/dataService';
import {
  kpisMantenimiento as mockKpis, evolucionDisponibilidadLinea, horasParadaPorCausaTecnica,
  tablaDisponibilidadLineas, topCausasAveria, mensajeClaveMantenimiento,
  kpisEvolucionMensual
} from '@/data/mockMantenimiento';
import CrudModal from '@/components/shared/CrudModal';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

const TAB_OPTIONS = [
  { id: 'resumen', label: 'Resumen', icon: <Activity className="w-4 h-4" /> },
  { id: 'activos', label: 'Activos', icon: <Cpu className="w-4 h-4" /> },
  { id: 'ots', label: 'Órdenes de Trabajo (OT)', icon: <FileText className="w-4 h-4" /> },
  { id: 'preventivo', label: 'Plan Preventivo', icon: <Calendar className="w-4 h-4" /> },
  { id: 'predictivo', label: 'Predictivo', icon: <Activity className="w-4 h-4" /> },
  { id: 'repuestos', label: 'Repuestos / Almacén', icon: <Box className="w-4 h-4" /> },
  { id: 'kpis', label: 'Indicadores (KPI)', icon: <Layers className="w-4 h-4" /> },
];

const TIPO_OT_COLORS = {
  correctivo: 'bg-red-500/20 text-red-400 border-red-500/30',
  preventivo: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  predictivo: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
};

const ESTADO_OT_COLORS = {
  'abierta': 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse',
  'en curso': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'pendiente repuesto': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'cerrada': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
};

const OT_FIELDS = [
  { key: 'titulo', label: 'Título / Descripción de la OT', type: 'text', required: true, placeholder: 'ej: Sustitución de rodamiento motor tracción' },
  { key: 'linea', label: 'Línea Afectada', type: 'select', required: true, options: ['Línea 1', 'Línea 2', 'Línea 3', 'Línea 4', 'Línea 5'] },
  { key: 'activoNombre', label: 'Activo / Equipo Afectado', type: 'text', required: true, placeholder: 'ej: Motor Principal Tracción Rodillos (MQ-401)' },
  { key: 'tipo', label: 'Tipo de Intervención', type: 'select', required: true, options: [
    { value: 'correctivo', label: '🔴 Correctivo (Avería / Rotura)' },
    { value: 'preventivo', label: '🟠 Preventivo (Programado / Horas)' },
    { value: 'predictivo', label: '🔵 Predictivo (Condición / Sensores)' }
  ]},
  { key: 'prioridad', label: 'Prioridad', type: 'select', required: true, options: [
    { value: 'critica', label: '🚨 Crítica (Parada de línea inmediata)' },
    { value: 'alta', label: '⚠️ Alta (Afecta rendimiento)' },
    { value: 'media', label: '🔵 Media (Mantenimiento regular)' },
    { value: 'baja', label: '🟢 Baja (Revisión menor)' }
  ]},
  { key: 'estado', label: 'Estado Actual', type: 'select', required: true, options: [
    { value: 'abierta', label: 'Abierta' },
    { value: 'en curso', label: 'En Curso' },
    { value: 'pendiente repuesto', label: 'Pendiente de Repuesto' },
    { value: 'cerrada', label: 'Cerrada' }
  ]},
  { key: 'tecnico', label: 'Técnico Asignado', type: 'text', required: true, placeholder: 'Nombre del técnico o equipo MTO' },
  { key: 'turno', label: 'Turno', type: 'select', required: true, options: ['Turno Mañana', 'Turno Tarde', 'Turno Noche'] },
  { key: 'tiempoEst', label: 'Tiempo Estimado (min)', type: 'number', min: 1, default: 60 },
  { key: 'tiempoReal', label: 'Tiempo Real Invertido (min)', type: 'number', min: 0, default: 0 },
  { key: 'paradaId', label: 'Vínculo ID Parada MES (Si procede)', type: 'number', placeholder: 'ID de evento de Parada en módulo Paradas' },
  { key: 'causaRaiz', label: 'Código y Comentario Causa Raíz', type: 'textarea', placeholder: 'ej: ERR-MEC-01 — Sobrecarga por desgaste mecánico en eje de arrastre' },
  { key: 'costeTotal', label: 'Coste Estimado/Real (€)', type: 'number', min: 0, default: 0 }
];

const PLAN_PREVENTIVO_FIELDS = [
  { key: 'codigo', label: 'Código del Plan', type: 'text', required: true, placeholder: 'ej: PREV-SOLD-WEE' },
  { key: 'titulo', label: 'Título del Plan', type: 'text', required: true, placeholder: 'ej: Inspección crisol y nivel estaño' },
  { key: 'activoNombre', label: 'Activo / Equipo', type: 'text', required: true, placeholder: 'ej: Estación de Soldadura (MQ-101)' },
  { key: 'linea', label: 'Línea', type: 'select', required: true, options: ['Línea 1', 'Línea 2', 'Línea 3', 'Línea 4', 'Línea 5'] },
  { key: 'frecuencia', label: 'Frecuencia', type: 'text', required: true, placeholder: 'ej: Semanal (o cada 160h)' },
  { key: 'tipoDisparador', label: 'Tipo de Disparador', type: 'select', required: true, options: [
    { value: 'horas', label: 'Contador de Horas' },
    { value: 'calendario', label: 'Calendario (días)' }
  ]},
  { key: 'contadorActual', label: 'Contador Actual (h o días)', type: 'number', min: 0, default: 0 },
  { key: 'umbralDisparo', label: 'Umbral de Disparo (h o días)', type: 'number', min: 1, required: true, default: 500 },
  { key: 'ultimaIntervencion', label: 'Fecha Última Intervención', type: 'text', placeholder: 'YYYY-MM-DD' },
  { key: 'proximaIntervencion', label: 'Fecha Próxima Intervención', type: 'text', placeholder: 'YYYY-MM-DD' },
  { key: 'estado', label: 'Estado', type: 'select', required: true, options: [
    { value: 'al dia', label: 'Al Día' },
    { value: 'proximo', label: 'Próximo Vencimiento' },
    { value: 'vencido', label: 'Vencido' }
  ]},
];

const SENSOR_FIELDS = [
  { key: 'activoNombre', label: 'Activo / Equipo Monitoreado', type: 'text', required: true, placeholder: 'ej: Motor Principal Tracción Rodillos (MQ-401)' },
  { key: 'linea', label: 'Línea', type: 'select', required: true, options: ['Línea 1', 'Línea 2', 'Línea 3', 'Línea 4', 'Línea 5'] },
  { key: 'variable', label: 'Variable / Magnitud Medida', type: 'text', required: true, placeholder: 'ej: Vibración RMS Ax/Rad (mm/s)' },
  { key: 'valorActual', label: 'Valor Actual', type: 'number', required: true, step: 0.1, default: 0 },
  { key: 'umbralAlerta', label: 'Umbral de Alerta', type: 'number', required: true, step: 0.1, default: 0 },
  { key: 'umbralCritico', label: 'Umbral Crítico', type: 'number', required: true, step: 0.1, default: 0 },
  { key: 'unidad', label: 'Unidad de Medida', type: 'text', required: true, placeholder: 'ej: mm/s, °C, horas, µm' },
  { key: 'vidaUtilRestantePct', label: 'Vida Útil Restante (%)', type: 'number', min: 0, max: 100, required: true, default: 100 },
  { key: 'estado', label: 'Estado del Sensor', type: 'select', required: true, options: [
    { value: 'normal', label: '🟢 Normal' },
    { value: 'alerta', label: '🟠 Alerta' },
    { value: 'critico', label: '🔴 Crítico' }
  ]},
  { key: 'recomendacion', label: 'Recomendación / Acción', type: 'textarea', placeholder: 'ej: Fallo inminente. Programar parada en menos de 24h.' },
];

const EQUIPO_FIELDS = [
  { key: 'nombre', label: 'Nombre del Equipo / Máquina', type: 'text', required: true, placeholder: 'ej: Robot de Pick & Place SMD #2' },
  { key: 'fabricante', label: 'Fabricante', type: 'text', placeholder: 'ej: ASMPT Fuji' },
  { key: 'numSerie', label: 'Número de Serie', type: 'text', placeholder: 'ej: FUJ-2024-XXX' },
  { key: 'fechaInstalacion', label: 'Fecha de Instalación', type: 'text', placeholder: 'YYYY-MM-DD' },
  { key: 'horasFuncionamiento', label: 'Horas de Funcionamiento', type: 'number', min: 0, default: 0 },
  { key: 'intervenciones', label: 'Nº Intervenciones Históricas', type: 'number', min: 0, default: 0 },
  { key: 'criticidad', label: 'Criticidad', type: 'select', required: true, options: [
    { value: 'alta', label: 'Alta' },
    { value: 'media', label: 'Media' },
    { value: 'baja', label: 'Baja' }
  ]},
];

const COMPONENTE_FIELDS = [
  { key: 'nombre', label: 'Nombre del Componente', type: 'text', required: true, placeholder: 'ej: Cabezal Rotativo 12 Boquillas' },
  { key: 'horasFuncionamiento', label: 'Horas de Funcionamiento', type: 'number', min: 0, default: 0 },
  { key: 'intervenciones', label: 'Nº Intervenciones', type: 'number', min: 0, default: 0 },
  { key: 'criticidad', label: 'Criticidad', type: 'select', required: true, options: [
    { value: 'alta', label: 'Alta' },
    { value: 'media', label: 'Media' },
    { value: 'baja', label: 'Baja' }
  ]},
];

// ─── Componente árbol activos con edición ─────────────────────────────────────

function NodoActivo({ nodo, nivel = 0, onEditEquipo, onDeleteEquipo, onAddComponente }) {
  const [expandido, setExpandido] = useState(nivel < 2);

  const getTipoIcon = (t) => {
    switch (t) {
      case 'planta': return <Layers className="w-4 h-4 text-indigo-400" />;
      case 'linea': return <Activity className="w-4 h-4 text-blue-400" />;
      case 'maquina': return <Cpu className="w-4 h-4 text-amber-400" />;
      case 'componente': return <Wrench className="w-3.5 h-3.5 text-slate-400" />;
      default: return <Box className="w-4 h-4 text-slate-400" />;
    }
  };

  const hasHijos = nodo.hijos && nodo.hijos.length > 0;
  const esEditable = nodo.tipo === 'maquina' || nodo.tipo === 'componente';

  return (
    <div className="select-none">
      <div
        className={`flex items-center justify-between p-3 rounded-xl transition-all border ${
          nivel === 0 ? 'bg-slate-900 border-indigo-500/40 text-white font-black mb-2' :
          nivel === 1 ? 'bg-slate-900/80 border-slate-800 text-slate-100 font-bold ml-4 my-1.5' :
          nivel === 2 ? 'bg-slate-950 border-slate-800/80 text-slate-200 ml-8 my-1' :
          'bg-slate-950/60 border-slate-800/40 text-slate-400 ml-12 my-1 text-xs'
        } ${hasHijos ? 'cursor-pointer hover:border-indigo-500/60' : ''}`}
      >
        <div
          className="flex items-center gap-2.5 overflow-hidden flex-1"
          onClick={() => hasHijos && setExpandido(!expandido)}
        >
          {hasHijos ? (
            expandido ? <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
          ) : (
            <span className="w-4" />
          )}
          {getTipoIcon(nodo.tipo)}
          <span className="truncate">{nodo.nombre}</span>
          {nodo.numSerie && <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 ml-2">{nodo.numSerie}</span>}
        </div>

        <div className="flex items-center gap-3 flex-shrink-0 text-xs">
          {nodo.fabricante && <span className="text-slate-500 hidden md:inline">{nodo.fabricante}</span>}
          {nodo.horasFuncionamiento !== undefined && (
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[11px]">
              {nodo.horasFuncionamiento} h
            </span>
          )}
          {nodo.intervenciones !== undefined && (
            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold text-[11px]">
              {nodo.intervenciones} OTs
            </span>
          )}
          {nodo.criticidad && (
            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
              nodo.criticidad === 'alta' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
              nodo.criticidad === 'media' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
              'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}>
              {nodo.criticidad}
            </span>
          )}

          {/* Botones de edición solo para máquinas y componentes */}
          {esEditable && (
            <div className="flex items-center gap-1 ml-1">
              {nodo.tipo === 'maquina' && onAddComponente && (
                <button
                  onClick={(e) => { e.stopPropagation(); onAddComponente(nodo); }}
                  className="p-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-all"
                  title="Añadir componente"
                >
                  <Plus className="w-3 h-3" />
                </button>
              )}
              {onEditEquipo && (
                <button
                  onClick={(e) => { e.stopPropagation(); onEditEquipo(nodo); }}
                  className="p-1 rounded-lg bg-slate-800 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 border border-slate-700 transition-all"
                  title="Editar"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              )}
              {onDeleteEquipo && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteEquipo(nodo); }}
                  className="p-1 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700 transition-all"
                  title="Eliminar"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {expandido && hasHijos && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden space-y-1">
            {nodo.hijos.map(h => (
              <NodoActivo
                key={h.id}
                nodo={h}
                nivel={nivel + 1}
                onEditEquipo={onEditEquipo}
                onDeleteEquipo={onDeleteEquipo}
                onAddComponente={onAddComponente}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Componente checklist inline editable ────────────────────────────────────

function ChecklistEditor({ plan, onToggle, onAddItem, onUpdateItem, onRemoveItem }) {
  const [newTarea, setNewTarea] = useState('');
  const [editingIdx, setEditingIdx] = useState(null);
  const [editingVal, setEditingVal] = useState('');

  const handleAdd = async () => {
    const t = newTarea.trim();
    if (!t) return;
    await onAddItem(plan.id, t);
    setNewTarea('');
  };

  const handleSaveEdit = async (idx) => {
    const t = editingVal.trim();
    if (t) await onUpdateItem(plan.id, idx, t);
    setEditingIdx(null);
    setEditingVal('');
  };

  return (
    <div className="space-y-2">
      <span className="text-xs font-black text-slate-300 block">Checklist de Tareas Técnicas:</span>

      {plan.checklist.map((c, i) => (
        <div key={i} className="flex items-center gap-2 group">
          {editingIdx === i ? (
            <div className="flex items-center gap-2 flex-1">
              <input
                autoFocus
                type="text"
                value={editingVal}
                onChange={e => setEditingVal(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { e.preventDefault(); handleSaveEdit(i); }
                  if (e.key === 'Escape') setEditingIdx(null);
                }}
                className="flex-1 bg-slate-800 border border-blue-500/50 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
              />
              <button onClick={() => handleSaveEdit(i)} className="p-1 rounded bg-blue-600/30 text-blue-400 hover:bg-blue-600/50 text-xs">✓</button>
              <button onClick={() => setEditingIdx(null)} className="p-1 rounded bg-slate-700 text-slate-400 hover:text-white text-xs">✕</button>
            </div>
          ) : (
            <div
              onClick={() => onToggle(plan.id, i)}
              className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-all border flex-1 ${
                c.completado ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 font-bold' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${c.completado ? 'text-emerald-400' : 'text-slate-600'}`} />
              <span className="text-xs flex-1">{c.tarea}</span>
            </div>
          )}

          {editingIdx !== i && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => { setEditingIdx(i); setEditingVal(c.tarea); }}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
              >
                <Pencil className="w-3 h-3" />
              </button>
              <button
                onClick={() => onRemoveItem(plan.id, i)}
                className="p-1 rounded bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      ))}

      {/* Añadir nueva tarea */}
      <div className="flex gap-2 pt-1">
        <input
          type="text"
          value={newTarea}
          onChange={e => setNewTarea(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
          placeholder="Nueva tarea del checklist..."
          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
        />
        <button
          onClick={handleAdd}
          className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 text-xs font-black transition-all flex items-center gap-1"
        >
          <Plus className="w-3 h-3" /> Añadir
        </button>
      </div>
    </div>
  );
}


export default function Mantenimiento() {
  const [activeTab, setActiveTab] = useState('resumen');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // ─── Datos ─────────────────────────────────────────────────────────────────
  const [ots, setOts] = useState([]);
  const [activos, setActivos] = useState([]);
  const [repuestos, setRepuestos] = useState([]);
  const [preventivos, setPreventivos] = useState([]);
  const [sensores, setSensores] = useState([]);

  // Lista plana de equipos (para select en repuestos)
  const [equiposPlanos, setEquiposPlanos] = useState([]);
  const [operariosList, setOperariosList] = useState([]);
  const [formOtData, setFormOtData] = useState(null);

  // ─── Filtros OT ────────────────────────────────────────────────────────────
  const [filtroLineaOt, setFiltroLineaOt] = useState('Todas');
  const [filtroEstadoOt, setFiltroEstadoOt] = useState('todas');
  const [filtroTipoOt, setFiltroTipoOt] = useState('todos');
  const [busquedaOt, setBusquedaOt] = useState('');

  // ─── Modales OT ────────────────────────────────────────────────────────────
  const [otModalOpen, setOtModalOpen] = useState(false);
  const [otModalMode, setOtModalMode] = useState('create');
  const [editOtItem, setEditOtItem] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmOtOpen, setConfirmOtOpen] = useState(false);
  const [deleteOtTarget, setDeleteOtTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ─── Modales Repuesto ──────────────────────────────────────────────────────
  const [repModalOpen, setRepModalOpen] = useState(false);
  const [repModalMode, setRepModalMode] = useState('create');
  const [editRepItem, setEditRepItem] = useState({});
  const [confirmRepOpen, setConfirmRepOpen] = useState(false);
  const [deleteRepTarget, setDeleteRepTarget] = useState(null);

  // ─── Modales Plan Preventivo ───────────────────────────────────────────────
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [planModalMode, setPlanModalMode] = useState('create');
  const [editPlanItem, setEditPlanItem] = useState({});
  const [confirmPlanOpen, setConfirmPlanOpen] = useState(false);
  const [deletePlanTarget, setDeletePlanTarget] = useState(null);

  // ─── Modales Sensor Predictivo ─────────────────────────────────────────────
  const [sensorModalOpen, setSensorModalOpen] = useState(false);
  const [sensorModalMode, setSensorModalMode] = useState('create');
  const [editSensorItem, setEditSensorItem] = useState({});
  const [confirmSensorOpen, setConfirmSensorOpen] = useState(false);
  const [deleteSensorTarget, setDeleteSensorTarget] = useState(null);

  // ─── Modales Equipo / Árbol ────────────────────────────────────────────────
  const [equipoModalOpen, setEquipoModalOpen] = useState(false);
  const [equipoModalMode, setEquipoModalMode] = useState('create'); // 'create'|'edit'|'componente'
  const [editEquipoItem, setEditEquipoItem] = useState({});
  const [equipoParentNode, setEquipoParentNode] = useState(null); // nodo línea o máquina padre
  const [confirmEquipoOpen, setConfirmEquipoOpen] = useState(false);
  const [deleteEquipoTarget, setDeleteEquipoTarget] = useState(null);

  // Estado para seleccionar la línea donde añadir equipo nuevo
  const [lineaParaEquipo, setLineaParaEquipo] = useState('');

  // ─── Carga inicial ──────────────────────────────────────────────────────────
  const loadAllData = useCallback(async () => {
    setLoading(true);
    const [resOts, resAct, resRep, resPrev, resSens, resOps] = await Promise.all([
      fetchOrdenesTrabajo(),
      fetchActivosMantenimientoEditable(),
      fetchRepuestos(),
      fetchPlanesPreventivos(),
      fetchSensoresPredictivos(),
      fetchOperarios()
    ]);
    const activosData = resAct.data || [];
    setOts(resOts.data || []);
    setActivos(activosData);
    setRepuestos(resRep.data || []);
    setPreventivos(resPrev.data || []);
    setSensores(resSens.data || []);
    setEquiposPlanos(getEquiposPlanos(activosData));
    setOperariosList(resOps.data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAllData();
    const handler = () => loadAllData();
    window.addEventListener('mantenimiento_updated', handler);
    window.addEventListener('lineas_updated', handler);
    window.addEventListener('operarios_updated', handler);
    return () => {
      window.removeEventListener('mantenimiento_updated', handler);
      window.removeEventListener('lineas_updated', handler);
      window.removeEventListener('operarios_updated', handler);
    };
  }, [loadAllData]);

  // Selector dinámico de Técnico capacitado para OTs
  const otFieldsDynamic = React.useMemo(() => {
    const targetLinea = (formOtData?.linea || editOtItem?.linea || '').replace(/ínea\s*/i, 'L').trim();
    const targetActivo = (formOtData?.activoNombre || editOtItem?.activoNombre || '').toLowerCase();

    const cualificados = operariosList.filter(op => {
      if (op.estado !== 'activo') return false;
      const enLineaActual = op.lineaActualId && (op.lineaActualId === targetLinea || targetLinea.includes(op.lineaActualId));
      const enLineasAsignadas = Array.isArray(op.lineas) && op.lineas.some(l => l === targetLinea || targetLinea.includes(l));
      const enPermisos = Array.isArray(op.permisos) && op.permisos.some(p => {
        const eq = (p.equipoId || '').toLowerCase();
        return eq && (targetActivo.includes(eq) || eq === targetLinea.toLowerCase());
      });
      const esMtoOrElectro = ['electromecánico', 'mantenimiento', 'mecánico', 'eléctrico'].some(r => (op.rol || '').toLowerCase().includes(r));
      return enLineaActual || enLineasAsignadas || enPermisos || esMtoOrElectro;
    });

    const otros = operariosList.filter(op => op.estado === 'activo' && !cualificados.some(c => c.id === op.id));

    const options = [];
    if (cualificados.length > 0) {
      cualificados.forEach(op => {
        options.push({ value: op.nombre, label: `⭐ ${op.nombre} (${op.rol}) — [Cualificado/Recomendado]` });
      });
    }
    if (otros.length > 0) {
      otros.forEach(op => {
        options.push({ value: op.nombre, label: `${op.nombre} (${op.rol})` });
      });
    }

    // Compatibilidad hacia atrás: si la OT actual tiene un técnico como texto libre que no esté en el catálogo
    if (editOtItem?.tecnico && !operariosList.some(op => op.nombre === editOtItem.tecnico || op.id === editOtItem.tecnico)) {
      options.unshift({ value: editOtItem.tecnico, label: `📌 ${editOtItem.tecnico} (Asignación previa / Texto libre)` });
    }

    return OT_FIELDS.map(f => {
      if (f.key === 'tecnico') {
        return {
          ...f,
          type: 'select',
          placeholder: 'Seleccionar técnico del catálogo...',
          options
        };
      }
      return f;
    });
  }, [operariosList, editOtItem, formOtData]);

  // Campo repuestos con equipos dinámicos
  const REPUESTO_FIELDS_DYNAMIC = [
    { key: 'codigo', label: 'Código de Repuesto', type: 'text', required: true, placeholder: 'ej: REP-SKF-6205' },
    { key: 'nombre', label: 'Nombre y Descripción Técnica', type: 'text', required: true, placeholder: 'ej: Rodamiento SKF 6205-2RS C3' },
    { key: 'categoria', label: 'Categoría Técnica', type: 'select', required: true, options: ['Rodamientos y Mecánica', 'Neumática y Válvulas', 'Filtros y Lubricación', 'Utillajes y Pick&Place', 'Sensores y Electricidad'] },
    { key: 'stockActual', label: 'Stock Actual (uds)', type: 'number', min: 0, required: true, default: 1 },
    { key: 'stockMinimo', label: 'Stock Mínimo de Seguridad (uds)', type: 'number', min: 1, required: true, default: 3 },
    { key: 'ubicacion', label: 'Ubicación en Almacén', type: 'text', required: true, placeholder: 'ej: Estantería B-04-2' },
    { key: 'costeUnitario', label: 'Coste Unitario (€)', type: 'number', min: 0, required: true, default: 45 },
    {
      key: 'compatiblesCon',
      label: 'Equipos / Activos Compatibles',
      type: equiposPlanos.length > 0 ? 'multi-select' : 'tag-list',
      options: equiposPlanos.map(e => ({ value: e.label, label: e.label })),
      placeholder: 'Añadir equipo compatible...'
    },
  ];

  // ─── Handlers OTs ──────────────────────────────────────────────────────────
  const openCreateOt = () => {
    setEditOtItem({ tipo: 'correctivo', prioridad: 'alta', estado: 'abierta', linea: 'Línea 1', tiempoEst: 60, tiempoReal: 0, costeTotal: 100, turno: 'Turno Mañana' });
    setFormOtData(null);
    setOtModalMode('create');
    setOtModalOpen(true);
  };
  const openEditOt = (item) => { setEditOtItem(item); setFormOtData(null); setOtModalMode('edit'); setOtModalOpen(true); };
  const openDeleteOt = (item) => { setDeleteOtTarget(item); setConfirmOtOpen(true); };

  const handleSaveOt = async (data) => {
    setSaving(true);
    const otSave = { ...data, tiempoEst: Number(data.tiempoEst) || 60, tiempoReal: Number(data.tiempoReal) || 0, costeTotal: Number(data.costeTotal) || 0 };

    // Si se asigna una parada, verificar que no esté ya cerrada si es nueva vinculación
    if (otSave.paradaId && (otModalMode === 'create' || otSave.paradaId !== editOtItem?.paradaId)) {
      const { data: paradasActuales = [] } = await fetchParadas();
      const pCheck = paradasActuales.find(p => String(p.id) === String(otSave.paradaId));
      if (pCheck && pCheck.estado === 'cerrada') {
        alert(`⚠️ No se puede asignar o vincular esta Orden de Trabajo a la parada #${otSave.paradaId} porque dicha parada ya está cerrada.`);
        setSaving(false);
        return;
      }
    }

    let finalOtId = editOtItem?.id;
    if (otModalMode === 'create') {
      const { data: newOt } = await insertOrdenTrabajo(otSave);
      if (newOt) {
        setOts(prev => [newOt, ...prev]);
        finalOtId = newOt.id;
      }
    } else {
      const { data: updOt } = await updateOrdenTrabajo(editOtItem.id, otSave);
      if (updOt) setOts(prev => prev.map(o => o.id === editOtItem.id ? updOt : o));
    }

    // Si Mantenimiento cierra o completa la OT y tiene una parada vinculada, resolver también la parada
    if ((otSave.estado === 'completada' || otSave.estado === 'cerrada') && otSave.paradaId) {
      const { data: paradasActuales = [] } = await fetchParadas();
      const paradaVinculada = paradasActuales.find(p => String(p.id) === String(otSave.paradaId));
      if (paradaVinculada && paradaVinculada.estado !== 'cerrada') {
        const horaFin = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        await updateParada(paradaVinculada.id, { ...paradaVinculada, estado: 'cerrada', fin: horaFin });
        window.dispatchEvent(new CustomEvent('paradas_updated'));
        window.dispatchEvent(new CustomEvent('lineas_updated'));
      }
    }

    // Registrar en historial del operario si pertenece al catálogo activo
    if (data.tecnico) {
      const opAsignado = operariosList.find(o => o.nombre === data.tecnico || o.id === data.tecnico || data.tecnico.includes(o.nombre));
      if (opAsignado) {
        await registrarHistorialOperario(opAsignado.id, {
          tipo: 'asignacion_ot',
          descripcion: `Asignación a OT #${finalOtId || 'NUEVA'} (${data.tipo ? data.tipo.toUpperCase() : 'MTO'}): ${data.titulo || data.activoNombre || 'Intervención técnica en ' + data.linea}`,
          linea: data.linea || 'L1',
          piezas: 0
        });
      }
    }

    window.dispatchEvent(new CustomEvent('mantenimiento_updated'));
    setSaving(false);
    setOtModalOpen(false);
    setFormOtData(null);
  };

  const handleDeleteOt = async () => {
    if (!deleteOtTarget) return;
    setDeleting(true);
    await deleteOrdenTrabajo(deleteOtTarget.id);
    setOts(prev => prev.filter(o => o.id !== deleteOtTarget.id));
    window.dispatchEvent(new CustomEvent('mantenimiento_updated'));
    setDeleting(false);
    setConfirmOtOpen(false);
    setDeleteOtTarget(null);
  };

  // ─── Handlers Repuestos ────────────────────────────────────────────────────
  const openCreateRep = () => {
    setEditRepItem({ stockActual: 1, stockMinimo: 3, costeUnitario: 45, categoria: 'Rodamientos y Mecánica', compatiblesCon: [] });
    setRepModalMode('create');
    setRepModalOpen(true);
  };
  const openEditRep = (item) => { setEditRepItem({ ...item, compatiblesCon: item.compatiblesCon || [] }); setRepModalMode('edit'); setRepModalOpen(true); };
  const openDeleteRep = (item) => { setDeleteRepTarget(item); setConfirmRepOpen(true); };

  const handleSaveRep = async (data) => {
    setSaving(true);
    const repSave = {
      ...data,
      stockActual: Number(data.stockActual) || 0,
      stockMinimo: Number(data.stockMinimo) || 1,
      costeUnitario: Number(data.costeUnitario) || 0,
      compatiblesCon: Array.isArray(data.compatiblesCon) ? data.compatiblesCon : [],
      estadoStock: Number(data.stockActual) < Number(data.stockMinimo) ? 'critico' : 'normal'
    };
    if (repModalMode === 'create') {
      const { data: newRep } = await insertRepuesto(repSave);
      if (newRep) setRepuestos(prev => [...prev, newRep]);
    } else {
      const { data: updRep } = await updateRepuesto(editRepItem.id, repSave);
      if (updRep) setRepuestos(prev => prev.map(r => r.id === editRepItem.id ? updRep : r));
    }
    setSaving(false);
    setRepModalOpen(false);
  };

  const handleDeleteRep = async () => {
    if (!deleteRepTarget) return;
    setDeleting(true);
    await deleteRepuesto(deleteRepTarget.id);
    setRepuestos(prev => prev.filter(r => r.id !== deleteRepTarget.id));
    setDeleting(false);
    setConfirmRepOpen(false);
    setDeleteRepTarget(null);
  };

  // ─── Handlers Planes Preventivos ──────────────────────────────────────────
  const openCreatePlan = () => {
    setEditPlanItem({ estado: 'al dia', tipoDisparador: 'horas', contadorActual: 0, umbralDisparo: 500, linea: 'Línea 1', checklist: [] });
    setPlanModalMode('create');
    setPlanModalOpen(true);
  };
  const openEditPlan = (item) => { setEditPlanItem(item); setPlanModalMode('edit'); setPlanModalOpen(true); };
  const openDeletePlan = (item) => { setDeletePlanTarget(item); setConfirmPlanOpen(true); };

  const handleSavePlan = async (data) => {
    setSaving(true);
    const planSave = { ...data, contadorActual: Number(data.contadorActual) || 0, umbralDisparo: Number(data.umbralDisparo) || 500 };
    if (planModalMode === 'create') {
      const { data: newPlan } = await insertPlanPreventivo({ ...planSave, checklist: [] });
      if (newPlan) setPreventivos(prev => [...prev, newPlan]);
    } else {
      const { data: updPlan } = await updatePlanPreventivo(editPlanItem.id, planSave);
      if (updPlan) setPreventivos(prev => prev.map(p => p.id === editPlanItem.id ? updPlan : p));
    }
    setSaving(false);
    setPlanModalOpen(false);
  };

  const handleDeletePlan = async () => {
    if (!deletePlanTarget) return;
    setDeleting(true);
    await deletePlanPreventivo(deletePlanTarget.id);
    setPreventivos(prev => prev.filter(p => p.id !== deletePlanTarget.id));
    setDeleting(false);
    setConfirmPlanOpen(false);
    setDeletePlanTarget(null);
  };

  // Checklist handlers
  const toggleTareaPreventivo = async (planId, index) => {
    const plan = preventivos.find(p => p.id === planId);
    if (!plan) return;
    const updateChecklist = plan.checklist.map((c, i) => i === index ? { ...c, completado: !c.completado } : c);
    const updatedPlan = { ...plan, checklist: updateChecklist };
    await updatePlanPreventivo(planId, updatedPlan);
    setPreventivos(prev => prev.map(p => p.id === planId ? updatedPlan : p));
  };

  const handleAddChecklistItem = async (planId, tarea) => {
    const { data: updatedPlan } = await addChecklistItem(planId, tarea);
    if (updatedPlan) setPreventivos(prev => prev.map(p => p.id === planId ? updatedPlan : p));
  };

  const handleUpdateChecklistItem = async (planId, index, tarea) => {
    const { data: updatedPlan } = await updateChecklistItem(planId, index, tarea);
    if (updatedPlan) setPreventivos(prev => prev.map(p => p.id === planId ? updatedPlan : p));
  };

  const handleRemoveChecklistItem = async (planId, index) => {
    const { data: updatedPlan } = await removeChecklistItem(planId, index);
    if (updatedPlan) setPreventivos(prev => prev.map(p => p.id === planId ? updatedPlan : p));
  };

  // ─── Handlers Sensores Predictivos ────────────────────────────────────────
  const openCreateSensor = () => {
    setEditSensorItem({ estado: 'normal', linea: 'Línea 1', valorActual: 0, umbralAlerta: 0, umbralCritico: 0, vidaUtilRestantePct: 100 });
    setSensorModalMode('create');
    setSensorModalOpen(true);
  };
  const openEditSensor = (item) => { setEditSensorItem(item); setSensorModalMode('edit'); setSensorModalOpen(true); };
  const openDeleteSensor = (item) => { setDeleteSensorTarget(item); setConfirmSensorOpen(true); };

  const handleSaveSensor = async (data) => {
    setSaving(true);
    const sens = {
      ...data,
      valorActual: Number(data.valorActual) || 0,
      umbralAlerta: Number(data.umbralAlerta) || 0,
      umbralCritico: Number(data.umbralCritico) || 0,
      vidaUtilRestantePct: Number(data.vidaUtilRestantePct) || 0
    };
    if (sensorModalMode === 'create') {
      const { data: newSens } = await insertSensorPredictivo(sens);
      if (newSens) setSensores(prev => [...prev, newSens]);
    } else {
      const { data: updSens } = await updateSensorPredictivo(editSensorItem.id, sens);
      if (updSens) setSensores(prev => prev.map(s => s.id === editSensorItem.id ? updSens : s));
    }
    setSaving(false);
    setSensorModalOpen(false);
  };

  const handleDeleteSensor = async () => {
    if (!deleteSensorTarget) return;
    setDeleting(true);
    await deleteSensorPredictivo(deleteSensorTarget.id);
    setSensores(prev => prev.filter(s => s.id !== deleteSensorTarget.id));
    setDeleting(false);
    setConfirmSensorOpen(false);
    setDeleteSensorTarget(null);
  };

  // ─── Handlers Equipos / Árbol ──────────────────────────────────────────────
  const openAddEquipo = () => {
    // Obtener lista de líneas disponibles en el árbol
    const lineasEnArbol = activos.flatMap(n => n.hijos || []).filter(n => n.tipo === 'linea');
    setEquipoParentNode(lineasEnArbol[0] || null);
    setEditEquipoItem({ criticidad: 'media', horasFuncionamiento: 0, intervenciones: 0 });
    setEquipoModalMode('create');
    setEquipoModalOpen(true);
  };

  const openAddComponente = (maquinaNodo) => {
    setEquipoParentNode(maquinaNodo);
    setEditEquipoItem({ criticidad: 'media', horasFuncionamiento: 0, intervenciones: 0 });
    setEquipoModalMode('componente');
    setEquipoModalOpen(true);
  };

  const openEditEquipo = (nodo) => {
    setEditEquipoItem(nodo);
    setEquipoModalMode('edit');
    setEquipoModalOpen(true);
  };

  const openDeleteEquipo = (nodo) => {
    setDeleteEquipoTarget(nodo);
    setConfirmEquipoOpen(true);
  };

  // Lista de líneas del árbol para el selector del modal
  const lineasEnArbol = activos.flatMap(n => n.hijos || []).filter(n => n.tipo === 'linea');

  const handleSaveEquipo = async (data) => {
    setSaving(true);
    if (equipoModalMode === 'create') {
      // Añadir nueva máquina a la línea seleccionada
      const lineaId = lineaParaEquipo || (lineasEnArbol[0]?.id);
      if (lineaId) {
        const { data: newEq } = await insertEquipoEnLinea(lineaId, data);
        if (newEq) await loadAllData(); // recarga el árbol completo
      }
    } else if (equipoModalMode === 'componente') {
      // Añadir componente a la máquina padre
      const { data: newComp } = await insertComponenteEnEquipo(equipoParentNode.id, data);
      if (newComp) await loadAllData();
    } else {
      // Editar equipo existente
      await updateEquipoEnArbol(editEquipoItem.id, data);
      await loadAllData();
    }
    setSaving(false);
    setEquipoModalOpen(false);
  };

  const handleDeleteEquipo = async () => {
    if (!deleteEquipoTarget) return;
    setDeleting(true);
    await deleteEquipoEnArbol(deleteEquipoTarget.id);
    await loadAllData();
    setDeleting(false);
    setConfirmEquipoOpen(false);
    setDeleteEquipoTarget(null);
  };

  // ─── Filtrado OTs ──────────────────────────────────────────────────────────
  const otsFiltradas = ots.filter(o => {
    if (filtroLineaOt !== 'Todas' && o.linea !== filtroLineaOt) return false;
    if (filtroEstadoOt !== 'todas' && o.estado !== filtroEstadoOt) return false;
    if (filtroTipoOt !== 'todos' && o.tipo !== filtroTipoOt) return false;
    if (busquedaOt.trim()) {
      const q = busquedaOt.toLowerCase();
      return (o.codigo || '').toLowerCase().includes(q) || (o.titulo || '').toLowerCase().includes(q) || (o.activoNombre || '').toLowerCase().includes(q);
    }
    return true;
  });

  // Campos dinámicos de equipo según modo
  const equipoFieldsForMode = equipoModalMode === 'componente' ? COMPONENTE_FIELDS : EQUIPO_FIELDS;

  return (
    <div className="space-y-6 max-w-[1550px] mx-auto">
      {/* Cabecera principal */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-black uppercase tracking-wider">
              GMAO / MES
            </span>
            <span className="text-xs text-slate-500 font-mono">Disponibilidad Planta: {mockKpis.disponibilidadGlobal}%</span>
          </div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3 mt-1">
            <Wrench className="w-6 h-6 text-amber-400" /> Gestión de Mantenimiento y Activos
          </h2>
          <p className="text-slate-500 text-sm">
            Ciclo de vida de activos, órdenes de trabajo correctivas/preventivas, almacén técnico y OEE
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={loadAllData} disabled={loading}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={openCreateOt}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-all shadow-lg shadow-amber-500/20 active:scale-95">
            <Plus className="w-4 h-4" /> + Crear Orden de Trabajo (OT)
          </button>
        </div>
      </motion.div>

      {/* Menú de Pestañas */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800/80 scrollbar-none">
        {TAB_OPTIONS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.id === 'ots' && <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${isActive ? 'bg-slate-950/30 text-slate-950' : 'bg-slate-800 text-amber-400'}`}>{ots.filter(o => o.estado === 'abierta' || o.estado === 'en curso').length}</span>}
              {tab.id === 'repuestos' && repuestos.some(r => r.stockActual < r.stockMinimo) && (
                <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" title="Repuestos bajo stock mínimo" />
              )}
            </button>
          );
        })}

        {['ots', 'preventivo', 'predictivo', 'repuestos'].includes(activeTab) && (
          <div className="ml-auto flex bg-slate-900 border border-slate-800 rounded-xl p-1 shrink-0 self-center">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-white'}`}
              title="Vista en Fichas"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-white'}`}
              title="Vista en Listado / Tabla"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Contenido dinámico */}
      <AnimatePresence mode="wait">

        {/* ══════════════ 1. RESUMEN ══════════════ */}
        {activeTab === 'resumen' && (
          <motion.div key="resumen" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-2"><span>Disponibilidad Global</span><ShieldCheck className="w-4 h-4 text-emerald-400" /></div>
                <div className="text-2xl font-black text-white">{mockKpis.disponibilidadGlobal}%</div>
                <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1 font-bold"><ArrowUpRight className="w-3 h-3" /> +1.2% vs objetivo (93%)</div>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-2"><span>MTBF (Media entre fallos)</span><Clock className="w-4 h-4 text-blue-400" /></div>
                <div className="text-2xl font-black text-white">{mockKpis.mtbf} <span className="text-xs font-normal text-slate-400">h</span></div>
                <div className="text-[10px] text-blue-400 mt-1 font-bold">Fiabilidad alta</div>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-2"><span>MTTR (Media reparación)</span><Wrench className="w-4 h-4 text-amber-400" /></div>
                <div className="text-2xl font-black text-white">{mockKpis.mttr} <span className="text-xs font-normal text-slate-400">min</span></div>
                <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1 font-bold"><ArrowDownRight className="w-3 h-3" /> -3.5 min vs mes anterior</div>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-2"><span>Preventivo vs Correctivo</span><Activity className="w-4 h-4 text-purple-400" /></div>
                <div className="text-2xl font-black text-white">{mockKpis.pctPreventivo}%</div>
                <div className="text-[10px] text-slate-400 mt-1">vs {mockKpis.pctCorrectivo}% correctivo</div>
              </div>
              <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-4 relative overflow-hidden">
                <div className="flex items-center justify-between text-red-400 text-xs font-bold mb-2"><span>OTs Abiertas / Críticas</span><AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" /></div>
                <div className="text-2xl font-black text-white">{ots.filter(o => o.estado !== 'cerrada').length} <span className="text-sm text-red-400">({ots.filter(o => o.prioridad === 'critica' && o.estado !== 'cerrada').length} críticas)</span></div>
                <div className="text-[10px] text-red-400 mt-1 font-bold">Requieren atención inminente</div>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-2"><span>Coste Acumulado Mes</span><DollarSign className="w-4 h-4 text-indigo-400" /></div>
                <div className="text-2xl font-black text-white">{mockKpis.costeAcumuladoMes.toLocaleString()} <span className="text-xs font-normal text-slate-400">€</span></div>
                <div className="text-[10px] text-slate-400 mt-1">Presupuesto mensual: 18.000 €</div>
              </div>
            </div>

            <div className="card p-5 border border-amber-500/40 bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-950 flex items-start gap-4 shadow-xl">
              <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex-shrink-0"><Sparkles className="w-6 h-6" /></div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-black text-white">{mensajeClaveMantenimiento.titulo}</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">Síntesis Automática</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">{mensajeClaveMantenimiento.contenido}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="card p-5 border border-slate-800 bg-slate-950">
                <h3 className="section-title text-white font-black mb-4">Evolución de Disponibilidad por Línea (%)</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={evolucionDisponibilidadLinea}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="hora" stroke="#64748b" fontSize={11} />
                    <YAxis domain={[80, 100]} stroke="#64748b" fontSize={11} />
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12, fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" name="Línea 1" dataKey="L1" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} />
                    <Line type="monotone" name="Línea 2" dataKey="L2" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" name="Línea 3 (Crítica)" dataKey="L3" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} />
                    <Line type="monotone" name="Línea 4" dataKey="L4" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" name="Línea 5" dataKey="L5" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="card p-5 border border-slate-800 bg-slate-950">
                <h3 className="section-title text-white font-black mb-4">Horas de Parada por Causa Técnica Acumuladas</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={horasParadaPorCausaTecnica} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis type="number" stroke="#64748b" fontSize={11} />
                    <YAxis dataKey="causa" type="category" stroke="#94a3b8" fontSize={11} width={170} />
                    <Tooltip formatter={(val) => [`${val} horas perdidas`, '']} contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12, fontSize: 11 }} />
                    <Bar dataKey="horas" radius={[0, 8, 8, 0]}>
                      {horasParadaPorCausaTecnica.map((item, index) => (
                        <Cell key={`cell-${index}`} fill={item.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="card overflow-hidden border border-slate-800 bg-slate-950">
                <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
                  <h3 className="section-title mb-0 text-white font-black">% Disponibilidad y Estado por Línea</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/60">
                        {['Línea', 'Objetivo', 'Real', 'Desviación', 'Estado y Alertas'].map(h => (
                          <th key={h} className="table-header text-left py-3 px-4">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tablaDisponibilidadLineas.map(row => (
                        <tr key={row.linea} className="border-b border-slate-800/50 hover:bg-slate-900/70 transition-colors">
                          <td className="table-cell font-black text-white px-4 py-3">{row.linea}</td>
                          <td className="table-cell font-mono text-slate-400 px-4">{row.objetivo}%</td>
                          <td className="table-cell font-mono font-black text-white px-4">{row.real}%</td>
                          <td className={`table-cell font-mono font-bold px-4 ${row.desviacion.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>{row.desviacion}</td>
                          <td className="table-cell px-4">
                            <div className="flex items-center gap-2">
                              {row.tendencia === 'up' ? <ArrowUpRight className="w-4 h-4 text-emerald-400" /> : <ArrowDownRight className="w-4 h-4 text-red-400" />}
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                row.estado === 'bien' ? 'bg-emerald-500/20 text-emerald-400' :
                                row.estado === 'alerta' ? 'bg-amber-500/20 text-amber-400' :
                                'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
                              }`}>
                                {row.alerta || (row.estado === 'bien' ? 'ÓPTIMO' : row.estado.toUpperCase())}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="card p-5 border border-slate-800 bg-slate-950">
                <h3 className="section-title text-white font-black mb-4">Top 5 Activos y Componentes con Más Averías</h3>
                <div className="space-y-3">
                  {topCausasAveria.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 transition-all">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-red-500/10 text-red-400 font-black text-xs flex items-center justify-center border border-red-500/20">#{index + 1}</span>
                        <div>
                          <p className="text-xs font-black text-white">{item.componente}</p>
                          <p className="text-[11px] text-slate-400 font-bold mt-0.5">Criticidad: <span className="uppercase text-red-400 font-black">{item.criticidad}</span></p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-amber-400">{item.horasPerdidas} horas pérdidas</p>
                        <p className="text-[11px] text-slate-500">{item.ots} OTs registradas</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ══════════════ 2. ACTIVOS ══════════════ */}
        {activeTab === 'activos' && (
          <motion.div key="activos" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            <div className="card p-5 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-400" /> Jerarquía y Árbol de Activos de la Planta
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Haz clic en cada nivel para expandir su estructura. Usa los botones de acción para gestionar equipos y componentes.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-3 text-xs font-bold text-slate-400">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-400" /> Alta criticidad</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Media</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Baja</span>
                </div>
                <button
                  onClick={openAddEquipo}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 border border-indigo-500/30 text-xs font-black transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> + Nuevo Equipo
                </button>
              </div>
            </div>

            {/* Selector de línea para nuevo equipo (solo cuando modal abierto) */}
            {equipoModalMode === 'create' && equipoModalOpen && (
              <div className="px-1">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Añadir a Línea:</label>
                <select
                  value={lineaParaEquipo || (lineasEnArbol[0]?.id || '')}
                  onChange={e => setLineaParaEquipo(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  {lineasEnArbol.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                </select>
              </div>
            )}

            <div className="card p-5 border border-slate-800 bg-slate-950">
              {activos.map(nodo => (
                <NodoActivo
                  key={nodo.id}
                  nodo={nodo}
                  nivel={0}
                  onEditEquipo={openEditEquipo}
                  onDeleteEquipo={openDeleteEquipo}
                  onAddComponente={openAddComponente}
                />
              ))}
              {activos.length === 0 && (
                <div className="text-center py-12">
                  <Factory className="w-10 h-10 text-slate-600 mx-auto mb-3 opacity-50" />
                  <p className="text-slate-400 font-bold">No hay activos registrados</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ══════════════ 3. ÓRDENES DE TRABAJO ══════════════ */}
        {activeTab === 'ots' && (
          <motion.div key="ots" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/70 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 text-amber-400" /> Filtros:
                </span>
                <select value={filtroLineaOt} onChange={e => setFiltroLineaOt(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-bold">
                  <option value="Todas">Todas las Líneas</option>
                  {['Línea 1', 'Línea 2', 'Línea 3', 'Línea 4', 'Línea 5'].map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <select value={filtroEstadoOt} onChange={e => setFiltroEstadoOt(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-bold">
                  <option value="todas">Todos los Estados</option>
                  <option value="abierta">Abiertas</option>
                  <option value="en curso">En Curso</option>
                  <option value="pendiente repuesto">Pendiente Repuesto</option>
                  <option value="cerrada">Cerradas</option>
                </select>
                <select value={filtroTipoOt} onChange={e => setFiltroTipoOt(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-bold">
                  <option value="todos">Todos los Tipos</option>
                  <option value="correctivo">🔴 Correctivo</option>
                  <option value="preventivo">🟠 Preventivo</option>
                  <option value="predictivo">🔵 Predictivo</option>
                </select>
              </div>
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Buscar OT por código, activo o título..." value={busquedaOt} onChange={e => setBusquedaOt(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500" />
              </div>
            </div>

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 gap-4">
                {otsFiltradas.map(ot => (
                  <motion.div key={ot.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className={`card p-5 border transition-all ${ot.prioridad === 'critica' && ot.estado !== 'cerrada' ? 'border-red-500/40 bg-red-500/5' : 'border-slate-800 bg-slate-950 hover:border-slate-700'}`}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs font-black text-slate-200">{ot.codigo}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${TIPO_OT_COLORS[ot.tipo] || 'bg-slate-800 text-slate-300'}`}>{ot.tipo}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${ESTADO_OT_COLORS[ot.estado] || 'bg-slate-800 text-slate-300'}`}>{ot.estado}</span>
                          <span className="text-xs font-black text-amber-400 ml-1">{ot.linea}</span>
                          {ot.paradaId && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-black">
                              <Link2 className="w-3 h-3" /> Vínculo Parada #{ot.paradaId}
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-black text-white">{ot.titulo}</h3>
                        <p className="text-xs font-bold text-slate-400 flex items-center gap-2">
                          <Cpu className="w-3.5 h-3.5 text-slate-500" /> Activo: <span className="text-slate-200">{ot.activoNombre}</span>
                        </p>
                        {ot.causaRaiz && <p className="text-xs text-slate-400 italic">💡 Causa Raíz: {ot.causaRaiz}</p>}
                      </div>

                      <div className="flex flex-col md:items-end justify-between gap-3 text-xs bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 md:min-w-[280px]">
                        <div className="space-y-1 w-full">
                          <div className="flex justify-between"><span className="text-slate-500">Técnico:</span><span className="font-bold text-slate-200">{ot.tecnico}</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">Apertura:</span><span className="font-mono text-slate-300">{ot.fechaApertura}</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">Tiempo / Coste:</span><span className="font-bold text-amber-400">{ot.tiempoReal || ot.tiempoEst} min · {ot.costeTotal} €</span></div>
                        </div>
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-800 w-full justify-end">
                          <button onClick={() => openEditOt(ot)} className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-all flex items-center gap-1">
                            <Pencil className="w-3 h-3" /> Editar OT
                          </button>
                          <button onClick={() => openDeleteOt(ot)} className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {otsFiltradas.length === 0 && (
                  <div className="card p-12 text-center border-dashed border-slate-800">
                    <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3 opacity-50" />
                    <p className="text-slate-400 font-bold">No hay órdenes de trabajo que coincidan con los filtros seleccionados</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-950/80 text-slate-400 text-xs font-black uppercase border-b border-slate-800 tracking-wider">
                        <th className="py-3.5 px-4">Código</th>
                        <th className="py-3.5 px-4">Título / Descripción</th>
                        <th className="py-3.5 px-4">Línea & Activo</th>
                        <th className="py-3.5 px-4">Tipo</th>
                        <th className="py-3.5 px-4">Prioridad</th>
                        <th className="py-3.5 px-4">Estado</th>
                        <th className="py-3.5 px-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-xs font-bold text-slate-200">
                      {otsFiltradas.map(ot => (
                        <tr key={ot.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 font-mono text-amber-400 font-black">{ot.codigo}</td>
                          <td className="py-3 px-4">
                            <p className="font-black text-white">{ot.titulo}</p>
                            <p className="text-[10px] text-slate-400 font-normal mt-0.5">Técnico: {ot.tecnico || 'Sin asignar'} · Límite: {ot.fechaLimite || '—'}</p>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-amber-400 font-black">{ot.linea}</span>
                            <p className="text-[11px] text-slate-300 font-semibold truncate max-w-[180px]">{ot.activoNombre}</p>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${TIPO_OT_COLORS[ot.tipo] || 'bg-slate-800 text-slate-300'}`}>{ot.tipo}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${ot.prioridad === 'critica' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : ot.prioridad === 'alta' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400 font-normal'}`}>{ot.prioridad}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${ESTADO_OT_COLORS[ot.estado] || 'bg-slate-800 text-slate-300'}`}>{ot.estado}</span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button onClick={() => openEditOt(ot)} className="p-1.5 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white transition-all" title="Modificar">
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button onClick={() => openDeleteOt(ot)} className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-500/30 text-slate-400 hover:text-rose-300 transition-all" title="Eliminar">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {otsFiltradas.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-500 font-bold">
                            No hay órdenes de trabajo que coincidan con los filtros seleccionados
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ══════════════ 4. PLAN PREVENTIVO ══════════════ */}
        {activeTab === 'preventivo' && (
          <motion.div key="preventivo" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            <div className="card p-5 bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-950 border border-amber-500/30 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-400" /> Planes de Mantenimiento Preventivo Programado
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Disparadores basados en calendario o contadores de horas/ciclos. Edita los checklists directamente en cada tarjeta.
                </p>
              </div>
              <button
                onClick={openCreatePlan}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 text-xs font-black transition-all flex-shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> + Nuevo Plan
              </button>
            </div>

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {preventivos.map(plan => (
                  <motion.div key={plan.id} className="card p-5 border border-slate-800 bg-slate-950 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="font-mono text-xs font-black text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                          {plan.codigo}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            plan.estado === 'vencido' ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse' :
                            plan.estado === 'proximo' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                            'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}>
                            {plan.estado === 'vencido' ? 'VENCIDO' : plan.estado === 'proximo' ? 'PRÓXIMO' : 'AL DÍA'}
                          </span>
                          <button onClick={() => openEditPlan(plan)} className="p-1.5 rounded-lg bg-slate-800 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 border border-slate-700 transition-all" title="Editar plan">
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button onClick={() => openDeletePlan(plan)} className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700 transition-all" title="Eliminar plan">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <h4 className="text-base font-black text-white mb-1">{plan.titulo}</h4>
                      <p className="text-xs font-bold text-slate-400 mb-3">{plan.activoNombre} · <span className="text-amber-400">{plan.linea}</span></p>

                      <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-800/80 grid grid-cols-2 gap-2 text-xs mb-4">
                        <div>
                          <span className="text-[10px] text-slate-500 block font-bold uppercase">Frecuencia / Disparador</span>
                          <span className="font-black text-slate-200">{plan.frecuencia} ({plan.tipoDisparador})</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block font-bold uppercase">Próxima / Umbral</span>
                          <span className="font-black text-white">{plan.proximaIntervencion} ({plan.contadorActual} / {plan.umbralDisparo} {plan.tipoDisparador === 'horas' ? 'h' : 'd'})</span>
                        </div>
                      </div>

                      {/* Checklist editable inline */}
                      <ChecklistEditor
                        plan={plan}
                        onToggle={toggleTareaPreventivo}
                        onAddItem={handleAddChecklistItem}
                        onUpdateItem={handleUpdateChecklistItem}
                        onRemoveItem={handleRemoveChecklistItem}
                      />
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex justify-end mt-4">
                      <button
                        onClick={async () => {
                          await insertOrdenTrabajo({
                            titulo: `OT Preventiva: ${plan.titulo}`,
                            activoNombre: plan.activoNombre,
                            linea: plan.linea,
                            tipo: 'preventivo',
                            prioridad: 'media',
                            estado: 'abierta',
                            tecnico: 'Técnico Preventivo MTO',
                            turno: 'Turno Mañana',
                            tiempoEst: 90,
                            tiempoReal: 0,
                            costeTotal: 150,
                            causaRaiz: `PREV-CAL (${plan.codigo}) — Generación automática`
                          });
                          window.dispatchEvent(new CustomEvent('mantenimiento_updated'));
                          setActiveTab('ots');
                        }}
                        className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 text-xs font-black transition-all flex items-center gap-2"
                      >
                        <Wrench className="w-3.5 h-3.5" /> Generar OT Preventiva Ahora
                      </button>
                    </div>
                  </motion.div>
                ))}

                {preventivos.length === 0 && (
                  <div className="col-span-2 card p-12 text-center border-dashed border-slate-800">
                    <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-3 opacity-50" />
                    <p className="text-slate-400 font-bold">No hay planes preventivos. Crea el primero con el botón "+" superior.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-950/80 text-slate-400 text-xs font-black uppercase border-b border-slate-800 tracking-wider">
                        <th className="py-3.5 px-4">Código</th>
                        <th className="py-3.5 px-4">Plan Preventivo</th>
                        <th className="py-3.5 px-4">Activo & Línea</th>
                        <th className="py-3.5 px-4">Frecuencia / Disparador</th>
                        <th className="py-3.5 px-4">Próxima / Umbral</th>
                        <th className="py-3.5 px-4 text-center">Checklist</th>
                        <th className="py-3.5 px-4 text-center">Estado</th>
                        <th className="py-3.5 px-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-xs font-bold text-slate-200">
                      {preventivos.map(plan => {
                        const chkTotal = (plan.checklist || []).length;
                        const chkDone = (plan.checklist || []).filter(c => c.completed || c.done).length;
                        return (
                          <tr key={plan.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-3 px-4 font-mono text-amber-400 font-black">{plan.codigo}</td>
                            <td className="py-3 px-4 font-black text-white">{plan.titulo}</td>
                            <td className="py-3 px-4">
                              <span className="text-amber-400 font-black">{plan.linea}</span>
                              <p className="text-[11px] text-slate-300 font-semibold">{plan.activoNombre}</p>
                            </td>
                            <td className="py-3 px-4 text-slate-300">{plan.frecuencia} ({plan.tipoDisparador})</td>
                            <td className="py-3 px-4 font-mono text-amber-400 font-black">{plan.proximaIntervencion} ({plan.contadorActual} / {plan.umbralDisparo})</td>
                            <td className="py-3 px-4 text-center">
                              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-xs">{chkDone}/{chkTotal} items</span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                plan.estado === 'vencido' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                plan.estado === 'proximo' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              }`}>{plan.estado === 'vencido' ? 'VENCIDO' : plan.estado === 'proximo' ? 'PRÓXIMO' : 'AL DÍA'}</span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button onClick={() => openEditPlan(plan)} className="p-1.5 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white transition-all" title="Modificar">
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button onClick={() => openDeletePlan(plan)} className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-500/30 text-slate-400 hover:text-rose-300 transition-all" title="Eliminar">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {preventivos.length === 0 && (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-slate-500 font-bold">
                            No se encontraron planes preventivos con estos filtros
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ══════════════ 5. PREDICTIVO (IoT & CONDICIONAL) ══════════════ */}
        {activeTab === 'predictivo' && (
          <motion.div key="predictivo" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            <div className="card p-5 bg-gradient-to-r from-blue-950/30 via-slate-900 to-slate-950 border border-blue-500/30 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-400" /> Monitoreo IoT & Mantenimiento Predictivo
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Sensores en vivo. Cuando una variable supera el umbral crítico o de alerta, se generan sugerencias automáticas de intervención.
                </p>
              </div>
              <button
                onClick={openCreateSensor}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 text-xs font-black transition-all flex-shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> + Añadir Sensor IoT
              </button>
            </div>

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sensores.map(sens => (
                  <motion.div key={sens.id} className="card p-5 border border-slate-800 bg-slate-950">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-xs font-black text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20">
                        {sens.variable}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          sens.estado === 'critico' ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse' :
                          sens.estado === 'alerta' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                          'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {sens.estado.toUpperCase()}
                        </span>
                        <button onClick={() => openEditSensor(sens)} className="p-1.5 rounded-lg bg-slate-800 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 border border-slate-700 transition-all" title="Editar sensor">
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button onClick={() => openDeleteSensor(sens)} className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700 transition-all" title="Eliminar sensor">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <h4 className="text-base font-black text-white mb-1">{sens.activoNombre}</h4>
                    <p className="text-xs font-bold text-slate-400 mb-4">{sens.linea}</p>

                    <div className="grid grid-cols-3 gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800 mb-4 text-center">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Valor Actual</span>
                        <span className="text-base font-black text-white">{sens.valorActual} <span className="text-xs font-normal text-slate-400">{sens.unidad}</span></span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Umbral Alerta</span>
                        <span className="text-base font-black text-amber-400">{sens.umbralAlerta}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Umbral Crítico</span>
                        <span className="text-base font-black text-red-400">{sens.umbralCritico}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 mb-4">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-400">Vida útil estimada del componente:</span>
                        <span className={sens.vidaUtilRestantePct < 20 ? 'text-red-400 font-black' : 'text-emerald-400 font-black'}>{sens.vidaUtilRestantePct}% restante</span>
                      </div>
                      <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                        <motion.div
                          className={`h-full rounded-full ${sens.vidaUtilRestantePct < 20 ? 'bg-red-500' : sens.vidaUtilRestantePct < 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${sens.vidaUtilRestantePct}%` }}
                        />
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 bg-slate-900/40 p-3 rounded-xl border border-slate-800/60 italic font-medium">
                      💡 <strong className="text-amber-400">Recomendación IA:</strong> {sens.recomendacion}
                    </p>
                  </motion.div>
                ))}

                {sensores.length === 0 && (
                  <div className="col-span-2 card p-12 text-center border-dashed border-slate-800">
                    <Zap className="w-10 h-10 text-slate-600 mx-auto mb-3 opacity-50" />
                    <p className="text-slate-400 font-bold">No hay acciones predictivas configuradas. Usa el botón "+" para añadir la primera.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-950/80 text-slate-400 text-xs font-black uppercase border-b border-slate-800 tracking-wider">
                        <th className="py-3.5 px-4">Variable / Sensor</th>
                        <th className="py-3.5 px-4">Activo & Línea</th>
                        <th className="py-3.5 px-4">Umbrales (Alerta / Crítico)</th>
                        <th className="py-3.5 px-4">Valor Actual</th>
                        <th className="py-3.5 px-4">Vida Útil</th>
                        <th className="py-3.5 px-4">Recomendación IA</th>
                        <th className="py-3.5 px-4 text-center">Estado</th>
                        <th className="py-3.5 px-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-xs font-bold text-slate-200">
                      {sensores.map(sens => (
                        <tr key={sens.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 font-mono text-blue-400 font-black">{sens.variable}</td>
                          <td className="py-3 px-4">
                            <p className="font-black text-white">{sens.activoNombre}</p>
                            <p className="text-[10px] text-slate-400 font-normal">{sens.linea}</p>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-300">
                            <span className="text-amber-400">{sens.umbralAlerta}</span> / <span className="text-red-400">{sens.umbralCritico}</span> {sens.unidad}
                          </td>
                          <td className="py-3 px-4 font-mono font-black text-white">{sens.valorActual} {sens.unidad}</td>
                          <td className="py-3 px-4">
                            <span className={sens.vidaUtilRestantePct < 20 ? 'text-red-400 font-black' : 'text-emerald-400 font-black'}>{sens.vidaUtilRestantePct}%</span>
                          </td>
                          <td className="py-3 px-4 text-slate-300 italic font-normal max-w-xs truncate">{sens.recomendacion}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              sens.estado === 'critico' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                              sens.estado === 'alerta' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                              'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}>{sens.estado.toUpperCase()}</span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button onClick={() => openEditSensor(sens)} className="p-1.5 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white transition-all" title="Modificar">
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button onClick={() => openDeleteSensor(sens)} className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-500/30 text-slate-400 hover:text-rose-300 transition-all" title="Eliminar">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {sensores.length === 0 && (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-slate-500 font-bold">
                            No hay acciones predictivas configuradas.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ══════════════ 6. REPUESTOS ══════════════ */}
        {activeTab === 'repuestos' && (
          <motion.div key="repuestos" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Box className="w-5 h-5 text-amber-400" /> Repuestos Críticos y Control de Stock Mínimo
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Vínculo entre piezas consumidas y órdenes de trabajo. Alertas automáticas por rotura de stock.
                </p>
              </div>
              <button onClick={openCreateRep} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-all">
                <Plus className="w-3.5 h-3.5" /> + Añadir Repuesto al Almacén
              </button>
            </div>

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {repuestos.map(rep => {
                  const isBajoStock = rep.stockActual < rep.stockMinimo;
                  return (
                    <motion.div key={rep.id} className={`card p-5 border flex flex-col justify-between ${isBajoStock ? 'border-red-500/40 bg-red-500/5' : 'border-slate-800 bg-slate-950'}`}>
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="font-mono text-xs font-black text-slate-300 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">{rep.codigo}</span>
                          {isBajoStock ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Bajo Stock Mínimo
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              Stock Óptimo
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm font-black text-white mb-1">{rep.nombre}</h4>
                        <p className="text-xs font-bold text-slate-400 mb-4">{rep.categoria}</p>

                        <div className="grid grid-cols-2 gap-2 bg-slate-900/80 p-3 rounded-xl border border-slate-800 mb-4 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-500 block font-bold uppercase">Stock Actual / Mínimo</span>
                            <span className={`text-base font-black ${isBajoStock ? 'text-red-400' : 'text-white'}`}>{rep.stockActual} <span className="text-xs text-slate-500">/ {rep.stockMinimo} mín</span></span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block font-bold uppercase">Ubicación / Coste</span>
                            <span className="font-black text-amber-400">{rep.ubicacion} · {rep.costeUnitario} €</span>
                          </div>
                        </div>

                        {rep.compatiblesCon && rep.compatiblesCon.length > 0 && (
                          <div className="mb-4">
                            <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Equipos / Activos Compatibles:</span>
                            <div className="flex flex-wrap gap-1">
                              {rep.compatiblesCon.map((c, i) => (
                                <span key={i} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] font-medium text-slate-300">{c}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-end gap-2">
                        <button onClick={() => openEditRep(rep)} className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all flex items-center gap-1">
                          <Pencil className="w-3 h-3" /> Modificar
                        </button>
                        <button onClick={() => openDeleteRep(rep)} className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
                        <th className="py-3.5 px-4">Código SKU</th>
                        <th className="py-3.5 px-4">Repuesto / Pieza</th>
                        <th className="py-3.5 px-4">Categoría</th>
                        <th className="py-3.5 px-4 text-center">Stock Actual</th>
                        <th className="py-3.5 px-4 text-center">Stock Mín.</th>
                        <th className="py-3.5 px-4 text-center">Coste Unit.</th>
                        <th className="py-3.5 px-4">Ubicación</th>
                        <th className="py-3.5 px-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-xs font-bold text-slate-200">
                      {repuestos.map(rep => {
                        const isBajoStock = rep.stockActual < rep.stockMinimo;
                        return (
                          <tr key={rep.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-3 px-4 font-mono text-amber-400 font-black">{rep.codigo}</td>
                            <td className="py-3 px-4 font-black text-white">{rep.nombre}</td>
                            <td className="py-3 px-4 text-slate-300">{rep.categoria}</td>
                            <td className="py-3 px-4 text-center">
                              <span className={`font-mono font-black text-sm ${isBajoStock ? 'text-red-400' : 'text-emerald-400'}`}>{rep.stockActual}</span>
                            </td>
                            <td className="py-3 px-4 text-center font-mono text-slate-300">{rep.stockMinimo}</td>
                            <td className="py-3 px-4 text-center font-mono text-amber-400">{rep.costeUnitario} €</td>
                            <td className="py-3 px-4 font-mono text-slate-300">{rep.ubicacion || 'ALM-A1'}</td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button onClick={() => openEditRep(rep)} className="p-1.5 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white transition-all" title="Modificar">
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button onClick={() => openDeleteRep(rep)} className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-500/30 text-slate-400 hover:text-rose-300 transition-all" title="Eliminar">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {repuestos.length === 0 && (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-slate-500 font-bold">
                            No hay repuestos registrados en el almacén.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ══════════════ 7. INDICADORES (KPI) ══════════════ */}
        {activeTab === 'kpis' && (
          <motion.div key="kpis" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="card p-5 border border-slate-800 bg-slate-950">
                <h3 className="section-title text-white font-black mb-4">Evolución Mensual % Preventivo vs Correctivo</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={kpisEvolucionMensual}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="mes" stroke="#64748b" fontSize={11} />
                    <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} />
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12, fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="preventivoPct" name="% MTO Preventivo" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="correctivoPct" name="% MTO Correctivo" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="card p-5 border border-slate-800 bg-slate-950">
                <h3 className="section-title text-white font-black mb-4">Evolución MTBF (h) y MTTR (min)</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={kpisEvolucionMensual}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="mes" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12, fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" name="MTBF (Horas entre fallos)" dataKey="mtbf" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
                    <Line type="monotone" name="MTTR (Minutos reparación)" dataKey="mttr" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* ══════════════ MODALES ══════════════ */}

      {/* OT */}
      <CrudModal
        isOpen={otModalOpen}
        onClose={() => { setOtModalOpen(false); setFormOtData(null); }}
        onSave={handleSaveOt}
        onFormChange={setFormOtData}
        title={otModalMode === 'create' ? 'Crear Nueva Orden de Trabajo (OT)' : 'Modificar Orden de Trabajo'}
        fields={otFieldsDynamic}
        initialData={editOtItem}
        saving={saving}
      >
        {(() => {
          const techName = formOtData?.tecnico || editOtItem?.tecnico;
          if (!techName) return null;
          const opSelected = operariosList.find(o => o.nombre === techName || o.id === techName);
          if (!opSelected) return null; // Texto libre previo / no catalogado

          const targetLinea = (formOtData?.linea || editOtItem?.linea || '').replace(/ínea\s*/i, 'L').trim();
          const targetActivo = (formOtData?.activoNombre || editOtItem?.activoNombre || '').toLowerCase();
          const esCualificado = (opSelected.lineaActualId && (opSelected.lineaActualId === targetLinea || targetLinea.includes(opSelected.lineaActualId))) ||
            (Array.isArray(opSelected.lineas) && opSelected.lineas.some(l => l === targetLinea || targetLinea.includes(l))) ||
            (Array.isArray(opSelected.permisos) && opSelected.permisos.some(p => {
              const eq = (p.equipoId || '').toLowerCase();
              return eq && (targetActivo.includes(eq) || eq === targetLinea.toLowerCase());
            })) ||
            ['electromecánico', 'mantenimiento', 'mecánico', 'eléctrico'].some(r => (opSelected.rol || '').toLowerCase().includes(r));

          if (!esCualificado) {
            return (
              <div className="mt-3 p-3.5 bg-amber-500/10 border border-amber-500/40 rounded-xl flex items-start gap-3 text-xs text-amber-300 animate-fade-in shadow-lg">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-black text-amber-200 block mb-0.5">Aviso de Especialización / Asignación:</span>
                  El operario <strong className="text-white font-bold">{opSelected.nombre}</strong> ({opSelected.rol}) no figura con asignación preferente o capacitación específica sobre <strong className="text-white font-mono">{targetLinea || targetActivo || 'esta línea/equipo'}</strong>. Puedes guardar la OT de todas formas si está realizando una intervención de apoyo o urgencia.
                </div>
              </div>
            );
          }
          return null;
        })()}
      </CrudModal>

      {/* Repuesto */}
      <CrudModal isOpen={repModalOpen} onClose={() => setRepModalOpen(false)} onSave={handleSaveRep}
        title={repModalMode === 'create' ? 'Añadir Repuesto al Almacén Técnico' : 'Editar Repuesto'}
        fields={REPUESTO_FIELDS_DYNAMIC} initialData={editRepItem} saving={saving} />

      {/* Plan Preventivo */}
      <CrudModal isOpen={planModalOpen} onClose={() => setPlanModalOpen(false)} onSave={handleSavePlan}
        title={planModalMode === 'create' ? 'Crear Plan Preventivo' : 'Editar Plan Preventivo'}
        fields={PLAN_PREVENTIVO_FIELDS} initialData={editPlanItem} saving={saving} />

      {/* Sensor Predictivo */}
      <CrudModal isOpen={sensorModalOpen} onClose={() => setSensorModalOpen(false)} onSave={handleSaveSensor}
        title={sensorModalMode === 'create' ? 'Nueva Acción / Sensor Predictivo' : 'Editar Sensor Predictivo'}
        fields={SENSOR_FIELDS} initialData={editSensorItem} saving={saving} />

      {/* Equipo / Árbol */}
      <CrudModal
        isOpen={equipoModalOpen}
        onClose={() => setEquipoModalOpen(false)}
        onSave={handleSaveEquipo}
        title={
          equipoModalMode === 'create' ? 'Nuevo Equipo en Árbol de Activos' :
          equipoModalMode === 'componente' ? `Nuevo Componente en ${equipoParentNode?.nombre || 'Equipo'}` :
          'Editar Equipo / Componente'
        }
        fields={equipoFieldsForMode}
        initialData={editEquipoItem}
        saving={saving}
      />

      {/* Dialogs de confirmación */}
      <ConfirmDialog isOpen={confirmOtOpen} onClose={() => setConfirmOtOpen(false)} onConfirm={handleDeleteOt}
        title="Eliminar Orden de Trabajo"
        message={`¿Estás seguro de que deseas eliminar la orden "${deleteOtTarget?.titulo}" (${deleteOtTarget?.codigo})?`}
        deleting={deleting} />

      <ConfirmDialog isOpen={confirmRepOpen} onClose={() => setConfirmRepOpen(false)} onConfirm={handleDeleteRep}
        title="Eliminar Repuesto"
        message={`¿Estás seguro de que deseas eliminar el repuesto "${deleteRepTarget?.nombre}" (${deleteRepTarget?.codigo})?`}
        deleting={deleting} />

      <ConfirmDialog isOpen={confirmPlanOpen} onClose={() => setConfirmPlanOpen(false)} onConfirm={handleDeletePlan}
        title="Eliminar Plan Preventivo"
        message={`¿Estás seguro de que deseas eliminar el plan "${deletePlanTarget?.titulo}" (${deletePlanTarget?.codigo})?`}
        deleting={deleting} />

      <ConfirmDialog isOpen={confirmSensorOpen} onClose={() => setConfirmSensorOpen(false)} onConfirm={handleDeleteSensor}
        title="Eliminar Sensor / Acción Predictiva"
        message={`¿Estás seguro de que deseas eliminar la acción "${deleteSensorTarget?.variable}" en ${deleteSensorTarget?.activoNombre}?`}
        deleting={deleting} />

      <ConfirmDialog isOpen={confirmEquipoOpen} onClose={() => setConfirmEquipoOpen(false)} onConfirm={handleDeleteEquipo}
        title="Eliminar Equipo / Componente"
        message={`¿Estás seguro de que deseas eliminar "${deleteEquipoTarget?.nombre}" y todos sus componentes hijos?`}
        deleting={deleting} />

    </div>
  );
}
