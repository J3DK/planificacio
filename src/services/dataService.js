import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { lineas as mockLineas } from '@/data/mockLineas';
import { alertas as mockAlertas } from '@/data/mockAlertas';
import { paradasTurno as mockParadas } from '@/data/mockParadas';
import { ordenesSecuencia as mockSecuencia } from '@/data/mockSecuencia';
import { defectosPorCausa as mockDefectos, retrabajos as mockRetrabajos, reclamaciones as mockReclamaciones, scraps as mockScraps } from '@/data/mockCalidad';
import { produccionHistorica as mockProduccion } from '@/data/mockProduccion';
import { materiales as mockMateriasPrimas } from '@/data/mockMaterias';
import { kpis as mockKpis } from '@/data/mockDashboard';
import { historialProduccion as mockHistorial } from '@/data/mockHistorial';
import { productos as mockProductos } from '@/data/mockProductos';
import { operarios as mockOperarios } from '@/data/mockOperarios';

// ─── helpers ────────────────────────────────────────────────────────────────

function mapLinea(l) {
  return {
    ...l,
    produccionHoy: l.produccion_hoy ?? l.produccionHoy ?? 0,
    objetivoHoy: l.objetivo_hoy ?? l.objetivoHoy ?? 0,
    velocidadActual: l.velocidad_actual ?? l.velocidadActual ?? 0,
    velocidadNominal: l.velocidad_nominal ?? l.velocidadNominal ?? 0,
    proximoMantenimiento: l.proximo_mantenimiento ?? l.proximoMantenimiento,
    motivoParada: l.motivo_parada ?? l.motivoParada,
  };
}

function mapMaterial(m) {
  return {
    ...m,
    stockActual: m.stock_actual ?? m.stockActual ?? 0,
    stockMinimo: m.stock_minimo ?? m.stockMinimo ?? 0,
    stockMaximo: m.stock_maximo ?? m.stockMaximo ?? 0,
    pedidoPendiente: m.pedido_pendiente ?? m.pedidoPendiente ?? 0,
    fechaEntrega: m.fecha_entrega ?? m.fechaEntrega,
  };
}

function mapSecuencia(s) {
  return { ...s, fechaCompromiso: s.fecha_compromiso ?? s.fechaCompromiso };
}

function lineaToDb(l) {
  return {
    id: l.id,
    nombre: l.nombre,
    descripcion: l.descripcion,
    estado: l.estado,
    turno: l.turno,
    operarios: l.operarios,
    oee: l.oee,
    disponibilidad: l.disponibilidad,
    rendimiento: l.rendimiento,
    calidad: l.calidad,
    produccion_hoy: l.produccionHoy ?? l.produccion_hoy ?? 0,
    objetivo_hoy: l.objetivoHoy ?? l.objetivo_hoy ?? 0,
    velocidad_actual: l.velocidadActual ?? l.velocidad_actual ?? 0,
    velocidad_nominal: l.velocidadNominal ?? l.velocidad_nominal ?? 0,
    producto: l.producto,
    cliente: l.cliente,
    proximo_mantenimiento: l.proximoMantenimiento ?? l.proximo_mantenimiento,
    motivo_parada: l.motivoParada ?? l.motivo_parada,
    updated_at: new Date().toISOString(),
  };
}

function materialToDb(m) {
  return {
    id: m.id,
    codigo: m.codigo,
    descripcion: m.descripcion,
    unidad: m.unidad,
    stock_actual: m.stockActual ?? m.stock_actual ?? 0,
    stock_minimo: m.stockMinimo ?? m.stock_minimo ?? 0,
    stock_maximo: m.stockMaximo ?? m.stock_maximo ?? 0,
    pedido_pendiente: m.pedidoPendiente ?? m.pedido_pendiente ?? 0,
    fecha_entrega: m.fechaEntrega ?? m.fecha_entrega,
    criticidad: m.criticidad,
    proveedor: m.proveedor,
  };
}

