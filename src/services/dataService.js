import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { lineas as mockLineas } from '@/data/mockLineas';
import { alertas as mockAlertas } from '@/data/mockAlertas';
import { paradasTurno as mockParadas, paradasPredeterminadasIniciales } from '@/data/mockParadas';
import { ordenesSecuencia as mockSecuencia } from '@/data/mockSecuencia';
import { defectosPorCausa as mockDefectos, retrabajos as mockRetrabajos, reclamaciones as mockReclamaciones, scraps as mockScraps } from '@/data/mockCalidad';
import { produccionHistorica as mockProduccion } from '@/data/mockProduccion';
import { materiales as mockMateriasPrimas } from '@/data/mockMaterias';
import { kpis as mockKpis } from '@/data/mockDashboard';
import { historialProduccion as mockHistorial } from '@/data/mockHistorial';
import { mockProductos } from '@/data/mockProductos';
import { operarios as mockOperarios } from '@/data/mockOperarios';
import { ordenesTrabajoIniciales, activosJerarquia as mockActivos, planesPreventivosIniciales, sensoresPredictivosIniciales, repuestosAlmacenIniciales } from '@/data/mockMantenimiento';

// ─── helpers ────────────────────────────────────────────────────────────────

export function getCurrentShiftInfo() {
  const now = new Date();
  const hrs = now.getHours();
  const mins = now.getMinutes();

  let shift = 'Mañana';
  let startHr = 6;
  let endHr = 14;
  let label = 'Mañana (06:00 - 14:00)';
  let shortLabel = 'Mañana 06:00-14:00';

  if (hrs >= 14 && hrs < 22) {
    shift = 'Tarde';
    startHr = 14;
    endHr = 22;
    label = 'Tarde (14:00 - 22:00)';
    shortLabel = 'Tarde 14:00-22:00';
  } else if (hrs >= 22 || hrs < 6) {
    shift = 'Noche';
    startHr = 22;
    endHr = 6;
    label = 'Noche (22:00 - 06:00)';
    shortLabel = 'Noche 22:00-06:00';
  }

  let remMins = (endHr - hrs) * 60 - mins;
  if (remMins < 0) remMins += 24 * 60;
  const remH = Math.floor(remMins / 60);
  const remM = remMins % 60;
  const tiempoRestante = remH > 0 || remM > 0 ? `${remH}h ${remM.toString().padStart(2, '0')}m` : 'Completado';

  const dateStr = now.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return {
    shift,        // 'Mañana' | 'Tarde' | 'Noche'
    startHr,      // 6 | 14 | 22
    endHr,        // 14 | 22 | 6
    label,        // 'Mañana (06:00 - 14:00)' | 'Tarde (14:00 - 22:00)' | 'Noche (22:00 - 06:00)'
    shortLabel,   // 'Mañana 06:00-14:00' | 'Tarde 14:00-22:00' | 'Noche 22:00-06:00'
    horario: `${startHr.toString().padStart(2, '0')}:00 — ${endHr.toString().padStart(2, '0')}:00`,
    tiempoRestante,
    tiempoRestanteLabel: `Hasta fin de turno ${endHr.toString().padStart(2, '0')}:00`,
    dateStr
  };
}

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

export function getImagenGuardada(key) {
  if (!key) return null;
  try {
    const mapStr = localStorage.getItem('mes_imagenes_asociadas');
    if (mapStr) {
      const map = JSON.parse(mapStr);
      if (map[key]) return map[key];
    }
  } catch (_) {}
  return null;
}

export async function compressImageHelper(dataUrl, maxDim = 400, quality = 0.65) {
  if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image')) return dataUrl;
  if (dataUrl.length < 35000) return dataUrl;
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w = img.width;
      let h = img.height;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      const compressed = canvas.toDataURL('image/jpeg', quality);
      resolve(compressed);
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export function setImagenGuardada(key, dataUrl) {
  if (!key) return;
  try {
    const mapStr = localStorage.getItem('mes_imagenes_asociadas');
    const map = mapStr ? JSON.parse(mapStr) : {};
    if (dataUrl) {
      map[key] = dataUrl;
    } else {
      delete map[key];
    }
    try {
      localStorage.setItem('mes_imagenes_asociadas', JSON.stringify(map));
    } catch (e) {
      // QuotaExceededError: Liberar espacio borrando las entradas más pesadas y antiguas (excepto la actual)
      const keys = Object.keys(map).filter(k => k !== key && k !== String(key));
      keys.sort((a, b) => (map[b]?.length || 0) - (map[a]?.length || 0));
      for (let i = 0; i < Math.ceil(keys.length / 2); i++) {
        if (keys[i]) delete map[keys[i]];
      }
      try {
        localStorage.setItem('mes_imagenes_asociadas', JSON.stringify(map));
      } catch (_) {}
    }
  } catch (e) {
    console.warn('Error al guardar imagen en localStorage:', e);
  }
}

export function mapMaterial(m) {
  if (!m) return m;
  const img = getImagenGuardada(m.codigo) || getImagenGuardada(m.id) || m.imagen || '';
  if (img && !m.imagen) m.imagen = img;
  return {
    ...m,
    stockActual: m.stock_actual ?? m.stockActual ?? 0,
    stockMinimo: m.stock_minimo ?? m.stockMinimo ?? 0,
    stockMaximo: m.stock_maximo ?? m.stockMaximo ?? 0,
    pedidoPendiente: m.pedido_pendiente ?? m.pedidoPendiente ?? 0,
    fechaEntrega: m.fecha_entrega ?? m.fechaEntrega,
    stockReservado: m.stock_reservado ?? m.stockReservado ?? 0,
    imagen: img,
  };
}

export function mapProducto(p) {
  if (!p) return p;
  const img = getImagenGuardada(p.codigo) || getImagenGuardada(p.id) || p.imagen || '';
  const bom = (p && Array.isArray(p.bom)) ? p.bom.map(b => ({
    ...b,
    imagen: getImagenGuardada(b.codigo) || b.imagen || ''
  })) : p.bom;
  return {
    ...p,
    imagen: img,
    bom: bom
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
    stock_reservado: m.stockReservado ?? m.stock_reservado ?? 0,
    imagen: m.imagen,
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
    gantt_id: s.ganttId ?? s.gantt_id ?? null,
    linea_asignada: s.lineaAsignada ?? s.linea_asignada ?? null,
    linea_nombre: s.lineaNombre ?? s.linea_nombre ?? null,
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

function getParadasTurnoLocal() { try { const r = localStorage.getItem('mes_paradas_turno'); return r ? JSON.parse(r) : null; } catch (_) { return null; } }
function setParadasTurnoLocal(d) { try { localStorage.setItem('mes_paradas_turno', JSON.stringify(d)); } catch (_) {} }

function getParadasPredeterminadasLocal() { try { const r = localStorage.getItem('mes_paradas_predeterminadas'); return r ? JSON.parse(r) : null; } catch (_) { return null; } }
function setParadasPredeterminadasLocal(d) { try { localStorage.setItem('mes_paradas_predeterminadas', JSON.stringify(d)); } catch (_) {} }

export async function fetchParadas() {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('paradas').select('*').order('id', { ascending: true });
      if (!error && data && data.length > 0) return { data, fromSupabase: true };
    } catch (e) {}
  }
  const local = getParadasTurnoLocal();
  if (local && Array.isArray(local) && local.length > 0) return { data: local, fromSupabase: false };
  setParadasTurnoLocal(mockParadas);
  return { data: mockParadas, fromSupabase: false };
}

export async function fetchParadasPredeterminadas() {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('paradas_predeterminadas').select('*').order('codigo', { ascending: true });
      if (!error && data && data.length > 0) return { data, fromSupabase: true };
    } catch (e) {}
  }
  const local = getParadasPredeterminadasLocal();
  if (local && Array.isArray(local) && local.length > 0) return { data: local, fromSupabase: false };
  setParadasPredeterminadasLocal(paradasPredeterminadasIniciales);
  return { data: paradasPredeterminadasIniciales, fromSupabase: false };
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

function getMateriasLocal() {
  try {
    const r = localStorage.getItem('mes_materias_primas');
    return r ? JSON.parse(r) : null;
  } catch (_) { return null; }
}

function setMateriasLocal(list) {
  try { localStorage.setItem('mes_materias_primas', JSON.stringify(list)); } catch (_) {}
}

