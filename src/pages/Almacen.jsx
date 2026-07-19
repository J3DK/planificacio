import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Warehouse, ArrowDownToLine, MapPin, Scale, Search, Plus, ListTree, RefreshCw, Pencil, Trash2, ShieldAlert,
  ArrowLeftRight, FileWarning, Eye, AlertTriangle, ScanBarcode, ArrowRight, CheckCircle2, Layers3
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { 
  fetchMateriasPrimas, fetchProductos, fetchUbicaciones, fetchEntradasMercancia, 
  updateUbicacion, deleteUbicacion, insertEntradaMercancia, updateEntradaMercancia,
  registrarMovimientoStock, calcularCosteEscandallo, updateMaterial, updateProducto 
} from '@/services/dataService';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';

import CrudModal from '@/components/shared/CrudModal';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import LectorCodigoBarras from '@/components/shared/LectorCodigoBarras';

export default function Almacen() {
  const { perfil } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('entradas');
  const [loading, setLoading] = useState(true);
  const [materiales, setMateriales] = useState([]);
  const [productos, setProductos] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [entradas, setEntradas] = useState([]);

  // Carga de datos
  const loadData = async () => {
    setLoading(true);
    const [resMat, resProd, resUbi, resEnt] = await Promise.all([
      fetchMateriasPrimas(),
      fetchProductos(),
      fetchUbicaciones(),
      fetchEntradasMercancia()
    ]);
    setMateriales(resMat?.data || []);
    setProductos(resProd?.data || []);
    setUbicaciones(resUbi?.data || []);
    setEntradas(resEnt?.data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const h = () => loadData();
    window.addEventListener('materiales_updated', h);
    window.addEventListener('ubicaciones_updated', h);
    window.addEventListener('entradas_updated', h);
    return () => {
      window.removeEventListener('materiales_updated', h);
      window.removeEventListener('ubicaciones_updated', h);
      window.removeEventListener('entradas_updated', h);
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab) setActiveTab(tab);
  }, [location]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    navigate(`/almacen?tab=${tabId}`, { replace: true });
  };

  const TABS = [
    { id: 'entradas', label: 'Entrada Mercancía', icon: ArrowDownToLine },
    { id: 'ubicaciones', label: 'Ubicaciones', icon: MapPin },
    { id: 'regularizacion', label: 'Regularización', icon: Scale },
    { id: 'escandallos', label: 'Escandallos (BOM)', icon: ListTree },
    { id: 'stock', label: 'Visor de Stock', icon: Eye },
    { id: 'correccion', label: 'Corregir Albarán', icon: FileWarning },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
            <Warehouse className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Gestión de Almacén</h1>
            <p className="text-sm text-slate-400 font-medium">Control de entradas, ubicaciones y valoración de stock</p>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-2 p-1.5 bg-slate-900 rounded-2xl border border-slate-800 overflow-x-auto no-scrollbar">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* CONTENIDO TABS */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'entradas' && <TabEntradas materiales={materiales} ubicaciones={ubicaciones} entradas={entradas} perfil={perfil} />}
          {activeTab === 'ubicaciones' && <TabUbicaciones ubicaciones={ubicaciones} materiales={materiales} />}
          {activeTab === 'regularizacion' && <TabRegularizacion materiales={materiales} perfil={perfil} />}
          {activeTab === 'escandallos' && <TabEscandallos productos={productos} materiales={materiales} />}
          {activeTab === 'stock' && <TabStock materiales={materiales} ubicaciones={ubicaciones} />}
          {activeTab === 'correccion' && <TabCorreccion entradas={entradas} materiales={materiales} perfil={perfil} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// TAB 1: ENTRADAS DE MERCANCÍA
// ============================================================================
function TabEntradas({ materiales, ubicaciones, entradas, perfil }) {
  const [form, setForm] = useState({ numeroAlbaran: '', proveedor: '', observaciones: '' });
  const [lineas, setLineas] = useState([]);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Selector manual
  const [matSel, setMatSel] = useState('');
  const [cantSel, setCantSel] = useState(1);
  const [loteSel, setLoteSel] = useState('');
  const [ubiSel, setUbiSel] = useState('');

  const handleScan = (code) => {
    const mat = materiales.find(m => m.codigoBarras === code || m.codigo === code);
    if (mat) {
      addLine(mat.id);
    } else {
      alert('Código no encontrado en el catálogo de materiales.');
    }
  };

  const addLine = (matId) => {
    if (!matId) return;
    const mat = materiales.find(m => m.id === matId);
    if (!mat) return;
    
    // Asignamos ubicación predeterminada del material o la primera disponible
    const defUbi = mat.ubicacionId || ubicaciones[0]?.id || '';

    setLineas([...lineas, {
      idTemp: Date.now() + Math.random(),
      materialId: mat.id,
      codigo: mat.codigo,
      descripcion: mat.descripcion,
      unidad: mat.unidad,
      cantidad: cantSel || 1,
      lote: loteSel,
      ubicacionId: ubiSel || defUbi
    }]);
    setMatSel('');
    setCantSel(1);
    setLoteSel('');
    setUbiSel('');
    setScannerOpen(false);
  };

  const removeLine = (idTemp) => {
    setLineas(lineas.filter(l => l.idTemp !== idTemp));
  };

  const updateLine = (idTemp, field, value) => {
    setLineas(lineas.map(l => l.idTemp === idTemp ? { ...l, [field]: value } : l));
  };

  const handleConfirmar = async () => {
    if (!form.numeroAlbaran) return alert('El Nº de Albarán es obligatorio');
    if (lineas.length === 0) return alert('Debes añadir al menos una línea');
    
    setSaving(true);
    try {
      const nuevaEntrada = {
        numeroAlbaran: form.numeroAlbaran,
        proveedor: form.proveedor,
        observaciones: form.observaciones,
        fecha: new Date().toISOString(),
        estado: 'confirmada',
        lineas: lineas.map(l => ({
          materialId: l.materialId,
          codigo: l.codigo,
          cantidad: Number(l.cantidad),
          lote: l.lote,
          ubicacionId: l.ubicacionId
        }))
      };

      const { data: entGuardada } = await insertEntradaMercancia(nuevaEntrada);

      // Registrar movimientos y actualizar materiales
      for (const linea of nuevaEntrada.lineas) {
        await registrarMovimientoStock(linea.materialId, {
          tipo: 'entrada',
          cantidad: linea.cantidad,
          motivo: `Entrada Albarán ${form.numeroAlbaran}`,
          origen: 'entrada_mercancia',
          usuario: perfil?.nombre || 'Usuario',
          entradaMercanciaId: entGuardada.id
        });

        // Si la línea cambia de ubicación o llega, podemos forzar actualización
        const mat = materiales.find(m => m.id === linea.materialId);
        if (mat) {
          // Si tenía un pedido pendiente, lo restamos (simple)
          let nuevoPedido = Number(mat.pedidoPendiente || 0) - linea.cantidad;
          if (nuevoPedido < 0) nuevoPedido = 0;
          await updateMaterial(mat.id, { 
            pedidoPendiente: nuevoPedido,
            ubicacionId: linea.ubicacionId // Actualizamos ubicación por si cambió
          });
        }
      }

      setForm({ numeroAlbaran: '', proveedor: '', observaciones: '' });
      setLineas([]);
      alert('Albarán registrado con éxito');
    } catch(e) {
      console.error(e);
      alert('Error guardando la entrada');
    }
    setSaving(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
      {/* LATERAL: DATOS ALBARÁN Y AÑADIR MANUAL */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Tarjeta Datos Albarán */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full -z-10 group-hover:bg-blue-500/10 transition-colors"></div>
          <h2 className="text-sm font-black text-white mb-4 flex items-center gap-2 uppercase tracking-wide">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            Datos del Albarán
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-1.5 uppercase tracking-wider">Nº Albarán Proveedor *</label>
              <input type="text" value={form.numeroAlbaran} onChange={e => setForm({...form, numeroAlbaran: e.target.value})} className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-600 font-medium" placeholder="Ej. ALB-2026-001" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-1.5 uppercase tracking-wider">Proveedor</label>
              <input type="text" value={form.proveedor} onChange={e => setForm({...form, proveedor: e.target.value})} className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-600" placeholder="Nombre de la empresa" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-1.5 uppercase tracking-wider">Observaciones</label>
              <textarea value={form.observaciones} onChange={e => setForm({...form, observaciones: e.target.value})} className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-600 min-h-[80px] resize-none" placeholder="Anotaciones adicionales..." />
            </div>
          </div>
        </div>

        {/* Tarjeta Añadir Línea Manual / Escáner */}
        <div className="bg-gradient-to-br from-indigo-900/20 to-slate-900/60 border border-indigo-500/20 rounded-2xl p-5 shadow-lg">
          <h2 className="text-sm font-black text-white mb-4 flex items-center gap-2 uppercase tracking-wide">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            Añadir Artículo
          </h2>
          
          <button 
            onClick={() => setScannerOpen(true)} 
            className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black transition-all shadow-lg shadow-indigo-900/50 mb-6 group active:scale-95"
          >
            <ScanBarcode className="w-5 h-5 group-hover:scale-110 transition-transform" /> 
            <span>Abrir Lector Inteligente</span>
          </button>

          <div className="relative py-4 mb-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
            <div className="relative flex justify-center"><span className="bg-slate-950 px-3 text-[10px] text-slate-500 uppercase font-black tracking-widest rounded-full">Entrada Manual</span></div>
          </div>

          <div className="space-y-4">
            <div>
              <select value={matSel} onChange={e => setMatSel(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all appearance-none">
                <option value="" className="text-slate-500">Seleccionar material del catálogo...</option>
                {materiales.map(m => (
                  <option key={m.id} value={m.id}>{m.codigo} - {m.descripcion}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 ml-1">Cantidad</label>
                <input type="number" min="0.01" step="0.01" value={cantSel} onChange={e => setCantSel(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-center font-mono" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 ml-1">Lote (Opcional)</label>
                <input type="text" value={loteSel} onChange={e => setLoteSel(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-center font-mono uppercase" placeholder="LOTE-XYZ" />
              </div>
            </div>
            <button 
              onClick={() => addLine(matSel)} 
              disabled={!matSel} 
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-700 bg-slate-800 text-white font-bold hover:bg-slate-700 hover:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-2"
            >
              Añadir Línea Manualmente
            </button>
          </div>
        </div>
      </div>

      {/* LINEAS */}
      <div className="lg:col-span-8 bg-slate-900/40 border border-slate-800 rounded-2xl flex flex-col min-h-[600px] overflow-hidden shadow-2xl">
        <div className="p-5 flex justify-between items-center border-b border-slate-800 bg-slate-900/60 backdrop-blur-md">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            Líneas del Albarán
            {form.numeroAlbaran && <span className="text-slate-500 font-medium ml-2">({form.numeroAlbaran})</span>}
          </h2>
          <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full text-xs font-black">
            {lineas.length} {lineas.length === 1 ? 'LÍNEA' : 'LÍNEAS'}
          </span>
        </div>

        <div className="flex-1 overflow-auto bg-slate-950/30">
          {lineas.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 p-12">
              <div className="w-24 h-24 rounded-full bg-slate-900 flex items-center justify-center mb-6 shadow-inner border border-slate-800">
                <ScanBarcode className="w-10 h-10 text-slate-700" />
              </div>
              <h3 className="text-lg font-black text-white mb-2">No hay líneas añadidas</h3>
              <p className="text-sm text-center max-w-sm">Escanea un código de barras con el lector inteligente o añade artículos manualmente desde el panel izquierdo.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-900/90 backdrop-blur-sm text-[10px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-800">
                  <th className="p-4 pl-6">Material</th>
                  <th className="p-4 w-32">Cantidad</th>
                  <th className="p-4 w-40">Lote</th>
                  <th className="p-4 w-48">Ubicación Destino</th>
                  <th className="p-4 w-16 text-right pr-6"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {lineas.map((l, i) => (
                  <tr key={l.idTemp} className="group hover:bg-slate-800/40 focus-within:bg-slate-800/40 transition-colors animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                          <Layers3 className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-white">{l.codigo}</p>
                          <p className="text-[11px] text-slate-400 truncate max-w-[200px] xl:max-w-[300px] font-medium">{l.descripcion}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="relative flex items-center">
                        <input type="number" min="0" step="0.01" value={l.cantidad} onChange={e => updateLine(l.idTemp, 'cantidad', e.target.value)} className="w-full bg-slate-950/50 border border-slate-700 rounded-lg pl-3 pr-8 py-2 text-white text-sm font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all hover:bg-slate-900" />
                        <span className="absolute right-3 text-[10px] font-bold text-slate-500 pointer-events-none">{l.unidad}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <input type="text" value={l.lote} onChange={e => updateLine(l.idTemp, 'lote', e.target.value)} className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all hover:bg-slate-900 uppercase" placeholder="---" />
                    </td>
                    <td className="p-4">
                      <select value={l.ubicacionId} onChange={e => updateLine(l.idTemp, 'ubicacionId', e.target.value)} className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all hover:bg-slate-900 appearance-none">
                        <option value="">(Sin asignar)</option>
                        {ubicaciones.map(u => (
                          <option key={u.id} value={u.id}>{u.codigo}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <button onClick={() => removeLine(l.idTemp)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="p-5 border-t border-slate-800 bg-slate-900/60 backdrop-blur-md flex justify-between items-center">
          <div className="text-xs text-slate-500 font-medium">
            {lineas.length > 0 && <span>Revisa que las ubicaciones de destino sean correctas.</span>}
          </div>
          <button 
            onClick={handleConfirmar} 
            disabled={saving || lineas.length === 0 || !form.numeroAlbaran} 
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-xl font-black transition-all shadow-lg shadow-emerald-900/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none active:scale-95"
          >
            {saving ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> Procesando...</>
            ) : (
              <><CheckCircle2 className="w-5 h-5" /> Confirmar Albarán</>
            )}
          </button>
        </div>
      </div>

      {scannerOpen && (
        <LectorCodigoBarras 
          onScan={handleScan}
          onClose={() => setScannerOpen(false)}
        />
      )}
    </div>
  );
}

// ============================================================================
// TAB 2: GESTIÓN DE UBICACIONES
// ============================================================================
function TabUbicaciones({ ubicaciones, materiales }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [editItem, setEditItem] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fields = [
    { key: 'codigo', label: 'Código Ubicación', type: 'text', required: true, placeholder: 'Ej. A-01-01' },
    { key: 'zona', label: 'Zona', type: 'text', required: true, placeholder: 'Ej. A' },
    { key: 'pasillo', label: 'Pasillo', type: 'text', placeholder: 'Ej. 01' },
    { key: 'estanteria', label: 'Estantería', type: 'text' },
    { key: 'nivel', label: 'Nivel', type: 'text' },
    { key: 'capacidadMaxima', label: 'Capacidad Máxima (uds)', type: 'number', min: 0 },
    { key: 'tipoAlmacen', label: 'Tipo de Almacén', type: 'select', options: ['ambiente', 'refrigerado', 'exterior', 'peligrosos'] }
  ];

  const handleSave = async (e, formData) => {
    e.preventDefault();
    await updateUbicacion(formData.id, formData);
    setModalOpen(false);
  };

  const handleDelete = async () => {
    if (deleteConfirm) {
      // Verificar si hay materiales asignados
      const asignados = materiales.filter(m => m.ubicacionId === deleteConfirm.id);
      if (asignados.length > 0) {
        alert(`No se puede eliminar. Hay ${asignados.length} materiales en esta ubicación.`);
        setDeleteConfirm(null);
        return;
      }
      await deleteUbicacion(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Mapa de Ubicaciones</h2>
        <button onClick={() => { setEditItem({}); setModalMode('create'); setModalOpen(true); }} className="btn-primary">
          <Plus className="w-4 h-4 mr-2" /> Nueva Ubicación
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {ubicaciones.map(ubi => {
          // Calcular ocupación
          const matsEnUbi = materiales.filter(m => m.ubicacionId === ubi.id);
          const cantidadTotal = matsEnUbi.reduce((acc, m) => acc + (Number(m.stockActual) || 0), 0);
          const capMax = Number(ubi.capacidadMaxima) || 1;
          const ocupacionPct = Math.min(100, (cantidadTotal / capMax) * 100).toFixed(1);

          return (
            <div key={ubi.id} className="card p-4 hover:border-blue-500/50 transition-colors group cursor-default">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <h3 className="font-bold text-white text-lg">{ubi.codigo}</h3>
                </div>
                <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditItem(ubi); setModalMode('edit'); setModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-blue-400"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setDeleteConfirm(ubi)} className="p-1.5 text-slate-400 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <p className="text-xs text-slate-500 mb-4">{ubi.tipoAlmacen.toUpperCase()} • Zona {ubi.zona}</p>
              
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono text-slate-400">
                  <span>{cantidadTotal} / {ubi.capacidadMaxima} uds</span>
                  <span className={ocupacionPct > 90 ? 'text-red-400' : 'text-emerald-400'}>{ocupacionPct}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${ocupacionPct > 90 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${ocupacionPct}%` }}></div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800">
                <p className="text-[10px] uppercase font-bold text-slate-500 mb-2">Materiales Almacenados ({matsEnUbi.length})</p>
                <div className="flex gap-1 flex-wrap">
                  {matsEnUbi.slice(0, 5).map(m => (
                    <span key={m.id} className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded truncate max-w-[80px]" title={m.descripcion}>
                      {m.codigo}
                    </span>
                  ))}
                  {matsEnUbi.length > 5 && <span className="text-[9px] bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">+{matsEnUbi.length - 5}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <CrudModal open={modalOpen} onClose={() => setModalOpen(false)} title={modalMode === 'create' ? 'Nueva Ubicación' : 'Editar Ubicación'} fields={fields} initialData={editItem} onSave={handleSave} saving={false} />
      <ConfirmDialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={handleDelete} title="Eliminar Ubicación" message={`¿Seguro que deseas eliminar la ubicación ${deleteConfirm?.codigo}?`} confirmText="Eliminar" variant="danger" />
    </div>
  );
}

// ============================================================================
// TAB 3: REGULARIZACIÓN DE STOCK
// ============================================================================
function TabRegularizacion({ materiales, perfil }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [matsToEdit, setMatsToEdit] = useState({});
  const [saving, setSaving] = useState(false);

  const filtered = materiales.filter(m => 
    m.codigo.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 30); // Limitar render

  const handleContadoChange = (id, val) => {
    setMatsToEdit(prev => ({
      ...prev,
      [id]: { ...prev[id], contado: val }
    }));
  };

  const handleMotivoChange = (id, val) => {
    setMatsToEdit(prev => ({
      ...prev,
      [id]: { ...prev[id], motivo: val }
    }));
  };

  const handleConfirmarLinea = async (m) => {
    const editData = matsToEdit[m.id];
    if (!editData || editData.contado === undefined || editData.contado === '') return;
    
    const contado = Number(editData.contado);
    const diferencia = contado - (Number(m.stockActual) || 0);

    if (diferencia === 0) {
      alert('El stock contado es igual al actual. No hay diferencia que regularizar.');
      return;
    }

    if (!editData.motivo) {
      alert('Debes indicar un motivo de regularización (ej. Rotura, Extravío, Error de conteo).');
      return;
    }

    setSaving(true);
    try {
      await registrarMovimientoStock(m.id, {
        tipo: 'ajuste',
        cantidad: diferencia, // diferencia puede ser positiva o negativa
        motivo: `Regularización: ${editData.motivo}`,
        origen: 'regularizacion',
        usuario: perfil?.nombre || 'Usuario'
      });
      alert(`Stock ajustado correctamente. Nueva cantidad: ${contado}`);
      setMatsToEdit(prev => {
        const next = { ...prev };
        delete next[m.id];
        return next;
      });
    } catch(e) {
      console.error(e);
      alert('Error al ajustar stock');
    }
    setSaving(false);
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Conteo Físico y Regularización</h2>
          <p className="text-sm text-slate-400">Ajusta el stock real del almacén. Toda diferencia generará un registro de auditoría.</p>
        </div>
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar material..." className="input-field pl-10 w-64" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-800/50 text-[10px] font-black uppercase text-slate-400 tracking-wider">
              <th className="p-3">Material</th>
              <th className="p-3">Stock Sistema</th>
              <th className="p-3 bg-blue-900/10 text-blue-300">Stock Físico Contado</th>
              <th className="p-3">Diferencia</th>
              <th className="p-3">Motivo Obligatorio</th>
              <th className="p-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filtered.map(m => {
              const editData = matsToEdit[m.id] || {};
              const contado = editData.contado !== undefined ? Number(editData.contado) : '';
              const diff = contado !== '' ? contado - (Number(m.stockActual) || 0) : 0;
              const hasDiff = diff !== 0 && contado !== '';

              return (
                <tr key={m.id} className="hover:bg-slate-800/20">
                  <td className="p-3">
                    <p className="text-sm font-bold text-white">{m.codigo}</p>
                    <p className="text-[10px] text-slate-500 truncate max-w-[200px]">{m.descripcion}</p>
                  </td>
                  <td className="p-3">
                    <span className="font-mono text-slate-300">{m.stockActual} {m.unidad}</span>
                  </td>
                  <td className="p-3 bg-blue-900/5">
                    <input 
                      type="number" min="0" step="0.01" 
                      value={editData.contado !== undefined ? editData.contado : ''} 
                      onChange={e => handleContadoChange(m.id, e.target.value)} 
                      placeholder="0.00"
                      className="w-24 bg-slate-900 border border-blue-500/30 focus:border-blue-500 rounded-lg px-2 py-1.5 text-white font-mono text-sm" 
                    />
                  </td>
                  <td className="p-3">
                    {hasDiff ? (
                      <span className={`inline-flex px-2 py-0.5 rounded font-mono text-xs font-bold ${diff > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                        {diff > 0 ? '+' : ''}{diff}
                      </span>
                    ) : (
                      <span className="text-slate-600 font-mono text-xs">-</span>
                    )}
                  </td>
                  <td className="p-3">
                    {hasDiff && (
                      <select 
                        value={editData.motivo || ''} 
                        onChange={e => handleMotivoChange(m.id, e.target.value)}
                        className={`w-full bg-slate-900 border ${!editData.motivo ? 'border-red-500/50' : 'border-slate-700'} rounded-lg px-2 py-1 text-xs text-white`}
                      >
                        <option value="">Selecciona motivo...</option>
                        <option value="Error de conteo previo">Error de conteo previo</option>
                        <option value="Rotura/Merma">Rotura / Merma</option>
                        <option value="Extravío">Extravío</option>
                        <option value="Ajuste inicial">Ajuste inicial</option>
                      </select>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <button 
                      onClick={() => handleConfirmarLinea(m)}
                      disabled={!hasDiff || !editData.motivo || saving}
                      className="btn-primary py-1.5 px-3 text-xs disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Ajustar
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// TAB 4: EDICIÓN DE ESCANDALLOS (BOM) & COSTES
// ============================================================================
function TabEscandallos({ productos, materiales }) {
  // Vista simplificada que muestra el coste de cada producto.
  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h2 className="text-xl font-bold text-white mb-2">Valoración de Escandallos</h2>
        <p className="text-sm text-slate-400 mb-6">El coste se calcula sumando el factor de consumo por el coste unitario de cada materia prima en tiempo real.</p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {productos.map(p => {
            const costeMaterial = calcularCosteEscandallo(p, materiales);
            return (
              <div key={p.id} className="border border-slate-700 rounded-xl bg-slate-800/30 p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-white">{p.codigo}</h3>
                    <p className="text-xs text-slate-400">{p.descripcion}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Coste Directo Mat.</span>
                    <p className="text-lg font-black text-emerald-400">{costeMaterial.toFixed(2)} €</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Desglose (BOM):</p>
                  {(p.bom || []).length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No tiene componentes definidos.</p>
                  ) : (
                    <table className="w-full text-xs text-slate-300">
                      <tbody>
                        {p.bom.map(item => {
                          const mat = materiales.find(m => m.codigo === item.codigo);
                          const costeUn = mat ? Number(mat.costeUnitario || 0) : 0;
                          const costeLin = (costeUn * item.factor).toFixed(2);
                          return (
                            <tr key={item.codigo} className="border-b border-slate-700/50 last:border-0">
                              <td className="py-1 pr-2">{item.codigo}</td>
                              <td className="py-1 px-2 text-right font-mono text-slate-400">{item.factor} {item.unidad}</td>
                              <td className="py-1 px-2 text-right font-mono text-slate-400">x {costeUn.toFixed(2)}€</td>
                              <td className="py-1 pl-2 text-right font-mono font-bold text-white">={costeLin}€</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// TAB 5: VISOR DE STOCK
// ============================================================================
function TabStock({ materiales, ubicaciones }) {
  // Calculamos el valor económico total almacenado
  const valorTotal = materiales.reduce((acc, m) => acc + ((Number(m.stockActual) || 0) * (Number(m.costeUnitario) || 0)), 0);
  
  // Agrupamos por criticidad
  const critAlta = materiales.filter(m => m.criticidad === 'alta');
  const dispAlta = critAlta.reduce((acc, m) => acc + (Number(m.stockActual) || 0), 0);
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-6 bg-gradient-to-br from-blue-900/40 to-slate-900 border-blue-500/20">
          <p className="text-xs font-black text-blue-400 uppercase tracking-widest mb-1">Valor de Inventario</p>
          <p className="text-3xl font-black text-white">{valorTotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</p>
        </div>
        <div className="card p-6 border-red-500/20">
          <p className="text-xs font-black text-red-400 uppercase tracking-widest mb-1">Stock Crítico (Alta)</p>
          <p className="text-3xl font-black text-white">{dispAlta.toLocaleString('es-ES')} <span className="text-sm font-medium text-slate-400">uds totales</span></p>
          <p className="text-xs text-slate-500 mt-2">{critAlta.length} referencias</p>
        </div>
        <div className="card p-6 border-emerald-500/20">
          <p className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-1">Ubicaciones Activas</p>
          <p className="text-3xl font-black text-white">{ubicaciones.length}</p>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-bold text-white mb-4">Stock por Material (Listado Rápido)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-800/50 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                <th className="p-3">Código</th>
                <th className="p-3">Ubicación</th>
                <th className="p-3 text-right">Stock Actual</th>
                <th className="p-3 text-right">Valor (€)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {materiales.map(m => {
                const ubi = ubicaciones.find(u => u.id === m.ubicacionId);
                const valor = (Number(m.stockActual) || 0) * (Number(m.costeUnitario) || 0);
                return (
                  <tr key={m.id} className="hover:bg-slate-800/20">
                    <td className="p-3 font-bold text-white">{m.codigo}</td>
                    <td className="p-3 text-slate-400">{ubi ? ubi.codigo : 'Sin asignar'}</td>
                    <td className="p-3 text-right font-mono font-bold">{m.stockActual} {m.unidad}</td>
                    <td className="p-3 text-right font-mono text-emerald-400">{valor.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// TAB 6: CORRECCIÓN DE NOTAS
// ============================================================================
function TabCorreccion({ entradas, materiales, perfil }) {
  const [corregirId, setCorregirId] = useState(null);
  
  const handleCorregir = async (entrada) => {
    if (!window.confirm(`¿Seguro que deseas corregir (anular) el albarán ${entrada.numeroAlbaran}? Se revertirá el stock.`)) return;
    
    try {
      // 1. Revertir movimientos
      for (const linea of entrada.lineas) {
        await registrarMovimientoStock(linea.materialId, {
          tipo: 'salida',
          cantidad: linea.cantidad,
          motivo: `Corrección de Albarán ${entrada.numeroAlbaran}`,
          origen: 'regularizacion', // fuerza auditoria
          usuario: perfil?.nombre || 'Usuario'
        });
      }

      // 2. Marcar la entrada como corregida
      await updateEntradaMercancia(entrada.id, { estado: 'corregida' });

      // 3. Crear una entrada de corrección para traza
      await insertEntradaMercancia({
        numeroAlbaran: `REV-${entrada.numeroAlbaran}`,
        proveedor: entrada.proveedor,
        fecha: new Date().toISOString(),
        estado: 'anulada',
        corregidaDe: entrada.id,
        observaciones: `Reversión generada automáticamente de ${entrada.numeroAlbaran}`,
        lineas: entrada.lineas.map(l => ({ ...l, cantidad: -l.cantidad }))
      });

      alert('Albarán corregido y stock revertido con éxito.');
    } catch(e) {
      console.error(e);
      alert('Error al corregir el albarán.');
    }
  };

  return (
    <div className="card p-6">
      <h2 className="text-lg font-bold text-white mb-4">Historial de Entradas de Mercancía</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-800/50 text-[10px] font-black uppercase text-slate-400 tracking-wider">
              <th className="p-3">Fecha</th>
              <th className="p-3">Nº Albarán</th>
              <th className="p-3">Proveedor</th>
              <th className="p-3">Estado</th>
              <th className="p-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {entradas.map(e => (
              <tr key={e.id} className="hover:bg-slate-800/20">
                <td className="p-3 text-slate-400 font-mono">{new Date(e.fecha).toLocaleString()}</td>
                <td className="p-3 font-bold text-white">
                  {e.numeroAlbaran}
                  {e.corregidaDe && <span className="block text-[9px] text-orange-400">Corrige a: {e.corregidaDe}</span>}
                </td>
                <td className="p-3 text-slate-300">{e.proveedor}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                    e.estado === 'confirmada' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    e.estado === 'corregida' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                    'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                  }`}>
                    {e.estado}
                  </span>
                </td>
                <td className="p-3 text-right">
                  {e.estado === 'confirmada' && (
                    <button onClick={() => handleCorregir(e)} className="text-xs text-red-400 hover:text-red-300 font-bold underline">
                      Corregir / Anular
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
