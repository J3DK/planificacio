// Mock data — Historial de Producción por Línea / Turno / Producto
// Cada registro representa un turno de trabajo completo

export const historialProduccion = [
  // --- Semana actual ---
  { id: 1,  fecha: '2026-07-14', dia: 'Lun', linea: 'L1', lineaNombre: 'Línea 1', turno: 'Mañana',  producto: 'BAT-48V-100Ah', producido: 241, objetivo: 240, oee: 88.5, calidad: 98.2, disponibilidad: 95.0, rendimiento: 97.1, paradas: 1, minParada: 12 },
  { id: 2,  fecha: '2026-07-14', dia: 'Lun', linea: 'L1', lineaNombre: 'Línea 1', turno: 'Tarde',   producto: 'BAT-48V-100Ah', producido: 228, objetivo: 240, oee: 83.1, calidad: 97.0, disponibilidad: 91.0, rendimiento: 95.5, paradas: 2, minParada: 35 },
  { id: 3,  fecha: '2026-07-14', dia: 'Lun', linea: 'L2', lineaNombre: 'Línea 2', turno: 'Mañana',  producto: 'BAT-24V-200Ah', producido: 218, objetivo: 230, oee: 82.1, calidad: 96.5, disponibilidad: 90.0, rendimiento: 95.2, paradas: 1, minParada: 20 },
  { id: 4,  fecha: '2026-07-14', dia: 'Lun', linea: 'L3', lineaNombre: 'Línea 3', turno: 'Mañana',  producto: 'BAT-12V-100Ah', producido: 310, objetivo: 350, oee: 71.4, calidad: 95.8, disponibilidad: 82.0, rendimiento: 90.5, paradas: 3, minParada: 62 },
  { id: 5,  fecha: '2026-07-14', dia: 'Lun', linea: 'L4', lineaNombre: 'Línea 4', turno: 'Mañana',  producto: 'BAT-48V-200Ah', producido: 253, objetivo: 250, oee: 91.2, calidad: 99.1, disponibilidad: 97.5, rendimiento: 97.8, paradas: 0, minParada: 0 },
  { id: 6,  fecha: '2026-07-14', dia: 'Lun', linea: 'L5', lineaNombre: 'Línea 5', turno: 'Mañana',  producto: 'BAT-24V-100Ah', producido: 160, objetivo: 180, oee: 79.3, calidad: 96.0, disponibilidad: 88.0, rendimiento: 93.5, paradas: 1, minParada: 28 },

  // --- Ayer (viernes) ---
  { id: 7,  fecha: '2026-07-13', dia: 'Dom', linea: 'L1', lineaNombre: 'Línea 1', turno: 'Mañana',  producto: 'BAT-48V-100Ah', producido: 252, objetivo: 240, oee: 91.0, calidad: 98.5, disponibilidad: 96.5, rendimiento: 98.0, paradas: 0, minParada: 0 },
  { id: 8,  fecha: '2026-07-13', dia: 'Dom', linea: 'L1', lineaNombre: 'Línea 1', turno: 'Tarde',   producto: 'BAT-48V-100Ah', producido: 235, objetivo: 240, oee: 86.2, calidad: 97.8, disponibilidad: 93.0, rendimiento: 96.5, paradas: 1, minParada: 18 },
  { id: 9,  fecha: '2026-07-13', dia: 'Dom', linea: 'L2', lineaNombre: 'Línea 2', turno: 'Mañana',  producto: 'BAT-24V-200Ah', producido: 225, objetivo: 230, oee: 84.0, calidad: 97.2, disponibilidad: 91.5, rendimiento: 96.0, paradas: 1, minParada: 15 },
  { id: 10, fecha: '2026-07-13', dia: 'Dom', linea: 'L4', lineaNombre: 'Línea 4', turno: 'Mañana',  producto: 'BAT-48V-200Ah', producido: 248, objetivo: 250, oee: 90.1, calidad: 98.8, disponibilidad: 96.8, rendimiento: 97.2, paradas: 0, minParada: 0 },

  // --- Semana pasada ---
  { id: 11, fecha: '2026-07-11', dia: 'Vie', linea: 'L1', lineaNombre: 'Línea 1', turno: 'Mañana',  producto: 'BAT-48V-100Ah', producido: 238, objetivo: 240, oee: 87.5, calidad: 98.0, disponibilidad: 94.5, rendimiento: 96.8, paradas: 1, minParada: 10 },
  { id: 12, fecha: '2026-07-11', dia: 'Vie', linea: 'L1', lineaNombre: 'Línea 1', turno: 'Tarde',   producto: 'BAT-48V-100Ah', producido: 220, objetivo: 240, oee: 80.5, calidad: 96.5, disponibilidad: 88.5, rendimiento: 94.0, paradas: 2, minParada: 40 },
  { id: 13, fecha: '2026-07-11', dia: 'Vie', linea: 'L2', lineaNombre: 'Línea 2', turno: 'Mañana',  producto: 'BAT-24V-200Ah', producido: 212, objetivo: 230, oee: 79.8, calidad: 96.0, disponibilidad: 89.0, rendimiento: 94.2, paradas: 2, minParada: 30 },
  { id: 14, fecha: '2026-07-11', dia: 'Vie', linea: 'L3', lineaNombre: 'Línea 3', turno: 'Mañana',  producto: 'BAT-12V-100Ah', producido: 330, objetivo: 350, oee: 74.5, calidad: 96.2, disponibilidad: 85.0, rendimiento: 91.0, paradas: 2, minParada: 45 },
  { id: 15, fecha: '2026-07-11', dia: 'Vie', linea: 'L4', lineaNombre: 'Línea 4', turno: 'Mañana',  producto: 'BAT-48V-200Ah', producido: 250, objetivo: 250, oee: 90.8, calidad: 99.0, disponibilidad: 97.0, rendimiento: 97.5, paradas: 0, minParada: 0 },
  { id: 16, fecha: '2026-07-10', dia: 'Jue', linea: 'L1', lineaNombre: 'Línea 1', turno: 'Mañana',  producto: 'BAT-48V-100Ah', producido: 244, objetivo: 240, oee: 89.2, calidad: 98.3, disponibilidad: 95.5, rendimiento: 97.5, paradas: 0, minParada: 0 },
  { id: 17, fecha: '2026-07-10', dia: 'Jue', linea: 'L2', lineaNombre: 'Línea 2', turno: 'Mañana',  producto: 'BAT-24V-200Ah', producido: 226, objetivo: 230, oee: 83.5, calidad: 97.0, disponibilidad: 91.0, rendimiento: 95.8, paradas: 1, minParada: 18 },
  { id: 18, fecha: '2026-07-10', dia: 'Jue', linea: 'L4', lineaNombre: 'Línea 4', turno: 'Tarde',   producto: 'BAT-48V-200Ah', producido: 242, objetivo: 250, oee: 88.0, calidad: 98.5, disponibilidad: 95.0, rendimiento: 96.5, paradas: 1, minParada: 14 },
  { id: 19, fecha: '2026-07-09', dia: 'Mié', linea: 'L1', lineaNombre: 'Línea 1', turno: 'Mañana',  producto: 'BAT-48V-100Ah', producido: 230, objetivo: 240, oee: 85.0, calidad: 97.5, disponibilidad: 92.5, rendimiento: 96.0, paradas: 1, minParada: 22 },
  { id: 20, fecha: '2026-07-09', dia: 'Mié', linea: 'L2', lineaNombre: 'Línea 2', turno: 'Mañana',  producto: 'BAT-24V-200Ah', producido: 210, objetivo: 230, oee: 78.5, calidad: 95.8, disponibilidad: 88.0, rendimiento: 93.5, paradas: 2, minParada: 38 },
  { id: 21, fecha: '2026-07-09', dia: 'Mié', linea: 'L3', lineaNombre: 'Línea 3', turno: 'Mañana',  producto: 'BAT-12V-100Ah', producido: 298, objetivo: 350, oee: 65.2, calidad: 94.5, disponibilidad: 78.0, rendimiento: 88.2, paradas: 4, minParada: 85 },
  { id: 22, fecha: '2026-07-08', dia: 'Mar', linea: 'L1', lineaNombre: 'Línea 1', turno: 'Mañana',  producto: 'BAT-48V-100Ah', producido: 248, objetivo: 240, oee: 90.5, calidad: 98.8, disponibilidad: 96.0, rendimiento: 97.8, paradas: 0, minParada: 0 },
  { id: 23, fecha: '2026-07-08', dia: 'Mar', linea: 'L4', lineaNombre: 'Línea 4', turno: 'Mañana',  producto: 'BAT-48V-200Ah', producido: 255, objetivo: 250, oee: 92.0, calidad: 99.2, disponibilidad: 98.0, rendimiento: 98.5, paradas: 0, minParada: 0 },
  { id: 24, fecha: '2026-07-07', dia: 'Lun', linea: 'L1', lineaNombre: 'Línea 1', turno: 'Mañana',  producto: 'BAT-48V-100Ah', producido: 235, objetivo: 240, oee: 86.0, calidad: 97.5, disponibilidad: 93.5, rendimiento: 96.2, paradas: 1, minParada: 25 },
  { id: 25, fecha: '2026-07-07', dia: 'Lun', linea: 'L2', lineaNombre: 'Línea 2', turno: 'Mañana',  producto: 'BAT-24V-200Ah', producido: 220, objetivo: 230, oee: 82.0, calidad: 96.8, disponibilidad: 90.5, rendimiento: 95.0, paradas: 1, minParada: 20 },
  { id: 26, fecha: '2026-07-07', dia: 'Lun', linea: 'L5', lineaNombre: 'Línea 5', turno: 'Mañana',  producto: 'BAT-24V-100Ah', producido: 172, objetivo: 180, oee: 81.0, calidad: 96.5, disponibilidad: 90.0, rendimiento: 94.0, paradas: 1, minParada: 15 },
];

// Datos agregados por día para gráficos rápidos
export const historialPorDia = [
  { fecha: '07/07', dia: 'Lun', producido: 1205, objetivo: 1230, oeeMedia: 83.7, paradas: 4 },
  { fecha: '08/07', dia: 'Mar', producido: 1280, objetivo: 1230, oeeMedia: 90.8, paradas: 1 },
  { fecha: '09/07', dia: 'Mié', producido: 1098, objetivo: 1230, oeeMedia: 76.2, paradas: 9 },
  { fecha: '10/07', dia: 'Jue', producido: 1215, objetivo: 1230, oeeMedia: 86.9, paradas: 2 },
  { fecha: '11/07', dia: 'Vie', producido: 1250, objetivo: 1230, oeeMedia: 86.6, paradas: 5 },
  { fecha: '13/07', dia: 'Dom', producido: 1282, objetivo: 1230, oeeMedia: 87.8, paradas: 2 },
  { fecha: '14/07', dia: 'Lun', producido: 1410, objetivo: 1230, oeeMedia: 82.7, paradas: 8 },
];
