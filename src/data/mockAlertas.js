// Mock data — Alertas
export const alertas = [
  {
    id: 1, tipo: 'critica', icono: 'AlertTriangle',
    titulo: 'Ruptura de stock — Cable 6mm²',
    descripcion: 'Stock actual (3 rollos) por debajo del mínimo (10 rollos). Línea 3 parada.',
    modulo: 'materias_primas', linea: 'Línea 3',
    timestamp: '2024-05-31T10:30:00', leida: false,
  },
  {
    id: 2, tipo: 'critica', icono: 'Wrench',
    titulo: 'Avería soldadora automática L3',
    descripcion: 'La soldadora de la Línea 3 (modelo Fronius TPS 400i) ha reportado fallo E-04. Técnico en camino.',
    modulo: 'paradas', linea: 'Línea 3',
    timestamp: '2024-05-31T07:15:00', leida: false,
  },
  {
    id: 3, tipo: 'advertencia', icono: 'Clock',
    titulo: 'Orden MO24051-005 — Retraso 34 uds',
    descripcion: 'La orden BAT-48V-200Ah del Cliente B acumula 34 uds de retraso. Fecha compromiso: 11:45.',
    modulo: 'secuencia', linea: 'Línea 2',
    timestamp: '2024-05-31T09:50:00', leida: false,
  },
  {
    id: 4, tipo: 'advertencia', icono: 'TrendingDown',
    titulo: 'Línea 3 — Cumplimiento 93.2% (obj. 100%)',
    descripcion: 'El cumplimiento de la Línea 3 está 6.8pp por debajo del objetivo. Revisar causas en el módulo de Paradas.',
    modulo: 'lineas', linea: 'Línea 3',
    timestamp: '2024-05-31T11:00:00', leida: true,
  },
  {
    id: 5, tipo: 'advertencia', icono: 'Package',
    titulo: 'BMS 48V/100A — Stock bajo (12 uds)',
    descripcion: 'Stock actual (12 uds) por debajo del mínimo (20 uds). Pedido pendiente para el 02/06.',
    modulo: 'materias_primas', linea: null,
    timestamp: '2024-05-31T08:00:00', leida: true,
  },
  {
    id: 6, tipo: 'info', icono: 'CheckCircle',
    titulo: 'Mantenimiento preventivo L5 iniciado',
    descripcion: 'El mantenimiento preventivo P5-M12 de Línea 5 ha comenzado según lo planificado.',
    modulo: 'paradas', linea: 'Línea 5',
    timestamp: '2024-05-31T06:00:00', leida: true,
  },
  {
    id: 7, tipo: 'info', icono: 'BarChart2',
    titulo: 'Línea 1 supera el objetivo (+2.4%)',
    descripcion: 'La Línea 1 ha producido 246 uds vs objetivo 240. Rendimiento excelente en el turno.',
    modulo: 'produccion', linea: 'Línea 1',
    timestamp: '2024-05-31T11:10:00', leida: true,
  },
];