function secuenciaToDb(s) {
  return {
    id: s.id,
    secuencia: s.secuencia,
    referencia: s.referencia,
    cliente: s.cliente,
    fecha_compromiso: s.fechaCompromiso ?? s.fecha_compromiso,
    progreso: s.progreso,
    cumplimiento: s.cumplimiento,
    desvio: s.desvio,
    estado: s.estado,
  };
}

// ─── DEFAULT METRICAS ────────────────────────────────────────────────────────

export const DEFAULT_METRICAS = [
  { id: 'cumplimiento_plan',      widget_nombre: 'Cumplimiento Plan',          descripcion: 'Porcentaje de cumplimiento del plan maestro', activo: true,  orden: 1, umbral: 98.0,  umbral_label: '% objetivo',   icono: 'TrendingUp' },
  { id: 'produccion_vs_plan',     widget_nombre: 'Producción vs Plan',         descripcion: 'Gráfico de producción real vs planificada',  activo: true,  orden: 2, umbral: null,  umbral_label: null,           icono: 'BarChart2' },
  { id: 'oee_planta',             widget_nombre: 'OEE Planta',                 descripcion: 'OEE agregado de todas las líneas activas',  activo: true,  orden: 3, umbral: 85.0,  umbral_label: '% mínimo OEE', icono: 'Activity' },
  { id: 'alertas_criticas',       widget_nombre: 'Alertas Críticas',           descripcion: 'Número de alertas críticas activas',         activo: true,  orden: 4, umbral: null,  umbral_label: null,           icono: 'AlertTriangle' },
  { id: 'velocidad_linea',        widget_nombre: 'Velocidad de Línea',         descripcion: 'Ritmo real vs ritmo objetivo (uds/h)',       activo: true,  orden: 5, umbral: null,  umbral_label: null,           icono: 'Zap' },
  { id: 'produccion_por_hora',    widget_nombre: 'Producción por Hora',        descripcion: 'Gráfico de cadencia horaria del turno',     activo: true,  orden: 6, umbral: null,  umbral_label: null,           icono: 'LineChart' },
  { id: 'cumplimiento_por_linea', widget_nombre: 'Cumplimiento por Línea',     descripcion: 'Tabla de cumplimiento % por cada línea',    activo: true,  orden: 7, umbral: 95.0,  umbral_label: '% mínimo',     icono: 'Factory' },
  { id: 'causas_desviacion',      widget_nombre: 'Causas de Desviación',       descripcion: 'Top causas de desvío en el turno actual',   activo: false, orden: 8, umbral: null,  umbral_label: null,           icono: 'PieChart' },
];

// ─── READ ────────────────────────────────────────────────────────────────────

function getLineasLocal() { try { const r = localStorage.getItem('mes_lineas'); return r ? JSON.parse(r) : null; } catch (_) { return null; } }
function setLineasLocal(d) { try { localStorage.setItem('mes_lineas', JSON.stringify(d)); } catch (_) {} }

export async function fetchLineas() {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('lineas').select('*').order('id', { ascending: true });
      if (!error && data && data.length > 0) return { data: data.map(mapLinea), fromSupabase: true };
    } catch (e) { console.warn('Fallback a mockLineas:', e); }
  }
  const local = getLineasLocal();
  if (local) return { data: local, fromSupabase: false };
  setLineasLocal(mockLineas);
  return { data: mockLineas, fromSupabase: false };
}

export async function fetchAlertas() {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('alertas').select('*').order('id', { ascending: false });
      if (!error && data && data.length > 0) return { data, fromSupabase: true };
    } catch (e) {}
  }
  return { data: mockAlertas, fromSupabase: false };
}

export async function fetchParadas() {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('paradas').select('*').order('id', { ascending: true });
      if (!error && data && data.length > 0) return { data, fromSupabase: true };
    } catch (e) {}
  }
  return { data: mockParadas, fromSupabase: false };
}

