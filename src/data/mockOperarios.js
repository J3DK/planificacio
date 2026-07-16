export const operarios = [
  {
    id: 'OP-001',
    nombre: 'Carlos Mendoza',
    email: 'c.mendoza@mpsproud.com',
    rol: 'Jefe de Línea',
    lineas: ['L1', 'L2'],
    lineaActualId: 'L1',
    turno: 'Mañana',
    estado: 'activo',
    especialidad: 'Soldadura Láser & Ensamblaje BMS',
    pin: '1234',
    avatar: '',
    skills: [
      { id: 'SK-01', nombre: 'Soldadura Láser de Celdas LFP', valoracion: 5, nivel: 'Maestro', ultimaEvaluacion: '2026-05-10' },
      { id: 'SK-03', nombre: 'Programación & Diagnóstico de PLC Siemen / Beckhoff', valoracion: 4, nivel: 'Avanzado', ultimaEvaluacion: '2026-04-15' },
      { id: 'SK-05', nombre: 'Operación de Robot de Soldadura KUKA KR IONTEC', valoracion: 5, nivel: 'Maestro', ultimaEvaluacion: '2026-06-01' }
    ],
    capacitaciones: [
      {
        id: 'CAP-101',
        titulo: 'Evaluación Técnica Global de Soldadura & Seguridad BMS',
        plan: 'Plan Maestro Anual de Cualificación 2026',
        fecha: '2026-05-15',
        evaluador: 'Comité Técnico / Dir. Operaciones',
        puntuacion: 98,
        estado: 'superada',
        observaciones: 'Nivel sobresaliente en resolución de incidencias en celdas LFP y supervisión de células KUKA.'
      },
      {
        id: 'CAP-102',
        titulo: 'Reciclaje en Ciberseguridad Industrial & PLC Siemens S7-1500',
        plan: 'Reciclaje Técnico de Mandos',
        fecha: '2026-04-10',
        evaluador: 'Soporte Ingeniería MES',
        puntuacion: 94,
        estado: 'superada',
        observaciones: 'Apto para realizar backups y modificaciones de PLC en línea sin interrupción.'
      }
    ],
    formaciones: [
      { id: 'FM-01', nombre: 'PRL Riesgo Eléctrico Alta Tensión (>600V)', fechaObtencion: '2025-03-15', fechaCaducidad: '2027-03-15', estado: 'vigente', entidad: 'TÜV Rheinland Academy' },
      { id: 'FM-04', nombre: 'Operación y Seguridad en Células Robotizadas (Norma ISO 10218)', fechaObtencion: '2024-11-20', fechaCaducidad: '2026-11-20', estado: 'vigente', entidad: 'KUKA Robotics Spain' },
      { id: 'FM-05', nombre: 'Primeros Auxilios y Evacuación en Zonas con Riesgo Químico/Eléctrico', fechaObtencion: '2026-01-10', fechaCaducidad: '2027-01-10', estado: 'vigente', entidad: 'Mutua Universal' }
    ],
    permisos: [
      { id: 'PER-101', equipoId: 'L1', equipoNombre: 'Línea 1 · Ensamblaje Baterías LFP', tipo: 'linea', nivelAcceso: 'Jefe / Operador Principal', autorizadoPor: 'Dir. Operaciones' },
      { id: 'PER-102', equipoId: 'L2', equipoNombre: 'Línea 2 · Módulos de Potencia 48V', tipo: 'linea', nivelAcceso: 'Jefe de Turno', autorizadoPor: 'Dir. Operaciones' },
      { id: 'PER-103', equipoId: 'MQ-102', equipoNombre: 'Robot Soldador Láser KUKA KR-20', tipo: 'maquina', nivelAcceso: 'Especialista Calificado', autorizadoPor: 'Jefe Mantenimiento' }
    ],
    historial: [
      { id: 'HS-101', fecha: '2026-07-16 06:00', tipo: 'turno_inicio', descripcion: 'Inicio de turno Mañana en Línea 1 como Jefe de Línea', linea: 'L1', piezas: 0 },
      { id: 'HS-102', fecha: '2026-07-15 14:00', tipo: 'turno_fin', descripcion: 'Cierre de turno Mañana en Línea 1 con OEE 94.2% y 480 uds completadas', linea: 'L1', piezas: 480 },
      { id: 'HS-103', fecha: '2026-06-01 11:30', tipo: 'evaluacion', descripcion: 'Evaluación de Skill [Soldadura Láser de Celdas LFP] renovada con valoración 5/5', linea: 'General', piezas: 0 }
    ]
  },
  {
    id: 'OP-002',
    nombre: 'Ana García López',
    email: 'a.garcia@mpsproud.com',
    rol: 'Operario Especialista',
    lineas: ['L1', 'L3'],
    lineaActualId: 'L1',
    turno: 'Mañana',
    estado: 'activo',
    especialidad: 'Control de Calidad & EOL Test',
    pin: '2345',
    avatar: '',
    skills: [
      { id: 'SK-04', nombre: 'Control de Calidad EOL (End of Line Test & Hi-Pot)', valoracion: 5, nivel: 'Maestro', ultimaEvaluacion: '2026-05-20' },
      { id: 'SK-06', nombre: 'Inspección Óptica AOI & Trazabilidad RFID', valoracion: 4, nivel: 'Avanzado', ultimaEvaluacion: '2026-03-11' }
    ],
    capacitaciones: [
      {
        id: 'CAP-201',
        titulo: 'Certificación en Protocolo Hi-Pot Test & Auditoría ISO 9001',
        plan: 'Plan de Cualificación QA/QC 2026',
        fecha: '2026-05-20',
        evaluador: 'Jefe de Calidad Planta',
        puntuacion: 96,
        estado: 'superada',
        observaciones: 'Excelente precisión en detección de fugas en módulos de potencia e inspección AOI.'
      }
    ],
    formaciones: [
      { id: 'FM-01', nombre: 'PRL Riesgo Eléctrico Alta Tensión (>600V)', fechaObtencion: '2025-04-10', fechaCaducidad: '2027-04-10', estado: 'vigente', entidad: 'TÜV Rheinland Academy' },
      { id: 'FM-02', nombre: 'Soldadura Electrónica Estándar IPC-A-610', fechaObtencion: '2024-09-15', fechaCaducidad: '2027-09-15', estado: 'vigente', entidad: 'IPC Official Training' }
    ],
    permisos: [
      { id: 'PER-201', equipoId: 'L1', equipoNombre: 'Línea 1 · Ensamblaje Baterías LFP', tipo: 'linea', nivelAcceso: 'Inspector de Calidad', autorizadoPor: 'Jefe de Calidad' },
      { id: 'PER-202', equipoId: 'L3', equipoNombre: 'Línea 3 · Pack Industrial 400V/800V', tipo: 'linea', nivelAcceso: 'Inspector de Calidad', autorizadoPor: 'Jefe de Calidad' },
      { id: 'PER-203', equipoId: 'MQ-103', equipoNombre: 'Banco de Pruebas EOL & Hi-Pot Test', tipo: 'maquina', nivelAcceso: 'Operador Certificado', autorizadoPor: 'Jefe de Calidad' }
    ],
    historial: [
      { id: 'HS-201', fecha: '2026-07-16 06:05', tipo: 'turno_inicio', descripcion: 'Fichaje e inicio en estación EOL Test de Línea 1', linea: 'L1', piezas: 0 },
      { id: 'HS-202', fecha: '2026-07-15 13:55', tipo: 'calidad', descripcion: 'Auditoría 100% packs batería con 0 rechazos críticos en Línea 1', linea: 'L1', piezas: 480 }
    ]
  },
  {
    id: 'OP-003',
    nombre: 'Marc Valls Rodriguez',
    email: 'm.valls@mpsproud.com',
    rol: 'Electromecánico',
    lineas: ['L1', 'L2', 'L3', 'L4', 'L5'],
    lineaActualId: 'L2',
    turno: 'Rotativo',
    estado: 'activo',
    especialidad: 'Mantenimiento Preventivo & PLC',
    pin: '3456',
    avatar: '',
    skills: [
      { id: 'SK-03', nombre: 'Programación & Diagnóstico de PLC Siemen / Beckhoff', valoracion: 5, nivel: 'Maestro', ultimaEvaluacion: '2026-06-10' },
      { id: 'SK-02', nombre: 'Montaje & Ensamblaje de Conectores MC4', valoracion: 4, nivel: 'Avanzado', ultimaEvaluacion: '2026-02-18' },
      { id: 'SK-07', nombre: 'Manejo de Carretilla Elevadora y Puente Grúa (5T)', valoracion: 4, nivel: 'Avanzado', ultimaEvaluacion: '2025-11-05' }
    ],
    capacitaciones: [
      {
        id: 'CAP-301',
        titulo: 'Evaluación de Respuesta ante Paradas y Mantenimiento Correctivo',
        plan: 'Plan Anual Electromecánico',
        fecha: '2026-06-10',
        evaluador: 'Dir. Mantenimiento',
        puntuacion: 95,
        estado: 'superada',
        observaciones: 'Tiempo medio de resolución MTTR de los más bajos de la planta. Dominio de sensores inductivos y robótica.'
      }
    ],
    formaciones: [
      { id: 'FM-01', nombre: 'PRL Riesgo Eléctrico Alta Tensión (>600V)', fechaObtencion: '2025-01-20', fechaCaducidad: '2027-01-20', estado: 'vigente', entidad: 'TÜV Rheinland Academy' },
      { id: 'FM-04', nombre: 'Operación y Seguridad en Células Robotizadas (Norma ISO 10218)', fechaObtencion: '2025-02-14', fechaCaducidad: '2028-02-14', estado: 'vigente', entidad: 'KUKA Robotics Spain' },
      { id: 'FM-06', nombre: 'Metodología 5S & TPM Básica para Operarios de Línea', fechaObtencion: '2024-06-01', fechaCaducidad: '2028-06-01', estado: 'vigente', entidad: 'MPS Academy Internal' }
    ],
    permisos: [
      { id: 'PER-301', equipoId: 'L2', equipoNombre: 'Línea 2 · Módulos de Potencia 48V', tipo: 'linea', nivelAcceso: 'Electromecánico / Ajustador', autorizadoPor: 'Dir. Mantenimiento' },
      { id: 'PER-302', equipoId: 'MQ-101', equipoNombre: 'Ensambladora Automática Celdas LFP', tipo: 'maquina', nivelAcceso: 'Ajustador Técnico', autorizadoPor: 'Dir. Mantenimiento' },
      { id: 'PER-303', equipoId: 'MQ-102', equipoNombre: 'Robot Soldador Láser KUKA KR-20', tipo: 'maquina', nivelAcceso: 'Ajustador Técnico', autorizadoPor: 'Dir. Mantenimiento' }
    ],
    historial: [
      { id: 'HS-301', fecha: '2026-07-16 06:15', tipo: 'mantenimiento', descripcion: 'Intervención preventiva de engrase y calibración en sensores de Línea 2', linea: 'L2', piezas: 0 },
      { id: 'HS-302', fecha: '2026-07-15 11:20', tipo: 'parada_resuelta', descripcion: 'Resolución de avería mecánica en cinta de L2 en 12 minutos', linea: 'L2', piezas: 0 }
    ]
  },
  {
    id: 'OP-004',
    nombre: 'Lucía Fernández',
    email: 'l.fernandez@mpsproud.com',
    rol: 'Operario Especialista',
    lineas: ['L2', 'L4'],
    lineaActualId: 'L2',
    turno: 'Mañana',
    estado: 'activo',
    especialidad: 'Montaje de Módulos 48V',
    pin: '4567',
    avatar: '',
    skills: [
      { id: 'SK-02', nombre: 'Montaje & Ensamblaje de Conectores MC4', valoracion: 5, nivel: 'Maestro', ultimaEvaluacion: '2026-05-02' },
      { id: 'SK-06', nombre: 'Inspección Óptica AOI & Trazabilidad RFID', valoracion: 3, nivel: 'Intermedio', ultimaEvaluacion: '2026-01-15' }
    ],
    capacitaciones: [
      {
        id: 'CAP-401',
        titulo: 'Cualificación en Ensamblaje Estanco de Módulos 48V',
        plan: 'Plan Maestro Operario Especialista',
        fecha: '2026-05-02',
        evaluador: 'Jefe de Línea 2',
        puntuacion: 90,
        estado: 'superada',
        observaciones: 'Alta velocidad en crimpado e interconexión sin generar retrabajos.'
      }
    ],
    formaciones: [
      { id: 'FM-01', nombre: 'PRL Riesgo Eléctrico Alta Tensión (>600V)', fechaObtencion: '2025-05-10', fechaCaducidad: '2027-05-10', estado: 'vigente', entidad: 'TÜV Rheinland Academy' },
      { id: 'FM-03', nombre: 'Manipulación Segura de Químicos y Electrolito de Litio', fechaObtencion: '2025-06-01', fechaCaducidad: '2027-06-01', estado: 'vigente', entidad: 'SGS Inspecciones' }
    ],
    permisos: [
      { id: 'PER-401', equipoId: 'L2', equipoNombre: 'Línea 2 · Módulos de Potencia 48V', tipo: 'linea', nivelAcceso: 'Operario Especialista', autorizadoPor: 'Jefe de Línea' },
      { id: 'PER-402', equipoId: 'L4', equipoNombre: 'Línea 4 · Prototipos & Serie Corta', tipo: 'linea', nivelAcceso: 'Operario Certificado', autorizadoPor: 'Jefe de Línea' }
    ],
    historial: [
      { id: 'HS-401', fecha: '2026-07-16 06:00', tipo: 'turno_inicio', descripcion: 'Asignación en estación de crimpado e interconexión en Línea 2', linea: 'L2', piezas: 0 },
      { id: 'HS-402', fecha: '2026-07-15 14:00', tipo: 'turno_fin', descripcion: 'Cierre turno mañana en L2 completando 310 módulos', linea: 'L2', piezas: 310 }
    ]
  },
  {
    id: 'OP-005',
    nombre: 'Javier Santos Puig',
    email: 'j.santos@mpsproud.com',
    rol: 'Operario Especialista',
    lineas: ['L3', 'L5'],
    lineaActualId: 'L3',
    turno: 'Mañana',
    estado: 'activo',
    especialidad: 'Cableado de Alta Tensión & Conectores',
    pin: '5678',
    avatar: '',
    skills: [
      { id: 'SK-02', nombre: 'Montaje & Ensamblaje de Conectores MC4', valoracion: 4, nivel: 'Avanzado', ultimaEvaluacion: '2026-04-10' },
      { id: 'SK-07', nombre: 'Manejo de Carretilla Elevadora y Puente Grúa (5T)', valoracion: 4, nivel: 'Avanzado', ultimaEvaluacion: '2025-10-20' }
    ],
    capacitaciones: [
      {
        id: 'CAP-501',
        titulo: 'Reciclaje Práctico en Conexión Dieléctrica Pack 400V',
        plan: 'Plan Anual de Reciclaje MES 2026',
        fecha: '2026-04-10',
        evaluador: 'Responsable PRL & Operaciones',
        puntuacion: 88,
        estado: 'superada',
        observaciones: 'Cumple el protocolo de verificación de ausencia de tensión.'
      }
    ],
    formaciones: [
      { id: 'FM-01', nombre: 'PRL Riesgo Eléctrico Alta Tensión (>600V)', fechaObtencion: '2025-02-01', fechaCaducidad: '2027-02-01', estado: 'vigente', entidad: 'TÜV Rheinland Academy' },
      { id: 'FM-05', nombre: 'Primeros Auxilios y Evacuación en Zonas con Riesgo Químico/Eléctrico', fechaObtencion: '2025-11-15', fechaCaducidad: '2026-11-15', estado: 'vigente', entidad: 'Mutua Universal' }
    ],
    permisos: [
      { id: 'PER-501', equipoId: 'L3', equipoNombre: 'Línea 3 · Pack Industrial 400V/800V', tipo: 'linea', nivelAcceso: 'Operario Alta Tensión', autorizadoPor: 'Dir. Operaciones' },
      { id: 'PER-502', equipoId: 'L5', equipoNombre: 'Línea 5 · Reciclaje & Desmontaje', tipo: 'linea', nivelAcceso: 'Operario Seguridad', autorizadoPor: 'Dir. Operaciones' }
    ],
    historial: [
      { id: 'HS-501', fecha: '2026-07-16 06:00', tipo: 'turno_inicio', descripcion: 'Fichaje en Línea 3 (Montaje pack industrial 400V)', linea: 'L3', piezas: 0 }
    ]
  },
  {
    id: 'OP-006',
    nombre: 'Elena Rostova',
    email: 'e.rostova@mpsproud.com',
    rol: 'Operario de Calidad',
    lineas: ['L1', 'L4', 'L5'],
    lineaActualId: 'L4',
    turno: 'Mañana',
    estado: 'activo',
    especialidad: 'Inspección Óptica & Trazabilidad',
    pin: '6789',
    avatar: '',
    skills: [
      { id: 'SK-06', nombre: 'Inspección Óptica AOI & Trazabilidad RFID', valoracion: 5, nivel: 'Maestro', ultimaEvaluacion: '2026-06-05' },
      { id: 'SK-04', nombre: 'Control de Calidad EOL (End of Line Test & Hi-Pot)', valoracion: 4, nivel: 'Avanzado', ultimaEvaluacion: '2026-03-25' }
    ],
    capacitaciones: [
      {
        id: 'CAP-601',
        titulo: 'Inspección de Prototipos e Identificación de Defectos Críticos',
        plan: 'Plan de Cualificación QA/QC 2026',
        fecha: '2026-06-05',
        evaluador: 'Dir. Calidad',
        puntuacion: 97,
        estado: 'superada',
        observaciones: 'Especial soltura en uso del software de visión artificial AOI.'
      }
    ],
    formaciones: [
      { id: 'FM-02', nombre: 'Soldadura Electrónica Estándar IPC-A-610', fechaObtencion: '2024-10-10', fechaCaducidad: '2027-10-10', estado: 'vigente', entidad: 'IPC Official Training' },
      { id: 'FM-06', nombre: 'Metodología 5S & TPM Básica para Operarios de Línea', fechaObtencion: '2025-01-15', fechaCaducidad: '2029-01-15', estado: 'vigente', entidad: 'MPS Academy Internal' }
    ],
    permisos: [
      { id: 'PER-601', equipoId: 'L4', equipoNombre: 'Línea 4 · Prototipos & Serie Corta', tipo: 'linea', nivelAcceso: 'Inspector QA Prototipos', autorizadoPor: 'Dir. Calidad' },
      { id: 'PER-602', equipoId: 'MQ-103', equipoNombre: 'Banco de Pruebas EOL & Hi-Pot Test', tipo: 'maquina', nivelAcceso: 'Evaluador QA', autorizadoPor: 'Dir. Calidad' }
    ],
    historial: [
      { id: 'HS-601', fecha: '2026-07-16 06:10', tipo: 'turno_inicio', descripcion: 'Inicio inspección de lote prototipo en Línea 4', linea: 'L4', piezas: 0 }
    ]
  },
  {
    id: 'OP-007',
    nombre: 'David Martín Gómez',
    email: 'd.martin@mpsproud.com',
    rol: 'Operario Especialista',
    lineas: ['L2', 'L5'],
    lineaActualId: 'L5',
    turno: 'Mañana',
    estado: 'activo',
    especialidad: 'Empaquetado y Pruebas de Carga',
    pin: '7890',
    avatar: '',
    skills: [
      { id: 'SK-07', nombre: 'Manejo de Carretilla Elevadora y Puente Grúa (5T)', valoracion: 5, nivel: 'Maestro', ultimaEvaluacion: '2026-05-18' }
    ],
    capacitaciones: [
      {
        id: 'CAP-701',
        titulo: 'Evaluación de Logística y Seguridad en Movimiento de Cargas 5T',
        plan: 'Plan de Reciclaje Logístico 2026',
        fecha: '2026-05-18',
        evaluador: 'Jefe Almacén & Logística',
        puntuacion: 94,
        estado: 'superada',
        observaciones: 'Manejo seguro con cero incidencias en zona de carga pesada.'
      }
    ],
    formaciones: [
      { id: 'FM-03', nombre: 'Manipulación Segura de Químicos y Electrolito de Litio', fechaObtencion: '2025-04-01', fechaCaducidad: '2027-04-01', estado: 'vigente', entidad: 'SGS Inspecciones' },
      { id: 'FM-05', nombre: 'Primeros Auxilios y Evacuación en Zonas con Riesgo Químico/Eléctrico', fechaObtencion: '2025-08-10', fechaCaducidad: '2026-08-10', estado: 'vigente', entidad: 'Mutua Universal' }
    ],
    permisos: [
      { id: 'PER-701', equipoId: 'L5', equipoNombre: 'Línea 5 · Reciclaje & Desmontaje', tipo: 'linea', nivelAcceso: 'Operador Logístico & Reciclaje', autorizadoPor: 'Jefe Almacén' }
    ],
    historial: [
      { id: 'HS-701', fecha: '2026-07-16 06:00', tipo: 'turno_inicio', descripcion: 'Recepción y paletizado de celdas EOL en Línea 5', linea: 'L5', piezas: 0 }
    ]
  },
  {
    id: 'OP-008',
    nombre: 'Sara Navarro',
    email: 's.navarro@mpsproud.com',
    rol: 'Operario Especialista',
    lineas: ['L1'],
    lineaActualId: null,
    turno: 'Tarde',
    estado: 'inactivo',
    especialidad: 'Ensamblaje Celular 24V/48V',
    pin: '8901',
    avatar: '',
    skills: [
      { id: 'SK-01', nombre: 'Soldadura Láser de Celdas LFP', valoracion: 3, nivel: 'Intermedio', ultimaEvaluacion: '2025-12-10' }
    ],
    capacitaciones: [
      {
        id: 'CAP-801',
        titulo: 'Evaluación Inicial de Soldadura Estándar',
        plan: 'Plan Maestro Operario Especialista',
        fecha: '2025-12-10',
        evaluador: 'Supervisor Turno Tarde',
        puntuacion: 78,
        estado: 'pendiente_reciclaje',
        observaciones: 'Recomendado curso de reciclaje láser y renovación de carnet PRL.'
      }
    ],
    formaciones: [
      { id: 'FM-01', nombre: 'PRL Riesgo Eléctrico Alta Tensión (>600V)', fechaObtencion: '2023-06-01', fechaCaducidad: '2025-06-01', estado: 'caducado', entidad: 'TÜV Rheinland Academy' }
    ],
    permisos: [
      { id: 'PER-801', equipoId: 'L1', equipoNombre: 'Línea 1 · Ensamblaje Baterías LFP', tipo: 'linea', nivelAcceso: 'Operador Especialista', autorizadoPor: 'Jefe de Línea' }
    ],
    historial: [
      { id: 'HS-801', fecha: '2026-06-30 22:00', tipo: 'baja_temporal', descripcion: 'Permiso temporal / rotación fuera de turno', linea: 'L1', piezas: 0 }
    ]
  }
];