export async function fetchMateriasPrimas() {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('materias_primas').select('*').order('id', { ascending: true });
      if (!error && data && data.length > 0) return { data: data.map(mapMaterial), fromSupabase: true };
    } catch (e) {}
  }
  const local = getMateriasLocal();
  if (local) return { data: local.map(mapMaterial), fromSupabase: false };
  const inicial = mockMateriasPrimas.map(mapMaterial);
  setMateriasLocal(inicial);
  return { data: inicial, fromSupabase: false };
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
      if (!error && data) {
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('lineas_updated'));
        return { data: mapLinea(data), error: null };
      }
    } catch (e) {}
  }
  const current = getLineasLocal() || mockLineas;
  const newItem = { ...linea, id: linea.id || `L${Date.now()}` };
  const updated = [...current, newItem];
  setLineasLocal(updated);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('lineas_updated'));
  return { data: newItem, error: null };
}

export async function updateLinea(id, linea) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('lineas').update(lineaToDb(linea)).eq('id', id).select().single();
      if (!error && data) {
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('lineas_updated'));
        return { data: mapLinea(data), error: null };
      }
    } catch (e) {}
  }
  const current = getLineasLocal() || mockLineas;
  const updated = current.map(l => l.id === id ? { ...l, ...linea } : l);
  setLineasLocal(updated);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('lineas_updated'));
  return { data: updated.find(l => l.id === id), error: null };
}

export async function deleteLinea(id) {
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from('lineas').delete().eq('id', id);
      if (!error) {
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('lineas_updated'));
        return { error: null };
      }
    } catch (e) {}
  }
  const current = getLineasLocal() || mockLineas;
  setLineasLocal(current.filter(l => l.id !== id));
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('lineas_updated'));
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
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('paradas').insert([parada]).select().single();
      if (!error && data) {
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('paradas_updated'));
        return { data, error: null };
      }
    } catch (e) {}
  }
  const current = getParadasTurnoLocal() || mockParadas;
  const newItem = { ...parada, id: parada.id || Date.now() };
  const updated = [...current, newItem];
  setParadasTurnoLocal(updated);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('paradas_updated'));
  return { data: newItem, error: null };
}

export async function updateParada(id, parada) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('paradas').update(parada).eq('id', id).select().single();
      if (!error && data) {
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('paradas_updated'));
        return { data, error: null };
      }
    } catch (e) {}
  }
  const current = getParadasTurnoLocal() || mockParadas;
  const updated = current.map(p => p.id === id ? { ...p, ...parada } : p);
  setParadasTurnoLocal(updated);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('paradas_updated'));
  return { data: updated.find(p => p.id === id), error: null };
}

export async function deleteParada(id) {
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from('paradas').delete().eq('id', id);
      if (!error) {
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('paradas_updated'));
        return { error: null };
      }
    } catch (e) {}
  }
  const current = getParadasTurnoLocal() || mockParadas;
  setParadasTurnoLocal(current.filter(p => p.id !== id));
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('paradas_updated'));
  return { error: null };
}

export async function insertParadaPredeterminada(item) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('paradas_predeterminadas').insert([item]).select().single();
      if (!error && data) {
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('paradas_updated'));
        return { data, error: null };
      }
    } catch (e) {}
  }
  const current = getParadasPredeterminadasLocal() || paradasPredeterminadasIniciales;
  const newItem = { ...item, id: item.id || `PP_${Date.now()}` };
  const updated = [...current, newItem];
  setParadasPredeterminadasLocal(updated);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('paradas_updated'));
  return { data: newItem, error: null };
}

export async function updateParadaPredeterminada(id, item) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('paradas_predeterminadas').update(item).eq('id', id).select().single();
      if (!error && data) {
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('paradas_updated'));
        return { data, error: null };
      }
    } catch (e) {}
  }
  const current = getParadasPredeterminadasLocal() || paradasPredeterminadasIniciales;
  const updated = current.map(p => p.id === id ? { ...p, ...item } : p);
  setParadasPredeterminadasLocal(updated);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('paradas_updated'));
  return { data: updated.find(p => p.id === id), error: null };
}

export async function deleteParadaPredeterminada(id) {
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from('paradas_predeterminadas').delete().eq('id', id);
      if (!error) {
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('paradas_updated'));
        return { error: null };
      }
    } catch (e) {}
  }
  const current = getParadasPredeterminadasLocal() || paradasPredeterminadasIniciales;
  setParadasPredeterminadasLocal(current.filter(p => p.id !== id));
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('paradas_updated'));
  return { error: null };
}

// ─── WRITE — Secuencia ───────────────────────────────────────────────────────

export async function insertSecuencia(orden) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('secuencia').insert([secuenciaToDb(orden)]).select().single();
      if (!error && data) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('secuencia_updated'));
          window.dispatchEvent(new CustomEvent('secuencia_reordenada'));
        }
        return { data: mapSecuencia(data), error: null };
      }
    } catch (e) {}
  }
  const current = getSecuenciaLocal() || mockSecuencia;
  const newItem = { ...orden, id: orden.id || Date.now(), secuencia: orden.secuencia || current.length + 1 };
  const updated = [...current, newItem];
  setSecuenciaLocal(updated);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('secuencia_updated'));
    window.dispatchEvent(new CustomEvent('secuencia_reordenada'));
  }
  return { data: newItem, error: null };
}

export async function updateSecuencia(id, orden) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('secuencia').update(secuenciaToDb(orden)).eq('id', id).select().single();
      if (!error && data) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('secuencia_updated'));
          window.dispatchEvent(new CustomEvent('secuencia_reordenada'));
        }
        return { data: mapSecuencia(data), error: null };
      }
    } catch (e) {}
  }
  const current = getSecuenciaLocal() || mockSecuencia;
  const updated = current.map(o => o.id === id ? { ...o, ...orden } : o);
  setSecuenciaLocal(updated);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('secuencia_updated'));
    window.dispatchEvent(new CustomEvent('secuencia_reordenada'));
  }
  return { data: updated.find(o => o.id === id), error: null };
}

export async function deleteSecuencia(id) {
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from('secuencia').delete().eq('id', id);
      if (!error) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('secuencia_updated'));
          window.dispatchEvent(new CustomEvent('secuencia_reordenada'));
        }
        return { error: null };
      }
    } catch (e) {}
  }
  const current = getSecuenciaLocal() || mockSecuencia;
  setSecuenciaLocal(current.filter(o => o.id !== id));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('secuencia_updated'));
    window.dispatchEvent(new CustomEvent('secuencia_reordenada'));
  }
  return { error: null };
}

// ─── WRITE — Materias Primas ─────────────────────────────────────────────────

export async function insertMaterial(material) {
  let img = material.imagen;
  if (img && typeof img === 'string' && img.startsWith('data:image')) {
    img = await compressImageHelper(img, 400, 0.65);
  }
  const newMat = mapMaterial({ ...material, imagen: img, id: material.id || Date.now(), stockReservado: material.stockReservado || 0 });
  if (newMat.imagen !== undefined) {
    setImagenGuardada(newMat.codigo, newMat.imagen);
    setImagenGuardada(newMat.id, newMat.imagen);
  }
  const local = (getMateriasLocal() || mockMateriasPrimas.map(mapMaterial));
  local.push(newMat);
  setMateriasLocal(local);

  if (isSupabaseConfigured()) {
    try {
      const dbPayload = materialToDb(newMat);
      let { data, error } = await supabase.from('materias_primas').insert([dbPayload]).select().single();
      if (error && (error.code === 'PGRST204' || error.message?.includes('column'))) {
        delete dbPayload.imagen;
        delete dbPayload.stock_reservado;
        const fallback = await supabase.from('materias_primas').insert([dbPayload]).select().single();
        data = fallback.data;
        error = fallback.error;
      }
      if (!error && data) {
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('materiales_updated'));
        return { data: mapMaterial({ ...data, imagen: newMat.imagen }), error: null };
      }
    } catch (e) { console.warn('Supabase insert error:', e); }
  }
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('materiales_updated'));
  return { data: newMat, error: null };
}

export async function updateMaterial(id, material) {
  let img = material.imagen;
  if (img && typeof img === 'string' && img.startsWith('data:image')) {
    img = await compressImageHelper(img, 400, 0.65);
  }
  const nextMat = { ...material };
  if (img !== undefined) nextMat.imagen = img;

  if (nextMat.imagen !== undefined) {
    setImagenGuardada(nextMat.codigo || material.codigo, nextMat.imagen);
    setImagenGuardada(id, nextMat.imagen);
  }
  const local = (getMateriasLocal() || mockMateriasPrimas.map(mapMaterial));
  let updated = null;
  const next = local.map(m => {
    if (m.id === id) {
      updated = mapMaterial({ ...m, ...nextMat });
      return updated;
    }
    return m;
  });
  setMateriasLocal(next);

  if (isSupabaseConfigured()) {
    try {
      const dbPayload = materialToDb(nextMat);
      delete dbPayload.id; // Evitar conflictos al actualizar primary key en PATCH
      let { data, error } = await supabase.from('materias_primas').update(dbPayload).eq('id', id).select().single();
      if (error && (error.code === 'PGRST204' || error.message?.includes('column') || error.status === 400)) {
        console.warn('Supabase PATCH 400/PGRST204 (columna faltante en tabla materias_primas o payload largo). Intentando fallback sin columnas nuevas...');
        delete dbPayload.imagen;
        delete dbPayload.stock_reservado;
        const fallback = await supabase.from('materias_primas').update(dbPayload).eq('id', id).select().single();
        data = fallback.data;
        error = fallback.error;
      }
      if (!error && data) {
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('materiales_updated'));
        return { data: mapMaterial({ ...data, imagen: nextMat.imagen }), error: null };
      }
    } catch (e) { console.warn('Supabase update error:', e); }
  }
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('materiales_updated'));
  return { data: updated || mapMaterial({ id, ...nextMat }), error: null };
}

