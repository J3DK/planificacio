import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, UserPlus, Search, Filter, ShieldCheck, Factory, Clock,
  Key, Edit3, Trash2, CheckCircle2, XCircle, Award, Sparkles,
  LayoutGrid, List, ChevronRight, AlertCircle, RefreshCw, Upload,
  GraduationCap, Star, Calendar, BookOpen, Layers, PlusCircle, Check,
  Target, Briefcase, TrendingUp, CheckSquare, FileText, Sliders, AlertTriangle
} from 'lucide-react';
import {
  fetchOperarios, insertOperario, updateOperario, deleteOperario,
  fetchLineas, getCatalogoSkills, getCatalogoFormaciones, getCatalogoPermisos, getCatalogoCapacitaciones, getCatalogoAutorizaciones
} from '@/services/dataService';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';


export default function Operarios() {
  const [operarios, setOperarios] = useState([]);
  const [lineas, setLineas] = useState([]);
  const [catalogoSkills, setCatalogoSkills] = useState([]);
  const [catalogoFormaciones, setCatalogoFormaciones] = useState([]);
  const [catalogoPermisos, setCatalogoPermisos] = useState([]);
  const [catalogoCapacitaciones, setCatalogoCapacitaciones] = useState([]);
  const [catalogoAutorizaciones, setCatalogoAutorizaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroLinea, setFiltroLinea] = useState('todas');
  const [filtroTurno, setFiltroTurno] = useState('todos');
  const [filtroRol, setFiltroRol] = useState('todos');

  // Modal CRUD general
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    id: '',
    nombre: '',
    email: '',
    rol: 'Operario Especialista',
    lineas: ['L1'],
    lineaActualId: 'L1',
    turno: 'Mañana',
    estado: 'activo',
    especialidad: '',
    pin: '',
    avatar: '',
    skills: [],
    formaciones: [],
    permisos: [],
    autorizaciones: [],
    historial: []
  });
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Modal Ficha 360° Operario (Skills, Formaciones, Permisos, Historial)
  const [fichaOpen, setFichaOpen] = useState(false);
  const [selectedOp, setSelectedOp] = useState(null);
  const [activeTabFicha, setActiveTabFicha] = useState('resumen'); // 'resumen' | 'capacitaciones' | 'skills' | 'formaciones' | 'puestos' | 'historial'

  // Forms rápidos dentro de la ficha 360°
  const [skillToAdd, setSkillToAdd] = useState('');
  const [skillValoracion, setSkillValoracion] = useState(4);
  const [skillNivel, setSkillNivel] = useState('Avanzado');

  const [formacionToAdd, setFormacionToAdd] = useState('');
  const [formacionFechaObt, setFormacionFechaObt] = useState(new Date().toISOString().slice(0, 10));
  const [formacionFechaCad, setFormacionFechaCad] = useState(new Date(Date.now() + 730 * 86400000).toISOString().slice(0, 10));

  const [permisoToAdd, setPermisoToAdd] = useState('');
  const [permisoNivelAcceso, setPermisoNivelAcceso] = useState('Operador Principal');

  const [autorizacionToAdd, setAutorizacionToAdd] = useState('');
  const [autorizacionNivelConcedido, setAutorizacionNivelConcedido] = useState('Operador Maestro / Rearme');

  // Estado para form rápido de Capacitaciones y recertificaciones
  const [capTitulo, setCapTitulo] = useState('Evaluación Técnica Periódica y Seguridad MES');
  const [capPlan, setCapPlan] = useState('Plan Anual de Reciclaje y Cualificación 2026');
  const [capPuntuacion, setCapPuntuacion] = useState(94);
  const [capEstado, setCapEstado] = useState('superada');
  const [capObservaciones, setCapObservaciones] = useState('Demuestra soltura en operativas y cumplimiento estricto de PRL en planta.');

  // Confirmar Borrado
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetDelete, setTargetDelete] = useState(null);

  const loadData = async () => {
    setLoading(true);
    const [resOp, resLin] = await Promise.all([fetchOperarios(), fetchLineas()]);
    if (resOp.data) setOperarios(resOp.data);
    if (resLin.data) setLineas(resLin.data);
    setCatalogoSkills(getCatalogoSkills() || []);
    setCatalogoFormaciones(getCatalogoFormaciones() || []);
    setCatalogoPermisos(getCatalogoPermisos() || []);
    setCatalogoCapacitaciones(getCatalogoCapacitaciones() || []);
    const auths = getCatalogoAutorizaciones() || [];
    setCatalogoAutorizaciones(auths);
    if (auths.length > 0 && !autorizacionToAdd) {
      setAutorizacionToAdd(auths[0].nombre);
    }
    setLoading(false);
  };

    useRealtimeSync('operarios', () => window.dispatchEvent(new CustomEvent('operarios_updated')));

  useEffect(() => {
    loadData();
    const handler = () => loadData();
    window.addEventListener('operarios_updated', handler);
    window.addEventListener('cualificaciones_updated', handler);
    return () => {
      window.removeEventListener('operarios_updated', handler);
      window.removeEventListener('cualificaciones_updated', handler);
    };
  }, []);

  const triggerSuccess = (text) => {
    setSuccessMsg(text);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const operariosFiltrados = useMemo(() => {
    return operarios.filter(op => {
      if (busqueda.trim()) {
        const query = busqueda.toLowerCase();
        const matchNombre = op.nombre?.toLowerCase().includes(query);
        const matchId = op.id?.toLowerCase().includes(query);
        const matchEspec = op.especialidad?.toLowerCase().includes(query);
        if (!matchNombre && !matchId && !matchEspec) return false;
      }
      if (filtroLinea !== 'todas') {
        const checkHab = op.lineas && op.lineas.includes(filtroLinea);
        const checkVivo = op.lineaActualId === filtroLinea;
        if (!checkHab && !checkVivo) return false;
      }
      if (filtroTurno !== 'todos' && op.turno !== filtroTurno) return false;
      if (filtroRol !== 'todos' && op.rol !== filtroRol) return false;
      return true;
    });
  }, [operarios, busqueda, filtroLinea, filtroTurno, filtroRol]);

  const stats = useMemo(() => {
    const total = operarios.length;
    const activos = operarios.filter(o => o.estado === 'activo').length;
    const asignadosVivo = operarios.filter(o => o.lineaActualId && o.estado === 'activo').length;
    const jefes = operarios.filter(o => o.rol?.includes('Jefe')).length;
    return { total, activos, asignadosVivo, jefes };
  }, [operarios]);

  const handleOpenNew = () => {
    setEditingId(null);
    setFormData({
      id: `OP-${String(Math.floor(100 + Math.random() * 900))}`,
      nombre: '',
      email: '',
      rol: 'Operario Especialista',
      lineas: ['L1'],
      lineaActualId: 'L1',
      turno: 'Mañana',
      estado: 'activo',
      especialidad: '',
      pin: '1234',
      avatar: '',
      skills: [],
      formaciones: [],
      permisos: [],
      autorizaciones: [],
      historial: [{ id: `HS-${Date.now()}`, fecha: new Date().toLocaleString(), tipo: 'alta', descripcion: 'Alta inicial del operario en el sistema MES', linea: 'L1', piezas: 0 }]
    });
    setModalOpen(true);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 300;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setFormData(prev => ({ ...prev, avatar: compressedDataUrl }));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleOpenEdit = (op) => {
    setEditingId(op.id);
    setFormData({
      id: op.id || '',
      nombre: op.nombre || '',
      email: op.email || '',
      rol: op.rol || 'Operario Especialista',
      lineas: Array.isArray(op.lineas) ? op.lineas : ['L1'],
      lineaActualId: op.lineaActualId || op.lineas?.[0] || 'L1',
      turno: op.turno || 'Mañana',
      estado: op.estado || 'activo',
      especialidad: op.especialidad || '',
      pin: op.pin || '',
      avatar: op.avatar || '',
      skills: op.skills || [],
      formaciones: op.formaciones || [],
      permisos: op.permisos || [],
      autorizaciones: op.autorizaciones || [],
      historial: op.historial || []
    });
    setModalOpen(true);
  };

  const toggleLineaSelection = (lineaId) => {
    setFormData(prev => {
      const exists = prev.lineas.includes(lineaId);
      if (exists) {
        if (prev.lineas.length === 1) return prev; // Al menos 1 línea
        return { ...prev, lineas: prev.lineas.filter(l => l !== lineaId) };
      } else {
        return { ...prev, lineas: [...prev.lineas, lineaId] };
      }
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim() || !formData.id.trim()) {
      alert('El ID y el Nombre son obligatorios');
      return;
    }
    setSaving(true);
    if (editingId) {
      const { data } = await updateOperario(editingId, formData);
      if (data) setOperarios(prev => prev.map(o => o.id === editingId ? data : o));
      triggerSuccess('✅ Operario actualizado correctamente');
    } else {
      const { data } = await insertOperario(formData);
      if (data) setOperarios(prev => [...prev, data]);
      triggerSuccess('✨ Nuevo operario dado de alta');
    }
    setSaving(false);
    setModalOpen(false);
  };

  const confirmDelete = (op) => {
    setTargetDelete(op);
    setConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!targetDelete) return;
    await deleteOperario(targetDelete.id);
    setOperarios(prev => prev.filter(o => o.id !== targetDelete.id));
    setConfirmOpen(false);
    setTargetDelete(null);
    triggerSuccess('🗑️ Operario eliminado del sistema');
  };

  const toggleEstado = async (op) => {
    const nuevoEstado = op.estado === 'activo' ? 'inactivo' : 'activo';
    const updated = { ...op, estado: nuevoEstado, lineaActualId: nuevoEstado === 'inactivo' ? null : op.lineaActualId };
    const { data } = await updateOperario(op.id, updated);
    if (data) setOperarios(prev => prev.map(o => o.id === op.id ? data : o));
  };

  // Cambio rápido en vivo de línea asignada
  const handleCambiarLineaVivo = async (opId, newLineaId) => {
    const op = operarios.find(o => o.id === opId);
    if (!op) return;
    const updated = { ...op, lineaActualId: newLineaId === 'ninguna' ? null : newLineaId };
    const { data } = await updateOperario(opId, updated);
    if (data) {
      setOperarios(prev => prev.map(o => o.id === opId ? data : o));
      if (selectedOp && selectedOp.id === opId) setSelectedOp(data);
      triggerSuccess(`👷 Asignación en vivo actualizada para ${op.nombre}`);
    }
  };

  // ─── ACCIONES DENTRO DE LA FICHA 360° ────────────────────────────────────────

  const handleOpenFicha = (op, defaultTab = 'resumen') => {
    const opWithCap = op.capacitaciones && op.capacitaciones.length > 0 ? op : {
      ...op,
      capacitaciones: [
        {
          id: 'CAP-2026-01',
          titulo: 'Evaluación Técnica Periódica y Seguridad MES',
          plan: 'Plan Anual de Reciclaje y Cualificación 2026',
          fecha: new Date().toISOString().slice(0, 10),
          evaluador: 'Comité Técnico de Planta MES',
          puntuacion: 95,
          estado: 'superada',
          observaciones: 'Apto y cualificado para operar en su puesto y línea asignada según estándares de calidad.'
        }
      ]
    };
    setSelectedOp(opWithCap);
    setActiveTabFicha(defaultTab);
    setSkillToAdd(catalogoSkills[0]?.nombre || '');
    setFormacionToAdd(catalogoFormaciones[0]?.nombre || '');
    setPermisoToAdd(catalogoPermisos[0]?.equipoNombre || lineas[0]?.nombre || '');
    setCapTitulo('Evaluación de Competencias del Puesto actual');
    setCapPlan('Plan de Capacitación y Reciclaje MES 2026');
    setCapPuntuacion(94);
    setCapEstado('superada');
    setCapObservaciones('Demuestra total soltura en operativas y cumplimiento estricto de PRL en planta.');
    setFichaOpen(true);
  };

  const handleAddCapacitacionToOp = async () => {
    if (!selectedOp || !capTitulo.trim()) return;
    const newCap = {
      id: `CAP-${Date.now().toString().slice(-4)}`,
      titulo: capTitulo,
      plan: capPlan,
      fecha: new Date().toISOString().slice(0, 10),
      evaluador: 'Responsable Técnico de Puesto',
      puntuacion: Number(capPuntuacion),
      estado: capEstado,
      observaciones: capObservaciones
    };
    const updatedCapacitaciones = [newCap, ...(selectedOp.capacitaciones || [])];
    const newHist = [{ id: `HS-${Date.now()}`, fecha: new Date().toLocaleString(), tipo: 'capacitacion', descripcion: `Registrada evaluación de competencias [${capTitulo}] (${capEstado.toUpperCase()}) - Nota: ${capPuntuacion}/100`, linea: selectedOp.lineaActualId || 'General', piezas: 0 }, ...(selectedOp.historial || [])];
    const updatedOp = { ...selectedOp, capacitaciones: updatedCapacitaciones, historial: newHist };
    const { data } = await updateOperario(selectedOp.id, updatedOp);
    if (data) {
      setOperarios(prev => prev.map(o => o.id === selectedOp.id ? data : o));
      setSelectedOp(data);
      triggerSuccess(`🎯 Capacitación registrada para ${selectedOp.nombre}`);
    }
  };

  const handleRemoveCapacitacionFromOp = async (capId) => {
    if (!selectedOp) return;
    const updatedCapacitaciones = (selectedOp.capacitaciones || []).filter(c => c.id !== capId);
    const updatedOp = { ...selectedOp, capacitaciones: updatedCapacitaciones };
    const { data } = await updateOperario(selectedOp.id, updatedOp);
    if (data) {
      setOperarios(prev => prev.map(o => o.id === selectedOp.id ? data : o));
      setSelectedOp(data);
      triggerSuccess('🎯 Registro de capacitación eliminado');
    }
  };

  const handleAddSkillToOp = async () => {
    if (!selectedOp || !skillToAdd) return;
    const master = catalogoSkills.find(sk => sk.nombre === skillToAdd) || { id: `SK-${Date.now().toString().slice(-4)}`, nombre: skillToAdd, categoria: 'Especialización' };
    const newSkill = {
      id: master.id,
      nombre: master.nombre,
      valoracion: Number(skillValoracion),
      nivel: skillNivel,
      ultimaEvaluacion: new Date().toISOString().slice(0, 10)
    };
    const updatedSkills = [...(selectedOp.skills || []).filter(s => s.nombre !== master.nombre), newSkill];
    const newHist = [{ id: `HS-${Date.now()}`, fecha: new Date().toLocaleString(), tipo: 'evaluacion', descripcion: `Certificada / Evaluada skill [${master.nombre}] con valoración ${skillValoracion} ⭐`, linea: 'General', piezas: 0 }, ...(selectedOp.historial || [])];
    const updatedOp = { ...selectedOp, skills: updatedSkills, historial: newHist };
    const { data } = await updateOperario(selectedOp.id, updatedOp);
    if (data) {
      setOperarios(prev => prev.map(o => o.id === selectedOp.id ? data : o));
      setSelectedOp(data);
      triggerSuccess(`⭐ Skill añadida/evaluada para ${selectedOp.nombre}`);
    }
  };

  const handleRemoveSkillFromOp = async (skillNombre) => {
    if (!selectedOp) return;
    const updatedSkills = (selectedOp.skills || []).filter(s => s.nombre !== skillNombre);
    const updatedOp = { ...selectedOp, skills: updatedSkills };
    const { data } = await updateOperario(selectedOp.id, updatedOp);
    if (data) {
      setOperarios(prev => prev.map(o => o.id === selectedOp.id ? data : o));
      setSelectedOp(data);
      triggerSuccess('⭐ Skill retirada de la ficha');
    }
  };

  const handleAddFormacionToOp = async () => {
    if (!selectedOp || !formacionToAdd) return;
    const master = catalogoFormaciones.find(fm => fm.nombre === formacionToAdd) || { id: `FM-${Date.now().toString().slice(-4)}`, nombre: formacionToAdd, entidadCertificadora: 'MPS Academy' };
    const esVigente = new Date(formacionFechaCad) > new Date() ? 'vigente' : 'caducado';
    const newFm = {
      id: master.id,
      nombre: master.nombre,
      fechaObtencion: formacionFechaObt,
      fechaCaducidad: formacionFechaCad,
      estado: esVigente,
      entidad: master.entidadCertificadora || 'Oficial'
    };
    const updatedFormaciones = [...(selectedOp.formaciones || []).filter(f => f.nombre !== master.nombre), newFm];
    const newHist = [{ id: `HS-${Date.now()}`, fecha: new Date().toLocaleString(), tipo: 'formacion', descripcion: `Registrado certificado de formación [${master.nombre}] (${esVigente.toUpperCase()})`, linea: 'General', piezas: 0 }, ...(selectedOp.historial || [])];
    const updatedOp = { ...selectedOp, formaciones: updatedFormaciones, historial: newHist };
    const { data } = await updateOperario(selectedOp.id, updatedOp);
    if (data) {
      setOperarios(prev => prev.map(o => o.id === selectedOp.id ? data : o));
      setSelectedOp(data);
      triggerSuccess(`🎓 Formación registrada para ${selectedOp.nombre}`);
    }
  };

  const handleRemoveFormacionFromOp = async (formacionNombre) => {
    if (!selectedOp) return;
    const updatedFormaciones = (selectedOp.formaciones || []).filter(f => f.nombre !== formacionNombre);
    const updatedOp = { ...selectedOp, formaciones: updatedFormaciones };
    const { data } = await updateOperario(selectedOp.id, updatedOp);
    if (data) {
      setOperarios(prev => prev.map(o => o.id === selectedOp.id ? data : o));
      setSelectedOp(data);
      triggerSuccess('🎓 Formación eliminada de la ficha');
    }
  };

  const handleAddPermisoToOp = async () => {
    if (!selectedOp || !permisoToAdd) return;
    const master = catalogoPermisos.find(p => p.equipoNombre === permisoToAdd || p.equipoId === permisoToAdd);
    const equipoId = master?.equipoId || permisoToAdd.split(' ')[0] || 'EQ-01';
    const equipoNombre = master?.equipoNombre || permisoToAdd;
    const tipo = master?.tipo || (equipoId.startsWith('L') ? 'linea' : 'maquina');
    const newPerm = {
      id: `PER-${Date.now().toString().slice(-4)}`,
      equipoId,
      equipoNombre,
      tipo,
      nivelAcceso: permisoNivelAcceso,
      autorizadoPor: 'Supervisor Planta'
    };
    const updatedPermisos = [...(selectedOp.permisos || []).filter(p => p.equipoNombre !== equipoNombre), newPerm];
    // Asegurar que la línea también está en op.lineas habilitadas
    let updatedLineas = selectedOp.lineas || [];
    if (tipo === 'linea' && !updatedLineas.includes(equipoId)) {
      updatedLineas = [...updatedLineas, equipoId];
    }
    const newHist = [{ id: `HS-${Date.now()}`, fecha: new Date().toLocaleString(), tipo: 'permiso', descripcion: `Concedida autorización para operar [${equipoNombre}] como ${permisoNivelAcceso}`, linea: equipoId, piezas: 0 }, ...(selectedOp.historial || [])];
    const updatedOp = { ...selectedOp, permisos: updatedPermisos, lineas: updatedLineas, historial: newHist };
    const { data } = await updateOperario(selectedOp.id, updatedOp);
    if (data) {
      setOperarios(prev => prev.map(o => o.id === selectedOp.id ? data : o));
      setSelectedOp(data);
      triggerSuccess(`🛡️ Permiso concedido en ${equipoNombre}`);
    }
  };

  const handleRemovePermisoFromOp = async (permId) => {
    if (!selectedOp) return;
    const updatedPermisos = (selectedOp.permisos || []).filter(p => p.id !== permId);
    const updatedOp = { ...selectedOp, permisos: updatedPermisos };
    const { data } = await updateOperario(selectedOp.id, updatedOp);
    if (data) {
      setOperarios(prev => prev.map(o => o.id === selectedOp.id ? data : o));
      setSelectedOp(data);
      triggerSuccess('🛡️ Permiso revocado');
    }
  };

  const handleAddAutorizacionToOp = async () => {
    if (!selectedOp || !autorizacionToAdd) return;
    const master = catalogoAutorizaciones.find(a => a.nombre === autorizacionToAdd || a.codigo === autorizacionToAdd || a.id === autorizacionToAdd);
    const newAuth = {
      id: master ? master.id : `AUT-${Date.now().toString().slice(-4)}`,
      autorizacionId: master ? master.id : `AUT-${Date.now().toString().slice(-4)}`,
      codigo: master ? master.codigo : `AUTH-EXT-${Date.now().toString().slice(-4)}`,
      nombre: master ? master.nombre : autorizacionToAdd,
      tipo: master ? master.tipo : 'subparte',
      targetId: master ? master.targetId : 'GEN-01',
      targetNombre: master ? master.targetNombre : autorizacionToAdd,
      nivelConcedido: autorizacionNivelConcedido,
      fechaAsignacion: new Date().toISOString().slice(0, 10)
    };
    const actuales = selectedOp.autorizaciones || [];
    const updatedAutorizaciones = [...actuales.filter(a => a.id !== newAuth.id && a.autorizacionId !== newAuth.autorizacionId), newAuth];
    const newHist = [{ id: `HS-${Date.now()}`, fecha: new Date().toLocaleString(), tipo: 'autorizacion', descripcion: `Concedida autorización / carnet [${newAuth.nombre}] (${newAuth.targetNombre}) con nivel ${autorizacionNivelConcedido}`, linea: newAuth.targetId, piezas: 0 }, ...(selectedOp.historial || [])];
    const updatedOp = { ...selectedOp, autorizaciones: updatedAutorizaciones, historial: newHist };
    const { data } = await updateOperario(selectedOp.id, updatedOp);
    if (data) {
      setOperarios(prev => prev.map(o => o.id === selectedOp.id ? data : o));
      setSelectedOp(data);
      triggerSuccess(`🛡️ Autorización asignada a ${selectedOp.nombre}`);
    }
  };

  const handleRemoveAutorizacionFromOp = async (authId) => {
    if (!selectedOp) return;
    const updatedAutorizaciones = (selectedOp.autorizaciones || []).filter(a => a.id !== authId && a.autorizacionId !== authId);
    const updatedOp = { ...selectedOp, autorizaciones: updatedAutorizaciones };
    const { data } = await updateOperario(selectedOp.id, updatedOp);
    if (data) {
      setOperarios(prev => prev.map(o => o.id === selectedOp.id ? data : o));
      setSelectedOp(data);
      triggerSuccess('🛡️ Autorización revocada');
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* ── ALERTA FLOTANTE ── */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-emerald-500/20 border-2 border-emerald-500/50 rounded-2xl p-4 flex items-center gap-3 text-emerald-300 shadow-xl shadow-emerald-950/40"
          >
            <CheckCircle2 className="w-6 h-6 flex-shrink-0 text-emerald-400" />
            <span className="font-bold text-sm">{successMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HEADER DE LA PÁGINA ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900/90 to-blue-950/50 p-6 rounded-3xl border border-slate-800 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 flex-shrink-0">
            <Users className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest bg-blue-500/20 text-blue-400 px-2.5 py-0.5 rounded-full border border-blue-500/30">
                Plantilla & Matriz de Competencias
              </span>
              <span className="text-xs text-emerald-400 font-bold">
                ● {stats.asignadosVivo} operarios asignados en líneas ahora
              </span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight mt-1">
              Operarios & Capacitación en Vivo
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-3 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-2xl border border-slate-700 transition-all active:scale-95 flex items-center justify-center"
            title="Refrescar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenNew}
            className="px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-900/50 flex items-center gap-2.5 transition-all active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>Nuevo Operario</span>
          </button>
        </div>
      </div>

      {/* ── ESTADÍSTICAS RÁPIDAS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400">Plantilla Total</p>
            <p className="text-xl font-black text-white">{stats.total}</p>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400">Personal Activo</p>
            <p className="text-xl font-black text-white">{stats.activos}</p>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Factory className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400">En Líneas (Vivo)</p>
            <p className="text-xl font-black text-amber-300">{stats.asignadosVivo}</p>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400">Jefes / Supervisores</p>
            <p className="text-xl font-black text-purple-300">{stats.jefes}</p>
          </div>
        </div>
      </div>

      {/* ── BARRA DE BÚSQUEDA Y FILTROS ── */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, ID, especialidad o puesto..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl pl-11 pr-4 py-2.5 text-sm font-bold text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white bg-slate-800 px-2 py-1 rounded-lg font-bold"
            >
              Limpiar
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Filtro por Línea */}
          <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2">
            <Factory className="w-4 h-4 text-blue-400" />
            <select
              value={filtroLinea}
              onChange={e => setFiltroLinea(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="todas" className="bg-slate-900">Todas las líneas</option>
              {lineas.map(l => (
                <option key={l.id} value={l.id} className="bg-slate-900">{l.nombre}</option>
              ))}
              <option value="L1" className="bg-slate-900">Línea 1</option>
              <option value="L2" className="bg-slate-900">Línea 2</option>
              <option value="L3" className="bg-slate-900">Línea 3</option>
              <option value="L4" className="bg-slate-900">Línea 4</option>
              <option value="L5" className="bg-slate-900">Línea 5</option>
            </select>
          </div>

          {/* Filtro por Turno */}
          <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <select
              value={filtroTurno}
              onChange={e => setFiltroTurno(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="todos" className="bg-slate-900">Todos los turnos</option>
              <option value="Mañana" className="bg-slate-900">Turno Mañana</option>
              <option value="Tarde" className="bg-slate-900">Turno Tarde</option>
              <option value="Noche" className="bg-slate-900">Turno Noche</option>
              <option value="Rotativo" className="bg-slate-900">Rotativo</option>
            </select>
          </div>

          {/* Filtro por Rol */}
          <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <select
              value={filtroRol}
              onChange={e => setFiltroRol(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="todos" className="bg-slate-900">Todos los puestos</option>
              <option value="Operario Especialista" className="bg-slate-900">Operario Especialista</option>
              <option value="Jefe de Línea" className="bg-slate-900">Jefe de Línea</option>
              <option value="Electromecánico" className="bg-slate-900">Electromecánico</option>
              <option value="Operario de Calidad" className="bg-slate-900">Operario de Calidad</option>
            </select>
          </div>

          {/* Selector Vista */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
              title="Vista en tarjetas"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
              title="Vista en tabla"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── LISTADO DE OPERARIOS ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 bg-slate-900/40 rounded-3xl border border-slate-800/80">
          <RefreshCw className="w-10 h-10 text-blue-500 animate-spin mb-3" />
          <p className="text-slate-400 text-sm font-bold">Cargando catálogo y asignaciones en vivo...</p>
        </div>
      ) : operariosFiltrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-900/40 rounded-3xl border border-slate-800/80 text-center px-4">
          <AlertCircle className="w-12 h-12 text-slate-600 mb-3" />
          <p className="text-lg font-bold text-slate-300">No se han encontrado operarios con estos criterios</p>
          <p className="text-xs text-slate-500 mt-1 max-w-md">Prueba a limpiar los filtros de búsqueda o da de alta un nuevo operario con el botón superior.</p>
          <button
            onClick={() => { setBusqueda(''); setFiltroLinea('todas'); setFiltroTurno('todos'); setFiltroRol('todos'); }}
            className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all"
          >
            Limpiar filtros
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* VISTA EN GRID DE TARJETAS WOW PREMIUM */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {operariosFiltrados.map(op => {
            const isActivo = op.estado === 'activo';
            const rolColor = op.rol?.includes('Jefe') ? 'from-amber-500/20 to-amber-600/10 border-amber-500/40 text-amber-300'
              : op.rol?.includes('Calidad') ? 'from-purple-500/20 to-purple-600/10 border-purple-500/40 text-purple-300'
              : op.rol?.includes('Electro') ? 'from-indigo-500/20 to-indigo-600/10 border-indigo-500/40 text-indigo-300'
              : 'from-blue-500/20 to-blue-600/10 border-blue-500/40 text-blue-300';

            const numSkills = op.skills?.length || 0;
            const numFormaciones = op.formaciones?.length || 0;
            const numPermisos = op.permisos?.length || 0;

            return (
              <motion.div
                key={op.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`bg-slate-900/90 border rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between ${
                  isActivo ? 'border-slate-800 hover:border-blue-500/40' : 'border-slate-800/50 opacity-70'
                }`}
              >
                <div>
                  {/* Cabecera Tarjeta */}
                  <div className="p-5 border-b border-slate-800/80 relative bg-gradient-to-b from-slate-800/40 to-transparent">
                    {/* Badge de estado en esquina superior derecha */}
                    <div className="absolute top-4 right-4 flex items-center gap-1.5">
                      <button
                        onClick={() => toggleEstado(op)}
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border transition-all flex items-center gap-1 ${
                          isActivo
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-400 border-rose-500/30 hover:bg-rose-500/30'
                        }`}
                        title="Haga clic para cambiar estado (Activo/Inactivo)"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isActivo ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                        {isActivo ? 'Activo' : 'Inactivo'}
                      </button>
                    </div>

                    <div className="flex items-center gap-3.5">
                      {/* Avatar foto o iniciales */}
                      <div className="relative flex-shrink-0 cursor-pointer" onClick={() => handleOpenFicha(op)}>
                        {op.avatar ? (
                          <img
                            src={op.avatar}
                            alt={op.nombre}
                            className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-700 shadow-md"
                            onError={e => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center font-black text-white text-lg shadow-md">
                            {op.nombre ? op.nombre.slice(0, 2).toUpperCase() : 'OP'}
                          </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 bg-slate-900 border border-slate-700 px-1.5 py-0.5 rounded-md text-[9px] font-black text-slate-300 font-mono">
                          {op.id}
                        </div>
                      </div>

                      <div className="min-w-0 pr-12 cursor-pointer" onClick={() => handleOpenFicha(op)}>
                        <h3 className="font-black text-white text-base leading-tight truncate hover:text-blue-400 transition-colors">
                          {op.nombre}
                        </h3>
                        <div className={`mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-black bg-gradient-to-r border ${rolColor}`}>
                          <Award className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{op.rol}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cuerpo Tarjeta */}
                  <div className="p-5 space-y-4">
                    {/* Especialidad */}
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Especialidad / Puesto</p>
                      <p className="text-xs font-bold text-slate-200 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80 truncate">
                        {op.especialidad || 'Sin especialidad especificada'}
                      </p>
                    </div>

                    {/* SELECTOR ASIGNACIÓN EN VIVO POR LÍNEA */}
                    <div className="p-2.5 rounded-xl bg-gradient-to-r from-blue-950/40 to-indigo-950/40 border border-blue-500/30">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-blue-300 flex items-center gap-1">
                          <Factory className="w-3 h-3 text-amber-400" />
                          <span>Trabajando En Vivo Ahora:</span>
                        </span>
                      </div>
                      <select
                        value={op.lineaActualId || 'ninguna'}
                        onChange={(e) => handleCambiarLineaVivo(op.id, e.target.value)}
                        className="w-full bg-slate-950 border border-blue-500/50 rounded-lg px-2.5 py-1.5 text-xs font-black text-white focus:outline-none focus:border-amber-400 cursor-pointer shadow-inner"
                      >
                        <option value="ninguna">🔴 Fuera de turno / Sin Línea</option>
                        {lineas.map(lin => (
                          <option key={lin.id} value={lin.id}>
                            👷 {lin.nombre} ({lin.id})
                          </option>
                        ))}
                        <option value="L1">👷 Línea 1 (L1)</option>
                        <option value="L2">👷 Línea 2 (L2)</option>
                        <option value="L3">👷 Línea 3 (L3)</option>
                        <option value="L4">👷 Línea 4 (L4)</option>
                        <option value="L5">👷 Línea 5 (L5)</option>
                      </select>
                    </div>

                    {/* Fichas / Resumen Capacitaciones, Skills, Formaciones y Puestos */}
                    <div className="grid grid-cols-4 gap-1.5 pt-1">
                      <div
                        onClick={() => handleOpenFicha(op, 'capacitaciones')}
                        className="bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 rounded-xl p-1.5 text-center cursor-pointer transition-colors group/mini"
                        title="Ver Capacitaciones y Competencias"
                      >
                        <p className="text-[9px] font-bold text-slate-400 group-hover/mini:text-slate-200">Capacit.</p>
                        <p className="text-xs font-black text-emerald-400 mt-0.5 flex items-center justify-center gap-1">
                          <Target className="w-3 h-3 text-emerald-400" />
                          <span>{op.capacitaciones?.length || 1}</span>
                        </p>
                      </div>
                      <div
                        onClick={() => handleOpenFicha(op, 'skills')}
                        className="bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 rounded-xl p-1.5 text-center cursor-pointer transition-colors group/mini"
                        title="Ver Matriz de Skills"
                      >
                        <p className="text-[9px] font-bold text-slate-400 group-hover/mini:text-slate-200">Skills</p>
                        <p className="text-xs font-black text-amber-400 mt-0.5 flex items-center justify-center gap-1">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>{numSkills}</span>
                        </p>
                      </div>
                      <div
                        onClick={() => handleOpenFicha(op, 'formaciones')}
                        className="bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 rounded-xl p-1.5 text-center cursor-pointer transition-colors group/mini"
                        title="Ver Formaciones y Cursos"
                      >
                        <p className="text-[9px] font-bold text-slate-400 group-hover/mini:text-slate-200">Formación</p>
                        <p className="text-xs font-black text-indigo-400 mt-0.5 flex items-center justify-center gap-1">
                          <GraduationCap className="w-3 h-3 text-indigo-400" />
                          <span>{numFormaciones}</span>
                        </p>
                      </div>
                      <div
                        onClick={() => handleOpenFicha(op, 'puestos')}
                        className="bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 rounded-xl p-1.5 text-center cursor-pointer transition-colors group/mini"
                        title="Ver Puestos y Líneas Autorizadas"
                      >
                        <p className="text-[9px] font-bold text-slate-400 group-hover/mini:text-slate-200">Puestos</p>
                        <p className="text-xs font-black text-purple-400 mt-0.5 flex items-center justify-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-purple-400" />
                          <span>{numPermisos}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pie con Acciones */}
                <div className="px-5 py-3 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => handleOpenFicha(op)}
                    className="text-xs font-black text-blue-400 hover:text-blue-300 flex items-center gap-1 group/btn"
                  >
                    <span>Ficha 360° Completa</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(op)}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all active:scale-95 border border-slate-700"
                      title="Editar datos básicos"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => confirmDelete(op)}
                      className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl transition-all active:scale-95 border border-rose-500/20"
                      title="Eliminar operario"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* VISTA EN TABLA MODERNA */
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <th className="py-4 px-6">Operario / Puesto</th>
                  <th className="py-4 px-4">Rol & Especialidad</th>
                  <th className="py-4 px-4 text-center">Línea Trabajando En Vivo</th>
                  <th className="py-4 px-4 text-center">Skills & Formación</th>
                  <th className="py-4 px-4 text-center">Turno</th>
                  <th className="py-4 px-4 text-center">Estado</th>
                  <th className="py-4 px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm font-medium text-slate-300">
                {operariosFiltrados.map(op => {
                  const isActivo = op.estado === 'activo';
                  return (
                    <tr key={op.id} className="hover:bg-slate-800/40 transition-colors group">
                      <td className="py-4 px-6 cursor-pointer" onClick={() => handleOpenFicha(op)}>
                        <div className="flex items-center gap-3.5">
                          {op.avatar ? (
                            <img src={op.avatar} alt={op.nombre} className="w-10 h-10 rounded-xl object-cover border border-slate-700" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white text-xs">
                              {op.nombre?.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-black text-white group-hover:text-blue-400 transition-colors">{op.nombre}</p>
                            <p className="text-xs text-slate-500 font-mono">{op.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-bold text-slate-200">{op.rol}</p>
                        <p className="text-xs text-slate-500 truncate max-w-xs">{op.especialidad || '-'}</p>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <select
                          value={op.lineaActualId || 'ninguna'}
                          onChange={(e) => handleCambiarLineaVivo(op.id, e.target.value)}
                          className="bg-slate-950 border border-blue-500/40 rounded-lg px-2 py-1 text-xs font-black text-amber-300 focus:outline-none cursor-pointer"
                        >
                          <option value="ninguna">🔴 Fuera de turno</option>
                          {lineas.map(lin => (
                            <option key={lin.id} value={lin.id}>👷 {lin.nombre}</option>
                          ))}
                          <option value="L1">👷 Línea 1</option>
                          <option value="L2">👷 Línea 2</option>
                          <option value="L3">👷 Línea 3</option>
                          <option value="L4">👷 Línea 4</option>
                          <option value="L5">👷 Línea 5</option>
                        </select>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-black">
                          <button
                            onClick={() => handleOpenFicha(op, 'capacitaciones')}
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-slate-800 text-emerald-400 transition-colors"
                            title="Capacitaciones"
                          >
                            <Target className="w-3 h-3" />
                            <span>{op.capacitaciones?.length || 1}</span>
                          </button>
                          <span className="text-slate-700">·</span>
                          <button
                            onClick={() => handleOpenFicha(op, 'skills')}
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-slate-800 text-amber-400 transition-colors"
                            title="Skills"
                          >
                            <Star className="w-3 h-3 fill-amber-400" />
                            <span>{op.skills?.length || 0}</span>
                          </button>
                          <span className="text-slate-700">·</span>
                          <button
                            onClick={() => handleOpenFicha(op, 'formaciones')}
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-slate-800 text-indigo-400 transition-colors"
                            title="Formación"
                          >
                            <GraduationCap className="w-3 h-3" />
                            <span>{op.formaciones?.length || 0}</span>
                          </button>
                          <span className="text-slate-700">·</span>
                          <button
                            onClick={() => handleOpenFicha(op, 'puestos')}
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-slate-800 text-purple-400 transition-colors"
                            title="Puestos y Líneas"
                          >
                            <ShieldCheck className="w-3 h-3" />
                            <span>{op.permisos?.length || 0}</span>
                          </button>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700">
                          {op.turno}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => toggleEstado(op)}
                          className={`text-xs font-bold px-2.5 py-1 rounded-full border transition-all ${
                            isActivo
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                          }`}
                        >
                          {isActivo ? 'Activo' : 'Inactivo'}
                        </button>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenFicha(op)}
                            className="p-2 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white rounded-xl transition-all border border-blue-500/30"
                            title="Ficha Completa 360°"
                          >
                            <Award className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(op)}
                            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all border border-slate-700"
                            title="Editar"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => confirmDelete(op)}
                            className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl transition-all border border-rose-500/20"
                            title="Eliminar"
                          >
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

      {/* ── MODAL FICHA 360° OPERARIO (SKILLS, FORMACIONES, PERMISOS, HISTORIAL) ── */}
      <AnimatePresence>
        {fichaOpen && selectedOp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-[1300px] h-[92vh] max-h-[920px] shadow-2xl flex flex-col md:flex-row overflow-hidden relative"
            >
              {/* ── MENÚ LATERAL DEL OPERARIO (LEFT SIDEBAR) ── */}
              <div className="w-full md:w-72 lg:w-80 bg-slate-900/95 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col justify-between shrink-0 overflow-y-auto no-scrollbar">
                {/* Cabecera / Perfil Operario en Menú Lateral */}
                <div className="p-5 border-b border-slate-800/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 font-mono font-black text-xs border border-blue-500/30">
                      {selectedOp.id}
                    </span>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase ${
                      selectedOp.estado === 'activo' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}>
                      {selectedOp.estado || 'Activo'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3.5">
                    {selectedOp.avatar ? (
                      <img src={selectedOp.avatar} alt={selectedOp.nombre} className="w-14 h-14 rounded-2xl object-cover border-2 border-blue-500 shadow-lg shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black text-lg shadow-lg shrink-0">
                        {selectedOp.nombre?.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h2 className="text-lg font-black text-white tracking-tight truncate">{selectedOp.nombre}</h2>
                      <p className="text-xs font-bold text-blue-400 truncate">{selectedOp.rol}</p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{selectedOp.especialidad}</p>
                    </div>
                  </div>

                  <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                      <span>Turno Asignado:</span>
                      <span className="text-amber-300 font-black">{selectedOp.turno}</span>
                    </div>
                    <div className="pt-1 border-t border-slate-800/60">
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                        🔴 / 👷 Puesto y Línea en Vivo:
                      </label>
                      <select
                        value={selectedOp.lineaActualId || 'ninguna'}
                        onChange={(e) => handleCambiarLineaVivo(selectedOp.id, e.target.value)}
                        className="w-full bg-slate-900 border border-amber-500/50 rounded-xl px-2.5 py-1.5 text-xs font-black text-amber-300 focus:outline-none"
                      >
                        <option value="ninguna">🔴 Fuera de turno / Sin Asignar</option>
                        {lineas.map(lin => (
                          <option key={lin.id} value={lin.id}>👷 {lin.nombre}</option>
                        ))}
                        <option value="L1">👷 Línea 1</option>
                        <option value="L2">👷 Línea 2</option>
                        <option value="L3">👷 Línea 3</option>
                        <option value="L4">👷 Línea 4</option>
                        <option value="L5">👷 Línea 5</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Lista de Opciones del Menú Lateral */}
                <nav className="flex-1 p-3 space-y-1 overflow-y-auto no-scrollbar">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-3 py-2">
                    MENÚ DE CUALIFICACIÓN 360°
                  </p>

                  <button
                    onClick={() => setActiveTabFicha('resumen')}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-black transition-all ${
                      activeTabFicha === 'resumen'
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50 translate-x-1'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <LayoutGrid className="w-4 h-4 shrink-0" />
                      <span>Resumen & Perfil</span>
                    </div>
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${activeTabFicha === 'resumen' ? 'opacity-100' : 'opacity-40'}`} />
                  </button>

                  <button
                    onClick={() => setActiveTabFicha('capacitaciones')}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-black transition-all ${
                      activeTabFicha === 'capacitaciones'
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50 translate-x-1'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Target className={`w-4 h-4 shrink-0 ${activeTabFicha === 'capacitaciones' ? 'text-white' : 'text-emerald-400'}`} />
                      <span>Capacitaciones</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] ${
                      activeTabFicha === 'capacitaciones' ? 'bg-emerald-900 text-white' : 'bg-slate-950 text-emerald-400'
                    }`}>
                      {selectedOp.capacitaciones?.length || 0}
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTabFicha('skills')}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-black transition-all ${
                      activeTabFicha === 'skills'
                        ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/50 translate-x-1'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Star className={`w-4 h-4 shrink-0 fill-amber-400 ${activeTabFicha === 'skills' ? 'text-white' : 'text-amber-400'}`} />
                      <span>Skills & Habilidades</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] ${
                      activeTabFicha === 'skills' ? 'bg-amber-900 text-white' : 'bg-slate-950 text-amber-400'
                    }`}>
                      {selectedOp.skills?.length || 0}
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTabFicha('formaciones')}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-black transition-all ${
                      activeTabFicha === 'formaciones'
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50 translate-x-1'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <GraduationCap className={`w-4 h-4 shrink-0 ${activeTabFicha === 'formaciones' ? 'text-white' : 'text-indigo-400'}`} />
                      <span>Formaciones & Cursos</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] ${
                      activeTabFicha === 'formaciones' ? 'bg-indigo-900 text-white' : 'bg-slate-950 text-indigo-400'
                    }`}>
                      {selectedOp.formaciones?.length || 0}
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTabFicha('puestos')}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-black transition-all ${
                      activeTabFicha === 'puestos' || activeTabFicha === 'permisos'
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/50 translate-x-1'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <ShieldCheck className={`w-4 h-4 shrink-0 ${activeTabFicha === 'puestos' || activeTabFicha === 'permisos' ? 'text-white' : 'text-purple-400'}`} />
                      <span>Puestos & Autorizaciones</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] ${
                      activeTabFicha === 'puestos' || activeTabFicha === 'permisos' ? 'bg-purple-900 text-white' : 'bg-slate-950 text-purple-400'
                    }`}>
                      {(selectedOp.permisos?.length || 0) + (selectedOp.autorizaciones?.length || 0)}
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTabFicha('historial')}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-black transition-all ${
                      activeTabFicha === 'historial'
                        ? 'bg-slate-700 text-white shadow-lg translate-x-1'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Layers className="w-4 h-4 shrink-0 text-slate-300" />
                      <span>Historial & Turnos</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-slate-950 text-slate-300 font-mono text-[10px]">
                      {selectedOp.historial?.length || 0}
                    </span>
                  </button>
                </nav>

                {/* Pie del Menú Lateral */}
                <div className="p-4 border-t border-slate-800 space-y-2">
                  <button
                    onClick={() => setFichaOpen(false)}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-black text-xs transition-all flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4 text-rose-400" />
                    <span>Cerrar Expediente</span>
                  </button>
                </div>
              </div>

              {/* ── CONTENIDO PRINCIPAL DE LA FICHA SEGÚN MENÚ LATERAL ── */}
              <div className="flex-1 flex flex-col h-full bg-slate-950/70 overflow-hidden">
                {/* Header de la sección seleccionada */}
                <div className="px-6 py-4 border-b border-slate-800/80 bg-slate-900/40 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg ${
                      activeTabFicha === 'resumen' ? 'bg-blue-600/20 border border-blue-500/40 text-blue-400' :
                      activeTabFicha === 'capacitaciones' ? 'bg-emerald-600/20 border border-emerald-500/40 text-emerald-400' :
                      activeTabFicha === 'skills' ? 'bg-amber-600/20 border border-amber-500/40 text-amber-400' :
                      activeTabFicha === 'formaciones' ? 'bg-indigo-600/20 border border-indigo-500/40 text-indigo-400' :
                      activeTabFicha === 'puestos' || activeTabFicha === 'permisos' ? 'bg-purple-600/20 border border-purple-500/40 text-purple-400' :
                      'bg-slate-800 border border-slate-700 text-slate-300'
                    }`}>
                      {activeTabFicha === 'resumen' && <LayoutGrid className="w-5 h-5" />}
                      {activeTabFicha === 'capacitaciones' && <Target className="w-5 h-5" />}
                      {activeTabFicha === 'skills' && <Star className="w-5 h-5 fill-amber-400" />}
                      {activeTabFicha === 'formaciones' && <GraduationCap className="w-5 h-5" />}
                      {(activeTabFicha === 'puestos' || activeTabFicha === 'permisos') && <ShieldCheck className="w-5 h-5" />}
                      {activeTabFicha === 'historial' && <Layers className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white tracking-tight">
                        {activeTabFicha === 'resumen' && 'Resumen Ejecutivo & Datos del Operario'}
                        {activeTabFicha === 'capacitaciones' && 'Evaluaciones de Competencia & Planes de Reciclaje (Capacitaciones)'}
                        {activeTabFicha === 'skills' && 'Matriz de Skills & Habilidades Técnicas'}
                        {activeTabFicha === 'formaciones' && 'Formaciones, Cursos PRL & Certificados'}
                        {(activeTabFicha === 'puestos' || activeTabFicha === 'permisos') && 'Puestos de Trabajo, Permisos & Autorizaciones Maestras'}
                        {activeTabFicha === 'historial' && 'Historial Cronológico de Turnos y Actuaciones'}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {activeTabFicha === 'resumen' && 'Información básica, credenciales PIN y síntesis de cualificación en planta.'}
                        {activeTabFicha === 'capacitaciones' && 'Evaluaciones periódicas y verificación de la brecha de competencias para su puesto.'}
                        {activeTabFicha === 'skills' && 'Niveles de maestría (1 a 5 estrellas) vinculados al catálogo maestro de skills.'}
                        {activeTabFicha === 'formaciones' && 'Control de vigencia, entidades certificadoras y cursos obligatorios PRL/ISO.'}
                        {(activeTabFicha === 'puestos' || activeTabFicha === 'permisos') && 'Carnets de operador, permisos en líneas y autorizaciones para subpartes de mantenimiento.'}
                        {activeTabFicha === 'historial' && 'Trazabilidad en tiempo real de fichajes, auditorías e incidencias del operario.'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setFichaOpen(false)}
                    className="md:hidden p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                {/* Área Scrollable del Contenido de la Sección */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                  {/* ── TAB 1: RESUMEN EJECUTIVO ── */}
                  {activeTabFicha === 'resumen' && (
                    <div className="space-y-6 animate-fade-in">
                      {/* Grid de 4 KPIs rápidos */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-slate-900/80 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between">
                          <div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Capacitaciones</p>
                            <p className="text-2xl font-black text-emerald-400 mt-1">{selectedOp.capacitaciones?.length || 0}</p>
                            <p className="text-[10px] text-slate-400 font-medium">Evaluaciones de Puesto</p>
                          </div>
                          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <Target className="w-6 h-6" />
                          </div>
                        </div>

                        <div className="bg-slate-900/80 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between">
                          <div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Skills Técnicas</p>
                            <p className="text-2xl font-black text-amber-400 mt-1">{selectedOp.skills?.length || 0}</p>
                            <p className="text-[10px] text-slate-400 font-medium">Habilidades calificados</p>
                          </div>
                          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <Star className="w-6 h-6 fill-amber-400" />
                          </div>
                        </div>

                        <div className="bg-slate-900/80 border border-indigo-500/30 rounded-2xl p-4 flex items-center justify-between">
                          <div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Formaciones</p>
                            <p className="text-2xl font-black text-indigo-400 mt-1">{selectedOp.formaciones?.length || 0}</p>
                            <p className="text-[10px] text-slate-400 font-medium">Cursos y cert. PRL</p>
                          </div>
                          <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            <GraduationCap className="w-6 h-6" />
                          </div>
                        </div>

                        <div className="bg-slate-900/80 border border-purple-500/30 rounded-2xl p-4 flex items-center justify-between">
                          <div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Puestos Habilitados</p>
                            <p className="text-2xl font-black text-purple-400 mt-1">{selectedOp.permisos?.length || 0}</p>
                            <p className="text-[10px] text-slate-400 font-medium">Líneas y máquinas</p>
                          </div>
                          <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            <ShieldCheck className="w-6 h-6" />
                          </div>
                        </div>
                      </div>

                      {/* Caja de Datos Personales & Credenciales */}
                      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
                        <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800/80 pb-3">
                          <Users className="w-4 h-4 text-blue-400" />
                          <span>Datos Contractuales y Credenciales de Terminal</span>
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                          <div>
                            <span className="block text-slate-400 font-bold mb-1">Identificador de Empleado (ID)</span>
                            <span className="font-mono font-black text-white bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 block">
                              {selectedOp.id}
                            </span>
                          </div>
                          <div>
                            <span className="block text-slate-400 font-bold mb-1">Nombre Completo</span>
                            <span className="font-bold text-white bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 block truncate">
                              {selectedOp.nombre}
                            </span>
                          </div>
                          <div>
                            <span className="block text-slate-400 font-bold mb-1">Correo Electrónico Corporativo</span>
                            <span className="font-mono font-bold text-blue-300 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 block truncate">
                              {selectedOp.email || `${selectedOp.nombre?.toLowerCase().replace(/\s+/g, '.') || 'operario'}@mpsproud.com`}
                            </span>
                          </div>
                          <div>
                            <span className="block text-slate-400 font-bold mb-1">Rol Operativo en Planta</span>
                            <span className="font-black text-amber-300 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 block">
                              {selectedOp.rol}
                            </span>
                          </div>
                          <div>
                            <span className="block text-slate-400 font-bold mb-1">PIN de Acceso en Terminal</span>
                            <span className="font-mono font-black text-emerald-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center justify-between">
                              <span>•••• ({selectedOp.pin || '1234'})</span>
                              <Key className="w-3.5 h-3.5 opacity-60" />
                            </span>
                          </div>
                          <div>
                            <span className="block text-slate-400 font-bold mb-1">Especialidad Técnica</span>
                            <span className="font-bold text-slate-200 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 block truncate">
                              {selectedOp.especialidad || 'Especialista en Línea'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Acciones Rápidas */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-400">Líneas Asignadas al Turno:</span>
                          {(selectedOp.lineas || []).map(lin => (
                            <span key={lin} className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300 font-black text-xs">
                              👷 {lin}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => { setFichaOpen(false); handleOpenEdit(selectedOp); }}
                            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs transition-all flex items-center gap-1.5 border border-slate-700"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Editar Operario</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── TAB 2: CAPACITACIONES (EVALUACIONES Y PLAN DE RECICLAJE) ── */}
                  {activeTabFicha === 'capacitaciones' && (
                    <div className="space-y-6 animate-fade-in">
                      {/* Banner KPI de Capacitación del Puesto */}
                      <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900/80 to-blue-950/60 border border-emerald-500/30 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <span className="px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase tracking-wider border border-emerald-500/30">
                            Evaluación de Desempeño & Reciclaje
                          </span>
                          <h4 className="text-xl font-black text-white">
                            Porcentaje de Capacitación vs Requisitos del Puesto: <span className="text-emerald-400">96% APTO</span>
                          </h4>
                          <p className="text-xs text-slate-300">
                            El operario cumple con holgura las competencias técnicas, skills e instrucciones de trabajo del catálogo para operar con máxima seguridad.
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="px-4 py-2.5 rounded-2xl bg-slate-950 border border-emerald-500/40 text-center">
                            <p className="text-[10px] font-bold uppercase text-slate-400">Brecha de Competencia</p>
                            <p className="text-sm font-black text-emerald-400 flex items-center justify-center gap-1 mt-0.5">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>0 Brechas Críticas</span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Formulario Rápido Añadir Capacitación / Evaluación */}
                      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg">
                        <p className="text-xs font-black uppercase text-emerald-400 flex items-center gap-1.5">
                          <PlusCircle className="w-4 h-4" />
                          <span>Registrar Nueva Evaluación o Reciclaje de Competencias</span>
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                          <div className="md:col-span-2">
                            <label className="block text-[11px] font-bold text-slate-400 mb-1">Título / Seleccionar desde Catálogo Maestro</label>
                            <div className="flex gap-2">
                              {catalogoCapacitaciones.length > 0 && (
                                <select
                                  onChange={(e) => {
                                    const item = catalogoCapacitaciones.find(c => c.titulo === e.target.value);
                                    if (item) {
                                      setCapTitulo(item.titulo);
                                      setCapPlan(item.plan || 'Plan Anual de Reciclaje');
                                      if (item.puntuacionMinima) setCapPuntuacion(item.puntuacionMinima);
                                      if (item.descripcion) setCapObservaciones(item.descripcion);
                                    }
                                  }}
                                  className="bg-slate-950 border border-emerald-500/40 rounded-xl px-2.5 py-2 text-xs font-bold text-emerald-300 focus:outline-none shrink-0 max-w-[170px]"
                                >
                                  <option value="">🎯 Catálogo Maestro...</option>
                                  {catalogoCapacitaciones.map(c => (
                                    <option key={c.id} value={c.titulo}>{c.titulo}</option>
                                  ))}
                                </select>
                              )}
                              <input
                                type="text"
                                value={capTitulo}
                                onChange={(e) => setCapTitulo(e.target.value)}
                                placeholder="Ej: Evaluación Anual de Soldadura y Calidad EOL"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 mb-1">Plan de Desarrollo</label>
                            <input
                              type="text"
                              value={capPlan}
                              onChange={(e) => setCapPlan(e.target.value)}
                              placeholder="Ej: Plan Anual 2026"
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 mb-1">Puntuación / Nota (%)</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={capPuntuacion}
                              onChange={(e) => setCapPuntuacion(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-black text-emerald-400 focus:outline-none"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end pt-1">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 mb-1">Resultado de Capacitación</label>
                            <select
                              value={capEstado}
                              onChange={(e) => setCapEstado(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-emerald-400 focus:outline-none"
                            >
                              <option value="superada">✅ Superada / Apto (100%)</option>
                              <option value="pendiente_reciclaje">⏳ Pendiente de Reciclaje</option>
                              <option value="no_apto">🔴 No Apto / Requiere Formación</option>
                            </select>
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-[11px] font-bold text-slate-400 mb-1">Observaciones del Evaluador</label>
                            <input
                              type="text"
                              value={capObservaciones}
                              onChange={(e) => setCapObservaciones(e.target.value)}
                              placeholder="Detalles sobre el desempeño en el puesto..."
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-300 focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={handleAddCapacitacionToOp}
                              className="w-full px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/50"
                            >
                              <Target className="w-3.5 h-3.5" />
                              <span>Registrar Evaluación</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Listado de Capacitaciones */}
                      <div className="space-y-3">
                        {(selectedOp.capacitaciones || []).map((cap, idx) => {
                          const esSuperada = cap.estado === 'superada';
                          return (
                            <div key={idx} className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-emerald-500/40 transition-colors">
                              <div className="space-y-1.5 flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                    esSuperada ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                  }`}>
                                    {esSuperada ? 'Evaluación Superada' : 'Pendiente Reciclaje'}
                                  </span>
                                  <h4 className="font-black text-white text-base truncate">{cap.titulo}</h4>
                                </div>
                                <p className="text-xs text-slate-300 font-medium">Plan de Cualificación: <strong className="text-emerald-300">{cap.plan || 'Plan Anual MES'}</strong></p>
                                <p className="text-xs text-slate-400 italic">"{cap.observaciones || 'Sin comentarios adicionales del evaluador.'}"</p>
                                <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-slate-400 pt-1">
                                  <span>📅 Fecha: <strong className="text-white">{cap.fecha || '2026-05-15'}</strong></span>
                                  <span>🧑‍⚖️ Evaluador: <strong className="text-slate-300">{cap.evaluador || 'Supervisor de Planta'}</strong></span>
                                </div>
                              </div>

                              <div className="flex items-center gap-4 self-end md:self-center shrink-0">
                                <div className="bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 text-center">
                                  <p className="text-[9px] font-bold text-slate-400 uppercase">Nota</p>
                                  <p className="text-lg font-black text-emerald-400">{cap.puntuacion || 95}%</p>
                                </div>
                                <button
                                  onClick={() => handleRemoveCapacitacionFromOp(cap.id)}
                                  className="p-2.5 rounded-xl bg-slate-950 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-colors"
                                  title="Borrar capacitación"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                        {(selectedOp.capacitaciones || []).length === 0 && (
                          <div className="py-10 text-center text-slate-500 font-bold bg-slate-900/30 rounded-2xl border border-dashed border-slate-800">
                            No se han registrado evaluations de competencia o capacitaciones en este expediente.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── TAB 3: SKILLS ── */}
                  {activeTabFicha === 'skills' && (
                  <div className="space-y-6">
                    {/* Formulario Rápido Añadir/Evaluar Skill */}
                    <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
                      <p className="text-xs font-black uppercase text-amber-400 flex items-center gap-1.5">
                        <PlusCircle className="w-4 h-4" />
                        <span>Vincular / Evaluar Skill desde Catálogo Maestro</span>
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                        <div className="md:col-span-2">
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">Seleccionar Skill</label>
                          <select
                            value={skillToAdd}
                            onChange={(e) => setSkillToAdd(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-amber-400"
                          >
                            {catalogoSkills.map(sk => (
                              <option key={sk.id} value={sk.nombre}>{sk.nombre} ({sk.categoria})</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">Valoración (Estrellas)</label>
                          <select
                            value={skillValoracion}
                            onChange={(e) => setSkillValoracion(Number(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-amber-400 focus:outline-none"
                          >
                            <option value={5}>⭐⭐⭐⭐⭐ (5/5 Maestro)</option>
                            <option value={4}>⭐⭐⭐⭐ (4/5 Avanzado)</option>
                            <option value={3}>⭐⭐⭐ (3/5 Intermedio)</option>
                            <option value={2}>⭐⭐ (2/5 Básico)</option>
                            <option value={1}>⭐ (1/5 Principiante)</option>
                          </select>
                        </div>
                        <div>
                          <button
                            type="button"
                            onClick={handleAddSkillToOp}
                            className="w-full px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all flex items-center justify-center gap-1.5 shadow-md"
                          >
                            <Star className="w-3.5 h-3.5 fill-slate-950" />
                            <span>Evaluar / Añadir</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Listado de Skills */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(selectedOp.skills || []).map((sk, idx) => (
                        <div key={idx} className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between gap-3 group hover:border-amber-500/40 transition-colors">
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-white text-sm truncate">{sk.nombre}</span>
                            </div>
                            <div className="flex items-center gap-1 text-amber-400">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-3.5 h-3.5 ${i < sk.valoracion ? 'fill-amber-400' : 'text-slate-700'}`} />
                              ))}
                              <span className="text-xs font-black ml-1.5 text-slate-300">({sk.valoracion}/5 · {sk.nivel || 'Calificado'})</span>
                            </div>
                            <p className="text-[10px] text-slate-500">Última evaluación: {sk.ultimaEvaluacion || 'Reciente'}</p>
                          </div>
                          <button
                            onClick={() => handleRemoveSkillFromOp(sk.nombre)}
                            className="p-2 rounded-xl bg-slate-900 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-colors shrink-0"
                            title="Eliminar skill"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      {(selectedOp.skills || []).length === 0 && (
                        <div className="col-span-full py-8 text-center text-slate-500 font-bold bg-slate-950/30 rounded-2xl border border-dashed border-slate-800">
                          Este operario aún no tiene skills valoradas en su ficha.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── TAB FORMACIONES (CON FECHAS) ── */}
                {activeTabFicha === 'formaciones' && (
                  <div className="space-y-6">
                    {/* Formulario Rápido Añadir Formación */}
                    <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
                      <p className="text-xs font-black uppercase text-indigo-400 flex items-center gap-1.5">
                        <GraduationCap className="w-4 h-4" />
                        <span>Registrar Nueva Formación / Certificación</span>
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                        <div className="md:col-span-2">
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">Curso o Formación Maestro</label>
                          <select
                            value={formacionToAdd}
                            onChange={(e) => setFormacionToAdd(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
                          >
                            {catalogoFormaciones.map(fm => (
                              <option key={fm.id} value={fm.nombre}>{fm.nombre} ({fm.horas} hrs · {fm.entidadCertificadora})</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">Fecha Obtención</label>
                          <input
                            type="date"
                            value={formacionFechaObt}
                            onChange={(e) => setFormacionFechaObt(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-bold text-white focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">Fecha Caducidad</label>
                          <input
                            type="date"
                            value={formacionFechaCad}
                            onChange={(e) => setFormacionFechaCad(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-bold text-white focus:outline-none"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={handleAddFormacionToOp}
                          className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs transition-all flex items-center gap-1.5 shadow-md"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Añadir Certificado</span>
                        </button>
                      </div>
                    </div>

                    {/* Listado de Formaciones */}
                    <div className="space-y-3">
                      {(selectedOp.formaciones || []).map((fm, idx) => {
                        const esVigente = fm.estado === 'vigente' || new Date(fm.fechaCaducidad) > new Date();
                        return (
                          <div key={idx} className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-indigo-500/40 transition-colors">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                  esVigente ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                }`}>
                                  {esVigente ? 'Vigente' : 'Caducado'}
                                </span>
                                <h4 className="font-black text-white text-sm">{fm.nombre}</h4>
                              </div>
                              <p className="text-xs text-slate-400">Entidad Certificadora: <strong className="text-slate-300">{fm.entidad || 'TÜV / Oficial'}</strong></p>
                              <div className="flex items-center gap-4 text-xs font-mono text-slate-400 pt-1">
                                <span>📅 Obtención: <strong className="text-white">{fm.fechaObtencion || '2025-01-10'}</strong></span>
                                <span>⏳ Caducidad: <strong className={esVigente ? 'text-indigo-300' : 'text-rose-400 font-bold'}>{fm.fechaCaducidad || '2027-01-10'}</strong></span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveFormacionFromOp(fm.nombre)}
                              className="p-2 rounded-xl bg-slate-900 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-colors self-end md:self-center"
                              title="Borrar formación"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                      {(selectedOp.formaciones || []).length === 0 && (
                        <div className="py-8 text-center text-slate-500 font-bold bg-slate-950/30 rounded-2xl border border-dashed border-slate-800">
                          No se han registrado formaciones o cursos de prevención para este operario.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── TAB PERMISOS EN LÍNEAS / MÁQUINAS (PUESTOS DE TRABAJO) ── */}
                {(activeTabFicha === 'permisos' || activeTabFicha === 'puestos') && (
                  <div className="space-y-6">
                    {/* Formulario Rápido Añadir Permiso */}
                    <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
                      <p className="text-xs font-black uppercase text-purple-400 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Conceder Permiso para Trabajar en Línea / Máquina</span>
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                        <div className="md:col-span-2">
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">Equipo o Línea del Catálogo</label>
                          <select
                            value={permisoToAdd}
                            onChange={(e) => setPermisoToAdd(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-purple-500"
                          >
                            {catalogoPermisos.map(p => (
                              <option key={p.id} value={p.equipoNombre}>{p.equipoNombre} ({p.tipo})</option>
                            ))}
                            {lineas.map(l => (
                              <option key={l.id} value={l.nombre}>Línea {l.id} · {l.nombre}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">Nivel de Acceso</label>
                          <select
                            value={permisoNivelAcceso}
                            onChange={(e) => setPermisoNivelAcceso(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-purple-300 focus:outline-none"
                          >
                            <option value="Operador Principal">Operador Principal</option>
                            <option value="Ajustador / Técnico">Ajustador / Técnico</option>
                            <option value="Inspector de Calidad">Inspector de Calidad</option>
                            <option value="Jefe de Línea / Supervisor">Jefe de Línea / Supervisor</option>
                          </select>
                        </div>
                        <div>
                          <button
                            type="button"
                            onClick={handleAddPermisoToOp}
                            className="w-full px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs transition-all flex items-center justify-center gap-1.5 shadow-md"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Conceder Permiso</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Listado de Permisos */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(selectedOp.permisos || []).map((p, idx) => (
                        <div key={idx} className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between gap-3 hover:border-purple-500/40 transition-colors">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {p.tipo === 'linea' ? (
                                <Factory className="w-4 h-4 text-blue-400 shrink-0" />
                              ) : (
                                <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
                              )}
                              <h4 className="font-black text-white text-sm">{p.equipoNombre}</h4>
                            </div>
                            <p className="text-xs text-purple-300 font-bold">Nivel: {p.nivelAcceso || 'Operario Certificado'}</p>
                            <p className="text-[10px] text-slate-500 font-mono">ID: {p.equipoId} · Autorizado por: {p.autorizadoPor || 'Dir. Operaciones'}</p>
                          </div>
                          <button
                            onClick={() => handleRemovePermisoFromOp(p.id)}
                            className="p-2 rounded-xl bg-slate-900 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-colors shrink-0"
                            title="Revocar permiso"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      {(selectedOp.permisos || []).length === 0 && (
                        <div className="col-span-full py-8 text-center text-slate-500 font-bold bg-slate-950/30 rounded-2xl border border-dashed border-slate-800">
                          Aún no se han configurado permisos específicos de operación para este operario.
                        </div>
                      )}
                    </div>

                    {/* ── AUTORIZACIONES DE OPERACIÓN & SUBPARTES DE MANTENIMIENTO ── */}
                    <div className="pt-6 border-t border-slate-800 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-black text-white flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-rose-400" />
                            <span>Autorizaciones del Operario (Líneas & Subpartes Mantenimiento)</span>
                          </h4>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Carnets y habilitaciones para intervención preventiva/correctiva o rearme según las líneas y subpartes asignadas.
                          </p>
                        </div>
                        <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 self-start sm:self-auto">
                          {(selectedOp.autorizaciones || []).length} autorizaciones activas
                        </span>
                      </div>

                      {/* Formulario rápido para asignar Autorización */}
                      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
                        <p className="text-xs font-black uppercase text-rose-400 flex items-center gap-1.5">
                          <PlusCircle className="w-4 h-4" />
                          <span>Asignar Autorización / Habilitación Técnica</span>
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                          <div className="md:col-span-2">
                            <label className="block text-[11px] font-bold text-slate-400 mb-1">Autorización del Catálogo 360</label>
                            <select
                              value={autorizacionToAdd}
                              onChange={(e) => setAutorizacionToAdd(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-rose-500"
                            >
                              <option value="">Selecciona autorización...</option>
                              {catalogoAutorizaciones.map(a => (
                                <option key={a.id} value={a.nombre}>
                                  [{a.codigo}] {a.nombre} · ({a.targetNombre})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 mb-1">Nivel / Rol Concedido</label>
                            <input
                              type="text"
                              value={autorizacionNivelConcedido}
                              onChange={(e) => setAutorizacionNivelConcedido(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-rose-300 focus:outline-none focus:border-rose-500"
                              placeholder="ej: Operador Maestro / Rearme"
                            />
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={handleAddAutorizacionToOp}
                              disabled={!autorizacionToAdd}
                              className="w-full px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-black text-xs transition-all flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Conceder Autorización</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Listado de Autorizaciones Asignadas */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {(selectedOp.autorizaciones || []).map((auth, idx) => (
                          <div key={idx} className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between gap-3 hover:border-rose-500/40 transition-colors">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase font-mono ${
                                  auth.tipo === 'linea' ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30' : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                                }`}>
                                  {auth.codigo || auth.id}
                                </span>
                                <h4 className="font-black text-white text-sm leading-snug">{auth.nombre}</h4>
                              </div>
                              <p className="text-xs text-rose-300 font-bold">
                                Ámbito: <span className="text-white">{auth.targetNombre || auth.targetId}</span>
                              </p>
                              <p className="text-[11px] text-slate-400">
                                Nivel Concedido: <strong className="text-slate-200">{auth.nivelConcedido || 'Intervención Completa'}</strong>
                              </p>
                              <p className="text-[10px] text-slate-500 font-mono">
                                Asignada el: {auth.fechaAsignacion || new Date().toISOString().slice(0,10)}
                              </p>
                            </div>
                            <button
                              onClick={() => handleRemoveAutorizacionFromOp(auth.id || auth.autorizacionId)}
                              className="p-2 rounded-xl bg-slate-900 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-colors shrink-0"
                              title="Revocar autorización"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        {(selectedOp.autorizaciones || []).length === 0 && (
                          <div className="col-span-full py-8 text-center text-slate-500 font-bold bg-slate-950/30 rounded-2xl border border-dashed border-slate-800">
                            No se han concedido autorizaciones específicas para líneas ni subpartes de mantenimiento a este operario.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── TAB HISTORIAL DE TURNOS & ACTUACIONES ── */}
                {activeTabFicha === 'historial' && (
                  <div className="space-y-3 pl-2">
                    {(selectedOp.historial || []).map((item, idx) => (
                      <div key={idx} className="relative pl-6 pb-4 border-l-2 border-slate-800 last:border-0 last:pb-0">
                        <div className="absolute -left-[7px] top-0.5 w-3 h-3 rounded-full bg-blue-500 border-2 border-slate-900" />
                        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-mono text-slate-400">{item.fecha}</span>
                            <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-black text-[10px] uppercase">
                              {item.tipo}
                            </span>
                          </div>
                          <p className="text-sm font-bold text-white">{item.descripcion}</p>
                          {item.linea && (
                            <p className="text-xs font-semibold text-slate-400 flex items-center gap-1 mt-1">
                              <Factory className="w-3 h-3 text-amber-400" />
                              <span>Línea / Puesto: <strong className="text-amber-300">{item.linea}</strong></span>
                              {item.piezas > 0 && <span>· Piezas producidas: <strong className="text-emerald-400 font-mono">{item.piezas} uds</strong></span>}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                    {(selectedOp.historial || []).length === 0 && (
                      <div className="py-8 text-center text-slate-500 font-bold bg-slate-950/30 rounded-2xl border border-dashed border-slate-800">
                        No hay registros en el historial reciente de este operario.
                      </div>
                    )}
                  </div>
                )}
              </div>

                {/* Pie con botón cerrar en la columna principal */}
                <div className="px-6 py-4 border-t border-slate-800/80 bg-slate-900/40 flex items-center justify-between shrink-0">
                  <span className="text-[11px] font-bold text-slate-400 hidden sm:inline">
                    💡 Todos los cambios y evaluaciones se guardan de forma instantánea en el expediente 360°.
                  </span>
                  <button
                    onClick={() => setFichaOpen(false)}
                    className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white hover:text-rose-300 font-black text-xs transition-all flex items-center gap-2 shadow-lg"
                  >
                    <XCircle className="w-4 h-4 text-rose-400" />
                    <span>Cerrar Expediente</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL CRUD DE ALTA / EDICIÓN DE OPERARIO ── */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <div className="flex items-center justify-between pb-5 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                    <UserPlus className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white">
                      {editingId ? 'Editar Datos Básicos del Operario' : 'Alta de Nuevo Operario'}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">Asigna líneas de producción, turno y credenciales PIN</p>
                  </div>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="mt-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Código ID Operario *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.id}
                      onChange={e => setFormData({ ...formData, id: e.target.value })}
                      placeholder="Ej: OP-009"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-black text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Nombre y Apellidos *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nombre}
                      onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                      placeholder="Ej: Laura Torres"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Rol / Puesto
                    </label>
                    <select
                      value={formData.rol}
                      onChange={e => setFormData({ ...formData, rol: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="Operario Especialista">Operario Especialista</option>
                      <option value="Jefe de Línea">Jefe de Línea</option>
                      <option value="Electromecánico">Electromecánico</option>
                      <option value="Operario de Calidad">Operario de Calidad</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Turno Habitual
                    </label>
                    <select
                      value={formData.turno}
                      onChange={e => setFormData({ ...formData, turno: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="Mañana">Mañana (06:00 - 14:00)</option>
                      <option value="Tarde">Tarde (14:00 - 22:00)</option>
                      <option value="Noche">Noche (22:00 - 06:00)</option>
                      <option value="Rotativo">Rotativo</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Especialidad o Descripción de Puesto
                  </label>
                  <input
                    type="text"
                    value={formData.especialidad}
                    onChange={e => setFormData({ ...formData, especialidad: e.target.value })}
                    placeholder="Ej: Soldadura láser, Ensamblaje BMS, Test EOL..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Líneas de Producción Capacitadas *</span>
                    <span className="text-[10px] text-blue-400 font-normal">Haz clic para seleccionar múltiples</span>
                  </label>
                  <div className="flex flex-wrap gap-2.5 p-3 rounded-2xl bg-slate-950 border border-slate-800">
                    {['L1', 'L2', 'L3', 'L4', 'L5'].map(l => {
                      const isSel = formData.lineas.includes(l);
                      const linInfo = lineas.find(item => item.id === l);
                      return (
                        <button
                          type="button"
                          key={l}
                          onClick={() => toggleLineaSelection(l)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 border ${
                            isSel
                              ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-900/50'
                              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
                          }`}
                        >
                          <span>{l}</span>
                          {linInfo && <span className="font-normal opacity-80 text-[11px]">({linInfo.nombre})</span>}
                          {isSel && <CheckCircle2 className="w-3.5 h-3.5 ml-1" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-purple-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-purple-400" />
                      <span>PIN de Kiosko (Para Login en Puesto)</span>
                    </label>
                    <input
                      type="password"
                      maxLength="6"
                      value={formData.pin}
                      onChange={e => setFormData({ ...formData, pin: e.target.value })}
                      placeholder="4 dígitos numéricos (ej: 1234)"
                      className="w-full bg-slate-950 border border-purple-500/30 rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-purple-300 focus:outline-none focus:border-purple-500"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Preparado para autenticación y trazabilidad por operario
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span>Foto del Operario (Desde PC)</span>
                      {formData.avatar && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, avatar: '' })}
                          className="text-[10px] text-rose-400 hover:underline font-normal"
                        >
                          Eliminar foto
                        </button>
                      )}
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-inner">
                        {formData.avatar ? (
                          <img src={formData.avatar} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <UserPlus className="w-6 h-6 text-slate-600" />
                        )}
                      </div>
                      <label className="flex-1 cursor-pointer bg-slate-950 hover:bg-slate-800/80 border border-dashed border-slate-700 hover:border-blue-500 rounded-2xl px-4 py-3 flex flex-col items-center justify-center text-center transition-all group">
                        <span className="text-xs font-bold text-blue-400 group-hover:text-blue-300 flex items-center gap-1.5">
                          <Upload className="w-4 h-4" />
                          <span>Seleccionar imagen del PC</span>
                        </span>
                        <span className="text-[10px] text-slate-500 mt-0.5">JPG, PNG o WEBP (se optimiza localmente)</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-blue-900/50 flex items-center gap-2 transition-all active:scale-95"
                  >
                    {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
                    <span>{editingId ? 'Guardar Cambios' : 'Dar de Alta'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── DIALOG DE CONFIRMACIÓN DE BORRADO ── */}
      <ConfirmDialog
        open={confirmOpen}
        title="¿Eliminar Operario?"
        message={`Estás a punto de eliminar al operario "${targetDelete?.nombre}" (ID: ${targetDelete?.id}) del catálogo. Esta acción quitará al operario de la asignación en las líneas de producción.`}
        confirmText="Sí, Eliminar Operario"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => { setConfirmOpen(false); setTargetDelete(null); }}
      />
    </div>
  );
}
