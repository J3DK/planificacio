// Datos simulados y maestros para el módulo GMAO / Mantenimiento Integral

export const kpisMantenimiento = {
  disponibilidadGlobal: 94.2,
  mtbf: 168.5, // horas
  mttr: 42.0,  // minutos
  pctPreventivo: 68.4,
  pctCorrectivo: 31.6,
  otsAbiertas: 7,
  otsCriticas: 2,
  costeAcumuladoMes: 14850 // €
};

export const evolucionDisponibilidadLinea = [
  { hora: '07:00', L1: 96.5, L2: 94.0, L3: 88.5, L4: 95.0, L5: 97.0 },
  { hora: '09:00', L1: 96.0, L2: 95.2, L3: 89.0, L4: 92.5, L5: 97.5 },
  { hora: '11:00', L1: 95.8, L2: 96.0, L3: 85.0, L4: 93.0, L5: 98.0 },
  { hora: '13:00', L1: 96.2, L2: 95.5, L3: 86.5, L4: 90.0, L5: 97.2 },
  { hora: '15:00', L1: 97.0, L2: 94.8, L3: 91.0, L4: 91.5, L5: 96.8 },
  { hora: '17:00', L1: 96.8, L2: 95.0, L3: 92.4, L4: 92.8, L5: 97.1 }
];

export const horasParadaPorCausaTecnica = [
  { causa: 'Desgaste Mecánico Rodamientos', horas: 14.5, color: '#ef4444' },
  { causa: 'Fallo Eléctrico / Sensores', horas: 10.2, color: '#f59e0b' },
  { causa: 'Neumática / Fugas Aire', horas: 7.8, color: '#3b82f6' },
  { causa: 'Calibración Cabezal Soldadura', horas: 6.0, color: '#8b5cf6' },
  { causa: 'Atasco Transfer Cinta', horas: 4.5, color: '#06b6d4' }
];

export const tablaDisponibilidadLineas = [
  { linea: 'Línea 1', objetivo: 95.0, real: 96.8, desviacion: '+1.8%', estado: 'bien', tendencia: 'up' },
  { linea: 'Línea 2', objetivo: 94.0, real: 95.0, desviacion: '+1.0%', estado: 'bien', tendencia: 'up' },
  { linea: 'Línea 3', objetivo: 93.0, real: 88.5, desviacion: '-4.5%', estado: 'critico', tendencia: 'down', alerta: '2 OTs Correctivas abiertas' },
  { linea: 'Línea 4', objetivo: 95.0, real: 92.8, desviacion: '-2.2%', estado: 'alerta', tendencia: 'down', alerta: 'Avería recurrente motor rodillos' },
  { linea: 'Línea 5', objetivo: 96.0, real: 97.1, desviacion: '+1.1%', estado: 'bien', tendencia: 'up' }
];

export const topCausasAveria = [
  { componente: 'Rodamiento Principal Motor L4', ots: 4, horasPerdidas: 8.5, criticidad: 'alta' },
  { componente: 'Cabezal Soldadura Automática L3', ots: 3, horasPerdidas: 6.2, criticidad: 'alta' },
  { componente: 'Electroválvula Neumática Est. 2 (L1)', ots: 3, horasPerdidas: 4.0, criticidad: 'media' },
  { componente: 'Sensor Óptico de Posición Transfer (L3)', ots: 2, horasPerdidas: 3.5, criticidad: 'media' },
  { componente: 'Bomba Lubricación Automática (L2)', ots: 2, horasPerdidas: 2.8, criticidad: 'baja' }
];

export const mensajeClaveMantenimiento = {
  titulo: 'IA Mantenimiento · Síntesis y Alertas Tempranas',
  contenido: 'La Línea 3 presenta un cuello de botella técnico con 2 OTs correctivas abiertas en el cabezal de soldadura (-4.5% de disponibilidad). El rodamiento del motor de Línea 4 muestra un patrón de averías recurrentes (3 incidencias en 30 días, vibración elevada). Atención: El repuesto crítico "Rodamiento SKF 6205" se encuentra por debajo de stock mínimo (2 uds disponibles vs 5 mínimas).'
};

