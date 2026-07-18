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
import { mockUbicaciones } from '@/data/mockUbicaciones';
import { mockEntradasMercancia } from '@/data/mockEntradasMercancia';
import { skillsMasterIniciales, formacionesMasterIniciales, permisosMasterIniciales, capacitacionesMasterIniciales, autorizacionesMasterIniciales } from '@/data/mockCualificaciones';
import { ordenesTrabajoIniciales, activosJerarquia as mockActivos, planesPreventivosIniciales, sensoresPredictivosIniciales, repuestosAlmacenIniciales, tablaDisponibilidadLineas } from '@/data/mockMantenimiento';
import { checklistTemplates as mockChecklistTemplates } from '@/data/mockChecklistsTemplates';
import { mockKaizen } from '@/data/mockKaizen';
import { mockCambiosFormato } from '@/data/mockCambiosFormato';
import { mockTiemposCambioEstandar } from '@/data/mockTiemposCambioEstandar';

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

export async function setImagenesGuardadas(key, arrayDataUrls) {
  if (!key) return;
  try {
    const mapStr = localStorage.getItem('mes_imagenes_asociadas');
    const map = mapStr ? JSON.parse(mapStr) : {};
    
    if (arrayDataUrls && arrayDataUrls.length > 0) {
      // Comprimir cada imagen si aplica
      const compressed = await Promise.all(arrayDataUrls.map(async (img) => {
        if (!img.dataUrl || img.dataUrl.length < 100) return img; // already short or invalid
        return new Promise((resolve) => {
          compressImageHelper(img.dataUrl, 1200, 0.7, (compressedUrl) => {
            resolve({ ...img, dataUrl: compressedUrl });
          });
        });
      }));
      map[key + '_array'] = compressed;
    } else {
      delete map[key + '_array'];
    }
    
    try {
      localStorage.setItem('mes_imagenes_asociadas', JSON.stringify(map));
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        console.warn('Quota exceeded, clearing old images to make space.');
        // naive eviction: clear random keys until we can save
        const keys = Object.keys(map);
        if (keys.length > 5) {
          for(let i=0; i<Math.max(1, Math.floor(keys.length/3)); i++){
            delete map[keys[i]];
          }
          localStorage.setItem('mes_imagenes_asociadas', JSON.stringify(map));
        }
      }
    }
  } catch (err) {
    console.error('Error al guardar array de imágenes:', err);
  }
}

export function getImagenesGuardadas(key) {
  if (!key) return [];
  try {
    const mapStr = localStorage.getItem('mes_imagenes_asociadas');
    if (!mapStr) return [];
    const map = JSON.parse(mapStr);
    return map[key + '_array'] || [];
  } catch (err) {
    return [];
  }
}


export function mapMaterial(m) {
  if (!m) return m;
  const img = getImagenGuardada(m.codigo) || getImagenGuardada(m.id) || m.imagen || '';
  if (img && !m.imagen) m.imagen = img;
  return {
    ...m,
    codigoBarras: m.codigo_barras || m.codigoBarras || null,
    stockActual: m.stock_actual ?? m.stockActual ?? 0,
    stockMinimo: m.stock_minimo ?? m.stockMinimo ?? 0,
    stockMaximo: m.stock_maximo ?? m.stockMaximo ?? 0,
    pedidoPendiente: m.pedido_pendiente ?? m.pedidoPendiente ?? 0,
    fechaEntrega: m.fecha_entrega ?? m.fechaEntrega,
    stockReservado: m.stock_reservado ?? m.stockReservado ?? 0,
    imagen: img,
    ubicacionId: m.ubicacion_id || m.ubicacionId || null,
    costeUnitario: Number(m.coste_unitario ?? m.costeUnitario ?? 0),
    movimientos: m.movimientos || []
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

export function calcDuracionEstimada(ref, cantidad, listaProd = []) {
  if (!ref || !cantidad || Number(cantidad) <= 0) return 0;
  const prod = listaProd.find(p => p.codigo === ref || p.id === ref);
  if (!prod) return 4;
  const udsHora = Number(prod.objetivoHora) || (prod.tiempoCiclo ? (3600 / Number(prod.tiempoCiclo)) : 0);
  if (udsHora > 0) {
    const durHoras = Number(cantidad) / udsHora;
    return Math.max(0.5, Math.round(durHoras * 10) / 10);
  }
  return 4;
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
    codigo_barras: m.codigoBarras,
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
    ubicacion_id: m.ubicacionId || m.ubicacion_id || null,
    coste_unitario: Number(m.costeUnitario ?? m.coste_unitario ?? 0),
    movimientos: m.movimientos || []
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

function getAlertasLocal() { try { const r = localStorage.getItem('mes_alertas'); return r ? JSON.parse(r) : null; } catch (_) { return null; } }
function setAlertasLocal(d) { try { localStorage.setItem('mes_alertas', JSON.stringify(d)); } catch (_) {} }

export async function fetchAlertas() {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('alertas').select('*').order('id', { ascending: false });
      if (!error && data && data.length > 0) return { data, fromSupabase: true };
    } catch (e) {}
  }
  const local = getAlertasLocal();
  if (local) return { data: local, fromSupabase: false };
  setAlertasLocal(mockAlertas);
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
  return { data: [...mockDefectos, ...mockScraps], fromSupabase: false };
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
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('alertas').insert([alerta]).select().single();
      if (!error && data) {
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('alertas_updated'));
        return { data, error: null };
      }
    } catch (e) {}
  }
  const current = getAlertasLocal() || mockAlertas;
  const newItem = { ...alerta, id: alerta.id || Date.now() };
  const updated = [newItem, ...current];
  setAlertasLocal(updated);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('alertas_updated'));
  return { data: newItem, error: null };
}

export async function updateAlerta(id, alerta) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('alertas').update(alerta).eq('id', id).select().single();
      if (!error && data) {
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('alertas_updated'));
        return { data, error: null };
      }
    } catch (e) {}
  }
  const current = getAlertasLocal() || mockAlertas;
  const updated = current.map(a => a.id === id ? { ...a, ...alerta } : a);
  setAlertasLocal(updated);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('alertas_updated'));
  return { data: updated.find(a => a.id === id) || { id, ...alerta }, error: null };
}

export async function deleteAlerta(id) {
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from('alertas').delete().eq('id', id);
      if (!error) {
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('alertas_updated'));
        return { error: null };
      }
    } catch (e) {}
  }
  const current = getAlertasLocal() || mockAlertas;
  const updated = current.filter(a => a.id !== id);
  setAlertasLocal(updated);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('alertas_updated'));
  return { error: null };
}

let isGeneratingAlerts = false;