export async function deleteMaterial(id) {
  if (isSupabaseConfigured()) {
    await supabase.from('materias_primas').delete().eq('id', id);
  }
  const local = (getMateriasLocal() || mockMateriasPrimas.map(mapMaterial)).filter(m => m.id !== id);
  setMateriasLocal(local);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('materiales_updated'));
  return { error: null };
}

// ─── BOM Y DISPONIBILIDAD DE MATERIALES PARA PLANIFICACIÓN / SECUENCIA ──────

export const BOM_PRODUCTOS = {
  'BAT-48V-100Ah': [
    { codigo: 'CEL-LFP-48V', descripcion: 'Celda LFP 48V 50Ah', factor: 0.16, unidad: 'ud' },
    { codigo: 'CON-MC4-001', descripcion: 'Conector MC4 macho-hembra', factor: 0.20, unidad: 'par' },
    { codigo: 'CAJ-ALU-48V', descripcion: 'Caja aluminio 48V serie B', factor: 0.10, unidad: 'ud' }
  ],
  'BAT-12V-100Ah': [
    { codigo: 'CON-MC4-001', descripcion: 'Conector MC4 macho-hembra', factor: 0.20, unidad: 'par' },
    { codigo: 'CAB-1MM-RJ', descripcion: 'Cable señal 1mm² trenzado', factor: 0.02, unidad: 'rollo' }
  ],
  'BAT-24V-100Ah': [
    { codigo: 'CON-MC4-001', descripcion: 'Conector MC4 macho-hembra', factor: 0.30, unidad: 'par' },
    { codigo: 'ETI-LBL-A4', descripcion: 'Etiquetas identificación A4', factor: 0.005, unidad: 'caja' }
  ],
  'BAT-24V-200Ah': [
    { codigo: 'CEL-LFP-48V', descripcion: 'Celda LFP 48V 50Ah', factor: 0.15, unidad: 'ud' },
    { codigo: 'CON-MC4-001', descripcion: 'Conector MC4 macho-hembra', factor: 0.25, unidad: 'par' }
  ],
  'BAT-48V-200Ah': [
    { codigo: 'CEL-LFP-48V', descripcion: 'Celda LFP 48V 50Ah', factor: 0.16, unidad: 'ud' },
    { codigo: 'BMS-48V-100', descripcion: 'BMS 48V 100A con balanceo', factor: 0.04, unidad: 'ud' },
    { codigo: 'CAJ-ALU-48V', descripcion: 'Caja aluminio 48V serie B', factor: 0.10, unidad: 'ud' }
  ],
  'BAT-48V-300Ah-PRO': [
    { codigo: 'CEL-LFP-48V', descripcion: 'Celda LFP 48V 50Ah', factor: 0.20, unidad: 'ud' },
    { codigo: 'BMS-48V-100', descripcion: 'BMS 48V 100A con balanceo', factor: 0.05, unidad: 'ud' }
  ],
  'BAT-24V-150Ah-MAR': [
    { codigo: 'TER-CAL-025', descripcion: 'Terminal calibre 25mm²', factor: 0.02, unidad: 'caja' },
    { codigo: 'CON-MC4-001', descripcion: 'Conector MC4 macho-hembra', factor: 0.20, unidad: 'par' }
  ],
  'BAT-12V-50Ah-ULTRA': [
    { codigo: 'CAB-6MM-001', descripcion: 'Cable 6mm² negro (rollo 100m)', factor: 0.004, unidad: 'rollo' },
    { codigo: 'CON-MC4-001', descripcion: 'Conector MC4 macho-hembra', factor: 0.15, unidad: 'par' }
  ],
  'BAT-48V-100Ah-RACK': [
    { codigo: 'CEL-LFP-48V', descripcion: 'Celda LFP 48V 50Ah', factor: 0.16, unidad: 'ud' },
    { codigo: 'CAB-1MM-RJ', descripcion: 'Cable señal 1mm² trenzado', factor: 0.03, unidad: 'rollo' }
  ]
};

export function getTodasLasOrdenesParaConsumo() {
  let gantt = [];
  let secuencia = [];
  try {
    const rG = localStorage.getItem('mes_planificacion_gantt');
    if (rG) gantt = JSON.parse(rG);
  } catch (_) {}
  try {
    const rS = localStorage.getItem('mes_secuencia');
    if (rS) secuencia = JSON.parse(rS);
  } catch (_) {}

  const seen = new Set();
  const result = [];
  for (const o of gantt) {
    if (!o) continue;
    seen.add(o.id);
    result.push(o);
  }
  for (const s of secuencia) {
    if (!s) continue;
    if (s.ganttId && seen.has(s.ganttId)) continue;
    if (seen.has(s.id)) continue;
    seen.add(s.id);
    result.push(s);
  }
  return result;
}

export function calcularTodosConsumosComprometidos({ ordenes = null, productos = null } = {}) {
  const allOrders = ordenes || getTodasLasOrdenesParaConsumo();
  let allProds = productos;
  if (!allProds) {
    try {
      const rP = localStorage.getItem('mes_productos_catalogo');
      allProds = rP ? JSON.parse(rP) : null;
    } catch (_) {}
  }
  if (!allProds || !Array.isArray(allProds)) {
    allProds = [];
  }

  const consumoMap = {}; // { codigoMat: totalCantidadComprometida }

  for (const o of allOrders) {
    const ref = o.ref || o.referencia;
    if (!ref) continue;
    const prod = allProds.find(p => p.codigo === ref);
    const bom = (prod && Array.isArray(prod.bom)) ? prod.bom : (BOM_PRODUCTOS[ref] || null);
    if (!bom || !Array.isArray(bom) || (prod && prod.bomPendiente)) continue;

    const cantOrden = Number(o.cantidad) || 500;
    for (const item of bom) {
      if (!item.codigo) continue;
      const nec = Math.ceil(cantOrden * Number(item.factor || 0));
      consumoMap[item.codigo] = (consumoMap[item.codigo] || 0) + nec;
    }
  }
  return consumoMap;
}

