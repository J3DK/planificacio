// Mock data — Paradas
export const paradasTurno = [
  { id: 1, linea: 'Línea 3', inicio: '07:15', fin: '07:42', duracion: 27, tipo: 'averia',    causa: 'Avería soldadora automática', impacto: 85, estado: 'cerrada' },
  { id: 2, linea: 'Línea 5', inicio: '06:00', fin: null,    duracion: 315,tipo: 'mantenimiento', causa: 'Mantenimiento preventivo P5-M12', impacto: 315, estado: 'abierta' },
  { id: 3, linea: 'Línea 2', inicio: '08:30', fin: '08:45', duracion: 15, tipo: 'cambio',    causa: 'Cambio de referencia BAT-24V-100Ah → 200Ah', impacto: 28, estado: 'cerrada' },
  { id: 4, linea: 'Línea 1', inicio: '09:55', fin: '10:05', duracion: 10, tipo: 'calidad',   causa: 'Control de calidad — muestra inspección', impacto: 20, estado: 'cerrada' },
  { id: 5, linea: 'Línea 3', inicio: '10:30', fin: null,    duracion: 45, tipo: 'averia',    causa: 'Falta material — cables 6mm² sin stock', impacto: 45, estado: 'abierta' },
  { id: 6, linea: 'Línea 4', inicio: '11:20', fin: '11:28', duracion: 8,  tipo: 'calidad',   causa: 'Retrabo por fallo de etiquetado', impacto: 12, estado: 'cerrada' },
];

export const paradasPorTipo = [
  { tipo: 'Avería',          minutos: 72,  pct: 38, color: '#ef4444' },
  { tipo: 'Mantenimiento',   minutos: 315, pct: 42, color: '#f59e0b' },
  { tipo: 'Cambio ref.',     minutos: 28,  pct: 11, color: '#3b82f6' },
  { tipo: 'Calidad',         minutos: 32,  pct: 9,  color: '#8b5cf6' },
];

export const oeeWaterfall = [
  { nombre: 'Disponibilidad', valor: 92.5, tipo: 'kpi' },
  { nombre: 'Av. Soldadora L3', valor: -2.8, tipo: 'perdida' },
  { nombre: 'Mant. L5', valor: -4.2, tipo: 'perdida' },
  { nombre: 'Rendimiento', valor: 97.4, tipo: 'kpi' },
  { nombre: 'Velocidad reducida', valor: -2.6, tipo: 'perdida' },
  { nombre: 'Calidad', valor: 98.8, tipo: 'kpi' },
  { nombre: 'Scrap', valor: -0.8, tipo: 'perdida' },
  { nombre: 'OEE Real', valor: 83.4, tipo: 'resultado' },
];

export const paradasPredeterminadasIniciales = [
  { id: 'PP1', codigo: 'ERR-MEC-01', causa: 'Avería soldadora automática / falla eléctrica', categoria: 'averia', tiempoEst: 30, impactoHora: 120 },
  { id: 'PP2', codigo: 'ERR-MEC-02', causa: 'Atasco en cinta transportadora o transfer', categoria: 'averia', tiempoEst: 15, impactoHora: 120 },
  { id: 'PP3', codigo: 'MAT-01', causa: 'Falta de componentes o material sin stock en línea', categoria: 'averia', tiempoEst: 20, impactoHora: 100 },
  { id: 'PP4', codigo: 'MNT-PREV', causa: 'Mantenimiento preventivo programado cabezales', categoria: 'mantenimiento', tiempoEst: 60, impactoHora: 120 },
  { id: 'PP5', codigo: 'MNT-LUB', causa: 'Lubricación, limpieza y calibración de estación', categoria: 'mantenimiento', tiempoEst: 15, impactoHora: 100 },
  { id: 'PP6', codigo: 'CAM-REF', causa: 'Cambio de referencia y ajuste de utillajes técnicos', categoria: 'cambio', tiempoEst: 25, impactoHora: 120 },
  { id: 'PP7', codigo: 'CAM-BOB', causa: 'Cambio de bobina / rollo de consumibles o film', categoria: 'cambio', tiempoEst: 10, bg: '#3b82f6', impactoHora: 100 },
  { id: 'PP8', codigo: 'CAL-INSP', causa: 'Control de calidad — inspección de lote en proceso', categoria: 'calidad', tiempoEst: 15, impactoHora: 80 },
  { id: 'PP9', codigo: 'CAL-RET', causa: 'Retrabo y separación por fallo de sellado o etiquetas', categoria: 'calidad', tiempoEst: 20, impactoHora: 80 },
];
