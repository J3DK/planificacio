import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ListChecks, CheckSquare, ClipboardCheck, Wrench, Plus, Pencil, Trash2,
  CheckCircle2, AlertTriangle, Filter, Search, ShieldCheck, Clock,
  Factory, Eye, Save, XCircle, Check, X, History, User, Calendar, LayoutGrid, List
} from 'lucide-react';
import {
  getChecklistTemplates, insertChecklistTemplate, updateChecklistTemplate, deleteChecklistTemplate,
  getChecklistEjecuciones, fetchLineas
} from '@/services/dataService';
import { useAppConfig } from '@/services/configService';
import ChecklistTemplateEditor from '@/components/shared/ChecklistTemplateEditor';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

export default function Checklists() {
  const appConfig = useAppConfig();
  const [templates, setTemplates] = useState([]);
  const [ejecuciones, setEjecuciones] = useState([]);
  const [lineas, setLineas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState('todas'); // todas | id de categoría
  const [searchTerm, setSearchTerm] = useState('');
  const [activeView, setActiveView] = useState('plantillas'); // plantillas | historial
  const [viewMode, setViewMode] = useState('grid'); // grid | table

  // Modal Crear/Editar Plantilla
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // create | edit
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  // Modal Confirm Delete
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Modal Ver Detalle Ejecución
  const [modalEjecucionOpen, setModalEjecucionOpen] = useState(false);
  const [selectedEjecucion, setSelectedEjecucion] = useState(null);

  const loadData = async () => {
    setLoading(true);
    const [resTpl, resExe, resL] = await Promise.all([
      getChecklistTemplates(),
      getChecklistEjecuciones(),
      fetchLineas()
    ]);
    if (resTpl.data) setTemplates(resTpl.data);
    if (resExe.data) setEjecuciones(resExe.data);
    if (resL.data) setLineas(resL.data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const handler = () => loadData();
    window.addEventListener('checklists_updated', handler);
    window.addEventListener('checklists_ejecutados', handler);
    return () => {
      window.removeEventListener('checklists_updated', handler);
      window.removeEventListener('checklists_ejecutados', handler);
    };
  }, []);

  const openCreateModal = () => {
    setEditItem({
      nombre: '',
      categoria: filterCat !== 'todas' ? filterCat : 'calidad',
      descripcion: '',
      aplicaA: { tipo: 'general', ids: [] },
      frecuencia: 'por_orden',
      activo: true,
      items: [
        { id: `IT-1`, texto: 'Inspección visual inicial del puesto y componentes', orden: 1, critico: false }
      ]
    });
    setModalMode('create');
    setModalOpen(true);
  };

  const openEditModal = (tpl) => {
    setEditItem(JSON.parse(JSON.stringify(tpl)));
    setModalMode('edit');
    setModalOpen(true);
  };

  const openDeleteConfirm = (tpl) => {
    setDeleteTarget(tpl);
    setConfirmDeleteOpen(true);
  };

  const handleSaveTemplate = (e) => {
    if (e) e.preventDefault();
    if (!editItem.nombre) return;
    setShowSaveConfirm(true);
  };

  const executeSaveTemplate = async () => {
    setShowSaveConfirm(false);
    setSaving(true);

    if (modalMode === 'create') {
      const res = await insertChecklistTemplate(editItem);
      if (res.data) setTemplates(prev => [...prev.filter(t => t.id !== res.data.id), res.data]);
    } else {
      const res = await updateChecklistTemplate(editItem.id, editItem);
      if (res.data) setTemplates(prev => prev.map(t => t.id === editItem.id ? res.data : t));
    }

    setSaving(false);
    setModalOpen(false);
    setEditItem(null);
  };

  const handleDeleteTemplate = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await deleteChecklistTemplate(deleteTarget.id);
    setTemplates(prev => prev.filter(t => t.id !== deleteTarget.id));
    setDeleting(false);
    setConfirmDeleteOpen(false);
    setDeleteTarget(null);
  };

  const toggleLineaSelection = (lineaId) => {
    setEditItem(prev => {
      const currentIds = prev.aplicaA?.ids || [];
      const exists = currentIds.includes(lineaId);
      const newIds = exists ? currentIds.filter(id => id !== lineaId) : [...currentIds, lineaId];
      return {
        ...prev,
        aplicaA: { ...prev.aplicaA, ids: newIds }
      };
    });
  };

  const filteredTemplates = useMemo(() => {
    return templates.filter(t => {
      if (filterCat !== 'todas' && t.categoria !== filterCat) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const nom = (t.nombre || '').toLowerCase();
        const desc = (t.descripcion || '').toLowerCase();
        return nom.includes(q) || desc.includes(q);
      }
      return true;
    });
  }, [templates, filterCat, searchTerm]);

  const catColors = useMemo(() => {
    const defaultColors = {
      calidad: { badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', icon: CheckSquare, label: 'Calidad (QC)' },
      cil: { badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40', icon: ClipboardCheck, label: 'CIL (Limpieza/Insp/Lub)' },
      mantenimiento: { badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40', icon: Wrench, label: 'Mantenimiento Preventivo' }
    };
    const bgMap = {
      slate: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
      blue: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
      cyan: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      emerald: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      amber: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      rose: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      indigo: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
      fuchsia: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40',
    };
    const out = { ...defaultColors };
    (appConfig.checklistCategorias || []).forEach(cat => {
      let icon = ClipboardCheck;
      if (cat.id === 'calidad') icon = CheckSquare;
      if (cat.id === 'mantenimiento') icon = Wrench;
      out[cat.id] = { badge: bgMap[cat.color] || bgMap.slate, icon, label: cat.label };
    });
    return out;
  }, [appConfig.checklistCategorias]);

  const frecLabels = {
    por_orden: 'Por Orden (OF / Referencia)',
    por_turno: 'Por Relevo de Turno',
    diario: 'Diario (Autónomo)',
    semanal: 'Semanal',
    segun_plan: 'Según Plan Preventivo'
  };

  return (
    <div className="space-y-6 select-none">
      {/* ── CABECERA PRINCIPAL ── */}
      <div className="card p-6 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-900/30">
              <ListChecks className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">Módulo Central de Checklists</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Plantillas y pautas estandarizadas de inspección para Calidad, CIL (Limpieza/Inspección/Lubricación) y Mantenimiento
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveView('plantillas')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                activeView === 'plantillas' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ListChecks className="w-4 h-4" /> Plantillas ({templates.length})
            </button>
            <button
              onClick={() => setActiveView('historial')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                activeView === 'historial' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <History className="w-4 h-4" /> Historial en Planta ({ejecuciones.length})
            </button>
          </div>

          {activeView === 'plantillas' && (
            <button
              onClick={openCreateModal}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-900/40 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" /> + Nueva Plantilla
            </button>
          )}
        </div>
      </div>

      {/* ── VISTA DE PLANTILLAS ── */}
      {activeView === 'plantillas' && (
        <>
          {/* Filtros de Categoría y Búsqueda */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-3xl border border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setFilterCat('todas')}
                className={`px-3.5 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-2 border ${
                  filterCat === 'todas'
                    ? 'bg-slate-800 text-white border-emerald-500 shadow-lg shadow-emerald-900/20'
                    : 'bg-slate-950/80 text-slate-400 border-slate-800/80 hover:text-white hover:border-slate-700'
                }`}
              >
                <Filter className={`w-3.5 h-3.5 ${filterCat === 'todas' ? 'text-emerald-400' : 'text-slate-500'}`} />
                Todas las Categorías
              </button>
              {(appConfig.checklistCategorias || []).map(cat => {
                const isSel = filterCat === cat.id;
                let IconComp = ClipboardCheck;
                if (cat.id === 'calidad') IconComp = CheckSquare;
                if (cat.id === 'mantenimiento') IconComp = Wrench;
                
                return (
                  <button
                    key={cat.id}
                    onClick={() => setFilterCat(cat.id)}
                    className={`px-3.5 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-2 border ${
                      isSel
                        ? 'bg-slate-800 text-white border-emerald-500 shadow-lg shadow-emerald-900/20'
                        : 'bg-slate-950/80 text-slate-400 border-slate-800/80 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <IconComp className={`w-3.5 h-3.5 ${isSel ? 'text-emerald-400' : 'text-slate-500'}`} />
                    {cat.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              <div className="relative min-w-[200px] flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nombre o descripción..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-2 text-xs text-white font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center bg-slate-950 border border-slate-800 p-1 rounded-2xl shrink-0">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-xl transition-all ${
                    viewMode === 'grid' ? 'bg-slate-800 text-emerald-400 shadow-md' : 'text-slate-500 hover:text-white'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-xl transition-all ${
                    viewMode === 'table' ? 'bg-slate-800 text-emerald-400 shadow-md' : 'text-slate-500 hover:text-white'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Listado de Plantillas */}
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm animate-pulse">Cargando plantillas de check...</div>
          ) : filteredTemplates.length === 0 ? (
            <div className="card p-12 text-center space-y-3 bg-slate-900/40 border-dashed border-slate-800">
              <ListChecks className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-400">No se encontraron plantillas para la categoría o búsqueda actual.</p>
              <button
                onClick={openCreateModal}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs inline-flex items-center gap-2 mt-2"
              >
                <Plus className="w-4 h-4" /> Crear primera plantilla
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredTemplates.map(tpl => {
                const catInfo = catColors[tpl.categoria] || catColors.calidad || { badge: 'bg-slate-500/20 text-slate-300', icon: ClipboardCheck, label: tpl.categoria };
                const criticosCount = (tpl.items || []).filter(i => i.critico).length;
                return (
                  <motion.div
                    key={tpl.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`card p-5 border flex flex-col justify-between transition-all ${
                      tpl.activo ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-slate-950/60 border-slate-900 opacity-60'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${catInfo.badge}`}>
                          <catInfo.icon className="w-3.5 h-3.5" />
                          {catInfo.label}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${tpl.activo ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'}`}>
                            {tpl.activo ? 'ACTIVO' : 'INACTIVO'}
                          </span>
                          <span className="font-mono text-[11px] font-bold text-slate-500">{tpl.id}</span>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-base font-black text-white leading-snug">{tpl.nombre}</h3>
                        <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">{tpl.descripcion || 'Sin descripción pormenorizada'}</p>
                      </div>

                      <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800/80 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 flex items-center gap-1.5 font-bold">
                            <Clock className="w-3.5 h-3.5 text-slate-400" /> Frecuencia:
                          </span>
                          <span className="font-black text-white">{frecLabels[tpl.frecuencia] || tpl.frecuencia}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 flex items-center gap-1.5 font-bold">
                            <Factory className="w-3.5 h-3.5 text-slate-400" /> Ámbito / Aplica a:
                          </span>
                          <span className="font-black text-emerald-300 truncate max-w-[150px]">
                            {tpl.aplicaA?.tipo === 'general'
                              ? 'General'
                              : `Líneas: ${(tpl.aplicaA?.ids || []).join(', ') || 'Todas'}`}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                          <span className="text-slate-500 font-bold">Puntos de inspección:</span>
                          <span className="font-mono font-black text-amber-400">
                            {tpl.items?.length || 0} puntos {criticosCount > 0 && <span className="text-red-400 font-bold">({criticosCount} ⚡)</span>}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-800 gap-2">
                      <button
                        onClick={async () => {
                          const upd = await updateChecklistTemplate(tpl.id, { activo: !tpl.activo });
                          if (upd.data) setTemplates(prev => prev.map(t => t.id === tpl.id ? upd.data : t));
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                          tpl.activo ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600/40'
                        }`}
                      >
                        {tpl.activo ? 'Desactivar' : 'Activar'}
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(tpl)}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-600/20 text-slate-300 hover:text-emerald-300 border border-slate-700 hover:border-emerald-500/50 text-xs font-black flex items-center gap-1.5 transition-all"
                        >
                          <Pencil className="w-3.5 h-3.5" /> Editar
                        </button>
                        <button
                          onClick={() => openDeleteConfirm(tpl)}
                          className="p-1.5 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700 transition-colors"
                          title="Eliminar plantilla"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-950/80 border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="p-4 font-black">ID</th>
                      <th className="p-4 font-black">Categoría</th>
                      <th className="p-4 font-black">Nombre de la Plantilla</th>
                      <th className="p-4 font-black">Frecuencia</th>
                      <th className="p-4 font-black">Puntos</th>
                      <th className="p-4 font-black">Estado</th>
                      <th className="p-4 font-black text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredTemplates.map(tpl => {
                      const catInfo = catColors[tpl.categoria] || catColors.calidad || { badge: 'bg-slate-500/20 text-slate-300', icon: ClipboardCheck, label: tpl.categoria };
                      const criticosCount = (tpl.items || []).filter(i => i.critico).length;
                      return (
                        <tr key={tpl.id} className="hover:bg-slate-800/40 transition-colors group">
                          <td className="p-4 font-mono text-[11px] font-bold text-slate-500">{tpl.id}</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 ${catInfo.badge}`}>
                              <catInfo.icon className="w-3 h-3" />
                              {catInfo.label}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-white">{tpl.nombre}</div>
                            {tpl.descripcion && <div className="text-xs text-slate-500 truncate max-w-[200px]">{tpl.descripcion}</div>}
                          </td>
                          <td className="p-4 text-xs font-medium text-slate-300">
                            {frecLabels[tpl.frecuencia] || tpl.frecuencia}
                          </td>
                          <td className="p-4 text-xs">
                            <span className="font-bold text-slate-300">{tpl.items?.length || 0}</span>
                            {criticosCount > 0 && <span className="ml-2 px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-bold text-[10px]">({criticosCount} ⚡)</span>}
                          </td>
                          <td className="p-4">
                            <button
                              onClick={async () => {
                                const upd = await updateChecklistTemplate(tpl.id, { activo: !tpl.activo });
                                if (upd.data) setTemplates(prev => prev.map(t => t.id === tpl.id ? upd.data : t));
                              }}
                              className={`px-2.5 py-1 rounded text-[10px] font-black transition-colors ${
                                tpl.activo ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-slate-800 text-slate-500 hover:bg-slate-700 hover:text-slate-300'
                              }`}
                            >
                              {tpl.activo ? 'ACTIVO' : 'INACTIVO'}
                            </button>
                          </td>
                          <td className="p-4 text-right space-x-2">
                            <button
                              onClick={() => openEditModal(tpl)}
                              className="p-1.5 rounded-lg bg-slate-800/50 hover:bg-emerald-600/20 text-slate-400 hover:text-emerald-400 transition-colors inline-flex"
                              title="Editar"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openDeleteConfirm(tpl)}
                              className="p-1.5 rounded-lg bg-slate-800/50 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors inline-flex"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── VISTA DE HISTORIAL DE EJECUCIONES EN PLANTA ── */}
      {activeView === 'historial' && (
        <div className="card p-6 bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-400" />
                Historial de Checklists Ejecutados en Planta
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Registro de todas las comprobaciones realizadas desde el Panel de Calidad (QC) y el Panel de Operario (CIL)
              </p>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800">
            {ejecuciones.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                Aún no se han ejecutado checklists en planta. Cuando los operarios o inspectores completen pautas desde su terminal, aparecerán aquí.
              </div>
            ) : (
              ejecuciones.map(exe => {
                const tplInfo = templates.find(t => t.id === exe.templateId) || { nombre: exe.templateNombre || 'Checklist', categoria: exe.categoria };
                const catInfo = catColors[tplInfo.categoria] || catColors.calidad;
                const criticosNoOk = (exe.resultados || []).filter(r => r.estado === 'No OK');
                return (
                  <div key={exe.id} className="p-4 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-900/50 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded border text-[9px] font-black uppercase ${catInfo.badge}`}>
                          {tplInfo.categoria}
                        </span>
                        <span className="font-black text-white text-sm">{tplInfo.nombre}</span>
                        {exe.huboIncidenciaCritica || criticosNoOk.length > 0 ? (
                          <span className="px-2 py-0.5 rounded bg-red-600 text-white font-black text-[10px] animate-pulse flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> INCIDENCIA NO OK
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px] flex items-center gap-1">
                            <Check className="w-3 h-3" /> TODO OK
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-slate-400 font-medium pt-1">
                        <span className="flex items-center gap-1"><Factory className="w-3.5 h-3.5 text-slate-500" /> Línea: <strong className="text-white">{exe.linea}</strong></span>
                        <span className="flex items-center gap-1"><User className="w-3.5 h-3.5 text-slate-500" /> Responsable: <strong className="text-white">{exe.operarioId || 'Inspector'}</strong></span>
                        {exe.ordenId && <span>Orden/OF: <strong className="text-amber-400 font-mono">{exe.ordenId}</strong></span>}
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-500" /> {new Date(exe.fecha).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center flex-shrink-0">
                      <span className="font-mono text-slate-300">
                        {(exe.resultados || []).filter(r => r.estado === 'OK').length} / {(exe.resultados || []).length} OK
                      </span>
                      <button
                        onClick={() => { setSelectedEjecucion(exe); setModalEjecucionOpen(true); }}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> Ver Detalle
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ── MODAL CREAR / EDITAR PLANTILLA ── */}
      <AnimatePresence>
        {modalOpen && editItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-6 md:p-8 max-w-3xl w-full shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <div className="flex items-center justify-between pb-5 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <ListChecks className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white">
                      {modalMode === 'create' ? 'Crear Nueva Plantilla de Checklist' : 'Editar Plantilla de Checklist'}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">Configura la pauta de puntos y su frecuencia de disparo</p>
                  </div>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveTemplate} className="py-5 space-y-5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-black text-slate-300 block mb-1">Nombre de la Plantilla / Pauta *</label>
                    <input
                      type="text"
                      required
                      value={editItem.nombre}
                      onChange={e => setEditItem({ ...editItem, nombre: e.target.value })}
                      placeholder="Ej: Inspección visual y estanqueidad LFP"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="font-black text-slate-300 block mb-1">Categoría Módulo</label>
                    <select
                      value={editItem.categoria}
                      onChange={e => setEditItem({ ...editItem, categoria: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-black focus:outline-none"
                    >
                      {(appConfig.checklistCategorias || []).map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-black text-slate-300 block mb-1">Descripción / Propósito</label>
                  <input
                    type="text"
                    value={editItem.descripcion}
                    onChange={e => setEditItem({ ...editItem, descripcion: e.target.value })}
                    placeholder="Describe los objetivos de esta pauta para el operario o inspector..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-medium focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-black text-slate-300 block mb-1">Frecuencia / Momento de Ejecución</label>
                    <select
                      value={editItem.frecuencia}
                      onChange={e => setEditItem({ ...editItem, frecuencia: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-bold focus:outline-none"
                    >
                      <option value="por_orden">Por Orden de Fabricación (Al iniciar/cambiar OF)</option>
                      <option value="por_turno">Por Relevo de Turno (Inicio Mañana/Tarde/Noche)</option>
                      <option value="diario">Diario (Mantenimiento Autónomo)</option>
                      <option value="semanal">Semanal</option>
                      <option value="segun_plan">Según Plan Preventivo (Vinculado a horas/días en MTO)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-black text-slate-300 block mb-1">Ámbito de Aplicación</label>
                    <select
                      value={editItem.aplicaA?.tipo || 'general'}
                      onChange={e => setEditItem({
                        ...editItem,
                        aplicaA: { tipo: e.target.value, ids: e.target.value === 'general' ? [] : (editItem.aplicaA?.ids || ['L1']) }
                      })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-bold focus:outline-none"
                    >
                      <option value="general">General (Aplica a todas las líneas del taller)</option>
                      <option value="linea">Líneas Específicas (Seleccionar abajo)</option>
                    </select>
                  </div>
                </div>

                {/* Selección de Líneas específicas si aplicaA.tipo === 'linea' */}
                {editItem.aplicaA?.tipo === 'linea' && (
                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                    <span className="font-black text-slate-300 block">Selecciona las líneas donde estará activa esta pauta:</span>
                    <div className="flex flex-wrap gap-2">
                      {lineas.map(l => {
                        const sel = (editItem.aplicaA?.ids || []).includes(l.id) || (editItem.aplicaA?.ids || []).includes(l.nombre);
                        return (
                          <button
                            key={l.id}
                            type="button"
                            onClick={() => toggleLineaSelection(l.id)}
                            className={`px-3 py-1.5 rounded-xl font-bold transition-all border ${
                              sel
                                ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                            }`}
                          >
                            {l.nombre}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* EDITOR DE ÍTEMS EN LÍNEA (COMPONENTE REUTILIZABLE) */}
                <div className="pt-2">
                  <ChecklistTemplateEditor
                    items={editItem.items || []}
                    onChange={newItems => setEditItem({ ...editItem, items: newItems })}
                  />
                </div>

                {/* Toggle Activo */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="font-black text-slate-300">Estado de la plantilla:</span>
                  <button
                    type="button"
                    onClick={() => setEditItem({ ...editItem, activo: !editItem.activo })}
                    className={`px-4 py-1.5 rounded-xl font-black transition-all ${
                      editItem.activo
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/50'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {editItem.activo ? 'Plantilla Activa' : 'Inactiva (Oculta en planta)'}
                  </button>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-black"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black shadow-lg shadow-emerald-900/50 flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" /> {saving ? 'Guardando...' : 'Guardar Plantilla'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL VER DETALLE EJECUCIÓN EN PLANTA ── */}
      <AnimatePresence>
        {modalEjecucionOpen && selectedEjecucion && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl space-y-5 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-lg font-black text-white">Reporte de Ejecución de Checklist</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Línea: <strong className="text-white">{selectedEjecucion.linea}</strong> · Fecha: {new Date(selectedEjecucion.fecha).toLocaleString()}
                  </p>
                </div>
                <button onClick={() => setModalEjecucionOpen(false)} className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {(selectedEjecucion.resultados || []).map((res, idx) => {
                  const isOk = res.estado === 'OK';
                  return (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between gap-4 ${
                        isOk
                          ? 'bg-slate-950 border-slate-800 text-slate-200'
                          : 'bg-red-950/30 border-red-500/60 text-red-200 font-bold'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-black ${isOk ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/30 text-red-400'}`}>
                          {isOk ? '✓' : '✕'}
                        </span>
                        <span>{res.texto || `Punto ${idx + 1}`}</span>
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg font-black font-mono ${isOk ? 'bg-emerald-600/20 text-emerald-300' : 'bg-red-600 text-white animate-pulse'}`}>
                        {res.estado}
                      </span>
                    </div>
                  );
                })}
              </div>

              {selectedEjecucion.comentarios && (
                <div className="mt-4 bg-slate-900 border border-slate-700 p-4 rounded-2xl">
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Comentarios / Observaciones</span>
                  <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">{selectedEjecucion.comentarios}</p>
                </div>
              )}

              <div className="flex justify-end pt-3 border-t border-slate-800">
                <button
                  onClick={() => setModalEjecucionOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        title="Eliminar Plantilla"
        message={`¿Estás seguro de que quieres eliminar la plantilla "${deleteTarget?.nombre}"? Esta acción no afectará al historial de ejecuciones pasadas, pero impedirá que se use en el futuro.`}
        onConfirm={handleDeleteTemplate}
        onCancel={() => setConfirmDeleteOpen(false)}
        isDestructive={true}
        confirmText={deleting ? 'Eliminando...' : 'Sí, Eliminar'}
      />

      <ConfirmDialog
        isOpen={showSaveConfirm}
        title="Confirmar Guardado"
        message={`¿Estás seguro de que quieres guardar la plantilla "${editItem?.nombre}"?`}
        onConfirm={executeSaveTemplate}
        onCancel={() => setShowSaveConfirm(false)}
        isDestructive={false}
        confirmText="Sí, Guardar"
      />
    </div>
  );
}
