// Mock data — Dashboard Principal (MPS)
export const kpis = {
  cumplimientoPlan: 97.6,
  cumplimientoPlanObjetivo: 100,
  cumplimientoPlanVsAyer: +1.8,
  produccionPlanificada: 1250,
  produccionReal: 1220,
  desviacionAcumulada: -30,
  desviacionPct: -2.4,
  ritmoReal: 213,
  ritmoObjetivo: 215,
  tiempoRestante: '2h 45m',
  tiempoRestanteLabel: 'Hasta fin de turno 14:00',
  ordenesDia: 12,
  unidad: 'uds',
  fecha: '31/05/2024',
  planta: 'Planta 1',
  turno: 'Mañana (06:00 - 14:00)',
  ultimaActualizacion: '31/05/2024 11:15',
};

export const cumplimientoAcumulado = [
  { hora: '06:00', plan: 0,   real: 0,   objetivo: 0 },
  { hora: '07:00', plan: 8,   real: 7,   objetivo: 8 },
  { hora: '08:00', plan: 20,  real: 19,  objetivo: 20 },
  { hora: '09:00', plan: 35,  real: 34,  objetivo: 35 },
  { hora: '10:00', plan: 50,  real: 49,  objetivo: 50 },
  { hora: '11:00', plan: 63,  real: 61,  objetivo: 63 },
  { hora: '11:15', plan: 68,  real: 66,  objetivo: 68 },
];

export const produccionPorHora = [
  { hora: '06:00', plan: 215, real: 210, objetivo: 215 },
  { hora: '07:00', plan: 215, real: 220, objetivo: 215 },
  { hora: '08:00', plan: 215, real: 215, objetivo: 215 },
  { hora: '09:00', plan: 215, real: 218, objetivo: 215 },
  { hora: '10:00', plan: 215, real: 205, objetivo: 215 },
  { hora: '11:00', plan: 215, real: 200, objetivo: 215 },
  { hora: '12:00', plan: 215, real: 213, objetivo: 215 },
  { hora: '13:00', plan: 215, real: null, objetivo: 215 },
];

export const cumplimientoPorLinea = [
  { linea: 'Línea 1', objetivo: 100, cumplimiento: 102.4, desvio: +2.4, estado: 'up' },
  { linea: 'Línea 2', objetivo: 100, cumplimiento: 98.1,  desvio: -1.9, estado: 'down' },
  { linea: 'Línea 3', objetivo: 100, cumplimiento: 93.2,  desvio: -6.8, estado: 'down' },
  { linea: 'Línea 4', objetivo: 100, cumplimiento: 101.3, desvio: +1.3, estado: 'up' },
  { linea: 'Línea 5', objetivo: 100, cumplimiento: 97.0,  desvio: -3.0, estado: 'down' },
];

export const objetivoVsCumplimientoLinea = [
  { linea: 'Línea 1', objetivo: 240, cumplimiento: 246, diferencia: +6 },
  { linea: 'Línea 2', objetivo: 230, cumplimiento: 226, diferencia: -4 },
  { linea: 'Línea 3', objetivo: 350, cumplimiento: 326, diferencia: -24 },
  { linea: 'Línea 4', objetivo: 250, cumplimiento: 253, diferencia: +3 },
  { linea: 'Línea 5', objetivo: 180, cumplimiento: 175, diferencia: -5 },
];

export const causasDesviacion = [
  { causa: 'Falta de cables',      uds: 2.8, pct: 31, tipo: 'material' },
  { causa: 'Ajustes y cambios',    uds: 2.2, pct: 25, tipo: 'cambio' },
  { causa: 'Avería soldadora aver', uds: 1.3, pct: 14, tipo: 'averia' },
  { causa: 'Espera de calidad',    uds: 0.8, pct: 9,  tipo: 'calidad' },
  { causa: 'Retrabajos',           uds: 1.0, pct: 11, tipo: 'calidad' },
];

export const mensajeClave = `El cumplimiento del plan acumulado es del 97,6%.
La Línea 3 presenta un retraso de 17 uds.
La Orden MO24051-005 está 18 uds por debajo de la secuencia planificada.
Priorizar suministro de cables para recuperar el ritmo en las próximas horas.`;
