import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Plus, Calendar, Edit2, Trash2, X, Check,
  RefreshCw, AlertCircle, Package, ArrowRight, Layers, Search,
  ShieldAlert, ArrowLeftCircle, Wrench, Move, GripVertical
} from 'lucide-react';
import {
  fetchLineas, fetchPlanificacion, fetchMateriasPrimas, fetchProductos,
  fetchOrdenesTrabajo, fetchRetencionesCalidad, calcularTodosConsumosComprometidos,
  calcularDisponibilidadOrden, updateReservaMaterialesOrden, insertOrdenPlanificacion,
  updateOrdenPlanificacion, deleteOrdenPlanificacion,
  calcDuracionEstimada, fetchTiemposCambioEstandar, fetchCambiosFormato
} from '@/services/dataService';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';

// ─── Gantt Layout Constants ────────────────────────────────────────────────
const PX_POR_HORA   = 64;   // pixels per hour
const ROW_H         = 72;   // height of each gantt row (px)
const LABEL_W       = 140;  // sticky line label column width (px)
const GANTT_HDR_H   = 68;   // approx height of the two-row day/hour header
const HORA_INI      = 6;    // 06:00
const HORA_FIN      = 22;   // 22:00
const HORAS_DIA     = HORA_FIN - HORA_INI;  // 16 h
const PX_POR_DIA    = HORAS_DIA * PX_POR_HORA; // 1024 px

const COLORS = ['#2563eb','#7c3aed','#0891b2','#dc2626','#059669','#d97706','#db2777','#4f46e5'];

// Compute display info for a given day offset (0 = today)
function getDayInfo(offset) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const dow = d.getDay(); // 0=Sun,6=Sat
  return {
    weekday: d.toLocaleDateString('es-ES', { weekday: 'short' }),
    date:    d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
    isToday: offset === 0,
    isWE:    dow === 0 || dow === 6,
    fullDate: d,
  };
}