function getSecuenciaLocal() { try { const r = localStorage.getItem('mes_secuencia'); return r ? JSON.parse(r) : null; } catch (_) { return null; } }
function setSecuenciaLocal(d) { try { localStorage.setItem('mes_secuencia', JSON.stringify(d)); } catch (_) {} }

export async function fetchSecuencia() {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('secuencia').select('*').order('secuencia', { ascending: true });
      if (!error && data && data.length > 0) return { data: data.map(mapSecuencia), fromSupabase: true };
    } catch (e) {}
  }
  const local = getSecuenciaLocal();
  if (local) return { data: local, fromSupabase: false };
  setSecuenciaLocal(mockSecuencia);
  return { data: mockSecuencia, fromSupabase: false };
}

export async function fetchCalidad() {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('calidad').select('*').order('id', { ascending: true });
      if (!error && data && data.length > 0) return { data, fromSupabase: true };
    } catch (e) {}
  }
  return { data: mockCalidad, fromSupabase: false };
}

export async function fetchProduccion() {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('produccion').select('*').order('id', { ascending: true });
      if (!error && data && data.length > 0) return { data, fromSupabase: true };
    } catch (e) {}
  }
  return { data: mockProduccion, fromSupabase: false };
}

export async function fetchMateriasPrimas() {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('materias_primas').select('*').order('id', { ascending: true });
      if (!error && data && data.length > 0) return { data: data.map(mapMaterial), fromSupabase: true };
    } catch (e) {}
  }
  return { data: mockMateriasPrimas, fromSupabase: false };
}

export async function fetchDashboardKpis() {
  return { data: mockKpis, fromSupabase: false };
}

export async function fetchMetricas() {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('metricas_config').select('*').order('orden', { ascending: true });
      if (!error && data && data.length > 0) return { data, fromSupabase: true };
    } catch (e) {}
  }
  return { data: DEFAULT_METRICAS, fromSupabase: false };
}

// ─── WRITE — Lineas ──────────────────────────────────────────────────────────

export async function insertLinea(linea) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('lineas').insert([lineaToDb(linea)]).select().single();
      if (!error && data) return { data: mapLinea(data), error: null };
    } catch (e) {}
  }
  const current = getLineasLocal() || mockLineas;
  const newItem = { ...linea, id: linea.id || `L${Date.now()}` };
  const updated = [...current, newItem];
  setLineasLocal(updated);
  return { data: newItem, error: null };
}

export async function updateLinea(id, linea) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('lineas').update(lineaToDb(linea)).eq('id', id).select().single();
      if (!error && data) return { data: mapLinea(data), error: null };
    } catch (e) {}
  }
  const current = getLineasLocal() || mockLineas;
  const updated = current.map(l => l.id === id ? { ...l, ...linea } : l);
  setLineasLocal(updated);
  return { data: updated.find(l => l.id === id), error: null };
}

export async function deleteLinea(id) {
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from('lineas').delete().eq('id', id);
      if (!error) return { error: null };
    } catch (e) {}
  }
  const current = getLineasLocal() || mockLineas;
  setLineasLocal(current.filter(l => l.id !== id));
  return { error: null };
}

// ─── WRITE — Alertas ─────────────────────────────────────────────────────────

export async function insertAlerta(alerta) {
  if (!isSupabaseConfigured()) return { error: 'Sin conexión' };
  const { data, error } = await supabase.from('alertas').insert([alerta]).select().single();
  return { data, error };
}

export async function updateAlerta(id, alerta) {
  if (!isSupabaseConfigured()) return { error: 'Sin conexión' };
  const { data, error } = await supabase.from('alertas').update(alerta).eq('id', id).select().single();
  return { data, error };
}

export async function deleteAlerta(id) {
  if (!isSupabaseConfigured()) return { error: 'Sin conexión' };
  const { error } = await supabase.from('alertas').delete().eq('id', id);
  return { error };
}