export const activosJerarquia = [
  {
    id: 'PL-01',
    nombre: 'Planta Principal Barcelona',
    tipo: 'planta',
    hijos: [
      {
        id: 'L-01',
        nombre: 'Línea 1 — Montaje Rápido',
        tipo: 'linea',
        criticidad: 'alta',
        hijos: [
          {
            id: 'MQ-101',
            nombre: 'Estación de Soldadura por Onda automática #1',
            tipo: 'maquina',
            fabricante: 'Ersa GmbH',
            numSerie: 'ERS-2023-8891',
            fechaInstalacion: '2023-04-15',
            criticidad: 'alta',
            horasFuncionamiento: 8450,
            intervenciones: 14,
            hijos: [
              { id: 'COMP-101-A', nombre: 'Crisol y Bomba de Estaño', tipo: 'componente', criticidad: 'alta', horasFuncionamiento: 8450, intervenciones: 6 },
              { id: 'COMP-101-B', nombre: 'Transportador de Pines y Cadenas', tipo: 'componente', criticidad: 'media', horasFuncionamiento: 8450, intervenciones: 4 },
              { id: 'COMP-101-C', nombre: 'Módulo de Precalentamiento IR', tipo: 'componente', criticidad: 'media', horasFuncionamiento: 8450, intervenciones: 4 }
            ]
          },
          {
            id: 'MQ-102',
            nombre: 'Robot de Pick & Place SMD #1',
            tipo: 'maquina',
            fabricante: 'ASMPT Fuji',
            numSerie: 'FUJ-9921-X',
            fechaInstalacion: '2022-11-20',
            criticidad: 'alta',
            horasFuncionamiento: 11200,
            intervenciones: 19,
            hijos: [
              { id: 'COMP-102-A', nombre: 'Cabezal Rotativo 12 Boquillas', tipo: 'componente', criticidad: 'alta', horasFuncionamiento: 11200, intervenciones: 11 },
              { id: 'COMP-102-B', nombre: 'Cámara Óptica de Alineación Vision', tipo: 'componente', criticidad: 'alta', horasFuncionamiento: 11200, intervenciones: 5 },
              { id: 'COMP-102-C', nombre: 'Eje Lineal Magnético X-Y', tipo: 'componente', criticidad: 'media', horasFuncionamiento: 11200, intervenciones: 3 }
            ]
          }
        ]
      },
      {
        id: 'L-03',
        nombre: 'Línea 3 — Ensamblaje Pesado',
        tipo: 'linea',
        criticidad: 'alta',
        hijos: [
          {
            id: 'MQ-301',
            nombre: 'Prensa Hidráulica y Remachadora 50T',
            tipo: 'maquina',
            fabricante: 'Bosch Rexroth',
            numSerie: 'BOS-PRS-5002',
            fechaInstalacion: '2021-08-10',
            criticidad: 'alta',
            horasFuncionamiento: 14600,
            intervenciones: 28,
            hijos: [
              { id: 'COMP-301-A', nombre: 'Cilindro Principal Hidráulico', tipo: 'componente', criticidad: 'alta', horasFuncionamiento: 14600, intervenciones: 12 },
              { id: 'COMP-301-B', nombre: 'Centralita de Válvulas Neumáticas', tipo: 'componente', criticidad: 'alta', horasFuncionamiento: 14600, intervenciones: 10 },
              { id: 'COMP-301-C', nombre: 'Barreras Ópticas de Seguridad SICK', tipo: 'componente', criticidad: 'alta', horasFuncionamiento: 14600, intervenciones: 6 }
            ]
          }
        ]
      },
      {
        id: 'L-04',
        nombre: 'Línea 4 — Empaquetado Automático',
        tipo: 'linea',
        criticidad: 'media',
        hijos: [
          {
            id: 'MQ-401',
            nombre: 'Cinta Encajadora y Paletizador',
            tipo: 'maquina',
            fabricante: 'KUKA Robotics',
            numSerie: 'KUK-PAL-7712',
            fechaInstalacion: '2023-01-12',
            criticidad: 'media',
            horasFuncionamiento: 7800,
            intervenciones: 9,
            hijos: [
              { id: 'COMP-401-A', nombre: 'Motor Principal Tracción Rodillos', tipo: 'componente', criticidad: 'alta', horasFuncionamiento: 7800, intervenciones: 6 },
              { id: 'COMP-401-B', nombre: 'Garra Neumática de Ventosas', tipo: 'componente', criticidad: 'media', horasFuncionamiento: 7800, intervenciones: 3 }
            ]
          }
        ]
      }
    ]
  }
];