export function calcularDisponibilidadOrden(orden, listaMateriales = [], listaProductos = null, mapaConsumo = null) {
  const ref = orden.ref || orden.referencia || 'BAT-48V-100Ah';
  const cant = Number(orden.cantidad) || 500;
  
  let prods = listaProductos;
  if (!prods) {
    try {
      const rP = localStorage.getItem('mes_productos_catalogo');
      prods = rP ? JSON.parse(rP) : null;
    } catch (_) {}
  }
  const prod = (prods && Array.isArray(prods)) ? prods.find(p => p.codigo === ref) : null;

  // Si el producto está marcado con bomPendiente o su BOM está vacío explícitamente:
  if (prod && (prod.bomPendiente || (Array.isArray(prod.bom) && prod.bom.length === 0))) {
    return {
      estado: 'gris',
      colorBadge: 'bg-slate-700 text-slate-300 border-slate-500 font-bold shadow-sm',
      label: '⚪ Sin datos de material (BOM)',
      esCritico: false,
      sinBom: true,
      componentes: []
    };
  }

  const bom = (prod && Array.isArray(prod.bom) && prod.bom.length > 0)
    ? prod.bom
    : (BOM_PRODUCTOS[ref] || [
        { codigo: 'CEL-LFP-48V', descripcion: 'Celda LFP 48V 50Ah', factor: 0.16, unidad: 'ud' },
        { codigo: 'CON-MC4-001', descripcion: 'Conector MC4 macho-hembra', factor: 0.20, unidad: 'par' }
      ]);

  const consumoTotalMap = mapaConsumo || calcularTodosConsumosComprometidos({ productos: prods });

  let tieneFaltaCritica = false;
  let tieneParcialOMedia = false;
  const componentes = [];

  for (const item of bom) {
    const mat = listaMateriales.find(m => m.codigo === item.codigo) || {
      id: Date.now() + Math.random(),
      codigo: item.codigo,
      descripcion: item.descripcion || item.codigo,
      unidad: item.unidad || 'ud',
      stockActual: 100,
      stockReservado: 0,
      criticidad: 'media',
      proveedor: 'Proveedor Estándar'
    };

    const compTotal = (consumoTotalMap && typeof consumoTotalMap[mat.codigo] === 'number')
      ? consumptionOrZero(consumoTotalMap[mat.codigo])
      : Number(mat.stockReservado || 0);

    const stockActual = Number(mat.stockActual || 0);
    const disponibleReal = stockActual - compTotal;
    const cantNecesaria = Math.max(1, Math.ceil(cant * Number(item.factor || 0)));

    let estadoItem = 'OK';
    if (disponibleReal >= 0) {
      estadoItem = 'OK';
    } else if (stockActual > 0 && (stockActual - (compTotal - cantNecesaria) > 0)) {
      estadoItem = 'Parcial';
      if (mat.criticidad === 'alta') {
        tieneFaltaCritica = true;
      } else {
        tieneParcialOMedia = true;
      }
    } else {
      estadoItem = 'Falta';
      if (mat.criticidad === 'alta') {
        tieneFaltaCritica = true;
      } else {
        tieneParcialOMedia = true;
      }
    }

    componentes.push({
      materialId: mat.id,
      codigo: mat.codigo,
      descripcion: mat.descripcion || item.descripcion,
      unidad: mat.unidad || item.unidad,
      criticidad: mat.criticidad || 'media',
      proveedor: mat.proveedor || 'Sin proveedor',
      cantidadNecesaria: cantNecesaria,
      stockDisponible: disponibleReal,
      stockActual: stockActual,
      comprometidoTotal: compTotal,
      estadoItem
    });
  }

  if (tieneFaltaCritica) {
    return {
      estado: 'rojo',
      colorBadge: 'bg-red-500/20 text-red-400 border-red-500/40 font-black animate-pulse shadow-sm shadow-red-900/50',
      label: '🔴 Falta Crítico',
      esCritico: true,
      componentes
    };
  }

  if (tieneParcialOMedia) {
    return {
      estado: 'ambar',
      colorBadge: 'bg-amber-500/20 text-amber-400 border-amber-500/40 font-black',
      label: '🟡 Stock Parcial',
      esCritico: false,
      componentes
    };
  }

  return {
    estado: 'verde',
    colorBadge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-black',
    label: '🟢 Stock OK',
    esCritico: false,
    componentes
  };
}

function consumptionOrZero(val) {
  return typeof val === 'number' && !isNaN(val) ? val : 0;
}

export async function updateReservaMaterialesOrden(orden, accion = 'reservar') {
  const { data: lista } = await fetchMateriasPrimas();
  if (!lista || !Array.isArray(lista)) return;

  const ref = orden.ref || orden.referencia || 'BAT-48V-100Ah';
  const cant = Number(orden.cantidad) || 500;
  
  let prods = null;
  try {
    const rP = localStorage.getItem('mes_productos_catalogo');
    if (rP) prods = JSON.parse(rP);
  } catch (_) {}
  const prod = (prods && Array.isArray(prods)) ? prods.find(p => p.codigo === ref) : null;
  const bom = (prod && Array.isArray(prod.bom)) ? prod.bom : (BOM_PRODUCTOS[ref] || BOM_PRODUCTOS['BAT-48V-100Ah']);

  for (const item of bom) {
    const mat = lista.find(m => m.codigo === item.codigo);
    if (mat) {
      const cantNecesaria = Math.max(1, Math.ceil(cant * Number(item.factor || 0)));
      const currentRes = Number(mat.stockReservado) || 0;
      const nextRes = accion === 'reservar'
        ? currentRes + cantNecesaria
        : Math.max(0, currentRes - cantNecesaria);

      await updateMaterial(mat.id, { stockReservado: nextRes });
    }
  }

  window.dispatchEvent(new CustomEvent('materiales_updated', { detail: { ordenId: orden.id, accion } }));
}

// ─── WRITE — Calidad ─────────────────────────────────────────────────────────

export async function insertCalidad(defecto) {
  if (!isSupabaseConfigured()) return { error: 'Sin conexión' };
  const { data, error } = await supabase.from('calidad').insert([defecto]).select().single();
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('calidad_updated'));
  return { data, error };
}

export async function updateCalidad(id, defecto) {
  if (!isSupabaseConfigured()) return { error: 'Sin conexión' };
  const { data, error } = await supabase.from('calidad').update(defecto).eq('id', id).select().single();
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('calidad_updated'));
  return { data, error };
}

export async function deleteCalidad(id) {
  if (!isSupabaseConfigured()) return { error: 'Sin conexión' };
  const { error } = await supabase.from('calidad').delete().eq('id', id);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('calidad_updated'));
  return { error };
}

// ─── WRITE — Produccion ──────────────────────────────────────────────────────

export async function insertProduccion(item) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('produccion').insert([item]).select().single();
      if (!error && data) {
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('produccion_updated'));
        return { data, error: null };
      }
    } catch (e) {}
  }
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('produccion_updated'));
  return { data: item, error: null };
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
      if (!error && data && data.length > 0) return { data: data.map(mapProducto), fromSupabase: true };
    } catch (e) { console.warn('Fallback a localStorage/mock productos:', e); }
  }
  // Intentar localStorage primero, si no usar mock
  const local = getProductosLocal();
  if (local) return { data: local.map(mapProducto), fromSupabase: false };
  // Inicializar localStorage con mock
  const inicial = mockProductos.map(mapProducto);
  setProductosLocal(inicial);
  return { data: inicial, fromSupabase: false };
}

export async function insertProducto(producto) {
  let img = producto.imagen;
  if (img && typeof img === 'string' && img.startsWith('data:image')) {
    img = await compressImageHelper(img, 400, 0.65);
  }
  const nextProd = { ...producto };
  if (img !== undefined) nextProd.imagen = img;

  if (nextProd.imagen !== undefined) {
    setImagenGuardada(nextProd.codigo, nextProd.imagen);
    if (nextProd.id) setImagenGuardada(nextProd.id, nextProd.imagen);
  }
  if (Array.isArray(nextProd.bom)) {
    nextProd.bom.forEach(b => {
      if (b.imagen !== undefined) setImagenGuardada(b.codigo, b.imagen);
    });
  }
  const current = getProductosLocal() || mockProductos.map(mapProducto);
  const newItem = mapProducto({ ...nextProd, id: nextProd.id || `P${Date.now()}` });
  const updated = [...current, newItem];
  setProductosLocal(updated);

  if (isSupabaseConfigured()) {
    try {
      const dbPayload = { ...newItem };
      let { data, error } = await supabase.from('productos').insert([dbPayload]).select().single();
      if (error && (error.code === 'PGRST204' || error.message?.includes('column') || error.status === 400)) {
        delete dbPayload.imagen;
        delete dbPayload.bom;
        delete dbPayload.bomPendiente;
        delete dbPayload.tiempoCiclo;
        delete dbPayload.objetivoHora;
        const fallback = await supabase.from('productos').insert([dbPayload]).select().single();
        data = fallback.data;
        error = fallback.error;
      }
      if (!error && data) {
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('productos_updated'));
        return { data: mapProducto({ ...data, imagen: newItem.imagen, bom: newItem.bom }), error: null };
      }
    } catch (e) { console.warn('Supabase insertProducto error:', e); }
  }
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('productos_updated'));
  return { data: newItem, error: null };
}

export async function updateProducto(id, producto) {
  let img = producto.imagen;
  if (img && typeof img === 'string' && img.startsWith('data:image')) {
    img = await compressImageHelper(img, 400, 0.65);
  }
  const nextProd = { ...producto };
  if (img !== undefined) nextProd.imagen = img;

  if (nextProd.imagen !== undefined) {
    setImagenGuardada(nextProd.codigo || producto.codigo, nextProd.imagen);
    setImagenGuardada(id, nextProd.imagen);
  }
  if (Array.isArray(nextProd.bom)) {
    nextProd.bom.forEach(b => {
      if (b.imagen !== undefined) setImagenGuardada(b.codigo, b.imagen);
    });
  }
  const current = getProductosLocal() || mockProductos.map(mapProducto);
  const updated = current.map(p => p.id === id ? mapProducto({ ...p, ...nextProd }) : p);
  setProductosLocal(updated);

  if (isSupabaseConfigured()) {
    try {
      const dbPayload = { ...nextProd };
      delete dbPayload.id; // Evitar conflictos al actualizar primary key en PATCH
      let { data, error } = await supabase.from('productos').update(dbPayload).eq('id', id).select().single();
      if (error && (error.code === 'PGRST204' || error.message?.includes('column') || error.status === 400)) {
        console.warn('Supabase PATCH 400/PGRST204 en productos. Intentando fallback sin columnas nuevas...');
        delete dbPayload.imagen;
        delete dbPayload.bom;
        delete dbPayload.bomPendiente;
        const fallback = await supabase.from('productos').update(dbPayload).eq('id', id).select().single();
        data = fallback.data;
        error = fallback.error;
      }
      if (!error && data) {
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('productos_updated'));
        return { data: mapProducto({ ...data, imagen: nextProd.imagen, bom: nextProd.bom }), error: null };
      }
    } catch (e) { console.warn('Supabase updateProducto error:', e); }
  }
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('productos_updated'));
  return { data: updated.find(p => p.id === id) || mapProducto({ id, ...nextProd }), error: null };
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
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('productos_updated'));
  return { error: null };
}

