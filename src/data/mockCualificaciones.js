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
  { id: 'FM-06', nombre: 'Metodología 5S & TPM Básica para Operarios de Línea', horas: 8, periodicidadMeses: 48, entidadCertificadora: 'MPS Academy Internal', obligatorio: false }
];

export const permisosMasterIniciales = [
  { id: 'PERM-01', equipoId: 'L1', equipoNombre: 'Línea 1 · Ensamblaje Baterías LFP', tipo: 'linea', skillRequerida: 'Soldadura Láser de Celdas LFP', formacionRequerida: 'PRL Riesgo Eléctrico Alta Tensión (>600V)', nivelMinimo: 'Avanzado (4)' },
  { id: 'PERM-02', equipoId: 'L2', equipoNombre: 'Línea 2 · Módulos de Potencia 48V', tipo: 'linea', skillRequerida: 'Montaje & Ensamblaje de Conectores MC4', formacionRequerida: 'PRL Riesgo Eléctrico Alta Tensión (>600V)', nivelMinimo: 'Intermedio (3)' },
  { id: 'PERM-03', equipoId: 'L3', equipoNombre: 'Línea 3 · Pack Industrial 400V/800V', tipo: 'linea', skillRequerida: 'Control de Calidad EOL (End of Line Test & Hi-Pot)', formacionRequerida: 'PRL Riesgo Eléctrico Alta Tensión (>600V)', nivelMinimo: 'Avanzado (4)' },
  { id: 'PERM-04', equipoId: 'MQ-101', equipoNombre: 'Ensambladora Automática Celdas LFP', tipo: 'maquina', skillRequerida: 'Programación & Diagnóstico de PLC Siemen / Beckhoff', formacionRequerida: 'Operación y Seguridad en Células Robotizadas (Norma ISO 10218)', nivelMinimo: 'Intermedio (3)' },
  { id: 'PERM-05', equipoId: 'MQ-102', equipoNombre: 'Robot Soldador Láser KUKA KR-20', tipo: 'maquina', skillRequerida: 'Operación de Robot de Soldadura KUKA KR IONTEC', formacionRequerida: 'Operación y Seguridad en Células Robotizadas (Norma ISO 10218)', nivelMinimo: 'Maestro (5)' },
  { id: 'PERM-06', equipoId: 'MQ-103', equipoNombre: 'Banco de Pruebas EOL & Hi-Pot Test', tipo: 'maquina', skillRequerida: 'Control de Calidad EOL (End of Line Test & Hi-Pot)', formacionRequerida: 'PRL Riesgo Eléctrico Alta Tensión (>600V)', nivelMinimo: 'Avanzado (4)' }
];