export async function generarAlertasAutomaticas() {
  if (isGeneratingAlerts) return;
  isGeneratingAlerts = true;
  try {
    const { data: currentAlerts } = await fetchAlertas();
    const alertas = currentAlerts || [];

    // 1. Stock crítico (materias_primas)
    const { data: materiales } = await fetchMateriasPrimas();
    if (materiales && Array.isArray(materiales)) {
      for (const mat of materiales) {
        const stockActual = Number(mat.stockActual ?? mat.stock_actual ?? 0);
        const stockMinimo = Number(mat.stockMinimo ?? mat.stock_minimo ?? 0);
        const origenId = `stock_${mat.id}`;
        const alertaExistente = alertas.find(a => a.origenId === origenId && !a.leida);

        if (stockActual < stockMinimo) {
          const isCritica = stockActual <= 0;
          const targetTipo = isCritica ? 'critica' : 'advertencia';
          const targetTitulo = `Stock bajo mínimo: ${mat.codigo || mat.descripcion || 'Componente'}`;
          const targetDesc = `El stock actual de "${mat.descripcion || mat.codigo}" es de ${stockActual} ${mat.unidad || 'uds'} (Mínimo: ${stockMinimo}).`;

          if (!alertaExistente) {
            await insertAlerta({
              tipo: targetTipo,
              titulo: targetTitulo,
              descripcion: targetDesc,
              modulo: 'materias_primas',
              linea: 'Almacén',
              icono: 'Package',
              timestamp: new Date().toISOString(),
              leida: false,
              origenId
            });
          } else if (alertaExistente.tipo !== targetTipo || alertaExistente.descripcion !== targetDesc) {
            await updateAlerta(alertaExistente.id, {
              tipo: targetTipo,
              titulo: targetTitulo,
              descripcion: targetDesc
            });
          }
        } else if (alertaExistente) {
          await updateAlerta(alertaExistente.id, { leida: true });
        }
      }
    }

    // 2. OT crítica abierta (mantenimiento)
    const { data: ots } = await fetchOrdenesTrabajo();
    if (ots && Array.isArray(ots)) {
      for (const ot of ots) {
        const isCritica = (ot.prioridad || '').toLowerCase() === 'critica';
        const isOpen = ['abierta', 'en curso'].includes((ot.estado || '').toLowerCase());
        const origenId = `ot_${ot.id || ot.codigo}`;
        const alertaExistente = alertas.find(a => a.origenId === origenId && !a.leida);

        if (isCritica && isOpen) {
          if (!alertaExistente) {
            await insertAlerta({
              tipo: 'critica',
              titulo: `OT Crítica en Mantenimiento: ${ot.codigo || 'Orden'}`,
              descripcion: ot.titulo || ot.causaRaiz || 'Intervención crítica urgente requerida en línea',
              modulo: 'mantenimiento',
              linea: ot.linea || 'Planta',
              icono: 'Wrench',
              timestamp: new Date().toISOString(),
              leida: false,
              origenId
            });
          }
        } else if (alertaExistente) {
          await updateAlerta(alertaExistente.id, { leida: true });
        }
      }
    }

    // 3. Desviación de plan / retraso (secuencia)
    const { data: ordenes } = await fetchSecuencia();
    if (ordenes && Array.isArray(ordenes)) {
      for (const o of ordenes) {
        const isRetrasado = (o.estado || '').toLowerCase() === 'retrasado';
        const desv = Number(o.producido || 0) - Number(o.objetivo || 0);
        const isDesviada = desv <= -10;
        const origenId = `sec_${o.id || o.codigo}`;
        const alertaExistente = alertas.find(a => a.origenId === origenId && !a.leida);

        if (isRetrasado || isDesviada) {
          if (!alertaExistente) {
            await insertAlerta({
              tipo: 'advertencia',
              titulo: `Desviación en Secuencia: ${o.codigo || o.producto || 'Orden'}`,
              descripcion: `La orden ${o.codigo || ''} en ${o.linea || 'Línea'} muestra un retraso o desviación de ${desv} uds respecto al objetivo.`,
              modulo: 'secuencia',
              linea: o.linea || 'Planta',
              icono: 'Clock',
              timestamp: new Date().toISOString(),
              leida: false,
              origenId
            });
          }
        } else if (alertaExistente) {
          await updateAlerta(alertaExistente.id, { leida: true });
        }
      }
    }

    // 4. Formaciones caducadas o próximas a caducar (operarios)
    const { data: operariosActivos } = await fetchOperarios();
    if (operariosActivos && Array.isArray(operariosActivos)) {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      for (const op of operariosActivos) {
        if (op.estado === 'inactivo') continue;
        const formacionesOp = op.formaciones || [];
        for (const form of formacionesOp) {
          if (!form.fechaCaducidad) continue;
          const fechaCad = new Date(form.fechaCaducidad);
          fechaCad.setHours(0, 0, 0, 0);
          const diffMs = fechaCad.getTime() - hoy.getTime();
          const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

          const origenId = `formacion_${op.id}_${form.id || form.nombre}`;
          const alertaExistente = alertas.find(a => a.origenId === origenId && !a.leida && !a.resuelta);

          if (diffDays < 0) {
            // Caducada -> crítica
            const targetTipo = 'critica';
            const targetTitulo = `Formación caducada: ${form.nombre} — ${op.nombre}`;
            const targetDesc = `La formación "${form.nombre}" de ${op.nombre} venció el ${form.fechaCaducidad}. Se requiere reciclaje o renovación de certificado.`;

            if (!alertaExistente) {
              await insertAlerta({
                tipo: targetTipo,
                titulo: targetTitulo,
                descripcion: targetDesc,
                modulo: 'operarios',
                linea: op.lineaActualId ? `Línea ${op.lineaActualId}` : 'Planta',
                icono: 'GraduationCap',
                timestamp: new Date().toISOString(),
                leida: false,
                resuelta: false,
                origenId
              });
            } else if (alertaExistente.tipo !== targetTipo || alertaExistente.descripcion !== targetDesc) {
              await updateAlerta(alertaExistente.id, {
                tipo: targetTipo,
                titulo: targetTitulo,
                descripcion: targetDesc
              });
            }
          } else if (diffDays <= 30) {
            // Próxima a caducar -> advertencia
            const targetTipo = 'advertencia';
            const targetTitulo = `Formación próxima a caducar: ${form.nombre} — ${op.nombre}`;
            const targetDesc = `La formación "${form.nombre}" de ${op.nombre} caducará en ${diffDays} días (${form.fechaCaducidad}). Programar sesión de reciclaje.`;

            if (!alertaExistente) {
              await insertAlerta({
                tipo: targetTipo,
                titulo: targetTitulo,
                descripcion: targetDesc,
                modulo: 'operarios',
                linea: op.lineaActualId ? `Línea ${op.lineaActualId}` : 'Planta',
                icono: 'GraduationCap',
                timestamp: new Date().toISOString(),
                leida: false,
                resuelta: false,
                origenId
              });
            } else if (alertaExistente.tipo !== targetTipo || alertaExistente.descripcion !== targetDesc) {
              await updateAlerta(alertaExistente.id, {
                tipo: targetTipo,
                titulo: targetTitulo,
                descripcion: targetDesc
              });
            }
          } else if (alertaExistente) {
            // Si ya se renovó (diffDays > 30) o no procede -> marcar como leída y resuelta automáticamente
            await updateAlerta(alertaExistente.id, { leida: true, resuelta: true });
          }
        }
      }
    }
  } catch (e) {
    console.error('Error generando alertas automáticas:', e);
  } finally {
    isGeneratingAlerts = false;
  }
}


// ─── WRITE — Paradas ─────────────────────────────────────────────────────────

