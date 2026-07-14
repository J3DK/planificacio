import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, UserPlus, Search, Filter, ShieldCheck, Factory, Clock,
  Key, Edit3, Trash2, CheckCircle2, XCircle, Award, Sparkles,
  LayoutGrid, List, ChevronRight, AlertCircle, RefreshCw, Mail, Phone
} from 'lucide-react';
import { fetchOperarios, insertOperario, updateOperario, deleteOperario, fetchLineas } from '@/services/dataService';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

export default function Operarios() {
  const [operarios, setOperarios] = useState([]);
  const [lineas, setLineas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroLinea, setFiltroLinea] = useState('todas');
  const [filtroTurno, setFiltroTurno] = useState('todos');
  const [filtroRol, setFiltroRol] = useState('todos');

  // Modal CRUD
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    id: '',
    nombre: '',
    email: '',
    rol: 'Operario Especialista',
    lineas: ['L1'],
    turno: 'Mañana',
    estado: 'activo',
    especialidad: '',
    pin: '',
    avatar: ''
  });
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Confirmar Borrado
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetDelete, setTargetDelete] = useState(null);

  const loadData = async () => {
    setLoading(true);
    const [resOp, resLin] = await Promise.all([fetchOperarios(), fetchLineas()]);
    if (resOp.data) setOperarios(resOp.data);
    if (resLin.data) setLineas(resLin.data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const operariosFiltrados = useMemo(() => {
    return operarios.filter(op => {
      if (busqueda.trim()) {
        const query = busqueda.toLowerCase();
        const matchNombre = op.nombre?.toLowerCase().includes(query);
        const matchId = op.id?.toLowerCase().includes(query);
        const matchEspec = op.especialidad?.toLowerCase().includes(query);
        if (!matchNombre && !matchId && !matchEspec) return false;
      }
      if (filtroLinea !== 'todas' && (!op.lineas || !op.lineas.includes(filtroLinea))) return false;
      if (filtroTurno !== 'todos' && op.turno !== filtroTurno) return false;
      if (filtroRol !== 'todos' && op.rol !== filtroRol) return false;
      return true;
    });
  }, [operarios, busqueda, filtroLinea, filtroTurno, filtroRol]);

  const stats = useMemo(() => {
    const total = operarios.length;
    const activos = operarios.filter(o => o.estado === 'activo').length;
    const jefes = operarios.filter(o => o.rol?.includes('Jefe')).length;
    const conPin = operarios.filter(o => o.pin && o.pin.trim() !== '').length;
    return { total, activos, jefes, conPin };
  }, [operarios]);

  const handleOpenNew = () => {
    setEditingId(null);
    setFormData({
      id: `OP-${String(Math.floor(100 + Math.random() * 900))}`,
      nombre: '',
      email: '',
      rol: 'Operario Especialista',
      lineas: ['L1'],
      turno: 'Mañana',
      estado: 'activo',
      especialidad: '',
      pin: '1234',
      avatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 99999999)}?auto=format&fit=crop&w=150&q=80`
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (op) => {
    setEditingId(op.id);
    setFormData({
      id: op.id || '',
      nombre: op.nombre || '',
      email: op.email || '',
      rol: op.rol || 'Operario Especialista',
      lineas: Array.isArray(op.lineas) ? op.lineas : ['L1'],
      turno: op.turno || 'Mañana',
      estado: op.estado || 'activo',
      especialidad: op.especialidad || '',
      pin: op.pin || '',
      avatar: op.avatar || ''
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
      setSuccessMsg('Operario actualizado correctamente');
    } else {
      const { data } = await insertOperario(formData);
      if (data) setOperarios(prev => [...prev, data]);
      setSuccessMsg('Nuevo operario dado de alta');
    }
    setSaving(false);
    setModalOpen(false);
    setTimeout(() => setSuccessMsg(''), 3000);
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
    setSuccessMsg('Operario eliminado del sistema');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const toggleEstado = async (op) => {
    const nuevoEstado = op.estado === 'activo' ? 'inactivo' : 'activo';
    const { data } = await updateOperario(op.id, { ...op, estado: nuevoEstado });
    if (data) setOperarios(prev => prev.map(o => o.id === op.id ? data : o));
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* ── BANNER EXPLICATIVO / ALERTA DE EXITO ── */}
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
                Gestión del Personal MES
              </span>
              <span className="text-xs text-slate-400 font-medium">Preparado con PIN Login</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight mt-1">
              Operarios & Capacitación por Línea
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
            <span>Añadir Operario</span>
          </button>
        </div>
      </div>

      {/* ── KPI CARDS SUPERIORES ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-4 shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Operarios</p>
            <p className="text-2xl font-black text-white mt-0.5">{stats.total}</p>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-4 shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Activos en Planta</p>
            <p className="text-2xl font-black text-emerald-400 mt-0.5">{stats.activos}</p>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-4 shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Jefes de Línea</p>
            <p className="text-2xl font-black text-amber-400 mt-0.5">{stats.jefes}</p>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-4 shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 flex-shrink-0">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Con PIN / Login</p>
            <p className="text-2xl font-black text-purple-400 mt-0.5">{stats.conPin}</p>
          </div>
        </div>
      </div>

      {/* ── BARRA DE BÚSQUEDA Y FILTROS ── */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 shadow-xl">
        {/* Buscador */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, código OP o especialidad..."
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all font-medium"
          />
        </div>

        {/* Filtros */}
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
          <p className="text-slate-400 text-sm font-bold">Cargando catálogo de operarios...</p>
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

            return (
              <motion.div
                key={op.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`bg-slate-900/90 border rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between ${
                  isActivo ? 'border-slate-800 hover:border-slate-700' : 'border-slate-800/50 opacity-70'
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
                      <div className="relative flex-shrink-0">
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

                      <div className="min-w-0 pr-12">
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
                      <p className="text-xs font-bold text-slate-200 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
                        {op.especialidad || 'Sin especialidad especificada'}
                      </p>
                    </div>

                    {/* Líneas Asignadas & Turno */}
                    <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-800/50">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1">
                          <Factory className="w-3 h-3 text-blue-400" />
                          <span>Líneas Habilitadas</span>
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {Array.isArray(op.lineas) && op.lineas.length > 0 ? (
                            op.lineas.map(linea => (
                              <span
                                key={linea}
                                className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 text-[11px] font-black border border-blue-500/30"
                              >
                                {linea}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-500 font-bold">Ninguna</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-emerald-400" />
                          <span>Turno Habitual</span>
                        </p>
                        <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 text-xs font-bold inline-block border border-slate-700">
                          {op.turno || 'Mañana'}
                        </span>
                      </div>
                    </div>

                    {/* Ficha PIN de Seguridad (Para login futuro) */}
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                      <div className="flex items-center gap-2">
                        <Key className="w-3.5 h-3.5 text-purple-400" />
                        <span className="text-xs font-bold text-slate-400">Acceso Kiosko PIN:</span>
                      </div>
                      <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {op.pin ? '••••' : 'Sin PIN'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pie con Acciones */}
                <div className="px-5 py-3 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-bold">
                    ID: {op.id}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(op)}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all active:scale-95 border border-slate-700"
                      title="Editar ficha del operario"
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
                  <th className="py-4 px-4 text-center">Líneas Capacitadas</th>
                  <th className="py-4 px-4 text-center">Turno</th>
                  <th className="py-4 px-4 text-center">Login PIN</th>
                  <th className="py-4 px-4 text-center">Estado</th>
                  <th className="py-4 px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm font-medium text-slate-300">
                {operariosFiltrados.map(op => {
                  const isActivo = op.estado === 'activo';
                  return (
                    <tr key={op.id} className="hover:bg-slate-800/40 transition-colors group">
                      <td className="py-4 px-6">
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
                        <div className="flex justify-center gap-1">
                          {Array.isArray(op.lineas) && op.lineas.map(l => (
                            <span key={l} className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-xs font-black border border-blue-500/30">
                              {l}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700">
                          {op.turno}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center font-mono text-xs">
                        {op.pin ? (
                          <span className="text-purple-400 font-bold bg-purple-500/10 px-2 py-1 rounded border border-purple-500/20">••••</span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
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
                      {editingId ? 'Editar Ficha del Operario' : 'Alta de Nuevo Operario'}
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

                {/* Selección múltiple de líneas capacitadas */}
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
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      URL de Avatar / Foto
                    </label>
                    <input
                      type="url"
                      value={formData.avatar}
                      onChange={e => setFormData({ ...formData, avatar: e.target.value })}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
                    />
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
