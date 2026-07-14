// Mock data — Secuencia de Fabricación (Órdenes MTO)
export const ordenesSecuencia = [
  { id: 1, secuencia: 1,  referencia: 'BAT-48V-100Ah', cliente: 'Cliente A', fechaCompromiso: '31/05/2024 07:30', progreso: 100, cumplimiento: 100, desvio: 0,   estado: 'a_tiempo' },
  { id: 2, secuencia: 2,  referencia: 'BAT-24V-200Ah', cliente: 'Cliente B', fechaCompromiso: '31/05/2024 08:11', progreso: 100, cumplimiento: 100, desvio: 0,   estado: 'a_tiempo' },
  { id: 3, secuencia: 3,  referencia: 'BAT-48V-100Ah', cliente: 'Cliente A', fechaCompromiso: '31/05/2024 09:00', progreso: 100, cumplimiento: 100, desvio: 0,   estado: 'a_tiempo' },
  { id: 4, secuencia: 4,  referencia: 'BAT-12V-100Ah', cliente: 'Cliente C', fechaCompromiso: '31/05/2024 10:30', progreso: 68,  cumplimiento: 60,  desvio: -8,  estado: 'en_riesgo' },
  { id: 5, secuencia: 5,  referencia: 'BAT-48V-200Ah', cliente: 'Cliente B', fechaCompromiso: '31/05/2024 11:45', progreso: 42,  cumplimiento: 0,   desvio: -34, estado: 'retrasado' },
  { id: 6, secuencia: 6,  referencia: 'BAT-24V-100Ah', cliente: 'Cliente D', fechaCompromiso: '31/05/2024 12:00', progreso: 0,   cumplimiento: 0,   desvio: 0,   estado: 'pendiente' },
  { id: 7, secuencia: 7,  referencia: 'BAT-48V-100Ah', cliente: 'Cliente A', fechaCompromiso: '31/05/2024 13:00', progreso: 0,   cumplimiento: 0,   desvio: 0,   estado: 'pendiente' },
  { id: 8, secuencia: 8,  referencia: 'BAT-12V-200Ah', cliente: 'Cliente E', fechaCompromiso: '31/05/2024 13:30', progreso: 0,   cumplimiento: 0,   desvio: 0,   estado: 'pendiente' },
];
