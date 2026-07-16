import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award, GraduationCap, ShieldCheck, Plus, Search, Edit3, Trash2,
  CheckCircle2, AlertCircle, XCircle, ChevronRight, SlidersHorizontal,
  BookmarkCheck, Sparkles, BookOpen, Layers, Cpu, Factory, RefreshCw
} from 'lucide-react';
import {
  getCatalogoSkills, saveCatalogoSkills,
  getCatalogoFormaciones, saveCatalogoFormaciones,
  getCatalogoPermisos, saveCatalogoPermisos,
  fetchLineas
} from '@/services/dataService';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

export default function Cualificaciones() {
  const [activeTab, setActiveTab] = useState('skills'); // 'skills' | 'formaciones' | 'permisos'
  const [skills, setSkills] = useState([]);
  const [formaciones, setFormaciones] = useState([]);
  const [permisos, setPermisos] = useState([]);
  const [lineas, setLineas] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal CRUD general
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [editingItem, setEditingItem] = useState(null);

  // Form states según pestaña
  const [formDataSkill, setFormDataSkill] = useState({ id: '', nombre: '', categoria: 'Técnica / Proceso', descripcion: '', nivelMaximo: 'Maestro (5)' });
  const [formDataFormacion, setFormDataFormacion] = useState({ id: '', nombre: '', horas: 20, periodicidadMeses: 24, entidadCertificadora: 'TÜV Rheinland Academy', obligatorio: true });
  const [formDataPermiso, setFormDataPermiso] = useState({ id: '', equipoId: 'L1', equipoNombre: 'Línea 1 · Ensamblaje Baterías LFP', tipo: 'linea', skillRequerida: '', formacionRequerida: '', nivelMinimo: 'Avanzado (4)' });

  // Dialogo de confirmación para borrado
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetDelete, setTargetDelete] = useState(null);

  const loadData = async () => {
    setSkills(getCatalogoSkills() || []);
    setFormaciones(getCatalogoFormaciones() || []);
    setPermisos(getCatalogoPermisos() || []);
    const resL = await fetchLineas();
    if (resL?.data) setLineas(resL.data);
  };

  useEffect(() => {
    loadData();
    const handler = () => loadData();
    window.addEventListener('cualificaciones_updated', handler);
    return () => window.removeEventListener('cualificaciones_updated', handler);
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

  const filteredPermisos = useMemo(() => {
    if (!busqueda.trim()) return permisos;
    const q = busqueda.toLowerCase();
    return permisos.filter(p => p.equipoNombre?.toLowerCase().includes(q) || p.equipoId?.toLowerCase().includes(q) || p.skillRequerida?.toLowerCase().includes(q));
  }, [permisos, busqueda]);

  // Manejadores CRUD: abrir nuevo
  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem(null);
    if (activeTab === 'skills') {
      setFormDataSkill({ id: `SK-0${skills.length + 1}`, nombre: '', categoria: 'Técnica / Proceso', descripcion: '', nivelMaximo: 'Maestro (5)' });
    } else if (activeTab === 'formaciones') {
      setFormDataFormacion({ id: `FM-0${formaciones.length + 1}`, nombre: '', horas: 16, periodicidadMeses: 24, entidadCertificadora: 'TÜV Rheinland Academy', obligatorio: true });
    } else {
      setFormDataPermiso({
        id: `PERM-0${permisos.length + 1}`,
        equipoId: lineas[0]?.id || 'L1',
        equipoNombre: lineas[0]?.nombre || 'Línea 1 · Ensamblaje Baterías LFP',
        tipo: 'linea',
        skillRequerida: skills[0]?.nombre || '',
        formacionRequerida: formaciones[0]?.nombre || '',
        nivelMinimo: 'Avanzado (4)'
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
    else setFormDataPermiso({ ...item });
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
      triggerSuccess(modalMode === 'create' ? '🎓 Curso/Formación añadido al catálogo' : '✅ Formación actualizada correctamente');
    } else {
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
    } else {
      const updated = permisos.filter(p => p.id !== targetDelete.id);
      setPermisos(updated);
      saveCatalogoPermisos(updated);
      triggerSuccess('🗑️ Regla de cualificación y permiso eliminada');
    }
    setConfirmOpen(false);
    setTargetDelete(null);
  };

  return (
    <div className="space-y-6">
      {/* Banner Superior */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/40 border border-blue-500/30 p-6 shadow-xl">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-blue-500/20 border border-blue-500/40 text-blue-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-400" />
              <span>Matriz Universal de Capacitación & Permisos</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              Catálogo Maestro de Cualificaciones
            </h1>
            <p className="text-slate-300 text-sm max-w-3xl">
              Configura las habilidades, formaciones obligatorias y permisos requeridos para operar cada línea o máquina. Estos catálogos alimentan las fichas individuales de cada operario.
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm shadow-lg shadow-blue-900/50 transition-all transform hover:-translate-y-0.5 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>
              {activeTab === 'skills' ? 'Nueva Skill' : activeTab === 'formaciones' ? 'Nueva Formación' : 'Nuevo Permiso por Equipo'}
            </span>
          </button>
        </div>

        {/* Pestañas de navegación */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-slate-800/80">
          <button
            onClick={() => { setActiveTab('skills'); setBusqueda(''); }}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-black text-xs transition-all ${
              activeTab === 'skills'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/50 scale-105'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Award className="w-4 h-4 text-amber-400" />
            <span>Skills & Habilidades ({skills.length})</span>
          </button>
          <button
            onClick={() => { setActiveTab('formaciones'); setBusqueda(''); }}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-black text-xs transition-all ${
              activeTab === 'formaciones'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/50 scale-105'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-indigo-400" />
            <span>Formaciones & Cursos ({formaciones.length})</span>
          </button>
          <button
            onClick={() => { setActiveTab('permisos'); setBusqueda(''); }}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-black text-xs transition-all ${
              activeTab === 'permisos'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-900/50 scale-105'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <span>Permisos & Requisitos por Línea ({permisos.length})</span>
          </button>
        </div>
      </div>

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

      {/* Barra de Búsqueda */}
      <div className="flex items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 rounded-xl p-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={
              activeTab === 'skills' ? 'Buscar por nombre de skill, categoría o código...' :
              activeTab === 'formaciones' ? 'Buscar curso o entidad certificadora...' :
              'Buscar por línea, máquina o requisito...'
            }
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <span className="text-xs font-bold text-slate-400 hidden sm:inline">
          Mostrando{' '}
          {activeTab === 'skills' ? filteredSkills.length : activeTab === 'formaciones' ? filteredFormaciones.length : filteredPermisos.length}{' '}
          registros maestros
        </span>
      </div>

      {/* CONTENIDO TAB 1: SKILLS */}
      {activeTab === 'skills' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
          {filteredSkills.map((sk) => (
            <motion.div
              key={sk.id}
              layout
              className="bg-slate-900/90 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-5 flex flex-col justify-between shadow-lg hover:shadow-blue-900/20 transition-all group relative"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <span className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 font-black text-xs tracking-wide">
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
                  <h3 className="text-base font-black text-white group-hover:text-blue-400 transition-colors">
                    {sk.nombre}
                  </h3>
                  <p className="text-xs font-bold text-blue-400 mt-0.5">{sk.categoria}</p>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                  {sk.descripcion || 'Sin descripción técnica del proceso.'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-slate-400">
                <span>Nivel de Dominio Máx:</span>
                <span className="text-amber-400 font-black">{sk.nivelMaximo}</span>
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

      {/* CONTENIDO TAB 2: FORMACIONES */}
      {activeTab === 'formaciones' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
          {filteredFormaciones.map((f) => (
            <motion.div
              key={f.id}
              layout
              className="bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 flex flex-col justify-between shadow-lg hover:shadow-indigo-900/20 transition-all group relative"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <span className="px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-black text-xs tracking-wide">
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
                      <span className="px-2 py-0.5 rounded bg-red-500/20 border border-red-500/40 text-red-400 text-[10px] font-black uppercase shrink-0">
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
                <span>Renovación: <strong className="text-indigo-400 font-black">Cada {f.periodicidadMeses} meses</strong></span>
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

      {/* CONTENIDO TAB 3: PERMISOS POR LÍNEA & MÁQUINA */}
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
                          <p className="text-[10px] font-black text-slate-500">{p.equipoId} · {p.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        p.tipo === 'linea'
                          ? 'bg-blue-500/10 border border-blue-500/30 text-blue-300'
                          : 'bg-purple-500/10 border border-purple-500/30 text-purple-300'
                      }`}>
                        {p.tipo === 'linea' ? 'Línea de Producción' : 'Estación / Máquina'}
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

      {/* MODAL CREAR / EDITAR */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative"
            >
              <h2 className="text-xl font-black text-white flex items-center gap-2 mb-6 border-b border-slate-800 pb-4">
                {activeTab === 'skills' ? (
                  <>
                    <Award className="w-5 h-5 text-amber-400" />
                    <span>{modalMode === 'create' ? 'Añadir Nueva Skill Maestro' : 'Modificar Skill'}</span>
                  </>
                ) : activeTab === 'formaciones' ? (
                  <>
                    <GraduationCap className="w-5 h-5 text-indigo-400" />
                    <span>{modalMode === 'create' ? 'Añadir Curso / Formación' : 'Editar Formación'}</span>
                  </>
                ) : (
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
        message={`¿Estás seguro de que deseas eliminar "${targetDelete?.nombre || targetDelete?.equipoNombre || ''}" del catálogo? Esto puede afectar a las validaciones automáticas de las fichas de los operarios.`}
        confirmText="Sí, Eliminar"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={handleExecuteDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
