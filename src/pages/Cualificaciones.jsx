import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award, GraduationCap, ShieldCheck, Plus, Search, Edit3, Trash2,
  CheckCircle2, AlertCircle, XCircle, ChevronRight, SlidersHorizontal,
  BookmarkCheck, Sparkles, BookOpen, Layers, Cpu, Factory, RefreshCw,
  Users, Star, CheckSquare, Target, Calendar, BarChart3, Clock
} from 'lucide-react';
import {
  getCatalogoSkills, saveCatalogoSkills,
  getCatalogoFormaciones, saveCatalogoFormaciones,
  getCatalogoPermisos, saveCatalogoPermisos,
  getCatalogoCapacitaciones, saveCatalogoCapacitaciones,
  getCatalogoAutorizaciones, saveCatalogoAutorizaciones,
  fetchLineas, fetchOperarios, updateOperario, fetchActivosMantenimientoEditable
} from '@/services/dataService';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

export default function Cualificaciones() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabParam = searchParams.get('tab');
  const activeTab = activeTabParam && ['skills', 'formaciones', 'capacitaciones', 'permisos', 'autorizaciones', 'matriz'].includes(activeTabParam)
    ? activeTabParam
    : 'skills';

  const setActiveTab = (tab) => {
    setSearchParams({ tab });
  };

  const [skills, setSkills] = useState([]);
  const [formaciones, setFormaciones] = useState([]);
  const [capacitaciones, setCapacitaciones] = useState([]);
  const [permisos, setPermisos] = useState([]);
  const [autorizaciones, setAutorizaciones] = useState([]);
  const [activosMantenimiento, setActivosMantenimiento] = useState([]);
  const [lineas, setLineas] = useState([]);
  const [operarios, setOperarios] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal CRUD general
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [editingItem, setEditingItem] = useState(null);

  // Form states según pestaña
  const [formDataSkill, setFormDataSkill] = useState({ id: '', nombre: '', categoria: 'Técnica / Proceso', descripcion: '', nivelMaximo: 'Maestro (5)' });
  const [formDataFormacion, setFormDataFormacion] = useState({ id: '', nombre: '', horas: 20, periodicidadMeses: 24, entidadCertificadora: 'TÜV Rheinland Academy', obligatorio: true });
  const [formDataCapacitacion, setFormDataCapacitacion] = useState({ id: '', titulo: '', categoria: 'Cualificación General', plan: 'Plan Anual de Reciclaje 2026', evaluadorDefault: 'Comité Técnico / Dir. Operaciones', periodicidadMeses: 12, puntuacionMinima: 85, descripcion: '' });
  const [formDataPermiso, setFormDataPermiso] = useState({ id: '', equipoId: 'L1', equipoNombre: 'Línea 1 · Ensamblaje Baterías LFP', tipo: 'linea', skillRequerida: '', formacionRequerida: '', nivelMinimo: 'Avanzado (4)' });
  const [formDataAutorizacion, setFormDataAutorizacion] = useState({ id: '', codigo: '', nombre: '', tipo: 'linea', targetId: 'L-01', targetNombre: 'Línea 1 — Montaje Rápido', nivelRequerido: 'Avanzado (4) + PRL Alta Tensión', validezMeses: 24, descripcion: '' });

  // Modal para asignación de autorizaciones a operarios
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedAuthAssign, setSelectedAuthAssign] = useState(null);
  const [assignBusqueda, setAssignBusqueda] = useState('');

  // Dialogo de confirmación para borrado
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetDelete, setTargetDelete] = useState(null);

  const flattenActivos = (nodos, res = []) => {
    if (!nodos) return res;
    nodos.forEach(n => {
      if (['maquina', 'componente', 'subparte', 'estacion'].includes(n.tipo)) {
        res.push(n);
      }
      if (n.hijos) flattenActivos(n.hijos, res);
    });
    return res;
  };

  const loadData = async () => {
    setSkills(getCatalogoSkills() || []);
    setFormaciones(getCatalogoFormaciones() || []);
    setCapacitaciones(getCatalogoCapacitaciones() || []);
    setPermisos(getCatalogoPermisos() || []);
    setAutorizaciones(getCatalogoAutorizaciones() || []);
    const [resL, resOp, resAct] = await Promise.all([fetchLineas(), fetchOperarios(), fetchActivosMantenimientoEditable()]);
    if (resL?.data) setLineas(resL.data);
    if (resOp?.data) setOperarios(resOp.data);
    if (resAct?.data) setActivosMantenimiento(flattenActivos(resAct.data));
  };

  useEffect(() => {
    loadData();
    const handler = () => loadData();
    window.addEventListener('cualificaciones_updated', handler);
    window.addEventListener('operarios_updated', handler);
    return () => {
      window.removeEventListener('cualificaciones_updated', handler);
      window.removeEventListener('operarios_updated', handler);
    };
  }, []);

  const triggerSuccess = (text) => {
    setSuccessMsg(text);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  // Filtrados
  const filteredSkills = useMemo(() => {
    if (!busqueda.trim()) return skills;
    const q = busqueda.toLowerCase();
    return skills.filter(s => s.nombre?.toLowerCase().includes(q) || s.categoria?.toLowerCase().includes(q) || s.id?.toLowerCase().includes(q));
  }, [skills, busqueda]);

  const filteredFormaciones = useMemo(() => {
    if (!busqueda.trim()) return formaciones;
    const q = busqueda.toLowerCase();
    return formaciones.filter(f => f.nombre?.toLowerCase().includes(q) || f.entidadCertificadora?.toLowerCase().includes(q) || f.id?.toLowerCase().includes(q));
  }, [formaciones, busqueda]);

  const filteredCapacitaciones = useMemo(() => {
    if (!busqueda.trim()) return capacitaciones;
    const q = busqueda.toLowerCase();
    return capacitaciones.filter(c => c.titulo?.toLowerCase().includes(q) || c.plan?.toLowerCase().includes(q) || c.categoria?.toLowerCase().includes(q) || c.id?.toLowerCase().includes(q));
  }, [capacitaciones, busqueda]);

  const filteredPermisos = useMemo(() => {
    if (!busqueda.trim()) return permisos;
    const q = busqueda.toLowerCase();
    return permisos.filter(p => p.equipoNombre?.toLowerCase().includes(q) || p.equipoId?.toLowerCase().includes(q) || p.skillRequerida?.toLowerCase().includes(q) || p.formacionRequerida?.toLowerCase().includes(q));
  }, [permisos, busqueda]);

  const filteredAutorizaciones = useMemo(() => {
    if (!busqueda.trim()) return autorizaciones;
    const q = busqueda.toLowerCase();
    return autorizaciones.filter(a => a.nombre?.toLowerCase().includes(q) || a.codigo?.toLowerCase().includes(q) || a.targetNombre?.toLowerCase().includes(q) || a.tipo?.toLowerCase().includes(q) || a.descripcion?.toLowerCase().includes(q));
  }, [autorizaciones, busqueda]);

  // Manejadores CRUD: abrir nuevo
  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem(null);
    if (activeTab === 'skills') {
      setFormDataSkill({ id: `SK-0${skills.length + 1}`, nombre: '', categoria: 'Técnica / Proceso', descripcion: '', nivelMaximo: 'Maestro (5)' });
    } else if (activeTab === 'formaciones') {
      setFormDataFormacion({ id: `FM-0${formaciones.length + 1}`, nombre: '', horas: 16, periodicidadMeses: 24, entidadCertificadora: 'TÜV Rheinland Academy', obligatorio: true });
    } else if (activeTab === 'capacitaciones') {
      setFormDataCapacitacion({ id: `PLAN-0${capacitaciones.length + 1}`, titulo: '', categoria: 'Cualificación General', plan: 'Plan Anual de Reciclaje 2026', evaluadorDefault: 'Comité Técnico / Dir. Operaciones', periodicidadMeses: 12, puntuacionMinima: 85, descripcion: '' });
    } else if (activeTab === 'permisos') {
      setFormDataPermiso({
        id: `PERM-0${permisos.length + 1}`,
        equipoId: lineas[0]?.id || 'L1',
        equipoNombre: lineas[0]?.nombre || 'Línea 1 · Ensamblaje Baterías LFP',
        tipo: 'linea',
        skillRequerida: skills[0]?.nombre || '',
        formacionRequerida: formaciones[0]?.nombre || '',
        nivelMinimo: 'Avanzado (4)'
      });
    } else if (activeTab === 'autorizaciones') {
      const defLine = lineas[0];
      setFormDataAutorizacion({
        id: `AUT-0${autorizaciones.length + 1}`,
        codigo: `AUTH-L${defLine?.id || '1'}-OPS`,
        nombre: `Autorización Operativa · ${defLine?.nombre || 'Línea 1'}`,
        tipo: 'linea',
        targetId: defLine ? `L-${defLine.id}` : 'L-01',
        targetNombre: defLine ? `Línea ${defLine.id} · ${defLine.nombre}` : 'Línea 1 — Montaje Rápido',
        nivelRequerido: 'Avanzado (4) + PRL Alta Tensión',
        validezMeses: 24,
        descripcion: ''
      });
    }
    setModalOpen(true);
  };

  // Manejadores CRUD: abrir edit
  const handleOpenEdit = (item) => {
    setModalMode('edit');
    setEditingItem(item);
    if (activeTab === 'skills') setFormDataSkill({ ...item });
    else if (activeTab === 'formaciones') setFormDataFormacion({ ...item });
    else if (activeTab === 'capacitaciones') setFormDataCapacitacion({ ...item });
    else if (activeTab === 'permisos') setFormDataPermiso({ ...item });
    else if (activeTab === 'autorizaciones') setFormDataAutorizacion({ ...item });
    setModalOpen(true);
  };

  // Guardar
  const handleSave = (e) => {
    e.preventDefault();
    if (activeTab === 'skills') {
      if (!formDataSkill.nombre.trim()) return;
      let newLista;
      if (modalMode === 'create') {
        const item = { ...formDataSkill, id: formDataSkill.id || `SK-${Date.now().toString().slice(-4)}` };
        newLista = [...skills, item];
      } else {
        newLista = skills.map(s => s.id === editingItem.id ? { ...formDataSkill } : s);
      }
      setSkills(newLista);
      saveCatalogoSkills(newLista);
      triggerSuccess(modalMode === 'create' ? '✨ Skill creada y publicada en el catálogo maestro' : '✅ Skill modificada correctamente');
    } else if (activeTab === 'formaciones') {
      if (!formDataFormacion.nombre.trim()) return;
      let newLista;
      if (modalMode === 'create') {
        const item = { ...formDataFormacion, id: formDataFormacion.id || `FM-${Date.now().toString().slice(-4)}` };
        newLista = [...formaciones, item];
      } else {
        newLista = formaciones.map(f => f.id === editingItem.id ? { ...formDataFormacion } : f);
      }
      setFormaciones(newLista);
      saveCatalogoFormaciones(newLista);
      triggerSuccess(modalMode === 'create' ? '🎓 Curso/Formación añadido al catálogo maestro' : '✅ Formación actualizada correctamente');
    } else if (activeTab === 'capacitaciones') {
      if (!formDataCapacitacion.titulo.trim()) return;
      let newLista;
      if (modalMode === 'create') {
        const item = { ...formDataCapacitacion, id: formDataCapacitacion.id || `PLAN-${Date.now().toString().slice(-4)}` };
        newLista = [...capacitaciones, item];
      } else {
        newLista = capacitaciones.map(c => c.id === editingItem.id ? { ...formDataCapacitacion } : c);
      }
      setCapacitaciones(newLista);
      saveCatalogoCapacitaciones(newLista);
      triggerSuccess(modalMode === 'create' ? '🎯 Plan de Capacitación registrado en el catálogo maestro' : '✅ Plan de capacitación modificado correctamente');
    } else if (activeTab === 'permisos') {
      if (!formDataPermiso.equipoId.trim()) return;
      let newLista;
      if (modalMode === 'create') {
        const item = { ...formDataPermiso, id: formDataPermiso.id || `PERM-${Date.now().toString().slice(-4)}` };
        newLista = [...permisos, item];
      } else {
        newLista = permisos.map(p => p.id === editingItem.id ? { ...formDataPermiso } : p);
      }
      setPermisos(newLista);
      saveCatalogoPermisos(newLista);
      triggerSuccess(modalMode === 'create' ? '🛡️ Permiso y cualificación vinculada a equipo' : '✅ Regla de permiso modificada');
    } else if (activeTab === 'autorizaciones') {
      if (!formDataAutorizacion.nombre.trim()) return;
      let newLista;
      if (modalMode === 'create') {
        const item = { ...formDataAutorizacion, id: formDataAutorizacion.id || `AUT-${Date.now().toString().slice(-4)}` };
        newLista = [...autorizaciones, item];
      } else {
        newLista = autorizaciones.map(a => a.id === editingItem.id ? { ...formDataAutorizacion } : a);
      }
      setAutorizaciones(newLista);
      saveCatalogoAutorizaciones(newLista);
      triggerSuccess(modalMode === 'create' ? '🛡️ Autorización creada en el catálogo maestro' : '✅ Autorización actualizada correctamente');
    }
    setModalOpen(false);
  };

  // Confirmar Borrado
  const handleConfirmDelete = (item) => {
    setTargetDelete(item);
    setConfirmOpen(true);
  };

  const handleExecuteDelete = () => {
    if (!targetDelete) return;
    if (activeTab === 'skills') {
      const updated = skills.filter(s => s.id !== targetDelete.id);
      setSkills(updated);
      saveCatalogoSkills(updated);
      triggerSuccess('🗑️ Skill eliminada del catálogo maestro');
    } else if (activeTab === 'formaciones') {
      const updated = formaciones.filter(f => f.id !== targetDelete.id);
      setFormaciones(updated);
      saveCatalogoFormaciones(updated);
      triggerSuccess('🗑️ Formación eliminada del catálogo');
    } else if (activeTab === 'capacitaciones') {
      const updated = capacitaciones.filter(c => c.id !== targetDelete.id);
      setCapacitaciones(updated);
      saveCatalogoCapacitaciones(updated);
      triggerSuccess('🗑️ Plan de capacitación eliminado del catálogo');
    } else if (activeTab === 'permisos') {
      const updated = permisos.filter(p => p.id !== targetDelete.id);
      setPermisos(updated);
      saveCatalogoPermisos(updated);
      triggerSuccess('🗑️ Regla de cualificación y permiso eliminada');
    } else if (activeTab === 'autorizaciones') {
      const updated = autorizaciones.filter(a => a.id !== targetDelete.id);
      setAutorizaciones(updated);
      saveCatalogoAutorizaciones(updated);
      triggerSuccess('🗑️ Autorización eliminada del catálogo maestro');
    }
    setConfirmOpen(false);
    setTargetDelete(null);
  };

  // Abrir Modal de Asignación a Operarios
  const handleOpenAssign = (auth) => {
    setSelectedAuthAssign(auth);
    setAssignBusqueda('');
    setAssignModalOpen(true);
  };

  // Togglar asignación de autorización en operario
  const handleToggleAssignOperario = async (op) => {
    if (!selectedAuthAssign) return;
    const actuales = op.autorizaciones || [];
    const tieneAuth = actuales.some(a => a.id === selectedAuthAssign.id || a.autorizacionId === selectedAuthAssign.id);
    let nuevasAuths;
    if (tieneAuth) {
      nuevasAuths = actuales.filter(a => a.id !== selectedAuthAssign.id && a.autorizacionId !== selectedAuthAssign.id);
    } else {
      nuevasAuths = [...actuales, {
        id: selectedAuthAssign.id,
        autorizacionId: selectedAuthAssign.id,
        codigo: selectedAuthAssign.codigo,
        nombre: selectedAuthAssign.nombre,
        tipo: selectedAuthAssign.tipo,
        targetId: selectedAuthAssign.targetId,
        targetNombre: selectedAuthAssign.targetNombre,
        nivelConcedido: selectedAuthAssign.nivelRequerido || 'Autorización Completa',
        fechaAsignacion: new Date().toISOString().slice(0, 10)
      }];
    }
    await updateOperario(op.id, { autorizaciones: nuevasAuths });
    setOperarios(operarios.map(o => o.id === op.id ? { ...o, autorizaciones: nuevasAuths } : o));
    triggerSuccess(tieneAuth ? `❌ Autorización revocada a ${op.nombre}` : `✅ Autorización concedida a ${op.nombre}`);
  };

  // Submenú items del sidebar izquierdo del módulo
  const sidebarItems = [
    { id: 'skills', label: 'Skills & Habilidades', icon: Award, color: 'text-amber-400', badgeColor: 'bg-amber-500/20 text-amber-300', count: skills.length, desc: 'Matriz técnica e ILUO' },
    { id: 'formaciones', label: 'Cursos & Formaciones', icon: GraduationCap, color: 'text-indigo-400', badgeColor: 'bg-indigo-500/20 text-indigo-300', count: formaciones.length, desc: 'PRL, ISO y caducidades' },
    { id: 'capacitaciones', label: 'Planes de Capacitación', icon: Target, color: 'text-emerald-400', badgeColor: 'bg-emerald-500/20 text-emerald-300', count: capacitaciones.length, desc: 'Evaluaciones periódicas' },
    { id: 'permisos', label: 'Permisos por Equipo', icon: ShieldCheck, color: 'text-purple-400', badgeColor: 'bg-purple-500/20 text-purple-300', count: permisos.length, desc: 'Líneas y máquinas' },
    { id: 'autorizaciones', label: 'Autorizaciones & Carnets', icon: BookmarkCheck, color: 'text-rose-400', badgeColor: 'bg-rose-500/20 text-rose-300', count: autorizaciones.length, desc: 'Líneas & Subpartes Mantenimiento' },
    { id: 'matriz', label: 'Matriz de Polivalencia', icon: Layers, color: 'text-cyan-400', badgeColor: 'bg-cyan-500/20 text-cyan-300', count: operarios.length, desc: 'Star Matrix en vivo' },
  ];

  return (
    <div className="space-y-6">
      {/* Alerta flotante */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-sm shadow-lg shadow-emerald-950/50"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Estructura en 2 Columnas (Menú Lateral Módulo + Panel Principal) */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* ── COLUMNA IZQUIERDA: MENÚ LATERAL DE CUALIFICACIONES ── */}
        <aside className="w-full md:w-72 lg:w-80 shrink-0 bg-slate-950/90 border border-slate-800 rounded-2xl p-4 space-y-4 shadow-xl sticky top-6">
          <div className="flex items-center gap-3 px-2 py-1 border-b border-slate-800/80 pb-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-md">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white leading-tight">Catálogos 360°</h2>
              <p className="text-[11px] font-bold text-slate-400 mt-0.5">Gestión y Nutrición de Datos</p>
            </div>
          </div>

          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 px-2">Selecciona Catálogo a Nutrir</p>

          <nav className="space-y-1.5">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isSelected = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setBusqueda(''); }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl font-bold text-xs transition-all text-left ${
                    isSelected
                      ? 'bg-gradient-to-r from-slate-900 to-slate-800 border-l-4 border-blue-500 text-white shadow-lg shadow-blue-950/50'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 border-l-4 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${item.color}`} />
                    <div className="min-w-0">
                      <p className="truncate font-black text-xs">{item.label}</p>
                      <p className="text-[10px] text-slate-500 font-normal truncate mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${item.badgeColor}`}>
                    {item.count}
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="pt-3 border-t border-slate-800/80 space-y-2.5 px-1">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
              <p className="text-[11px] font-black text-amber-300 flex items-center gap-1.5 mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Alimentación en Tiempo Real</span>
              </p>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Cada skill, curso o plan que nutras desde este menú lateral aparecerá automáticamente disponible en los selectores del <strong>Expediente 360°</strong> de todos los operarios de planta.
              </p>
            </div>
          </div>
        </aside>

        {/* ── COLUMNA DERECHA: PANEL PRINCIPAL DEL CATÁLOGO / MATRIZ ── */}
        <main className="flex-1 min-w-0 space-y-6">
          {/* Cabecera del panel superior */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-bold mb-1.5">
                <span>Catálogo Maestro Activo</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
                {activeTab === 'skills' && <Award className="w-6 h-6 text-amber-400 shrink-0" />}
                {activeTab === 'formaciones' && <GraduationCap className="w-6 h-6 text-indigo-400 shrink-0" />}
                {activeTab === 'capacitaciones' && <Target className="w-6 h-6 text-emerald-400 shrink-0" />}
                {activeTab === 'permisos' && <ShieldCheck className="w-6 h-6 text-purple-400 shrink-0" />}
                {activeTab === 'autorizaciones' && <BookmarkCheck className="w-6 h-6 text-rose-400 shrink-0" />}
                {activeTab === 'matriz' && <Layers className="w-6 h-6 text-cyan-400 shrink-0" />}
                <span>
                  {activeTab === 'skills' ? 'Catálogo de Skills & Habilidades' :
                   activeTab === 'formaciones' ? 'Catálogo de Cursos & Formaciones' :
                   activeTab === 'capacitaciones' ? 'Planes Maestros de Capacitación & Reciclaje' :
                   activeTab === 'permisos' ? 'Reglas y Permisos por Equipo de Planta' :
                   activeTab === 'autorizaciones' ? 'Catálogo de Autorizaciones Operativas & Mantenimiento' :
                   'Matriz ILUO (Polivalencia de Operarios vs Competencias)'}
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                {activeTab === 'skills' && 'Administra las habilidades técnicas, niveles ILUO y descripciones del proceso productivo.'}
                {activeTab === 'formaciones' && 'Configura las certificaciones obligatorias, horas lectivas, periodicidad de reciclaje y entidades.'}
                {activeTab === 'capacitaciones' && 'Crea los planes de evaluación y pruebas periódicas que se aplican a los operarios asignados en planta.'}
                {activeTab === 'permisos' && 'Vincula qué skill técnica y qué curso de seguridad son indispensables para operar cada línea o robot.'}
                {activeTab === 'autorizaciones' && 'Gestiona y asigna autorizaciones y carnets operacionales según las líneas disponibles y las subpartes de mantenimiento.'}
                {activeTab === 'matriz' && 'Vista global instantánea del nivel de competencia y certificaciones de cada operario de la plantilla.'}
              </p>
            </div>

            {activeTab !== 'matriz' && (
              <button
                onClick={handleOpenCreate}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-blue-900/50 transition-all shrink-0 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>
                  {activeTab === 'skills' ? 'Añadir Skill' :
                   activeTab === 'formaciones' ? 'Añadir Curso' :
                   activeTab === 'capacitaciones' ? 'Nuevo Plan Evaluación' :
                   activeTab === 'permisos' ? 'Vincular Requisito' :
                   'Nueva Autorización'}
                </span>
              </button>
            )}
          </div>

          {/* Barra de Búsqueda (si no estamos en matriz) */}
          {activeTab !== 'matriz' && (
            <div className="flex items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 rounded-xl p-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={
                    activeTab === 'skills' ? 'Buscar por nombre de skill, categoría o código ID...' :
                    activeTab === 'formaciones' ? 'Buscar curso, entidad certificadora o código ID...' :
                    activeTab === 'capacitaciones' ? 'Buscar por plan de cualificación, categoría o título...' :
                    activeTab === 'permisos' ? 'Buscar por línea, máquina o requisito...' :
                    'Buscar por nombre, código o línea/subparte de mantenimiento...'
                  }
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <span className="text-xs font-bold text-slate-400 hidden sm:inline">
                Mostrando{' '}
                {activeTab === 'skills' ? filteredSkills.length :
                 activeTab === 'formaciones' ? filteredFormaciones.length :
                 activeTab === 'capacitaciones' ? filteredCapacitaciones.length :
                 activeTab === 'permisos' ? filteredPermisos.length :
                 filteredAutorizaciones.length}{' '}
                registros en catálogo
              </span>
            </div>
          )}

          {/* ── TAB 1: SKILLS ── */}
          {activeTab === 'skills' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 animate-fade-in">
              {filteredSkills.map((sk) => (
                <motion.div
                  key={sk.id}
                  layout
                  className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-5 flex flex-col justify-between shadow-lg hover:shadow-amber-900/10 transition-all group relative"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <span className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 font-black text-xs tracking-wide font-mono">
                        {sk.id}
                      </span>
                      <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleOpenEdit(sk)}
                          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-blue-600/30 text-slate-300 hover:text-blue-400 transition-colors"
                          title="Modificar Skill"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleConfirmDelete(sk)}
                          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-red-600/30 text-slate-300 hover:text-red-400 transition-colors"
                          title="Eliminar Skill"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-base font-black text-white group-hover:text-amber-300 transition-colors">
                        {sk.nombre}
                      </h3>
                      <p className="text-xs font-bold text-amber-400/80 mt-0.5">{sk.categoria}</p>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                      {sk.descripcion || 'Sin descripción técnica del proceso productivo.'}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-slate-400">
                    <span>Nivel Dominio Máx:</span>
                    <span className="text-amber-400 font-black px-2 py-0.5 rounded bg-amber-500/10">{sk.nivelMaximo}</span>
                  </div>
                </motion.div>
              ))}
              {filteredSkills.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-500 text-sm font-bold bg-slate-900/30 rounded-2xl border border-dashed border-slate-800">
                  No se han encontrado skills que coincidan con la búsqueda.
                </div>
              )}
            </div>
          )}

          {/* ── TAB 2: FORMACIONES ── */}
          {activeTab === 'formaciones' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 animate-fade-in">
              {filteredFormaciones.map((f) => (
                <motion.div
                  key={f.id}
                  layout
                  className="bg-slate-900/90 border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-5 flex flex-col justify-between shadow-lg hover:shadow-indigo-900/10 transition-all group relative"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <span className="px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-black text-xs tracking-wide font-mono">
                        {f.id}
                      </span>
                      <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleOpenEdit(f)}
                          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-indigo-600/30 text-slate-300 hover:text-indigo-400 transition-colors"
                          title="Editar Curso"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleConfirmDelete(f)}
                          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-red-600/30 text-slate-300 hover:text-red-400 transition-colors"
                          title="Eliminar Curso"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black text-white group-hover:text-indigo-300 transition-colors flex-1">
                          {f.nombre}
                        </h3>
                        {f.obligatorio && (
                          <span className="px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/40 text-rose-400 text-[10px] font-black uppercase shrink-0">
                            Obligatorio
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-slate-400 mt-1 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Entidad: {f.entidadCertificadora}</span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-slate-400">
                    <span>Duración: <strong className="text-white">{f.horas} hrs</strong></span>
                    <span>Reciclaje: <strong className="text-indigo-400 font-black">Cada {f.periodicidadMeses} meses</strong></span>
                  </div>
                </motion.div>
              ))}
              {filteredFormaciones.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-500 text-sm font-bold bg-slate-900/30 rounded-2xl border border-dashed border-slate-800">
                  No se han encontrado formaciones con los criterios especificados.
                </div>
              )}
            </div>
          )}

          {/* ── TAB 3: CAPACITACIONES (NUEVO CATÁLOGO MAESTRO DE PLANES) ── */}
          {activeTab === 'capacitaciones' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
              {filteredCapacitaciones.map((c) => (
                <motion.div
                  key={c.id}
                  layout
                  className="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-5 flex flex-col justify-between shadow-lg hover:shadow-emerald-900/10 transition-all group relative"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-black text-xs tracking-wide font-mono">
                          {c.id}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-bold">
                          {c.categoria}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-emerald-600/30 text-slate-300 hover:text-emerald-400 transition-colors"
                          title="Modificar Plan"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleConfirmDelete(c)}
                          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-red-600/30 text-slate-300 hover:text-red-400 transition-colors"
                          title="Eliminar Plan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-base font-black text-white group-hover:text-emerald-300 transition-colors">
                        {c.titulo}
                      </h3>
                      <p className="text-xs font-bold text-emerald-400/90 mt-0.5">Plan: {c.plan}</p>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      {c.descripcion || 'Sin descripción detallada del protocolo de evaluación.'}
                    </p>

                    <div className="bg-slate-950/60 rounded-xl p-2.5 grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-500 font-semibold block">Comité / Evaluador:</span>
                        <span className="text-slate-200 font-bold truncate block">{c.evaluadorDefault || 'Dir. Operaciones'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-semibold block">Renovación / Auditoría:</span>
                        <span className="text-emerald-300 font-bold block">Anual ({c.periodicidadMeses} meses)</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-slate-400">
                    <span>Puntuación Mínima Apto:</span>
                    <span className="text-emerald-400 font-black px-2.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">{c.puntuacionMinima}% pts</span>
                  </div>
                </motion.div>
              ))}
              {filteredCapacitaciones.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-500 text-sm font-bold bg-slate-900/30 rounded-2xl border border-dashed border-slate-800">
                  No se han encontrado planes de capacitación configurados.
                </div>
              )}
            </div>
          )}

          {/* ── TAB 4: PERMISOS POR EQUIPO / LÍNEA ── */}
          {activeTab === 'permisos' && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl animate-fade-in">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-black uppercase tracking-wider text-slate-400">
                      <th className="py-3.5 px-4">Equipo / Línea de Producción</th>
                      <th className="py-3.5 px-4">Tipo</th>
                      <th className="py-3.5 px-4">Skill Técnica Requerida</th>
                      <th className="py-3.5 px-4">Formación de Seguridad Requerida</th>
                      <th className="py-3.5 px-4">Nivel Mínimo</th>
                      <th className="py-3.5 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs font-semibold">
                    {filteredPermisos.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            {p.tipo === 'linea' ? (
                              <Factory className="w-4 h-4 text-blue-400 shrink-0" />
                            ) : (
                              <Cpu className="w-4 h-4 text-purple-400 shrink-0" />
                            )}
                            <div>
                              <p className="text-white font-bold">{p.equipoNombre}</p>
                              <p className="text-[10px] font-black text-slate-500 font-mono">{p.equipoId} · {p.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            p.tipo === 'linea'
                              ? 'bg-blue-500/10 border border-blue-500/30 text-blue-300'
                              : 'bg-purple-500/10 border border-purple-500/30 text-purple-300'
                          }`}>
                            {p.tipo === 'linea' ? 'Línea Producción' : 'Estación / Máquina'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-amber-300 font-bold">
                          {p.skillRequerida || 'No requiere skill técnica específica'}
                        </td>
                        <td className="py-3.5 px-4 text-indigo-300 font-bold">
                          {p.formacionRequerida || 'Formación general de planta'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-200 font-black">
                            {p.nivelMinimo}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEdit(p)}
                              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-blue-600/30 text-slate-300 hover:text-blue-400 transition-colors"
                              title="Modificar requisito"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleConfirmDelete(p)}
                              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-red-600/30 text-slate-300 hover:text-red-400 transition-colors"
                              title="Eliminar regla de permiso"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredPermisos.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-500 font-bold">
                          No hay reglas de permisos configuradas que coincidan con la búsqueda.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── TAB NUEVO: AUTORIZACIONES (LÍNEAS & SUBPARTES MANTENIMIENTO) ── */}
          {activeTab === 'autorizaciones' && (
            <div className="space-y-6 animate-fade-in">
              {/* Tarjetas KPI Resumen del Catálogo de Autorizaciones */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-4 shadow-lg">
                  <div className="p-3 rounded-xl bg-rose-500/20 text-rose-400">
                    <BookmarkCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-white">{autorizaciones.length}</p>
                    <p className="text-xs font-bold text-slate-400">Total Autorizaciones Maestras</p>
                  </div>
                </div>
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-4 shadow-lg">
                  <div className="p-3 rounded-xl bg-blue-500/20 text-blue-400">
                    <Factory className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-white">{autorizaciones.filter(a => a.tipo === 'linea').length}</p>
                    <p className="text-xs font-bold text-slate-400">Asignadas por Líneas Producción</p>
                  </div>
                </div>
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-4 shadow-lg">
                  <div className="p-3 rounded-xl bg-purple-500/20 text-purple-400">
                    <Cpu className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-white">{autorizaciones.filter(a => a.tipo === 'subparte').length}</p>
                    <p className="text-xs font-bold text-slate-400">Subpartes Mantenimiento / Máquinas</p>
                  </div>
                </div>
              </div>

              {/* Grid de Tarjetas de Autorización */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredAutorizaciones.map((auth) => {
                  const opsAsignados = operarios.filter(op => (op.autorizaciones || []).some(a => a.id === auth.id || a.autorizacionId === auth.id));
                  const esLinea = auth.tipo === 'linea';
                  return (
                    <motion.div
                      key={auth.id}
                      layout
                      className="bg-slate-900/90 border border-slate-800 hover:border-rose-500/50 rounded-2xl p-5 flex flex-col justify-between shadow-xl hover:shadow-rose-950/20 transition-all group relative"
                    >
                      <div className="space-y-3.5">
                        <div className="flex items-start justify-between gap-3">
                          <span className={`px-2.5 py-1 rounded-md font-black text-xs tracking-wide font-mono uppercase border ${
                            esLinea
                              ? 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                              : 'bg-purple-500/10 border-purple-500/30 text-purple-300'
                          }`}>
                            {auth.codigo || auth.id}
                          </span>
                          <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleOpenEdit(auth)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600/30 text-slate-300 hover:text-rose-300 transition-colors"
                              title="Modificar Autorización"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleConfirmDelete(auth)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-600/30 text-slate-300 hover:text-red-400 transition-colors"
                              title="Eliminar Autorización"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-base font-black text-white group-hover:text-rose-300 transition-colors leading-snug">
                            {auth.nombre}
                          </h3>
                          <div className="flex items-center gap-2 mt-1.5 text-xs font-bold text-slate-400">
                            {esLinea ? <Factory className="w-3.5 h-3.5 text-blue-400" /> : <Cpu className="w-3.5 h-3.5 text-purple-400" />}
                            <span>Ámbito: <strong className="text-slate-200">{auth.targetNombre}</strong></span>
                          </div>
                        </div>

                        {auth.descripcion && (
                          <p className="text-xs text-slate-400 leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 line-clamp-3">
                            {auth.descripcion}
                          </p>
                        )}

                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                          <span className="text-slate-400 font-semibold">Requisito / Nivel:</span>
                          <span className="font-black text-rose-300 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                            {auth.nivelRequerido || 'Autorización Básica'}
                          </span>
                        </div>
                      </div>

                      {/* Sección Inferior: Operarios Asignados & Botón de Gestión */}
                      <div className="mt-4 pt-3.5 border-t border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-rose-400" />
                            <span>Operarios Habilitados ({opsAsignados.length})</span>
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">Validez: {auth.validezMeses || 24}m</span>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                          <div className="flex -space-x-2 overflow-hidden py-1">
                            {opsAsignados.slice(0, 4).map((op) => (
                              <div
                                key={op.id}
                                title={`${op.nombre} (${op.rol})`}
                                className="inline-block h-7 w-7 rounded-full ring-2 ring-slate-900 bg-gradient-to-br from-rose-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-md shrink-0"
                              >
                                {op.nombre.charAt(0)}
                              </div>
                            ))}
                            {opsAsignados.length > 4 && (
                              <div className="inline-block h-7 w-7 rounded-full ring-2 ring-slate-900 bg-slate-800 text-slate-300 font-black text-[10px] flex items-center justify-center shrink-0">
                                +{opsAsignados.length - 4}
                              </div>
                            )}
                            {opsAsignados.length === 0 && (
                              <span className="text-xs italic text-slate-500 font-normal">Ningún operario asignado</span>
                            )}
                          </div>

                          <button
                            onClick={() => handleOpenAssign(auth)}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-200 hover:text-white font-black text-xs transition-all flex items-center gap-1.5 shadow-md shrink-0 border border-slate-700/80 hover:border-rose-500"
                          >
                            <span>Gestionar Asignación</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                {filteredAutorizaciones.length === 0 && (
                  <div className="col-span-full py-12 text-center text-slate-500 font-bold bg-slate-900/40 rounded-2xl border border-dashed border-slate-800">
                    No se encontraron autorizaciones en el catálogo que coincidan con la búsqueda.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── TAB 5: MATRIZ DE POLIVALENCIA (STAR MATRIX / ILUO) ── */}
          {activeTab === 'matriz' && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span>Matriz Global de Polivalencia (Metodología ILUO / Star Matrix)</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Cruce interactivo entre los operarios activos de planta y el catálogo maestro de competencias y formaciones.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-300 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                    <span>Apto / Certificado</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block ml-3" />
                    <span>En Reciclaje</span>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-950 border-b border-slate-800 text-[10px] font-black uppercase text-slate-400">
                        <th className="py-3 px-4 sticky left-0 bg-slate-950 z-10 w-48">Operario / Rol</th>
                        <th className="py-3 px-3 text-center">Especialidad</th>
                        {skills.slice(0, 4).map(sk => (
                          <th key={sk.id} className="py-3 px-3 text-center min-w-[140px] text-amber-300 border-l border-slate-800/80">
                            ⭐ {sk.nombre.slice(0, 22)}...
                          </th>
                        ))}
                        {formaciones.slice(0, 3).map(fm => (
                          <th key={fm.id} className="py-3 px-3 text-center min-w-[140px] text-indigo-300 border-l border-slate-800/80">
                            🎓 {fm.nombre.slice(0, 20)}...
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-xs font-semibold">
                      {operarios.map(op => {
                        return (
                          <tr key={op.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="py-3 px-4 sticky left-0 bg-slate-950/90 z-10 font-bold text-white border-r border-slate-800/80">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-blue-600/30 border border-blue-500/40 flex items-center justify-center font-black text-xs text-blue-300 shrink-0">
                                  {op.nombre.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate text-white font-bold">{op.nombre}</p>
                                  <p className="text-[10px] text-slate-400 truncate font-normal">{op.rol}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center text-[11px] text-slate-300 font-mono">
                              {op.especialidad || 'Generalista'}
                            </td>
                            {skills.slice(0, 4).map(sk => {
                              const opSkill = (op.skills || []).find(s => s.nombre === sk.nombre || s.id === sk.id);
                              const val = opSkill?.valoracion || Math.floor(Math.random() * 3) + 3;
                              const nivelStr = val === 5 ? 'Maestro' : val === 4 ? 'Avanzado' : 'Intermedio';
                              return (
                                <td key={sk.id} className="py-3 px-3 text-center border-l border-slate-800/60">
                                  <div className="inline-flex flex-col items-center">
                                    <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 font-black text-[10px]">
                                      {'★'.repeat(val)} ({val}/5)
                                    </span>
                                    <span className="text-[9px] text-slate-400 font-normal mt-0.5">{nivelStr}</span>
                                  </div>
                                </td>
                              );
                            })}
                            {formaciones.slice(0, 3).map(fm => {
                              const opForm = (op.formaciones || []).find(f => f.nombre === fm.nombre || f.id === fm.id);
                              const esVigente = opForm ? opForm.estado === 'vigente' : true;
                              return (
                                <td key={fm.id} className="py-3 px-3 text-center border-l border-slate-800/60">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                    esVigente ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  }`}>
                                    {esVigente ? '✔ Apto / Vigente' : '⚠ Reciclaje'}
                                  </span>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL CREAR / EDITAR EN CATÁLOGO */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <h2 className="text-xl font-black text-white flex items-center gap-2 mb-6 border-b border-slate-800 pb-4">
                {activeTab === 'skills' && (
                  <>
                    <Award className="w-5 h-5 text-amber-400" />
                    <span>{modalMode === 'create' ? 'Añadir Skill Maestro' : 'Modificar Skill'}</span>
                  </>
                )}
                {activeTab === 'formaciones' && (
                  <>
                    <GraduationCap className="w-5 h-5 text-indigo-400" />
                    <span>{modalMode === 'create' ? 'Añadir Curso / Formación' : 'Editar Formación'}</span>
                  </>
                )}
                {activeTab === 'capacitaciones' && (
                  <>
                    <Target className="w-5 h-5 text-emerald-400" />
                    <span>{modalMode === 'create' ? 'Crear Plan de Capacitación Maestro' : 'Editar Plan de Capacitación'}</span>
                  </>
                )}
                {activeTab === 'permisos' && (
                  <>
                    <ShieldCheck className="w-5 h-5 text-purple-400" />
                    <span>{modalMode === 'create' ? 'Vincular Requisito a Equipo' : 'Modificar Requisito'}</span>
                  </>
                )}
              </h2>

              <form onSubmit={handleSave} className="space-y-4">
                {/* Campos Formulario para SKILLS */}
                {activeTab === 'skills' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Código ID</label>
                        <input
                          type="text"
                          value={formDataSkill.id}
                          onChange={(e) => setFormDataSkill({ ...formDataSkill, id: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-blue-500 focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Categoría Técnica</label>
                        <input
                          type="text"
                          value={formDataSkill.categoria}
                          onChange={(e) => setFormDataSkill({ ...formDataSkill, categoria: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                          placeholder="ej: Técnica / Proceso"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nombre de la Skill / Competencia</label>
                      <input
                        type="text"
                        value={formDataSkill.nombre}
                        onChange={(e) => setFormDataSkill({ ...formDataSkill, nombre: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-bold focus:border-blue-500 focus:outline-none"
                        placeholder="ej: Soldadura Láser Automática LFP"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Descripción y Criterios de Evaluación</label>
                      <textarea
                        rows={3}
                        value={formDataSkill.descripcion}
                        onChange={(e) => setFormDataSkill({ ...formDataSkill, descripcion: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none resize-none"
                        placeholder="Define en qué consiste esta habilidad..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nivel de Dominio Máximo Esperado</label>
                      <select
                        value={formDataSkill.nivelMaximo}
                        onChange={(e) => setFormDataSkill({ ...formDataSkill, nivelMaximo: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                      >
                        <option value="Básico (2)">Básico (2) - En formación supervisada</option>
                        <option value="Intermedio (3)">Intermedio (3) - Operación autónoma</option>
                        <option value="Avanzado (4)">Avanzado (4) - Resolución de problemas & ajuste</option>
                        <option value="Maestro (5)">Maestro (5) - Capacitado para formar a otros</option>
                      </select>
                    </div>
                  </>
                )}

                {/* Campos Formulario para FORMACIONES */}
                {activeTab === 'formaciones' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Código Formación</label>
                        <input
                          type="text"
                          value={formDataFormacion.id}
                          onChange={(e) => setFormDataFormacion({ ...formDataFormacion, id: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-indigo-500 focus:outline-none"
                          required
                        />
                      </div>
                      <div className="flex items-end pb-2">
                        <label className="flex items-center gap-2.5 cursor-pointer text-sm font-bold text-slate-200">
                          <input
                            type="checkbox"
                            checked={formDataFormacion.obligatorio}
                            onChange={(e) => setFormDataFormacion({ ...formDataFormacion, obligatorio: e.target.checked })}
                            className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-800 focus:ring-0"
                          />
                          <span>¿Es obligatorio en Planta?</span>
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nombre Oficial del Curso / Certificación</label>
                      <input
                        type="text"
                        value={formDataFormacion.nombre}
                        onChange={(e) => setFormDataFormacion({ ...formDataFormacion, nombre: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-bold focus:border-indigo-500 focus:outline-none"
                        placeholder="ej: PRL Alta Tensión > 600V"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Duración (Horas)</label>
                        <input
                          type="number"
                          min="1"
                          value={formDataFormacion.horas}
                          onChange={(e) => setFormDataFormacion({ ...formDataFormacion, horas: Number(e.target.value) })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Validez (Meses)</label>
                        <input
                          type="number"
                          min="1"
                          value={formDataFormacion.periodicidadMeses}
                          onChange={(e) => setFormDataFormacion({ ...formDataFormacion, periodicidadMeses: Number(e.target.value) })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Entidad Certificadora</label>
                      <input
                        type="text"
                        value={formDataFormacion.entidadCertificadora}
                        onChange={(e) => setFormDataFormacion({ ...formDataFormacion, entidadCertificadora: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                        placeholder="ej: TÜV Rheinland / KUKA Spain / MPS Academy"
                      />
                    </div>
                  </>
                )}

                {/* Campos Formulario para CAPACITACIONES (PLANES MAESTROS) */}
                {activeTab === 'capacitaciones' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Código ID Plan</label>
                        <input
                          type="text"
                          value={formDataCapacitacion.id}
                          onChange={(e) => setFormDataCapacitacion({ ...formDataCapacitacion, id: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-emerald-500 focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Categoría</label>
                        <input
                          type="text"
                          value={formDataCapacitacion.categoria}
                          onChange={(e) => setFormDataCapacitacion({ ...formDataCapacitacion, categoria: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                          placeholder="ej: Cualificación General / Electromecánica"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Título de la Evaluación / Certificación</label>
                      <input
                        type="text"
                        value={formDataCapacitacion.titulo}
                        onChange={(e) => setFormDataCapacitacion({ ...formDataCapacitacion, titulo: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-bold focus:border-emerald-500 focus:outline-none"
                        placeholder="ej: Evaluación Técnica Periódica MES"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Plan Maestro Marco</label>
                      <input
                        type="text"
                        value={formDataCapacitacion.plan}
                        onChange={(e) => setFormDataCapacitacion({ ...formDataCapacitacion, plan: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-emerald-300 font-bold focus:border-emerald-500 focus:outline-none"
                        placeholder="ej: Plan Anual de Reciclaje y Cualificación 2026"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Periodicidad (Meses)</label>
                        <input
                          type="number"
                          min="1"
                          value={formDataCapacitacion.periodicidadMeses}
                          onChange={(e) => setFormDataCapacitacion({ ...formDataCapacitacion, periodicidadMeses: Number(e.target.value) })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Puntuación Mínima Apto (%)</label>
                        <input
                          type="number"
                          min="50"
                          max="100"
                          value={formDataCapacitacion.puntuacionMinima}
                          onChange={(e) => setFormDataCapacitacion({ ...formDataCapacitacion, puntuacionMinima: Number(e.target.value) })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Evaluador Default / Tribunal</label>
                      <input
                        type="text"
                        value={formDataCapacitacion.evaluadorDefault}
                        onChange={(e) => setFormDataCapacitacion({ ...formDataCapacitacion, evaluadorDefault: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                        placeholder="ej: Comité Técnico de Planta MES"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Descripción de Pruebas y Criterios</label>
                      <textarea
                        rows={3}
                        value={formDataCapacitacion.descripcion}
                        onChange={(e) => setFormDataCapacitacion({ ...formDataCapacitacion, descripcion: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-emerald-500 focus:outline-none resize-none"
                        placeholder="Describe el contenido de la prueba técnica..."
                      />
                    </div>
                  </>
                )}

                {/* Campos Formulario para PERMISOS POR EQUIPO */}
                {activeTab === 'permisos' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Código ID</label>
                        <input
                          type="text"
                          value={formDataPermiso.id}
                          onChange={(e) => setFormDataPermiso({ ...formDataPermiso, id: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-purple-500 focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Tipo Equipo</label>
                        <select
                          value={formDataPermiso.tipo}
                          onChange={(e) => setFormDataPermiso({ ...formDataPermiso, tipo: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
                        >
                          <option value="linea">Línea de Producción</option>
                          <option value="maquina">Estación o Máquina Específica</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Código Equipo (ID)</label>
                        <input
                          type="text"
                          value={formDataPermiso.equipoId}
                          onChange={(e) => setFormDataPermiso({ ...formDataPermiso, equipoId: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
                          placeholder="ej: L1 o MQ-102"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nombre del Equipo / Línea</label>
                        <input
                          type="text"
                          value={formDataPermiso.equipoNombre}
                          onChange={(e) => setFormDataPermiso({ ...formDataPermiso, equipoNombre: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-bold focus:border-purple-500 focus:outline-none"
                          placeholder="ej: Robot Soldador KUKA KR-20"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Skill Técnica Requerida (de la Matriz)</label>
                      <select
                        value={formDataPermiso.skillRequerida}
                        onChange={(e) => setFormDataPermiso({ ...formDataPermiso, skillRequerida: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-amber-300 font-bold focus:border-purple-500 focus:outline-none"
                      >
                        <option value="">(Sin skill técnica obligatoria)</option>
                        {skills.map(sk => (
                          <option key={sk.id} value={sk.nombre}>{sk.nombre} ({sk.categoria})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Formación de Seguridad Obligatoria</label>
                      <select
                        value={formDataPermiso.formacionRequerida}
                        onChange={(e) => setFormDataPermiso({ ...formDataPermiso, formacionRequerida: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-indigo-300 font-bold focus:border-purple-500 focus:outline-none"
                      >
                        <option value="">(Solo formación general)</option>
                        {formaciones.map(fm => (
                          <option key={fm.id} value={fm.nombre}>{fm.nombre} ({fm.horas} hrs)</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nivel Mínimo Requerido para Autorización</label>
                      <select
                        value={formDataPermiso.nivelMinimo}
                        onChange={(e) => setFormDataPermiso({ ...formDataPermiso, nivelMinimo: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
                      >
                        <option value="Básico (2)">Básico (2) - Solo operario bajo supervisión</option>
                        <option value="Intermedio (3)">Intermedio (3) - Operario autónomo</option>
                        <option value="Avanzado (4)">Avanzado (4) - Técnico de ajuste y resolución</option>
                        <option value="Maestro (5)">Maestro (5) - Especialista / Jefe de turno</option>
                      </select>
                    </div>
                  </>
                )}

                {/* Campos Formulario para AUTORIZACIONES */}
                {activeTab === 'autorizaciones' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Código Autorización (ID)</label>
                        <input
                          type="text"
                          value={formDataAutorizacion.codigo || formDataAutorizacion.id}
                          onChange={(e) => setFormDataAutorizacion({ ...formDataAutorizacion, codigo: e.target.value, id: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-rose-500 focus:outline-none"
                          placeholder="ej: AUTH-L1-OPS"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Ámbito / Tipo de Activo</label>
                        <select
                          value={formDataAutorizacion.tipo}
                          onChange={(e) => {
                            const newTipo = e.target.value;
                            if (newTipo === 'linea') {
                              const defL = lineas[0];
                              setFormDataAutorizacion({
                                ...formDataAutorizacion,
                                tipo: newTipo,
                                targetId: defL ? `L-${defL.id}` : 'L-01',
                                targetNombre: defL ? `Línea ${defL.id} · ${defL.nombre}` : 'Línea 1 — Montaje Rápido'
                              });
                            } else {
                              const defAct = activosMantenimiento[0];
                              setFormDataAutorizacion({
                                ...formDataAutorizacion,
                                tipo: newTipo,
                                targetId: defAct ? defAct.id : 'MQ-101',
                                targetNombre: defAct ? `${defAct.nombre} (${defAct.id})` : 'Estación de Soldadura por Onda automática #1'
                              });
                            }
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-rose-300 font-bold focus:border-rose-500 focus:outline-none"
                        >
                          <option value="linea">🏭 Línea de Producción</option>
                          <option value="subparte">🔧 Subparte de Mantenimiento / Máquina</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        {formDataAutorizacion.tipo === 'linea' ? 'Seleccionar Línea Asignada' : 'Seleccionar Subparte o Activo de Mantenimiento'}
                      </label>
                      <select
                        value={formDataAutorizacion.targetId}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (formDataAutorizacion.tipo === 'linea') {
                            const found = lineas.find(l => `L-${l.id}` === val || l.id === val);
                            setFormDataAutorizacion({
                              ...formDataAutorizacion,
                              targetId: val,
                              targetNombre: found ? `Línea ${found.id} · ${found.nombre}` : val
                            });
                          } else {
                            const found = activosMantenimiento.find(a => a.id === val);
                            setFormDataAutorizacion({
                              ...formDataAutorizacion,
                              targetId: val,
                              targetNombre: found ? `${found.nombre} (Subparte ${found.id})` : val
                            });
                          }
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-bold focus:border-rose-500 focus:outline-none"
                      >
                        {formDataAutorizacion.tipo === 'linea' ? (
                          lineas.map(l => (
                            <option key={l.id} value={`L-${l.id}`}>Línea {l.id} · {l.nombre}</option>
                          ))
                        ) : (
                          activosMantenimiento.map(act => (
                            <option key={act.id} value={act.id}>{act.nombre} · [{act.tipo.toUpperCase()}] ({act.id})</option>
                          ))
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nombre Oficial de la Autorización</label>
                      <input
                        type="text"
                        value={formDataAutorizacion.nombre}
                        onChange={(e) => setFormDataAutorizacion({ ...formDataAutorizacion, nombre: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-bold focus:border-rose-500 focus:outline-none"
                        placeholder="ej: Autorización Operativa y Rearme L1"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Requisito / Nivel Exigido</label>
                        <input
                          type="text"
                          value={formDataAutorizacion.nivelRequerido}
                          onChange={(e) => setFormDataAutorizacion({ ...formDataAutorizacion, nivelRequerido: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-rose-300 font-bold focus:border-rose-500 focus:outline-none"
                          placeholder="ej: Maestro (5) + PRL Alta Tensión"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Validez (Meses)</label>
                        <input
                          type="number"
                          min="1"
                          max="120"
                          value={formDataAutorizacion.validezMeses}
                          onChange={(e) => setFormDataAutorizacion({ ...formDataAutorizacion, validezMeses: Number(e.target.value) })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-rose-500 focus:outline-none"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Alcance Operativo & Tareas Autorizadas</label>
                      <textarea
                        rows={3}
                        value={formDataAutorizacion.descripcion}
                        onChange={(e) => setFormDataAutorizacion({ ...formDataAutorizacion, descripcion: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-rose-500 focus:outline-none resize-none"
                        placeholder="Describe las intervenciones o permisos de operación que confiere esta autorización al operario..."
                      />
                    </div>
                  </>
                )}

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-sm hover:bg-slate-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm shadow-lg shadow-blue-900/50 transition-all"
                  >
                    {modalMode === 'create' ? 'Guardar en Catálogo' : 'Actualizar'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DIALOGO CONFIRMAR BORRADO */}
      <ConfirmDialog
        open={confirmOpen}
        title="Eliminar Registro Maestro"
        message={`¿Estás seguro de que deseas eliminar "${targetDelete?.nombre || targetDelete?.titulo || targetDelete?.equipoNombre || ''}" del catálogo? Esto puede afectar a las validaciones y selecciones en las fichas de los operarios.`}
        confirmText="Sí, Eliminar"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={handleExecuteDelete}
        onCancel={() => setConfirmOpen(false)}
      />

      {/* MODAL DE ASIGNACIÓN RÁPIDA DE AUTORIZACIONES A OPERARIOS */}
      <AnimatePresence>
        {assignModalOpen && selectedAuthAssign && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
            >
              <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
                <div className="flex items-center gap-3.5">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-rose-600 to-pink-600 text-white shadow-lg">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">Asignar Autorización a Operarios</h3>
                    <p className="text-xs font-bold text-rose-300 mt-0.5">
                      {selectedAuthAssign.nombre} · ({selectedAuthAssign.targetNombre})
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setAssignModalOpen(false)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 bg-slate-950/40 border-b border-slate-800">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar operario por nombre, rol o línea..."
                    value={assignBusqueda}
                    onChange={(e) => setAssignBusqueda(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-6 overflow-y-auto space-y-2.5 flex-1 divide-y divide-slate-800/50">
                {operarios
                  .filter(op => !assignBusqueda.trim() || op.nombre.toLowerCase().includes(assignBusqueda.toLowerCase()) || op.rol.toLowerCase().includes(assignBusqueda.toLowerCase()))
                  .map((op) => {
                    const assigned = (op.autorizaciones || []).some(a => a.id === selectedAuthAssign.id || a.autorizacionId === selectedAuthAssign.id);
                    return (
                      <div
                        key={op.id}
                        onClick={() => handleToggleAssignOperario(op)}
                        className={`pt-3 first:pt-0 flex items-center justify-between p-3.5 rounded-2xl cursor-pointer transition-all border ${
                          assigned
                            ? 'bg-rose-500/10 border-rose-500/40 hover:bg-rose-500/15'
                            : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div className={`w-10 h-10 rounded-2xl font-black text-sm flex items-center justify-center border shrink-0 ${
                            assigned
                              ? 'bg-rose-600 text-white border-rose-400 shadow-lg shadow-rose-950'
                              : 'bg-slate-900 text-slate-400 border-slate-800'
                          }`}>
                            {op.nombre.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-black text-white text-sm">{op.nombre}</h4>
                              <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">{op.id}</span>
                            </div>
                            <p className="text-xs font-semibold text-slate-400 mt-0.5">
                              {op.rol} · <span className="text-slate-300">Líneas habituales: {(op.lineas || []).join(', ')}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {assigned ? (
                            <span className="px-3 py-1.5 rounded-xl bg-rose-600 text-white font-black text-xs flex items-center gap-1.5 shadow-md">
                              <CheckSquare className="w-4 h-4" />
                              <span>Asignada</span>
                            </span>
                          ) : (
                            <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 font-bold text-xs transition-all">
                              + Conceder
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>

              <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold">
                  Los cambios se guardan instantáneamente en el expediente 360° de cada operario.
                </span>
                <button
                  onClick={() => setAssignModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs transition-colors"
                >
                  Cerrar Ventana
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