export const ordenesTrabajoIniciales = [
  {
    id: 'OT-2026-081',
    codigo: 'OT-081',
    titulo: 'Sustitución urgente rodamiento motor tracción rodillos',
    activoId: 'COMP-401-A',
    activoNombre: 'Motor Principal Tracción Rodillos (MQ-401)',
    linea: 'Línea 4',
    tipo: 'correctivo',
    prioridad: 'critica',
    estado: 'abierta',
    tecnico: 'Carlos Mendoza (MTO Eléctrico)',
    turno: 'Turno Mañana',
    fechaApertura: '2026-07-14 08:15',
    fechaCierre: '',
    tiempoEst: 90,
    tiempoReal: 0,
    repuestos: [{ codigo: 'REP-SKF-6205', nombre: 'Rodamiento SKF 6205-2RS', cantidad: 1, coste: 45 }],
    causaRaiz: 'ERR-MEC-01 — Sobrecarga en eje de arrastre por tensión excesiva en cinta',
    paradaId: 101, // Vínculo con parada originada en Línea 4
    costeTotal: 125
  },
  {
    id: 'OT-2026-082',
    codigo: 'OT-082',
    titulo: 'Fallo de sellado cabezal ultrasónico — pérdida de presión neumática',
    activoId: 'COMP-301-B',
    activoNombre: 'Centralita de Válvulas Neumáticas (MQ-301)',
    linea: 'Línea 3',
    tipo: 'correctivo',
    prioridad: 'critica',
    estado: 'en curso',
    tecnico: 'Javier Ramírez (MTO Mecánico)',
    turno: 'Turno Mañana',
    fechaApertura: '2026-07-14 09:30',
    fechaCierre: '',
    tiempoEst: 60,
    tiempoReal: 45,
    repuestos: [{ codigo: 'REP-FESTO-VLV', nombre: 'Electroválvula Proporcional Festo', cantidad: 1, coste: 180 }],
    causaRaiz: 'ERR-NEU-02 — Fuga en junta tórica de colector principal de válvulas',
    paradaId: 102,
    costeTotal: 240
  },
  {
    id: 'OT-2026-083',
    codigo: 'OT-083',
    titulo: 'Mantenimiento Preventivo 5.000 horas — Cambio aceites y filtros hidraúlicos',
    activoId: 'COMP-301-A',
    activoNombre: 'Cilindro Principal Hidráulico (MQ-301)',
    linea: 'Línea 3',
    tipo: 'preventivo',
    prioridad: 'media',
    estado: 'pendiente repuesto',
    tecnico: 'Sergio Gómez (MTO Lubricación)',
    turno: 'Turno Tarde',
    fechaApertura: '2026-07-13 14:00',
    fechaCierre: '',
    tiempoEst: 120,
    tiempoReal: 0,
    repuestos: [{ codigo: 'REP-FILT-HID', nombre: 'Filtro de Presión Hidráulico Rexroth', cantidad: 2, coste: 110 }],
    causaRaiz: 'MNT-PREV — Disparador automático por contador de horas (>14.500h)',
    paradaId: null,
    costeTotal: 180
  },
  {
    id: 'OT-2026-080',
    codigo: 'OT-080',
    titulo: 'Calibración de cámaras de visión artificial y limpieza de espejos',
    activoId: 'COMP-102-B',
    activoNombre: 'Cámara Óptica de Alineación Vision (MQ-102)',
    linea: 'Línea 1',
    tipo: 'predictivo',
    prioridad: 'baja',
    estado: 'cerrada',
    tecnico: 'Elena Torres (MTO Automoción & Visión)',
    turno: 'Turno Mañana',
    fechaApertura: '2026-07-14 06:30',
    fechaCierre: '2026-07-14 07:10',
    tiempoEst: 45,
    tiempoReal: 40,
    repuestos: [],
    causaRaiz: 'PRED-OPT — Desviación leve en contraste óptico detectada por algoritmo',
    paradaId: null,
    costeTotal: 55
  },
  {
    id: 'OT-2026-079',
    codigo: 'OT-079',
    titulo: 'Desatasco de guías laterales de cinta transportadora',
    activoId: 'COMP-101-B',
    activoNombre: 'Transportador de Pines y Cadenas (MQ-101)',
    linea: 'Línea 1',
    tipo: 'correctivo',
    prioridad: 'alta',
    estado: 'cerrada',
    tecnico: 'Carlos Mendoza (MTO Eléctrico)',
    turno: 'Turno Noche',
    fechaApertura: '2026-07-13 22:10',
    fechaCierre: '2026-07-13 22:35',
    tiempoEst: 30,
    tiempoReal: 25,
    repuestos: [{ codigo: 'REP-GUI-PLA', nombre: 'Juego de Guías de Deslizamiento Teflon', cantidad: 1, coste: 35 }],
    causaRaiz: 'ERR-MEC-03 — Acumulación de residuos de fundente de soldadura en riel lateral',
    paradaId: 98,
    costeTotal: 75
  }
];