// ─── READ/WRITE — Familias de Productos ──────────────────────────────────────
const LS_KEY_FAMILIAS = 'mes_familias_productos';

export const mockFamilias = [
  { id: 'fam-1', nombre: 'Baterías 48V', descripcion: 'Sistemas de acumulación LFP de 48 Voltios', color: '#3b82f6' },
  { id: 'fam-2', nombre: 'Baterías 24V', descripcion: 'Módulos compactos de 24 Voltios para AGV y solar', color: '#10b981' },
  { id: 'fam-3', nombre: 'Cargadores', descripcion: 'Sistemas inteligentes de carga rápida y balanceo', color: '#f59e0b' },
  { id: 'fam-4', nombre: 'Accesorios', descripcion: 'Kits de cableado, BMS y conectores de potencia', color: '#8b5cf6' },
  { id: 'fam-5', nombre: 'General', descripcion: 'Productos de uso general y componentes estándar', color: '#64748b' }
];

function getFamiliasLocal() {
  try {
    const raw = localStorage.getItem(LS_KEY_FAMILIAS);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

function setFamiliasLocal(familias) {
  try {
    localStorage.setItem(LS_KEY_FAMILIAS, JSON.stringify(familias));
  } catch (e) {}
}

export async function fetchFamilias() {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('familias_productos').select('*').order('nombre', { ascending: true });
      if (!error && data && data.length > 0) return { data, fromSupabase: true };
    } catch (e) { console.warn('Fallback a localStorage en familias:', e); }
  }
  const local = getFamiliasLocal();
  if (local && local.length > 0) return { data: local, fromSupabase: false };
  setFamiliasLocal(mockFamilias);
  return { data: mockFamilias, fromSupabase: false };
}

export async function insertFamilia(familia) {
  const payload = { ...familia, id: familia.id || `fam_${Date.now()}` };
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('familias_productos').insert([payload]).select().single();
      if (!error && data) {
        const current = getFamiliasLocal() || mockFamilias;
        setFamiliasLocal([...current, data]);
        window.dispatchEvent(new CustomEvent('familias_updated'));
        return { data, error: null };
      }
    } catch (e) {}
  }
  const current = getFamiliasLocal() || mockFamilias;
  const updated = [...current, payload];
  setFamiliasLocal(updated);
  window.dispatchEvent(new CustomEvent('familias_updated'));
  return { data: payload, error: null };
}

export async function updateFamilia(id, cambios) {
  const current = getFamiliasLocal() || mockFamilias;
  const oldFamilia = current.find(f => f.id === id);
  const oldNombre = oldFamilia ? oldFamilia.nombre : null;

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('familias_productos').update(cambios).eq('id', id).select().single();
      if (!error && data) {
        const updated = current.map(f => f.id === id ? { ...f, ...cambios } : f);
        setFamiliasLocal(updated);
        if (oldNombre && cambios.nombre && oldNombre !== cambios.nombre) {
          await sincronizarCambioNombreFamilia(oldNombre, cambios.nombre);
        }
        window.dispatchEvent(new CustomEvent('familias_updated'));
        return { data, error: null };
      }
    } catch (e) {}
  }
  const updated = current.map(f => f.id === id ? { ...f, ...cambios } : f);
  setFamiliasLocal(updated);
  if (oldNombre && cambios.nombre && oldNombre !== cambios.nombre) {
    await sincronizarCambioNombreFamilia(oldNombre, cambios.nombre);
  }
  window.dispatchEvent(new CustomEvent('familias_updated'));
  return { data: updated.find(f => f.id === id), error: null };
}

async function sincronizarCambioNombreFamilia(oldNombre, newNombre) {
  const prods = getProductosLocal() || mockProductos;
  const modificados = prods.map(p => (p.familia === oldNombre) ? { ...p, familia: newNombre } : p);
  setProductosLocal(modificados);
  window.dispatchEvent(new CustomEvent('productos_updated'));
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('productos').update({ familia: newNombre }).eq('familia', oldNombre);
    } catch (e) {}
  }
}

