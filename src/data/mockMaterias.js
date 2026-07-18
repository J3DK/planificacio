// Mock data — Materias Primas
const createSvgDataUrl = (bg, accent, symbol, title) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <rect width="100" height="100" rx="20" fill="${bg}"/>
    <circle cx="50" cy="40" r="22" fill="${accent}" fill-opacity="0.2" stroke="${accent}" stroke-width="3"/>
    <text x="50" y="47" font-size="22" text-anchor="middle" fill="${accent}" font-family="sans-serif" font-weight="bold">${symbol}</text>
    <text x="50" y="82" font-size="10" text-anchor="middle" fill="#e2e8f0" font-family="sans-serif" font-weight="bold">${title}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const materiales = [
  { id: 1, codigo: 'CAB-6MM-001', codigoBarras: '8412345678901', movimientos: [], descripcion: 'Cable 6mm² negro (rollo 100m)', unidad: 'rollo', stockActual: 3,  stockMinimo: 10, stockMaximo: 50, pedidoPendiente: 20, fechaEntrega: '01/06/2024', criticidad: 'alta',   proveedor: 'ElectroCable S.L.', imagen: createSvgDataUrl('#0f172a', '#ef4444', '⚡', 'CABLE 6mm') },
  { id: 2, codigo: 'CEL-LFP-48V', codigoBarras: null, movimientos: [], descripcion: 'Celda LFP 48V 50Ah',          unidad: 'ud',    stockActual: 85, stockMinimo: 50, stockMaximo: 300,pedidoPendiente: 200,fechaEntrega: '03/06/2024', criticidad: 'media',  proveedor: 'BatteryPro GmbH',  imagen: createSvgDataUrl('#0f172a', '#3b82f6', '🔋', 'CELDA LFP') },
  { id: 3, codigo: 'CON-MC4-001', codigoBarras: null, movimientos: [], descripcion: 'Conector MC4 macho-hembra',    unidad: 'par',   stockActual: 420,stockMinimo: 200,stockMaximo: 1000,pedidoPendiente: 0,  fechaEntrega: null,         criticidad: 'baja',   proveedor: 'Stäubli España',   imagen: createSvgDataUrl('#0f172a', '#f59e0b', '🔌', 'CONECTOR MC4') },
  { id: 4, codigo: 'BMS-48V-100', codigoBarras: null, movimientos: [], descripcion: 'BMS 48V 100A con balanceo',    unidad: 'ud',    stockActual: 12, stockMinimo: 20, stockMaximo: 80, pedidoPendiente: 50, fechaEntrega: '02/06/2024', criticidad: 'alta',   proveedor: 'SmartBMS Ltd.',    imagen: createSvgDataUrl('#0f172a', '#10b981', '🎛️', 'BMS 48V') },
  { id: 5, codigo: 'CAJ-ALU-48V', codigoBarras: null, movimientos: [], descripcion: 'Caja aluminio 48V serie B',    unidad: 'ud',    stockActual: 67, stockMinimo: 40, stockMaximo: 150,pedidoPendiente: 0,  fechaEntrega: null,         criticidad: 'baja',   proveedor: 'MetalFab S.A.',    imagen: createSvgDataUrl('#0f172a', '#64748b', '📦', 'CAJA ALU') },
  { id: 6, codigo: 'TER-CAL-025', codigoBarras: null, movimientos: [], descripcion: 'Terminal calibre 25mm²',       unidad: 'caja',  stockActual: 8,  stockMinimo: 15, stockMaximo: 60, pedidoPendiente: 30, fechaEntrega: '04/06/2024', criticidad: 'media',  proveedor: 'Conector Plus',    imagen: createSvgDataUrl('#0f172a', '#eab308', '🔩', 'TERMINAL 25') },
  { id: 7, codigo: 'CAB-1MM-RJ',  codigoBarras: null, movimientos: [], descripcion: 'Cable señal 1mm² trenzado',    unidad: 'rollo', stockActual: 22, stockMinimo: 10, stockMaximo: 80, pedidoPendiente: 0,  fechaEntrega: null,         criticidad: 'baja',   proveedor: 'ElectroCable S.L.', imagen: createSvgDataUrl('#0f172a', '#a855f7', '〰️', 'CABLE SEÑAL') },
  { id: 8, codigo: 'ETI-LBL-A4',  codigoBarras: null, movimientos: [], descripcion: 'Etiquetas identificación A4',  unidad: 'caja',  stockActual: 2,  stockMinimo: 5,  stockMaximo: 20, pedidoPendiente: 10, fechaEntrega: '31/05/2024', criticidad: 'media',  proveedor: 'LabelMaster',      imagen: createSvgDataUrl('#0f172a', '#06b6d4', '🏷️', 'ETIQUETAS') },
];

export const consumoPorDia = [
  { dia: 'Lun', cables: 4.2, celdas: 52, bms: 12, conectores: 180 },
  { dia: 'Mar', cables: 4.5, celdas: 55, bms: 13, conectores: 190 },
  { dia: 'Mié', cables: 3.8, celdas: 48, bms: 11, conectores: 165 },
  { dia: 'Jue', cables: 4.1, celdas: 53, bms: 12, conectores: 178 },
  { dia: 'Vie', cables: 4.3, celdas: 50, bms: 12, conectores: 175 },
];