export default function PlanificacionLineas() {

  // ─── Data state ───────────────────────────────────────────────────────────
  const [lineas, setLineas]               = useState([]);
  const [ordenes, setOrdenes]             = useState([]);
  const [listaMateriales, setListaMateriales] = useState([]);
  const [listaProductos, setListaProductos]   = useState([]);
  const [listaOrdenesTrabajo, setListaOrdenesTrabajo] = useState([]);
  const [listaRetenciones, setListaRetenciones]       = useState([]);
  const [smedEstandar, setSmedEstandar]   = useState([]);
  const [smedHistorial, setSmedHistorial] = useState([]);
  const [loading, setLoading]             = useState(true);

  // ─── Gantt view ───────────────────────────────────────────────────────────
  const [ventana, setVentana]         = useState(7);  // 7 | 14 days
  const [offsetDias, setOffsetDias]   = useState(0);  // 0 = starting from today

  // ─── Backlog panel ────────────────────────────────────────────────────────
  const [backlogPlegado, setBacklogPlegado]       = useState(false);
  const [filtroPrioridad, setFiltroPrioridad]     = useState('todas');
  const [busquedaBacklog, setBusquedaBacklog]     = useState('');

  // ─── Modals (preserved) ───────────────────────────────────────────────────
  const [modalOpen, setModalOpen]         = useState(false);
  const [modalMode, setModalMode]         = useState('create');
  const [formOrden, setFormOrden]         = useState({
    codigo:'', sinAsignar:false, linea:'', dia:0, horaInicio:8,
    duracion:4, ref:'', cliente:'', cantidad:500,
    materiales:'', fechaCompromiso:'', prioridad:'normal', color:COLORS[0]
  });
  const [saving, setSaving]               = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignOrden, setAssignOrden]         = useState(null);
  const [assignForm, setAssignForm]           = useState({ linea:'', dia:0, horaInicio:8 });
  const [blockedDropInfo, setBlockedDropInfo] = useState(null);

  // ─── Drag / resize state ──────────────────────────────────────────────────
  const dragRef     = useRef({ active: false });
  const [dragState, setDragState]   = useState(null);
  const resizeRef   = useRef({ active: false });
  const [resizeState, setResizeState] = useState(null); // { ordenId, duracion }

  // ─── Gantt DOM refs ───────────────────────────────────────────────────────
  const ganttScrollRef = useRef(null);
  const ganttGridRef   = useRef(null);

  // ─── Realtime clock & sync ────────────────────────────────────────────────
  const [nowDate, setNowDate] = useState(new Date());
  useRealtimeSync('secuencia',     () => window.dispatchEvent(new CustomEvent('secuencia_updated')));
  useRealtimeSync('materias_primas', () => window.dispatchEvent(new CustomEvent('materiales_updated')));

  useEffect(() => {
    const t = setInterval(() => setNowDate(new Date()), 15000);
    return () => clearInterval(t);
  }, []);

  // ═════════════════════════════════════════════════════════════════════════
  // DATA LOADING (preserved)
  // ═════════════════════════════════════════════════════════════════════════
  const loadData = async () => {
    setLoading(true);
    const [resL, resP, resM, resProd, resOt, resRet, resSmedEst, resSmedHist] = await Promise.all([
      fetchLineas(), fetchPlanificacion(), fetchMateriasPrimas(),
      fetchProductos(), fetchOrdenesTrabajo(), fetchRetencionesCalidad(),
      fetchTiemposCambioEstandar(), fetchCambiosFormato()
    ]);
    if (resL.data)       setLineas(resL.data);
    if (resP.data)       setOrdenes(resP.data);
    if (resM?.data)      setListaMateriales(resM.data);
    if (resProd?.data)   setListaProductos(resProd.data);
    if (resOt?.data)     setListaOrdenesTrabajo(resOt.data);
    if (resRet?.data)    setListaRetenciones(resRet.data);
    if (resSmedEst?.data) setSmedEstandar(resSmedEst.data);
    if (resSmedHist?.data) setSmedHistorial(resSmedHist.data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    const h = () => loadData();
    const evs = ['secuencia_reordenada','materiales_updated','planificacion_updated',
                  'bom_updated','productos_updated','mantenimiento_updated','calidad_updated'];
    evs.forEach(e => window.addEventListener(e, h));
    return () => evs.forEach(e => window.removeEventListener(e, h));
  }, []);

  // ═════════════════════════════════════════════════════════════════════════
  // BUSINESS LOGIC MEMOS (preserved)
  // ═════════════════════════════════════════════════════════════════════════
  const calcChangeoverTime = (lineaNombre, pA, pB) => {
    if (!pA || !pB || pA === pB) return 0;
    const hist = smedHistorial.filter(h =>
      h.linea === lineaNombre && h.productoAnterior === pA && h.productoNuevo === pB);
    if (hist.length > 0) return Math.round(hist.reduce((s,h)=>s+h.duracionMinutos,0)/hist.length);
    const est = smedEstandar.find(e => e.productoAnterior === pA && e.productoNuevo === pB);
    if (est) return est.minutosEstandar || est.duracionMinutos;
    return 30;
  };

  const retencionesCalidadPorLinea = useMemo(() => {
    const m = {};
    (listaRetenciones||[]).forEach(ret => {
      const est = (ret.estado||'').toLowerCase().trim();
      if (['cerrada','resuelto','completada'].includes(est)) return;
      const ls = (ret.linea||'').trim();
      if (!ls) return;
      const found = lineas.find(l =>
        l.nombre?.toLowerCase().trim()===ls.toLowerCase() ||
        l.id?.toLowerCase().trim()===ls.toLowerCase());
      const keys = found ? [found.nombre, found.id] : [ls];
      keys.forEach(k => { if (!m[k]) m[k]=[]; m[k].push(ret); });
    });
    return m;
  }, [listaRetenciones, lineas]);

  const otsCriticasPorLinea = useMemo(() => {
    const m = {};
    const abiertos = ['abierta','en curso','pendiente','en proceso'];
    (listaOrdenesTrabajo||[]).forEach(ot => {
      const est = (ot.estado||'').toLowerCase().trim();
      const prio = (ot.prioridad||'').toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
      if (!abiertos.includes(est) || prio !== 'critica') return;
      const ls = (ot.linea||'').trim();
      if (!ls) return;
      const found = lineas.find(l =>
        l.nombre?.toLowerCase().trim()===ls.toLowerCase() ||
        l.id?.toLowerCase().trim()===ls.toLowerCase());
      const keys = found ? [found.nombre, found.id] : [ls];
      keys.forEach(k => { if (!m[k]) m[k]=[]; m[k].push(ot); });
    });
    return m;
  }, [listaOrdenesTrabajo, lineas]);

  const mapaConsumo = calcularTodosConsumosComprometidos({ products: listaProductos, productos: listaProductos });

  const ordenesGantt   = ordenes.filter(o => o.linea && o.linea !== 'BACKLOG' && o.dia !== null && o.dia !== undefined);
  const ordenesBacklog = ordenes.filter(o => !o.linea || o.linea === 'BACKLOG' || o.dia === null || o.dia === undefined);

  const backlogFiltrado = ordenesBacklog.filter(o => {
    if (filtroPrioridad !== 'todas' && o.prioridad !== filtroPrioridad) return false;
    if (busquedaBacklog.trim()) {
      const q = busquedaBacklog.toLowerCase();
      return [o.codigo, o.ref, o.cliente, o.materiales].some(v => (v||'').toLowerCase().includes(q));
    }
    return true;
  });

  // ═════════════════════════════════════════════════════════════════════════
  // GANTT COORDINATE HELPERS
  // ═════════════════════════════════════════════════════════════════════════
  const ordenToLeft  = (dia, horaInicio) => (Number(dia) - offsetDias) * PX_POR_DIA + (horaInicio - HORA_INI) * PX_POR_HORA;
  const ordenToWidth = (dur) => Math.max(PX_POR_HORA * 0.5, (dur || 4) * PX_POR_HORA);

  const diasVisibles = useMemo(() =>
    Array.from({ length: ventana }, (_, i) => i + offsetDias),
    [ventana, offsetDias]);

  const totalWidth = ventana * PX_POR_DIA;

  // Current time position
  const nowHour     = nowDate.getHours() + nowDate.getMinutes() / 60;
  const todayInView = offsetDias <= 0 && 0 < offsetDias + ventana;
  const nowLineX    = (0 - offsetDias) * PX_POR_DIA + (nowHour - HORA_INI) * PX_POR_HORA;
  const nowInRange  = nowHour >= HORA_INI && nowHour <= HORA_FIN;

  // ═════════════════════════════════════════════════════════════════════════
  // DRAG – global pointer events attached to window during drag
  // ═════════════════════════════════════════════════════════════════════════
  const startDrag = useCallback((e, orden, isFromBacklog) => {
    if (e.button !== 0) return;
    e.preventDefault();
    if (!ganttGridRef.current || !ganttScrollRef.current) return;

    const rect = ganttGridRef.current.getBoundingClientRect();
    const scrollLeft = ganttScrollRef.current.scrollLeft;

    // For existing gantt blocks, preserve the grab offset within the block
    let grabOffsetX = 0;
    if (!isFromBacklog) {
      const blockLeft = ordenToLeft(Number(orden.dia), orden.horaInicio) + LABEL_W - scrollLeft;
      grabOffsetX = Math.max(0, e.clientX - (rect.left + blockLeft));
    }

    dragRef.current = {
      active: true,
      orden,
      isFromBacklog,
      ganttLeft:   rect.left,
      ganttTop:    rect.top,
      scrollLeft,
      grabOffsetX,
      originalLineaIdx: isFromBacklog ? 0 : lineas.findIndex(l => l.id === orden.linea),
      moved: false,
      currentDia:   orden.dia ?? 0,
      currentHora:  orden.horaInicio ?? 8,
      currentLinea: orden.linea ?? lineas[0]?.id,
    };
  }, [lineas, offsetDias]); // eslint-disable-line

  useEffect(() => {
    const onMove = (e) => {
      const dr = dragRef.current;
      if (!dr.active) return;

      const scrollLeft = ganttScrollRef.current?.scrollLeft ?? dr.scrollLeft;
      const rawX = e.clientX - dr.ganttLeft - LABEL_W + scrollLeft - dr.grabOffsetX;
      const rawY = e.clientY - dr.ganttTop  - GANTT_HDR_H;

      const diaOffset = Math.floor(rawX / PX_POR_DIA);
      const horaRaw   = HORA_INI + (rawX - diaOffset * PX_POR_DIA) / PX_POR_HORA;
      const newDia    = Math.max(0, diaOffset + offsetDias);
      const maxHora   = HORA_FIN - (dr.orden.duracion || 1);
      const newHora   = Math.max(HORA_INI, Math.min(maxHora, Math.round(horaRaw * 2) / 2));

      const lineaIdx  = Math.max(0, Math.min(lineas.length - 1, Math.floor(rawY / ROW_H)));
      const newLinea  = lineas[lineaIdx]?.id ?? dr.currentLinea;

      if (Math.abs(e.clientX - (dr.ganttLeft + LABEL_W + dr.grabOffsetX - dr.scrollLeft + scrollLeft)) > 4 ||
          Math.abs(e.clientY - dr.ganttTop - GANTT_HDR_H - lineaIdx * ROW_H) > 4) {
        dr.moved = true;
      }

      dr.currentDia   = newDia;
      dr.currentHora  = newHora;
      dr.currentLinea = newLinea;

      setDragState({ orden: dr.orden, isFromBacklog: dr.isFromBacklog, dia: newDia, hora: newHora, linea: newLinea });
    };

    const onUp = async (e) => {
      const dr = dragRef.current;
      if (!dr.active) return;

      const { orden, isFromBacklog, moved, currentDia, currentHora, currentLinea } = dr;
      dragRef.current = { active: false };
      setDragState(null);

      if (!moved) {
        // Treated as click → open edit modal
        openEditModal(orden);
        return;
      }

      // Business checks (same as original)
      const disp = calcularDisponibilidadOrden(orden, listaMateriales);
      const otsLinea = otsCriticasPorLinea[currentLinea] || [];
      const retsLinea = retencionesCalidadPorLinea[currentLinea] || [];
      const faltaMat = isFromBacklog && disp.estado === 'rojo';
      const hayOt    = otsLinea.length > 0;
      const hayRet   = retsLinea.length > 0;

      if ((faltaMat || hayOt || hayRet) && !orden.forzar_asignacion) {
        let motivo = 'material';
        if (hayRet && (hayOt || faltaMat)) motivo = 'ambos';
        else if (hayRet) motivo = 'calidad';
        else if (faltaMat && hayOt) motivo = 'ambos';
        else if (hayOt) motivo = 'mantenimiento';
        setBlockedDropInfo({ orden, lineaId: currentLinea, horaIdx: currentHora, dia: currentDia, disp, otsCriticas: otsLinea, retencionesCalidad: retsLinea, motivo });
        return;
      }

      const updated = { ...orden, linea: currentLinea, dia: currentDia, horaInicio: currentHora };
      setOrdenes(prev => prev.map(o => o.id === orden.id ? updated : o));
      await updateOrdenPlanificacion(orden.id, { linea: currentLinea, dia: currentDia, horaInicio: currentHora });

      if (isFromBacklog && currentLinea && currentLinea !== 'BACKLOG') {
        await updateReservaMaterialesOrden(updated, 'reservar');
        const resM = await fetchMateriasPrimas();
        if (resM?.data) setListaMateriales(resM.data);
      }
      const resL = await fetchLineas();
      if (resL.data) setLineas(resL.data);
    };

    const onCancel = () => {
      if (!dragRef.current.active) return;
      dragRef.current = { active: false };
      setDragState(null);
    };

    window.addEventListener('pointermove',  onMove);
    window.addEventListener('pointerup',    onUp);
    window.addEventListener('pointercancel',onCancel);
    return () => {
      window.removeEventListener('pointermove',  onMove);
      window.removeEventListener('pointerup',    onUp);
      window.removeEventListener('pointercancel',onCancel);
    };
  }, [lineas, offsetDias, listaMateriales, otsCriticasPorLinea, retencionesCalidadPorLinea]);

  // ═════════════════════════════════════════════════════════════════════════
  // RESIZE – same pointer-events pattern
  // ═════════════════════════════════════════════════════════════════════════
  const startResize = useCallback((e, orden) => {
    e.stopPropagation();
    e.preventDefault();
    resizeRef.current = { active: true, orden, startX: e.clientX, originalDur: orden.duracion || 4 };
    setResizeState({ ordenId: orden.id, duracion: orden.duracion || 4 });
  }, []);

  useEffect(() => {
    const onMove = (e) => {
      const rr = resizeRef.current;
      if (!rr.active) return;
      const dx   = e.clientX - rr.startX;
      const newD = Math.max(0.5, Math.round((rr.originalDur + dx / PX_POR_HORA) * 2) / 2);
      resizeRef.current.currentDur = newD;
      setResizeState({ ordenId: rr.orden.id, duracion: newD });
    };
    const onUp = async () => {
      const rr = resizeRef.current;
      if (!rr.active) return;
      const finalDur = rr.currentDur ?? rr.originalDur;
      resizeRef.current = { active: false };
      setResizeState(null);
      if (finalDur !== rr.originalDur) {
        setOrdenes(prev => prev.map(o => o.id === rr.orden.id ? { ...o, duracion: finalDur } : o));
        await updateOrdenPlanificacion(rr.orden.id, { duracion: finalDur });
      }
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup',   onUp);
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
  }, []);

  // ═════════════════════════════════════════════════════════════════════════
  // MODAL HANDLERS (preserved from original)
  // ═════════════════════════════════════════════════════════════════════════
  const openCreateModal = (isBacklogDefault = false) => {
    const numOF      = Math.floor(100 + Math.random() * 900);
    const defaultRef = listaProductos[0]?.codigo || '';
    const defaultCnt = 500;
    const defaultDur = calcDuracionEstimada(defaultRef, defaultCnt, listaProductos);
    setFormOrden({
      id: null, codigo: `OF-2026-${numOF}`, sinAsignar: isBacklogDefault,
      linea: isBacklogDefault ? '' : (lineas[0]?.id || ''),
      dia: offsetDias, horaInicio: 8, duracion: defaultDur, ref: defaultRef,
      cliente: listaProductos.find(p => p.codigo === defaultRef)?.cliente || '',
      cantidad: defaultCnt, materiales: 'Componentes estándar de la referencia',
      fechaCompromiso: new Date(Date.now() + 5 * 86400000).toLocaleDateString('es-ES'),
      prioridad: 'normal', color: COLORS[Math.floor(Math.random() * COLORS.length)]
    });
    setModalMode('create');
    setModalOpen(true);
  };

  const openEditModal = (orden) => {
    const isSinAsignar = !orden.linea || orden.linea === 'BACKLOG';
    const defaultRef   = orden.ref || listaProductos[0]?.codigo || '';
    const defaultCnt   = orden.cantidad || 500;
    setFormOrden({
      ...orden, sinAsignar: isSinAsignar,
      linea: isSinAsignar ? (lineas[0]?.id || '') : orden.linea,
      dia: orden.dia ?? offsetDias,
      horaInicio: orden.horaInicio || 8,
      duracion: orden.duracion || calcDuracionEstimada(defaultRef, defaultCnt, listaProductos),
      cantidad: defaultCnt, materiales: orden.materiales || '',
      prioridad: orden.prioridad || 'normal',
      codigo: orden.codigo || `OF-${orden.id || '2026'}`, ref: defaultRef
    });
    setModalMode('edit');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const eraBacklog = modalMode === 'create' || !ordenes.find(o => o.id === formOrden.id)?.linea;
    if (!formOrden.sinAsignar && eraBacklog) {
      const disp   = calcularDisponibilidadOrden(formOrden, listaMateriales);
      const otsL   = otsCriticasPorLinea[formOrden.linea] || [];
      const faltaM = disp.estado === 'rojo';
      const hayOt  = otsL.length > 0;
      if ((faltaM || hayOt) && !formOrden.forzar_asignacion) {
        setSaving(false);
        setBlockedDropInfo({ orden: formOrden, lineaId: formOrden.linea, horaIdx: Number(formOrden.horaInicio), disp, otsCriticas: otsL, motivo: faltaM && hayOt ? 'ambos' : hayOt ? 'mantenimiento' : 'material' });
        setModalOpen(false);
        return;
      }
    }
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
      if (data) {
        setOrdenes(prev => [...prev, data]);
        if (data.linea && data.linea !== 'BACKLOG') await updateReservaMaterialesOrden(data, 'reservar');
      }
    } else {
      const { data } = await updateOrdenPlanificacion(formOrden.id, dataToSave);
      if (data) {
        setOrdenes(prev => prev.map(o => o.id === formOrden.id ? data : o));
        if (eraBacklog && data.linea && data.linea !== 'BACKLOG') await updateReservaMaterialesOrden(data, 'reservar');
        else if (!eraBacklog && (!data.linea || data.linea === 'BACKLOG')) await updateReservaMaterialesOrden(data, 'liberar');
      }
    }
    const resM = await fetchMateriasPrimas(); if (resM?.data) setListaMateriales(resM.data);
    const resL = await fetchLineas();         if (resL.data)  setLineas(resL.data);
    setSaving(false);
    setModalOpen(false);
  };

  const handleDelete = async () => {
    if (!formOrden.id) return;
    setSaving(true);
    if (!formOrden.sinAsignar && formOrden.linea && formOrden.linea !== 'BACKLOG')
      await updateReservaMaterialesOrden(formOrden, 'liberar');
    await deleteOrdenPlanificacion(formOrden.id);
    setOrdenes(prev => prev.filter(o => o.id !== formOrden.id));
    const resM = await fetchMateriasPrimas(); if (resM?.data) setListaMateriales(resM.data);
    const resL = await fetchLineas();         if (resL.data)  setLineas(resL.data);
    setSaving(false);
    setModalOpen(false);
  };

  const handleDevolverABacklog = async () => {
    if (!formOrden.id) return;
    setSaving(true);
    await updateOrdenPlanificacion(formOrden.id, { linea: null, dia: null });
    await updateReservaMaterialesOrden(formOrden, 'liberar');
    setOrdenes(prev => prev.map(o => o.id === formOrden.id ? { ...o, linea: null, dia: null } : o));
    const resM = await fetchMateriasPrimas(); if (resM?.data) setListaMateriales(resM.data);
    const resL = await fetchLineas();         if (resL.data)  setLineas(resL.data);
    setSaving(false);
    setModalOpen(false);
  };

  const openQuickAssign = (o) => {
    setAssignOrden(o);
    setAssignForm({ linea: lineas[0]?.id || '', dia: offsetDias, horaInicio: 8 });
    setAssignModalOpen(true);
  };

  const handleConfirmQuickAssign = async (e) => {
    e.preventDefault();
    if (!assignOrden) return;
    const disp   = calcularDisponibilidadOrden(assignOrden, listaMateriales);
    const otsL   = otsCriticasPorLinea[assignForm.linea] || [];
    const faltaM = disp.estado === 'rojo';
    const hayOt  = otsL.length > 0;
    if ((faltaM || hayOt) && !assignOrden.forzar_asignacion) {
      setAssignModalOpen(false);
      setBlockedDropInfo({ orden: assignOrden, lineaId: assignForm.linea, horaIdx: Number(assignForm.horaInicio), disp, otsCriticas: otsL, motivo: faltaM && hayOt ? 'ambos' : hayOt ? 'mantenimiento' : 'material' });
      return;
    }
    setSaving(true);
    const updated = { ...assignOrden, linea: assignForm.linea, dia: Number(assignForm.dia), horaInicio: Number(assignForm.horaInicio) };
    await updateOrdenPlanificacion(assignOrden.id, { linea: assignForm.linea, dia: Number(assignForm.dia), horaInicio: Number(assignForm.horaInicio) });
    await updateReservaMaterialesOrden(updated, 'reservar');
    setOrdenes(prev => prev.map(o => o.id === assignOrden.id ? updated : o));
    const resM = await fetchMateriasPrimas(); if (resM?.data) setListaMateriales(resM.data);
    const resL = await fetchLineas();         if (resL.data)  setLineas(resL.data);
    setSaving(false);
    setAssignModalOpen(false);
    setAssignOrden(null);
  };

  const handleConfirmBlockedDrop = async () => {
    if (!blockedDropInfo) return;
    const { orden, lineaId, horaIdx, dia } = blockedDropInfo;
    const newDia = dia ?? orden.dia ?? 0;
    const updated = { ...orden, linea: lineaId, dia: newDia, horaInicio: horaIdx, forzar_asignacion: true };
    setOrdenes(prev => prev.map(o => o.id === orden.id ? updated : o));
    setBlockedDropInfo(null);
    await updateOrdenPlanificacion(orden.id, { linea: lineaId, dia: newDia, horaInicio: horaIdx, forzar_asignacion: true });
    if (!orden.linea || orden.linea === 'BACKLOG') await updateReservaMaterialesOrden(updated, 'reservar');
    const resM = await fetchMateriasPrimas(); if (resM?.data) setListaMateriales(resM.data);
    const resL = await fetchLineas();         if (resL.data)  setLineas(resL.data);
  };

  // ─── Small helpers ────────────────────────────────────────────────────────
  const getPrioridadBadge = (prio) => {
    if (prio === 'urgente') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse">🔥 URGENTE</span>;
    if (prio === 'alta')    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500/20 text-amber-400 border border-amber-500/40">⚡ ALTA</span>;
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase bg-blue-500/20 text-blue-400 border border-blue-500/40">ℹ️ NORMAL</span>;
  };

  // Days available for modal picker (next 21 days)
  const diasPickerOptions = Array.from({ length: 21 }, (_, i) => ({ offset: i, ...getDayInfo(i) }));

  // ═════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════════════
  return (
    <div className="flex flex-col gap-4 max-w-[1900px] mx-auto" style={{ userSelect: 'none' }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4"
      >
        <div>
          <h2 className="text-2xl font-black text-white">Planificación Maestro</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Vista de <strong className="text-blue-400">{ventana} días</strong> · Arrastra bloques libremente (horizontal = hora, vertical = línea) · Borde derecho para redimensionar
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={loadData} disabled={loading} className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => openCreateModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-indigo-900/30 border border-indigo-400/30">
            <Plus className="w-4 h-4" /> Nueva OF (Backlog)
          </button>
          <button onClick={() => openCreateModal(false)} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-blue-900/30">
            <Plus className="w-4 h-4" /> Asignar a Línea
          </button>
        </div>
      </motion.div>

      {/* ── Alert banner: material crítico ─────────────────────────────── */}
      {(() => {
        const criticas = ordenesGantt.filter(o => calcularDisponibilidadOrden(o, listaMateriales).estado === 'rojo');
        if (!criticas.length) return null;
        return (
          <motion.div initial={{ opacity:0, y:-5 }} animate={{ opacity:1, y:0 }}
            className="bg-red-500/15 border-2 border-red-500/50 rounded-2xl p-4 flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 flex-shrink-0">
              <ShieldAlert className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <h4 className="text-white font-black text-sm">Riesgo de Parada por Falta de Material Crítico</h4>
              <p className="text-xs text-red-300 mt-0.5">
                <strong className="text-white font-mono">{criticas.length}</strong> orden(es) planificada(s) con <span className="bg-red-500/20 text-red-400 font-bold px-1.5 py-0.5 rounded border border-red-500/40">🔴 Falta Crítica</span>. Verificar aprovisionamiento.
              </p>
            </div>
          </motion.div>
        );
      })()}

      {/* ── Main layout: Backlog sidebar + Gantt ───────────────────────── */}
      <div className="flex gap-4 items-start">

        {/* ── Backlog panel (collapsible left sidebar) ─────────────────── */}
        <motion.div
          animate={{ width: backlogPlegado ? 44 : 276 }}
          transition={{ duration: 0.22, ease: 'easeInOut' }}
          className="flex-shrink-0 bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden self-stretch"
        >
          {/* Panel header */}
          <div className="p-3 border-b border-slate-800 flex items-center justify-between min-h-[48px]">
            {!backlogPlegado && (
              <div className="flex items-center gap-2 min-w-0">
                <Layers className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                <span className="text-xs font-black text-white">Backlog</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-600 text-white">{ordenesBacklog.length}</span>
              </div>
            )}
            <button onClick={() => setBacklogPlegado(!backlogPlegado)}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors flex-shrink-0 ml-auto"
              title={backlogPlegado ? 'Expandir' : 'Colapsar'}
            >
              {backlogPlegado ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {!backlogPlegado && (
            <>
              {/* Search & filter */}
              <div className="p-2 border-b border-slate-800 space-y-2">
                <div className="relative">
                  <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder="Buscar..." value={busquedaBacklog}
                    onChange={e => setBusquedaBacklog(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-7 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex gap-1 flex-wrap">
                  {['todas','urgente','alta','normal'].map(p => (
                    <button key={p} onClick={() => setFiltroPrioridad(p)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize transition-all ${filtroPrioridad === p ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                    >{p}</button>
                  ))}
                </div>
              </div>

              {/* Backlog card list */}
              <div className="overflow-y-auto p-2 space-y-2" style={{ maxHeight: 'calc(100vh - 340px)' }}>
                {backlogFiltrado.length === 0 ? (
                  <div className="py-6 text-center border border-dashed border-slate-800 rounded-xl">
                    <Package className="w-7 h-7 text-slate-600 mx-auto mb-1 opacity-50" />
                    <p className="text-[11px] font-bold text-slate-500">Sin órdenes pendientes</p>
                    <button onClick={() => openCreateModal(true)} className="mt-2 px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-lg text-[11px] font-bold border border-indigo-500/40 transition-all">+ Añadir</button>
                  </div>
                ) : (
                  backlogFiltrado.map(o => {
                    const disp = calcularDisponibilidadOrden(o, listaMateriales, listaProductos, mapaConsumo);
                    const isDraggingThis = dragState?.orden?.id === o.id;
                    return (
                      <div key={o.id}
                        className={`relative bg-slate-950/90 border rounded-xl p-3 cursor-grab active:cursor-grabbing group overflow-hidden transition-all ${isDraggingThis ? 'border-indigo-400 opacity-40 scale-95' : 'border-slate-800 hover:border-indigo-500/50'}`}
                        onPointerDown={(e) => startDrag(e, o, true)}
                      >
                        <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl" style={{ backgroundColor: o.color || '#6366f1' }} />
                        <div className="pt-1 space-y-1">
                          <div className="flex items-center justify-between flex-wrap gap-1">
                            <span className="font-mono text-[10px] font-black text-slate-500">{o.codigo || `OF-${o.id}`}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono border ${disp.colorBadge}`}>{disp.label}</span>
                          </div>
                          <p className="text-xs font-black text-white leading-tight truncate">{o.ref}</p>
                          <p className="text-[10px] text-slate-400 truncate">{o.cliente}</p>
                          <div className="flex items-center justify-between pt-1.5 border-t border-slate-800">
                            <span className="text-[10px] text-slate-400">{o.cantidad||0}u · <span className="text-indigo-400 font-bold">{o.duracion||0}h</span></span>
                            <div>{getPrioridadBadge(o.prioridad)}</div>
                          </div>
                        </div>
                        <div className="absolute bottom-1 right-1.5 text-[9px] text-slate-600 opacity-0 group-hover:opacity-100 flex items-center gap-0.5 pointer-events-none">
                          <Move className="w-2.5 h-2.5" /> Arrastra al Gantt
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </motion.div>

        {/* ── Gantt section ──────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col gap-3">

          {/* Controls row */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            {/* Window selector */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1">
                {[7,14].map(v => (
                  <button key={v} onClick={() => setVentana(v)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${ventana===v ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                  >{v} días</button>
                ))}
              </div>
            </div>

            {/* Date navigation */}
            <div className="flex items-center gap-2">
              <button onClick={() => setOffsetDias(p => Math.max(0, p - ventana))} disabled={offsetDias===0}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 transition-all">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setOffsetDias(0)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all ${offsetDias===0 ? 'bg-blue-600/20 text-blue-300 border-blue-500/50' : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'}`}
              >Hoy</button>
              <button onClick={() => setOffsetDias(p => p + ventana)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all">
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="text-xs text-slate-400 font-bold hidden sm:block">
                {getDayInfo(offsetDias).date} — {getDayInfo(offsetDias + ventana - 1).date}
              </span>
            </div>
          </div>

          {/* Capacity summary bars */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2">
            {lineas.map(l => {
              const ords = ordenesGantt.filter(o => o.linea === l.id && Number(o.dia) >= offsetDias && Number(o.dia) < offsetDias + ventana);
              const horas = ords.reduce((s, o) => s + (o.duracion || 4), 0);
              const pct = Math.round((horas / (HORAS_DIA * ventana)) * 100);
              return (
                <div key={l.id} className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 truncate">{l.nombre}</span>
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${l.estado==='en_marcha' ? 'bg-emerald-400 shadow-sm shadow-emerald-500' : l.estado==='parada' ? 'bg-red-400' : 'bg-amber-400'}`} />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                    <span>Carga {ventana}d</span>
                    <span className={pct>100 ? 'text-red-400 font-black' : 'text-slate-300'}>{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${pct>100 ? 'bg-red-500' : pct>80 ? 'bg-amber-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(100,pct)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── THE GANTT GRID ─────────────────────────────────────────── */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <RefreshCw className="w-6 h-6 text-blue-400 animate-spin" />
                <span className="ml-3 text-slate-400">Cargando planificación...</span>
              </div>
            ) : (
              <div ref={ganttScrollRef} className="overflow-x-auto" style={{ cursor: dragState ? 'grabbing' : 'default' }}>
                <div ref={ganttGridRef} style={{ width: LABEL_W + totalWidth, minWidth: LABEL_W + totalWidth }}>

                  {/* ── HEADER: day labels + hour marks ────────────────── */}
                  <div className="bg-slate-900/90 border-b-2 border-slate-800" style={{ position: 'sticky', top: 0, zIndex: 30 }}>
                    <div className="flex">
                      {/* Sticky label cell */}
                      <div className="bg-slate-950 border-r border-slate-800 flex items-end pb-2 px-3 flex-shrink-0"
                        style={{ width: LABEL_W, minWidth: LABEL_W, position:'sticky', left:0, zIndex:31 }}>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Línea</span>
                      </div>
                      {/* Day + hours header */}
                      {diasVisibles.map((dia, i) => {
                        const dl = getDayInfo(dia);
                        return (
                          <div key={dia} style={{ width: PX_POR_DIA, minWidth: PX_POR_DIA }}
                            className={`border-l border-slate-800 flex-shrink-0 ${dl.isWE ? 'bg-slate-900/50' : ''} ${dl.isToday ? 'bg-blue-950/30' : ''}`}
                          >
                            {/* Day label */}
                            <div className={`px-2 py-1.5 border-b border-slate-800/60 text-center ${dl.isToday ? 'border-blue-500/30' : ''}`}>
                              <span className={`text-[11px] font-black capitalize ${dl.isToday ? 'text-blue-300' : dl.isWE ? 'text-slate-500' : 'text-slate-300'}`}>
                                {dl.weekday}
                                {dl.isToday && <span className="ml-1 bg-blue-500 text-white text-[8px] px-1.5 rounded-full">HOY</span>}
                              </span>
                              <span className={`text-[10px] font-mono block mt-0.5 ${dl.isToday ? 'text-blue-400' : 'text-slate-500'}`}>{dl.date}</span>
                            </div>
                            {/* Hour marks */}
                            <div className="flex">
                              {Array.from({ length: HORAS_DIA / 2 }, (_, hi) => (
                                <div key={hi} style={{ width: PX_POR_HORA * 2 }}
                                  className="border-l border-slate-800/30 py-1 text-center flex-shrink-0">
                                  <span className="text-[9px] font-mono text-slate-600">{String(HORA_INI + hi * 2).padStart(2,'0')}h</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* ── LINE ROWS ───────────────────────────────────────── */}
                  {lineas.map((linea, lineaIdx) => {
                    const otsCrit  = otsCriticasPorLinea[linea.nombre] || otsCriticasPorLinea[linea.id] || [];
                    const isDragRow = dragState?.linea === linea.id;
                    const ordenesLinea = ordenesGantt.filter(o => o.linea === linea.id);

                    return (
                      <div key={linea.id} className={`flex border-b border-slate-800/50 transition-colors ${isDragRow ? 'bg-blue-950/15' : lineaIdx%2===0 ? 'bg-transparent' : 'bg-slate-950/20'}`}
                        style={{ height: ROW_H }}>

                        {/* Sticky label */}
                        <div
                          className={`flex-shrink-0 flex flex-col justify-center px-3 border-r transition-colors ${otsCrit.length>0 ? 'bg-red-950/70 border-r-red-500/60' : 'bg-slate-950/95 border-r-slate-800'}`}
                          style={{ width: LABEL_W, minWidth: LABEL_W, position:'sticky', left:0, zIndex:10 }}
                        >
                          <div className="flex items-center gap-1.5">
                            {otsCrit.length > 0 && <Wrench className="w-3.5 h-3.5 text-red-400 animate-bounce flex-shrink-0" />}
                            <span className="text-xs font-black text-white truncate">{linea.nombre}</span>
                          </div>
                          <span className={`text-[10px] font-bold mt-0.5 ${otsCrit.length>0 ? 'text-red-400' : linea.estado==='en_marcha' ? 'text-emerald-400' : linea.estado==='parada' ? 'text-red-400' : 'text-amber-400'}`}>
                            {otsCrit.length > 0 ? `Mant. (${otsCrit.length} OT)` : linea.estado==='en_marcha' ? 'En marcha' : linea.estado==='parada' ? 'Parada' : 'Preparación'}
                          </span>
                        </div>

                        {/* Timeline area */}
                        <div className="relative flex-1 overflow-hidden" style={{ width: totalWidth }}>

                          {/* Day dividers + weekend shade */}
                          {diasVisibles.map((dia, di) => {
                            const dl = getDayInfo(dia);
                            return (
                              <div key={dia} className={`absolute top-0 bottom-0 ${dl.isWE ? 'bg-slate-900/20' : ''} ${dl.isToday ? 'bg-blue-950/10' : ''}`}
                                style={{ left: di * PX_POR_DIA, width: PX_POR_DIA, borderLeft: '1px solid rgba(51,65,85,0.4)' }}>
                                {/* Hour lines every 2h */}
                                {Array.from({ length: HORAS_DIA/2 }, (_, hi) => (
                                  <div key={hi} className="absolute top-0 bottom-0" style={{ left: hi * PX_POR_HORA * 2, borderLeft: '1px solid rgba(51,65,85,0.25)' }} />
                                ))}
                              </div>
                            );
                          })}

                          {/* OT critical overlay */}
                          {otsCrit.length > 0 && (
                            <div className="absolute inset-0 pointer-events-none z-5"
                              style={{ backgroundImage:'repeating-linear-gradient(45deg,rgba(239,68,68,0.05) 0px,rgba(239,68,68,0.05) 8px,transparent 8px,transparent 16px)' }}
                            />
                          )}

                          {/* Current time needle */}
                          {todayInView && nowInRange && (
                            <div className="absolute top-0 bottom-0 z-20 pointer-events-none"
                              style={{ left: nowLineX, width: 2, background: 'rgba(239,68,68,0.85)', boxShadow:'0 0 6px rgba(239,68,68,0.7)' }}
                            />
                          )}

                          {/* Drag preview ghost on this row */}
                          {dragState && dragState.linea === linea.id && (
                            <div className="absolute top-2 bottom-2 rounded-xl border-2 border-dashed border-blue-400/70 bg-blue-500/10 z-5 pointer-events-none transition-none"
                              style={{
                                left: Math.max(0, ordenToLeft(dragState.dia, dragState.hora)) + 2,
                                width: Math.max(20, ordenToWidth(dragState.orden.duracion) - 4),
                              }}
                            />
                          )}

                          {/* SMED changeover wedges */}
                          {(() => {
                            const sorted = ordenesLinea
                              .filter(o => Number(o.dia) >= offsetDias && Number(o.dia) < offsetDias + ventana)
                              .sort((a,b) => (Number(a.dia)*100 + a.horaInicio) - (Number(b.dia)*100 + b.horaInicio));
                            return sorted.map((o, i) => {
                              if (i === 0) return null;
                              const prev = sorted[i-1];
                              if (prev.ref === o.ref) return null;
                              const mins = calcChangeoverTime(linea.nombre, prev.ref, o.ref);
                              if (!mins) return null;
                              const leftPx  = ordenToLeft(Number(prev.dia), prev.horaInicio) + ordenToWidth(prev.duracion);
                              const widthPx = (mins/60) * PX_POR_HORA;
                              return (
                                <div key={`smed-${o.id}`}
                                  className="absolute top-[30%] bottom-[30%] rounded border border-slate-600 flex items-center justify-center overflow-hidden z-10"
                                  style={{ left:leftPx, width:widthPx, background:'rgba(30,41,59,0.85)', backgroundImage:'repeating-linear-gradient(45deg,rgba(148,163,184,0.08) 0px,rgba(148,163,184,0.08) 4px,transparent 4px,transparent 8px)' }}
                                  title={`Cambio de formato: ~${mins} min`}
                                >
                                  {widthPx > 24 && <span className="text-[9px] font-black text-slate-400">{mins}'</span>}
                                </div>
                              );
                            });
                          })()}

                          {/* ORDER BLOCKS */}
                          {ordenesLinea.map(o => {
                            const left  = ordenToLeft(Number(o.dia), o.horaInicio);
                            const isDragging = dragState?.orden?.id === o.id;
                            const isResizing = resizeState?.ordenId === o.id;
                            const dur   = isResizing ? resizeState.duracion : o.duracion;
                            const width = ordenToWidth(dur);

                            // Skip if completely outside view
                            if (left + width < -64 || left > totalWidth + 64) return null;

                            const disp = calcularDisponibilidadOrden(o, listaMateriales, listaProductos, mapaConsumo);
                            const col  = o.color || '#2563eb';

                            return (
                              <div key={o.id}
                                className={`absolute top-2 bottom-2 rounded-xl flex items-center overflow-hidden group ${isDragging ? 'opacity-30 z-0' : 'z-15 hover:brightness-125'}`}
                                style={{
                                  left: left + 2,
                                  width: Math.max(16, width - 4),
                                  backgroundColor: `${col}1a`,
                                  border: `1.5px solid ${col}`,
                                  cursor: isDragging ? 'grabbing' : 'grab',
                                  transition: isResizing || isDragging ? 'none' : 'filter 0.1s',
                                  boxShadow: `0 2px 8px ${col}22`,
                                }}
                                onPointerDown={(e) => { if (!e.target.closest('[data-resize]')) startDrag(e, o, false); }}
                              >
                                {/* Block content */}
                                <div className="flex-1 min-w-0 px-2">
                                  <div className="flex items-center gap-1 min-w-0">
                                    <span className={`px-1 py-0 rounded text-[8px] font-mono font-bold flex-shrink-0 border ${
                                      disp.estado==='rojo'  ? 'bg-red-500 text-white border-red-400 animate-pulse' :
                                      disp.estado==='ambar' ? 'bg-amber-500/30 text-amber-300 border-amber-500/40' :
                                      'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                    }`}>{disp.label}</span>
                                    <p className="text-[11px] font-black truncate" style={{ color: col }}>{o.codigo ? `[${o.codigo}] ` : ''}{o.ref}</p>
                                  </div>
                                  {width > 100 && <p className="text-[9px] text-slate-300 truncate mt-0.5">{o.cliente} · {o.cantidad}u · {dur}h</p>}
                                </div>

                                {/* Resize handle */}
                                <div data-resize="true"
                                  className="absolute right-0 top-0 bottom-0 w-4 flex items-center justify-center cursor-ew-resize opacity-0 group-hover:opacity-100 hover:!opacity-100 transition-opacity rounded-r-xl"
                                  style={{ background: `linear-gradient(to left, ${col}55, transparent)` }}
                                  onPointerDown={(e) => startResize(e, o)}
                                >
                                  <GripVertical className="w-2.5 h-2.5 text-white/60" />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                </div>
              </div>
            )}

            {/* Footer legend */}
            <div className="px-4 py-2.5 border-t border-slate-800 bg-slate-900/40 flex items-center gap-4 flex-wrap text-[11px] text-slate-500 font-bold">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-blue-600/30 border border-blue-500/60 rounded" /><span>Orden planificada</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-red-500/80 rounded animate-pulse" /><span>Material crítico faltante</span></div>
              {todayInView && <div className="flex items-center gap-1.5"><div className="w-0.5 h-4 bg-red-500" /><span>Hora actual</span></div>}
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 border border-dashed border-slate-600 rounded" style={{backgroundImage:'repeating-linear-gradient(45deg,rgba(148,163,184,0.1) 0px,rgba(148,163,184,0.1) 3px,transparent 3px,transparent 6px)'}} /><span>Cambio de formato (SMED)</span></div>
              <span className="text-slate-600">· Arrastra horizontal (hora/día) · Arrastra vertical (línea) · Borde derecho = redimensionar</span>
            </div>
          </div>

        </div>{/* end Gantt section */}
      </div>{/* end main layout */}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL CREAR / EDITAR (preserved from original)
      ══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div initial={{ opacity:0, scale:0.95, y:15 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95, y:15 }}
              className="card p-6 max-w-xl w-full bg-slate-900 border border-slate-700 shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex items-center justify-between mb-5 border-b border-slate-800 pb-3">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  {modalMode === 'create' ? <Plus className="w-5 h-5 text-indigo-400" /> : <Edit2 className="w-5 h-5 text-indigo-400" />}
                  {modalMode === 'create' ? 'Nueva Ficha de Producción (OF)' : `Editar Ficha ${formOrden.codigo||''}`}
                </h3>
                <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors"><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                {/* Destino: Backlog o Línea */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase block">Estado y Programación</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setFormOrden({...formOrden, sinAsignar:true})}
                      className={`py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 border transition-all ${formOrden.sinAsignar ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'}`}>
                      <Layers className="w-4 h-4" /> En Backlog / Sin Asignar
                    </button>
                    <button type="button" onClick={() => setFormOrden({...formOrden, sinAsignar:false, linea:formOrden.linea||lineas[0]?.id||''})}
                      className={`py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 border transition-all ${!formOrden.sinAsignar ? 'bg-blue-600/20 text-blue-300 border-blue-500' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'}`}>
                      <Calendar className="w-4 h-4" /> Asignada a Línea
                    </button>
                  </div>
                </div>

                {/* Coordenadas de programación */}
                {!formOrden.sinAsignar && (
                  <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }}
                    className="space-y-3 bg-blue-950/20 p-3.5 rounded-xl border border-blue-900/40">
                    <span className="text-[10px] font-black uppercase text-blue-400 block">Coordenadas de Programación</span>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Línea</label>
                        <select value={formOrden.linea} onChange={e => setFormOrden({...formOrden, linea:e.target.value})}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-blue-500">
                          {lineas.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Día programación</label>
                        <select value={formOrden.dia} onChange={e => setFormOrden({...formOrden, dia:Number(e.target.value)})}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-blue-500">
                          {diasPickerOptions.map(d => (
                            <option key={d.offset} value={d.offset}>{d.weekday} {d.date}{d.isToday ? ' (Hoy)' : ''}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Hora Inicio</label>
                        <select value={formOrden.horaInicio} onChange={e => setFormOrden({...formOrden, horaInicio:Number(e.target.value)})}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-blue-500">
                          {Array.from({length: HORAS_DIA*2}, (_,i) => {
                            const h = HORA_INI + i * 0.5;
                            return <option key={h} value={h}>{String(Math.floor(h)).padStart(2,'0')}:{h%1===0.5?'30':'00'}</option>;
                          })}
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Código OF y Prioridad */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Código OF</label>
                    <input type="text" value={formOrden.codigo||''} onChange={e => setFormOrden({...formOrden, codigo:e.target.value})} placeholder="OF-2026-105" required
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-bold font-mono text-white focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Prioridad</label>
                    <select value={formOrden.prioridad||'normal'} onChange={e => setFormOrden({...formOrden, prioridad:e.target.value})}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-indigo-500">
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
                    <select value={formOrden.ref||''} onChange={e => {
                      const nr = e.target.value;
                      const prod = listaProductos.find(p => p.codigo===nr||p.id===nr);
                      const nd   = calcDuracionEstimada(nr, formOrden.cantidad||500, listaProductos);
                      let nm = formOrden.materiales;
                      if (prod && Array.isArray(prod.bom) && prod.bom.length > 0)
                        nm = prod.bom.map(b => `${b.descripcion||b.codigo} (x${Math.round((b.factor||1)*(formOrden.cantidad||500))})`).join(', ');
                      setFormOrden({...formOrden, ref:nr, cliente:prod?.cliente||formOrden.cliente||'', duracion:nd, materiales:nm});
                    }} required
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-indigo-500 font-mono">
                      <option value="">-- Seleccionar producto --</option>
                      {listaProductos.map(p => <option key={p.id||p.codigo} value={p.codigo}>{p.codigo} — {p.descripcion||p.familia||''}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Cliente / Destino</label>
                    <input type="text" value={formOrden.cliente||''} onChange={e => setFormOrden({...formOrden, cliente:e.target.value})} placeholder="Cliente" required
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-indigo-500" />
                  </div>
                </div>

                {/* Cantidad, Duración, Fecha */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Cantidad (uds)</label>
                    <input type="number" min="1" value={formOrden.cantidad||500} onChange={e => {
                      const nc = Number(e.target.value);
                      setFormOrden({...formOrden, cantidad:nc, duracion:calcDuracionEstimada(formOrden.ref, nc, listaProductos)});
                    }} required className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Duración est. (h)</label>
                    <input type="number" min="0.5" step="0.5" value={formOrden.duracion||0} onChange={e => setFormOrden({...formOrden, duracion:Number(e.target.value)})} required
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Fecha Límite</label>
                    <input type="text" value={formOrden.fechaCompromiso||''} onChange={e => setFormOrden({...formOrden, fechaCompromiso:e.target.value})} placeholder="DD/MM/YYYY"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-indigo-500 font-mono" />
                  </div>
                </div>

                {/* Materiales */}
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Especificación de Materiales</label>
                  <textarea rows={2} value={formOrden.materiales||''} onChange={e => setFormOrden({...formOrden, materiales:e.target.value})} placeholder="Componentes, BOM..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 mb-2" />

                  {/* BOM table */}
                  {(() => {
                    const dm = calcularDisponibilidadOrden(formOrden, listaMateriales, listaProductos, mapaConsumo);
                    if (!dm.componentes || dm.componentes.length === 0) return null;
                    return (
                      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                          <span className="text-[11px] font-black text-white flex items-center gap-1.5"><Package className="w-3.5 h-3.5 text-indigo-400" /> Bill of Materials (BOM)</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${dm.colorBadge}`}>{dm.label}</span>
                        </div>
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="text-slate-500 border-b border-slate-800/60 text-[10px]">
                              <th className="pb-1.5">Componente</th><th className="pb-1.5 text-right">Nec.</th>
                              <th className="pb-1.5 text-right">Disp.</th><th className="pb-1.5 text-center">Estado</th>
                              <th className="pb-1.5 text-right">Acción</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/40">
                            {dm.componentes.map((comp,idx) => (
                              <tr key={idx} className="hover:bg-slate-900/40">
                                <td className="py-1.5 font-bold text-slate-300">{comp.nombre}</td>
                                <td className="py-1.5 text-right font-mono text-slate-300">{comp.necesario} {comp.unidad}</td>
                                <td className={`py-1.5 text-right font-mono font-bold ${comp.estadoItem==='Falta'?'text-red-400':'text-emerald-400'}`}>{comp.disponible} {comp.unidad}</td>
                                <td className="py-1.5 text-center">
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${comp.estadoItem==='Falta'?'bg-red-500/20 text-red-400 border border-red-500/30':comp.estadoItem==='Ajustado'?'bg-amber-500/20 text-amber-400 border border-amber-500/30':'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                                    {comp.estadoItem==='Falta'?'🔴 Falta':comp.estadoItem==='Ajustado'?'🟡 Ajustado':'🟢 Ok'}
                                  </span>
                                </td>
                                <td className="py-1.5 text-right">
                                  <Link to={`/materias-primas?codigo=${comp.codigo}`} className="text-indigo-400 hover:text-indigo-300 underline font-mono text-[11px]">Aprovisionar →</Link>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </div>

                {/* Color selector */}
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Color de la orden</label>
                  <div className="flex items-center gap-2 py-1">
                    {COLORS.map(color => (
                      <button key={color} type="button" onClick={() => setFormOrden({...formOrden, color})}
                        className={`w-7 h-7 rounded-lg transition-transform ${formOrden.color===color?'scale-125 ring-2 ring-white shadow-lg':'opacity-60 hover:opacity-100'}`}
                        style={{ backgroundColor: color }} />
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  <div className="flex items-center gap-2">
                    {modalMode === 'edit' && (
                      <button type="button" onClick={handleDelete} disabled={saving}
                        className="px-3.5 py-2 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all">
                        <Trash2 className="w-3.5 h-3.5" /> Eliminar
                      </button>
                    )}
                    {modalMode === 'edit' && !formOrden.sinAsignar && (
                      <button type="button" onClick={handleDevolverABacklog} disabled={saving}
                        className="px-3.5 py-2 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all">
                        <ArrowLeftCircle className="w-3.5 h-3.5" /> Devolver a Backlog
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-black transition-all">Cancelar</button>
                    <button type="submit" disabled={saving} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-lg shadow-indigo-900/40 transition-all">
                      <Check className="w-3.5 h-3.5" /> {saving ? 'Guardando...' : formOrden.sinAsignar ? 'Guardar en Backlog' : 'Guardar y Asignar'}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL BLOQUEO D&D / SUPERVISOR OVERRIDE (preserved)
      ══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {blockedDropInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ opacity:0, scale:0.9, y:10 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.9, y:10 }}
              className="card p-6 max-w-md w-full bg-slate-900 border-2 border-red-500/80 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-red-500 animate-bounce" />
                  {blockedDropInfo.motivo==='calidad' ? 'Bloqueo por Retención de Calidad' :
                   blockedDropInfo.motivo==='mantenimiento' ? 'Bloqueo por Mantenimiento Crítico' :
                   blockedDropInfo.motivo==='ambos' ? 'Bloqueo por Stock / Mantenimiento / Calidad' :
                   'Bloqueo por Stock Crítico'}
                </h3>
                <button onClick={() => setBlockedDropInfo(null)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="bg-red-950/40 border border-red-500/40 rounded-xl p-3 text-xs text-red-200 space-y-2">
                <p className="font-bold">⚠️ No se puede programar la orden <span className="font-mono text-white">{blockedDropInfo.orden.codigo||blockedDropInfo.orden.ref}</span> en la línea seleccionada.</p>
                {(blockedDropInfo.motivo==='material'||blockedDropInfo.motivo==='ambos'||!blockedDropInfo.motivo) && (
                  <p className="text-[11px] text-red-300">• El semáforo está en <strong className="text-white">🔴 Falta Crítica</strong> de materias primas. La asignación fue bloqueada para prevenir paradas.</p>
                )}
                {(blockedDropInfo.motivo==='mantenimiento'||blockedDropInfo.motivo==='ambos') && (
                  <p className="text-[11px] text-red-300">• La línea tiene una OT crítica abierta: <strong className="text-white">{(blockedDropInfo.otsCriticas||[]).map(ot=>ot.titulo||'Incidencia').join(' / ')}</strong>.</p>
                )}
                {(blockedDropInfo.motivo==='calidad'||blockedDropInfo.motivo==='ambos') && (
                  <p className="text-[11px] text-red-300">• La línea tiene una Retención de Calidad (Hold) activa: <strong className="text-white">{(blockedDropInfo.retencionesCalidad||[]).map(r=>r.motivo||'QC Hold').join(' / ')}</strong>.</p>
                )}
              </div>
              <div className="flex items-center justify-between pt-2">
                <button onClick={() => setBlockedDropInfo(null)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-black">Cancelar Asignación</button>
                <button onClick={handleConfirmBlockedDrop} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black flex items-center gap-2 border border-red-400/50">
                  <ShieldAlert className="w-4 h-4" /> Forzar Asignación (Supervisor)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL ASIGNACIÓN RÁPIDA (preserved)
      ══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {assignModalOpen && assignOrden && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div initial={{ opacity:0, scale:0.95, y:10 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95, y:10 }}
              className="card p-5 max-w-sm w-full bg-slate-900 border border-slate-700 shadow-2xl">
              <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-indigo-400" /> Asignar Orden al Gantt
                </h3>
                <button onClick={() => setAssignModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"><X className="w-4 h-4" /></button>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 mb-4">
                <p className="text-xs font-black text-white">{assignOrden.ref}</p>
                <p className="text-[11px] text-slate-400">{assignOrden.cliente} · {assignOrden.cantidad} uds · {assignOrden.duracion}h</p>
              </div>
              <form onSubmit={handleConfirmQuickAssign} className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Línea</label>
                  <select value={assignForm.linea} onChange={e => setAssignForm({...assignForm, linea:e.target.value})}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-blue-500">
                    {lineas.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Día</label>
                    <select value={assignForm.dia} onChange={e => setAssignForm({...assignForm, dia:Number(e.target.value)})}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-blue-500">
                      {diasPickerOptions.map(d => <option key={d.offset} value={d.offset}>{d.weekday} {d.date}{d.isToday?' (Hoy)':''}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Hora Inicio</label>
                    <select value={assignForm.horaInicio} onChange={e => setAssignForm({...assignForm, horaInicio:Number(e.target.value)})}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-blue-500">
                      {Array.from({length:HORAS_DIA*2},(_,i)=>{
                        const h=HORA_INI+i*0.5;
                        return <option key={h} value={h}>{String(Math.floor(h)).padStart(2,'0')}:{h%1===0.5?'30':'00'}</option>;
                      })}
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <button type="button" onClick={() => setAssignModalOpen(false)} className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-black">Cancelar</button>
                  <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-lg shadow-blue-900/40">
                    <Check className="w-3.5 h-3.5" /> {saving ? 'Asignando...' : 'Confirmar Asignación'}
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
