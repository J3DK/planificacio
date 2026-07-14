// Mock data — Calidad (ampliado con catálogos CRUD)

// ─── KPIs resumen ────────────────────────────────────────────────────────────
export const kpisCalidad = {
  fpy: 98.8,
  scrap: 640,
  scrapPct: 1.2,
  retrabajos: 320,
  retrabajoPct: 0.6,
  reclamaciones: 2,
  objetivoFPY: 99.0,
};

// ─── Causas de Defectos ───────────────────────────────────────────────────────
export const defectosPorCausa = [
  { id: 'D001', causa: 'Soldadura defectuosa', categoria: 'Proceso', cantidad: 180, pct: 28, linea: 'Línea 1', gravedad: 'alta' },
  { id: 'D002', causa: 'Aislamiento incorrecto', categoria: 'Material', cantidad: 145, pct: 23, linea: 'Línea 2', gravedad: 'alta' },
  { id: 'D003', causa: 'Mal montaje conector', categoria: 'Proceso', cantidad: 120, pct: 19, linea: 'Línea 3', gravedad: 'media' },
  { id: 'D004', causa: 'Celda dañada', categoria: 'Material', cantidad: 98, pct: 15, linea: 'Línea 1', gravedad: 'alta' },
  { id: 'D005', causa: 'Etiquetado incorrecto', categoria: 'Proceso', cantidad: 60, pct: 9, linea: 'Línea 4', gravedad: 'baja' },
  { id: 'D006', causa: 'Otros', categoria: 'Otros', cantidad: 37, pct: 6, linea: 'Todas', gravedad: 'baja' },
];

// ─── Retrabajos ───────────────────────────────────────────────────────────────
export const retrabajos = [
  { id: 'R001', descripcion: 'Re-soldadura de conexiones frías', causa: 'Soldadura defectuosa', cantidad: 85, tiempoUnitario: 25, linea: 'Línea 1', fecha: '2026-07-14', operario: 'Operario 1', estado: 'cerrado' },
  { id: 'R002', descripcion: 'Sustitución de conector MC4 mal montado', causa: 'Mal montaje conector', cantidad: 42, tiempoUnitario: 15, linea: 'Línea 2', fecha: '2026-07-14', operario: 'Operario 2', estado: 'en_curso' },
  { id: 'R003', descripcion: 'Re-etiquetado de lote con código incorrecto', causa: 'Etiquetado incorrecto', cantidad: 30, tiempoUnitario: 5, linea: 'Línea 4', fecha: '2026-07-13', operario: 'Operario 3', estado: 'cerrado' },
  { id: 'R004', descripcion: 'Revisión y ajuste de torques de carcasa', causa: 'Proceso', cantidad: 18, tiempoUnitario: 20, linea: 'Línea 3', fecha: '2026-07-13', operario: 'Operario 1', estado: 'pendiente' },
  { id: 'R005', descripcion: 'Comprobación y reparación aislamiento BMS', causa: 'Aislamiento incorrecto', cantidad: 12, tiempoUnitario: 40, linea: 'Línea 2', fecha: '2026-07-12', operario: 'Operario 2', estado: 'cerrado' },
];

