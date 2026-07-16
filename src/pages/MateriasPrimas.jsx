import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchMateriasPrimas, fetchProductos, insertMaterial, updateMaterial, deleteMaterial, calcularTodosConsumosComprometidos } from '@/services/dataService';
import { consumoPorDia } from '@/data/mockMaterias';
import { AlertTriangle, CheckCircle2, TrendingDown, Search, Plus, Pencil, Trash2, RefreshCw, Layers3 } from 'lucide-react';
import CrudModal from '@/components/shared/CrudModal';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

const MATERIAL_FIELDS = [
  { key: 'codigo',           label: 'Código',              type: 'text',   required: true, placeholder: 'CAB-6MM-001' },
  { key: 'descripcion',      label: 'Descripción',         type: 'text',   required: true, placeholder: 'Cable 6mm² negro...' },
  { key: 'imagen',           label: 'Imagen / Foto (Subir archivo)', type: 'image_upload' },
  { key: 'unidad',           label: 'Unidad',              type: 'select', required: true,
    options: ['ud', 'rollo', 'caja', 'par', 'kg', 'm'] },
  { key: 'stockActual',      label: 'Stock Actual',        type: 'number', min: 0, default: 0 },
  { key: 'stockMinimo',      label: 'Stock Mínimo',        type: 'number', min: 0, default: 0 },
  { key: 'stockMaximo',      label: 'Stock Máximo',        type: 'number', min: 0, default: 0 },
  { key: 'pedidoPendiente',  label: 'Pedido Pendiente',    type: 'number', min: 0, default: 0 },
  { key: 'fechaEntrega',     label: 'Fecha Entrega Pedido',type: 'text',   placeholder: '01/06/2024' },
  { key: 'criticidad',       label: 'Criticidad',          type: 'select', required: true,
    options: [{ value: 'alta', label: 'Alta' }, { value: 'media', label: 'Media' }, { value: 'baja', label: 'Baja' }] },
  { key: 'proveedor',        label: 'Proveedor',           type: 'text',   placeholder: 'ElectroCable S.L.' },
];