// ─── WRITE — Paradas ─────────────────────────────────────────────────────────

export async function insertParada(parada) {
  if (!isSupabaseConfigured()) return { error: 'Sin conexión' };
  const { data, error } = await supabase.from('paradas').insert([parada]).select().single();
  return { data, error };
}

export async function updateParada(id, parada) {
  if (!isSupabaseConfigured()) return { error: 'Sin conexión' };
  const { data, error } = await supabase.from('paradas').update(parada).eq('id', id).select().single();
  return { data, error };
}

export async function deleteParada(id) {
  if (!isSupabaseConfigured()) return { error: 'Sin conexión' };
  const { error } = await supabase.from('paradas').delete().eq('id', id);
  return { error };
}

// ─── WRITE — Secuencia ───────────────────────────────────────────────────────

export async function insertSecuencia(orden) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('secuencia').insert([secuenciaToDb(orden)]).select().single();
      if (!error && data) return { data: mapSecuencia(data), error: null };
    } catch (e) {}
  }
  const current = getSecuenciaLocal() || mockSecuencia;
  const newItem = { ...orden, id: orden.id || Date.now(), secuencia: orden.secuencia || current.length + 1 };
  const updated = [...current, newItem];
  setSecuenciaLocal(updated);
  return { data: newItem, error: null };
}

export async function updateSecuencia(id, orden) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('secuencia').update(secuenciaToDb(orden)).eq('id', id).select().single();
      if (!error && data) return { data: mapSecuencia(data), error: null };
    } catch (e) {}
  }
  const current = getSecuenciaLocal() || mockSecuencia;
  const updated = current.map(o => o.id === id ? { ...o, ...orden } : o);
  setSecuenciaLocal(updated);
  return { data: updated.find(o => o.id === id), error: null };
}

export async function deleteSecuencia(id) {
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from('secuencia').delete().eq('id', id);
      if (!error) return { error: null };
    } catch (e) {}
  }
  const current = getSecuenciaLocal() || mockSecuencia;
  setSecuenciaLocal(current.filter(o => o.id !== id));
  return { error: null };
}

// ─── WRITE — Materias Primas ─────────────────────────────────────────────────

export async function insertMaterial(material) {
  if (!isSupabaseConfigured()) return { error: 'Sin conexión' };
  const { data, error } = await supabase.from('materias_primas').insert([materialToDb(material)]).select().single();
  return { data: data ? mapMaterial(data) : null, error };
}

export async function updateMaterial(id, material) {
  if (!isSupabaseConfigured()) return { error: 'Sin conexión' };
  const { data, error } = await supabase.from('materias_primas').update(materialToDb(material)).eq('id', id).select().single();
  return { data: data ? mapMaterial(data) : null, error };
}

export async function deleteMaterial(id) {
  if (!isSupabaseConfigured()) return { error: 'Sin conexión' };
  const { error } = await supabase.from('materias_primas').delete().eq('id', id);
  return { error };
}

// ─── WRITE — Calidad ─────────────────────────────────────────────────────────

export async function insertCalidad(defecto) {
  if (!isSupabaseConfigured()) return { error: 'Sin conexión' };
  const { data, error } = await supabase.from('calidad').insert([defecto]).select().single();
  return { data, error };
}

export async function updateCalidad(id, defecto) {
  if (!isSupabaseConfigured()) return { error: 'Sin conexión' };
  const { data, error } = await supabase.from('calidad').update(defecto).eq('id', id).select().single();
  return { data, error };
}

export async function deleteCalidad(id) {
  if (!isSupabaseConfigured()) return { error: 'Sin conexión' };
  const { error } = await supabase.from('calidad').delete().eq('id', id);
  return { error };
}

// ─── WRITE — Produccion ──────────────────────────────────────────────────────

export async function insertProduccion(item) {
  if (!isSupabaseConfigured()) return { error: 'Sin conexión' };
  const { data, error } = await supabase.from('produccion').insert([item]).select().single();
  return { data, error };
}

