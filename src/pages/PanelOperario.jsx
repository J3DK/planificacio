import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Factory, Play, Pause, AlertTriangle, CheckCircle2, Package,
  Wrench, Clock, Plus, Minus, Send, RefreshCw, Cpu, UserCheck,
  ShieldAlert, Sparkles, Check, X, AlertOctagon, ArrowRight,
  ClipboardList, HelpCircle, LogOut, Maximize2, Lock,
  History, BoxesIcon, Edit2, Trash2, Save, XCircle, TrendingUp,
  BarChart2, Activity, Filter, ChevronDown, CheckSquare, Users, Key, ShieldCheck
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';
import {
  fetchLineas, updateLinea,
  fetchParadas, insertParada, updateParada,
  fetchMateriasPrimas, updateMaterial,
  fetchCalidad, insertCalidad,
  fetchSecuencia, updateSecuencia,
  insertAlerta,
  fetchOperarios, updateOperario, registrarHistorialOperario, getCurrentShiftInfo, restoreOperariosCatalog, fetchOrdenesTrabajo,
  getChecklistTemplates, insertChecklistEjecucion
} from '@/services/dataService';

export default function PanelOperario() {
  const navigate = useNavigate();
  // Configuración del Puesto / Operario
  const [lineaSelId, setLineaSelId] = useState('L1');
  const [turnoSel, setTurnoSel] = useState(() => getCurrentShiftInfo().shift);
  const [operarioNombre, setOperarioNombre] = useState('Carlos Mendoza');
  const [operarioSelId, setOperarioSelId] = useState('OP-001');
  const [modalOperarioOpen, setModalOperarioOpen] = useState(false);
  const [pinLoginActivo, setPinLoginActivo] = useState(false); // Modo login por PIN (preparado)
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [warningPermisoOpen, setWarningPermisoOpen] = useState(false);
  const [warningPermisoLineaOpen, setWarningPermisoLineaOpen] = useState(false);
  const [pendingLoginOp, setPendingLoginOp] = useState(null);
  const [pendingLineaId, setPendingLineaId] = useState(null);
  const [activeTab, setActiveTab] = useState('produccion'); // produccion | paradas | materiales | secuencia | historial | productos | cil

  // Datos en vivo de Supabase / Local
  const [lineas, setLineas] = useState([]);
  const [paradas, setParadas] = useState([]);
  const [materiales, setMateriales] = useState([]);
  const [secuencia, setSecuencia] = useState([]);
  const [operarios, setOperarios] = useState([]);
  const [allTemplates, setAllTemplates] = useState([]);
  const [selectedCilTplId, setSelectedCilTplId] = useState('');
  const [cilPoints, setCilPoints] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados modales o acciones temporales
  const [numCustomProd, setNumCustomProd] = useState('');
  const [scrapCausa, setScrapCausa] = useState('Soldadura defectuosa');
  const [scrapCantidad, setScrapCantidad] = useState(1);
  const [scrapSuccess, setScrapSuccess] = useState(false);

  // Estado para Parada de Línea
  const [paradaTipo, setParadaTipo] = useState('averia');
  const [paradaCausa, setParadaCausa] = useState('');
  const [paradaSuccess, setParadaSuccess] = useState(false);

  // Estado para Solicitud de Material
  const [matConsumoSel, setMatConsumoSel] = useState(null);
  const [matCantidadConsumo, setMatCantidadConsumo] = useState(1);
  const [matAvisoUrgente, setMatAvisoUrgente] = useState(false);

  // ─── HISTORIAL ──────────────────────────────────────────────────────────────
  const [historial, setHistorial] = useState([]);
  const [histFiltroLinea, setHistFiltroLinea] = useState('todas');
  const [histFiltroProducto, setHistFiltroProducto] = useState('todos');
  const [histFiltroTurno, setHistFiltroTurno] = useState('todos');
  const [histFiltroPeriodo, setHistFiltroPeriodo] = useState('semana'); // hoy | semana | mes

  const loadAllData = async () => {
    setLoading(true);
    const [resL, resP, resM, resS, resH, resOps, resTpl] = await Promise.all([
      fetchLineas(),
      fetchParadas(),
      fetchMateriasPrimas(),
      fetchSecuencia(),
      fetchHistorial(),
      fetchOperarios(),
      getChecklistTemplates()
    ]);
    if (resL.data) setLineas(resL.data);
    if (resP.data) setParadas(resP.data);
    if (resM.data) setMateriales(resM.data);
    if (resS.data) setSecuencia(resS.data);
    if (resH.data) setHistorial(resH.data);
    if (resTpl.data) setAllTemplates(resTpl.data);
    let opsArray = resOps.data || [];
    if (opsArray.length === 0) {
      opsArray = restoreOperariosCatalog();
    }
    setOperarios(opsArray);
    const inicial = opsArray.find(o => o.id === operarioSelId) || opsArray.find(o => o.lineaActualId === lineaSelId) || opsArray[0];
    if (inicial) {
      setOperarioSelId(inicial.id);
      setOperarioNombre(inicial.nombre);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAllData();
    const handler = () => loadAllData();
    window.addEventListener('lineas_updated', handler);
    window.addEventListener('paradas_updated', handler);
    window.addEventListener('materiales_updated', handler);
    window.addEventListener('secuencia_updated', handler);
    window.addEventListener('secuencia_reordenada', handler);
    window.addEventListener('productos_updated', handler);
    window.addEventListener('produccion_updated', handler);
    window.addEventListener('mantenimiento_updated', handler);
    window.addEventListener('operarios_updated', handler);
    window.addEventListener('checklists_updated', handler);
    return () => {
      window.removeEventListener('lineas_updated', handler);
      window.removeEventListener('paradas_updated', handler);
      window.removeEventListener('materiales_updated', handler);
      window.removeEventListener('secuencia_updated', handler);
      window.removeEventListener('secuencia_reordenada', handler);
      window.removeEventListener('productos_updated', handler);
      window.removeEventListener('produccion_updated', handler);
      window.removeEventListener('mantenimiento_updated', handler);
      window.removeEventListener('operarios_updated', handler);
      window.removeEventListener('checklists_updated', handler);
    };
  }, []);

  // ─── FILTROS DE HISTORIAL ────────────────────────────────────────────────────
  const historialFiltrado = useMemo(() => {
    const hoy = '2026-07-14'; // fecha de demo
    const hace7 = '2026-07-07';
    const hace30 = '2026-06-14';
    return historial.filter(r => {
      if (histFiltroLinea !== 'todas' && r.linea !== histFiltroLinea) return false;
      if (histFiltroProducto !== 'todos' && r.producto !== histFiltroProducto) return false;
      if (histFiltroTurno !== 'todos' && r.turno !== histFiltroTurno) return false;
      if (histFiltroPeriodo === 'hoy'   && r.fecha !== hoy)    return false;
      if (histFiltroPeriodo === 'semana' && r.fecha < hace7)   return false;
      if (histFiltroPeriodo === 'mes'    && r.fecha < hace30)  return false;
      return true;
    });
  }, [historial, histFiltroLinea, histFiltroProducto, histFiltroTurno, histFiltroPeriodo]);

  const histKpis = useMemo(() => {
    if (!historialFiltrado.length) return { producido: 0, oee: 0, calidad: 0, paradas: 0 };
    const producido = historialFiltrado.reduce((s, r) => s + r.producido, 0);
    const oee = historialFiltrado.reduce((s, r) => s + r.oee, 0) / historialFiltrado.length;
    const calidad = historialFiltrado.reduce((s, r) => s + r.calidad, 0) / historialFiltrado.length;
    const paradas = historialFiltrado.reduce((s, r) => s + r.paradas, 0);
    return { producido, oee: oee.toFixed(1), calidad: calidad.toFixed(1), paradas };
  }, [historialFiltrado]);

  // ─── HELPER FUNCIONES DE LOGIN REAL Y VINCULACIÓN DE LÍNEA ───────────────────
  const opTienePermisoEnLinea = (op, lId) => {
    if (!op || !lId) return true;
    const enLineas = Array.isArray(op.lineas) && op.lineas.includes(lId);
    const enPermisos = Array.isArray(op.permisos) && op.permisos.some(p => p.equipoId === lId);
    const esRolGeneral = ['jefe de línea', 'electromecánico', 'mantenimiento', 'inspector', 'supervisor', 'coordinador'].some(r => (op.rol || '').toLowerCase().includes(r));
    return enLineas || enPermisos || esRolGeneral;
  };

  const handleSelectOperarioClick = (op) => {
    if (pinLoginActivo && op.pin && pinInput !== op.pin) {
      setPinError(true);
      return;
    }
    if (!opTienePermisoEnLinea(op, lineaSelId)) {
      setPendingLoginOp(op);
      setWarningPermisoOpen(true);
      return;
    }
    ejecutarLoginOperario(op, lineaSelId);
  };

  const ejecutarLoginOperario = async (op, targetLineaId) => {
    setOperarioSelId(op.id);
    setOperarioNombre(op.nombre);
    setModalOperarioOpen(false);
    setWarningPermisoOpen(false);
    setPendingLoginOp(null);

    await updateOperario(op.id, { lineaActualId: targetLineaId });
    const lObj = lineas.find(l => l.id === targetLineaId);
    await registrarHistorialOperario(op.id, {
      tipo: 'turno_inicio',
      descripcion: `Inicio de turno ${turnoSel} en ${lObj?.nombre || targetLineaId} como ${op.rol || 'Operario'}`,
      linea: targetLineaId,
      piezas: 0
    });
    window.dispatchEvent(new CustomEvent('operarios_updated'));
  };

  const handleCambioLinea = async (nuevaLineaId) => {
    if (!operarioSelId) {
      setLineaSelId(nuevaLineaId);
      return;
    }
    const op = operarios.find(o => o.id === operarioSelId);
    if (op && !opTienePermisoEnLinea(op, nuevaLineaId)) {
      setPendingLineaId(nuevaLineaId);
      setWarningPermisoLineaOpen(true);
      return;
    }
    await ejecutarCambioLinea(nuevaLineaId);
  };

  const ejecutarCambioLinea = async (nuevaLineaId) => {
    const lAnt = lineaSelId;
    setLineaSelId(nuevaLineaId);
    setWarningPermisoLineaOpen(false);
    setPendingLineaId(null);

    if (operarioSelId) {
      await updateOperario(operarioSelId, { lineaActualId: nuevaLineaId });
      const lObj = lineas.find(l => l.id === nuevaLineaId);
      await registrarHistorialOperario(operarioSelId, {
        tipo: 'cambio_linea',
        descripcion: `Cambio de puesto de ${lAnt} a ${lObj?.nombre || nuevaLineaId} durante turno ${turnoSel}`,
        linea: nuevaLineaId,
        piezas: histKpis?.producido || 0
      });
      window.dispatchEvent(new CustomEvent('operarios_updated'));
    }
  };

  const handleCerrarTurno = async (e) => {
    if (e) e.stopPropagation();
    if (operarioSelId) {
      const op = operarios.find(o => o.id === operarioSelId);
      const lObj = lineas.find(l => l.id === lineaSelId);
      await registrarHistorialOperario(operarioSelId, {
        tipo: 'turno_fin',
        descripcion: `Cierre de turno ${turnoSel} en ${lObj?.nombre || lineaSelId} por ${op?.nombre || 'Operario'} (${histKpis?.producido || 0} uds producidas)`,
        linea: lineaSelId,
        piezas: histKpis?.producido || 0
      });
      await updateOperario(operarioSelId, { lineaActualId: null });
      window.dispatchEvent(new CustomEvent('operarios_updated'));
    }
    setOperarioSelId('');
    setOperarioNombre('Seleccionar Operario');
    setPinInput('');
    setPinError(false);
    setModalOperarioOpen(true);
  };

  // Datos agrupados por fecha para gráfico de barras
  const histGrafico = useMemo(() => {
    const byDate = {};
    historialFiltrado.forEach(r => {
      if (!byDate[r.fecha]) byDate[r.fecha] = { fecha: r.fecha, dia: r.dia, producido: 0, objetivo: 0, oeeSum: 0, count: 0 };
      byDate[r.fecha].producido += r.producido;
      byDate[r.fecha].objetivo  += r.objetivo;
      byDate[r.fecha].oeeSum    += r.oee;
      byDate[r.fecha].count     += 1;
    });
    return Object.values(byDate)
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
      .map(d => ({ ...d, oee: parseFloat((d.oeeSum / d.count).toFixed(1)), label: `${d.dia} ${d.fecha.slice(5)}` }));
  }, [historialFiltrado]);

  // Productos únicos para el filtro de historial
  const productosUnicos = useMemo(() => [...new Set(historial.map(r => r.producto))], [historial]);

  // Línea actualmente seleccionada
  const lineaActiva = lineas.find(l => l.id === lineaSelId) || {
    id: lineaSelId,
    nombre: `Línea ${lineaSelId.replace('L','')}`,
    estado: 'en_marcha',
    produccionHoy: 0,
    objetivoHoy: 240,
    oee: 85,
    calidad: 98,
    producto: 'BAT-48V-100Ah',
    cliente: 'Cliente General'
  };

  // Parada abierta actual en esta línea (si existe)
  const paradaAbierta = paradas.find(
    p => p.linea.toLowerCase().includes(lineaActiva.nombre.toLowerCase()) && p.estado === 'abierta'
  );

  const ordenActiva = useMemo(() => {
    return secuencia.find(o => o.lineaId === lineaSelId && o.estado === 'en_curso')
        || secuencia.find(o => o.lineaId === lineaSelId)
        || { codigo: 'OF-CIL-001', ref: lineaActiva.producto || 'BAT-48V-100Ah' };
  }, [secuencia, lineaSelId, lineaActiva.producto]);

  const cilTemplates = useMemo(() => {
    return allTemplates.filter(t => {
      if (t.categoria !== 'cil' || !t.activo) return false;
      if (t.aplicaA?.tipo === 'general') return true;
      const ids = t.aplicaA?.ids || [];
      return ids.includes(lineaSelId) || ids.includes(lineaActiva.nombre);
    });
  }, [allTemplates, lineaSelId, lineaActiva.nombre]);

  const cilFallbackTemplate = useMemo(() => ({
    id: 'CHK-CIL-FB',
    nombre: 'Pauta Estándar de Limpieza, Inspección y Lubricación (CIL)',
    categoria: 'cil',
    items: [
      { id: 1, text: 'Limpieza general de virutas, polvo y residuos del área de trabajo del operario', critico: false },
      { id: 2, text: 'Inspección de fugas en racores neumáticos y conductos hidráulicos principales', critico: true },
      { id: 3, text: 'Verificación de engrase y lubricación en guías lineales y husillos mecánicos', critico: true },
      { id: 4, text: 'Comprobación visual de botoneras de emergencia (setas rojas) y barreras ópticas', critico: true },
      { id: 5, text: 'Vaciado de bandejas colectoras y purga de condensados de la instalación de aire', critico: false }
    ]
  }), []);

  const activeCilTemplate = useMemo(() => {
    return cilTemplates.find(t => t.id === selectedCilTplId) || cilFallbackTemplate;
  }, [cilTemplates, selectedCilTplId, cilFallbackTemplate]);

  useEffect(() => {
    if (cilTemplates.length > 0) {
      if (!selectedCilTplId || !cilTemplates.some(t => t.id === selectedCilTplId)) {
        setSelectedCilTplId(cilTemplates[0].id);
      }
    } else {
      setSelectedCilTplId('');
    }
  }, [cilTemplates, selectedCilTplId]);

  useEffect(() => {
    if (activeCilTemplate && activeCilTemplate.items) {
      setCilPoints(
        activeCilTemplate.items.map((it, idx) => ({
          id: it.id || idx + 1,
          text: it.texto || it.text,
          status: 'OK',
          critico: it.critico || false
        }))
      );
    }
  }, [activeCilTemplate]);

  const toggleCilPoint = (id, newStatus) => {
    setCilPoints(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
  };

  const hasCilNoOk = useMemo(() => cilPoints.some(p => p.status === 'No OK'), [cilPoints]);
  const firstCilNoOkPoint = useMemo(() => cilPoints.find(p => p.status === 'No OK'), [cilPoints]);

  const handlePrecargarAveriaCIL = (punto) => {
    setScrapCausa(`Incidencia en CIL: ${punto.text.slice(0, 60)}...`);
    setActiveTab('paradas');
  };

  const handleRegistrarEjecucionCIL = async () => {
    await insertChecklistEjecucion({
      templateId: activeCilTemplate.id,
      templateNombre: activeCilTemplate.nombre,
      categoria: 'cil',
      linea: lineaActiva.nombre,
      operarioId: operarioNombre,
      ordenId: ordenActiva.codigo || ordenActiva.ref,
      huboIncidenciaCritica: cilPoints.some(p => p.status === 'No OK' && p.critico),
      resultados: cilPoints.map(p => ({
        itemId: p.id,
        texto: p.text,
        estado: p.status,
        critico: p.critico
      }))
    });
    alert(`⚡ Checklist CIL ("${activeCilTemplate.nombre}") finalizado y firmado en el historial central por ${operarioNombre}.`);
  };

  // ─── 1. ACCIONES DE PRODUCCIÓN ──────────────────────────────────────────────

  const sumarProduccion = async (cantidad) => {
    const nuevaProd = Number(lineaActiva.produccionHoy || 0) + Number(cantidad);
    const newOEE = Math.min(100, Math.round((nuevaProd / (lineaActiva.objetivoHoy || 240)) * 95));
    
    // Actualización local inmediata (Optimistic UI)
    setLineas(prev => prev.map(l => l.id === lineaSelId ? { ...l, produccionHoy: nuevaProd, oee: newOEE } : l));

    // Guardar en Supabase
    await updateLinea(lineaSelId, { ...lineaActiva, produccionHoy: nuevaProd, oee: newOEE });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('produccion_updated'));
      window.dispatchEvent(new CustomEvent('lineas_updated'));
      window.dispatchEvent(new CustomEvent('productos_updated'));
    }
  };

  const declararScrap = async () => {
    if (!scrapCantidad || scrapCantidad <= 0) return;
    
    // Insertar defecto en calidad
    await insertCalidad({
      causa: `${scrapCausa} (${lineaActiva.nombre} - ${operarioNombre})`,
      cantidad: Number(scrapCantidad),
      pct: 5
    });

    // Bajar ligeramente el % de calidad en la línea
    const nuevaCalidad = Math.max(70, Number(lineaActiva.calidad || 98) - 0.5);
    setLineas(prev => prev.map(l => l.id === lineaSelId ? { ...l, calidad: Number(nuevaCalidad.toFixed(1)) } : l));
    await updateLinea(lineaSelId, { ...lineaActiva, calidad: Number(nuevaCalidad.toFixed(1)) });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('produccion_updated'));
      window.dispatchEvent(new CustomEvent('lineas_updated'));
      window.dispatchEvent(new CustomEvent('calidad_updated'));
    }

    setScrapSuccess(true);
    setTimeout(() => setScrapSuccess(false), 2500);
    setScrapCantidad(1);
  };

  // ─── 2. ACCIONES DE PARADAS & REANUDACIÓN ───────────────────────────────────

  const declararParadaLinea = async () => {
    if (!paradaCausa.trim()) {
      alert('Por favor especifica el motivo o descripción rápida de la parada');
      return;
    }

    const horaInicio = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const nuevaParada = {
      linea: lineaActiva.nombre,
      inicio: horaInicio,
      fin: null,
      duracion: 0,
      tipo: paradaTipo,
      causa: `${paradaCausa} (Declarado por ${operarioNombre})`,
      impacto: 25,
      estado: 'abierta',
      id: Date.now()
    };

    // Crear parada en BD
    await insertParada(nuevaParada);
    setParadas(prev => [nuevaParada, ...prev]);

    // Poner la línea en estado 'parada' o 'averia'
    const nuevoEstado = paradaTipo === 'averia' ? 'parada' : paradaTipo === 'mantenimiento' ? 'mantenimiento' : 'parada';
    setLineas(prev => prev.map(l => l.id === lineaSelId ? { ...l, estado: nuevoEstado, motivoParada: paradaCausa } : l));
    await updateLinea(lineaSelId, { ...lineaActiva, estado: nuevoEstado, motivoParada: paradaCausa });

    // Enviar alerta crítica si es avería o falta material
    if (paradaTipo === 'averia' || paradaCausa.toLowerCase().includes('material')) {
      await insertAlerta({
        tipo: 'critica',
        icono: 'Wrench',
        titulo: `Línea Detenida: ${lineaActiva.nombre}`,
        descripcion: `Motivo: ${paradaCausa}. Operario: ${operarioNombre}`,
        modulo: 'paradas',
        linea: lineaActiva.nombre,
        timestamp: new Date().toISOString(),
        leida: false
      });
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('paradas_updated'));
      window.dispatchEvent(new CustomEvent('lineas_updated'));
      if (paradaTipo === 'averia' || paradaTipo === 'mantenimiento') {
        window.dispatchEvent(new CustomEvent('mantenimiento_updated'));
      }
    }

    setParadaSuccess(true);
    setTimeout(() => setParadaSuccess(false), 2500);
    setParadaCausa('');
  };

  const reanudarLinea = async () => {
    if (!paradaAbierta) return;

    // Verificar si la parada tiene una OT de Mantenimiento vinculada o abierta
    const { data: ots = [] } = await fetchOrdenesTrabajo();
    const otVinculada = ots.find(o => String(o.paradaId) === String(paradaAbierta.id) || o.id === paradaAbierta.otId || o.codigo === paradaAbierta.otAsignada);

    if (otVinculada && otVinculada.estado !== 'completada' && otVinculada.estado !== 'cerrada') {
      alert(`🔒 Esta parada está vinculada a la Orden de Trabajo abierta [${otVinculada.codigo}] en el módulo de Mantenimiento.\n\n⚠️ Si la OT permanece abierta, no puede cerrarla un operario. Solo Mantenimiento puede completarla y resolver la parada.`);
      return;
    } else if (paradaAbierta.otAsignada || paradaAbierta.otId || otVinculada) {
      alert(`🔒 Esta parada tiene asignada la Orden de Trabajo (${paradaAbierta.otAsignada || paradaAbierta.otId || otVinculada?.codigo}).\n\n⚠️ Solo el personal del módulo de Mantenimiento está autorizado para cerrar paradas que tienen una OT asignada.`);
      return;
    }

    // Calcular duración estimada (15 min si no se puede calcular)
    const horaActual = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const dur = 20; // estimado rapido

    const paradaCerrada = { ...paradaAbierta, fin: horaActual, duracion: dur, estado: 'cerrada' };
    
    // Cerrar en BD
    await updateParada(paradaAbierta.id, paradaCerrada);
    setParadas(prev => prev.map(p => p.id === paradaAbierta.id ? paradaCerrada : p));

    // Devolver línea a estado 'en_marcha'
    setLineas(prev => prev.map(l => l.id === lineaSelId ? { ...l, estado: 'en_marcha', motivoParada: null } : l));
    await updateLinea(lineaSelId, { ...lineaActiva, estado: 'en_marcha', motivoParada: null });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('paradas_updated'));
      window.dispatchEvent(new CustomEvent('lineas_updated'));
    }
  };

  // ─── 3. ACCIONES DE ALMACÉN / CONSUMO ───────────────────────────────────────

  const consumirMaterial = async (mat, cantidad) => {
    const qty = Number(cantidad) || 1;
    const stockActual = Number(mat.stockActual || mat.stock_actual || 0);
    const nuevoStock = Math.max(0, stockActual - qty);

    setMateriales(prev => prev.map(m => m.id === mat.id ? { ...m, stockActual: nuevoStock } : m));
    await updateMaterial(mat.id, { ...mat, stockActual: nuevoStock });

    // Si baja del stock mínimo, crear alerta
    const stockMin = Number(mat.stockMinimo || mat.stock_minimo || 0);
    if (nuevoStock < stockMin) {
      await insertAlerta({
        tipo: 'critica',
        icono: 'Package',
        titulo: `Ruptura de Stock en Línea — ${mat.codigo}`,
        descripcion: `El stock actual de "${mat.descripcion}" es de ${nuevoStock} ${mat.unidad} (Mínimo: ${stockMin}). Consumido en ${lineaActiva.nombre}.`,
        modulo: 'materias_primas',
        linea: lineaActiva.nombre,
        timestamp: new Date().toISOString(),
        leida: false
      });
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('materiales_updated'));
      window.dispatchEvent(new CustomEvent('bom_updated'));
    }
  };

  const solicitarMaterialUrgente = async (mat) => {
    await insertAlerta({
      tipo: 'critica',
      icono: 'AlertTriangle',
      titulo: `🚨 SOLICITUD URGENTE DE ALMACÉN`,
      descripcion: `${operarioNombre} solicita reposición INMEDIATA de: ${mat.codigo} — ${mat.descripcion} para la ${lineaActiva.nombre}.`,
      modulo: 'materias_primas',
      linea: lineaActiva.nombre,
      timestamp: new Date().toISOString(),
      leida: false
    });
    setMatAvisoUrgente(true);
    setTimeout(() => setMatAvisoUrgente(false), 3000);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('materiales_updated'));
    }
  };

  // ─── 4. ACCIONES DE SECUENCIA ───────────────────────────────────────────────

  const avanzarOrdenSecuencia = async (orden, extraProgreso) => {
    const nuevoProgreso = Math.min(100, Number(orden.progreso || 0) + extraProgreso);
    const nuevoEstado = nuevoProgreso >= 100 ? 'a_tiempo' : orden.estado;
    
    setSecuencia(prev => prev.map(o => o.id === orden.id ? { ...o, progreso: nuevoProgreso, estado: nuevoEstado } : o));
    await updateSecuencia(orden.id, { ...orden, progreso: nuevoProgreso, estado: nuevoEstado });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('secuencia_updated'));
      window.dispatchEvent(new CustomEvent('secuencia_reordenada'));
      window.dispatchEvent(new CustomEvent('planificacion_updated'));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 lg:p-6 select-none space-y-6">
      {/* ── BARRA SUPERIOR DEL PUESTO / OPERARIO (MODO KIOSKO INDEPENDIENTE) ── */}
      <div className="bg-slate-900 border-2 border-blue-500/40 rounded-3xl p-5 shadow-2xl flex flex-col xl:flex-row items-center justify-between gap-4">
        <div className="flex items-center justify-between w-full xl:w-auto gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border-2 border-blue-500/50 flex items-center justify-center text-blue-400 flex-shrink-0 shadow-lg shadow-blue-900/30">
              <Cpu className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-blue-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider shadow-sm">
                  ⚡ MODO PLANTA — TERMINAL INDEPENDIENTE
                </span>
                <span className="text-xs text-slate-400 font-mono">v2.5 Fullscreen</span>
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight mt-0.5">Panel de Operario & Captura Manual</h2>
            </div>
          </div>

          {/* Botón Salir para móvil */}
          <button
            onClick={() => navigate('/')}
            className="xl:hidden px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all"
            title="Volver a la gestión general MES Admin"
          >
            <LogOut className="w-3.5 h-3.5 text-amber-400" />
            Admin MES
          </button>
        </div>

        {/* Selectores rápidos de puesto */}
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-end">
          {/* Línea */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl px-3 py-1.5 flex items-center gap-2">
            <Factory className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold text-slate-400 uppercase">Puesto:</span>
            <select
              value={lineaSelId}
              onChange={e => handleCambioLinea(e.target.value)}
              className="bg-transparent text-white font-black text-sm focus:outline-none cursor-pointer"
            >
              {lineas.map(l => (
                <option key={l.id} value={l.id} className="bg-slate-900 text-white font-bold">
                  {l.nombre} ({l.estado ? l.estado.toUpperCase() : 'OK'})
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

          {/* Operario Interactivo */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => { setPinInput(''); setPinError(false); setModalOperarioOpen(true); }}
              className="bg-slate-800/90 hover:bg-slate-700 border border-slate-700 hover:border-amber-500/50 rounded-2xl px-3 py-1.5 flex items-center gap-2.5 transition-all active:scale-95 group text-left shadow-lg"
              title="Seleccionar o cambiar operario del puesto / Login PIN"
            >
              {(() => {
                const opActivo = operarios.find(o => o.id === operarioSelId) || { nombre: operarioNombre, rol: 'Operario' };
                return (
                  <>
                    {opActivo.avatar ? (
                      <img src={opActivo.avatar} alt={opActivo.nombre} className="w-7 h-7 rounded-xl object-cover border border-amber-500/60 shadow-sm" />
                    ) : (
                      <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black text-xs">
                        {opActivo.nombre?.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-white group-hover:text-amber-300 transition-colors leading-none">{opActivo.nombre}</span>
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {opActivo.rol || 'Operario'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                        <span>Cambiar operario</span>
                        <span className="text-[9px] text-purple-400 font-mono font-bold">(PIN Login)</span>
                      </p>
                    </div>
                  </>
                );
              })()}
            </button>
            <button
              onClick={handleCerrarTurno}
              className="p-2.5 rounded-2xl bg-slate-800/90 hover:bg-red-600/20 border border-slate-700 hover:border-red-500/50 text-slate-400 hover:text-red-400 transition-all active:scale-95 shadow-lg flex items-center justify-center"
              title="Cerrar turno y desvincular operario de la línea en vivo"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Refrescar */}
          <button
            onClick={loadAllData}
            disabled={loading}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl border border-slate-700 transition-all active:scale-95"
            title="Refrescar datos del sistema"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Botón Volver a Portal Admin MES (Para PC/Desktop) */}
          <button
            onClick={() => navigate('/')}
            className="hidden xl:flex px-4 py-2.5 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 hover:text-amber-200 text-xs font-black items-center gap-2 transition-all active:scale-95 shadow-lg shadow-amber-950/30"
            title="Salir del Modo Planta y volver a la administración general MES"
          >
            <Lock className="w-4 h-4 text-amber-400" />
            <span>Volver a Admin MES</span>
          </button>
        </div>
      </div>

      {/* ── BANNER SI LA LÍNEA ESTÁ DETENIDA / EN PARADA ── */}
      {lineaActiva.estado === 'parada' || lineaActiva.estado === 'averia' || paradaAbierta ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-500/15 border-2 border-red-500 rounded-3xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl shadow-red-950/40 animate-pulse"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500 flex items-center justify-center text-white flex-shrink-0 shadow-lg">
              <AlertOctagon className="w-7 h-7 animate-bounce" />
            </div>
            <div>
              <span className="badge-danger px-2.5 py-0.5 rounded-lg text-xs font-black uppercase tracking-wider">
                🛑 LÍNEA DETENIDA ACTUALMENTE
              </span>
              <h3 className="text-xl font-black text-white mt-1">
                {paradaAbierta ? paradaAbierta.causa : (lineaActiva.motivoParada || 'Avería o Incidencia Reportada en Planta')}
              </h3>
              <p className="text-xs text-red-300 font-mono mt-0.5">
                Hora Inicio Parada: {paradaAbierta ? paradaAbierta.inicio : 'Reciente'} · Estado: Esperando solución / técnico
              </p>
            </div>
          </div>

          {paradaAbierta?.otAsignada || paradaAbierta?.otId ? (
            <div className="flex flex-col items-end gap-1.5 w-full md:w-auto">
              <button
                onClick={reanudarLinea}
                className="w-full md:w-auto px-6 py-4 bg-slate-900 border border-amber-500/50 text-amber-300 hover:bg-slate-800 font-black text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2.5 transition-all flex-shrink-0"
              >
                <Lock className="w-5 h-5 text-amber-400" />
                REANUDAR BLOQUEADO (OT: {paradaAbierta.otAsignada || paradaAbierta.otId})
              </button>
              <span className="text-[10px] text-amber-400/90 font-bold max-w-xs text-right">
                🔒 Solo Mantenimiento puede resolver la OT y cerrar esta parada.
              </span>
            </div>
          ) : (
            <button
              onClick={reanudarLinea}
              className="w-full md:w-auto px-6 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-base rounded-2xl shadow-lg shadow-emerald-900/50 flex items-center justify-center gap-2 transition-all active:scale-95 flex-shrink-0"
            >
              <Play className="w-6 h-6 fill-white" />
              REANUDAR LÍNEA (CERRAR PARADA)
            </button>
          )}
        </motion.div>
      ) : null}

      {/* ── SELECTOR DE TABS / PESTAÑAS GIGANTES TÁCTILES ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {[
          { id: 'produccion', label: '1. Producción', sub: 'Declarar Fabricación', icon: Factory, color: 'blue' },
          { id: 'paradas',    label: '2. Paradas', sub: 'Reportar Avería', icon: AlertTriangle, color: 'red' },
          { id: 'materiales', label: '3. Materiales', sub: 'Registrar Consumo', icon: Package, color: 'amber' },
          { id: 'secuencia',  label: '4. Secuencia', sub: 'Cambio Referencia', icon: ClipboardList, color: 'emerald' },
          { id: 'historial',  label: '5. Historial', sub: 'Métricas pasadas', icon: History, color: 'violet' },
          { id: 'cil',        label: '6. Checklist CIL', sub: 'Limpieza e Insp.', icon: CheckSquare, color: 'cyan' },
        ].map(t => {
          const isAct = activeTab === t.id;
          const activeColors = {
            blue:    'bg-blue-600/15 border-blue-500 shadow-xl shadow-blue-900/30',
            red:     'bg-red-600/15 border-red-500 shadow-xl shadow-red-900/30',
            amber:   'bg-amber-600/15 border-amber-500 shadow-xl shadow-amber-900/30',
            emerald: 'bg-emerald-600/15 border-emerald-500 shadow-xl shadow-emerald-900/30',
            violet:  'bg-violet-600/15 border-violet-500 shadow-xl shadow-violet-900/30',
            cyan:    'bg-cyan-600/15 border-cyan-500 shadow-xl shadow-cyan-900/30',
          };
          const iconColors = {
            blue: 'bg-blue-600 text-white', red: 'bg-red-600 text-white',
            amber: 'bg-amber-600 text-white', emerald: 'bg-emerald-600 text-white',
            violet: 'bg-violet-600 text-white', cyan: 'bg-cyan-600 text-white',
          };
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`p-3 md:p-4 rounded-3xl border-2 transition-all text-left flex flex-col md:flex-row items-center gap-2 md:gap-4 ${
                isAct ? activeColors[t.color] : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-400'
              }`}
            >
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                isAct ? iconColors[t.color] : 'bg-slate-800 text-slate-400'
              }`}>
                <t.icon className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div className="text-center md:text-left">
                <h4 className={`font-black text-sm md:text-base ${isAct ? 'text-white' : 'text-slate-300'}`}>{t.label}</h4>
                <p className="text-[10px] md:text-xs text-slate-500 hidden md:block">{t.sub}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── CONTENIDO PRINCIPAL POR PESTAÑA ── */}
      <AnimatePresence mode="wait">
        {/* TAB 1: PRODUCCIÓN Y PIEZAS */}
        {activeTab === 'produccion' && (
          <motion.div
            key="tab-produccion"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* MARCADOR ACTUAL DE LA LÍNEA */}
            <div className="card p-6 lg:col-span-1 flex flex-col justify-between border-blue-500/30 bg-gradient-to-br from-blue-900/20 to-slate-900">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="badge-info px-2.5 py-1 rounded-xl text-xs font-black uppercase">Puesto Seleccionado</span>
                  <span className="text-xs font-mono text-emerald-400 font-bold">● En Conexión</span>
                </div>
                <h3 className="text-3xl font-black text-white">{lineaActiva.nombre}</h3>
                <p className="text-sm text-slate-400 mt-1 font-medium">Producto: <strong className="text-white font-mono">{lineaActiva.producto || 'BAT-48V-100Ah'}</strong></p>
                <p className="text-xs text-slate-500 mt-0.5">Cliente: {lineaActiva.cliente || 'Industrial A'}</p>
              </div>

              <div className="my-6 space-y-4 border-y border-slate-800/80 py-6">
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-400 uppercase mb-1">
                    <span>Producción Hoy / Objetivo</span>
                    <span className="text-blue-400 font-black">{Math.round(((lineaActiva.produccionHoy || 0)/(lineaActiva.objetivoHoy || 240))*100)}%</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black text-white font-mono tracking-tight">{lineaActiva.produccionHoy || 0}</span>
                    <span className="text-xl font-bold text-slate-500">/ {lineaActiva.objetivoHoy || 240} uds</span>
                  </div>
                  <div className="h-3 bg-slate-800 rounded-full overflow-hidden mt-2">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.round(((lineaActiva.produccionHoy || 0)/(lineaActiva.objetivoHoy || 240))*100))}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-slate-800/60 rounded-2xl p-3 border border-slate-700/50 text-center">
                    <span className="text-[10px] text-slate-500 font-black uppercase block">OEE Planta</span>
                    <span className="text-2xl font-black text-emerald-400 font-mono">{lineaActiva.oee || 85}%</span>
                  </div>
                  <div className="bg-slate-800/60 rounded-2xl p-3 border border-slate-700/50 text-center">
                    <span className="text-[10px] text-slate-500 font-black uppercase block">Calidad FPY</span>
                    <span className="text-2xl font-black text-blue-400 font-mono">{lineaActiva.calidad || 98}%</span>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <span className="text-xs text-slate-500">Los datos sumados en esta pantalla sincronizan al instante con las gráficas de toda la fábrica en el Dashboard</span>
              </div>
            </div>

            {/* BOTONES GIGANTES DE DECLARACIÓN DE PRODUCCIÓN & SCRAP */}
            <div className="lg:col-span-2 space-y-6">
              {/* SUMAR PIEZAS BUENAS */}
              <div className="card p-6 border-emerald-500/30 bg-gradient-to-br from-emerald-950/10 to-slate-900">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Plus className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">Declarar Fabricación (Piezas Buenas OK)</h3>
                    <p className="text-xs text-slate-400">Pulsa los botones grandes cada vez que salga un palet o lote completado</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  {[1, 5, 10, 25].map(qty => (
                    <button
                      key={qty}
                      onClick={() => sumarProduccion(qty)}
                      className="py-6 rounded-3xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-3xl shadow-xl shadow-emerald-900/40 border-2 border-emerald-400/40 flex flex-col items-center justify-center transition-all active:scale-90"
                    >
                      <span>+{qty}</span>
                      <span className="text-[11px] font-bold text-emerald-200 uppercase tracking-widest mt-0.5">Unidades OK</span>
                    </button>
                  ))}
                </div>

                {/* Ingreso manual libre */}
                <div className="flex items-center gap-3 pt-3 border-t border-slate-800">
                  <span className="text-xs font-bold text-slate-400 uppercase flex-shrink-0">Ingreso Manual:</span>
                  <input
                    type="number"
                    value={numCustomProd}
                    onChange={e => setNumCustomProd(e.target.value)}
                    placeholder="Ej: 42 uds..."
                    className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white font-bold w-full focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={() => {
                      if (numCustomProd && Number(numCustomProd) > 0) {
                        sumarProduccion(Number(numCustomProd));
                        setNumCustomProd('');
                      }
                    }}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-black text-sm transition-all active:scale-95 flex-shrink-0"
                  >
                    + Sumar Lote
                  </button>
                </div>
              </div>

              {/* DECLARAR PIEZAS DEFECTUOSAS (SCRAP) */}
              <div className="card p-6 border-amber-500/30 bg-gradient-to-br from-amber-950/10 to-slate-900">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white">Declarar Pieza Defectuosa / Scrap (Rechazo)</h3>
                      <p className="text-xs text-slate-400">Registra el defecto de calidad para trazabilidad y Pareto de rechazos</p>
                    </div>
                  </div>
                  {scrapSuccess && (
                    <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-xl text-xs font-black animate-bounce">
                      ✓ Defecto Guardado en BD
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Causa Raíz del Rechazo</label>
                    <select
                      value={scrapCausa}
                      onChange={e => setScrapCausa(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="Soldadura defectuosa / fría">🔥 Soldadura defectuosa / fría</option>
                      <option value="Aislamiento incorrecto / cortocircuito">⚡ Aislamiento incorrecto / cortocircuito</option>
                      <option value="Mal montaje de conector MC4/BMS">🔌 Mal montaje de conector MC4 / BMS</option>
                      <option value="Celda LFP con voltaje anormal / dañada">🔋 Celda LFP con voltaje anormal / dañada</option>
                      <option value="Carcasa abollada o rasguñada en línea">📦 Carcasa abollada o rasguñada en línea</option>
                      <option value="Etiquetado incorrecto o ilegible">🏷️ Etiquetado incorrecto o ilegible</option>
                      <option value="Otro defecto detectado en prueba de fin de línea">❓ Otro defecto en prueba fin de línea</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Cantidad Rechazada</label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setScrapCantidad(Math.max(1, scrapCantidad - 1))}
                        className="p-3 rounded-2xl bg-slate-800 text-slate-300 font-black hover:bg-slate-700"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={scrapCantidad}
                        onChange={e => setScrapCantidad(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-2.5 text-center text-lg font-black text-white focus:outline-none"
                      />
                      <button
                        onClick={() => setScrapCantidad(scrapCantidad + 1)}
                        className="p-3 rounded-2xl bg-slate-800 text-slate-300 font-black hover:bg-slate-700"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={declararScrap}
                  className="w-full mt-4 py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-black text-sm shadow-lg shadow-amber-900/30 flex items-center justify-center gap-2 transition-all active:scale-98"
                >
                  <AlertTriangle className="w-4 h-4" />
                  REGISTRAR DEFECTO / SCRAP EN CALIDAD
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: INCIDENCIAS & PARADAS DE LÍNEA */}
        {activeTab === 'paradas' && (
          <motion.div
            key="tab-paradas"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="card p-6 border-red-500/40 bg-gradient-to-br from-red-950/20 to-slate-900">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-red-600/20 text-red-400 flex items-center justify-center border border-red-500/30">
                    <AlertOctagon className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">Declarar Parada de Línea o Alarma de Planta</h3>
                    <p className="text-xs text-slate-400">Si la línea se detiene por avería, falta de material o calidad, repórtalo aquí para parar el cronómetro OEE</p>
                  </div>
                </div>
                {paradaSuccess && (
                  <span className="bg-red-500 text-white px-4 py-1.5 rounded-xl text-xs font-black animate-bounce shadow-lg">
                    🚨 ¡Parada y Alarma Reportada en Sistema!
                  </span>
                )}
              </div>

              {/* SELECCIÓN RÁPIDA DE TIPO DE INCIDENCIA */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
                {[
                  { id: 'averia',        label: 'Avería / Falla',        icon: Wrench,        color: 'border-red-500/40 bg-red-500/10 text-red-400' },
                  { id: 'mantenimiento', label: 'Mantenimiento',         icon: Cpu,           color: 'border-amber-500/40 bg-amber-500/10 text-amber-400' },
                  { id: 'cambio',        label: 'Cambio Referencia',     icon: RefreshCw,     color: 'border-blue-500/40 bg-blue-500/10 text-blue-400' },
                  { id: 'calidad',       label: 'Freno por Calidad',     icon: ShieldAlert,   color: 'border-purple-500/40 bg-purple-500/10 text-purple-400' },
                  { id: 'material',      label: 'Falta de Material',     icon: Package,       color: 'border-orange-500/40 bg-orange-500/10 text-orange-400' },
                ].map(tipo => (
                  <button
                    key={tipo.id}
                    onClick={() => setParadaTipo(tipo.id)}
                    className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                      paradaTipo === tipo.id ? `${tipo.color} scale-105 shadow-lg border-opacity-100` : 'bg-slate-900/60 border-slate-800 text-slate-500'
                    }`}
                  >
                    <tipo.icon className="w-6 h-6" />
                    <span className="text-xs font-black text-center">{tipo.label}</span>
                  </button>
                ))}
              </div>

              {/* BOTONES PREDEFINIDOS DE CAUSAS TÍPICAS */}
              <div className="mb-4">
                <span className="text-xs font-bold text-slate-400 uppercase block mb-2">Causas Frecuentes Rápidas (Pulsar para rellenar):</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Atasco en soldadora de celdas',
                    'Fallo en robot pick & place',
                    'Falta suministro Cable 6mm² en puesto',
                    'Revisión preventiva por calentamiento',
                    'Espera verificación control calidad FPY',
                    'Cambio de utillaje para batería 200Ah',
                    'Fallo eléctrico en cinta de salida'
                  ].map(mot => (
                    <button
                      key={mot}
                      onClick={() => setParadaCausa(mot)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-300 transition-all active:scale-95"
                    >
                      {mot}
                    </button>
                  ))}
                </div>
              </div>

              {/* INPUT DE MOTIVO DETALLADO */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Descripción y Detalles de la Incidencia</label>
                  <textarea
                    rows="3"
                    value={paradaCausa}
                    onChange={e => setParadaCausa(e.target.value)}
                    placeholder="Describe exactamente qué ha pasado, qué máquina falla o qué material se necesita en la línea..."
                    className="w-full bg-slate-900 border-2 border-slate-700 rounded-2xl p-4 text-sm font-bold text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <button
                  onClick={declararParadaLinea}
                  className="w-full py-5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-lg shadow-2xl shadow-red-950/60 flex items-center justify-center gap-3 transition-all active:scale-95 border-2 border-red-400/40"
                >
                  <AlertOctagon className="w-6 h-6 animate-pulse" />
                  🚨 DECLARAR PARADA INMEDIATA EN {lineaActiva.nombre.toUpperCase()}
                </button>
              </div>
            </div>

            {/* TABLA DE PARADAS RECIENTES EN ESTA LÍNEA */}
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-800 flex justify-between items-center">
                <h4 className="font-black text-white text-sm">Historial de Paradas y Avisos en Puesto ({lineaActiva.nombre})</h4>
                <span className="text-xs text-slate-500 font-mono">Turno Actual</span>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] text-slate-400 uppercase">
                    <th className="p-3 text-left">Hora Inicio</th>
                    <th className="p-3 text-left">Tipo</th>
                    <th className="p-3 text-left">Motivo / Causa</th>
                    <th className="p-3 text-left">Duración</th>
                    <th className="p-3 text-left">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs font-bold">
                  {paradas
                    .filter(p => p.linea.toLowerCase().includes(lineaActiva.nombre.toLowerCase()))
                    .map(p => (
                      <tr key={p.id} className={p.estado === 'abierta' ? 'bg-red-500/10' : ''}>
                        <td className="p-3 font-mono text-slate-300">{p.inicio}</td>
                        <td className="p-3 uppercase text-red-400">{p.tipo}</td>
                        <td className="p-3 text-white max-w-sm">{p.causa}</td>
                        <td className="p-3 font-mono text-slate-300">{p.duracion ? `${p.duracion} min` : '⏱️ En curso'}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${p.estado === 'abierta' ? 'badge-danger animate-pulse' : 'badge-neutral'}`}>
                            {p.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* TAB 3: CONSUMO DE MATERIALES & ALMACÉN */}
        {activeTab === 'materiales' && (
          <motion.div
            key="tab-materiales"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* AVISO URGENTE ENVIADO */}
            {matAvisoUrgente && (
              <div className="bg-amber-500/20 border-2 border-amber-500 rounded-3xl p-4 text-center text-amber-300 font-black text-sm animate-bounce">
                🚨 ¡SOLICITUD URGENTE ENVIADA A ALMACÉN Y CARRETILLERO PARA TRAER MATERIAL!
              </div>
            )}

            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-black text-white">Consumo Rápido de Componentes en Línea</h3>
                  <p className="text-xs text-slate-400">Descuenta las piezas gastadas en este lote para mantener el stock de planta cuadrado en tiempo real</p>
                </div>
              </div>

              {/* GRID DE MATERIAS PRIMAS TÁCTILES */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {materiales.map(mat => {
                  const stock = Number(mat.stockActual || mat.stock_actual || 0);
                  const stockMin = Number(mat.stockMinimo || mat.stock_minimo || 0);
                  const isCritico = stock < stockMin;

                  return (
                    <div
                      key={mat.id}
                      className={`rounded-3xl border-2 p-5 flex flex-col justify-between transition-all ${
                        isCritico
                          ? 'border-red-500/50 bg-red-500/5 shadow-lg shadow-red-950/20'
                          : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-mono text-xs font-bold text-blue-400">{mat.codigo}</span>
                          {isCritico ? (
                            <span className="badge-danger px-2 py-0.5 rounded-md text-[10px] font-black uppercase">
                              ¡Stock Bajo!
                            </span>
                          ) : (
                            <span className="badge-neutral px-2 py-0.5 rounded-md text-[10px] font-black uppercase">
                              OK
                            </span>
                          )}
                        </div>
                        <h4 className="font-black text-white text-sm line-clamp-1">{mat.descripcion}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">Unidad de medida: <strong>{mat.unidad}</strong></p>

                        <div className="my-4 pt-3 border-t border-slate-800 flex items-baseline justify-between">
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase block">Stock en Puesto</span>
                            <span className={`text-3xl font-black font-mono ${isCritico ? 'text-red-400' : 'text-emerald-400'}`}>
                              {stock}
                            </span>
                            <span className="text-xs text-slate-500 ml-1 font-bold">{mat.unidad}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-bold text-slate-600 block">Mínimo: {stockMin}</span>
                          </div>
                        </div>
                      </div>

                      {/* Botones de Consumo / Pedir */}
                      <div className="space-y-2 pt-2 border-t border-slate-800/80">
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => consumirMaterial(mat, 1)}
                            disabled={stock <= 0}
                            className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs transition-all active:scale-95 disabled:opacity-30 border border-slate-700"
                          >
                            Consumir 1 {mat.unidad}
                          </button>
                          <button
                            onClick={() => consumirMaterial(mat, 5)}
                            disabled={stock < 5}
                            className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs transition-all active:scale-95 disabled:opacity-30 border border-slate-700"
                          >
                            Consumir 5 {mat.unidad}s
                          </button>
                        </div>

                        <button
                          onClick={() => solicitarMaterialUrgente(mat)}
                          className="w-full py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 font-black text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Pedir Urgente a Almacén
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 4: SECUENCIA & ÓRDENES MTO */}
        {activeTab === 'secuencia' && (
          <motion.div
            key="tab-secuencia"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="card p-6">
              <div className="mb-4">
                <h3 className="text-xl font-black text-white">Cola de Fabricación en Secuencia MTO</h3>
                <p className="text-xs text-slate-400">Visualiza las órdenes asignadas a este turno en orden de prioridad y avanza su porcentaje según completes lotes</p>
              </div>

              <div className="space-y-4">
                {secuencia.map((orden, idx) => {
                  const isPrimera = idx === 0;
                  return (
                    <div
                      key={orden.id}
                      className={`rounded-3xl border-2 p-5 flex flex-col md:flex-row items-center justify-between gap-6 transition-all ${
                        isPrimera
                          ? 'border-blue-500 bg-gradient-to-r from-blue-950/30 to-slate-900 shadow-xl shadow-blue-950/30'
                          : 'border-slate-800 bg-slate-900/50 opacity-80'
                      }`}
                    >
                      <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg flex-shrink-0 ${
                          isPrimera ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-slate-800 text-slate-400'
                        }`}>
                          #{orden.secuencia || idx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            {isPrimera && (
                              <span className="bg-emerald-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-md">
                                ORDEN EN CURSO ACTUAL
                              </span>
                            )}
                            <span className="text-xs font-mono text-slate-400">Compromiso: {orden.fechaCompromiso || orden.fecha_compromiso}</span>
                          </div>
                          <h4 className="text-xl font-black text-white font-mono mt-0.5">{orden.referencia}</h4>
                          <p className="text-xs text-slate-400 font-medium">Cliente Asignado: <strong className="text-white">{orden.cliente}</strong></p>
                        </div>
                      </div>

                      {/* Avance */}
                      <div className="w-full md:w-64 space-y-2">
                        <div className="flex justify-between text-xs font-bold text-slate-400 uppercase">
                          <span>Progreso Fabricación</span>
                          <span className="text-white font-black">{orden.progreso || 0}%</span>
                        </div>
                        <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              orden.progreso >= 100 ? 'bg-emerald-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${orden.progreso || 0}%` }}
                          />
                        </div>
                      </div>

                      {/* Botones de Avance */}
                      <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-shrink-0">
                        <button
                          onClick={() => avanzarOrdenSecuencia(orden, 25)}
                          disabled={orden.progreso >= 100}
                          className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-blue-400 font-black text-xs border border-slate-700 transition-all active:scale-95 disabled:opacity-30"
                        >
                          +25% Avance
                        </button>
                        <button
                          onClick={() => avanzarOrdenSecuencia(orden, 100 - (orden.progreso || 0))}
                          disabled={orden.progreso >= 100}
                          className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-900/30 transition-all active:scale-95 disabled:opacity-30 flex items-center gap-1.5"
                        >
                          <Check className="w-4 h-4" />
                          Finalizar Orden
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 5: HISTORIAL */}
        {activeTab === 'historial' && (
          <motion.div
            key="tab-historial"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* PANEL DE FILTROS */}
            <div className="card p-5 border-violet-500/30 bg-gradient-to-br from-violet-950/15 to-slate-900">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center">
                  <Filter className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Filtros del Historial</h3>
                  <p className="text-xs text-slate-400">Selecciona línea, producto, turno y período para ver las métricas históricas</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* Filtro Línea */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Línea</label>
                  <select
                    value={histFiltroLinea}
                    onChange={e => setHistFiltroLinea(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-violet-500"
                  >
                    <option value="todas">Todas las líneas</option>
                    {lineas.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                  </select>
                </div>
                {/* Filtro Producto */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Producto</label>
                  <select
                    value={histFiltroProducto}
                    onChange={e => setHistFiltroProducto(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-violet-500"
                  >
                    <option value="todos">Todos los productos</option>
                    {productosUnicos.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                {/* Filtro Turno */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Turno</label>
                  <select
                    value={histFiltroTurno}
                    onChange={e => setHistFiltroTurno(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-violet-500"
                  >
                    <option value="todos">Todos los turnos</option>
                    <option value="Mañana">Mañana (06-14h)</option>
                    <option value="Tarde">Tarde (14-22h)</option>
                    <option value="Noche">Noche (22-06h)</option>
                  </select>
                </div>
                {/* Filtro Período */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Período</label>
                  <div className="flex gap-1">
                    {['hoy','semana','mes'].map(p => (
                      <button
                        key={p}
                        onClick={() => setHistFiltroPeriodo(p)}
                        className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${
                          histFiltroPeriodo === p
                            ? 'bg-violet-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        {p === 'hoy' ? 'Hoy' : p === 'semana' ? '7d' : '30d'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* KPI CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Producido', value: histKpis.producido.toLocaleString(), unit: 'uds', icon: Factory, color: 'violet', glow: 'shadow-violet-900/30' },
                { label: 'OEE Medio', value: `${histKpis.oee}`, unit: '%', icon: Activity, color: 'emerald', glow: 'shadow-emerald-900/30' },
                { label: 'Calidad Media', value: `${histKpis.calidad}`, unit: '%', icon: CheckSquare, color: 'blue', glow: 'shadow-blue-900/30' },
                { label: 'Paradas Totales', value: histKpis.paradas, unit: 'eventos', icon: AlertTriangle, color: 'amber', glow: 'shadow-amber-900/30' },
              ].map(k => (
                <div key={k.label} className={`card p-5 border-${k.color}-500/30 bg-gradient-to-br from-${k.color}-950/15 to-slate-900 shadow-lg ${k.glow}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase">{k.label}</span>
                    <k.icon className={`w-4 h-4 text-${k.color}-400`} />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-3xl font-black font-mono text-${k.color}-400`}>{k.value}</span>
                    <span className="text-xs text-slate-500 font-bold">{k.unit}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* GRÁFICOS */}
            {histGrafico.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfico Barras: Producción Real vs Objetivo */}
                <div className="card p-5">
                  <h4 className="font-black text-white text-sm mb-4 flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-violet-400" />
                    Producción Real vs Objetivo por Día
                  </h4>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={histGrafico} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12, color: '#fff', fontSize: 12 }}
                        cursor={{ fill: 'rgba(139,92,246,0.08)' }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                      <Bar dataKey="objetivo" name="Objetivo" fill="#334155" radius={[4,4,0,0]} />
                      <Bar dataKey="producido" name="Producido" fill="#7c3aed" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Gráfico Líneas: Evolución OEE */}
                <div className="card p-5">
                  <h4 className="font-black text-white text-sm mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    Evolución OEE (%) en el Período
                  </h4>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={histGrafico} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                      <YAxis domain={[60, 100]} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12, color: '#fff', fontSize: 12 }}
                      />
                      <ReferenceLine y={85} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: 'Obj. 85%', fill: '#f59e0b', fontSize: 10, position: 'right' }} />
                      <Line type="monotone" dataKey="oee" name="OEE %" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="card p-8 text-center text-slate-500">
                <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-bold">No hay registros para los filtros seleccionados</p>
                <p className="text-xs mt-1">Prueba a ampliar el período o cambiar los filtros</p>
              </div>
            )}

            {/* TABLA DETALLADA */}
            {historialFiltrado.length > 0 && (
              <div className="card overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-800 flex justify-between items-center">
                  <h4 className="font-black text-white text-sm">Detalle por Turno — {historialFiltrado.length} registros</h4>
                  <span className="text-xs text-slate-500 font-mono">Filtrado</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-800 text-[11px] text-slate-400 uppercase">
                        <th className="p-3 text-left">Fecha</th>
                        <th className="p-3 text-left">Línea</th>
                        <th className="p-3 text-left">Turno</th>
                        <th className="p-3 text-left">Producto</th>
                        <th className="p-3 text-right">Producido</th>
                        <th className="p-3 text-right">Objetivo</th>
                        <th className="p-3 text-right">OEE%</th>
                        <th className="p-3 text-right">Calidad%</th>
                        <th className="p-3 text-right">Paradas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-xs font-bold">
                      {historialFiltrado.map(r => {
                        const cumple = r.producido >= r.objetivo;
                        return (
                          <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="p-3 font-mono text-slate-300">{r.fecha}</td>
                            <td className="p-3 text-white">{r.lineaNombre}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                                r.turno === 'Mañana' ? 'bg-amber-500/20 text-amber-300' :
                                r.turno === 'Tarde'  ? 'bg-blue-500/20 text-blue-300' :
                                                       'bg-slate-700 text-slate-300'
                              }`}>{r.turno}</span>
                            </td>
                            <td className="p-3 font-mono text-cyan-400">{r.producto}</td>
                            <td className={`p-3 text-right font-mono ${cumple ? 'text-emerald-400' : 'text-amber-400'}`}>{r.producido}</td>
                            <td className="p-3 text-right font-mono text-slate-400">{r.objetivo}</td>
                            <td className={`p-3 text-right font-mono ${r.oee >= 85 ? 'text-emerald-400' : r.oee >= 75 ? 'text-amber-400' : 'text-red-400'}`}>{r.oee}%</td>
                            <td className={`p-3 text-right font-mono ${r.calidad >= 97 ? 'text-emerald-400' : r.calidad >= 97 ? 'text-amber-400' : 'text-red-400'}`}>{r.calidad}%</td>
                            <td className={`p-3 text-right font-mono ${r.paradas > 2 ? 'text-red-400' : r.paradas > 0 ? 'text-amber-400' : 'text-slate-500'}`}>{r.paradas}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── TAB 6: CHECKLIST CIL (LIMPIEZA, INSPECCIÓN, LUBRICACIÓN) ── */}
        {activeTab === 'cil' && (
          <motion.div
            key="tab-cil"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl h-fit">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-cyan-400" />
                    Puesto: {lineaActiva.nombre}
                  </h3>
                  <span className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 font-mono text-xs font-bold border border-cyan-500/30">
                    CIL ACTIVO
                  </span>
                </div>

                <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-500 block">Operario Responsable:</span>
                    <span className="text-sm font-black text-white block mt-0.5">{operarioNombre}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-500 block">Orden / Producto:</span>
                    <span className="text-sm font-bold text-cyan-300 block mt-0.5">{ordenActiva.codigo || 'OF-CIL'} — {ordenActiva.ref || lineaActiva.producto}</span>
                  </div>
                </div>

                <div className="bg-cyan-950/30 border border-cyan-500/30 rounded-2xl p-4 space-y-2">
                  <p className="text-xs font-black text-cyan-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" /> Instrucción CIL
                  </p>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Completa la pauta de Limpieza, Inspección y Lubricación de tu puesto antes del relevo o durante el arranque. Si observas alguna fuga, ruido anómalo o fallo, márcalo "No OK" y abre un aviso de avería de inmediato.
                  </p>
                </div>
              </div>

              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
                <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black text-white flex items-center gap-2">
                        <CheckSquare className="w-5 h-5 text-cyan-400" />
                        {activeCilTemplate ? activeCilTemplate.nombre : 'Pauta de Limpieza, Inspección y Lubricación'}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {cilPoints.length} puntos de verificación ({cilPoints.filter(p => p.critico).length} críticos ⚡)
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {cilTemplates.length > 1 && (
                      <select
                        value={selectedCilTplId}
                        onChange={e => setSelectedCilTplId(e.target.value)}
                        className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-cyan-500"
                      >
                        {cilTemplates.map(t => (
                          <option key={t.id} value={t.id}>{t.nombre}</option>
                        ))}
                      </select>
                    )}
                    <button
                      onClick={() => setCilPoints(prev => prev.map(p => ({ ...p, status: 'OK' })))}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors"
                    >
                      ✔ Marcar Todos OK
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {cilPoints.map(point => {
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
                            isOk ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'bg-red-500/30 text-red-400 border border-red-500'
                          }`}>
                            {point.id}
                          </div>
                          <div>
                            <span className={`text-xs sm:text-sm font-bold leading-snug block ${isOk ? 'text-slate-200' : 'text-red-200 font-extrabold'}`}>
                              {point.text}
                            </span>
                            {point.critico && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/20 border border-red-500/40 text-red-300 text-[10px] font-black uppercase tracking-wider mt-1.5">
                                ⚡ Punto Crítico
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-end">
                          <button
                            type="button"
                            onClick={() => toggleCilPoint(point.id, 'OK')}
                            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
                              isOk
                                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/40'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" /> OK
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleCilPoint(point.id, 'No OK')}
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

                {hasCilNoOk && firstCilNoOkPoint && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="bg-red-950/60 border-2 border-red-500 rounded-3xl p-5 shadow-2xl space-y-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-900/50 flex-shrink-0">
                        <AlertTriangle className="w-6 h-6 animate-bounce" />
                      </div>
                      <div>
                        <h4 className="text-base font-black text-white">⚠️ Anomalía Detectada en Pauta CIL</h4>
                        <p className="text-xs text-red-300 mt-0.5">
                          Se ha marcado "No OK": <strong className="text-white">"{firstCilNoOkPoint.text.slice(0, 50)}..."</strong>
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-950/80 p-3 rounded-xl border border-red-500/30 text-xs text-red-200">
                      Puedes reportar y abrir automáticamente un <strong>Aviso de Avería / Mantenimiento</strong> precargado con el punto fallido en {lineaActiva.nombre}.
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => handlePrecargarAveriaCIL(firstCilNoOkPoint)}
                        className="px-5 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-red-900/50 transition-all active:scale-95"
                      >
                        <Wrench className="w-4 h-4 fill-white" /> ⚡ Abrir Aviso de Mantenimiento Precargado
                      </button>
                    </div>
                  </motion.div>
                )}

                <div className="flex items-center justify-between bg-slate-950/80 p-5 rounded-3xl border border-slate-800 flex-wrap gap-4">
                  <div>
                    <span className="text-sm font-black text-white block">Registrar Inspección CIL</span>
                    <span className="text-xs text-slate-400">Firmado por {operarioNombre} ({turnoSel})</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRegistrarEjecucionCIL}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-xs shadow-xl shadow-cyan-900/40 flex items-center gap-2 transition-all active:scale-95"
                  >
                    <Save className="w-4 h-4" /> Finalizar y Registrar Pauta CIL
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MODAL INTERACTIVO DE SELECCIÓN DE OPERARIO / PIN LOGIN ── */}
      <AnimatePresence>
        {modalOperarioOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl max-h-[85vh] overflow-y-auto no-scrollbar"
            >
              <div className="flex items-center justify-between pb-5 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white">Selección de Operario en Puesto</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Identifícate en {lineaActiva.nombre} para trazabilidad de calidad y paradas
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

              {/* Toggle de preparación Login PIN */}
              <div className="my-5 p-3.5 rounded-2xl bg-purple-950/30 border border-purple-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-purple-300">Autenticación Segura con PIN (Preparación Login)</p>
                    <p className="text-[10px] text-slate-400">Activa para requerir credencial numérica antes de cambiar de operario</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setPinLoginActivo(!pinLoginActivo); setPinInput(''); setPinError(false); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all border ${
                    pinLoginActivo
                      ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-900/50'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  {pinLoginActivo ? 'PIN Requerido' : 'Selección Libre'}
                </button>
              </div>

              {/* Cuadro de PIN si está activo */}
              {pinLoginActivo && (
                <div className="mb-6 p-4 rounded-2xl bg-slate-950 border border-purple-500/40 text-center animate-fade-in">
                  <p className="text-xs font-bold text-slate-300 mb-2">Introduce el PIN de 4 dígitos para confirmar el acceso:</p>
                  <div className="flex items-center justify-center gap-2">
                    <input
                      type="password"
                      maxLength="4"
                      value={pinInput}
                      onChange={e => { setPinInput(e.target.value); setPinError(false); }}
                      placeholder="••••"
                      className="bg-slate-900 border border-purple-500/50 rounded-xl px-4 py-2.5 text-center text-lg font-mono font-black text-purple-300 w-36 tracking-widest focus:outline-none"
                    />
                  </div>
                  {pinError && (
                    <p className="text-rose-400 text-xs font-bold mt-2">PIN incorrecto. Inténtalo de nuevo (Ej: 1234, 2345...)</p>
                  )}
                </div>
              )}

              {/* Lista de operarios asignados a esta línea primero, y luego los demás */}
              <div className="space-y-4">
                {operarios.length === 0 && (
                  <div className="p-6 rounded-2xl bg-slate-950 border border-amber-500/40 text-center space-y-3">
                    <Users className="w-10 h-10 text-amber-400 mx-auto opacity-80" />
                    <p className="text-sm font-bold text-white">No hay operarios cargados en memoria local</p>
                    <p className="text-xs text-slate-400">Pudes restaurar el catálogo completo de operarios predeterminados para continuar trabajando.</p>
                    <button
                      onClick={() => { const ops = restoreOperariosCatalog(); setOperarios(ops); }}
                      className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-lg active:scale-95"
                    >
                      Restaurar Catálogo de Operarios
                    </button>
                  </div>
                )}

                <div>
                  <p className="text-[11px] font-black uppercase tracking-wider text-blue-400 mb-2.5 flex items-center gap-1.5">
                    <Factory className="w-3.5 h-3.5" />
                    <span>Operarios Capacitados para {lineaActiva.nombre}</span>
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {operarios
                      .filter(op => {
                        const est = (op.estado || 'activo').toLowerCase();
                        return est !== 'inactivo' && est !== 'baja' && est !== 'caducado' && opTienePermisoEnLinea(op, lineaSelId);
                      })
                      .map(op => {
                        const isSel = op.id === operarioSelId;
                        return (
                          <button
                            key={op.id}
                            onClick={() => handleSelectOperarioClick(op)}
                            className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all group ${
                              isSel
                                ? 'bg-amber-500/15 border-amber-500/60 shadow-lg'
                                : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {op.avatar ? (
                                <img src={op.avatar} alt={op.nombre} className="w-11 h-11 rounded-xl object-cover border border-slate-700" />
                              ) : (
                                <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white text-sm">
                                  {op.nombre?.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <p className="font-black text-white text-sm group-hover:text-amber-300 transition-colors">{op.nombre}</p>
                                <p className="text-[11px] font-bold text-amber-400 mt-0.5">{op.rol}</p>
                                <p className="text-[10px] text-slate-400 font-mono">{op.id} · {op.turno}</p>
                              </div>
                            </div>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                              isSel ? 'bg-amber-500 border-amber-400 text-slate-950 font-black' : 'border-slate-700 text-transparent'
                            }`}>
                              <Check className="w-3.5 h-3.5" />
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </div>

                {/* Otros operarios activos de la planta */}
                <div className="pt-2">
                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    <span>Otros Operarios Activos en Planta</span>
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {operarios
                      .filter(op => {
                        const est = (op.estado || 'activo').toLowerCase();
                        return est !== 'inactivo' && est !== 'baja' && est !== 'caducado' && !opTienePermisoEnLinea(op, lineaSelId);
                      })
                      .map(op => {
                        const isSel = op.id === operarioSelId;
                        return (
                          <button
                            key={op.id}
                            onClick={() => handleSelectOperarioClick(op)}
                            className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all group opacity-80 hover:opacity-100 ${
                              isSel
                                ? 'bg-amber-500/15 border-amber-500/60 shadow-lg'
                                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {op.avatar ? (
                                <img src={op.avatar} alt={op.nombre} className="w-10 h-10 rounded-xl object-cover border border-slate-700" />
                              ) : (
                                <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center font-black text-white text-xs">
                                  {op.nombre?.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <p className="font-bold text-slate-200 text-xs group-hover:text-amber-300 transition-colors">{op.nombre}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">{op.rol}</p>
                                <p className="text-[9px] text-slate-500 font-mono">Turno: {op.turno}</p>
                              </div>
                            </div>
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                              isSel ? 'bg-amber-500 border-amber-400 text-slate-950 font-black' : 'border-slate-700 text-transparent'
                            }`}>
                              <Check className="w-3 h-3" />
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                <p className="text-xs text-slate-500 font-bold">
                  ¿Falta un operario? Da de alta nuevos perfiles en la sección <span className="text-blue-400">Admin MES &gt; Operarios</span>.
                </p>
                <button
                  onClick={() => setModalOperarioOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* ── MODAL AVISO NO BLOQUEANTE: PERMISO PARA LOGIN EN LÍNEA ── */}
        {warningPermisoOpen && pendingLoginOp && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-slate-900 border border-amber-500/50 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center gap-3 text-amber-400">
                <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-500/30">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Aviso de Habilitación / Permisos</h3>
                  <p className="text-xs text-amber-400/80 font-bold">Verificación de competencias en línea</p>
                </div>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                El operario <strong className="text-white font-black">{pendingLoginOp.nombre}</strong> no figura expresamente habilitado ni en sus líneas asignadas ni en sus permisos para el puesto <strong className="text-amber-400 font-mono">{lineas.find(l => l.id === lineaSelId)?.nombre || lineaSelId}</strong>.
              </p>
              <p className="text-xs text-slate-400 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                ¿Deseas confirmar el login y vincular al operario a esta línea para el turno en curso de todas formas?
              </p>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => { setWarningPermisoOpen(false); setPendingLoginOp(null); }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => ejecutarLoginOperario(pendingLoginOp, lineaSelId)}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-all shadow-lg shadow-amber-500/20"
                >
                  Continuar de todas formas
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* ── MODAL AVISO NO BLOQUEANTE: CAMBIO DE LÍNEA SIN PERMISO ── */}
        {warningPermisoLineaOpen && pendingLineaId && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-slate-900 border border-amber-500/50 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center gap-3 text-amber-400">
                <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-500/30">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Cambio de Línea / Puesto</h3>
                  <p className="text-xs text-amber-400/80 font-bold">Verificación de cualificación técnica</p>
                </div>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                El operario activo <strong className="text-white font-black">{operarioNombre}</strong> no cuenta con registro explícito de habilitación técnica en <strong className="text-amber-400 font-mono">{lineas.find(l => l.id === pendingLineaId)?.nombre || pendingLineaId}</strong>.
              </p>
              <p className="text-xs text-slate-400 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                ¿Confirmas el traslado de puesto para continuar registrando producción aquí?
              </p>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => { setWarningPermisoLineaOpen(false); setPendingLineaId(null); }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => ejecutarCambioLinea(pendingLineaId)}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-all shadow-lg shadow-amber-500/20"
                >
                  Confirmar Cambio
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
