export const mockCambiosFormato = [
  {
    id: 'cf1',
    linea: 'Línea 1',
    ordenAnteriorId: 'ORD-001',
    productoAnterior: 'BAT-48V-100Ah',
    ordenNuevaId: 'ORD-002',
    productoNuevo: 'BAT-24V-200Ah',
    fechaInicio: new Date(Date.now() - 5 * 86400000).toISOString(),
    fechaFin: new Date(Date.now() - 5 * 86400000 + 45*60000).toISOString(),
    duracionMinutos: 45,
    operarioId: '1',
    tipoCambio: 'formato_distinto'
  },
  {
    id: 'cf2',
    linea: 'Línea 1',
    ordenAnteriorId: 'ORD-003',
    productoAnterior: 'BAT-24V-200Ah',
    ordenNuevaId: 'ORD-004',
    productoNuevo: 'BAT-48V-100Ah',
    fechaInicio: new Date(Date.now() - 4 * 86400000).toISOString(),
    fechaFin: new Date(Date.now() - 4 * 86400000 + 32*60000).toISOString(),
    duracionMinutos: 32, // Mejor que estándar de 35
    operarioId: '2',
    tipoCambio: 'formato_distinto'
  },
  {
    id: 'cf3',
    linea: 'Línea 2',
    ordenAnteriorId: 'ORD-005',
    productoAnterior: 'INV-5KW-HIBRIDO',
    ordenNuevaId: 'ORD-006',
    productoNuevo: 'INV-3KW-RED',
    fechaInicio: new Date(Date.now() - 3 * 86400000).toISOString(),
    fechaFin: new Date(Date.now() - 3 * 86400000 + 25*60000).toISOString(),
    duracionMinutos: 25, // Peor que estándar de 20
    operarioId: '1',
    tipoCambio: 'formato_distinto'
  },
  {
    id: 'cf4',
    linea: 'Línea 2',
    ordenAnteriorId: 'ORD-007',
    productoAnterior: 'INV-3KW-RED',
    ordenNuevaId: 'ORD-008',
    productoNuevo: 'INV-5KW-HIBRIDO',
    fechaInicio: new Date(Date.now() - 2 * 86400000).toISOString(),
    fechaFin: new Date(Date.now() - 2 * 86400000 + 22*60000).toISOString(),
    duracionMinutos: 22, // Mejor que estándar de 25
    operarioId: '3',
    tipoCambio: 'formato_distinto'
  },
  {
    id: 'cf5',
    linea: 'Línea 1',
    ordenAnteriorId: 'ORD-009',
    productoAnterior: 'BAT-48V-100Ah',
    ordenNuevaId: 'ORD-010',
    productoNuevo: 'BAT-12V-150Ah',
    fechaInicio: new Date(Date.now() - 1 * 86400000).toISOString(),
    fechaFin: new Date(Date.now() - 1 * 86400000 + 55*60000).toISOString(),
    duracionMinutos: 55, // Peor que estándar de 45
    operarioId: '2',
    tipoCambio: 'formato_distinto'
  },
  {
    id: 'cf6',
    linea: 'Línea 3',
    ordenAnteriorId: 'ORD-011',
    productoAnterior: 'PAN-450W-MONO',
    ordenNuevaId: 'ORD-012',
    productoNuevo: 'PAN-500W-BI',
    fechaInicio: new Date(Date.now() - 12 * 3600000).toISOString(),
    fechaFin: new Date(Date.now() - 12 * 3600000 + 14*60000).toISOString(),
    duracionMinutos: 14, // Mejor que estándar de 15
    operarioId: '4',
    tipoCambio: 'formato_distinto'
  },
  {
    id: 'cf7',
    linea: 'Línea 1',
    ordenAnteriorId: 'ORD-013',
    productoAnterior: 'BAT-48V-100Ah',
    ordenNuevaId: 'ORD-014',
    productoNuevo: 'BAT-24V-200Ah',
    fechaInicio: new Date(Date.now() - 6 * 3600000).toISOString(),
    fechaFin: new Date(Date.now() - 6 * 3600000 + 28*60000).toISOString(),
    duracionMinutos: 28, // Mejor que estándar de 30
    operarioId: '1',
    tipoCambio: 'formato_distinto'
  },
  {
    id: 'cf8',
    linea: 'Línea 2',
    ordenAnteriorId: 'ORD-015',
    productoAnterior: 'INV-5KW-HIBRIDO',
    ordenNuevaId: 'ORD-016',
    productoNuevo: 'INV-3KW-RED',
    fechaInicio: new Date(Date.now() - 2 * 3600000).toISOString(),
    fechaFin: new Date(Date.now() - 2 * 3600000 + 20*60000).toISOString(),
    duracionMinutos: 20, // Igual a estándar
    operarioId: '3',
    tipoCambio: 'formato_distinto'
  }
];