// ─── WRITE — Métricas Config ─────────────────────────────────────────────────

export async function updateMetrica(id, changes) {
  if (!isSupabaseConfigured()) return { error: 'Sin conexión' };
  const { data, error } = await supabase
    .from('metricas_config')
    .update({ ...changes, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  return { data, error };
}

export async function updateOrdenMetricas(metricas) {
  if (!isSupabaseConfigured()) return { error: 'Sin conexión' };
  const updates = metricas.map(m =>
    supabase.from('metricas_config').update({ orden: m.orden, updated_at: new Date().toISOString() }).eq('id', m.id)
  );
  await Promise.all(updates);
  return { error: null };
}

// ─── READ — Historial de Producción ─────────────────────────────────────────

export async function fetchHistorial() {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('historial_produccion')
        .select('*')
        .order('fecha', { ascending: false });
      if (!error && data && data.length > 0) return { data, fromSupabase: true };
    } catch (e) { console.warn('Fallback a mockHistorial:', e); }
  }
  return { data: mockHistorial, fromSupabase: false };
}

// ─── READ/WRITE — Productos / Referencias de Fabricación ─────────────────────

const LS_KEY_PRODUCTOS = 'mes_productos_catalogo';

function getProductosLocal() {
  try {
    const raw = localStorage.getItem(LS_KEY_PRODUCTOS);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return null;
}

function setProductosLocal(productos) {
  try {
    localStorage.setItem(LS_KEY_PRODUCTOS, JSON.stringify(productos));
  } catch (_) {}
}

export async function fetchProductos() {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .order('codigo', { ascending: true });
      if (!error && data && data.length > 0) return { data, fromSupabase: true };
    } catch (e) { console.warn('Fallback a localStorage/mock productos:', e); }
  }
  // Intentar localStorage primero, si no usar mock
  const local = getProductosLocal();
  if (local) return { data: local, fromSupabase: false };
  // Inicializar localStorage con mock
  setProductosLocal(mockProductos);
  return { data: mockProductos, fromSupabase: false };
}

export async function insertProducto(producto) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('productos').insert([producto]).select().single();
      if (!error && data) return { data, error: null };
    } catch (e) {}
  }
  // LocalStorage fallback
  const current = getProductosLocal() || mockProductos;
  const newItem = { ...producto, id: `P${Date.now()}` };
  const updated = [...current, newItem];
  setProductosLocal(updated);
  return { data: newItem, error: null };
}

export async function updateProducto(id, producto) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('productos').update(producto).eq('id', id).select().single();
      if (!error && data) return { data, error: null };
    } catch (e) {}
  }
  // LocalStorage fallback
  const current = getProductosLocal() || mockProductos;
  const updated = current.map(p => p.id === id ? { ...p, ...producto } : p);
  setProductosLocal(updated);
  return { data: updated.find(p => p.id === id), error: null };
}

export async function deleteProducto(id) {
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from('productos').delete().eq('id', id);
      if (!error) return { error: null };
    } catch (e) {}
  }
  // LocalStorage fallback
  const current = getProductosLocal() || mockProductos;
  const updated = current.filter(p => p.id !== id);
  setProductosLocal(updated);
  return { error: null };
}

// ─── CRUD genérico para catálogos de Calidad (localStorage + Supabase) ────────

function makeCrudLocal(lsKey, mockData) {
  const get = () => { try { const r = localStorage.getItem(lsKey); return r ? JSON.parse(r) : null; } catch (_) { return null; } };
  const set = (d) => { try { localStorage.setItem(lsKey, JSON.stringify(d)); } catch (_) {} };
  return { get, set, mock: mockData };
}

const crudDefectos     = makeCrudLocal('mes_calidad_defectos',     mockDefectos);
const crudRetrabajos   = makeCrudLocal('mes_calidad_retrabajos',   mockRetrabajos);
const crudReclamaciones= makeCrudLocal('mes_calidad_reclamaciones',mockReclamaciones);
const crudScraps       = makeCrudLocal('mes_calidad_scraps',       mockScraps);

