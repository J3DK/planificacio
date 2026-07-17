export const skillsMasterIniciales = [
  { id: 'SK-01', nombre: 'Soldadura Láser de Celdas LFP', categoria: 'Técnica / Proceso', descripcion: 'Manejo de equipo de soldadura láser automatizada y control de cordón.', nivelMaximo: 'Maestro (5)' },
  { id: 'SK-02', nombre: 'Montaje & Ensamblaje de Conectores MC4', categoria: 'Montaje Eléctrico', descripcion: 'Ensamblaje, crimpado y test de tracción de terminales MC4 e interconexiones.', nivelMaximo: 'Avanzado (4)' },
  { id: 'SK-03', nombre: 'Programación & Diagnóstico de PLC Siemen / Beckhoff', categoria: 'Automatización & Electromecánica', descripcion: 'Lectura de lógica de escalera, diagnóstico de fallos en bus de campo y rearme.', nivelMaximo: 'Maestro (5)' },
  { id: 'SK-04', nombre: 'Control de Calidad EOL (End of Line Test & Hi-Pot)', categoria: 'Calidad & Pruebas', descripcion: 'Operación del banco de pruebas final: aislamiento eléctrico, capacidad de descarga y comunicación BMS.', nivelMaximo: 'Avanzado (4)' },
  { id: 'SK-05', nombre: 'Operación de Robot de Soldadura KUKA KR IONTEC', categoria: 'Robótica', descripcion: 'Manejo de consola Teach Pendant, ajuste de trayectorias y cambio de herramientas.', nivelMaximo: 'Maestro (5)' },
  { id: 'SK-06', nombre: 'Inspección Óptica AOI & Trazabilidad RFID', categoria: 'Calidad & Trazabilidad', descripcion: 'Inspección de soldaduras por cámara artificial y gestión del flujo de lote.', nivelMaximo: 'Intermedio (3)' },
  { id: 'SK-07', nombre: 'Manejo de Carretilla Elevadora y Puente Grúa (5T)', categoria: 'Logística & Seguridad', descripcion: 'Transporte de módulos pesados de baterías y posicionamiento en bancada.', nivelMaximo: 'Avanzado (4)' }
];

export const formacionesMasterIniciales = [
  { id: 'FM-01', nombre: 'PRL Riesgo Eléctrico Alta Tensión (>600V)', horas: 20, periodicidadMeses: 24, entidadCertificadora: 'TÜV Rheinland Academy', obligatorio: true },
  { id: 'FM-02', nombre: 'Soldadura Electrónica Estándar IPC-A-610', horas: 32, periodicidadMeses: 36, entidadCertificadora: 'IPC Official Training', obligatorio: true },
  { id: 'FM-03', nombre: 'Manipulación Segura de Químicos y Electrolito de Litio', horas: 16, periodicidadMeses: 24, entidadCertificadora: 'SGS Inspecciones', obligatorio: true },
  { id: 'FM-04', nombre: 'Operación y Seguridad en Células Robotizadas (Norma ISO 10218)', horas: 24, periodicidadMeses: 36, entidadCertificadora: 'KUKA Robotics Spain', obligatorio: false },
  { id: 'FM-05', nombre: 'Primeros Auxilios y Evacuación en Zonas con Riesgo Químico/Eléctrico', horas: 12, periodicidadMeses: 12, entidadCertificadora: 'Mutua Universal', obligatorio: true },
  { id: 'FM-06', nombre: 'Metodología 5S & TPM Básica para Operarios de Línea', horas: 8, periodicidadMeses: 48, entidadCertificadora: 'MPS Academy Internal', obligatorio: false },
  { id: 'FM-07', nombre: 'Certificación de Carretillero y Manipulación de Cargas Pesadas (>3T)', horas: 20, periodicidadMeses: 24, entidadCertificadora: 'Logistics Safety Spain', obligatorio: true },
  { id: 'FM-08', nombre: 'Auditoría Interna de Calidad IATF 16949 / ISO 9001 en Automoción', horas: 30, periodicidadMeses: 36, entidadCertificadora: 'AENOR Formación', obligatorio: false }
];