export async function insertParada(parada, isOfflineReplay = false) {
  if (typeof window !== 'undefined' && !navigator.onLine && !isOfflineReplay) {
    enqueueWrite('insertParada', parada);
    return { data: { id: 'PENDING-' + Date.now() }, error: null, offline: true };
  }

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

export async function registrarMovimientoStock(materialId, { tipo, cantidad, motivo, origen = 'manual', usuario, entradaMercanciaId = null }) {
  const local = (getMateriasLocal() || mockMateriasPrimas.map(mapMaterial));
  const mat = local.find(m => m.id === materialId);
  if (!mat) return { error: 'Material no encontrado' };

  let cantidadNum = Number(cantidad) || 0;
  // Permitimos cantidadNum negativa o cero si es un ajuste, pero la cantidad del movimiento debe reflejar el cambio.
  // En realidad la función asume que cantidadNum siempre es positivo y el "tipo" define la operación.
  // Excepción: en 'ajuste', cantidadNum puede ser la diferencia (positiva o negativa).
  if (tipo !== 'ajuste' && cantidadNum <= 0) return { error: 'Cantidad inválida' };

  let nextStock = Number(mat.stockActual) || 0;
  if (tipo === 'entrada') {
    nextStock += cantidadNum;
  } else if (tipo === 'salida') {
    nextStock = Math.max(0, nextStock - cantidadNum);
  } else if (tipo === 'ajuste') {
    // cantidadNum aquí representa la diferencia a aplicar (+ o -)
    nextStock = Math.max(0, nextStock + cantidadNum);
  }

  const nuevoMovimiento = {
    id: `mov_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    fecha: new Date().toISOString(),
    tipo,
    cantidad: cantidadNum,
    motivo: motivo || (tipo === 'entrada' ? 'Ajuste de entrada' : (tipo === 'salida' ? 'Ajuste de salida' : 'Regularización de stock')),
    origen,
    usuario: usuario || 'Desconocido',
    entradaMercanciaId
  };

  const nextMovimientos = [nuevoMovimiento, ...(mat.movimientos || [])];
  
  const result = await updateMaterial(materialId, { 
    stockActual: nextStock, 
    movimientos: nextMovimientos 
  });

  // Registrar auditoría si está disponible
  try {
    const { registrarAuditoria } = await import('./dataService');
    if (typeof registrarAuditoria === 'function') {
      // Obligatorio para origen 'regularizacion', para otros es opcional (pero lo dejamos para mayor trazabilidad)
      if (origen === 'regularizacion' || origen === 'entrada_mercancia') {
        registrarAuditoria({
          tabla: 'materias_primas',
          registroId: materialId,
          accion: origen === 'regularizacion' ? 'REGULARIZAR_STOCK' : 'MODIFICAR_STOCK',
          cambios: { tipo, cantidad: cantidadNum, nuevoStock: nextStock, motivo: nuevoMovimiento.motivo, entradaMercanciaId }
        });
      }
    }
  } catch(e) {}

  return result;
}

export function calcularCosteEscandallo(producto, materiales = []) {
  if (!producto || !Array.isArray(producto.bom)) return 0;
  let total = 0;
  producto.bom.forEach(item => {
    const mat = materiales.find(m => m.codigo === item.codigo);
    const coste = mat ? Number(mat.costeUnitario || 0) : 0;
    const factor = Number(item.factor || 0);
    total += coste * factor;
  });
  return Number(total.toFixed(2));
}

// ─── ALMACÉN: UBICACIONES Y ENTRADAS DE MERCANCÍA ──────────────────────────

function ubicacionToDb(u) {
  return {
    id: u.id, codigo: u.codigo, zona: u.zona, pasillo: u.pasillo,
    estanteria: u.estanteria, nivel: u.nivel,
    capacidad_maxima: u.capacidadMaxima ?? u.capacidad_maxima ?? 0,
    tipo_almacen: u.tipoAlmacen ?? u.tipo_almacen ?? 'ambiente'
  };
}

function mapUbicacion(u) {
  return {
    id: u.id, codigo: u.codigo, zona: u.zona, pasillo: u.pasillo,
    estanteria: u.estanteria, nivel: u.nivel,
    capacidadMaxima: u.capacidad_maxima ?? u.capacidadMaxima ?? 0,
    tipoAlmacen: u.tipo_almacen ?? u.tipoAlmacen ?? 'ambiente'
  };
}

function entradaMercanciaToDb(e) {
  return {
    id: e.id, numero_albaran: e.numeroAlbaran ?? e.numero_albaran,
    proveedor: e.proveedor, fecha: e.fecha, estado: e.estado,
    lineas: e.lineas || [], corregida_de: e.corregidaDe ?? e.corregida_de ?? null,
    observaciones: e.observaciones
  };
}

function mapEntradaMercancia(e) {
  return {
    id: e.id, numeroAlbaran: e.numero_albaran ?? e.numeroAlbaran,
    proveedor: e.proveedor, fecha: e.fecha, estado: e.estado,
    lineas: e.lineas || [], corregidaDe: e.corregida_de ?? e.corregidaDe ?? null,
    observaciones: e.observaciones
  };
}

function getUbicacionesLocal() { try { const r = localStorage.getItem('mes_ubicaciones'); return r ? JSON.parse(r) : null; } catch (_) { return null; } }
function setUbicacionesLocal(d) { try { localStorage.setItem('mes_ubicaciones', JSON.stringify(d)); } catch (_) {} }

export async function fetchUbicaciones() {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('ubicaciones').select('*');
      if (!error && data) {
        return { data: data.map(mapUbicacion), error: null };
      }
    } catch (e) { console.warn('Supabase fetchUbicaciones error:', e); }
  }
  const local = getUbicacionesLocal();
  if (local) return { data: local, error: null };
  return { data: mockUbicaciones, error: null };
}

export async function updateUbicacion(id, ubicacion) {
  const local = getUbicacionesLocal() || [...mockUbicaciones];
  let next = local;
  let updated = null;
  const idx = local.findIndex(u => u.id === id);
  if (idx !== -1) {
    updated = { ...local[idx], ...ubicacion };
    local[idx] = updated;
    setUbicacionesLocal(local);
  } else {
    updated = { ...ubicacion, id: id || `UBI-${Date.now()}` };
    next = [...local, updated];
    setUbicacionesLocal(next);
  }

  if (isSupabaseConfigured()) {
    try {
      const dbPayload = ubicacionToDb(updated);
      const { data, error } = await supabase.from('ubicaciones').upsert(dbPayload).select().single();
      if (!error && data) {
        updated = mapUbicacion(data);
      }
    } catch (e) { console.warn('Supabase updateUbicacion error:', e); }
  }

  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('ubicaciones_updated'));
  return { data: updated, error: null };
}

export async function deleteUbicacion(id) {
  const local = getUbicacionesLocal() || [...mockUbicaciones];
  setUbicacionesLocal(local.filter(u => u.id !== id));
  
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('ubicaciones').delete().eq('id', id);
    } catch (e) { console.warn('Supabase deleteUbicacion error:', e); }
  }

  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('ubicaciones_updated'));
  return { error: null };
}

function getEntradasLocal() { try { const r = localStorage.getItem('mes_entradas_mercancia'); return r ? JSON.parse(r) : null; } catch (_) { return null; } }
function setEntradasLocal(d) { try { localStorage.setItem('mes_entradas_mercancia', JSON.stringify(d)); } catch (_) {} }

export async function fetchEntradasMercancia() {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('entradas_mercancia').select('*').order('fecha', { ascending: false });
      if (!error && data) {
        return { data: data.map(mapEntradaMercancia), error: null };
      }
    } catch (e) { console.warn('Supabase fetchEntradasMercancia error:', e); }
  }
  const local = getEntradasLocal();
  if (local) return { data: local, error: null };
  return { data: mockEntradasMercancia, error: null };
}

export async function insertEntradaMercancia(entrada) {
  const local = getEntradasLocal() || [...mockEntradasMercancia];
  let nueva = {
    ...entrada,
    id: entrada.id || `ENT-${Date.now()}`,
    fecha: entrada.fecha || new Date().toISOString(),
    estado: entrada.estado || 'confirmada',
    lineas: entrada.lineas || [],
    corregidaDe: entrada.corregidaDe || null
  };
  setEntradasLocal([nueva, ...local]);

  if (isSupabaseConfigured()) {
    try {
      const dbPayload = entradaMercanciaToDb(nueva);
      const { data, error } = await supabase.from('entradas_mercancia').insert(dbPayload).select().single();
      if (!error && data) {
        nueva = mapEntradaMercancia(data);
      }
    } catch (e) { console.warn('Supabase insertEntradaMercancia error:', e); }
  }

  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('entradas_updated'));
  return { data: nueva, error: null };
}

export async function updateEntradaMercancia(id, entradaUpdate) {
  const local = getEntradasLocal() || [...mockEntradasMercancia];
  const idx = local.findIndex(e => e.id === id);
  if (idx === -1) return { error: 'No encontrado' };
  let updated = { ...local[idx], ...entradaUpdate };
  local[idx] = updated;
  setEntradasLocal(local);

  if (isSupabaseConfigured()) {
    try {
      const dbPayload = entradaMercanciaToDb(updated);
      delete dbPayload.id; // Evitar conflictos de PK en update
      const { data, error } = await supabase.from('entradas_mercancia').update(dbPayload).eq('id', id).select().single();
      if (!error && data) {
        updated = mapEntradaMercancia(data);
      }
    } catch (e) { console.warn('Supabase updateEntradaMercancia error:', e); }
  }

  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('entradas_updated'));
  return { data: updated, error: null };
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

export async function insertCalidad(defecto, isOfflineReplay = false) {
  if (typeof window !== 'undefined' && !navigator.onLine && !isOfflineReplay) {
    enqueueWrite('insertCalidad', defecto);
    return { data: { id: 'PENDING-' + Date.now() }, error: null, offline: true };
  }

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

export async function insertProduccion(item, isOfflineReplay = false) {
  if (typeof window !== 'undefined' && !navigator.onLine && !isOfflineReplay) {
    enqueueWrite('insertProduccion', item);
    return { data: { id: 'PENDING-' + Date.now() }, error: null, offline: true };
  }

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
        if (!error && data) {
        const mappedData = data.map(d => ({
          ...d,
          templateId: d.template_id,
          templateNombre: d.template_nombre,
          operarioId: d.operario_id,
          fechaEjecucion: d.fecha_ejecucion,
          tiempoReal: d.tiempo_real
        }));
        return { data: mappedData, error: null };
      }
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
        if (!error && data) {
        const mappedData = data.map(d => ({
          ...d,
          templateId: d.template_id,
          templateNombre: d.template_nombre,
          operarioId: d.operario_id,
          fechaEjecucion: d.fecha_ejecucion,
          tiempoReal: d.tiempo_real
        }));
        return { data: mappedData, error: null };
      }
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

// ─── RETENCIONES DE CALIDAD (QUALITY HOLD) ───────────────────────────────────
function getRetencionesCalidadLocal() {
  try { const r = localStorage.getItem('mes_retenciones_calidad'); return r ? JSON.parse(r) : null; } catch (_) { return null; }
}
function setRetencionesCalidadLocal(d) {
  try { localStorage.setItem('mes_retenciones_calidad', JSON.stringify(d)); } catch (_) {}
}

const retencionesCalidadIniciales = [
  { id: 'RET-101', codigo: 'HOLD-001', linea: 'L3', motivo: 'Fallo repetido de estanqueidad en test final', gravedad: 'critica', estado: 'abierta', fechaApertura: new Date().toISOString().slice(0, 16).replace('T', ' '), fechaCierre: '', inspector: 'Laura Calidad (QC)' }
];

export async function fetchRetencionesCalidad() {
  const local = getRetencionesCalidadLocal();
  if (local) return { data: local, fromSupabase: false };
  setRetencionesCalidadLocal(retencionesCalidadIniciales);
  return { data: retencionesCalidadIniciales, fromSupabase: false };
}

export async function insertRetencionCalidad(item) {
  const current = (await fetchRetencionesCalidad()).data || [];
  const newItem = {
    id: item.id || `RET-${Date.now()}`,
    codigo: item.codigo || `HOLD-${Math.floor(100 + Math.random() * 900)}`,
    linea: item.linea || 'L1',
    motivo: item.motivo || 'Defecto crítico detectado en inspección',
    gravedad: item.gravedad || 'critica',
    estado: item.estado || 'abierta',
    fechaApertura: new Date().toISOString().slice(0, 16).replace('T', ' '),
    fechaCierre: '',
    inspector: item.inspector || 'Inspector Calidad'
  };
  const updated = [newItem, ...current];
  setRetencionesCalidadLocal(updated);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('calidad_updated'));
  return { data: newItem, error: null };
}

export async function updateRetencionCalidad(id, changes) {
  const current = (await fetchRetencionesCalidad()).data || [];
  let updatedItem = null;
  const updated = current.map(item => {
    if (item.id === id) {
      updatedItem = { ...item, ...changes };
      return updatedItem;
    }
    return item;
  });
  setRetencionesCalidadLocal(updated);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('calidad_updated'));
  return { data: updatedItem, error: null };
}

export async function deleteRetencionCalidad(id) {
  const current = (await fetchRetencionesCalidad()).data || [];
  setRetencionesCalidadLocal(current.filter(item => item.id !== id));
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('calidad_updated'));
  return { error: null };
}

// Helper común para registrar incidencias de calidad rápidas desde Planta (PanelOperario & PanelCalidad)
export async function registrarIncidenciaCalidad({ tipo, causa, cantidad, pct, lineaId, lineaActiva, operarioNombre }) {
  const qty = Number(cantidad) || 1;
  const motivoStr = `${causa} (${lineaActiva?.nombre || lineaId} - ${operarioNombre || 'Planta'})`;

  if (tipo === 'scrap') {
    await insertScrap({
      descripcion: motivoStr,
      causa: causa,
      cantidad: qty,
      unidad: 'ud',
      costeUnitario: 12,
      linea: lineaActiva?.nombre || lineaId,
      fecha: new Date().toISOString().slice(0, 10),
      turno: getCurrentShiftInfo().shift,
      destino: 'Chatarra'
    });
  } else if (tipo === 'defecto') {
    await insertDefecto({
      causa: motivoStr,
      categoria: 'Inspección Planta',
      cantidad: qty,
      pct: pct || 5,
      linea: lineaActiva?.nombre || lineaId,
      gravedad: 'alta'
    });
  }

  // Ajuste de calidad en la línea si se indica
  if (lineaId && lineaActiva) {
    const castigo = tipo === 'scrap' ? 0.6 : 0.3;
    const nuevaCalidad = Math.max(70, Number(lineaActiva.calidad || 98) - castigo);
    await updateLinea(lineaId, { ...lineaActiva, calidad: Number(nuevaCalidad.toFixed(1)) });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('lineas_updated'));
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('calidad_updated'));
    window.dispatchEvent(new CustomEvent('produccion_updated'));
  }
}

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
      if (!error && data && data.length > 0) {
        return { data: data.map(o => ({ ...o, autorizaciones: o.autorizaciones || [] })), fromSupabase: true };
      }
    } catch (e) { console.warn('Fallback a localStorage/mock operarios:', e); }
  }
  const local = getOperariosLocal();
  if (local && Array.isArray(local) && local.length > 0) {
    return { data: local.map(o => ({ ...o, autorizaciones: o.autorizaciones || [] })), fromSupabase: false };
  }
  setOperariosLocal(mockOperarios);
  return { data: mockOperarios.map(o => ({ ...o, autorizaciones: o.autorizaciones || [] })), fromSupabase: false };
}

export async function insertOperario(operario) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('operarios').insert([operario]).select().single();
      if (!error && data) {
        const mappedData = data.map(d => ({
          ...d,
          templateId: d.template_id,
          templateNombre: d.template_nombre,
          operarioId: d.operario_id,
          fechaEjecucion: d.fecha_ejecucion,
          tiempoReal: d.tiempo_real
        }));
        return { data: mappedData, error: null };
      }
    } catch (e) {}
  }
  const local = getOperariosLocal();
  const current = (local && Array.isArray(local) && local.length > 0) ? local : mockOperarios;
  const newItem = { ...operario, id: operario.id || `OP-${String(Date.now()).slice(-4)}` };
  const updated = [...current, newItem];
  setOperariosLocal(updated);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('operarios_updated'));
  return { data: newItem, error: null };
}

export async function updateOperario(id, operario) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('operarios').update(operario).eq('id', id).select().single();
      if (!error && data) {
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('operarios_updated'));
        return { data, error: null };
      }
    } catch (e) {}
  }
  const local = getOperariosLocal();
  const current = (local && Array.isArray(local) && local.length > 0) ? local : mockOperarios;
  const updated = current.map(o => o.id === id ? { ...o, ...operario } : o);
  setOperariosLocal(updated);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('operarios_updated'));
  return { data: updated.find(o => o.id === id), error: null };
}

export async function deleteOperario(id) {
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from('operarios').delete().eq('id', id);
      if (!error) {
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('operarios_updated'));
        return { error: null };
      }
    } catch (e) {}
  }
  const local = getOperariosLocal();
  const current = (local && Array.isArray(local) && local.length > 0) ? local : mockOperarios;
  const updated = current.filter(o => o.id !== id);
  setOperariosLocal(updated);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('operarios_updated'));
  return { error: null };
}

export function restoreOperariosCatalog() {
  setOperariosLocal(mockOperarios);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('operarios_updated'));
  return mockOperarios;
}

export async function registrarHistorialOperario(operarioId, entrada) {
  const local = getOperariosLocal();
  const current = (local && Array.isArray(local) && local.length > 0) ? local : mockOperarios;
  const op = current.find(o => o.id === operarioId);
  if (!op) return { data: null, error: 'Operario no encontrado' };

  const historialActual = Array.isArray(op.historial) ? op.historial : [];
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const fechaStr = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  
  const nuevaEntrada = {
    id: entrada.id || `HS-${Date.now().toString().slice(-4)}`,
    fecha: entrada.fecha || fechaStr,
    tipo: entrada.tipo || 'actuacion',
    descripcion: entrada.descripcion || '',
    linea: entrada.linea || (op.lineaActualId ? `L${op.lineaActualId}` : 'Planta'),
    piezas: entrada.piezas !== undefined ? Number(entrada.piezas) : 0,
    ...entrada
  };

  const nuevoHistorial = [nuevaEntrada, ...historialActual];
  return await updateOperario(operarioId, { historial: nuevoHistorial });
}

// ─── CATÁLOGO MAESTRO DE CUALIFICACIONES, SKILLS, FORMACIONES Y PERMISOS ────
export function getCatalogoSkills() {
  try {
    const r = localStorage.getItem('mes_catalogo_skills');
    return r ? JSON.parse(r) : skillsMasterIniciales;
  } catch (_) { return skillsMasterIniciales; }
}
export function saveCatalogoSkills(lista) {
  try {
    localStorage.setItem('mes_catalogo_skills', JSON.stringify(lista));
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('cualificaciones_updated'));
  } catch (_) {}
}

export function getCatalogoFormaciones() {
  try {
    const r = localStorage.getItem('mes_catalogo_formaciones');
    return r ? JSON.parse(r) : formacionesMasterIniciales;
  } catch (_) { return formacionesMasterIniciales; }
}
export function saveCatalogoFormaciones(lista) {
  try {
    localStorage.setItem('mes_catalogo_formaciones', JSON.stringify(lista));
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('cualificaciones_updated'));
  } catch (_) {}
}

export function getCatalogoPermisos() {
  try {
    const r = localStorage.getItem('mes_catalogo_permisos');
    return r ? JSON.parse(r) : permisosMasterIniciales;
  } catch (_) { return permisosMasterIniciales; }
}
export function saveCatalogoPermisos(lista) {
  try {
    localStorage.setItem('mes_catalogo_permisos', JSON.stringify(lista));
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('cualificaciones_updated'));
  } catch (_) {}
}

export function getCatalogoCapacitaciones() {
  try {
    const r = localStorage.getItem('mes_catalogo_capacitaciones');
    return r ? JSON.parse(r) : capacitacionesMasterIniciales;
  } catch (_) { return capacitacionesMasterIniciales; }
}
export function saveCatalogoCapacitaciones(lista) {
  try {
    localStorage.setItem('mes_catalogo_capacitaciones', JSON.stringify(lista));
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('cualificaciones_updated'));
  } catch (_) {}
}

export function getCatalogoAutorizaciones() {
  try {
    const r = localStorage.getItem('mes_catalogo_autorizaciones');
    return r ? JSON.parse(r) : autorizacionesMasterIniciales;
  } catch (_) { return autorizacionesMasterIniciales; }
}
export function saveCatalogoAutorizaciones(lista) {
  try {
    localStorage.setItem('mes_catalogo_autorizaciones', JSON.stringify(lista));
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('cualificaciones_updated'));
  } catch (_) {}
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
  if (!parada || parada.estado === 'cerrada') {
    alert('⚠️ No se puede generar ni asignar una Orden de Trabajo a una parada que ya se encuentra cerrada.');
    return { data: null, error: 'Parada cerrada' };
  }
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
  const res = await insertOrdenTrabajo(nuevaOt);
  if (parada.id && res.data) {
    await updateParada(parada.id, { ...parada, otAsignada: res.data.codigo || nuevaOt.codigo, otId: res.data.id || nuevaOt.id });
  }
  return res;
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

// ═══════════════════════════════════════════════════════════════════════════════
// ─── CHECKLISTS TEMPLATES (PLANTILLAS REUTILIZABLES: CALIDAD, CIL, MTO) ───
// ═══════════════════════════════════════════════════════════════════════════════

const CHECKLISTS_TEMPLATES_KEY = 'mes_checklists_templates';
const CHECKLISTS_EJECUCIONES_KEY = 'mes_checklists_ejecuciones';

function getChecklistTemplatesLocal() {
  const d = localStorage.getItem(CHECKLISTS_TEMPLATES_KEY);
  return d ? JSON.parse(d) : mockChecklistTemplates;
}
function setChecklistTemplatesLocal(d) {
  localStorage.setItem(CHECKLISTS_TEMPLATES_KEY, JSON.stringify(d));
}

function getChecklistEjecucionesLocal() {
  const d = localStorage.getItem(CHECKLISTS_EJECUCIONES_KEY);
  return d ? JSON.parse(d) : [];
}
function setChecklistEjecucionesLocal(d) {
  localStorage.setItem(CHECKLISTS_EJECUCIONES_KEY, JSON.stringify(d));
}

export async function getChecklistTemplates() {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('checklist_templates').select('*').order('nombre', { ascending: true });
      if (!error && data && data.length > 0) return { data, error: null };
    } catch (e) {
      console.warn('Fallback a local para checklist_templates:', e);
    }
  }
  return { data: getChecklistTemplatesLocal(), error: null };
}

export async function insertChecklistTemplate(tpl) {
  const nuevo = {
    ...tpl,
    id: tpl.id || `CHK-${tpl.categoria?.toUpperCase().slice(0, 3) || 'GEN'}-${Math.floor(100 + Math.random() * 900)}`,
    items: tpl.items || [],
    activo: tpl.activo !== undefined ? tpl.activo : true
  };

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('checklist_templates').insert([nuevo]).select();
      if (!error && data) {
        const d = data[0];
        const mappedData = {
          ...d,
          templateId: d.template_id,
          templateNombre: d.template_nombre,
          operarioId: d.operario_id,
          fechaEjecucion: d.fecha_ejecucion,
          tiempoReal: d.tiempo_real
        };
        return { data: mappedData, error: null };
      }
    } catch (e) {
      console.warn('Error Supabase insertChecklistTemplate:', e);
    }
  }

  const list = getChecklistTemplatesLocal();
  list.push(nuevo);
  setChecklistTemplatesLocal(list);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('checklists_updated'));
  return { data: nuevo, error: null };
}

export async function updateChecklistTemplate(id, tpl) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('checklist_templates').update(tpl).eq('id', id).select();
      if (!error && data) {
        const d = data[0];
        const mappedData = {
          ...d,
          templateId: d.template_id,
          templateNombre: d.template_nombre,
          operarioId: d.operario_id,
          fechaEjecucion: d.fecha_ejecucion,
          tiempoReal: d.tiempo_real
        };
        return { data: mappedData, error: null };
      }
    } catch (e) {
      console.warn('Error Supabase updateChecklistTemplate:', e);
    }
  }

  const list = getChecklistTemplatesLocal();
  const idx = list.findIndex(item => item.id === id);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...tpl };
    setChecklistTemplatesLocal(list);
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('checklists_updated'));
    return { data: list[idx], error: null };
  }
  return { data: null, error: 'No encontrado' };
}

export async function deleteChecklistTemplate(id) {
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('checklist_templates').delete().eq('id', id);
    } catch (e) {
      console.warn('Error Supabase deleteChecklistTemplate:', e);
    }
  }

  const list = getChecklistTemplatesLocal().filter(item => item.id !== id);
  setChecklistTemplatesLocal(list);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('checklists_updated'));
  return { data: { id }, error: null };
}

// ─── Gestión de items de plantilla ──────────────────────────────────────────

export async function addChecklistTemplateItem(templateId, item) {
  const list = getChecklistTemplatesLocal();
  const tpl = list.find(t => t.id === templateId);
  if (!tpl) return { data: null, error: 'Plantilla no encontrada' };

  const newItem = {
    id: item.id || `IT-${Date.now().toString().slice(-4)}`,
    texto: item.texto || (typeof item === 'string' ? item : 'Nuevo ítem'),
    orden: (tpl.items || []).length + 1,
    critico: item.critico || false
  };

  const newItems = [...(tpl.items || []), newItem];
  return updateChecklistTemplate(templateId, { items: newItems });
}

export async function updateChecklistTemplateItem(templateId, itemId, itemUpdate) {
  const list = getChecklistTemplatesLocal();
  const tpl = list.find(t => t.id === templateId);
  if (!tpl) return { data: null, error: 'Plantilla no encontrada' };

  const newItems = (tpl.items || []).map((it, idx) => {
    if (it.id === itemId || idx === itemId || String(idx) === String(itemId)) {
      return typeof itemUpdate === 'string' ? { ...it, texto: itemUpdate } : { ...it, ...itemUpdate };
    }
    return it;
  });

  return updateChecklistTemplate(templateId, { items: newItems });
}

export async function removeChecklistTemplateItem(templateId, itemId) {
  const list = getChecklistTemplatesLocal();
  const tpl = list.find(t => t.id === templateId);
  if (!tpl) return { data: null, error: 'Plantilla no encontrada' };

  const newItems = (tpl.items || []).filter((it, idx) => it.id !== itemId && idx !== itemId && String(idx) !== String(itemId));
  return updateChecklistTemplate(templateId, { items: newItems });
}

export async function reordenarChecklistTemplateItems(templateId, nuevoOrdenItems) {
  return updateChecklistTemplate(templateId, { items: nuevoOrdenItems });
}

// ─── REGISTRO DE EJECUCIONES (EN PLANTA) ────────────────────────────────────

export async function insertChecklistEjecucion(ejecucion) {
  const nuevo = {
    ...ejecucion,
    id: ejecucion.id || `EXE-${Date.now()}`,
    fecha: ejecucion.fecha || new Date().toISOString(),
    huboIncidenciaCritica: ejecucion.huboIncidenciaCritica || false
  };

  if (isSupabaseConfigured()) {
    try {
      const dbPayload = {
        id: nuevo.id,
        template_id: nuevo.templateId,
        template_nombre: nuevo.templateNombre,
        linea: nuevo.linea,
        turno: nuevo.turno,
        operario_id: nuevo.operarioId,
        fecha_ejecucion: nuevo.fechaEjecucion,
        respuestas: nuevo.respuestas,
        estado: nuevo.estado,
        comentarios: nuevo.comentarios,
        tiempo_real: nuevo.tiempoReal,
        fecha: nuevo.fecha,
        huboIncidenciaCritica: nuevo.huboIncidenciaCritica
      };
      const { data, error } = await supabase.from('checklist_ejecuciones').insert([dbPayload]).select();
      if (!error && data) {
        const d = data[0];
        const mappedData = {
          ...d,
          templateId: d.template_id,
          templateNombre: d.template_nombre,
          operarioId: d.operario_id,
          fechaEjecucion: d.fecha_ejecucion,
          tiempoReal: d.tiempo_real
        };
        return { data: mappedData, error: null };
      }
    } catch (e) {
      console.warn('Error Supabase insertChecklistEjecucion:', e);
    }
  }

  const list = getChecklistEjecucionesLocal();
  list.unshift(nuevo);
  setChecklistEjecucionesLocal(list);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('checklists_ejecutados'));
  return { data: nuevo, error: null };
}

export async function getChecklistEjecuciones() {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('checklist_ejecuciones').select('*').order('fecha', { ascending: false });
      if (!error && data) {
        const mappedData = data.map(d => ({
          ...d,
          templateId: d.template_id,
          templateNombre: d.template_nombre,
          operarioId: d.operario_id,
          fechaEjecucion: d.fecha_ejecucion,
          tiempoReal: d.tiempo_real
        }));
        return { data: mappedData, error: null };
      }
    } catch (e) {
      console.warn('Fallback a local para checklist_ejecuciones:', e);
    }
  }
  return { data: getChecklistEjecucionesLocal(), error: null };
}

// ─── CÁLCULO DE OEE ────────────────────────────────────────────────────────
export async function calcularOEEPorLinea() {
  try {
    const [{ data: lineas }, { data: paradas }, { data: produccion }, { data: calidad }] = await Promise.all([
      fetchLineas(),
      fetchParadas(),
      fetchProduccion(),
      fetchCalidad()
    ]);

    const { shift } = getCurrentShiftInfo();
    const tiempoTurnoMins = 8 * 60; // 480 mins

    const paradasTurno = (paradas || []).filter(p => p.turno === shift || !p.turno);
    const prodTurno = (produccion || []).filter(p => p.turno === shift || !p.turno);
    const calidadTurno = (calidad || []).filter(c => c.turno === shift || !c.turno);

    const resultados = [];

    for (const linea of (lineas || [])) {
      let fuente = 'calculado';
      
      // DISPONIBILIDAD
      let disponibilidad = 0;
      const paradasLinea = paradasTurno.filter(p => p.linea === linea.nombre);
      if (paradasLinea.length > 0) {
        const minsParado = paradasLinea.reduce((acc, p) => acc + (Number(p.duracion) || 0), 0);
        disponibilidad = Math.max(0, ((tiempoTurnoMins - minsParado) / tiempoTurnoMins) * 100);
      } else {
        // Fallback a tablaDisponibilidadLineas si no hay paradas pero la linea puede estar activa
        const refMto = tablaDisponibilidadLineas.find(t => t.linea === linea.nombre);
        disponibilidad = refMto ? Number(refMto.real) : Number(linea.disponibilidad || 100);
        if (refMto) fuente = 'fallback';
      }

      // RENDIMIENTO
      let rendimiento = 0;
      const ph = Number(linea.produccionHoy) || 0;
      const oh = Number(linea.objetivoHoy) || 0;
      if (oh > 0) {
        rendimiento = (ph / oh) * 100;
      } else if (Number(linea.velocidadNominal) > 0) {
        rendimiento = (Number(linea.velocidadActual || 0) / Number(linea.velocidadNominal)) * 100;
      } else {
        rendimiento = Number(linea.rendimiento || 100);
        fuente = 'fallback';
      }

      // CALIDAD
      let calidadPct = 0;
      const defectosLinea = calidadTurno.filter(c => c.linea === linea.nombre);
      if (ph > 0) {
        const totalDefectos = defectosLinea.reduce((acc, c) => acc + (Number(c.cantidad) || 0), 0);
        calidadPct = Math.max(0, ((ph - totalDefectos) / ph) * 100);
      } else {
        calidadPct = Number(linea.calidad || 100);
        fuente = 'fallback';
      }

      // Capping a 100%
      const dispCapped = Math.min(100, disponibilidad);
      const rendCapped = Math.min(100, rendimiento);
      const calCapped = Math.min(100, calidadPct);

      const oee = (dispCapped * rendCapped * calCapped) / 10000;

      const newVals = {
        disponibilidad: Number(dispCapped.toFixed(1)),
        rendimiento: Number(rendCapped.toFixed(1)),
        rendimientoBruto: Number(rendimiento.toFixed(1)),
        calidad: Number(calCapped.toFixed(1)),
        oee: Number(oee.toFixed(1)),
        _fuenteOee: fuente
      };

      await updateLinea(linea.id, newVals);
      resultados.push({ lineaId: linea.id, ...newVals });
    }
    
    return resultados;
  } catch (err) {
    console.error('Error calculando OEE:', err);
    return [];
  }
}




// ─── AUDITORÍA / CHANGELOG ──────────────────────────────────────────────────
function getAuditLocal() { try { const r = localStorage.getItem('mes_audit_log'); return r ? JSON.parse(r) : []; } catch (_) { return []; } }
function setAuditLocal(d) { try { localStorage.setItem('mes_audit_log', JSON.stringify(d)); } catch (_) {} }

export async function registrarAuditoria({ tabla, registroId, accion, cambios }) {
  try {
    const { user, profile } = await supabase.auth.getUser().then(res => ({
      user: res.data?.user,
      profile: null // We could fetch profile here if needed, but we pass user.id for now
    })).catch(() => ({ user: null }));

    const payload = {
      tabla,
      registro_id: registroId,
      accion,
      usuario_id: user?.id || null,
      usuario_nombre: user?.email || 'Local User',
      cambios: cambios || {}
    };

    if (isSupabaseConfigured()) {
      // Intentar insertar en Supabase (silencioso si falla)
      supabase.from('audit_log').insert([payload]).then(({error}) => {
        if (error) console.warn('Supabase audit log insert error:', error);
      });
    }
    
    // Guardar en local como fallback
    const current = getAuditLocal();
    const localPayload = { ...payload, id: Date.now(), fecha: new Date().toISOString() };
    setAuditLocal([localPayload, ...current].slice(0, 500)); // mantener ultimos 500
    
  } catch (err) {
    console.warn('Error en registrarAuditoria:', err);
  }
}

export async function fetchAuditoria() {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('audit_log').select('*').order('fecha', { ascending: false }).limit(500);
      if (!error && data) return { data, fromSupabase: true };
    } catch (e) {
      console.warn('Error fetchAuditoria Supabase:', e);
    }
  }
  return { data: getAuditLocal(), fromSupabase: false };
}


// ─── PWA OFFLINE QUEUE ───────────────────────────────────────────────────────
function getPendingWrites() { try { const r = localStorage.getItem('mes_pending_writes'); return r ? JSON.parse(r) : []; } catch (_) { return []; } }
function setPendingWrites(d) { try { localStorage.setItem('mes_pending_writes', JSON.stringify(d)); window.dispatchEvent(new CustomEvent('offline_queue_updated')); } catch (_) {} }

export function enqueueWrite(operation, payload) {
  const current = getPendingWrites();
  current.push({ id: Date.now(), operation, payload, retries: 0 });
  setPendingWrites(current);
}

export async function processOfflineQueue() {
  if (!navigator.onLine) return;
  const current = getPendingWrites();
  if (current.length === 0) return;

  const remaining = [];
  for (const item of current) {
    try {
      // Dynamic dispatch based on operation name string
      // This assumes the functions are exported and available, but we can't easily dynamically call exports from inside the same module.
      // So we map them manually:
      if (item.operation === 'insertProduccion' && typeof insertProduccion === 'function') { await insertProduccion(item.payload, true); }
      else if (item.operation === 'insertParada' && typeof insertParada === 'function') { await insertParada(item.payload, true); }
      else if (item.operation === 'insertCalidad' && typeof insertCalidad === 'function') { await insertCalidad(item.payload, true); }
      else {
        console.warn('Unknown operation in offline queue:', item.operation);
      }
    } catch (e) {
      console.error('Failed to process offline queue item:', item, e);
      if (item.retries < 3) {
        item.retries++;
        remaining.push(item);
      }
    }
  }
  setPendingWrites(remaining);
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', processOfflineQueue);
}

export function getOfflineQueueCount() {
  return getPendingWrites().length;
}

// ─── SÍNTESIS AUTOMÁTICA (IA Simulada basada en reglas) ─────────────────────
export async function generarSintesisAutomatica(modulo) {
  try {
    switch (modulo) {
      case 'mantenimiento': {
        const [{ data: ots }, { data: repuestos }] = await Promise.all([fetchOrdenesTrabajo(), fetchRepuestos()]);
        const correctivas = (ots || []).filter(o => o.tipo === 'correctivo' && o.estado !== 'completada').length;
        const bajoStock = (repuestos || []).filter(r => Number(r.stock_actual) < Number(r.stock_minimo)).length;
        return `Actualmente hay ${correctivas} averías correctivas en curso. Se detectan ${bajoStock} repuestos por debajo del stock de seguridad crítico. Priorice las tareas de línea principal.`;
      }
      case 'produccion': {
        const [{ data: lineas }, { data: paradas }] = await Promise.all([fetchLineas(), fetchParadas()]);
        const { shift } = getCurrentShiftInfo();
        const paradasTurno = (paradas || []).filter(p => p.turno === shift || !p.turno);
        let maxParadas = { linea: 'ninguna', mins: 0 };
        const lineaData = (lineas || []).map(l => {
          const mins = paradasTurno.filter(p => p.linea === l.nombre).reduce((acc, p) => acc + (Number(p.duracion) || 0), 0);
          if (mins > maxParadas.mins) maxParadas = { linea: l.nombre, mins };
          return l;
        });
        const baja = lineaData.filter(l => Number(l.oee) < 70).length;
        return `El turno actual avanza con ${baja} líneas rindiendo por debajo del 70% OEE. El principal cuello de botella está en la ${maxParadas.linea} con ${maxParadas.mins} mins perdidos.`;
      }
      case 'calidad': {
        const { data: calidad } = await fetchCalidad();
        const { shift } = getCurrentShiftInfo();
        const turnoCalidad = (calidad || []).filter(c => c.turno === shift || !c.turno);
        const scrap = turnoCalidad.filter(c => c.tipo === 'scrap').reduce((acc, c) => acc + (Number(c.cantidad) || 0), 0);
        return `El turno acumula ${scrap} unidades desechadas (scrap). La calidad FPY se mantiene estable pero se sugiere revisar ajustes en la zona de paletizado.`;
      }
      case 'dashboard': {
        const [{ data: lineas }, { data: alertas }] = await Promise.all([fetchLineas(), fetchAlertas()]);
        const oeePromedio = lineas?.length ? lineas.reduce((a, b) => a + Number(b.oee), 0) / lineas.length : 0;
        const criticas = (alertas || []).filter(a => a.tipo === 'critica' && !a.leida).length;
        return `Rendimiento de planta estable al ${oeePromedio.toFixed(1)}% OEE global. Hay ${criticas} alertas críticas sin atender. El suministro de materia prima para la L1 está garantizado para el próximo turno.`;
      }
      default:
        return 'Sintetizando datos operativos...';
    }
  } catch (e) {
    return 'No se pudo generar la síntesis automática en este momento.';
  }
}

// ─── LEAN (KAIZEN, SMED) ──────────────────────────────────────────────────

function getKaizenLocal() { try { const r = localStorage.getItem('mes_kaizen'); return r ? JSON.parse(r) : null; } catch (_) { return null; } }
function setKaizenLocal(d) { try { localStorage.setItem('mes_kaizen', JSON.stringify(d)); } catch (_) {} }

export async function fetchKaizen() {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('kaizen').select('*').order('id', { ascending: false });
      if (!error && data) return { data, fromSupabase: true };
    } catch (e) {}
  }
  const local = getKaizenLocal();
  if (local) return { data: local, fromSupabase: false };
  setKaizenLocal(mockKaizen);
  return { data: mockKaizen, fromSupabase: false };
}

export async function insertKaizen(item) {
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from('kaizen').insert([item]);
      if (!error) {
        window.dispatchEvent(new Event('kaizen_updated'));
        return { success: true };
      }
    } catch (e) {}
  }
  const local = getKaizenLocal() || mockKaizen;
  local.unshift({ ...item, id: item.id || `k${Date.now()}` });
  setKaizenLocal(local);
  window.dispatchEvent(new Event('kaizen_updated'));
  return { success: true };
}

export async function updateKaizen(id, updates) {
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from('kaizen').update(updates).eq('id', id);
      if (!error) {
        window.dispatchEvent(new Event('kaizen_updated'));
        return { success: true };
      }
    } catch (e) {}
  }
  const local = getKaizenLocal() || mockKaizen;
  const idx = local.findIndex(x => x.id === id);
  if (idx !== -1) {
    local[idx] = { ...local[idx], ...updates };
    setKaizenLocal(local);
  }
  window.dispatchEvent(new Event('kaizen_updated'));
  return { success: true };
}

export async function deleteKaizen(id) {
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from('kaizen').delete().eq('id', id);
      if (!error) {
        window.dispatchEvent(new Event('kaizen_updated'));
        return { success: true };
      }
    } catch (e) {}
  }
  let local = getKaizenLocal() || mockKaizen;
  local = local.filter(x => x.id !== id);
  setKaizenLocal(local);
  window.dispatchEvent(new Event('kaizen_updated'));
  return { success: true };
}

function getCambiosFormatoLocal() { try { const r = localStorage.getItem('mes_cambios_formato'); return r ? JSON.parse(r) : null; } catch (_) { return null; } }
function setCambiosFormatoLocal(d) { try { localStorage.setItem('mes_cambios_formato', JSON.stringify(d)); } catch (_) {} }

export async function fetchCambiosFormato() {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('cambios_formato').select('*').order('id', { ascending: false });
      if (!error && data) return { data, fromSupabase: true };
    } catch (e) {}
  }
  const local = getCambiosFormatoLocal();
  if (local) return { data: local, fromSupabase: false };
  setCambiosFormatoLocal(mockCambiosFormato);
  return { data: mockCambiosFormato, fromSupabase: false };
}

export async function insertCambiosFormato(item) {
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from('cambios_formato').insert([item]);
      if (!error) {
        window.dispatchEvent(new Event('cambios_formato_updated'));
        return { success: true };
      }
    } catch (e) {}
  }
  const local = getCambiosFormatoLocal() || mockCambiosFormato;
  local.unshift({ ...item, id: item.id || `cf${Date.now()}` });
  setCambiosFormatoLocal(local);
  window.dispatchEvent(new Event('cambios_formato_updated'));
  return { success: true };
}

function getTiemposCambioEstandarLocal() { try { const r = localStorage.getItem('mes_tiempos_cambio_estandar'); return r ? JSON.parse(r) : null; } catch (_) { return null; } }
function setTiemposCambioEstandarLocal(d) { try { localStorage.setItem('mes_tiempos_cambio_estandar', JSON.stringify(d)); } catch (_) {} }

export async function fetchTiemposCambioEstandar() {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('tiempos_cambio_estandar').select('*');
      if (!error && data) return { data, fromSupabase: true };
    } catch (e) {}
  }
  const local = getTiemposCambioEstandarLocal();
  if (local) return { data: local, fromSupabase: false };
  setTiemposCambioEstandarLocal(mockTiemposCambioEstandar);
  return { data: mockTiemposCambioEstandar, fromSupabase: false };
}