function makeCalidadCRUD(crud, tableName, prefix) {
  const fetchFn = async () => {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from(tableName).select('*').order('id', { ascending: true });
        if (!error && data && data.length > 0) return { data, fromSupabase: true };
      } catch (e) {}
    }
    const local = crud.get();
    if (local) return { data: local, fromSupabase: false };
    crud.set(crud.mock);
    return { data: crud.mock, fromSupabase: false };
  };
  const insertFn = async (item) => {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from(tableName).insert([item]).select().single();
        if (!error && data) return { data, error: null };
      } catch (e) {}
    }
    const current = crud.get() || crud.mock;
    const newItem = { ...item, id: `${prefix}${Date.now()}` };
    crud.set([...current, newItem]);
    return { data: newItem, error: null };
  };
  const updateFn = async (id, item) => {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from(tableName).update(item).eq('id', id).select().single();
        if (!error && data) return { data, error: null };
      } catch (e) {}
    }
    const current = crud.get() || crud.mock;
    const updated = current.map(r => r.id === id ? { ...r, ...item } : r);
    crud.set(updated);
    return { data: updated.find(r => r.id === id), error: null };
  };
  const deleteFn = async (id) => {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from(tableName).delete().eq('id', id);
        if (!error) return { error: null };
      } catch (e) {}
    }
    const current = crud.get() || crud.mock;
    crud.set(current.filter(r => r.id !== id));
    return { error: null };
  };
  return { fetchFn, insertFn, updateFn, deleteFn };
}

const defectosCRUD      = makeCalidadCRUD(crudDefectos,      'calidad_defectos',      'D');
const retrabajoCRUD     = makeCalidadCRUD(crudRetrabajos,    'calidad_retrabajos',    'R');
const reclamacionCRUD   = makeCalidadCRUD(crudReclamaciones, 'calidad_reclamaciones', 'C');
const scrapCRUD         = makeCalidadCRUD(crudScraps,        'calidad_scraps',        'S');

export const fetchDefectos       = defectosCRUD.fetchFn;
export const insertDefecto       = defectosCRUD.insertFn;
export const updateDefecto       = defectosCRUD.updateFn;
export const deleteDefecto       = defectosCRUD.deleteFn;

export const fetchRetrabajos     = retrabajoCRUD.fetchFn;
export const insertRetrabajo     = retrabajoCRUD.insertFn;
export const updateRetrabajo     = retrabajoCRUD.updateFn;
export const deleteRetrabajo     = retrabajoCRUD.deleteFn;

export const fetchReclamaciones  = reclamacionCRUD.fetchFn;
export const insertReclamacion   = reclamacionCRUD.insertFn;
export const updateReclamacion   = reclamacionCRUD.updateFn;
export const deleteReclamacion   = reclamacionCRUD.deleteFn;

export const fetchScraps         = scrapCRUD.fetchFn;
export const insertScrap         = scrapCRUD.insertFn;
export const updateScrap         = scrapCRUD.updateFn;
export const deleteScrap         = scrapCRUD.deleteFn;

// ─── PLANIFICACIÓN (GANTT) & SINCRONIZACIÓN CON EL RESTO DE LA APP ────────────

