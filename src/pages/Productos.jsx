import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, Plus, Search, Filter, Edit2, Trash2, CheckCircle2,
  XCircle, Clock, Zap, Weight, Building2, AlertCircle, RefreshCw,
  FileText, Check, X, ArrowRight, Layers, Tag
} from 'lucide-react';
import { fetchProductos, insertProducto, updateProducto, deleteProducto } from '@/services/dataService';

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroFamilia, setFiltroFamilia] = useState('Todas');
  const [filtroEstado, setFiltroEstado] = useState('Todos'); // 'Todos' | 'Activos' | 'Discontinuados'

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [form, setForm] = useState({
    codigo: '',
    descripcion: '',
    cliente: '',
    familia: 'Baterías 48V',
    tiempoCiclo: 120,
    objetivoHora: 30,
    peso: 25.0,
    activo: true,
    notas: ''
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const loadData = async () => {
    setLoading(true);
    const { data } = await fetchProductos();
    if (data) setProductos(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Familias únicas para los filtros
  const familiasUnicas = ['Todas', ...Array.from(new Set(productos.map(p => p.familia || 'General')))];

  // Filtrado
  const productosFiltrados = productos.filter(p => {
    if (filtroFamilia !== 'Todas' && (p.familia || 'General') !== filtroFamilia) return false;
    if (filtroEstado === 'Activos' && !p.activo) return false;
    if (filtroEstado === 'Discontinuados' && p.activo) return false;
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      return (
        (p.codigo || '').toLowerCase().includes(q) ||
        (p.descripcion || '').toLowerCase().includes(q) ||
        (p.cliente || '').toLowerCase().includes(q) ||
        (p.notas || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const openCreateModal = () => {
    setForm({
      codigo: `BAT-${Math.floor(12 + Math.random() * 60)}V-${Math.floor(50 + Math.random() * 250)}Ah`,
      descripcion: 'Batería LFP Estándar Industrial MES',
      cliente: 'Cliente Industrial Principal',
      familia: 'Baterías 48V',
      tiempoCiclo: 120,
      objetivoHora: 30,
      peso: 28.5,
      activo: true,
      notas: 'Utillajes estándar e inspección de calidad final obligatoria.'
    });
    setModalMode('create');
    setModalOpen(true);
  };

  const openEditModal = (producto) => {
    setForm({ ...producto });
    setModalMode('edit');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const dataToSave = {
      ...form,
      tiempoCiclo: Number(form.tiempoCiclo),
      objetivoHora: Number(form.objetivoHora),
      peso: Number(form.peso)
    };

    if (modalMode === 'create') {
      const { data } = await insertProducto(dataToSave);
      if (data) {
        setProductos(prev => [...prev, data]);
        showToast('Producto creado y añadido al catálogo de fabricación');
      }
    } else {
      const { data } = await updateProducto(form.id, dataToSave);
      if (data) {
        setProductos(prev => prev.map(p => p.id === form.id ? data : p));
        showToast('Ficha de producto actualizada con éxito');
      }
    }
    setSaving(false);
    setModalOpen(false);
  };

  const handleDelete = async (id, codigo) => {
    if (window.confirm(`¿Estás seguro de eliminar o discontinuar el producto [${codigo}]? Esto podría afectar a datos históricos si se borra en lugar de discontinuarse.`)) {
      await deleteProducto(id);
      setProductos(prev => prev.filter(p => p.id !== id));
      showToast(`Producto ${codigo} eliminado del catálogo`);
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12 animate-fade-in">
      {/* Toast Notificación */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-6 z-50 bg-emerald-600 text-white font-bold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-emerald-400/30"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cabecera */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest bg-blue-500/20 text-blue-400 px-2.5 py-0.5 rounded-full border border-blue-500/30">
              MES Catalog Manager
            </span>
            <span className="text-xs text-slate-400 font-medium">· Total: {productos.length} referencias</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
            <Package className="w-8 h-8 text-blue-400" />
            Catálogo de Productos y Referencias de Fabricación
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Define las referencias, tiempos de ciclo, objetivos por hora y pesos nominales para planificar la producción y calcular OEE en tiempo real.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700"
            title="Recargar catálogo"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={openCreateModal}
            className="px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-blue-900/40 flex items-center gap-2 transition-all active:scale-95 border border-blue-400/20"
          >
            <Plus className="w-5 h-5" />
            <span>Nuevo Producto / Referencia</span>
          </button>
        </div>
      </div>

      {/* Filtros y Buscador */}
      <div className="card p-4 bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Buscador */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por código, descripción, cliente o notas..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Filtros derecha */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Familia */}
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 font-bold">Familia:</span>
            <select
              value={filtroFamilia}
              onChange={e => setFiltroFamilia(e.target.value)}
              className="bg-transparent font-black text-white focus:outline-none cursor-pointer"
            >
              {familiasUnicas.map(f => <option key={f} value={f} className="bg-slate-900">{f}</option>)}
            </select>
          </div>

          {/* Estado */}
          <div className="flex items-center bg-slate-950 border border-slate-700 rounded-xl p-1 text-xs font-bold">
            {['Todos', 'Activos', 'Discontinuados'].map(estado => (
              <button
                key={estado}
                onClick={() => setFiltroEstado(estado)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filtroEstado === estado ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                {estado}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid de Productos */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 font-bold">Cargando referencias de producción...</div>
      ) : productosFiltrados.length === 0 ? (
        <div className="card py-16 text-center border-2 border-dashed border-slate-800 bg-slate-950/40">
          <Package className="w-12 h-12 text-slate-600 mx-auto mb-3 opacity-50" />
          <h3 className="text-base font-black text-white">No se han encontrado productos</h3>
          <p className="text-xs text-slate-400 mt-1">Prueba a cambiar el criterio de búsqueda o filtro de familia.</p>
          <button
            onClick={openCreateModal}
            className="mt-4 px-4 py-2 bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white font-bold text-xs rounded-xl transition-all border border-blue-500/30"
          >
            + Añadir Nueva Referencia
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {productosFiltrados.map((p) => (
            <motion.div
              key={p.id}
              layout
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`card p-5 border transition-all flex flex-col justify-between group hover:shadow-xl ${
                p.activo ? 'bg-slate-900/90 border-slate-800 hover:border-blue-500/50' : 'bg-slate-950/60 border-slate-800/60 opacity-70'
              }`}
            >
              <div>
                {/* Fila superior: Código y Estado */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-black text-blue-400 bg-blue-500/10 border border-blue-500/30 px-2.5 py-1 rounded-lg">
                      {p.codigo}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                      {p.familia || 'General'}
                    </span>
                  </div>
                  {p.activo ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" /> Activo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-red-400 bg-red-500/10 border border-red-500/30 px-2 py-0.5 rounded-full">
                      <XCircle className="w-3 h-3" /> Discontinuado
                    </span>
                  )}
                </div>

                {/* Descripción y Cliente */}
                <h3 className="text-base font-black text-white leading-snug mb-1 group-hover:text-blue-300 transition-colors">
                  {p.descripcion}
                </h3>
                <p className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 mb-4">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Cliente / Destino: <strong className="text-slate-200">{p.cliente || 'Estándar'}</strong></span>
                </p>

                {/* Parámetros de Cadencia y Peso */}
                <div className="grid grid-cols-3 gap-2 bg-slate-950/90 rounded-2xl p-3 border border-slate-800/80 mb-4 text-center">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5 flex items-center justify-center gap-1">
                      <Zap className="w-3 h-3 text-amber-400" /> Cadencia
                    </span>
                    <span className="font-black text-white text-sm">{p.objetivoHora || 30}</span>
                    <span className="text-[10px] text-slate-400 block">uds / hora</span>
                  </div>
                  <div className="border-x border-slate-800/80 px-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5 flex items-center justify-center gap-1">
                      <Clock className="w-3 h-3 text-blue-400" /> T. Ciclo
                    </span>
                    <span className="font-black text-blue-400 text-sm font-mono">{p.tiempoCiclo || 120}s</span>
                    <span className="text-[10px] text-slate-400 block">por unidad</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5 flex items-center justify-center gap-1">
                      <Weight className="w-3 h-3 text-emerald-400" /> Peso
                    </span>
                    <span className="font-black text-emerald-400 text-sm">{p.peso || 25}</span>
                    <span className="text-[10px] text-slate-400 block">kg / ud</span>
                  </div>
                </div>

                {/* Notas y utillajes */}
                {p.notas && (
                  <div className="bg-slate-900/50 rounded-xl p-2.5 border border-slate-800/60 mb-4 text-xs text-slate-300">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block mb-0.5">Especificaciones / Utillaje:</span>
                    <p className="line-clamp-2 leading-relaxed">{p.notas}</p>
                  </div>
                )}
              </div>

              {/* Acciones */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800/80 mt-auto">
                <button
                  onClick={() => openEditModal(p)}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-300 font-black text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Editar Ficha
                </button>
                <button
                  onClick={() => handleDelete(p.id, p.codigo)}
                  className="p-2 rounded-xl bg-slate-800/80 hover:bg-red-600/30 text-slate-400 hover:text-red-300 transition-all"
                  title="Eliminar producto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* MODAL CREAR / EDITAR PRODUCTO */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="card p-6 md:p-8 max-w-xl w-full bg-slate-900 border border-slate-700 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <Package className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">
                      {modalMode === 'create' ? 'Nueva Referencia de Producción' : `Editar Producto [${form.codigo}]`}
                    </h3>
                    <p className="text-xs text-slate-400">Parámetros de cadencia, peso y clasificación en el catálogo</p>
                  </div>
                </div>
                <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                {/* Código y Familia */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Código / Referencia *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ej: BAT-48V-100Ah"
                      value={form.codigo}
                      onChange={e => setForm({ ...form, codigo: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-black text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Familia / Categoría *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ej: Baterías 48V"
                      value={form.familia}
                      onChange={e => setForm({ ...form, familia: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Descripción del Producto *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ej: Batería LFP 48V 100Ah — Estándar Industrial"
                    value={form.descripcion}
                    onChange={e => setForm({ ...form, descripcion: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Cliente */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Cliente / Proyecto Habitual
                    </label>
                    <input
                      type="text"
                      placeholder="ej: Cliente A"
                      value={form.cliente || ''}
                      onChange={e => setForm({ ...form, cliente: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Estado en Planta
                    </label>
                    <select
                      value={form.activo ? 'true' : 'false'}
                      onChange={e => setForm({ ...form, activo: e.target.value === 'true' })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="true">🟢 Activo en Producción</option>
                      <option value="false">🔴 Discontinuado / Obsoleto</option>
                    </select>
                  </div>
                </div>

                {/* Parámetros: Cadencia, Ciclo y Peso */}
                <div className="bg-slate-950/90 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <span className="text-[11px] font-black uppercase text-blue-400 tracking-wider block">Parámetros de Cadencia y OEE</span>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Objetivo (uds/h)</label>
                      <input
                        type="number"
                        min="1"
                        max="1000"
                        value={form.objetivoHora || 30}
                        onChange={e => setForm({ ...form, objetivoHora: Number(e.target.value) })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-black text-amber-400 text-center font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">T. Ciclo (s/ud)</label>
                      <input
                        type="number"
                        min="1"
                        max="7200"
                        value={form.tiempoCiclo || 120}
                        onChange={e => setForm({ ...form, tiempoCiclo: Number(e.target.value) })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-black text-blue-400 text-center font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Peso (kg/ud)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={form.peso || 25}
                        onChange={e => setForm({ ...form, peso: Number(e.target.value) })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-black text-emerald-400 text-center font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Notas */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Notas Técnicas / Utillajes / Instrucciones Especiales
                  </label>
                  <textarea
                    rows={3}
                    placeholder="ej: Requiere utillaje especial #A12. Verificar apriete dinamométrico del BMS a 5.5 Nm..."
                    value={form.notas || ''}
                    onChange={e => setForm({ ...form, notas: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Botones acción */}
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
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-blue-900/40 transition-all"
                  >
                    <Check className="w-4 h-4" />
                    <span>{saving ? 'Guardando...' : modalMode === 'create' ? 'Crear Producto' : 'Guardar Cambios'}</span>
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