export const planesPreventivosIniciales = [
  {
    id: 'PLN-01',
    codigo: 'PREV-SOLD-WEE',
    titulo: 'Inspección de crisol, nivel de estaño y limpieza de escoria',
    activoNombre: 'Estación de Soldadura por Onda (MQ-101)',
    linea: 'Línea 1',
    frecuencia: 'Semanal (o cada 160h)',
    tipoDisparador: 'horas',
    contadorActual: 158,
    umbralDisparo: 160,
    ultimaIntervencion: '2026-07-07',
    proximaIntervencion: '2026-07-15',
    estado: 'proximo',
    checklist: [
      { tarea: 'Comprobar nivel de lingotes de estaño SAC305', completado: false },
      { tarea: 'Retirar escoria superficial y aplicar polvo reductor', completado: false },
      { tarea: 'Verificar caudal de flux y presión de boquilla atomizadora', completado: false },
      { tarea: 'Limpiar dedos de transporte de titanio con alcohol isopropílico', completado: false }
    ]
  },
  {
    id: 'PLN-02',
    codigo: 'PREV-PICK-MON',
    titulo: 'Lubricación de ejes lineales X-Y y calibración de boquillas SMD',
    activoNombre: 'Robot Pick & Place Fuji (MQ-102)',
    linea: 'Línea 1',
    frecuencia: 'Mensual (o cada 500h)',
    tipoDisparador: 'calendario',
    contadorActual: 420,
    umbralDisparo: 500,
    ultimaIntervencion: '2026-06-15',
    proximaIntervencion: '2026-07-16',
    estado: 'proximo',
    checklist: [
      { tarea: 'Engrasar husillos de bolas con grasa sintética grado 2', completado: false },
      { tarea: 'Comprobar vacío de filtros neumáticos de sujeción SMD', completado: false },
      { tarea: 'Ejecutar programa de autocalibración de boquillas en mármol de referencia', completado: false }
    ]
  },
  {
    id: 'PLN-03',
    codigo: 'PREV-HIDR-5000',
    titulo: 'Sustitución de aceite hidráulico HLP 46 y filtros de alta presión',
    activoNombre: 'Prensa Hidráulica 50T (MQ-301)',
    linea: 'Línea 3',
    frecuencia: 'Anual (o cada 5.000h)',
    tipoDisparador: 'horas',
    contadorActual: 5012,
    umbralDisparo: 5000,
    ultimaIntervencion: '2025-07-10',
    proximaIntervencion: '2026-07-14',
    estado: 'vencido', // Ya generó OT-083
    checklist: [
      { tarea: 'Drenar depósito de 120 litros de aceite usado y reciclar', completado: true },
      { tarea: 'Sustituir cartuchos de filtrado de retorno y presión', completado: false },
      { tarea: 'Llenar con aceite fresco HLP 46 y purgar aire en actuadores', completado: false }
    ]
  },
  {
    id: 'PLN-04',
    codigo: 'PREV-PAL-TRIM',
    titulo: 'Revisión y retensado de correas y cadenas del paletizador',
    activoNombre: 'Cinta Encajadora y Paletizador (MQ-401)',
    linea: 'Línea 4',
    frecuencia: 'Trimestral',
    tipoDisparador: 'calendario',
    contadorActual: 75,
    umbralDisparo: 90,
    ultimaIntervencion: '2026-05-01',
    proximaIntervencion: '2026-08-01',
    estado: 'al dia',
    checklist: [
      { tarea: 'Comprobar tensión y desgaste de correa dentada del elevador', completado: false },
      { tarea: 'Verificar apriete de bornes en armario de servomotores', completado: false }
    ]
  }
];