export async function deleteFamilia(id) {
  const current = getFamiliasLocal() || mockFamilias;
  const target = current.find(f => f.id === id);
  const targetNombre = target ? target.nombre : null;

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('familias_productos').delete().eq('id', id);
    } catch (e) {}
  }
  const updated = current.filter(f => f.id !== id);
  setFamiliasLocal(updated);

  if (targetNombre) {
    await sincronizarCambioNombreFamilia(targetNombre, 'General');
  }
  window.dispatchEvent(new CustomEvent('familias_updated'));
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
  { id: 'G1', codigo: 'OF-2024-001', linea: 'L1', dia: 0, horaInicio: 6, duracion: 4, ref: 'BAT-48V-100Ah', cliente: 'Cliente A', cantidad: 500, materiales: 'Celdas LFP 100Ah (x16), BMS 48V (x1), Carcasa Metálica', fechaCompromiso: '31/05/2024', prioridad: 'normal', color: '#2563eb' },
  { id: 'G2', codigo: 'OF-2024-002', linea: 'L1', dia: 0, horaInicio: 10, duracion: 6, ref: 'BAT-48V-200Ah', cliente: 'Cliente D', cantidad: 800, materiales: 'Celdas LFP 200Ah (x16), BMS Smart 48V, Cableado de potencia', fechaCompromiso: '31/05/2024', prioridad: 'alta', color: '#7c3aed' },
  { id: 'G3', codigo: 'OF-2024-003', linea: 'L2', dia: 0, horaInicio: 6, duracion: 8, ref: 'BAT-24V-200Ah', cliente: 'Cliente B', cantidad: 1200, materiales: 'Celdas NMC 200Ah (x8), BMS 24V, Aislante térmico', fechaCompromiso: '31/05/2024', prioridad: 'normal', color: '#0891b2' },
  { id: 'G4', codigo: 'OF-2024-004', linea: 'L3', dia: 0, horaInicio: 8, duracion: 5, ref: 'BAT-12V-100Ah', cliente: 'Cliente C', cantidad: 600, materiales: 'Celdas LFP 100Ah (x4), BMS Compact 12V, Terminales cobre', fechaCompromiso: '31/05/2024', prioridad: 'normal', color: '#dc2626' },
  { id: 'G5', codigo: 'OF-2024-005', linea: 'L4', dia: 0, horaInicio: 6, duracion: 10, ref: 'BAT-48V-200Ah', cliente: 'Cliente D', cantidad: 1000, materiales: 'Celdas LFP 200Ah (x16), BMS Smart 48V, Carcasa estanca IP67', fechaCompromiso: '31/05/2024', prioridad: 'urgente', color: '#059669' },
  { id: 'G6', codigo: 'OF-2024-006', linea: 'L5', dia: 0, horaInicio: 6, duracion: 8, ref: 'BAT-24V-100Ah', cliente: 'Cliente E', cantidad: 900, materiales: 'Celdas LFP 100Ah (x8), BMS 24V (x1), Conectores Anderson', fechaCompromiso: '31/05/2024', prioridad: 'normal', color: '#d97706' },
  { id: 'G7', codigo: 'OF-2024-007', linea: 'L1', dia: 1, horaInicio: 6, duracion: 8, ref: 'BAT-48V-100Ah', cliente: 'Cliente A', cantidad: 600, materiales: 'Celdas LFP 100Ah (x16), BMS 48V, Carcasa Metálica', fechaCompromiso: '01/06/2024', prioridad: 'normal', color: '#2563eb' },
  { id: 'G8', codigo: 'OF-2024-008', linea: 'L2', dia: 1, horaInicio: 6, duracion: 6, ref: 'BAT-24V-100Ah', cliente: 'Cliente E', cantidad: 750, materiales: 'Celdas LFP 100Ah (x8), BMS 24V, Tornillería M6', fechaCompromiso: '01/06/2024', prioridad: 'alta', color: '#0891b2' },
  { id: 'G9', codigo: 'OF-2024-009', linea: 'L3', dia: 1, horaInicio: 7, duracion: 9, ref: 'BAT-12V-200Ah', cliente: 'Cliente C', cantidad: 1100, materiales: 'Celdas NMC 200Ah (x4), BMS 12V High-Cur, Soporte celda', fechaCompromiso: '01/06/2024', prioridad: 'normal', color: '#dc2626' },
  { id: 'G10', codigo: 'OF-2024-010', linea: 'L4', dia: 1, horaInicio: 6, duracion: 8, ref: 'BAT-48V-100Ah', cliente: 'Cliente A', cantidad: 500, materiales: 'Celdas LFP 100Ah (x16), BMS 48V, Cable flexible 35mm2', fechaCompromiso: '01/06/2024', prioridad: 'normal', color: '#059669' },
  { id: 'G11', codigo: 'OF-2024-011', linea: 'L5', dia: 2, horaInicio: 6, duracion: 7, ref: 'BAT-24V-200Ah', cliente: 'Cliente B', cantidad: 850, materiales: 'Celdas NMC 200Ah (x8), BMS 24V Smart, Aislante Nomex', fechaCompromiso: '02/06/2024', prioridad: 'normal', color: '#d97706' },
  { id: 'G12', codigo: 'OF-2024-012', linea: 'L1', dia: 2, horaInicio: 6, duracion: 6, ref: 'BAT-48V-200Ah', cliente: 'Cliente D', cantidad: 650, materiales: 'Celdas LFP 200Ah (x16), BMS Smart 48V, Chasis Rack 19"', fechaCompromiso: '02/06/2024', prioridad: 'normal', color: '#2563eb' },
  // ── BACKLOG / SIN ASIGNAR A LÍNEA ──────────────────────────────────────────
  { id: 'BK1', codigo: 'OF-2024-101', linea: null, dia: null, horaInicio: 6, duracion: 6, ref: 'BAT-48V-300Ah-PRO', cliente: 'Iberia Energy Corp', cantidad: 450, materiales: 'Celdas LFP 300Ah Prismatic (x16), BMS CAN-Bus 48V, Sensor térmico PT100 (x4), Carcasa Acero Inox', fechaCompromiso: '05/06/2024', prioridad: 'urgente', color: '#dc2626' },
  { id: 'BK2', codigo: 'OF-2024-102', linea: null, dia: null, horaInicio: 6, duracion: 8, ref: 'BAT-24V-150Ah-MAR', cliente: 'Naval & Marine Systems', cantidad: 600, materiales: 'Celdas LFP 150Ah Grado Marino (x8), BMS IP68 Estanco, Bornes latón niquelado, Gel de silicona', fechaCompromiso: '06/06/2024', prioridad: 'alta', color: '#7c3aed' },
  { id: 'BK3', codigo: 'OF-2024-103', linea: null, dia: null, horaInicio: 6, duracion: 5, ref: 'BAT-12V-50Ah-ULTRA', cliente: 'AgriTech Automation', cantidad: 1500, materiales: 'Celdas Cilindricas 21700 (x40), BMS 12V 50A, Carcasa ABS Ignífugo V0, Cableado AWG10', fechaCompromiso: '07/06/2024', prioridad: 'normal', color: '#0891b2' },
  { id: 'BK4', codigo: 'OF-2024-104', linea: null, dia: null, horaInicio: 6, duracion: 7, ref: 'BAT-48V-100Ah-RACK', cliente: 'Telecom Networks S.A.', cantidad: 300, materiales: 'Celdas LFP 100Ah (x16), BMS 48V Telecom RS485, Chasis Rack 3U 19", Frontal con display LCD', fechaCompromiso: '08/06/2024', prioridad: 'normal', color: '#059669' },
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

// Mapa auxiliar: ID de línea → nombre legible
function getLineasNombresMap() {
  try {
    const lineas = getLineasLocal() || mockLineas;
    return Object.fromEntries(lineas.map(l => [l.id, l.nombre]));
  } catch (_) { return {}; }
}

function syncGanttToRestOfApp(ganttOrders) {
  if (!Array.isArray(ganttOrders)) return;
  const lineasNombres = getLineasNombresMap();

  // 1. Sincronizar hacia las Líneas de producción (mes_lineas)
  try {
    const currentLineas = getLineasLocal() || mockLineas;
    const updatedLineas = currentLineas.map(l => {
      const ordenHoy = ganttOrders.find(o => o.linea === l.id && o.dia === 0) || ganttOrders.find(o => o.linea === l.id);
      if (ordenHoy) return { ...l, producto: ordenHoy.ref, cliente: ordenHoy.cliente };
      return l;
    });
    localStorage.setItem('mes_lineas', JSON.stringify(updatedLineas));
  } catch (_) {}

  // 2. Sincronizar hacia Secuencia: actualizar lineaAsignada + lineaNombre
  try {
    const currentSecuencia = getSecuenciaLocal() || mockSecuencia;
    let nextSeq = currentSecuencia.length + 1;
    const updatedSecuencia = [...currentSecuencia];
    const diasStr = ['31/05/2024', '01/06/2024', '02/06/2024', '03/06/2024', '04/06/2024', '05/06/2024'];

    ganttOrders.forEach(go => {
      const fechaComp = `${diasStr[go.dia] || '31/05/2024'} ${String(go.horaInicio).padStart(2, '0')}:00`;
      const lineaNombre = go.linea ? (lineasNombres[go.linea] || go.linea) : null;

      // Buscar primero por ganttId, luego por ref+cliente
      let foundIdx = updatedSecuencia.findIndex(s => s.ganttId === go.id);
      if (foundIdx < 0) foundIdx = updatedSecuencia.findIndex(s => s.referencia === go.ref && s.cliente === go.cliente);

      if (foundIdx >= 0) {
        updatedSecuencia[foundIdx] = {
          ...updatedSecuencia[foundIdx],
          ganttId: go.id,
          lineaAsignada: go.linea || null,
          lineaNombre: go.linea ? lineaNombre : null,
          fechaCompromiso: fechaComp,
        };
      } else if (go.linea) {
        // Solo añadir a Secuencia si tiene línea asignada
        updatedSecuencia.push({
          id: Date.now() + Math.floor(Math.random() * 10000),
          secuencia: nextSeq++,
          ganttId: go.id,
          lineaAsignada: go.linea,
          lineaNombre,
          referencia: go.ref,
          cliente: go.cliente,
          fechaCompromiso: fechaComp,
          progreso: 0,
          cumplimiento: 100,
          desvio: 0,
          estado: 'a_tiempo',
        });
      }
    });

    // Limpiar lineaAsignada de órdenes que pasaron al backlog (linea === null)
    const backlogGanttIds = new Set(ganttOrders.filter(o => !o.linea).map(o => o.id));
    const finalSecuencia = updatedSecuencia.map(s =>
      s.ganttId && backlogGanttIds.has(s.ganttId)
        ? { ...s, lineaAsignada: null, lineaNombre: null }
        : s
    );

    localStorage.setItem('mes_secuencia', JSON.stringify(finalSecuencia));
  } catch (_) {}

  // 3. Emitir evento para que Secuencia.jsx se actualice en tiempo real
  try { window.dispatchEvent(new CustomEvent('planificacion_updated', { detail: ganttOrders })); } catch (_) {}
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

// ─── REORDENAMIENTO DE SECUENCIA → GANTT ─────────────────────────────────────
// Cuando Secuencia reordena órdenes, compacta las barras del Gantt
// dentro de cada línea siguiendo la nueva prioridad.
export function reordenarSecuenciaEnGantt(secuenciaOrdenada) {
  try {
    const ganttOrders = getPlanificacionLocal() || ordenesGanttDefault;
    const updated = [...ganttOrders];

    // Agrupar órdenes del Gantt asignadas por línea
    const porLinea = {};
    updated.forEach(o => {
      if (o.linea) {
        if (!porLinea[o.linea]) porLinea[o.linea] = [];
        porLinea[o.linea].push(o);
      }
    });

    // Para cada línea, reordenar sus órdenes según su posición en secuenciaOrdenada
    Object.keys(porLinea).forEach(lineaId => {
      const ordenesLinea = porLinea[lineaId];
      ordenesLinea.sort((a, b) => {
        const posA = secuenciaOrdenada.findIndex(s => s.ganttId === a.id);
        const posB = secuenciaOrdenada.findIndex(s => s.ganttId === b.id);
        return (posA >= 0 ? posA : 9999) - (posB >= 0 ? posB : 9999);
      });

      // Compactar horarios desde horaInicio = 6, respetando duraciones
      let horaActual = 6;
      ordenesLinea.forEach(o => {
        const idx = updated.findIndex(u => u.id === o.id);
        if (idx >= 0) {
          updated[idx] = { ...updated[idx], horaInicio: horaActual };
          horaActual += (updated[idx].duracion || 4);
        }
      });
    });

    setPlanificacionLocal(updated);
    return { data: updated, error: null };
  } catch (e) {
    return { data: null, error: e.message };
  }
}

// ─── INCIDENCIAS DE SECUENCIA (histórico en localStorage) ────────────────────
const LS_KEY_INCIDENCIAS_SEQ = 'mes_incidencias_secuencia';

export function getIncidenciasSecuencia() {
  try {
    const r = localStorage.getItem(LS_KEY_INCIDENCIAS_SEQ);
    return r ? JSON.parse(r) : [];
  } catch (_) { return []; }
}

export function saveIncidenciaSecuencia(incidencia) {
  try {
    const current = getIncidenciasSecuencia();
    const newItem = { ...incidencia, id: `INC-${Date.now()}`, fechaRegistro: new Date().toISOString() };
    localStorage.setItem(LS_KEY_INCIDENCIAS_SEQ, JSON.stringify([...current, newItem]));
    return { data: newItem, error: null };
  } catch (e) { return { data: null, error: e.message }; }
}

// ─── OT CORRECTIVA DESDE SECUENCIA ───────────────────────────────────────────
export async function insertOrdenTrabajoDesdeSecuencia(orden, motivo, descripcion) {
  const nuevaOt = {
    id: `OT-SEC-${Math.floor(100 + Math.random() * 900)}`,
    codigo: `OT-${Math.floor(100 + Math.random() * 900)}`,
    titulo: `Correctivo desde Secuencia: ${orden.referencia} — ${motivo}`,
    activoId: 'COMP-GEN',
    activoNombre: `Línea: ${orden.lineaNombre || orden.lineaAsignada || 'Sin línea'}`,
    linea: orden.lineaNombre || orden.lineaAsignada || 'Línea 1',
    tipo: 'correctivo',
    prioridad: 'critica',
    estado: 'abierta',
    tecnico: 'Técnico Asignado MTO',
    turno: 'Turno Actual',
    fechaApertura: new Date().toISOString().slice(0, 16).replace('T', ' '),
    fechaCierre: '',
    tiempoEst: 60,
    tiempoReal: 0,
    repuestos: [],
    causaRaiz: `SECUENCIA — ${motivo}: ${descripcion || 'Sin descripción'}`,
    paradaId: null,
    costeTotal: 0,
  };
  return await insertOrdenTrabajo(nuevaOt);
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

// ─── MANTENIMIENTO INTEGRAL (GMAO / OTs / Activos / Repuestos) ───────────────

function getOrdenesTrabajoLocal() { try { const r = localStorage.getItem('mes_ordenes_trabajo'); return r ? JSON.parse(r) : null; } catch (_) { return null; } }
function setOrdenesTrabajoLocal(d) { try { localStorage.setItem('mes_ordenes_trabajo', JSON.stringify(d)); } catch (_) {} }

export async function fetchOrdenesTrabajo() {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('ordenes_trabajo').select('*').order('id', { ascending: false });
      if (!error && data && data.length > 0) return { data, fromSupabase: true };
    } catch (e) {}
  }
  const local = getOrdenesTrabajoLocal();
  if (local && Array.isArray(local) && local.length > 0) return { data: local, fromSupabase: false };
  setOrdenesTrabajoLocal(ordenesTrabajoIniciales);
  return { data: ordenesTrabajoIniciales, fromSupabase: false };
}