export default function MateriasPrimas() {
  const [materiales, setMateriales] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todos');
  const [busqueda, setBusqueda] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [editItem, setEditItem] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const location = useLocation();

  const loadData = async () => {
    setLoading(true);
    const [resMat, resProd] = await Promise.all([
      fetchMateriasPrimas(),
      fetchProductos()
    ]);
    setMateriales(resMat?.data || []);
    setProductos(resProd?.data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const h = () => loadData();
    window.addEventListener('materiales_updated', h);
    window.addEventListener('bom_updated', h);
    return () => {
      window.removeEventListener('materiales_updated', h);
      window.removeEventListener('bom_updated', h);
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('codigo') || params.get('q') || params.get('buscar');
    if (q) setBusqueda(q);
  }, [location.search]);

  // Consumo comprometido dinamico de todas las órdenes en el sistema
  const mapaConsumo = calcularTodosConsumosComprometidos({ productos });

  const criticos = materiales.filter(m => m.stockActual < m.stockMinimo).length;
  const advertencia = materiales.filter(m => m.stockActual >= m.stockMinimo && m.stockActual < m.stockMinimo * 1.5).length;
  const ok = materiales.filter(m => m.stockActual >= m.stockMinimo * 1.5).length;

  const materialesConDeficit = materiales.filter(m => {
    const comp = mapaConsumo[m.codigo] || Number(m.stockReservado) || 0;
    return (Number(m.stockActual || 0) - comp) < 0;
  });

  const materialFiltrado = materiales.filter(m => {
    const matchFiltro = filtro === 'todos' || m.criticidad === filtro;
    const matchBusqueda = m.descripcion?.toLowerCase().includes(busqueda.toLowerCase()) || m.codigo?.toLowerCase().includes(busqueda.toLowerCase());
    return matchFiltro && matchBusqueda;
  });

  const pctStock = (m) => Math.min(100, Math.round((m.stockActual / Math.max(1, m.stockMaximo)) * 100));
  const getStockColor = (m) => {
    if (m.stockActual < m.stockMinimo) return { bar: 'bg-red-500', text: 'text-red-400' };
    if (m.stockActual < m.stockMinimo * 1.5) return { bar: 'bg-amber-500', text: 'text-amber-400' };
    return { bar: 'bg-emerald-500', text: 'text-emerald-400' };
  };

  const openCreate = () => {
    setEditItem({ criticidad: 'media', stockActual: 0, stockMinimo: 0, stockMaximo: 0, pedidoPendiente: 0, id: Date.now() });
    setModalMode('create');
    setModalOpen(true);
  };
  const openEdit = (m) => { setEditItem(m); setModalMode('edit'); setModalOpen(true); };
  const openDelete = (m) => { setDeleteTarget(m); setConfirmOpen(true); };

  const handleSave = async (data) => {
    setSaving(true);
    const payload = { ...data, id: data.id || Date.now() };
    if (modalMode === 'create') {
      const { data: newItem, error } = await insertMaterial(payload);
      if (!error) setMateriales(prev => [...prev, newItem || payload]);
    } else {
      const { data: updated, error } = await updateMaterial(editItem.id, data);
      if (!error) setMateriales(prev => prev.map(m => m.id === editItem.id ? (updated || { ...m, ...data }) : m));
    }
    setSaving(false);
    setModalOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await deleteMaterial(deleteTarget.id);
    if (!error) setMateriales(prev => prev.filter(m => m.id !== deleteTarget.id));
    setDeleting(false);
    setConfirmOpen(false);
    setDeleteTarget(null);
  };

  // Productos que usan el material editado (BOM Inverso)
  const productosBOMInverso = editItem?.codigo
    ? productos.filter(p => (p.bom || []).some(item => item.codigo === editItem.codigo))
    : [];

  return (
    <div className="space-y-6 w-full max-w-full">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">Materias Primas</h2>
          <p className="text-slate-500 text-sm">Stock · Consumido en BOM · Pedidos pendientes</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadData} disabled={loading}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={openCreate}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black transition-all shadow-lg shadow-blue-900/30">
            <Plus className="w-3.5 h-3.5" /> Nuevo Material
          </button>
        </div>
      </motion.div>

      {/* Alerta Cruzada: Déficit en Disponible Real */}
      {materialesConDeficit.length > 0 && (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="p-4 rounded-2xl bg-gradient-to-r from-red-950/80 via-slate-900 to-red-950/80 border border-red-500/50 shadow-lg shadow-red-950/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 flex-shrink-0 animate-pulse">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-black text-red-300 flex items-center gap-2">
                Alerta Cruzada BOM: {materialesConDeficit.length} componentes con déficit de Disponible Real
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                El consumo comprometido en órdenes de fabricación supera el stock en planta: <strong className="text-red-400 font-mono font-bold">{materialesConDeficit.map(m => m.codigo).join(', ')}</strong>
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0" />
          <div><p className="text-2xl font-black text-red-400">{criticos}</p><p className="text-[10px] text-slate-500 font-bold uppercase">Ruptura de stock</p></div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 flex items-center gap-3">
          <TrendingDown className="w-6 h-6 text-amber-400 flex-shrink-0" />
          <div><p className="text-2xl font-black text-amber-400">{advertencia}</p><p className="text-[10px] text-slate-500 font-bold uppercase">Stock bajo</p></div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
          <div><p className="text-2xl font-black text-emerald-400">{ok}</p><p className="text-[10px] text-slate-500 font-bold uppercase">Stock OK</p></div>
        </motion.div>
      </div>

      {/* Tabla de materiales 100% de ancho */}
      <div className="card overflow-hidden w-full shadow-2xl border border-slate-800">
        {/* Filtros */}
        <div className="px-5 py-4 border-b border-slate-800 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between bg-slate-950/60">
          <div className="flex gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl">
            {['todos','alta','media','baja'].map(f => (
              <button key={f} onClick={() => setFiltro(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${filtro === f ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}>
                {f === 'todos' ? 'Todos' : f}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar por código..."
              className="bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 w-56" />
          </div>
        </div>
        <div className="overflow-x-auto no-scrollbar relative">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400">
                {['Código', 'Imagen', 'Descripción', 'Stock Actual', 'Comprometido / Disp. Real', 'Compromiso (%)', 'Mín/Máx', 'Criticidad', 'Proveedor', ''].map(h => (
                  <th key={h} className={`table-header text-left py-3 px-4 ${
                    h === 'Código' ? 'sticky left-0 z-20 bg-slate-900/95 backdrop-blur-md whitespace-nowrap min-w-[140px] w-[140px] shrink-0 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.6)] border-r border-slate-800/80' : 
                    h === 'Imagen' ? 'w-[65px] text-center' : ''
                  }`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {materialFiltrado.map(m => {
                const clr = getStockColor(m);
                const pct = pctStock(m);
                const isHighlighted = busqueda && m.codigo?.toLowerCase() === busqueda?.toLowerCase();
                
                const comp = mapaConsumo[m.codigo] || Number(m.stockReservado) || 0;
                const dispReal = Number(m.stockActual || 0) - comp;
                const pctComp = Math.round((comp / Math.max(1, Number(m.stockActual || 0))) * 100);

                return (
                  <tr key={m.id} className={`hover:bg-slate-800/40 transition-colors group ${isHighlighted ? 'bg-blue-500/15 border-l-4 border-blue-500' : ''}`}>
                    <td className="table-cell font-mono text-xs text-blue-400 font-bold whitespace-nowrap min-w-[140px] w-[140px] shrink-0 sticky left-0 z-10 bg-slate-950 group-hover:bg-slate-900 transition-colors shadow-[2px_0_6px_-2px_rgba(0,0,0,0.6)] border-r border-slate-800/80 py-3 px-4">
                      {m.codigo}
                    </td>
                    <td className="table-cell text-center py-3 px-4">
                      <div className="relative inline-block group/img">
                        {m.imagen ? (
                          <img src={m.imagen} alt={m.codigo} className="w-10 h-10 rounded-xl object-cover border border-slate-700 shadow bg-slate-900 mx-auto" />
                        ) : (
                          <div className="w-10 h-10 rounded-xl border border-dashed border-slate-700 bg-slate-800/40 flex items-center justify-center text-slate-500 text-[9px] font-semibold mx-auto">
                            Sin foto
                          </div>
                        )}
                        <label
                          htmlFor={`mat-upload-${m.id}`}
                          className="absolute -bottom-1 -right-1 p-1 rounded-full bg-blue-600 hover:bg-blue-500 text-white cursor-pointer shadow-md opacity-0 group-hover/img:opacity-100 transition-all scale-75 group-hover/img:scale-100"
                          title="Subir / cambiar foto"
                        >
                          <Pencil className="w-2.5 h-2.5" />
                          <input
                            id={`mat-upload-${m.id}`}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async e => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = async event => {
                                const dataUrl = event.target.result;
                                await updateMaterial(m.id, { ...m, imagen: dataUrl });
                                loadData();
                                window.dispatchEvent(new CustomEvent('materiales_updated'));
                                window.dispatchEvent(new CustomEvent('bom_updated'));
                              };
                              reader.readAsDataURL(file);
                            }}
                          />
                        </label>
                      </div>
                    </td>
                    <td className="table-cell text-slate-300 text-xs max-w-[200px] py-3 px-4">
                      <p className="truncate font-semibold text-white">{m.descripcion}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{m.unidad}</p>
                    </td>
                    <td className="table-cell py-3 px-4">
                      <div className="flex items-baseline gap-2">
                        <p className={`text-lg font-black ${clr.text}`}>{m.stockActual}</p>
                      </div>
                      <div className="w-24 h-1.5 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                        <div className={`h-full rounded-full ${clr.bar}`} style={{ width: `${pct}%` }} />
                      </div>
                    </td>
                    <td className="table-cell py-3 px-4">
                      <div className="space-y-1.5">
                        <div className="text-xs font-mono text-slate-400">
                          Comprometido: <strong className="text-amber-400">{comp}</strong> {m.unidad}
                        </div>
                        <div>
                          {dispReal < 0 ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-red-400 bg-red-500/20 border border-red-500/40 px-2 py-0.5 rounded-md animate-pulse">
                              🔴 Disp: {dispReal} (Falta)
                            </span>
                          ) : dispReal < (m.stockMinimo || 0) ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-md">
                              🟡 Disp: {dispReal} (Bajo)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                              🟢 Disp: {dispReal} (OK)
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="table-cell py-3 px-4">
                      <div className="flex flex-col items-start gap-1">
                        {pctComp >= 100 ? (
                          <span className="inline-flex px-2 py-0.5 rounded-lg text-[10px] font-black uppercase bg-red-500/20 text-red-400 border border-red-500/40">
                            🔴 {pctComp}% Crítico
                          </span>
                        ) : pctComp >= 75 ? (
                          <span className="inline-flex px-2 py-0.5 rounded-lg text-[10px] font-black uppercase bg-amber-500/20 text-amber-400 border border-amber-500/40">
                            🟡 {pctComp}% Elevado
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 rounded-lg text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                            🟢 {pctComp}% Normal
                          </span>
                        )}
                        <span className="text-[10px] text-slate-500 font-bold">del stock reservado</span>
                      </div>
                    </td>
                    <td className="table-cell text-xs text-slate-400 font-mono py-3 px-4">{m.stockMinimo} / {m.stockMaximo}</td>
                    <td className="table-cell py-3 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${m.criticidad === 'alta' ? 'badge-danger' : m.criticidad === 'media' ? 'badge-warn' : 'badge-neutral'}`}>
                        {m.criticidad}
                      </span>
                    </td>
                    <td className="table-cell text-xs text-slate-500 max-w-[130px] py-3 px-4">
                      <span className="truncate block font-semibold text-slate-300">{m.proveedor}</span>
                      {m.pedidoPendiente > 0 && (
                        <span className="text-[10px] text-blue-400 font-bold block mt-0.5">Pedido: {m.pedidoPendiente} uds</span>
                      )}
                    </td>
                    <td className="table-cell py-3 px-4">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => openEdit(m)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 transition-all" title="Editar">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => openDelete(m)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all" title="Eliminar">
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

      {/* Consumo Diario (Esta Semana) debajo a ancho completo */}
      <div className="card p-5 mt-6 w-full bg-slate-950 border border-slate-800 shadow-xl">
        <h3 className="section-title text-white font-black mb-4">Consumo Diario (Esta Semana)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Cables (rollos)', key: 'cables', color: '#3b82f6' },
            { label: 'Celdas LFP (ud)', key: 'celdas', color: '#10b981' },
            { label: 'BMS (ud)',         key: 'bms',    color: '#8b5cf6' },
          ].map(({ label, key, color }) => (
            <div key={key} className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80">
              <p className="text-xs font-black text-slate-300 uppercase tracking-wide mb-2 flex items-center justify-between">
                <span>{label}</span>
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
              </p>
              <ResponsiveContainer width="100%" height={90}>
                <BarChart data={consumoPorDia} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
                  <XAxis dataKey="dia" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 11, color: '#f8fafc' }} />
                  <Bar dataKey={key} fill={color} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      </div>

      <CrudModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave}
        title={modalMode === 'create' ? 'Nuevo Material' : `Editar ${editItem.codigo}`}
        fields={MATERIAL_FIELDS} initialData={editItem} saving={saving}>
        {editItem?.codigo && (
          <div className="space-y-2 mt-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <h4 className="text-xs font-black uppercase text-blue-400 flex items-center gap-1.5">
              <Layers3 className="w-4 h-4" /> Productos que lo utilizan (BOM Inverso)
            </h4>
            {productosBOMInverso.length === 0 ? (
              <p className="text-xs text-slate-500 italic">
                Ningún producto tiene este componente en su receta de Bill of Materials (BOM) actualmente.
              </p>
            ) : (
              <div className="overflow-x-auto max-h-36 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-[10px] uppercase text-slate-400">
                    <tr>
                      <th className="py-1.5 px-2">Producto</th>
                      <th className="py-1.5 px-2">Descripción</th>
                      <th className="py-1.5 px-2 text-center">Cant. / Ud</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {productosBOMInverso.map(p => {
                      const itemBom = (p.bom || []).find(x => x.codigo === editItem.codigo);
                      return (
                        <tr key={p.codigo} className="hover:bg-slate-900/60">
                          <td className="py-1.5 px-2 font-mono font-bold text-blue-300 whitespace-nowrap min-w-[120px]">{p.codigo}</td>
                          <td className="py-1.5 px-2 text-slate-300 truncate max-w-[160px]">{p.descripcion}</td>
                          <td className="py-1.5 px-2 text-center font-mono font-bold text-emerald-400">
                            {itemBom?.factor || 1} {editItem.unidad}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </CrudModal>

      <ConfirmDialog isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete}
        title="Eliminar Material" message={`Se eliminará "${deleteTarget?.descripcion}" (${deleteTarget?.codigo}). ¿Estás seguro?`} deleting={deleting} />
    </div>
  );
}