export const sensoresPredictivosIniciales = [
  {
    id: 'SENS-01',
    activoId: 'COMP-401-A',
    activoNombre: 'Motor Principal Tracción Rodillos (MQ-401)',
    linea: 'Línea 4',
    variable: 'Vibración RMS Ax/Rad (mm/s)',
    valorActual: 7.8,
    umbralAlerta: 4.5,
    umbralCritico: 7.1,
    unidad: 'mm/s',
    vidaUtilRestantePct: 12,
    estado: 'critico',
    recomendacion: 'Fallo inminente de rodamiento lado accionamiento. Programar parada en menos de 24h para sustitución.'
  },
  {
    id: 'SENS-02',
    activoId: 'COMP-301-A',
    activoNombre: 'Cilindro Principal Hidráulico (MQ-301)',
    linea: 'Línea 3',
    variable: 'Temperatura Aceite Depósito (°C)',
    valorActual: 68.2,
    umbralAlerta: 65.0,
    umbralCritico: 75.0,
    unidad: '°C',
    vidaUtilRestantePct: 34,
    estado: 'alerta',
    recomendacion: 'Degradación térmica prematura del fluido. Inspeccionar intercambiador de calor de agua de refrigeración.'
  },
  {
    id: 'SENS-03',
    activoId: 'COMP-101-A',
    activoNombre: 'Crisol y Bomba de Estaño (MQ-101)',
    linea: 'Línea 1',
    variable: 'Horas de Rodete Bomba Estaño',
    valorActual: 4210,
    umbralAlerta: 4500,
    umbralCritico: 5000,
    unidad: 'horas',
    vidaUtilRestantePct: 82,
    estado: 'normal',
    recomendacion: 'Funcionamiento óptimo. Siguiente revisión predictiva de corriente de motor programada en 300 horas.'
  },
  {
    id: 'SENS-04',
    activoId: 'COMP-102-A',
    activoNombre: 'Cabezal Rotativo 12 Boquillas (MQ-102)',
    linea: 'Línea 1',
    variable: 'Desviación de Posición Eje Z (µm)',
    valorActual: 18.5,
    umbralAlerta: 25.0,
    umbralCritico: 40.0,
    unidad: 'µm',
    vidaUtilRestantePct: 75,
    estado: 'normal',
    recomendacion: 'Precisión de colocación dentro de margen de calidad clase 3.'
  }
];