export async function insertOrdenTrabajo(ot) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('ordenes_trabajo').insert([ot]).select().single();
      if (!error && data) {
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('mantenimiento_updated'));
        return { data, error: null };
      }
    } catch (e) {}
  }
  const current = getOrdenesTrabajoLocal() || ordenesTrabajoIniciales;
  const newItem = {
    ...ot,
    id: ot.id || `OT-2026-${Math.floor(100 + Math.random() * 900)}`,
    codigo: ot.codigo || `OT-${Math.floor(100 + Math.random() * 900)}`,
    fechaApertura: ot.fechaApertura || new Date().toISOString().slice(0, 16).replace('T', ' ')
  };
  const updated = [newItem, ...current];
  setOrdenesTrabajoLocal(updated);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('mantenimiento_updated'));
  return { data: newItem, error: null };
}

export async function updateOrdenTrabajo(id, ot) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('ordenes_trabajo').update(ot).eq('id', id).select().single();
      if (!error && data) {
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('mantenimiento_updated'));
        return { data, error: null };
      }
    } catch (e) {}
  }
  const current = getOrdenesTrabajoLocal() || ordenesTrabajoIniciales;
  const updated = current.map(item => item.id === id ? { ...item, ...ot } : item);
  setOrdenesTrabajoLocal(updated);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('mantenimiento_updated'));
  return { data: updated.find(i => i.id === id), error: null };
}

export async function deleteOrdenTrabajo(id) {
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from('ordenes_trabajo').delete().eq('id', id);
      if (!error) {
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('mantenimiento_updated'));
        return { error: null };
      }
    } catch (e) {}
  }
  const current = getOrdenesTrabajoLocal() || ordenesTrabajoIniciales;
  setOrdenesTrabajoLocal(current.filter(item => item.id !== id));
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('mantenimiento_updated'));
  return { error: null };
}

export async function generarOtDesdeParada(parada) {
  const nuevaOt = {
    id: `OT-2026-${Math.floor(100 + Math.random() * 900)}`,
    codigo: `OT-${Math.floor(100 + Math.random() * 900)}`,
    titulo: `OT Correctiva generada desde Parada: ${parada.causa || 'Incidencia de línea'}`,
    activoId: 'COMP-GEN',
    activoNombre: `Activo Principal en ${parada.linea || 'Línea'}`,
    linea: parada.linea || 'Línea 1',
    tipo: 'correctivo',
    prioridad: 'critica',
    estado: 'abierta',
    tecnico: 'Técnico Asignado MTO',
    turno: 'Turno Actual',
    fechaApertura: new Date().toISOString().slice(0, 16).replace('T', ' '),
    fechaCierre: '',
    tiempoEst: Number(parada.duracion) || 45,
    tiempoReal: 0,
    repuestos: [],
    causaRaiz: `PARADA-REF (${parada.id}) — ${parada.causa}`,
    paradaId: parada.id,
    costeTotal: 95
  };
  return await insertOrdenTrabajo(nuevaOt);
}

export async function fetchActivosMantenimiento() {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('activos_mantenimiento').select('*');
      if (!error && data && data.length > 0) return { data, fromSupabase: true };
    } catch (e) {}
  }
  return { data: mockActivos, fromSupabase: false };
}

function getRepuestosLocal() { try { const r = localStorage.getItem('mes_repuestos_almacen'); return r ? JSON.parse(r) : null; } catch (_) { return null; } }
function setRepuestosLocal(d) { try { localStorage.setItem('mes_repuestos_almacen', JSON.stringify(d)); } catch (_) {} }

export async function fetchRepuestos() {
  const local = getRepuestosLocal();
  if (local && Array.isArray(local) && local.length > 0) return { data: local, fromSupabase: false };
  setRepuestosLocal(repuestosAlmacenIniciales);
  return { data: repuestosAlmacenIniciales, fromSupabase: false };
}

export async function insertRepuesto(rep) {
  const current = getRepuestosLocal() || repuestosAlmacenIniciales;
  const newItem = { ...rep, id: rep.id || `REP-${Date.now()}` };
  const updated = [...current, newItem];
  setRepuestosLocal(updated);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('mantenimiento_updated'));
  return { data: newItem, error: null };
}

export async function updateRepuesto(id, rep) {
  const current = getRepuestosLocal() || repuestosAlmacenIniciales;
  const updated = current.map(item => item.id === id ? { ...item, ...rep } : item);
  setRepuestosLocal(updated);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('mantenimiento_updated'));
  return { data: updated.find(i => i.id === id), error: null };
}

export async function deleteRepuesto(id) {
  const current = getRepuestosLocal() || repuestosAlmacenIniciales;
  setRepuestosLocal(current.filter(item => item.id !== id));
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('mantenimiento_updated'));
  return { error: null };
}

function getPlanesPreventivosLocal() { try { const r = localStorage.getItem('mes_planes_preventivos'); return r ? JSON.parse(r) : null; } catch (_) { return null; } }
function setPlanesPreventivosLocal(d) { try { localStorage.setItem('mes_planes_preventivos', JSON.stringify(d)); } catch (_) {} }