// ─── Reclamaciones de Cliente ─────────────────────────────────────────────────
export const reclamaciones = [
  { id: 'C001', referencia: 'REC-2026-041', cliente: 'Cliente A', producto: 'BAT-48V-100Ah', descripcion: 'Unidades con BMS que no arranca en frío', cantidad: 3, gravedad: 'alta', estado: 'abierta', fechaApertura: '2026-07-10', fechaCierre: null, responsable: 'Dpto. Calidad', accionCorrectora: 'Revisión protocolo prueba a -10°C pendiente' },
  { id: 'C002', referencia: 'REC-2026-039', cliente: 'Cliente B', producto: 'BAT-24V-200Ah', descripcion: 'Conectores Deutsch flojos tras 50h uso', cantidad: 8, gravedad: 'media', estado: 'abierta', fechaApertura: '2026-07-08', fechaCierre: null, responsable: 'Dpto. Calidad', accionCorrectora: 'Cambio utillaje prensado en estudio' },
  { id: 'C003', referencia: 'REC-2026-035', cliente: 'Cliente C', producto: 'BAT-12V-100Ah', descripcion: 'Etiquetas ilegibles tras exposición UV', cantidad: 15, gravedad: 'baja', estado: 'cerrada', fechaApertura: '2026-06-28', fechaCierre: '2026-07-05', responsable: 'Dpto. Calidad', accionCorrectora: 'Cambio a etiqueta resina UV certificada' },
  { id: 'C004', referencia: 'REC-2026-030', cliente: 'Cliente D', producto: 'BAT-48V-200Ah', descripcion: 'Capacidad real inferior al 95% nominal', cantidad: 2, gravedad: 'alta', estado: 'cerrada', fechaApertura: '2026-06-20', fechaCierre: '2026-07-01', responsable: 'Ingeniería', accionCorrectora: 'Ajuste configuración BMS y ciclo de formación' },
];

// ─── Scrap / Mermas ───────────────────────────────────────────────────────────
export const scraps = [
  { id: 'S001', descripcion: 'Celdas LFP con voltaje fuera de rango', causa: 'Celda dañada', cantidad: 145, unidad: 'ud', costeUnitario: 28.5, linea: 'Línea 1', fecha: '2026-07-14', turno: 'Mañana', destino: 'Proveedor (RMA)' },
  { id: 'S002', descripcion: 'Carcasas abolladas en transporte interno', causa: 'Manipulación', cantidad: 32, unidad: 'ud', costeUnitario: 12.0, linea: 'Línea 3', fecha: '2026-07-14', turno: 'Mañana', destino: 'Chatarra' },
  { id: 'S003', descripcion: 'Cable 6mm² con aislamiento quemado', causa: 'Aislamiento incorrecto', cantidad: 280, unidad: 'm', costeUnitario: 1.8, linea: 'Línea 2', fecha: '2026-07-13', turno: 'Tarde', destino: 'Chatarra' },
  { id: 'S004', descripcion: 'Conectores MC4 dañados por herramienta incorrecta', causa: 'Mal montaje conector', cantidad: 60, unidad: 'ud', costeUnitario: 3.2, linea: 'Línea 2', fecha: '2026-07-13', turno: 'Mañana', destino: 'Chatarra' },
  { id: 'S005', descripcion: 'Lote soldadura fría detectada en FPY test', causa: 'Soldadura defectuosa', cantidad: 18, unidad: 'ud', costeUnitario: 85.0, linea: 'Línea 1', fecha: '2026-07-12', turno: 'Mañana', destino: 'Retrabajo' },
  { id: 'S006', descripcion: 'BMS módulos con firmware incompatible (lote caducado)', causa: 'Material NC', cantidad: 25, unidad: 'ud', costeUnitario: 45.0, linea: 'Línea 4', fecha: '2026-07-11', turno: 'Tarde', destino: 'Proveedor (RMA)' },
];

// ─── Evolución FPY ────────────────────────────────────────────────────────────
export const evolucionCalidad = [
  { dia: 'Lun', fpy: 99.1, scrap: 580 },
  { dia: 'Mar', fpy: 98.9, scrap: 610 },
  { dia: 'Mié', fpy: 97.5, scrap: 720 },
  { dia: 'Jue', fpy: 99.2, scrap: 520 },
  { dia: 'Vie', fpy: 98.8, scrap: 640 },
];

// ─── Calidad por Línea ────────────────────────────────────────────────────────
export const calidadPorLinea = [
  { linea: 'Línea 1', fpy: 99.1, scrap: 88,  nok: 2 },
  { linea: 'Línea 2', fpy: 98.5, scrap: 112, nok: 4 },
  { linea: 'Línea 3', fpy: 97.8, scrap: 145, nok: 6 },
  { linea: 'Línea 4', fpy: 99.4, scrap: 62,  nok: 1 },
  { linea: 'Línea 5', fpy: 98.2, scrap: 98,  nok: 3 },
];
