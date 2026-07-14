// Mock data — Materias Primas
export const materiales = [
  { id: 1, codigo: 'CAB-6MM-001', descripcion: 'Cable 6mm² negro (rollo 100m)', unidad: 'rollo', stockActual: 3,  stockMinimo: 10, stockMaximo: 50, pedidoPendiente: 20, fechaEntrega: '01/06/2024', criticidad: 'alta',   proveedor: 'ElectroCable S.L.' },
  { id: 2, codigo: 'CEL-LFP-48V', descripcion: 'Celda LFP 48V 50Ah',          unidad: 'ud',    stockActual: 85, stockMinimo: 50, stockMaximo: 300,pedidoPendiente: 200,fechaEntrega: '03/06/2024', criticidad: 'media',  proveedor: 'BatteryPro GmbH' },
  { id: 3, codigo: 'CON-MC4-001', descripcion: 'Conector MC4 macho-hembra',    unidad: 'par',   stockActual: 420,stockMinimo: 200,stockMaximo: 1000,pedidoPendiente: 0,  fechaEntrega: null,         criticidad: 'baja',   proveedor: 'Stäubli España' },
  { id: 4, codigo: 'BMS-48V-100', descripcion: 'BMS 48V 100A con balanceo',    unidad: 'ud',    stockActual: 12, stockMinimo: 20, stockMaximo: 80, pedidoPendiente: 50, fechaEntrega: '02/06/2024', criticidad: 'alta',   proveedor: 'SmartBMS Ltd.' },
  { id: 5, codigo: 'CAJ-ALU-48V', descripcion: 'Caja aluminio 48V serie B',    unidad: 'ud',    stockActual: 67, stockMinimo: 40, stockMaximo: 150,pedidoPendiente: 0,  fechaEntrega: null,         criticidad: 'baja',   proveedor: 'MetalFab S.A.' },
  { id: 6, codigo: 'TER-CAL-025', descripcion: 'Terminal calibre 25mm²',       unidad: 'caja',  stockActual: 8,  stockMinimo: 15, stockMaximo: 60, pedidoPendiente: 30, fechaEntrega: '04/06/2024', criticidad: 'media',  proveedor: 'Conector Plus' },
  { id: 7, codigo: 'CAB-1MM-RJ',  descripcion: 'Cable señal 1mm² trenzado',    unidad: 'rollo', stockActual: 22, stockMinimo: 10, stockMaximo: 80, pedidoPendiente: 0,  fechaEntrega: null,         criticidad: 'baja',   proveedor: 'ElectroCable S.L.' },
  { id: 8, codigo: 'ETI-LBL-A4',  descripcion: 'Etiquetas identificación A4',  unidad: 'caja',  stockActual: 2,  stockMinimo: 5,  stockMaximo: 20, pedidoPendiente: 10, fechaEntrega: '31/05/2024', criticidad: 'media',  proveedor: 'LabelMaster' },
];

export const consumoPorDia = [
  { dia: 'Lun', cables: 4.2, celdas: 52, bms: 12, conectores: 180 },
  { dia: 'Mar', cables: 4.5, celdas: 55, bms: 13, conectores: 190 },
  { dia: 'Mié', cables: 3.8, celdas: 48, bms: 11, conectores: 165 },
  { dia: 'Jue', cables: 4.1, celdas: 53, bms: 12, conectores: 178 },
  { dia: 'Vie', cables: 4.3, celdas: 50, bms: 12, conectores: 175 },
];
