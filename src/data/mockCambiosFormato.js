export const mockCambiosFormato = [
  {
    id: 'cf1',
    linea: 'Línea 1',
    ordenAnteriorId: 'ORD-001',
    productoAnterior: 'BAT-48V-100Ah',
    ordenNuevaId: 'ORD-002',
    productoNuevo: 'BAT-24V-200Ah',
    fechaInicio: new Date(Date.now() - 3600000).toISOString(),
    fechaFin: new Date(Date.now() - 3600000 + 45*60000).toISOString(),
    duracionMinutos: 45,
    operarioId: '1',
    tipoCambio: 'formato_distinto'
  }
];