export const permisosMasterIniciales = [
  { id: 'PERM-01', equipoId: 'L1', equipoNombre: 'Línea 1 · Ensamblaje Baterías LFP', tipo: 'linea', skillRequerida: 'Soldadura Láser de Celdas LFP', formacionRequerida: 'PRL Riesgo Eléctrico Alta Tensión (>600V)', nivelMinimo: 'Avanzado (4)' },
  { id: 'PERM-02', equipoId: 'L2', equipoNombre: 'Línea 2 · Módulos de Potencia 48V', tipo: 'linea', skillRequerida: 'Montaje & Ensamblaje de Conectores MC4', formacionRequerida: 'PRL Riesgo Eléctrico Alta Tensión (>600V)', nivelMinimo: 'Intermedio (3)' },
  { id: 'PERM-03', equipoId: 'L3', equipoNombre: 'Línea 3 · Pack Industrial 400V/800V', tipo: 'linea', skillRequerida: 'Control de Calidad EOL (End of Line Test & Hi-Pot)', formacionRequerida: 'PRL Riesgo Eléctrico Alta Tensión (>600V)', nivelMinimo: 'Avanzado (4)' },
  { id: 'PERM-04', equipoId: 'MQ-101', equipoNombre: 'Ensambladora Automática Celdas LFP', tipo: 'maquina', skillRequerida: 'Programación & Diagnóstico de PLC Siemen / Beckhoff', formacionRequerida: 'Operación y Seguridad en Células Robotizadas (Norma ISO 10218)', nivelMinimo: 'Intermedio (3)' },
  { id: 'PERM-05', equipoId: 'MQ-102', equipoNombre: 'Robot Soldador Láser KUKA KR-20', tipo: 'maquina', skillRequerida: 'Operación de Robot de Soldadura KUKA KR IONTEC', formacionRequerida: 'Operación y Seguridad en Células Robotizadas (Norma ISO 10218)', nivelMinimo: 'Maestro (5)' },
  { id: 'PERM-06', equipoId: 'MQ-103', equipoNombre: 'Banco de Pruebas EOL & Hi-Pot Test', tipo: 'maquina', skillRequerida: 'Control de Calidad EOL (End of Line Test & Hi-Pot)', formacionRequerida: 'PRL Riesgo Eléctrico Alta Tensión (>600V)', nivelMinimo: 'Avanzado (4)' }
];

export const capacitacionesMasterIniciales = [
  {
    id: 'PLAN-01',
    titulo: 'Evaluación Técnica Periódica y Seguridad MES (Plan Anual 2026)',
    categoria: 'Cualificación General',
    plan: 'Plan Anual de Reciclaje y Cualificación 2026',
    evaluadorDefault: 'Comité Técnico / Dir. Operaciones',
    periodicidadMeses: 12,
    puntuacionMinima: 85,
    descripcion: 'Evaluación integral de competencias operativas, cumplimiento de PRL y destreza en manejo de terminales de planta.'
  },
  {
    id: 'PLAN-02',
    titulo: 'Reciclaje en Ciberseguridad Industrial & PLC Siemens S7-1500',
    categoria: 'Automatización & Control',
    plan: 'Plan de Especialización Electromecánica',
    evaluadorDefault: 'Ingeniería de Planta MES',
    periodicidadMeses: 24,
    puntuacionMinima: 90,
    descripcion: 'Verificación práctica de backups, rearme de líneas tras fallo eléctrico y diagnóstico de bus Profinet en caliente.'
  },
  {
    id: 'PLAN-03',
    titulo: 'Certificación de Calidad EOL & Pruebas de Aislamiento Hi-Pot',
    categoria: 'Calidad & Ensayos',
    plan: 'Programa de Excelencia Cero Defectos',
    evaluadorDefault: 'Jefe de Calidad EOL',
    periodicidadMeses: 12,
    puntuacionMinima: 95,
    descripcion: 'Auditoría práctica sobre la correcta operación del banco final EOL, aislamiento >100MΩ y protocolo de rechazo de celdas.'
  },
  {
    id: 'PLAN-04',
    titulo: 'Auditoría y Reciclaje 5S & TPM en Línea de Ensamblaje',
    categoria: 'Mejora Continua',
    plan: 'Plan Lean MES / 5S',
    evaluadorDefault: 'Supervisor de Línea',
    periodicidadMeses: 6,
    puntuacionMinima: 80,
    descripcion: 'Inspección de orden, limpieza, mantenimiento autónomo diario (TPM) y checklist pre-turno del puesto asignado.'
  },
  {
    id: 'PLAN-05',
    titulo: 'Habilitación para Operación de Célula Robotizada KUKA KR IONTEC',
    categoria: 'Robótica & Láser',
    plan: 'Especialidad Soldadura Láser Avanzada',
    evaluadorDefault: 'Ingeniero de Robótica',
    periodicidadMeses: 18,
    puntuacionMinima: 90,
    descripcion: 'Evaluación práctica de manejo de Teach Pendant, recuperación tras parada de emergencia y limpieza de óptica láser.'
  }
];