const ordenesGanttDefault = [
  { id: 'G1', linea: 'L1', dia: 0, horaInicio: 6, duracion: 4, ref: 'BAT-48V-100Ah', cliente: 'Cliente A', color: '#2563eb' },
  { id: 'G2', linea: 'L1', dia: 0, horaInicio: 10, duracion: 6, ref: 'BAT-48V-200Ah', cliente: 'Cliente D', color: '#7c3aed' },
  { id: 'G3', linea: 'L2', dia: 0, horaInicio: 6, duracion: 8, ref: 'BAT-24V-200Ah', cliente: 'Cliente B', color: '#0891b2' },
  { id: 'G4', linea: 'L3', dia: 0, horaInicio: 8, duracion: 5, ref: 'BAT-12V-100Ah', cliente: 'Cliente C', color: '#dc2626' },
  { id: 'G5', linea: 'L4', dia: 0, horaInicio: 6, duracion: 10, ref: 'BAT-48V-200Ah', cliente: 'Cliente D', color: '#059669' },
  { id: 'G6', linea: 'L5', dia: 0, horaInicio: 6, duracion: 8, ref: 'BAT-24V-100Ah', cliente: 'Cliente E', color: '#d97706' },
  { id: 'G7', linea: 'L1', dia: 1, horaInicio: 6, duracion: 8, ref: 'BAT-48V-100Ah', cliente: 'Cliente A', color: '#2563eb' },
  { id: 'G8', linea: 'L2', dia: 1, horaInicio: 6, duracion: 6, ref: 'BAT-24V-100Ah', cliente: 'Cliente E', color: '#0891b2' },
  { id: 'G9', linea: 'L3', dia: 1, horaInicio: 7, duracion: 9, ref: 'BAT-12V-200Ah', cliente: 'Cliente C', color: '#dc2626' },
  { id: 'G10', linea: 'L4', dia: 1, horaInicio: 6, duracion: 8, ref: 'BAT-48V-100Ah', cliente: 'Cliente A', color: '#059669' },
  { id: 'G11', linea: 'L5', dia: 2, horaInicio: 6, duracion: 7, ref: 'BAT-24V-200Ah', cliente: 'Cliente B', color: '#d97706' },
  { id: 'G12', linea: 'L1', dia: 2, horaInicio: 6, duracion: 6, ref: 'BAT-48V-200Ah', cliente: 'Cliente D', color: '#2563eb' },
];

function getPlanificacionLocal() {
  try {
    const r = localStorage.getItem('mes_planificacion_gantt');
    return r ? JSON.parse(r) : null;
  } catch (_) { return null; }
}

function setPlanificacionLocal(d) {
  try {
    localStorage.setItem('mes_planificacion_gantt', JSON.stringify(d));
    syncGanttToRestOfApp(d);
  } catch (_) {}
}

function syncGanttToRestOfApp(ganttOrders) {
  if (!Array.isArray(ganttOrders)) return;
  
  // 1. Sincronizar hacia las Líneas de producción (mes_lineas)
  try {
    const currentLineas = getLineasLocal() || mockLineas;
    const updatedLineas = currentLineas.map(l => {
      // Buscar orden activa en el día 0 (Hoy)
      const ordenHoy = ganttOrders.find(o => o.linea === l.id && o.dia === 0) || ganttOrders.find(o => o.linea === l.id);
      if (ordenHoy) {
        return {
          ...l,
          producto: ordenHoy.ref,
          cliente: ordenHoy.cliente,
        };
      }
      return l;
    });
    localStorage.setItem('mes_lineas', JSON.stringify(updatedLineas));
  } catch (_) {}

  // 2. Sincronizar hacia Secuencia de Órdenes (mes_secuencia)
  try {
    const currentSecuencia = getSecuenciaLocal() || mockSecuencia;
    let nextSeq = currentSecuencia.length + 1;
    const updatedSecuencia = [...currentSecuencia];
    
    ganttOrders.forEach(go => {
      const foundIdx = updatedSecuencia.findIndex(s => s.referencia === go.ref && s.cliente === go.cliente);
      const diasStr = ['31/05/2024', '01/06/2024', '02/06/2024', '03/06/2024', '04/06/2024', '05/06/2024'];
      const fechaComp = `${diasStr[go.dia] || '31/05/2024'} ${String(go.horaInicio).padStart(2, '0')}:00`;
      
      if (foundIdx >= 0) {
        updatedSecuencia[foundIdx] = {
          ...updatedSecuencia[foundIdx],
          fechaCompromiso: fechaComp,
        };
      } else {
        updatedSecuencia.push({
          id: Date.now() + Math.floor(Math.random() * 10000),
          secuencia: nextSeq++,
          referencia: go.ref,
          cliente: go.cliente,
          fechaCompromiso: fechaComp,
          progreso: 0,
          cumplimiento: 100,
          desvio: 0,
          estado: 'a_tiempo'
        });
      }
    });
    localStorage.setItem('mes_secuencia', JSON.stringify(updatedSecuencia));
  } catch (_) {}
}

