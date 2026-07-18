export const checklistTemplates = [
  // ─── PLANTILLAS 5S ────────────────────────────────────────────────────────
  {
    id: 'CHK-5S-001',
    nombre: 'Auditoría Visual 5S de Puesto de Trabajo',
    categoria: '5s',
    descripcion: 'Pauta para evaluar el nivel de orden y limpieza (5S) en las líneas de producción.',
    aplicaA: { tipo: 'general' },
    frecuencia: 'semanal',
    activo: true,
    items: [
      { id: 'IT-5S-01', texto: 'Seiri (Clasificar): No hay objetos innecesarios o materiales caducados en el puesto.', orden: 1, critico: true },
      { id: 'IT-5S-02', texto: 'Seiton (Ordenar): Las herramientas están en su sitio (panel de sombras o cajones etiquetados).', orden: 2, critico: true },
      { id: 'IT-5S-03', texto: 'Seiso (Limpiar): El suelo, mesas y máquinas están limpios y sin derrames.', orden: 3, critico: true },
      { id: 'IT-5S-04', texto: 'Seiketsu (Estandarizar): Se respetan los códigos de colores y las marcas visuales en el suelo.', orden: 4, critico: false },
      { id: 'IT-5S-05', texto: 'Shitsuke (Disciplina): Los operarios llevan el EPI correcto y la zona de paso está despejada.', orden: 5, critico: true }
    ]
  },
  // ─── PLANTILLAS DE CALIDAD ────────────────────────────────────────────────
  {
    id: 'CHK-QC-001',
    nombre: 'Inspección visual y final de batería LFP',
    categoria: 'calidad',
    descripcion: 'Puntos de control exterior, estanqueidad y etiquetado antes de dar por buena la unidad terminada',
    aplicaA: { tipo: 'general' },
    frecuencia: 'por_orden',
    activo: true,
    items: [
      { id: 'IT-QC1-01', texto: 'Comprobar aspecto visual de carcasa exterior y ausencia de abolladuras o rayas', orden: 1, critico: true },
      { id: 'IT-QC1-02', texto: 'Verificar etiquetado, código de barras QR y trazabilidad del lote de celdas', orden: 2, critico: true },
      { id: 'IT-QC1-03', texto: 'Asegurar sellado perimetral estanco y colocación de juntas de goma en bornes', orden: 3, critico: true },
      { id: 'IT-QC1-04', texto: 'Control dimensional de anclajes y cotas mecánicas según plano técnico', orden: 4, critico: false },
      { id: 'IT-QC1-05', texto: 'Integridad del embalaje exterior e inclusión de hoja de pruebas en pallet', orden: 5, critico: false }
    ]
  },
  {
    id: 'CHK-QC-002',
    nombre: 'Control dimensional en celda de encaje y soldadura láser',
    categoria: 'calidad',
    descripcion: 'Verificación geométrica y penetración de soldadura de pestañas (tabs) de batería',
    aplicaA: { tipo: 'linea', ids: ['L1', 'L2'] },
    frecuencia: 'por_orden',
    activo: true,
    items: [
      { id: 'IT-QC2-01', texto: 'Verificar centrado milimétrico de pestañas de celda sobre peine colector', orden: 1, critico: true },
      { id: 'IT-QC2-02', texto: 'Inspección visual de cordón de soldadura láser (sin poros ni salpicaduras)', orden: 2, critico: true },
      { id: 'IT-QC2-03', texto: 'Medición rápida de resistencia de contacto (µΩ) con medidor 4 puntas', orden: 3, critico: true }
    ]
  },
  {
    id: 'CHK-QC-003',
    nombre: 'Verificación de aislamiento eléctrico y rigidez dieléctrica (Hi-Pot)',
    categoria: 'calidad',
    descripcion: 'Test de aislamiento entre alta tensión y chasis en módulos de potencia',
    aplicaA: { tipo: 'linea', ids: ['L1', 'L3'] },
    frecuencia: 'por_turno',
    activo: true,
    items: [
      { id: 'IT-QC3-01', texto: 'Calibración a cero del equipo Hi-Pot de prueba al inicio del turno', orden: 1, critico: true },
      { id: 'IT-QC3-02', texto: 'Aplicar 2.5 kV DC entre busbar positivo y chasis durante 60 segundos', orden: 2, critico: true },
      { id: 'IT-QC3-03', texto: 'Comprobar corriente de fuga inferior a 1.5 mA en el monitor del probador', orden: 3, critico: true }
    ]
  },

  // ─── PLANTILLAS DE CIL (Limpieza, Inspección, Lubricación) ────────────────
  {
    id: 'CHK-CIL-001',
    nombre: 'CIL Turno — Estación de Ensamblaje e Inyección',
    categoria: 'cil',
    descripcion: 'Puntos básicos de Limpieza, Inspección y Lubricación al relevo de turno para evitar micro-paradas',
    aplicaA: { tipo: 'general' },
    frecuencia: 'por_turno',
    activo: true,
    items: [
      { id: 'IT-CIL1-01', texto: 'LIMPIEZA: Retirar residuos de flux, pestañas o recortes metálicos de la mesa de trabajo', orden: 1, critico: false },
      { id: 'IT-CIL1-02', texto: 'INSPECCIÓN: Verificar estado óptico de las lentes de las cámaras de visión artificial', orden: 2, critico: true },
      { id: 'IT-CIL1-03', texto: 'LUBRICACIÓN: Comprobar nivel del vaso lubricador neumático en la línea principal de aire', orden: 3, critico: true },
      { id: 'IT-CIL1-04', texto: 'INSPECCIÓN: Comprobar que las barreras ópticas de seguridad cortan correctamente al paso', orden: 4, critico: true },
      { id: 'IT-CIL1-05', texto: 'LIMPIEZA: Aspirar polvo en rejillas de refrigeración del armario de control local', orden: 5, critico: false }
    ]
  },
  {
    id: 'CHK-CIL-002',
    nombre: 'CIL Diario — Guías lineales y cabezal láser',
    categoria: 'cil',
    descripcion: 'Mantenimiento autónomo diario por parte del operario en cabezales de alta precisión',
    aplicaA: { tipo: 'linea', ids: ['L1', 'L3'] },
    frecuencia: 'diario',
    activo: true,
    items: [
      { id: 'IT-CIL2-01', texto: 'LIMPIEZA: Limpiar cristal protector (cover glass) del cabezal láser con paño sin pelusa e isopropanol', orden: 1, critico: true },
      { id: 'IT-CIL2-02', texto: 'LUBRICACIÓN: Aplicar grasa sintética en husillos y guías lineales de los ejes X/Y', orden: 2, critico: true },
      { id: 'IT-CIL2-03', texto: 'INSPECCIÓN: Comprobar presión del gas de asistencia de soldadura (mínimo 6 bar en manómetro)', orden: 3, critico: true }
    ]
  },
  {
    id: 'CHK-CIL-003',
    nombre: 'CIL Semanal — Cabina blanca y sistemas de extracción de polvo',
    categoria: 'cil',
    descripcion: 'Revisión semanal de filtros HEPA y caudales de aspiración en sala seca',
    aplicaA: { tipo: 'general' },
    frecuencia: 'semanal',
    activo: true,
    items: [
      { id: 'IT-CIL3-01', texto: 'INSPECCIÓN: Leer presión diferencial en manómetros Magnehelic de filtros HEPA (< 250 Pa)', orden: 1, critico: true },
      { id: 'IT-CIL3-02', texto: 'LIMPIEZA: Vaciar y limpiar cajón de escorias y polvos metálicos de la ciclónica de aspiración', orden: 2, critico: false },
      { id: 'IT-CIL3-03', texto: 'INSPECCIÓN: Verificar ausencia de fugas en conductos flexibles de aspiración antiestática', orden: 3, critico: true }
    ]
  },

  // ─── PLANTILLAS DE MANTENIMIENTO ──────────────────────────────────────────
  {
    id: 'CHK-MTO-001',
    nombre: 'Revisión preventiva 500h — Prensas neumáticas y actuadores',
    categoria: 'mantenimiento',
    descripcion: 'Pauta de revisión mecánica y sellos en cilindros prensadores de módulos',
    aplicaA: { tipo: 'linea', ids: ['L1', 'L2'] },
    frecuencia: 'segun_plan',
    activo: true,
    items: [
      { id: 'IT-MTO1-01', texto: 'Revisar estanqueidad y cambiar juntas tóricas de cilindros prensa principal', orden: 1, critico: true },
      { id: 'IT-MTO1-02', texto: 'Verificar alineación paralela de la bancada superior con reloj comparador', orden: 2, critico: true },
      { id: 'IT-MTO1-03', texto: 'Asegurar pares de apriete (45 Nm) en pernos de anclaje a estructura de hormigón', orden: 3, critico: true },
      { id: 'IT-MTO1-04', texto: 'Inspeccionar estado de sensores magnéticos de posición final de carrera en cilindros', orden: 4, critico: false }
    ]
  },
  {
    id: 'CHK-MTO-002',
    nombre: 'Inspección eléctrica de cuadros de potencia y termografía',
    categoria: 'mantenimiento',
    descripcion: 'Detección de puntos calientes en bornas y contactores de motores principales',
    aplicaA: { tipo: 'general' },
    frecuencia: 'segun_plan',
    activo: true,
    items: [
      { id: 'IT-MTO2-01', texto: 'Escaneo termográfico infrarrojo en contactores de potencia de bombas hidráulicas (< 60°C)', orden: 1, critico: true },
      { id: 'IT-MTO2-02', texto: 'Reapriete general con destornillador dinamométrico de bornas de potencia y tierra', orden: 2, critico: true },
      { id: 'IT-MTO2-03', texto: 'Comprobar funcionamiento del ventilador de extracción del cuadro eléctrico y limpiar filtro', orden: 3, critico: false }
    ]
  }
];
