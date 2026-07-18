import React, { useState, useEffect } from 'react';
import { useAppConfig } from '@/services/configService';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, Plus, Search, Filter, Edit2, Trash2, CheckCircle2,
  XCircle, Clock, Zap, Weight, Building2, AlertCircle, RefreshCw,
  FileText, Check, X, ArrowRight, Layers, Tag, Layers3, AlertTriangle, Palette, LayoutGrid, List
} from 'lucide-react';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import {

  fetchProductos, insertProducto, updateProducto, deleteProducto, fetchMateriasPrimas,
  fetchFamilias, insertFamilia, updateFamilia, deleteFamilia
} from '@/services/dataService';

export default function Productos() {
  const appConfig = useAppConfig();
  const [productos, setProductos] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [familias, setFamilias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroFamilia, setFiltroFamilia] = useState('Todas');
  const [filtroEstado, setFiltroEstado] = useState('Todos'); // 'Todos' | 'Activos' | 'Discontinuados'
  const [viewMode, setViewMode] = useState(appConfig?.defaultViewMode || 'grid'); // 'grid' | 'table'

  // Modal Productos
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'bom'
  const [newBomMat, setNewBomMat] = useState('');
  const [newBomFactor, setNewBomFactor] = useState(1);

  // Modal Familias CRUD
  const [familiasModalOpen, setFamiliasModalOpen] = useState(false);
  const [famMode, setFamMode] = useState('list'); // 'list' | 'create' | 'edit'
  const [famForm, setFamForm] = useState({ id: null, nombre: '', descripcion: '', color: '#3b82f6' });
  const [savingFam, setSavingFam] = useState(false);
  const [deletingFamId, setDeletingFamId] = useState(null);

  const [form, setForm] = useState({
    codigo: '',
    descripcion: '',
    cliente: '',
    familia: 'Baterías 48V',
    tiempoCiclo: 120,
    objetivoHora: 30,
    peso: 25.0,
    activo: true,
    notas: '',
    bomPendiente: false,
    bom: []
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const loadData = async () => {
    setLoading(true);
    const [resP, resM, resF] = await Promise.all([fetchProductos(), fetchMateriasPrimas(), fetchFamilias()]);
    if (resP?.data) setProductos(resP.data);
    if (resM?.data) setMaterias(resM.data);
    if (resF?.data) setFamilias(resF.data);
    setLoading(false);
  };

    useRealtimeSync('productos', () => window.dispatchEvent(new CustomEvent('productos_updated')));

  useEffect(() => {
    loadData();
    const handleUp = () => loadData();
    window.addEventListener('bom_updated', handleUp);
    window.addEventListener('productos_updated', handleUp);
    window.addEventListener('familias_updated', handleUp);
    return () => {
      window.removeEventListener('bom_updated', handleUp);
      window.removeEventListener('productos_updated', handleUp);
      window.removeEventListener('familias_updated', handleUp);
    };
  }, []);

  const handleSaveFamilia = async (e) => {
    e.preventDefault();
    if (!famForm.nombre.trim()) return;
    setSavingFam(true);
    if (famMode === 'create') {
      await insertFamilia({
        nombre: famForm.nombre.trim(),
        descripcion: famForm.descripcion.trim(),
        color: famForm.color || '#3b82f6'
      });
      setToast(`Familia "${famForm.nombre}" creada con éxito.`);
    } else if (famMode === 'edit') {
      await updateFamilia(famForm.id, {
        nombre: famForm.nombre.trim(),
        descripcion: famForm.descripcion.trim(),
        color: famForm.color || '#3b82f6'
      });
      setToast(`Familia "${famForm.nombre}" actualizada.`);
    }
    setSavingFam(false);
    setFamMode('list');
    loadData();
    setTimeout(() => setToast(''), 3000);
  };

  const handleDeleteFamilia = async (id, nombre) => {
    const prodsAsociados = productos.filter(p => p.familia === nombre).length;
    let msg = `¿Seguro que deseas eliminar la familia "${nombre}"?`;
    if (prodsAsociados > 0) {
      msg += `\nHay ${prodsAsociados} producto(s) vinculados que pasarán a "General".`;
    }
    if (!window.confirm(msg)) return;
    setDeletingFamId(id);
    await deleteFamilia(id);
    setDeletingFamId(null);
    setToast(`Familia "${nombre}" eliminada.`);
    loadData();
    setTimeout(() => setToast(''), 3000);
  };

  // Familias únicas para los filtros y selectores de vinculación
  const familiasLista = Array.from(new Set([
    ...familias.map(f => f.nombre),
    ...productos.map(p => p.familia || 'General')
  ])).filter(Boolean);
  const familiasUnicas = ['Todas', ...familiasLista];

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
      notas: 'Utillajes estándar e inspección de calidad final obligatoria.',
      bomPendiente: true,
      bom: [],
      imagen: ''
    });
    setActiveTab('general');
    setModalMode('create');
    setModalOpen(true);
  };

  const openEditModal = (producto) => {
    setForm({
      ...producto,
      bom: Array.isArray(producto.bom) ? [...producto.bom] : []
    });
    setActiveTab('general');
    setModalMode('edit');
    setModalOpen(true);
  };

  const handleAddBomItem = () => {
    if (!newBomMat) return;
    const mat = materias.find(m => m.codigo === newBomMat);
    if (!mat) return;
    const currentBom = Array.isArray(form.bom) ? [...form.bom] : [];
    if (currentBom.some(item => item.codigo === mat.codigo)) {
      showToast(`El componente ${mat.codigo} ya está en el BOM.`);
      return;
    }
    currentBom.push({
      codigo: mat.codigo,
      descripcion: mat.descripcion || mat.codigo,
      unidad: mat.unidad || 'ud',
      factor: Math.max(0.001, Number(newBomFactor) || 1),
      imagen: mat.imagen || ''
    });
    setForm({ ...form, bom: currentBom, bomPendiente: false });
    setNewBomMat('');
    setNewBomFactor(1);
  };

  const handleRemoveBomItem = (codigo) => {
    const currentBom = Array.isArray(form.bom) ? [...form.bom] : [];
    const nextBom = currentBom.filter(item => item.codigo !== codigo);
    setForm({ ...form, bom: nextBom, bomPendiente: nextBom.length === 0 });
  };

  const handleUpdateBomFactor = (codigo, factor) => {
    const currentBom = Array.isArray(form.bom) ? [...form.bom] : [];
    setForm({
      ...form,
      bom: currentBom.map(item => item.codigo === codigo ? { ...item, factor: Math.max(0.001, Number(factor) || 0) } : item)
    });
  };

  const handleUploadBomItemImage = async (codigo, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target.result;
      const currentBom = Array.isArray(form.bom) ? [...form.bom] : [];
      const nextBom = currentBom.map(item => item.codigo === codigo ? { ...item, imagen: dataUrl } : item);
      setForm(prev => ({ ...prev, bom: nextBom }));
      
      const mat = materias.find(m => m.codigo === codigo);
      if (mat && mat.id) {
        await updateMaterial(mat.id, { ...mat, imagen: dataUrl });
        window.dispatchEvent(new CustomEvent('materiales_updated'));
      }
      showToast(`Archivo subido y asignado al componente BOM [${codigo}]`);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadProductImage = async (id, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target.result;
      const target = id ? productos.find(p => p.id === id) : null;
      if (target) {
        const next = { ...target, imagen: dataUrl };
        await updateProducto(id, next);
        setProductos(prev => prev.map(p => p.id === id ? next : p));
        showToast(`Imagen principal subida para producto [${target.codigo}]`);
      } else {
        setForm(prev => ({ ...prev, imagen: dataUrl }));
        showToast('Imagen cargada al formulario del producto');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const currentBom = Array.isArray(form.bom) ? form.bom : [];
    let isPendiente = form.bomPendiente || false;

    if (currentBom.length === 0 && !isPendiente) {
      const ok = window.confirm('Este producto no tiene componentes en su lista de materiales (BOM). Se guardará marcado como "⚠️ BOM Pendiente de definir". ¿Deseas continuar?');
      if (!ok) return;
      isPendiente = true;
    } else if (currentBom.length > 0) {
      isPendiente = false;
    }

    setSaving(true);
    const dataToSave = {
      ...form,
      tiempoCiclo: Number(form.tiempoCiclo),
      objetivoHora: Number(form.objetivoHora),
      peso: Number(form.peso),
      bom: currentBom,
      bomPendiente: isPendiente
    };

    if (modalMode === 'create') {
      const { data } = await insertProducto(dataToSave);
      if (data) {
        setProductos(prev => [...prev, data]);
        showToast('Producto y BOM añadidos al catálogo');
      }
    } else {
      const { data } = await updateProducto(form.id, dataToSave);
      if (data) {
        setProductos(prev => prev.map(p => p.id === form.id ? data : p));
        showToast('Ficha de producto y BOM actualizados con éxito');
      }
    }
    setSaving(false);
    setModalOpen(false);

    window.dispatchEvent(new CustomEvent('bom_updated'));
    window.dispatchEvent(new CustomEvent('materiales_updated'));
    window.dispatchEvent(new CustomEvent('planificacion_updated'));
  };

  const handleDelete = async (id, codigo) => {
    if (window.confirm(`¿Estás seguro de eliminar el producto [${codigo}]? Esto podría afectar a datos históricos o cálculos de BOM.`)) {
      await deleteProducto(id);
      setProductos(prev => prev.filter(p => p.id !== id));
      showToast(`Producto ${codigo} eliminado del catálogo`);
      window.dispatchEvent(new CustomEvent('bom_updated'));
      window.dispatchEvent(new CustomEvent('materiales_updated'));
      window.dispatchEvent(new CustomEvent('planificacion_updated'));
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

        <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700"
            title="Recargar catálogo"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => { setFamMode('list'); setFamiliasModalOpen(true); }}
            className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-white font-black text-sm rounded-2xl shadow flex items-center gap-2 transition-all active:scale-95 border border-slate-700 hover:border-blue-500/50"
            title="Administrar Familias / Categorías de Productos"
          >
            <Tag className="w-4 h-4 text-blue-400" />
            <span>Gestionar Familias</span>
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
          <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 shrink-0 self-center">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
              title="Vista en Fichas"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
              title="Vista en Listado / Tabla"
            >
              <List className="w-4 h-4" />
            </button>
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
      ) : viewMode === 'grid' ? (
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
                    <div className="relative inline-flex items-center bg-slate-800 hover:bg-slate-700 border border-slate-700/80 rounded-lg px-2 py-1 transition-colors group/famselect shadow-sm" title="Haz clic para vincular/cambiar la familia de este producto">
                      <Tag className="w-3 h-3 text-blue-400 mr-1 shrink-0" />
                      <select
                        value={p.familia || 'General'}
                        onChange={async e => {
                          const val = e.target.value;
                          await updateProducto(p.id, { ...p, familia: val });
                          loadData();
                          setToast(`Producto [${p.codigo}] vinculado a la familia "${val}".`);
                          setTimeout(() => setToast(''), 3000);
                        }}
                        className="bg-transparent text-[11px] font-bold text-slate-300 hover:text-white focus:outline-none cursor-pointer pr-3 appearance-none max-w-[130px] truncate"
                      >
                        {familiasLista.map(f => (
                          <option key={f} value={f} className="bg-slate-900 text-white font-bold">{f}</option>
                        ))}
                      </select>
                      <span className="pointer-events-none absolute right-1.5 text-[8px] text-slate-400">▼</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Foto Producto + Subir */}
                    <div className="relative group/prodimg">
                      {p.imagen ? (
                        <img src={p.imagen} alt={p.codigo} className="w-8 h-8 rounded-lg object-cover border border-slate-700 shadow bg-slate-950" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg border border-dashed border-slate-700 bg-slate-950/60 flex items-center justify-center text-slate-500 text-[8px] font-black">
                          Foto
                        </div>
                      )}
                      <label
                        htmlFor={`prod-upload-${p.id}`}
                        className="absolute -bottom-1 -right-1 p-1 rounded-full bg-blue-600 hover:bg-blue-500 text-white cursor-pointer shadow opacity-0 group-hover/prodimg:opacity-100 transition-all scale-75 group-hover/prodimg:scale-100"
                        title="Subir archivo / cambiar foto producto"
                      >
                        <Edit2 className="w-2.5 h-2.5" />
                        <input
                          id={`prod-upload-${p.id}`}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => handleUploadProductImage(p.id, e)}
                        />
                      </label>
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
                </div>

                {/* Descripción y Cliente */}
                <h3 className="text-base font-black text-white leading-snug mb-1 group-hover:text-blue-300 transition-colors">
                  {p.descripcion}
                </h3>
                <p className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 mb-4">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Cliente / Destino: <strong className="text-slate-200">{p.cliente || 'Estándar'}</strong></span>
                </p>

                {/* Badge BOM */}
                <div className="mb-3 flex items-center gap-2">
                  {(!p.bom || p.bom.length === 0 || p.bomPendiente) ? (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg">
                      <AlertTriangle className="w-3.5 h-3.5" /> ⚠️ BOM Pendiente de definir
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-blue-300 bg-blue-500/10 border border-blue-500/30 px-2.5 py-1 rounded-lg">
                      <Layers3 className="w-3.5 h-3.5 text-blue-400" /> 📦 {p.bom.length} componentes en BOM
                    </span>
                  )}
                </div>

                {/* BOM Visual - Lista de componentes con foto y subida */}
                {p.bom && p.bom.length > 0 && (
                  <div className="mb-4 bg-slate-950/90 rounded-2xl p-3 border border-slate-800/80 shadow-inner">
                    <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-800/60">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Layers3 className="w-3 h-3 text-blue-400" /> Componentes BOM (Identificación Visual)
                      </span>
                      <span className="text-[9px] font-bold text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded">{p.bom.length} ítems</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                      {p.bom.map((b, idx) => {
                        const matImg = b.imagen || materias.find(m => m.codigo === b.codigo)?.imagen;
                        return (
                          <div key={b.codigo || idx} className="flex items-center gap-2.5 bg-slate-900/90 p-2 rounded-xl border border-slate-800/80 hover:border-blue-500/40 transition-all group/item">
                            <div className="relative shrink-0">
                              {matImg ? (
                                <img src={matImg} alt={b.codigo} className="w-9 h-9 rounded-lg object-cover border border-slate-700 bg-slate-950" />
                              ) : (
                                <div className="w-9 h-9 rounded-lg border border-dashed border-slate-700 bg-slate-950/60 flex items-center justify-center text-slate-500 text-[8px] font-black text-center leading-none">
                                  Sin foto
                                </div>
                              )}
                              <label
                                htmlFor={`card-bom-upload-${p.id}-${b.codigo}`}
                                className="absolute -bottom-1 -right-1 p-1 rounded-full bg-blue-600 hover:bg-blue-500 text-white cursor-pointer shadow opacity-0 group-hover/item:opacity-100 transition-all scale-75 group-hover/item:scale-100"
                                title="Subir archivo / cambiar foto del componente"
                              >
                                <Edit2 className="w-2.5 h-2.5" />
                                <input
                                  id={`card-bom-upload-${p.id}-${b.codigo}`}
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={e => {
                                    handleUploadBomItemImage(b.codigo, e);
                                    // También se actualiza la vista en local si es de este producto
                                    const nextBom = p.bom.map(x => x.codigo === b.codigo ? { ...x } : x);
                                  }}
                                />
                              </label>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] font-mono font-bold text-blue-300 truncate">{b.codigo}</p>
                              <p className="text-[10px] text-slate-400 font-semibold truncate">{b.descripcion}</p>
                            </div>
                            <div className="text-right shrink-0 bg-slate-950/60 px-2 py-1 rounded-lg border border-slate-800/60">
                              <span className="text-xs font-mono font-black text-emerald-400">{b.factor}</span>
                              <span className="text-[9px] text-slate-500 block leading-tight">{b.unidad}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

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
      ) : (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/80 text-slate-400 text-xs font-black uppercase border-b border-slate-800 tracking-wider">
                  <th className="py-3.5 px-4">Código / Ref.</th>
                  <th className="py-3.5 px-4">Nombre</th>
                  <th className="py-3.5 px-4">Familia</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4 text-center">Cadencia (uds/h)</th>
                  <th className="py-3.5 px-4 text-center">T. Ciclo</th>
                  <th className="py-3.5 px-4 text-center">BOM / Componentes</th>
                  <th className="py-3.5 px-4 text-right">Coste Est.</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs font-bold text-slate-200">
                {productosFiltrados.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-blue-400 font-black">{p.codigo}</td>
                    <td className="py-3 px-4 font-black text-white">{p.nombre}</td>
                    <td className="py-3 px-4 text-slate-300">{p.familia || 'General'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${
                        p.activo ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {p.activo ? 'Activo' : 'Discontinuado'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-slate-300">{p.objetivoHora || 30}</td>
                    <td className="py-3 px-4 text-center font-mono text-blue-400">{p.tiempoCiclo || 120}s</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">
                        {(p.bom || []).length} items
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-400">
                      {p.costeEstimado ? `${Number(p.costeEstimado).toFixed(2)} €` : '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white transition-all"
                          title="Editar Ficha"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.codigo)}
                          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-500/30 text-slate-400 hover:text-rose-300 transition-all"
                          title="Eliminar producto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
              className="card p-6 md:p-8 max-w-2xl w-full bg-slate-900 border border-slate-700 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <Package className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">
                      {modalMode === 'create' ? 'Nueva Referencia de Producción' : `Editar Producto [${form.codigo}]`}
                    </h3>
                    <p className="text-xs text-slate-400">Configuración general y receta de Bill of Materials (BOM)</p>
                  </div>
                </div>
                <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Pestañas del Modal */}
              <div className="flex gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800 mb-5">
                <button
                  type="button"
                  onClick={() => setActiveTab('general')}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-2 ${
                    activeTab === 'general' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Package className="w-3.5 h-3.5" /> 1. Datos Generales
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('bom')}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-2 ${
                    activeTab === 'bom' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Layers3 className="w-3.5 h-3.5" /> 2. Lista de Materiales (BOM)
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${activeTab === 'bom' ? 'bg-blue-900 text-blue-100 font-bold' : 'bg-slate-800 text-slate-300'}`}>
                    {(form.bom || []).length}
                  </span>
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                {activeTab === 'general' ? (
                  <>
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
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                            Familia / Categoría *
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setFamMode('create');
                              setFamForm({ id: null, nombre: form.familia || '', descripcion: '', color: '#3b82f6' });
                              setFamiliasModalOpen(true);
                            }}
                            className="text-[10px] font-bold text-blue-400 hover:text-blue-300 underline flex items-center gap-1"
                          >
                            + Nueva familia
                          </button>
                        </div>
                        <select
                          required
                          value={form.familia || 'General'}
                          onChange={e => setForm({ ...form, familia: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                        >
                          <option value="">- Seleccionar Familia -</option>
                          {familiasLista.map(f => (
                            <option key={f} value={f} className="bg-slate-900 text-white font-bold">{f}</option>
                          ))}
                        </select>
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

                    {/* Imagen / Foto del Producto */}
                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {form.imagen ? (
                          <img src={form.imagen} alt={form.codigo} className="w-14 h-14 rounded-xl object-cover border border-slate-700 shadow bg-slate-900 shrink-0" />
                        ) : (
                          <div className="w-14 h-14 rounded-xl border border-dashed border-slate-700 bg-slate-900/60 flex items-center justify-center text-slate-500 text-[9px] font-black shrink-0 text-center">
                            Sin foto
                          </div>
                        )}
                        <div>
                          <span className="block text-xs font-bold text-slate-200">Imagen / Foto del Producto</span>
                          <span className="text-[11px] text-slate-400">Sube o modifica la foto principal de esta referencia.</span>
                        </div>
                      </div>
                      <label className="cursor-pointer px-3.5 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white text-xs font-black flex items-center gap-1.5 transition-all border border-blue-500/30 shrink-0">
                        <span>📷 Seleccionar Foto</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = event => {
                              setForm(prev => ({ ...prev, imagen: event.target.result }));
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                      </label>
                    </div>

                    {/* Cliente y Estado */}
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
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                      <h4 className="text-xs font-black uppercase text-blue-400 mb-1 flex items-center gap-1.5">
                        <Layers3 className="w-4 h-4" /> Añadir Componente a la Receta
                      </h4>
                      <p className="text-[11px] text-slate-400 mb-3">
                        Selecciona componentes del catálogo de Materias Primas necesarios para fabricar <strong className="text-white">1 unidad</strong> de {form.codigo || 'este producto'}.
                      </p>

                      <div className="flex flex-col sm:flex-row gap-2.5 items-end">
                        {newBomMat && (
                          <div className="relative shrink-0 flex items-center justify-center bg-slate-900 border border-slate-700 rounded-xl w-10 h-10 overflow-hidden shadow">
                            {materias.find(m => m.codigo === newBomMat)?.imagen ? (
                              <img src={materias.find(m => m.codigo === newBomMat)?.imagen} alt={newBomMat} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[8px] font-black text-slate-500 text-center">Sin foto</span>
                            )}
                          </div>
                        )}
                        <div className="flex-1 w-full">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Componente / Materia Prima</label>
                          <select
                            value={newBomMat}
                            onChange={e => setNewBomMat(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                          >
                            <option value="">-- Seleccionar Materia Prima --</option>
                            {materias.map(m => (
                              <option key={m.codigo} value={m.codigo}>
                                {m.codigo} — {m.descripcion} ({m.unidad}) [Stock: {m.stockActual}]
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="w-full sm:w-36">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Cantidad / Ud</label>
                          <input
                            type="number"
                            step="0.001"
                            min="0.001"
                            value={newBomFactor}
                            onChange={e => setNewBomFactor(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-400 text-center focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleAddBomItem}
                          disabled={!newBomMat}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-black text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 flex-shrink-0 shadow-md shadow-blue-900/40"
                        >
                          <Plus className="w-3.5 h-3.5" /> Añadir
                        </button>
                      </div>
                    </div>

                    {/* Tabla de BOM */}
                    <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/80">
                      <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-300">Lista de Componentes ({ (form.bom || []).length })</span>
                        {(form.bom || []).length === 0 && (
                          <span className="text-[10px] font-black text-amber-400 uppercase bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded">
                            ⚠️ Receta por definir
                          </span>
                        )}
                      </div>

                      {(form.bom || []).length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-xs">
                          <Layers3 className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                          No se han añadido componentes aún. Si guardas el producto sin componentes, se marcará con incidencia de datos BOM.
                        </div>
                      ) : (
                        <div className="overflow-x-auto max-h-[280px] overflow-y-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-900/50 border-b border-slate-800 text-[10px] uppercase text-slate-400 sticky top-0">
                              <tr>
                                <th className="py-2 px-3">Código</th>
                                <th className="py-2 px-3 text-center">Imagen / Foto</th>
                                <th className="py-2 px-3">Descripción</th>
                                <th className="py-2 px-3 text-center">Cantidad por Unidad</th>
                                <th className="py-2 px-3 text-center">Unidad</th>
                                <th className="py-2 px-3 text-right">Acción</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/80 font-medium">
                              {(form.bom || []).map(item => {
                                const matImg = item.imagen || materias.find(m => m.codigo === item.codigo)?.imagen;
                                return (
                                  <tr key={item.codigo} className="hover:bg-slate-900/40">
                                    <td className="py-2.5 px-3 font-mono font-bold text-blue-400">{item.codigo}</td>
                                    <td className="py-2.5 px-3 text-center">
                                      <div className="flex items-center justify-center">
                                        {matImg ? (
                                          <img src={matImg} alt={item.codigo} className="w-10 h-10 rounded-xl object-cover border border-slate-700 shadow bg-slate-950 shrink-0" />
                                        ) : (
                                          <div className="w-10 h-10 rounded-xl border border-dashed border-slate-700 bg-slate-950/60 flex items-center justify-center text-slate-500 text-[8px] font-black shrink-0 text-center">
                                            Sin foto
                                          </div>
                                        )}
                                      </div>
                                    </td>
                                    <td className="py-2.5 px-3 text-slate-200">{item.descripcion}</td>
                                    <td className="py-2.5 px-3 text-center">
                                      <input
                                        type="number"
                                        step="0.001"
                                        min="0.001"
                                        value={item.factor || 1}
                                        onChange={e => handleUpdateBomFactor(item.codigo, e.target.value)}
                                        className="w-24 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono font-bold text-emerald-400 text-center focus:outline-none focus:border-blue-500"
                                      />
                                    </td>
                                    <td className="py-2.5 px-3 text-center text-slate-400 font-mono">{item.unidad}</td>
                                    <td className="py-2.5 px-3 text-right">
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveBomItem(item.codigo)}
                                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                                        title="Eliminar del BOM"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Botones acción modal */}
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

      {/* MODAL GESTIONAR FAMILIAS */}
      <AnimatePresence>
        {familiasModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="card p-6 md:p-8 max-w-3xl w-full bg-slate-900 border border-slate-700 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <Tag className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">
                      {famMode === 'list' && 'Familias y Categorías de Productos'}
                      {famMode === 'create' && 'Añadir Nueva Familia de Productos'}
                      {famMode === 'edit' && `Editar Familia [${famForm.nombre}]`}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {famMode === 'list' && 'Administra, añade, modifica o borra las familias vinculables al catálogo'}
                      {famMode !== 'list' && 'Define los atributos de clasificación e identificación visual para el MES'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFamiliasModalOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {famMode === 'list' ? (
                <div>
                  <div className="flex items-center justify-between mb-4 gap-3">
                    <span className="text-xs font-bold text-slate-400">
                      Total: <strong className="text-white">{familias.length}</strong> familias disponibles
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setFamMode('create');
                        setFamForm({ id: null, nombre: '', descripcion: '', color: '#3b82f6' });
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Añadir Familia</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto border border-slate-800 rounded-2xl bg-slate-950/60 max-h-[450px]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900/90 border-b border-slate-800 text-[10px] uppercase font-black text-slate-400 sticky top-0">
                        <tr>
                          <th className="py-3 px-4">Color</th>
                          <th className="py-3 px-4">Nombre / Familia</th>
                          <th className="py-3 px-4">Descripción</th>
                          <th className="py-3 px-4 text-center">Productos Vinculados</th>
                          <th className="py-3 px-4 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {familias.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="py-12 text-center text-slate-500">
                              No hay familias definidas. Haz clic en "+ Añadir Familia" para crear la primera.
                            </td>
                          </tr>
                        ) : (
                          familias.map((f) => {
                            const numProds = productos.filter(p => p.familia === f.nombre).length;
                            return (
                              <tr key={f.id || f.nombre} className="hover:bg-slate-800/40 transition-colors">
                                <td className="py-3 px-4 w-12">
                                  <span
                                    className="w-6 h-6 rounded-lg block shadow border border-white/20"
                                    style={{ backgroundColor: f.color || '#3b82f6' }}
                                    title={f.color || '#3b82f6'}
                                  />
                                </td>
                                <td className="py-3 px-4 font-black text-white text-sm">
                                  {f.nombre}
                                </td>
                                <td className="py-3 px-4 text-slate-300 font-medium">
                                  {f.descripcion || <span className="text-slate-600 italic">Sin descripción</span>}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black ${
                                    numProds > 0 ? 'bg-blue-500/10 text-blue-300 border border-blue-500/30' : 'bg-slate-800 text-slate-500'
                                  }`}>
                                    {numProds} ref(s)
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setFamMode('edit');
                                      setFamForm({
                                        id: f.id,
                                        nombre: f.nombre || '',
                                        descripcion: f.descripcion || '',
                                        color: f.color || '#3b82f6'
                                      });
                                    }}
                                    className="p-2 rounded-xl bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-300 transition-all font-bold"
                                    title="Editar familia"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={deletingFamId === f.id}
                                    onClick={() => handleDeleteFamilia(f.id, f.nombre)}
                                    className="p-2 rounded-xl bg-slate-800/80 hover:bg-red-600/30 text-slate-400 hover:text-red-300 transition-all"
                                    title="Eliminar familia"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end pt-5 mt-5 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setFamiliasModalOpen(false)}
                      className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all"
                    >
                      Cerrar Panel
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSaveFamilia} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                        Nombre de la Familia *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="ej: Baterías 48V"
                        value={famForm.nombre}
                        onChange={e => setFamForm({ ...famForm, nombre: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-black text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                        Color Identificativo
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={famForm.color}
                          onChange={e => setFamForm({ ...famForm, color: e.target.value })}
                          className="w-12 h-10 rounded-xl bg-slate-950 border border-slate-700 cursor-pointer p-1 shrink-0"
                        />
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b', '#ef4444'].map(c => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setFamForm({ ...famForm, color: c })}
                              className={`w-6 h-6 rounded-lg transition-transform ${famForm.color === c ? 'scale-125 border-2 border-white shadow' : 'hover:scale-110'}`}
                              style={{ backgroundColor: c }}
                              title={c}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Descripción y Alcance
                    </label>
                    <input
                      type="text"
                      placeholder="ej: Sistemas de acumulación LFP de 48 Voltios para tracción e industrial..."
                      value={famForm.descripcion}
                      onChange={e => setFamForm({ ...famForm, descripcion: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-medium text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-5 mt-5 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setFamMode('list')}
                      className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all"
                    >
                      Volver a la lista
                    </button>
                    <button
                      type="submit"
                      disabled={savingFam}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-blue-900/40 transition-all"
                    >
                      <Check className="w-4 h-4" />
                      <span>{savingFam ? 'Guardando...' : famMode === 'create' ? 'Crear Familia' : 'Guardar Cambios'}</span>
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
