import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Factory, AlertTriangle, CheckCircle2, Package, Wrench, Clock,
  Plus, Minus, Send, RefreshCw, Cpu, UserCheck, ShieldAlert,
  Check, X, AlertOctagon, ArrowRight, ClipboardList, HelpCircle,
  LogOut, Lock, Unlock, History, Edit2, Trash2, Save, XCircle,
  TrendingUp, BarChart2, Activity, CheckSquare, Users, Key,
  ShieldCheck, MessageSquareWarning, Zap
} from 'lucide-react';
import {
  fetchLineas, updateLinea,
  fetchDefectos, insertDefecto, updateDefecto, deleteDefecto,
  fetchRetrabajos, insertRetrabajo, updateRetrabajo, deleteRetrabajo,
  fetchReclamaciones, insertReclamacion, updateReclamacion, deleteReclamacion,
  fetchScraps, insertScrap, updateScrap, deleteScrap,
  fetchRetencionesCalidad, insertRetencionCalidad, updateRetencionCalidad, deleteRetencionCalidad,
  fetchSecuencia, fetchOperarios, getCurrentShiftInfo, registrarIncidenciaCalidad
} from '@/services/dataService';

export default function PanelCalidad() {
  const navigate = useNavigate();

  // Configuración del Puesto / Inspector
  const [lineaSelId, setLineaSelId] = useState('L1');
  const [turnoSel, setTurnoSel] = useState(() => getCurrentShiftInfo().shift);
  const [operarioNombre, setOperarioNombre] = useState('Laura Gómez (Inspector QC)');
  const [operarioSelId, setOperarioSelId] = useState('OP-QC1');
  const [modalOperarioOpen, setModalOperarioOpen] = useState(false);
  const [pinLoginActivo, setPinLoginActivo] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [pendingLoginOp, setPendingLoginOp] = useState(null);

  // Tab activo: checklist | defectos | retrabajos | scraps | retenciones | reclamaciones
  const [activeTab, setActiveTab] = useState('checklist');

  // Datos en vivo
  const [lineas, setLineas] = useState([]);
  const [secuencia, setSecuencia] = useState([]);
  const [operarios, setOperarios] = useState([]);
  const [defectos, setDefectos] = useState([]);
  const [retrabajos, setRetrabajos] = useState([]);
  const [scraps, setScraps] = useState([]);
  const [retenciones, setRetenciones] = useState([]);
  const [reclamaciones, setReclamaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados de éxito en envíos rápidos
  const [envioSuccess, setEnvioSuccess] = useState('');

  // ─── Puntos del Checklist por orden ─────────────────────────────────────────
  const [checklistPoints, setChecklistPoints] = useState([
    { id: 1, text: 'Inspección visual del aspecto exterior y acabados superficiales (Sin rayas, abolladuras ni corrosión)', status: 'OK' },
    { id: 2, text: 'Control dimensional y tolerancias mecánicas (Cotas críticas y encajes según plano técnica)', status: 'OK' },
    { id: 3, text: 'Verificación de etiquetado, código de barras y trazabilidad de lotes de componentes', status: 'OK' },
    { id: 4, text: 'Pruebas funcionales rápidas / estanqueidad / aislamiento eléctrico (según especificación BOM)', status: 'OK' },
    { id: 5, text: 'Integridad del embalaje exterior e inclusión de manual / hoja técnica en pallet/caja', status: 'OK' },
  ]);

  // Formularios
  const [formDef, setFormDef] = useState({ causa: '', categoria: 'Inspección en Planta (Checklist)', cantidad: '1', pct: '5.0', linea: '', gravedad: 'media' });
  const [formRet, setFormRet] = useState({ descripcion: '', causa: '', cantidad: '1', tiempoUnitario: '15', linea: '', fecha: new Date().toISOString().slice(0, 10), operario: '', estado: 'pendiente' });
  const [formScr, setFormScr] = useState({ descripcion: '', causa: '', cantidad: '1', unidad: 'ud', costeUnitario: '12.50', linea: '', fecha: new Date().toISOString().slice(0, 10), turno: getCurrentShiftInfo().shift, destino: 'Chatarra' });
  const [formReten, setFormReten] = useState({ codigo: `HOLD-${Math.floor(100 + Math.random() * 900)}`, linea: '', motivo: '', gravedad: 'critica', estado: 'abierta', inspector: '' });
  const [formRec, setFormRec] = useState({ referencia: '', cliente: '', producto: '', descripcion: '', cantidad: '1', gravedad: 'media', estado: 'abierta', fechaApertura: new Date().toISOString().slice(0, 10), fechaCierre: '', responsable: '', accionCorrectora: '' });

  const loadAllData = async () => {
    setLoading(true);
    const [resL, resSec, resOp, resDef, resRet, resScr, resHold, resRec] = await Promise.all([
      fetchLineas(),
      fetchSecuencia(),
      fetchOperarios(),
      fetchDefectos(),
      fetchRetrabajos(),
      fetchScraps(),
      fetchRetencionesCalidad(),
      fetchReclamaciones()
    ]);
    if (resL.data) setLineas(resL.data);
    if (resSec.data) setSecuencia(resSec.data);
    if (resOp?.data) setOperarios(resOp.data);
    if (resDef.data) setDefectos(resDef.data);
    if (resRet.data) setRetrabajos(resRet.data);
    if (resScr.data) setScraps(resScr.data);
    if (resHold?.data) setRetenciones(resHold.data);
    if (resRec.data) setReclamaciones(resRec.data);
    setLoading(false);
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Escuchar eventos de sincronización cross-component
  useEffect(() => {
    const handler = () => loadAllData();
    window.addEventListener('calidad_updated', handler);
    window.addEventListener('lineas_updated', handler);
    window.addEventListener('produccion_updated', handler);
    return () => {
      window.removeEventListener('calidad_updated', handler);
      window.removeEventListener('lineas_updated', handler);
      window.removeEventListener('produccion_updated', handler);
    };
  }, []);

  const lineaActiva = useMemo(() => {
    return lineas.find(l => l.id === lineaSelId) || { id: lineaSelId, nombre: `Línea ${lineaSelId}`, estado: 'en_marcha' };
  }, [lineas, lineaSelId]);

  // Sincronizar campos de formulario cuando cambia la línea o inspector
  useEffect(() => {
    setFormDef(f => ({ ...f, linea: lineaActiva.nombre }));
    setFormRet(f => ({ ...f, linea: lineaActiva.nombre, operario: operarioNombre }));
    setFormScr(f => ({ ...f, linea: lineaActiva.nombre, turno: turnoSel }));
    setFormReten(f => ({ ...f, linea: lineaActiva.nombre, inspector: operarioNombre }));
  }, [lineaActiva.nombre, operarioNombre, turnoSel]);

  // Orden activa en la línea seleccionada para el Checklist
  const ordenActiva = useMemo(() => {
    const enCurso = secuencia.find(o => o.lineaId === lineaSelId && o.estado === 'en_curso');
    if (enCurso) return enCurso;
    const primeraSec = secuencia.find(o => o.lineaId === lineaSelId && o.progreso < 100);
    if (primeraSec) return primeraSec;
    return {
      codigo: 'OF-QC-001',
      ref: lineaActiva.productoActual || 'REF-STD-2026',
      cliente: 'Cliente en Curso',
      cantidad: 500,
      progreso: 45
    };
  }, [secuencia, lineaSelId, lineaActiva.productoActual]);

  const showSuccessNotice = (msg) => {
    setEnvioSuccess(msg);
    setTimeout(() => setEnvioSuccess(''), 3000);
  };

  // ─── TOGGLE CHECKLIST POINT ─────────────────────────────────────────────────
  const toggleChecklistPoint = (id, newStatus) => {
    setChecklistPoints(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
  };

  const hasNoOk = useMemo(() => checklistPoints.some(p => p.status === 'No OK'), [checklistPoints]);
  const firstNoOkPoint = useMemo(() => checklistPoints.find(p => p.status === 'No OK'), [checklistPoints]);

  const handlePrecargarDefecto = (punto) => {
    setFormDef({
      causa: `Fallo en Checklist QC: ${punto.text.slice(0, 60)}... (${ordenActiva.codigo || ordenActiva.ref})`,
      categoria: 'Inspección en Planta (Checklist)',
      cantidad: '1',
      pct: '10.0',
      linea: lineaActiva.nombre,
      gravedad: 'alta'
    });
    setActiveTab('defectos');
  };

  const handlePrecargarRetencion = (punto) => {
    setFormReten({
      codigo: `HOLD-${Math.floor(100 + Math.random() * 900)}`,
      linea: lineaActiva.nombre,
      motivo: `Retención por Checklist No OK: ${punto.text.slice(0, 75)}... [OF: ${ordenActiva.codigo || ordenActiva.ref}]`,
      gravedad: 'critica',
      estado: 'abierta',
      inspector: operarioNombre
    });
    setActiveTab('retenciones');
  };

  // ─── ENVÍOS DE FORMULARIOS ──────────────────────────────────────────────────
  const submitDefecto = async (e) => {
    e.preventDefault();
    if (!formDef.causa) return;

    await registrarIncidenciaCalidad({
      tipoIncidencia: 'defecto',
      lineaId: lineaSelId,
      causa: formDef.causa,
      cantidad: Number(formDef.cantidad) || 1,
      unidad: 'ud',
      gravedad: formDef.gravedad
    });

    await insertDefecto({ ...formDef, linea: lineaActiva.nombre });
    setDefectos(prev => [{ ...formDef, id: Date.now(), linea: lineaActiva.nombre }, ...prev]);
    showSuccessNotice('Defecto registrado correctamente e impactado en línea');
    setFormDef({ causa: '', categoria: 'Inspección en Planta (Checklist)', cantidad: '1', pct: '5.0', linea: lineaActiva.nombre, gravedad: 'media' });
  };

  const submitRetrabajo = async (e) => {
    e.preventDefault();
    if (!formRet.descripcion) return;

    await insertRetrabajo({ ...formRet, linea: lineaActiva.nombre, operario: operarioNombre });
    setRetrabajos(prev => [{ ...formRet, id: Date.now(), linea: lineaActiva.nombre, operario: operarioNombre }, ...prev]);
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('calidad_updated'));
    showSuccessNotice('Orden de retrabajo enviada a cola');
    setFormRet({ descripcion: '', causa: '', cantidad: '1', tiempoUnitario: '15', linea: lineaActiva.nombre, fecha: new Date().toISOString().slice(0, 10), operario: operarioNombre, estado: 'pendiente' });
  };

  const submitScrap = async (e) => {
    e.preventDefault();
    if (!formScr.descripcion) return;

    await registrarIncidenciaCalidad({
      tipoIncidencia: 'scrap',
      lineaId: lineaSelId,
      causa: `${formScr.descripcion} (${formScr.causa || 'Merma'})`,
      cantidad: Number(formScr.cantidad) || 1,
      unidad: formScr.unidad || 'ud',
      costeUnitario: Number(formScr.costeUnitario) || 0
    });

    await insertScrap({ ...formScr, linea: lineaActiva.nombre, turno: turnoSel });
    setScraps(prev => [{ ...formScr, id: Date.now(), linea: lineaActiva.nombre, turno: turnoSel }, ...prev]);
    showSuccessNotice('Scrap registrado y deducido en OEE de línea');
    setFormScr({ descripcion: '', causa: '', cantidad: '1', unidad: 'ud', costeUnitario: '12.50', linea: lineaActiva.nombre, fecha: new Date().toISOString().slice(0, 10), turno: turnoSel, destino: 'Chatarra' });
  };

  const submitRetencion = async (e) => {
    e.preventDefault();
    if (!formReten.motivo) return;

    const res = await insertRetencionCalidad({ ...formReten, linea: lineaActiva.nombre, inspector: operarioNombre });
    if (res.data) {
      setRetenciones(prev => [res.data, ...prev]);
    } else {
      setRetenciones(prev => [{ ...formReten, id: Date.now(), linea: lineaActiva.nombre, inspector: operarioNombre }, ...prev]);
    }
    showSuccessNotice('🚨 LÍNEA RETENIDA EN CALIDAD. El Gantt ha sido bloqueado');
    setFormReten({ codigo: `HOLD-${Math.floor(100 + Math.random() * 900)}`, linea: lineaActiva.nombre, motivo: '', gravedad: 'critica', estado: 'abierta', inspector: operarioNombre });
  };

  const submitReclamacion = async (e) => {
    e.preventDefault();
    if (!formRec.referencia) return;

    await insertReclamacion(formRec);
    setReclamaciones(prev => [{ ...formRec, id: Date.now() }, ...prev]);
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('calidad_updated'));
    showSuccessNotice('Reclamación de cliente abierta y notificada');
    setFormRec({ referencia: '', cliente: '', producto: '', descripcion: '', cantidad: '1', gravedad: 'media', estado: 'abierta', fechaApertura: new Date().toISOString().slice(0, 10), fechaCierre: '', responsable: '', accionCorrectora: '' });
  };

  // ─── LOGIN PIN INTERACTIVO ──────────────────────────────────────────────────
  const handleSelectOperario = (op) => {
    if (pinLoginActivo && op.pin) {
      setPendingLoginOp(op);
      setPinInput('');
      setPinError(false);
    } else {
      setOperarioSelId(op.id);
      setOperarioNombre(op.nombre);
      setModalOperarioOpen(false);
    }
  };

  const handleCheckPin = () => {
    if (!pendingLoginOp) return;
    if (String(pinInput) === String(pendingLoginOp.pin || '1234')) {
      setOperarioSelId(pendingLoginOp.id);
      setOperarioNombre(pendingLoginOp.nombre);
      setModalOperarioOpen(false);
      setPendingLoginOp(null);
      setPinInput('');
    } else {
      setPinError(true);
    }
  };

  const inspectoresYCargo = useMemo(() => {
    const list = operarios.filter(o => (o.rol || '').toLowerCase().includes('calidad') || (o.rol || '').toLowerCase().includes('qc') || (o.rol || '').toLowerCase().includes('inspector'));
    if (list.length > 0) return list;
    return operarios; // si no, mostrar todos
  }, [operarios]);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 lg:p-6 select-none space-y-6">
      {/* ── BARRA SUPERIOR MODO CALIDAD (TERMINAL KIOSKO INDEPENDIENTE) ── */}
      <div className="bg-slate-900 border-2 border-emerald-500/40 rounded-3xl p-5 shadow-2xl flex flex-col xl:flex-row items-center justify-between gap-4">
        <div className="flex items-center justify-between w-full xl:w-auto gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600/20 border-2 border-emerald-500/50 flex items-center justify-center text-emerald-400 flex-shrink-0 shadow-lg shadow-emerald-900/30">
              <ShieldCheck className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider shadow-sm flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> MODO CALIDAD — TERMINAL INDEPENDIENTE
                </span>
                <span className="text-xs text-slate-400 font-mono">QC Standalone v2.5</span>
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight mt-0.5">Control de Calidad, Inspección y Hold</h2>
            </div>
          </div>

          <button
            onClick={() => navigate('/')}
            className="xl:hidden px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all"
            title="Volver al panel general de Administración MES"
          >
            <LogOut className="w-3.5 h-3.5 text-amber-400" />
            Admin MES
          </button>
        </div>

        {/* Selectores del Terminal */}
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-end">
          {/* Línea */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl px-3 py-1.5 flex items-center gap-2">
            <Factory className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-slate-400 uppercase">Puesto:</span>
            <select
              value={lineaSelId}
              onChange={e => setLineaSelId(e.target.value)}
              className="bg-transparent text-white font-black text-sm focus:outline-none cursor-pointer"
            >
              {lineas.map(l => (
                <option key={l.id} value={l.id} className="bg-slate-900 text-white font-bold">
                  {l.nombre} ({l.calidadEstado || 'OK'})
                </option>
              ))}
            </select>
          </div>

          {/* Turno */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl px-3 py-1.5 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-slate-400 uppercase">Turno:</span>
            <select
              value={turnoSel}
              onChange={e => setTurnoSel(e.target.value)}
              className="bg-transparent text-white font-black text-sm focus:outline-none cursor-pointer"
            >
              <option value="Mañana" className="bg-slate-900 text-white">Mañana (06:00 - 14:00)</option>
              <option value="Tarde" className="bg-slate-900 text-white">Tarde (14:00 - 22:00)</option>
              <option value="Noche" className="bg-slate-900 text-white">Noche (22:00 - 06:00)</option>
            </select>
          </div>

          {/* Inspector QC */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => { setPinInput(''); setPinError(false); setModalOperarioOpen(true); }}
              className="bg-slate-800/90 hover:bg-slate-700 border border-slate-700 hover:border-emerald-500/50 rounded-2xl px-3 py-1.5 flex items-center gap-2.5 transition-all active:scale-95 group text-left shadow-lg"
              title="Seleccionar o cambiar inspector QC (PIN Opcional)"
            >
              <div className="w-7 h-7 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-black text-xs">
                QC
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-white group-hover:text-emerald-300 transition-colors leading-none">{operarioNombre}</span>
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Inspector QC
                  </span>
                </div>
              </div>
            </button>
          </div>

          {/* Botón Salir para ESCRITORIO */}
          <button
            onClick={() => navigate('/')}
            className="hidden xl:flex px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-black items-center gap-2 transition-all active:scale-95 shadow-lg"
            title="Salir del Modo Calidad y volver al Back-office general"
          >
            <LogOut className="w-4 h-4 text-emerald-400" />
            <span>Admin MES</span>
          </button>
        </div>
      </div>

      {/* AVISO FLASH ÉXITO */}
      <AnimatePresence>
        {envioSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 border border-emerald-400 rounded-2xl p-4 shadow-xl flex items-center justify-between text-white font-black text-sm"
          >
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 fill-white text-emerald-600 animate-bounce" />
              {envioSuccess}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SELECTOR GIGANTE DE TABS TÁCTILES ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {[
          { id: 'checklist', label: '1. Checklist QC', sub: 'Inspección Orden', icon: CheckSquare, color: 'emerald' },
          { id: 'defectos', label: '2. Defectos', sub: 'Registrar Causa', icon: AlertTriangle, color: 'red' },
          { id: 'retrabajos', label: '3. Retrabajos', sub: 'Orden Retrabajo', icon: Wrench, color: 'amber' },
          { id: 'scraps', label: '4. Scrap / Mermas', sub: 'Desecho Material', icon: Trash2, color: 'orange' },
          { id: 'retenciones', label: '5. Retención (Hold)', sub: 'Bloquear Línea', icon: ShieldAlert, color: 'rose' },
          { id: 'reclamaciones', label: '6. Reclamaciones', sub: 'Apertura Cliente', icon: MessageSquareWarning, color: 'purple' },
        ].map(t => {
          const isAct = activeTab === t.id;
          const activeColors = {
            emerald: 'bg-emerald-600/20 border-emerald-500 shadow-xl shadow-emerald-900/30',
            red: 'bg-red-600/20 border-red-500 shadow-xl shadow-red-900/30',
            amber: 'bg-amber-600/20 border-amber-500 shadow-xl shadow-amber-900/30',
            orange: 'bg-orange-600/20 border-orange-500 shadow-xl shadow-orange-900/30',
            rose: 'bg-rose-600/20 border-rose-500 shadow-xl shadow-rose-900/30',
            purple: 'bg-purple-600/20 border-purple-500 shadow-xl shadow-purple-900/30',
          };
          const iconColors = {
            emerald: 'bg-emerald-600 text-white', red: 'bg-red-600 text-white',
            amber: 'bg-amber-600 text-white', orange: 'bg-orange-600 text-white',
            rose: 'bg-rose-600 text-white', purple: 'bg-purple-600 text-white',
          };
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`p-3.5 md:p-4 rounded-3xl border-2 transition-all text-left flex flex-col items-start gap-2.5 ${
                isAct ? activeColors[t.color] : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black transition-transform ${isAct ? `${iconColors[t.color]} scale-110 shadow-md` : 'bg-slate-800 text-slate-400'}`}>
                  <t.icon className="w-5 h-5" />
                </div>
                {isAct && <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />}
              </div>
              <div>
                <span className={`text-sm md:text-base font-black block tracking-tight leading-snug ${isAct ? 'text-white font-extrabold' : 'text-slate-300'}`}>
                  {t.label}
                </span>
                <span className="text-[11px] font-bold text-slate-500 block mt-0.5 leading-tight">
                  {t.sub}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── CONTENIDO POR PESTAÑA ── */}
      <div className="space-y-6">
        {/* ── TAB 1: CHECKLIST DE CALIDAD ───────────────────────────────────── */}
        {activeTab === 'checklist' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl h-fit">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-emerald-400" />
                  Orden Activa en {lineaActiva.nombre}
                </h3>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold border border-emerald-500/30">
                  EN INSPECCIÓN
                </span>
              </div>

              <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-500 block">Código / Orden de Fabricación:</span>
                  <span className="text-lg font-black text-white font-mono block mt-0.5">{ordenActiva.codigo || 'OF-2026-992'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-500 block">Producto / Referencia:</span>
                  <span className="text-sm font-bold text-emerald-300 block mt-0.5">{ordenActiva.ref || lineaActiva.productoActual || 'Celdas Batería LFP 100Ah'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Cliente:</span>
                    <span className="text-xs font-bold text-slate-200 truncate block">{ordenActiva.cliente || 'Tesla Industrial'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Cantidad Planificada:</span>
                    <span className="text-xs font-mono font-black text-amber-400 block">{ordenActiva.cantidad || 500} ud</span>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-4 space-y-2">
                <p className="text-xs font-black text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Instrucción Pauta QC
                </p>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Verifique los 5 puntos de control crítico en la línea de montaje. Si algún punto no supera las tolerancias o presenta defectos recurrentes, regístrelo como "No OK" para accionar protocolos de rechazo o retención del lote.
                </p>
              </div>
            </div>

            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <CheckSquare className="w-5 h-5 text-emerald-400" />
                    Puntos de Verificación e Inspección (Checklist)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Selecciona el estado de cada punto en planta para la orden actual</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setChecklistPoints(prev => prev.map(p => ({ ...p, status: 'OK' })))}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors"
                  >
                    ✔ Marcar Todos OK
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {checklistPoints.map(point => {
                  const isOk = point.status === 'OK';
                  return (
                    <div
                      key={point.id}
                      className={`p-4 rounded-2xl border-2 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                        isOk
                          ? 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                          : 'bg-red-950/30 border-red-500/80 shadow-lg shadow-red-900/20 animate-pulse'
                      }`}
                    >
                      <div className="flex items-start gap-3.5 max-w-xl">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 mt-0.5 ${
                          isOk ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-red-500/30 text-red-400 border border-red-500'
                        }`}>
                          {point.id}
                        </div>
                        <span className={`text-xs sm:text-sm font-bold leading-snug ${isOk ? 'text-slate-200' : 'text-red-200 font-extrabold'}`}>
                          {point.text}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-end">
                        <button
                          type="button"
                          onClick={() => toggleChecklistPoint(point.id, 'OK')}
                          className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
                            isOk
                              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" /> OK
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleChecklistPoint(point.id, 'No OK')}
                          className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
                            !isOk
                              ? 'bg-red-600 text-white shadow-md shadow-red-900/60'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                          }`}
                        >
                          <X className="w-3.5 h-3.5" /> No OK
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ALERTA O ACCIÓN SI HAY ALGÚN NO OK */}
              <AnimatePresence>
                {hasNoOk && firstNoOkPoint && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.98 }}
                    className="bg-red-950/60 border-2 border-red-500 rounded-3xl p-5 shadow-2xl space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-900/50 flex-shrink-0">
                          <AlertTriangle className="w-6 h-6 animate-bounce" />
                        </div>
                        <div>
                          <h4 className="text-base font-black text-white">⚠️ Incidencia Crítica Detectada en Checklist</h4>
                          <p className="text-xs text-red-300 mt-0.5">
                            Se ha marcado como "No OK": <strong className="text-white">"{firstNoOkPoint.text.slice(0, 50)}..."</strong>
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-950/80 p-3 rounded-xl border border-red-500/30 text-xs text-red-200 space-y-1">
                      <p>• Puedes declarar un <strong>Defecto precargado</strong> con los datos de esta orden y línea sin escribir desde cero.</p>
                      <p>• O puedes aplicar un <strong>Quality Hold (Retención)</strong> inmediato para bloquear la programación de la línea en el Gantt.</p>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                      <button
                        onClick={() => handlePrecargarDefecto(firstNoOkPoint)}
                        className="px-5 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-red-900/50 transition-all active:scale-95"
                      >
                        <Zap className="w-4 h-4 fill-white" /> ⚡ Generar Defecto Pre-cargado
                      </button>
                      <button
                        onClick={() => handlePrecargarRetencion(firstNoOkPoint)}
                        className="px-5 py-3 rounded-2xl bg-rose-700 hover:bg-rose-600 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-rose-900/50 transition-all active:scale-95"
                      >
                        <Lock className="w-4 h-4" /> 🔒 Retener Línea (Quality Hold)
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* ── TAB 2: REGISTRAR DEFECTO ──────────────────────────────────────── */}
        {activeTab === 'defectos' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <form onSubmit={submitDefecto} className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl h-fit">
              <h3 className="text-base font-black text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Registrar Defecto en {lineaActiva.nombre}
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-black text-slate-300 block mb-1">Causa / Descripción del Defecto *</label>
                  <input
                    type="text"
                    required
                    value={formDef.causa}
                    onChange={e => setFormDef(f => ({ ...f, causa: e.target.value }))}
                    placeholder="Ej: Porosidad en cordón de soldadura"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-bold focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-black text-slate-300 block mb-1">Categoría</label>
                    <select
                      value={formDef.categoria}
                      onChange={e => setFormDef(f => ({ ...f, categoria: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-bold focus:outline-none"
                    >
                      <option value="Proceso">Proceso</option>
                      <option value="Material">Material</option>
                      <option value="Maquinaria">Maquinaria</option>
                      <option value="Inspección en Planta (Checklist)">Inspección (Checklist)</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-black text-slate-300 block mb-1">Gravedad</label>
                    <select
                      value={formDef.gravedad}
                      onChange={e => setFormDef(f => ({ ...f, gravedad: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-bold focus:outline-none"
                    >
                      <option value="baja">Baja</option>
                      <option value="media">Media</option>
                      <option value="alta">Alta</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-black text-slate-300 block mb-1">Cantidad Defectuosa</label>
                    <input
                      type="number"
                      min="1"
                      value={formDef.cantidad}
                      onChange={e => setFormDef(f => ({ ...f, cantidad: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-black text-slate-300 block mb-1">% Estimado FPY</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formDef.pct}
                      onChange={e => setFormDef(f => ({ ...f, pct: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-red-900/40 flex items-center justify-center gap-2 transition-all active:scale-95 mt-4"
              >
                <Save className="w-4 h-4" /> Enviar y Registrar Defecto
              </button>
            </form>

            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <h3 className="text-base font-black text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <History className="w-5 h-5 text-slate-400" />
                Defectos Recientes en {lineaActiva.nombre}
              </h3>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800 max-h-96 overflow-y-auto">
                {defectos.filter(d => (d.linea || '').toLowerCase().includes(lineaActiva.nombre.toLowerCase()) || d.linea === lineaSelId).map(def => (
                  <div key={def.id} className="p-3.5 text-xs flex items-center justify-between hover:bg-slate-900/50 transition-colors">
                    <div>
                      <span className="font-bold text-white block">{def.causa}</span>
                      <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">Categoría: {def.categoria} — Gravedad: <strong className="text-red-400 uppercase">{def.gravedad || 'media'}</strong></span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-amber-400 font-black text-sm block">{def.cantidad} ud</span>
                      <span className="text-[10px] text-slate-500 font-mono block">{def.pct}% merma</span>
                    </div>
                  </div>
                ))}
                {defectos.filter(d => (d.linea || '').toLowerCase().includes(lineaActiva.nombre.toLowerCase()) || d.linea === lineaSelId).length === 0 && (
                  <div className="p-8 text-center text-slate-500 text-xs">Sin defectos registrados recientemente en {lineaActiva.nombre}.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: REGISTRAR RETRABAJO ────────────────────────────────────── */}
        {activeTab === 'retrabajos' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <form onSubmit={submitRetrabajo} className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl h-fit">
              <h3 className="text-base font-black text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <Wrench className="w-5 h-5 text-amber-400" />
                Nueva Orden de Retrabajo
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-black text-slate-300 block mb-1">Descripción del Trabajo / Acción *</label>
                  <input
                    type="text"
                    required
                    value={formRet.descripcion}
                    onChange={e => setFormRet(f => ({ ...f, descripcion: e.target.value }))}
                    placeholder="Ej: Lijado manual y pulido superficial"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="font-black text-slate-300 block mb-1">Causa del Retrabajo</label>
                  <input
                    type="text"
                    value={formRet.causa}
                    onChange={e => setFormRet(f => ({ ...f, causa: e.target.value }))}
                    placeholder="Ej: Rebaba excesiva en pieza inyectada"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-black text-slate-300 block mb-1">Piezas / Cantidad</label>
                    <input
                      type="number"
                      min="1"
                      value={formRet.cantidad}
                      onChange={e => setFormRet(f => ({ ...f, cantidad: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-black text-slate-300 block mb-1">Min. Unitario (est.)</label>
                    <input
                      type="number"
                      value={formRet.tiempoUnitario}
                      onChange={e => setFormRet(f => ({ ...f, tiempoUnitario: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-amber-600 hover:bg-amber-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-amber-900/40 flex items-center justify-center gap-2 transition-all active:scale-95 mt-4"
              >
                <Save className="w-4 h-4" /> Emitir Orden de Retrabajo
              </button>
            </form>

            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <h3 className="text-base font-black text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <History className="w-5 h-5 text-slate-400" />
                Retrabajos en {lineaActiva.nombre}
              </h3>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800 max-h-96 overflow-y-auto">
                {retrabajos.filter(r => (r.linea || '').toLowerCase().includes(lineaActiva.nombre.toLowerCase()) || r.linea === lineaSelId).map(ret => (
                  <div key={ret.id} className="p-3.5 text-xs flex items-center justify-between hover:bg-slate-900/50 transition-colors">
                    <div>
                      <span className="font-bold text-white block">{ret.descripcion}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Causa: {ret.causa || '—'} · Operario: <strong className="text-amber-300">{ret.operario || '—'}</strong></span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-white font-black text-sm block">{ret.cantidad} ud</span>
                      <span className="text-[10px] text-amber-400 font-mono block">{Number(ret.cantidad || 0) * Number(ret.tiempoUnitario || 0)} min total</span>
                    </div>
                  </div>
                ))}
                {retrabajos.filter(r => (r.linea || '').toLowerCase().includes(lineaActiva.nombre.toLowerCase()) || r.linea === lineaSelId).length === 0 && (
                  <div className="p-8 text-center text-slate-500 text-xs">Sin retrabajos registrados en {lineaActiva.nombre}.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 4: SCRAP / MERMAS ─────────────────────────────────────────── */}
        {activeTab === 'scraps' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <form onSubmit={submitScrap} className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl h-fit">
              <h3 className="text-base font-black text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <Trash2 className="w-5 h-5 text-orange-400" />
                Declarar Scrap / Merma de Material
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-black text-slate-300 block mb-1">Descripción del Material Desechado *</label>
                  <input
                    type="text"
                    required
                    value={formScr.descripcion}
                    onChange={e => setFormScr(f => ({ ...f, descripcion: e.target.value }))}
                    placeholder="Ej: Celdas LFP con voltaje fuera de tolerancia"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-bold focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="font-black text-slate-300 block mb-1">Causa de la Merma</label>
                  <input
                    type="text"
                    value={formScr.causa}
                    onChange={e => setFormScr(f => ({ ...f, causa: e.target.value }))}
                    placeholder="Ej: Caída durante manipulación en celda de carga"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="font-black text-slate-300 block mb-1">Cantidad</label>
                    <input
                      type="number"
                      min="1"
                      value={formScr.cantidad}
                      onChange={e => setFormScr(f => ({ ...f, cantidad: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2.5 text-white font-mono focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-black text-slate-300 block mb-1">Unidad</label>
                    <select
                      value={formScr.unidad}
                      onChange={e => setFormScr(f => ({ ...f, unidad: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2.5 text-white font-bold focus:outline-none"
                    >
                      <option value="ud">ud</option>
                      <option value="m">m</option>
                      <option value="kg">kg</option>
                      <option value="L">L</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-black text-slate-300 block mb-1">€ Unitario</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formScr.costeUnitario}
                      onChange={e => setFormScr(f => ({ ...f, costeUnitario: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2.5 text-white font-mono focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-black text-slate-300 block mb-1">Destino del Desecho</label>
                  <select
                    value={formScr.destino}
                    onChange={e => setFormScr(f => ({ ...f, destino: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-bold focus:outline-none"
                  >
                    <option value="Chatarra">Chatarra / Reciclaje</option>
                    <option value="Proveedor (RMA)">Devolución Proveedor (RMA)</option>
                    <option value="Cuarentena">Cuarentena Calidad</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-orange-600 hover:bg-orange-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-orange-900/40 flex items-center justify-center gap-2 transition-all active:scale-95 mt-4"
              >
                <Save className="w-4 h-4" /> Registrar Scrap en Planta
              </button>
            </form>

            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <h3 className="text-base font-black text-white flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="flex items-center gap-2"><History className="w-5 h-5 text-slate-400" /> Scraps Recientes en {lineaActiva.nombre}</span>
                <span className="text-xs font-mono text-orange-400">Total: €{scraps.filter(s => (s.linea || '').toLowerCase().includes(lineaActiva.nombre.toLowerCase()) || s.linea === lineaSelId).reduce((ac, item) => ac + (Number(item.cantidad) * Number(item.costeUnitario || 0)), 0).toFixed(2)}</span>
              </h3>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800 max-h-96 overflow-y-auto">
                {scraps.filter(s => (s.linea || '').toLowerCase().includes(lineaActiva.nombre.toLowerCase()) || s.linea === lineaSelId).map(scr => (
                  <div key={scr.id} className="p-3.5 text-xs flex items-center justify-between hover:bg-slate-900/50 transition-colors">
                    <div>
                      <span className="font-bold text-white block">{scr.descripcion}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Causa: {scr.causa || '—'} · Destino: <strong className="text-orange-300">{scr.destino || 'Chatarra'}</strong></span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-orange-400 font-black text-sm block">{scr.cantidad} {scr.unidad}</span>
                      <span className="text-[10px] text-slate-500 font-mono block">€{(Number(scr.cantidad) * Number(scr.costeUnitario || 0)).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
                {scraps.filter(s => (s.linea || '').toLowerCase().includes(lineaActiva.nombre.toLowerCase()) || s.linea === lineaSelId).length === 0 && (
                  <div className="p-8 text-center text-slate-500 text-xs">Sin scrap reportado en {lineaActiva.nombre}.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 5: RETENCIONES (QUALITY HOLD) ─────────────────────────────── */}
        {activeTab === 'retenciones' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <form onSubmit={submitRetencion} className="lg:col-span-1 bg-slate-900 border-2 border-rose-500/60 rounded-3xl p-6 space-y-4 shadow-2xl h-fit">
              <h3 className="text-base font-black text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <ShieldAlert className="w-5 h-5 text-rose-500 animate-pulse" />
                Marcar Retención (Hold) en {lineaActiva.nombre}
              </h3>

              <div className="bg-rose-950/40 border border-rose-500/40 rounded-2xl p-3.5 text-xs text-rose-200 space-y-1">
                <p className="font-black flex items-center gap-1.5"><Lock className="w-4 h-4 text-rose-400" /> Bloqueo Operacional Inmediato</p>
                <p className="text-[11px] text-rose-300">Al confirmar una retención con gravedad "Crítica", el Gantt de planificación bloqueará cualquier asignación en esta línea.</p>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-black text-slate-300 block mb-1">Motivo de la Retención / Incidencia Grave *</label>
                  <textarea
                    rows="3"
                    required
                    value={formReten.motivo}
                    onChange={e => setFormReten(f => ({ ...f, motivo: e.target.value }))}
                    placeholder="Describe el fallo crítico de inspección por el cual se interrumpe y bloquea la línea..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-bold focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-black text-slate-300 block mb-1">Código Retención</label>
                    <input
                      type="text"
                      value={formReten.codigo}
                      onChange={e => setFormReten(f => ({ ...f, codigo: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-black text-slate-300 block mb-1">Gravedad</label>
                    <select
                      value={formReten.gravedad}
                      onChange={e => setFormReten(f => ({ ...f, gravedad: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none"
                    >
                      <option value="alta">Alta</option>
                      <option value="critica">Crítica (Bloquea Gantt)</option>
                    </select>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white font-black text-sm rounded-2xl shadow-xl shadow-rose-900/60 flex items-center justify-center gap-2 transition-all active:scale-95 mt-2 animate-pulse"
              >
                <Lock className="w-5 h-5" /> RETENER LÍNEA INMEDIATAMENTE
              </button>
            </form>

            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <h3 className="text-base font-black text-white flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="flex items-center gap-2"><Lock className="w-5 h-5 text-rose-400" /> Retenciones Activas o Pasadas en {lineaActiva.nombre}</span>
                <span className="text-xs font-mono text-rose-400 font-black">{retenciones.filter(r => (r.linea || '').toLowerCase() === lineaActiva.nombre.toLowerCase() || r.linea === lineaSelId).length} registros</span>
              </h3>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800 max-h-96 overflow-y-auto">
                {retenciones.filter(r => (r.linea || '').toLowerCase() === lineaActiva.nombre.toLowerCase() || r.linea === lineaSelId).map(ret => {
                  const activa = ret.estado !== 'cerrada';
                  return (
                    <div key={ret.id} className={`p-4 text-xs flex items-center justify-between transition-colors ${activa ? 'bg-rose-950/20 border-l-4 border-rose-500' : 'hover:bg-slate-900/50'}`}>
                      <div className="max-w-md">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white text-xs">{ret.codigo}</span>
                          {activa ? (
                            <span className="px-2 py-0.5 rounded bg-red-600/30 text-red-300 font-black text-[10px] border border-red-500/40 animate-pulse flex items-center gap-1">
                              <Lock className="w-3 h-3" /> HOLD ACTIVO
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-emerald-600/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/30 flex items-center gap-1">
                              <Unlock className="w-3 h-3" /> LIBERADA
                            </span>
                          )}
                        </div>
                        <p className="font-bold text-slate-200 mt-1.5 leading-snug">{ret.motivo}</p>
                        <span className="text-[10px] text-slate-400 block mt-1">Inspector: <strong className="text-white">{ret.inspector}</strong> · Fecha: {ret.fechaApertura}</span>
                      </div>

                      <div className="text-right flex-shrink-0">
                        {activa ? (
                          <button
                            onClick={async () => {
                              const upd = await updateRetencionCalidad(ret.id, { estado: 'cerrada', fechaCierre: new Date().toISOString().slice(0, 16).replace('T', ' ') });
                              if (upd.data) {
                                setRetenciones(prev => prev.map(item => item.id === ret.id ? upd.data : item));
                                showSuccessNotice('Retención liberada. Línea desbloqueada en Gantt');
                              }
                            }}
                            className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                          >
                            <Unlock className="w-4 h-4" /> Liberar Retención
                          </button>
                        ) : (
                          <span className="text-emerald-400 font-bold text-xs">{ret.fechaCierre || 'Resuelta'}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {retenciones.filter(r => (r.linea || '').toLowerCase() === lineaActiva.nombre.toLowerCase() || r.linea === lineaSelId).length === 0 && (
                  <div className="p-8 text-center text-slate-500 text-xs">Sin retenciones de calidad en {lineaActiva.nombre}.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 6: RECLAMACIONES CLIENTE ──────────────────────────────────── */}
        {activeTab === 'reclamaciones' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <form onSubmit={submitReclamacion} className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl h-fit">
              <h3 className="text-base font-black text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <MessageSquareWarning className="w-5 h-5 text-purple-400" />
                Apertura Reclamación de Cliente
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-black text-slate-300 block mb-1">Referencia / OF Reclamada *</label>
                  <input
                    type="text"
                    required
                    value={formRec.referencia}
                    onChange={e => setFormRec(f => ({ ...f, referencia: e.target.value }))}
                    placeholder="Ej: OF-2026-901"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-bold focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-black text-slate-300 block mb-1">Cliente</label>
                    <input
                      type="text"
                      value={formRec.cliente}
                      onChange={e => setFormRec(f => ({ ...f, cliente: e.target.value }))}
                      placeholder="Ej: Seat Martorell"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-black text-slate-300 block mb-1">Producto / Lote</label>
                    <input
                      type="text"
                      value={formRec.producto}
                      onChange={e => setFormRec(f => ({ ...f, producto: e.target.value }))}
                      placeholder="Ej: LOTE-8821"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-black text-slate-300 block mb-1">Motivo / Descripción del Fallo Reportado</label>
                  <textarea
                    rows="2"
                    value={formRec.descripcion}
                    onChange={e => setFormRec(f => ({ ...f, descripcion: e.target.value }))}
                    placeholder="Ej: Fuga de líquido en prueba de campo..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-bold focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-purple-900/40 flex items-center justify-center gap-2 transition-all active:scale-95 mt-4"
              >
                <Save className="w-4 h-4" /> Abrir Reclamación y Notificar
              </button>
            </form>

            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <h3 className="text-base font-black text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <History className="w-5 h-5 text-slate-400" />
                Historial Reclamaciones
              </h3>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800 max-h-96 overflow-y-auto">
                {reclamaciones.map(rec => (
                  <div key={rec.id} className="p-3.5 text-xs flex items-center justify-between hover:bg-slate-900/50 transition-colors">
                    <div>
                      <span className="font-bold text-white block">{rec.referencia} — {rec.cliente || 'Cliente'}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{rec.descripcion || 'Sin descripción detallada'}</span>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">{rec.estado || 'abierta'}</span>
                      <span className="text-[10px] text-slate-500 font-mono block mt-1">{rec.fechaApertura}</span>
                    </div>
                  </div>
                ))}
                {reclamaciones.length === 0 && (
                  <div className="p-8 text-center text-slate-500 text-xs">Sin reclamaciones en el historial.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL SELECCIÓN / LOGIN INSPECTOR QC ── */}
      <AnimatePresence>
        {modalOperarioOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-5 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white">Selección de Inspector QC</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Identifícate para la firma electrónica de partes de inspección y retenciones
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setModalOperarioOpen(false)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Toggle Login PIN */}
              <div className="my-5 p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-emerald-300">Autenticación Segura con PIN (QC Login)</p>
                    <p className="text-[10px] text-slate-400">Activa para requerir PIN del inspector antes de firmar partes</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setPinLoginActivo(!pinLoginActivo); setPinInput(''); setPinError(false); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all border ${
                    pinLoginActivo
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-900/50'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  {pinLoginActivo ? 'PIN Requerido' : 'Selección Libre'}
                </button>
              </div>

              {pendingLoginOp ? (
                <div className="py-6 space-y-4 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center text-emerald-400 mx-auto text-xl font-black">
                    {pendingLoginOp.nombre?.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">{pendingLoginOp.nombre}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Introduce el PIN de 4 dígitos para firmar como este inspector</p>
                  </div>

                  <div className="max-w-xs mx-auto">
                    <input
                      type="password"
                      maxLength="4"
                      value={pinInput}
                      onChange={e => { setPinInput(e.target.value); setPinError(false); }}
                      placeholder="••••"
                      className="w-full text-center tracking-widest text-2xl font-black bg-slate-950 border-2 border-emerald-500/60 rounded-2xl py-3 text-white focus:outline-none"
                      autoFocus
                    />
                    {pinError && <p className="text-xs text-red-400 font-bold mt-2">❌ PIN incorrecto. Reinténtalo.</p>}
                  </div>

                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setPendingLoginOp(null)}
                      className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-black"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleCheckPin}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-900/40"
                    >
                      Confirmar y Entrar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                  {inspectoresYCargo.map(op => {
                    const isSel = op.id === operarioSelId;
                    return (
                      <button
                        key={op.id}
                        onClick={() => handleSelectOperario(op)}
                        className={`p-3.5 rounded-2xl border-2 transition-all flex items-center gap-3 text-left ${
                          isSel
                            ? 'bg-emerald-600/20 border-emerald-500 shadow-lg shadow-emerald-900/30'
                            : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-black text-xs flex-shrink-0">
                          {op.nombre?.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="truncate">
                          <span className="text-sm font-black text-white block truncate">{op.nombre}</span>
                          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mt-1 inline-block">
                            {op.rol || 'Inspector QC'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