export const repuestosAlmacenIniciales = [
  {
    id: 'REP-01',
    codigo: 'REP-SKF-6205',
    nombre: 'Rodamiento SKF 6205-2RS C3 Blindado',
    categoria: 'Rodamientos y Mecánica',
    stockActual: 2,
    stockMinimo: 5,
    ubicacion: 'Estantería B-04-2',
    costeUnitario: 45,
    compatiblesCon: ['MQ-401 Motor Tracción', 'MQ-101 Transportador'],
    estadoStock: 'critico' // Por debajo de stock mínimo
  },
  {
    id: 'REP-02',
    codigo: 'REP-FESTO-VLV',
    nombre: 'Electroválvula Proporcional Neumática Festo MPYE',
    categoria: 'Neumática y Válvulas',
    stockActual: 3,
    stockMinimo: 2,
    ubicacion: 'Estantería C-12-1',
    costeUnitario: 180,
    compatiblesCon: ['MQ-301 Prensa 50T', 'MQ-101 Soldadura'],
    estadoStock: 'normal'
  },
  {
    id: 'REP-03',
    codigo: 'REP-FILT-HID',
    nombre: 'Cartucho Filtro de Presión Hidráulico Rexroth 10µm',
    categoria: 'Filtros y Lubricación',
    stockActual: 1,
    stockMinimo: 4,
    ubicacion: 'Almacén Central Aceites A-01',
    costeUnitario: 55,
    compatiblesCon: ['MQ-301 Prensa 50T'],
    estadoStock: 'critico'
  },
  {
    id: 'REP-04',
    codigo: 'REP-BOQ-SMD',
    nombre: 'Juego Boquillas Cerámicas Precisión Fuji N-04',
    categoria: 'Utillajes y Pick&Place',
    stockActual: 8,
    stockMinimo: 4,
    ubicacion: 'Estantería A-08-3',
    costeUnitario: 120,
    compatiblesCon: ['MQ-102 Robot Fuji'],
    estadoStock: 'normal'
  },
  {
    id: 'REP-05',
    codigo: 'REP-SENS-OPT',
    nombre: 'Sensor Fotocélula Láser SICK WTE11-2P2432',
    categoria: 'Sensores y Electricidad',
    stockActual: 6,
    stockMinimo: 3,
    ubicacion: 'Estantería D-02-4',
    costeUnitario: 95,
    compatiblesCon: ['Línea 1', 'Línea 2', 'Línea 3', 'Línea 4', 'Línea 5'],
    estadoStock: 'normal'
  },
  {
    id: 'REP-06',
    codigo: 'REP-GUI-PLA',
    nombre: 'Perfil de Guía Deslizamiento Teflon anti-estático (barra 2m)',
    categoria: 'Rodamientos y Mecánica',
    stockActual: 4,
    stockMinimo: 2,
    ubicacion: 'Estantería B-09-1',
    costeUnitario: 35,
    compatiblesCon: ['MQ-101 Soldadura', 'MQ-401 Encajadora'],
    estadoStock: 'normal'
  }
];

export const kpisEvolucionMensual = [
  { mes: 'Feb', preventivoPct: 58.0, correctivoPct: 42.0, mtbf: 142, mttr: 52, coste: 18400 },
  { mes: 'Mar', preventivoPct: 61.5, correctivoPct: 38.5, mtbf: 151, mttr: 48, coste: 17200 },
  { mes: 'Abr', preventivoPct: 64.0, correctivoPct: 36.0, mtbf: 159, mttr: 45, coste: 16100 },
  { mes: 'May', preventivoPct: 66.2, correctivoPct: 33.8, mtbf: 164, mttr: 43, coste: 15300 },
  { mes: 'Jun', preventivoPct: 67.5, correctivoPct: 32.5, mtbf: 167, mttr: 42, coste: 14900 },
  { mes: 'Jul', preventivoPct: 68.4, correctivoPct: 31.6, mtbf: 168.5, mttr: 42.0, coste: 14850 }
];
