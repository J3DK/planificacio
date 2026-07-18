export const mockKaizen = [
  {
    id: 'k1',
    titulo: 'Reorganizar herramientas CIL',
    descripcion: 'Mover el panel de herramientas al lado de la llenadora para reducir movimientos innecesarios.',
    linea: 'Línea 1',
    categoria: 'productividad',
    proponente: '1', // ID de operario
    fecha: new Date().toISOString(),
    estado: 'en_evaluacion',
    impactoEstimado: 'Ahorro de 5 mins por cambio de formato',
    ahorroEstimado: 2500, // opcional
    fotos: [],
    evaluador: null,
    fechaEvaluacion: null,
    comentarioEvaluacion: null,
    fechaImplementacion: null
  },
  {
    id: 'k2',
    titulo: 'Mejora en sujeción de carcasas',
    descripcion: 'Usar un nuevo tipo de brida que evita rozaduras.',
    linea: 'Línea 2',
    categoria: 'calidad',
    proponente: '2', // ID de operario
    fecha: new Date(Date.now() - 5 * 24 * 3600000).toISOString(),
    estado: 'implementada',
    impactoEstimado: 'Reducción de defectos del 2%',
    ahorroEstimado: 1500, // opcional
    fotos: [],
    evaluador: 'Admin',
    fechaEvaluacion: new Date(Date.now() - 4 * 24 * 3600000).toISOString(),
    comentarioEvaluacion: 'Aprobado, es económico y efectivo.',
    fechaImplementacion: new Date(Date.now() - 2 * 24 * 3600000).toISOString()
  }
];