export async function fetchPlanesPreventivos() {
  const local = getPlanesPreventivosLocal();
  if (local && Array.isArray(local) && local.length > 0) return { data: local, fromSupabase: false };
  setPlanesPreventivosLocal(planesPreventivosIniciales);
  return { data: planesPreventivosIniciales, fromSupabase: false };
}

export async function updatePlanPreventivo(id, plan) {
  const current = getPlanesPreventivosLocal() || planesPreventivosIniciales;
  const updated = current.map(item => item.id === id ? { ...item, ...plan } : item);
  setPlanesPreventivosLocal(updated);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('mantenimiento_updated'));
  return { data: updated.find(i => i.id === id), error: null };
}

// ─── SENSORES PREDICTIVOS ────────────────────────────────────────────────────

function getSensoresLocal() { try { const r = localStorage.getItem('mes_sensores_predictivos'); return r ? JSON.parse(r) : null; } catch (_) { return null; } }
function setSensoresLocal(d) { try { localStorage.setItem('mes_sensores_predictivos', JSON.stringify(d)); } catch (_) {} }

export async function fetchSensoresPredictivos() {
  const local = getSensoresLocal();
  if (local && Array.isArray(local) && local.length > 0) return { data: local, fromSupabase: false };
  setSensoresLocal(sensoresPredictivosIniciales);
  return { data: sensoresPredictivosIniciales, fromSupabase: false };
}

export async function insertSensorPredictivo(sensor) {
  const current = getSensoresLocal() || sensoresPredictivosIniciales;
  const newItem = { ...sensor, id: sensor.id || `SENS-${Date.now()}` };
  const updated = [...current, newItem];
  setSensoresLocal(updated);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('mantenimiento_updated'));
  return { data: newItem, error: null };
}

export async function updateSensorPredictivo(id, sensor) {
  const current = getSensoresLocal() || sensoresPredictivosIniciales;
  const updated = current.map(item => item.id === id ? { ...item, ...sensor } : item);
  setSensoresLocal(updated);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('mantenimiento_updated'));
  return { data: updated.find(i => i.id === id), error: null };
}

export async function deleteSensorPredictivo(id) {
  const current = getSensoresLocal() || sensoresPredictivosIniciales;
  setSensoresLocal(current.filter(item => item.id !== id));
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('mantenimiento_updated'));
  return { error: null };
}

// ─── PLANES PREVENTIVOS CRUD COMPLETO ────────────────────────────────────────

export async function insertPlanPreventivo(plan) {
  const current = getPlanesPreventivosLocal() || planesPreventivosIniciales;
  const newItem = {
    ...plan,
    id: plan.id || `PLN-${Date.now()}`,
    checklist: plan.checklist || []
  };
  const updated = [...current, newItem];
  setPlanesPreventivosLocal(updated);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('mantenimiento_updated'));
  return { data: newItem, error: null };
}

export async function deletePlanPreventivo(id) {
  const current = getPlanesPreventivosLocal() || planesPreventivosIniciales;
  setPlanesPreventivosLocal(current.filter(item => item.id !== id));
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('mantenimiento_updated'));
  return { error: null };
}

export async function addChecklistItem(planId, tarea) {
  const current = getPlanesPreventivosLocal() || planesPreventivosIniciales;
  const updated = current.map(plan =>
    plan.id === planId
      ? { ...plan, checklist: [...(plan.checklist || []), { tarea, completado: false }] }
      : plan
  );
  setPlanesPreventivosLocal(updated);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('mantenimiento_updated'));
  return { data: updated.find(p => p.id === planId), error: null };
}

export async function updateChecklistItem(planId, index, tarea) {
  const current = getPlanesPreventivosLocal() || planesPreventivosIniciales;
  const updated = current.map(plan => {
    if (plan.id !== planId) return plan;
    const newChecklist = plan.checklist.map((c, i) =>
      i === index ? { ...c, tarea } : c
    );
    return { ...plan, checklist: newChecklist };
  });
  setPlanesPreventivosLocal(updated);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('mantenimiento_updated'));
  return { data: updated.find(p => p.id === planId), error: null };
}

export async function removeChecklistItem(planId, index) {
  const current = getPlanesPreventivosLocal() || planesPreventivosIniciales;
  const updated = current.map(plan => {
    if (plan.id !== planId) return plan;
    const newChecklist = plan.checklist.filter((_, i) => i !== index);
    return { ...plan, checklist: newChecklist };
  });
  setPlanesPreventivosLocal(updated);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('mantenimiento_updated'));
  return { data: updated.find(p => p.id === planId), error: null };
}

// ─── ÁRBOL DE ACTIVOS / EQUIPOS DE LÍNEA ─────────────────────────────────────

function getActivosLocal() { try { const r = localStorage.getItem('mes_activos_jerarquia'); return r ? JSON.parse(r) : null; } catch (_) { return null; } }
function setActivosLocal(d) { try { localStorage.setItem('mes_activos_jerarquia', JSON.stringify(d)); } catch (_) {} }

export async function fetchActivosMantenimientoEditable() {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('activos_mantenimiento').select('*');
      if (!error && data && data.length > 0) return { data, fromSupabase: true };
    } catch (e) {}
  }
  const local = getActivosLocal();
  if (local && Array.isArray(local) && local.length > 0) return { data: local, fromSupabase: false };
  setActivosLocal(mockActivos);
  return { data: mockActivos, fromSupabase: false };
}

// Obtiene lista plana de todos los equipos (tipo 'maquina' y 'componente') para selectores
export function getEquiposPlanos(arbol) {
  const result = [];
  function recorrer(nodos) {
    if (!nodos) return;
    nodos.forEach(n => {
      if (n.tipo === 'maquina' || n.tipo === 'componente') {
        result.push({ id: n.id, label: `${n.nombre} (${n.id})` });
      }
      if (n.hijos) recorrer(n.hijos);
    });
  }
  recorrer(arbol);
  return result;
}

// Añadir un equipo (máquina) a una línea específica del árbol
export async function insertEquipoEnLinea(lineaId, equipo) {
  const { data: arbol } = await fetchActivosMantenimientoEditable();
  const newEquipo = {
    ...equipo,
    id: equipo.id || `MQ-${Date.now()}`,
    tipo: 'maquina',
    hijos: equipo.hijos || []
  };

  function addToLinea(nodos) {
    return nodos.map(n => {
      if (n.id === lineaId) {
        return { ...n, hijos: [...(n.hijos || []), newEquipo] };
      }
      if (n.hijos) return { ...n, hijos: addToLinea(n.hijos) };
      return n;
    });
  }

  const updated = addToLinea(arbol);
  setActivosLocal(updated);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('mantenimiento_updated'));
  return { data: newEquipo, error: null };
}

// Editar un equipo/componente por ID en cualquier nivel del árbol
export async function updateEquipoEnArbol(equipoId, cambios) {
  const { data: arbol } = await fetchActivosMantenimientoEditable();

  function editInTree(nodos) {
    return nodos.map(n => {
      if (n.id === equipoId) return { ...n, ...cambios };
      if (n.hijos) return { ...n, hijos: editInTree(n.hijos) };
      return n;
    });
  }

  const updated = editInTree(arbol);
  setActivosLocal(updated);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('mantenimiento_updated'));
  return { data: updated, error: null };
}

// Eliminar un equipo/componente por ID de cualquier nivel del árbol
export async function deleteEquipoEnArbol(equipoId) {
  const { data: arbol } = await fetchActivosMantenimientoEditable();

  function removeFromTree(nodos) {
    return nodos
      .filter(n => n.id !== equipoId)
      .map(n => ({
        ...n,
        hijos: n.hijos ? removeFromTree(n.hijos) : []
      }));
  }

  const updated = removeFromTree(arbol);
  setActivosLocal(updated);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('mantenimiento_updated'));
  return { error: null };
}

// Añadir un componente hijo a un equipo (máquina) del árbol
export async function insertComponenteEnEquipo(equipoId, componente) {
  const { data: arbol } = await fetchActivosMantenimientoEditable();
  const newComp = {
    ...componente,
    id: componente.id || `COMP-${Date.now()}`,
    tipo: 'componente'
  };

  function addToEquipo(nodos) {
    return nodos.map(n => {
      if (n.id === equipoId) {
        return { ...n, hijos: [...(n.hijos || []), newComp] };
      }
      if (n.hijos) return { ...n, hijos: addToEquipo(n.hijos) };
      return n;
    });
  }

  const updated = addToEquipo(arbol);
  setActivosLocal(updated);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('mantenimiento_updated'));
  return { data: newComp, error: null };
}
