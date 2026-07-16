const createSvgDataUrl = (bg, accent, symbol, title) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <rect width="100" height="100" rx="20" fill="${bg}"/>
    <circle cx="50" cy="40" r="22" fill="${accent}" fill-opacity="0.2" stroke="${accent}" stroke-width="3"/>
    <text x="50" y="47" font-size="22" text-anchor="middle" fill="${accent}" font-family="sans-serif" font-weight="bold">${symbol}</text>
    <text x="50" y="82" font-size="10" text-anchor="middle" fill="#e2e8f0" font-family="sans-serif" font-weight="bold">${title}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const mockProductos = [
  {
    id: 'P001',
    codigo: 'BAT-48V-100Ah',
    descripcion: 'Batería LFP 48V 100Ah — Estándar Industrial',
    cliente: 'Cliente A',
    familia: 'Baterías 48V',
    tiempoCiclo: 120,       // segundos por unidad
    objetivoHora: 30,       // unidades/hora
    peso: 28.5,             // kg
    activo: true,
    imagen: createSvgDataUrl('#0f172a', '#3b82f6', '⚡', 'BAT 48V 100A'),
    notas: 'Referencia principal de L1. Requiere utillaje #A12.',
    bomPendiente: false,
    bom: [
      { codigo: 'CEL-LFP-48V', descripcion: 'Celda LFP 48V 50Ah', factor: 0.16, unidad: 'ud', imagen: createSvgDataUrl('#0f172a', '#3b82f6', '🔋', 'CELDA LFP') },
      { codigo: 'BMS-48V-100', descripcion: 'BMS 48V 100A con balanceo', factor: 0.02, unidad: 'ud', imagen: createSvgDataUrl('#0f172a', '#10b981', '🎛️', 'BMS 48V') },
      { codigo: 'CAJ-ALU-48V', descripcion: 'Caja aluminio 48V serie B', factor: 0.10, unidad: 'ud', imagen: createSvgDataUrl('#0f172a', '#64748b', '📦', 'CAJA ALU') }
    ]
  },
  {
    id: 'P002',
    codigo: 'BAT-24V-200Ah',
    descripcion: 'Batería LFP 24V 200Ah — Heavy Duty',
    cliente: 'Cliente B',
    familia: 'Baterías 24V',
    tiempoCiclo: 145,
    objetivoHora: 25,
    peso: 42.0,
    activo: true,
    imagen: createSvgDataUrl('#0f172a', '#10b981', '⚡', 'BAT 24V 200A'),
    notas: 'Referencia L2. Conector tipo Deutsch DT04.',
    bomPendiente: false,
    bom: [
      { codigo: 'CEL-LFP-48V', descripcion: 'Celda LFP 48V 50Ah', factor: 0.15, unidad: 'ud', imagen: createSvgDataUrl('#0f172a', '#3b82f6', '🔋', 'CELDA LFP') },
      { codigo: 'CON-MC4-001', descripcion: 'Conector MC4 macho-hembra', factor: 0.25, unidad: 'par', imagen: createSvgDataUrl('#0f172a', '#f59e0b', '🔌', 'CONECTOR MC4') }
    ]
  },
  {
    id: 'P003',
    codigo: 'BAT-12V-100Ah',
    descripcion: 'Batería LFP 12V 100Ah — Compacta',
    cliente: 'Cliente C',
    familia: 'Baterías 12V',
    tiempoCiclo: 95,
    objetivoHora: 38,
    peso: 14.2,
    activo: true,
    imagen: createSvgDataUrl('#0f172a', '#f59e0b', '🔋', 'BAT 12V 100A'),
    notas: 'Alta rotación en L3. BMS integrado en carcasa superior.',
    bomPendiente: false,
    bom: [
      { codigo: 'CON-MC4-001', descripcion: 'Conector MC4 macho-hembra', factor: 0.20, unidad: 'par', imagen: createSvgDataUrl('#0f172a', '#f59e0b', '🔌', 'CONECTOR MC4') },
      { codigo: 'CAB-1MM-RJ', descripcion: 'Cable señal 1mm² trenzado', factor: 0.02, unidad: 'rollo', imagen: createSvgDataUrl('#0f172a', '#a855f7', '〰️', 'CABLE SEÑAL') }
    ]
  },
  {
    id: 'P004',
    codigo: 'BAT-48V-200Ah',
    descripcion: 'Batería LFP 48V 200Ah — Premium XL',
    cliente: 'Cliente D',
    familia: 'Baterías 48V',
    tiempoCiclo: 200,
    objetivoHora: 18,
    peso: 54.0,
    activo: true,
    imagen: createSvgDataUrl('#0f172a', '#a855f7', '⚡', 'BAT 48V 200A'),
    notas: 'Referencia especial L4. Requiere certificación CE+UL.',
    bomPendiente: false,
    bom: [
      { codigo: 'CEL-LFP-48V', descripcion: 'Celda LFP 48V 50Ah', factor: 0.16, unidad: 'ud', imagen: createSvgDataUrl('#0f172a', '#3b82f6', '🔋', 'CELDA LFP') },
      { codigo: 'BMS-48V-100', descripcion: 'BMS 48V 100A con balanceo', factor: 0.04, unidad: 'ud', imagen: createSvgDataUrl('#0f172a', '#10b981', '🎛️', 'BMS 48V') },
      { codigo: 'CAJ-ALU-48V', descripcion: 'Caja aluminio 48V serie B', factor: 0.10, unidad: 'ud', imagen: createSvgDataUrl('#0f172a', '#64748b', '📦', 'CAJA ALU') }
    ]
  },
  {
    id: 'P005',
    codigo: 'BAT-24V-100Ah',
    descripcion: 'Batería LFP 24V 100Ah — Estándar',
    cliente: 'Cliente E',
    familia: 'Baterías 24V',
    tiempoCiclo: 110,
    objetivoHora: 33,
    peso: 22.0,
    activo: true,
    imagen: createSvgDataUrl('#0f172a', '#eab308', '🔋', 'BAT 24V 100A'),
    notas: 'Referencia estándar L5.',
    bomPendiente: false,
    bom: [
      { codigo: 'CON-MC4-001', descripcion: 'Conector MC4 macho-hembra', factor: 0.30, unidad: 'par', imagen: createSvgDataUrl('#0f172a', '#f59e0b', '🔌', 'CONECTOR MC4') },
      { codigo: 'ETI-LBL-A4', descripcion: 'Etiquetas identificación A4', factor: 0.005, unidad: 'caja', imagen: createSvgDataUrl('#0f172a', '#06b6d4', '🏷️', 'ETIQUETAS') }
    ]
  },
  {
    id: 'P006',
    codigo: 'BAT-72V-50Ah',
    descripcion: 'Batería LFP 72V 50Ah — Alta Tensión',
    cliente: 'Cliente F',
    familia: 'Baterías 72V',
    tiempoCiclo: 180,
    objetivoHora: 20,
    peso: 38.0,
    activo: false,
    imagen: createSvgDataUrl('#0f172a', '#ef4444', '⚡', 'BAT 72V 50A'),
    notas: 'Producto discontinuado. No producir hasta nuevo aviso.',
    bomPendiente: false,
    bom: [
      { codigo: 'CAB-6MM-001', descripcion: 'Cable 6mm² negro (rollo 100m)', factor: 0.01, unidad: 'rollo', imagen: createSvgDataUrl('#0f172a', '#ef4444', '⚡', 'CABLE 6mm') },
      { codigo: 'CON-MC4-001', descripcion: 'Conector MC4 macho-hembra', factor: 0.20, unidad: 'par', imagen: createSvgDataUrl('#0f172a', '#f59e0b', '🔌', 'CONECTOR MC4') }
    ]
  },
  {
    id: 'P007',
    codigo: 'MOD-LFP-100',
    descripcion: 'Módulo LFP 3.2V 100Ah — Celda Individual',
    cliente: 'Cliente G',
    familia: 'Módulos',
    tiempoCiclo: 60,
    objetivoHora: 60,
    peso: 2.8,
    activo: true,
    imagen: createSvgDataUrl('#0f172a', '#06b6d4', '🔲', 'MÓDULO LFP'),
    notas: 'Componente semielaborado para ensamblaje interno. BOM por definir.',
    bomPendiente: true,
    bom: []
  },
];