export async function fetchPlanificacion() {
  const local = getPlanificacionLocal();
  if (local) return { data: local, error: null };
  setPlanificacionLocal(ordenesGanttDefault);
  return { data: ordenesGanttDefault, error: null };
}

export async function insertOrdenPlanificacion(orden) {
  const current = getPlanificacionLocal() || ordenesGanttDefault;
  const newItem = {
    ...orden,
    id: orden.id || `G_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
  };
  const updated = [...current, newItem];
  setPlanificacionLocal(updated);
  return { data: newItem, error: null };
}

export async function updateOrdenPlanificacion(id, updates) {
  const current = getPlanificacionLocal() || ordenesGanttDefault;
  const updated = current.map(o => o.id === id ? { ...o, ...updates } : o);
  setPlanificacionLocal(updated);
  return { data: updated.find(o => o.id === id), error: null };
}

export async function deleteOrdenPlanificacion(id) {
  const current = getPlanificacionLocal() || ordenesGanttDefault;
  const updated = current.filter(o => o.id !== id);
  setPlanificacionLocal(updated);
  return { error: null };
}

export async function setAllPlanificacion(ordenes) {
  setPlanificacionLocal(ordenes);
  return { data: ordenes, error: null };
}

// ─── CRUD — Operarios ────────────────────────────────────────────────────────
const LS_KEY_OPERARIOS = 'mes_operarios_catalogo';

function getOperariosLocal() {
  try {
    const raw = localStorage.getItem(LS_KEY_OPERARIOS);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return null;
}

function setOperariosLocal(operarios) {
  try {
    localStorage.setItem(LS_KEY_OPERARIOS, JSON.stringify(operarios));
  } catch (_) {}
}

export async function fetchOperarios() {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('operarios')
        .select('*')
        .order('id', { ascending: true });
      if (!error && data && data.length > 0) return { data, fromSupabase: true };
    } catch (e) { console.warn('Fallback a localStorage/mock operarios:', e); }
  }
  const local = getOperariosLocal();
  if (local) return { data: local, fromSupabase: false };
  setOperariosLocal(mockOperarios);
  return { data: mockOperarios, fromSupabase: false };
}

export async function insertOperario(operario) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('operarios').insert([operario]).select().single();
      if (!error && data) return { data, error: null };
    } catch (e) {}
  }
  const current = getOperariosLocal() || mockOperarios;
  const newItem = { ...operario, id: operario.id || `OP-${String(Date.now()).slice(-4)}` };
  const updated = [...current, newItem];
  setOperariosLocal(updated);
  return { data: newItem, error: null };
}

export async function updateOperario(id, operario) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('operarios').update(operario).eq('id', id).select().single();
      if (!error && data) return { data, error: null };
    } catch (e) {}
  }
  const current = getOperariosLocal() || mockOperarios;
  const updated = current.map(o => o.id === id ? { ...o, ...operario } : o);
  setOperariosLocal(updated);
  return { data: updated.find(o => o.id === id), error: null };
}

export async function deleteOperario(id) {
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from('operarios').delete().eq('id', id);
      if (!error) return { error: null };
    } catch (e) {}
  }
  const current = getOperariosLocal() || mockOperarios;
  const updated = current.filter(o => o.id !== id);
  setOperariosLocal(updated);
  return { error: null };
}
