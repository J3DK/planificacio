// Mock data — Secuencia de Fabricació (Órdenes MTO)
// ganttId: referencia al ID del Gantt (mes_planificacion_gantt)
// lineaAsignada: ID de línea (L1..L5) si ya está asignada desde Planificación
// lineaNombre: nombre legible de la línea para mostrar el badge
export const ordenesSecuencia = [
  { id: 1, secuencia: 1,  ganttId: 'G1', lineaAsignada: 'L1', lineaNombre: 'Línea 1', referencia: 'BAT-48V-100Ah',  cliente: 'Cliente A', fechaCompromiso: '31/05/2024 07:30', progreso: 100, cumplimiento: 100, desvio: 0,   estado: 'a_tiempo'  },
  { id: 2, secuencia: 2,  ganttId: 'G3', lineaAsignada: 'L2', lineaNombre: 'Línea 2', referencia: 'BAT-24V-200Ah',  cliente: 'Cliente B', fechaCompromiso: '31/05/2024 08:11', progreso: 100, cumplimiento: 100, desvio: 0,   estado: 'a_tiempo'  },
  { id: 3, secuencia: 3,  ganttId: 'G5', lineaAsignada: 'L4', lineaNombre: 'Línea 4', referencia: 'BAT-48V-200Ah',  cliente: 'Cliente D', fechaCompromiso: '31/05/2024 09:00', progreso: 100, cumplimiento: 100, desvio: 0,   estado: 'a_tiempo'  },
  { id: 4, secuencia: 4,  ganttId: 'G4', lineaAsignada: 'L3', lineaNombre: 'Línea 3', referencia: 'BAT-12V-100Ah',  cliente: 'Cliente C', fechaCompromiso: '31/05/2024 10:30', progreso: 68,  cumplimiento: 60,  desvio: -8,  estado: 'en_riesgo' },
  { id: 5, secuencia: 5,  ganttId: 'G2', lineaAsignada: 'L1', lineaNombre: 'Línea 1', referencia: 'BAT-48V-200Ah',  cliente: 'Cliente D', fechaCompromiso: '31/05/2024 11:45', progreso: 42,  cumplimiento: 0,   desvio: -34, estado: 'retrasado'  },
  { id: 6, secuencia: 6,  ganttId: 'G6', lineaAsignada: 'L5', lineaNombre: 'Línea 5', referencia: 'BAT-24V-100Ah',  cliente: 'Cliente D', fechaCompromiso: '31/05/2024 12:00', progreso: 0,   cumplimiento: 0,   desvio: 0,   estado: 'pendiente'  },
  { id: 7, secuencia: 7,  ganttId: null, lineaAsignada: null,  lineaNombre: null,     referencia: 'BAT-48V-300Ah-PRO', cliente: 'Iberia Energy Corp',    fechaCompromiso: '05/06/2024 08:00', progreso: 0,   cumplimiento: 0,   desvio: 0,   estado: 'pendiente'  },
  { id: 8, secuencia: 8,  ganttId: null, lineaAsignada: null,  lineaNombre: null,     referencia: 'BAT-12V-200Ah', cliente: 'Cliente E', fechaCompromiso: '31/05/2024 13:30', progreso: 0,   cumplimiento: 0,   desvio: 0,   estado: 'pendiente'  },
];