export const autorizacionesMasterIniciales = [
  {
    id: 'AUT-01',
    codigo: 'AUTH-L1-OPS',
    nombre: 'Autorización Operativa y Rearme · Línea 1',
    tipo: 'linea',
    targetId: 'L-01',
    targetNombre: 'Línea 1 — Montaje Rápido',
    nivelRequerido: 'Maestro (5) + PRL Alta Tensión',
    validezMeses: 24,
    descripcion: 'Habilita para operar la línea en todos sus turnos, realizar rearme tras paradas técnicas y ajuste de parámetros de celda LFP.'
  },
  {
    id: 'AUT-02',
    codigo: 'AUTH-L3-OPS',
    nombre: 'Autorización Operativa · Línea 3 (Pack Industrial)',
    tipo: 'linea',
    targetId: 'L-03',
    targetNombre: 'Línea 3 — Ensamblaje Pesado',
    nivelRequerido: 'Avanzado (4) + ISO 10218',
    validezMeses: 12,
    descripcion: 'Autorización para manipulación de packs de alta tensión (400V/800V) y control de test final EOL en Línea 3.'
  },
  {
    id: 'AUT-03',
    codigo: 'AUTH-L2-OPS',
    nombre: 'Autorización Operativa · Línea 2 (Módulos 48V)',
    tipo: 'linea',
    targetId: 'L-02',
    targetNombre: 'Línea 2 — Módulos de Potencia 48V',
    nivelRequerido: 'Intermedio (3)',
    validezMeses: 36,
    descripcion: 'Permite el ensamblaje, crimpado y test de interconexiones en puestos de la Línea 2.'
  },
  {
    id: 'AUT-04',
    codigo: 'AUTH-MQ101-MANT',
    nombre: 'Autorización Intervención Mantenimiento · Soldadura por Onda (MQ-101)',
    tipo: 'subparte',
    targetId: 'MQ-101',
    targetNombre: 'Estación de Soldadura por Onda automática #1 (Máquina L1)',
    nivelRequerido: 'Especialista Electromecánico + PRL Riesgo Eléctrico',
    validezMeses: 12,
    descripcion: 'Autoriza el mantenimiento preventivo, diagnóstico correctivo y rearme sobre la estación de soldadura y sus subcomponentes.'
  },
  {
    id: 'AUT-05',
    codigo: 'AUTH-COMP101A-MANT',
    nombre: 'Habilitación Subparte Mantenimiento · Crisol y Bomba de Estaño',
    tipo: 'subparte',
    targetId: 'COMP-101-A',
    targetNombre: 'Crisol y Bomba de Estaño (Subparte de MQ-101)',
    nivelRequerido: 'Técnico Especialista en Soldadura',
    validezMeses: 24,
    descripcion: 'Autorización específica para vaciado, recarga química y calibración térmica en la subparte Crisol y Bomba de Estaño.'
  },
  {
    id: 'AUT-06',
    codigo: 'AUTH-COMP102A-MANT',
    nombre: 'Habilitación Subparte Mantenimiento · Cabezal Rotativo 12 Boquillas',
    tipo: 'subparte',
    targetId: 'COMP-102-A',
    targetNombre: 'Cabezal Rotativo 12 Boquillas (Subparte de MQ-102)',
    nivelRequerido: 'Robótica y Mecánica Precisión',
    validezMeses: 18,
    descripcion: 'Autoriza tareas de calibración de precisión, cambio rápido de boquillas y mantenimiento autónomo en la subparte del cabezal SMD.'
  }
];


