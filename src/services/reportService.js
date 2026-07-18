import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  fetchLineas,
  fetchParadas,
  fetchSecuencia,
  fetchAlertas,
  fetchMateriasPrimas,
  fetchCalidad,
  getCurrentShiftInfo
} from './dataService';
import { getAppConfig } from './configService';
import { paradasPorTipo } from '@/data/mockParadas';
import { produccionHistorica } from '@/data/mockProduccion';

// Helper para obtener fecha actual formateada
const getFormattedDate = () => {
  return new Date().toLocaleString('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
};

const getFileDate = () => {
  const now = new Date();
  return `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}_${now.getHours().toString().padStart(2,'0')}${now.getMinutes().toString().padStart(2,'0')}`;
};

export const renderPdfHeaderAndFooter = (doc, title) => {
  const config = getAppConfig();
  
  // Header background
  doc.setFillColor(30, 41, 59); // slate-800
  doc.rect(0, 0, 210, 32, 'F');
  
  // Si hay logo subido en Base64, lo incrustamos
  let textStartX = 14;
  if (config.logoUrl && config.logoUrl.startsWith('data:image/')) {
    try {
      doc.addImage(config.logoUrl, 'PNG', 14, 5, 22, 22);
      textStartX = 40;
    } catch (e) {
      console.warn('Error al insertar logo en PDF:', e);
    }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`${config.nombreEmpresa || 'MPS MES'} — ${title.toUpperCase()}`, textStartX, 15);
  
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text(`${config.razonSocial || 'Smart MES Industrial S.L.'} · Generado: ${getFormattedDate()}`, textStartX, 24);

  // Footer
  const pageHeight = doc.internal.pageSize.height || 297;
  doc.setFontSize(7.5);
  doc.setTextColor(140, 140, 140);
  doc.text(config.pieReportes || 'Documento oficial generado por el Sistema MES de Producción & Calidad.', 14, pageHeight - 8);
};

// ==========================================
// 1. INFORME DE TURNO
// ==========================================
export const generarInformeTurno = async (format = 'PDF') => {
  const { data: lineas = [] } = await fetchLineas();
  const { data: paradas = [] } = await fetchParadas();
  const { data: secuencia = [] } = await fetchSecuencia();

  const fileName = `Informe_Turno_Manana_${getFileDate()}`;

  if (format === 'XLS') {
    const wb = XLSX.utils.book_new();

    // Hoja 1: Líneas
    const lineasData = lineas.map(l => ({
      'Línea': l.nombre,
      'Descripción': l.descripcion,
      'Estado': l.estado,
      'OEE (%)': l.oee,
      'Disponibilidad (%)': l.disponibilidad,
      'Rendimiento (%)': l.rendimiento,
      'Calidad (%)': l.calidad,
      'Producción Hoy': l.produccionHoy || l.produccion_hoy,
      'Objetivo Hoy': l.objetivoHoy || l.objetivo_hoy,
      'Velocidad Actual': l.velocidadActual || l.velocidad_actual,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(lineasData), 'Resumen Líneas');

    // Hoja 2: Paradas
    const paradasData = paradas.map(p => ({
      'Línea': p.linea,
      'Inicio': p.inicio,
      'Fin': p.fin || 'En curso',
      'Duración (min)': p.duracion,
      'Tipo': p.tipo,
      'Causa': p.causa,
      'Impacto (uds)': p.impacto,
      'Estado': p.estado
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(paradasData), 'Paradas Turno');

    // Hoja 3: Secuencia
    const seqData = secuencia.map(s => ({
      'Secuencia': s.secuencia,
      'Referencia': s.referencia,
      'Cliente': s.cliente,
      'Compromiso': s.fechaCompromiso || s.fecha_compromiso,
      'Progreso (%)': s.progreso,
      'Cumplimiento (%)': s.cumplimiento,
      'Desvío': s.desvio,
      'Estado': s.estado
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(seqData), 'Secuencia Fabricación');

    XLSX.writeFile(wb, `${fileName}.xlsx`);
    return { name: fileName + '.xlsx', type: 'Turno', size: '184 KB', format: 'Excel' };
  }

  // Generar PDF
  const doc = new jsPDF();
  renderPdfHeaderAndFooter(doc, `INFORME DE TURNO (${getCurrentShiftInfo().shift.toUpperCase()})`);

  // Resumen KPIs
  const oeeAvg = lineas.length ? (lineas.reduce((acc, l) => acc + Number(l.oee || 0), 0) / lineas.length).toFixed(1) : '0';
  const prodTotal = lineas.reduce((acc, l) => acc + Number(l.produccionHoy || l.produccion_hoy || 0), 0);
  const paradasAbiertas = paradas.filter(p => p.estado === 'abierta').length;

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Resumen Ejecutivo del Turno', 14, 40);

  autoTable(doc, {
    startY: 44,
    head: [['OEE Medio Planta', 'Producción Total Turno', 'Paradas Abiertas', 'Líneas Activas']],
    body: [[`${oeeAvg}%`, `${prodTotal} uds`, `${paradasAbiertas}`, `${lineas.filter(l => l.estado === 'en_marcha').length} / ${lineas.length}`]],
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
    styles: { halign: 'center', fontSize: 10 }
  });

  // Tabla Líneas
  let nextY = doc.lastAutoTable.finalY + 12;
  doc.text('2. Estado y Métricas por Línea', 14, nextY);
  
  autoTable(doc, {
    startY: nextY + 4,
    head: [['Línea', 'Estado', 'OEE (%)', 'Prod. Hoy', 'Objetivo', 'Calidad (%)']],
    body: lineas.map(l => [
      l.nombre,
      l.estado ? l.estado.toUpperCase() : '-',
      `${l.oee}%`,
      `${l.produccionHoy || l.produccion_hoy || 0} uds`,
      `${l.objetivoHoy || l.objetivo_hoy || 0} uds`,
      `${l.calidad}%`
    ]),
    theme: 'striped',
    headStyles: { fillColor: [30, 41, 59] },
    styles: { fontSize: 8.5 }
  });

  // Tabla Paradas
  nextY = doc.lastAutoTable.finalY + 12;
  if (nextY > 230) { doc.addPage(); nextY = 20; }
  doc.text('3. Registro de Paradas e Incidencias', 14, nextY);

  autoTable(doc, {
    startY: nextY + 4,
    head: [['Línea', 'Inicio', 'Fin', 'Dur. (min)', 'Tipo', 'Causa', 'Estado']],
    body: paradas.map(p => [
      p.linea,
      p.inicio,
      p.fin || 'En curso',
      `${p.duracion}`,
      p.tipo.toUpperCase(),
      p.causa,
      p.estado.toUpperCase()
    ]),
    theme: 'striped',
    headStyles: { fillColor: [239, 68, 68] }, // Red header for paradas
    styles: { fontSize: 8 }
  });

  // Footer en todas las páginas
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Página ${i} de ${pageCount} — Sistema MES Avanzado — Confidencial`, 14, 287);
  }

  doc.save(`${fileName}.pdf`);
  return { name: fileName + '.pdf', type: 'Turno', size: '215 KB', format: 'PDF' };
};

// ==========================================
// 2. INFORME DIARIO
// ==========================================
export const generarInformeDiario = async (format = 'PDF') => {
  const { data: lineas = [] } = await fetchLineas();
  const { data: materias = [] } = await fetchMateriasPrimas();
  const { data: alertas = [] } = await fetchAlertas();

  const fileName = `Informe_Diario_${getFileDate()}`;

  if (format === 'XLS') {
    const wb = XLSX.utils.book_new();

    const prodData = lineas.map(l => ({
      'Línea': l.nombre,
      'Turno': l.turno || 'Mañana',
      'OEE (%)': l.oee,
      'Disponibilidad (%)': l.disponibilidad,
      'Rendimiento (%)': l.rendimiento,
      'Calidad (%)': l.calidad,
      'Producción Real': l.produccionHoy || l.produccion_hoy,
      'Objetivo': l.objetivoHoy || l.objetivo_hoy
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(prodData), 'Producción por Línea');

    const invData = materias.map(m => ({
      'Código': m.codigo,
      'Descripción': m.descripcion,
      'Unidad': m.unidad,
      'Stock Actual': m.stockActual || m.stock_actual,
      'Stock Mínimo': m.stockMinimo || m.stock_minimo,
      'Criticidad': m.criticidad,
      'Proveedor': m.proveedor
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(invData), 'Inventario');

    const alertData = alertas.map(a => ({
      'Tipo': a.tipo,
      'Módulo': a.modulo,
      'Línea': a.linea || 'General',
      'Título': a.titulo,
      'Fecha': new Date(a.timestamp || Date.now()).toLocaleString('es-ES')
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(alertData), 'Alertas del Día');

    XLSX.writeFile(wb, `${fileName}.xlsx`);
    return { name: fileName + '.xlsx', type: 'Diario', size: '290 KB', format: 'Excel' };
  }

  const doc = new jsPDF();
  renderPdfHeaderAndFooter(doc, 'INFORME DIARIO DE PRODUCCIÓN');

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Consolidado General de Planta', 14, 40);

  const prodTotal = lineas.reduce((acc, l) => acc + Number(l.produccionHoy || l.produccion_hoy || 0), 0);
  const objTotal = lineas.reduce((acc, l) => acc + Number(l.objetivoHoy || l.objetivo_hoy || 0), 0);
  const oeeAvg = lineas.length ? (lineas.reduce((acc, l) => acc + Number(l.oee || 0), 0) / lineas.length).toFixed(1) : '0';

  autoTable(doc, {
    startY: 44,
    head: [['OEE Promedio', 'Producción Total', 'Objetivo Total', 'Cumplimiento (%)']],
    body: [[`${oeeAvg}%`, `${prodTotal} uds`, `${objTotal} uds`, `${objTotal ? ((prodTotal/objTotal)*100).toFixed(1) : 100}%`]],
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129] },
    styles: { halign: 'center', fontSize: 10 }
  });

  let nextY = doc.lastAutoTable.finalY + 12;
  doc.text('2. Desglose Detallado por Línea de Producción', 14, nextY);

  autoTable(doc, {
    startY: nextY + 4,
    head: [['Línea', 'OEE (%)', 'Disponibilidad', 'Rendimiento', 'Calidad', 'Prod vs Obj']],
    body: lineas.map(l => [
      l.nombre,
      `${l.oee}%`,
      `${l.disponibilidad}%`,
      `${l.rendimiento}%`,
      `${l.calidad}%`,
      `${l.produccionHoy || l.produccion_hoy} / ${l.objetivoHoy || l.objetivo_hoy}`
    ]),
    theme: 'striped',
    headStyles: { fillColor: [30, 41, 59] },
    styles: { fontSize: 8.5 }
  });

  nextY = doc.lastAutoTable.finalY + 12;
  if (nextY > 230) { doc.addPage(); nextY = 20; }
  doc.text('3. Materias Primas — Stock Crítico o Bajo', 14, nextY);

  const lowStock = materias.filter(m => (m.stockActual || m.stock_actual) < (m.stockMinimo || m.stock_minimo) * 1.5);

  autoTable(doc, {
    startY: nextY + 4,
    head: [['Código', 'Descripción', 'Stock Actual', 'Mínimo', 'Criticidad', 'Proveedor']],
    body: lowStock.map(m => [
      m.codigo,
      m.descripcion,
      `${m.stockActual || m.stock_actual} ${m.unidad}`,
      `${m.stockMinimo || m.stock_minimo} ${m.unidad}`,
      m.criticidad.toUpperCase(),
      m.proveedor || '-'
    ]),
    theme: 'striped',
    headStyles: { fillColor: [245, 158, 11] },
    styles: { fontSize: 8 }
  });

  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Página ${i} de ${pageCount} — Sistema MES Avanzado — Confidencial`, 14, 287);
  }

  doc.save(`${fileName}.pdf`);
  return { name: fileName + '.pdf', type: 'Diario', size: '240 KB', format: 'PDF' };
};

// ==========================================
// 3. INFORME SEMANAL
// ==========================================
export const generarInformeSemanal = async (format = 'PDF') => {
  const fileName = `Informe_Semanal_${getFileDate()}`;

  if (format === 'XLS') {
    const wb = XLSX.utils.book_new();

    const diariData = produccionHistorica.map(p => ({
      'Día': p.dia,
      'Planificado (uds)': p.plan,
      'Real (uds)': p.real,
      'Desvío (uds)': p.real - p.plan,
      'Eficiencia (%)': ((p.real / p.plan) * 100).toFixed(1)
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(diariData), 'Producción Semanal');

    const parData = paradasPorTipo.map(p => ({
      'Tipo de Parada': p.tipo,
      'Minutos Totales': p.minutos,
      '% Tiempo Parado': p.pct
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(parData), 'Paradas por Tipo');

    XLSX.writeFile(wb, `${fileName}.xlsx`);
    return { name: fileName + '.xlsx', type: 'Semanal', size: '310 KB', format: 'Excel' };
  }

  const doc = new jsPDF();
  renderPdfHeaderAndFooter(doc, 'INFORME SEMANAL DE RENDIMIENTO');

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Evolución Diaria de Producción (Plan vs Real)', 14, 40);

  autoTable(doc, {
    startY: 44,
    head: [['Día de la Semana', 'Producción Planificada', 'Producción Real', 'Desvío (uds)', 'Cumplimiento (%)']],
    body: produccionHistorica.map(p => [
      p.dia,
      `${p.plan} uds`,
      `${p.real} uds`,
      `${p.real - p.plan >= 0 ? '+' : ''}${p.real - p.plan} uds`,
      `${((p.real / p.plan) * 100).toFixed(1)}%`
    ]),
    theme: 'striped',
    headStyles: { fillColor: [139, 92, 246] },
    styles: { fontSize: 9, halign: 'center' }
  });

  let nextY = doc.lastAutoTable.finalY + 12;
  doc.text('2. Distribución de Tiempos de Parada por Tipo', 14, nextY);

  autoTable(doc, {
    startY: nextY + 4,
    head: [['Tipo de Parada', 'Tiempo Acumulado (min)', '% sobre Tiempo Parado']],
    body: paradasPorTipo.map(p => [
      p.tipo.toUpperCase(),
      `${p.minutos} min`,
      `${p.pct}%`
    ]),
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59] },
    styles: { fontSize: 9 }
  });

  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Página ${i} de ${pageCount} — Sistema MES Avanzado — Confidencial`, 14, 287);
  }

  doc.save(`${fileName}.pdf`);
  return { name: fileName + '.pdf', type: 'Semanal', size: '280 KB', format: 'PDF' };
};

// ==========================================
// 4. INFORME DE CALIDAD
// ==========================================
export const generarInformeCalidad = async (format = 'PDF') => {
  const { data: calidad = [] } = await fetchCalidad();
  const { data: alertas = [] } = await fetchAlertas();

  const fileName = `Informe_Calidad_${getFileDate()}`;

  if (format === 'XLS') {
    const wb = XLSX.utils.book_new();

    const defData = calidad.map(c => ({
      'Causa del Defecto': c.causa,
      'Cantidad (uds)': c.cantidad,
      '% del Total Scrap': c.pct
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(defData), 'Defectos y Causas');

    const alertCal = alertas.filter(a => a.modulo === 'calidad' || a.tipo === 'critica').map(a => ({
      'Tipo': a.tipo,
      'Título': a.titulo,
      'Descripción': a.descripcion,
      'Línea': a.linea,
      'Fecha': new Date(a.timestamp).toLocaleString('es-ES')
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(alertCal), 'Alertas de Calidad');

    XLSX.writeFile(wb, `${fileName}.xlsx`);
    return { name: fileName + '.xlsx', type: 'Calidad', size: '195 KB', format: 'Excel' };
  }

  const doc = new jsPDF();
  renderPdfHeaderAndFooter(doc, 'INFORME DE CALIDAD Y DEFECTUOSIDAD');

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Indicadores Globales de Calidad (FPY / Scrap)', 14, 40);

  autoTable(doc, {
    startY: 44,
    head: [['First Pass Yield (FPY)', 'Tasa de Scrap', 'Total Piezas Rechazadas', 'Objetivo FPY']],
    body: [['96.4%', '3.6%', `${calidad.reduce((s, c) => s + Number(c.cantidad || 0), 0)} uds`, '≥ 98.0%']],
    theme: 'grid',
    headStyles: { fillColor: [245, 158, 11] },
    styles: { halign: 'center', fontSize: 10 }
  });

  let nextY = doc.lastAutoTable.finalY + 12;
  doc.text('2. Pareto de Defectos por Causa Raíz', 14, nextY);

  autoTable(doc, {
    startY: nextY + 4,
    head: [['Causa del Defecto', 'Piezas Defectuosas (uds)', '% sobre Total Scrap']],
    body: calidad.map(c => [
      c.causa,
      `${c.cantidad} uds`,
      `${c.pct}%`
    ]),
    theme: 'striped',
    headStyles: { fillColor: [30, 41, 59] },
    styles: { fontSize: 9 }
  });

  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Página ${i} de ${pageCount} — Sistema MES Avanzado — Confidencial`, 14, 287);
  }

  doc.save(`${fileName}.pdf`);
  return { name: fileName + '.pdf', type: 'Calidad', size: '210 KB', format: 'PDF' };
};

// ==========================================
// 5. INFORME PERSONALIZADO (Por Rango / Línea)
// ==========================================
export const generarInformePersonalizado = async (desde, hasta, lineaSeleccionada, format = 'PDF') => {
  const { data: lineas = [] } = await fetchLineas();
  const lineasFiltradas = lineaSeleccionada && lineaSeleccionada !== 'Todas las líneas'
    ? lineas.filter(l => l.nombre === lineaSeleccionada)
    : lineas;

  const fileName = `Informe_Personalizado_${getFileDate()}`;

  if (format === 'XLS') {
    const wb = XLSX.utils.book_new();
    const data = lineasFiltradas.map(l => ({
      'Línea': l.nombre,
      'Período Desde': desde,
      'Período Hasta': hasta,
      'OEE (%)': l.oee,
      'Disponibilidad (%)': l.disponibilidad,
      'Rendimiento (%)': l.rendimiento,
      'Calidad (%)': l.calidad,
      'Producción Real': l.produccionHoy || l.produccion_hoy,
      'Objetivo': l.objetivoHoy || l.objetivo_hoy
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), 'Informe Custom');
    XLSX.writeFile(wb, `${fileName}.xlsx`);
    return { name: fileName + '.xlsx', type: 'Personalizado', size: '200 KB', format: 'Excel' };
  }

  const doc = new jsPDF();
  renderPdfHeaderAndFooter(doc, `INFORME PERSONALIZADO (${desde} - ${hasta})`);

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Métricas Consolidadas del Período Seleccionado', 14, 40);

  autoTable(doc, {
    startY: 44,
    head: [['Línea', 'OEE (%)', 'Disponibilidad', 'Rendimiento', 'Calidad', 'Producción Hoy']],
    body: lineasFiltradas.map(l => [
      l.nombre,
      `${l.oee}%`,
      `${l.disponibilidad}%`,
      `${l.rendimiento}%`,
      `${l.calidad}%`,
      `${l.produccionHoy || l.produccion_hoy || 0} uds`
    ]),
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 9 }
  });

  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Página ${i} de ${pageCount} — Sistema MES Avanzado — Confidencial`, 14, 287);
  }

  doc.save(`${fileName}.pdf`);
  return { name: fileName + '.pdf', type: 'Personalizado', size: '220 KB', format: 'PDF' };
};


export function generarInformeOT(ot) {
  try {
    const doc = new jsPDF();
    renderPdfHeaderAndFooter(doc, `INFORME DE ORDEN DE TRABAJO (${ot.codigo || 'OT'})`);

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('1. Datos de la Intervención', 14, 40);

    autoTable(doc, {
      startY: 44,
      head: [['Título', 'Tipo', 'Prioridad', 'Estado']],
      body: [[
        ot.titulo || '-',
        ot.tipo ? ot.tipo.toUpperCase() : '-',
        ot.prioridad ? ot.prioridad.toUpperCase() : '-',
        ot.estado ? ot.estado.toUpperCase() : '-'
      ]],
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 10, halign: 'center' }
    });

    let nextY = doc.lastAutoTable.finalY + 8;

    autoTable(doc, {
      startY: nextY,
      head: [['Activo / Equipo Afectado', 'Línea', 'Técnico Asignado', 'Turno']],
      body: [[
        ot.activoNombre || '-',
        ot.linea || '-',
        ot.tecnico || '-',
        ot.turno || '-'
      ]],
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 10, halign: 'center' }
    });

    nextY = doc.lastAutoTable.finalY + 8;

    autoTable(doc, {
      startY: nextY,
      head: [['Fecha Apertura', 'Fecha Cierre', 'Tiempo Estimado', 'Tiempo Real']],
      body: [[
        ot.fechaApertura ? new Date(ot.fechaApertura).toLocaleString() : '-',
        ot.fechaCierre ? new Date(ot.fechaCierre).toLocaleString() : '-',
        (ot.tiempoEst || 0) + ' min',
        (ot.tiempoReal || 0) + ' min'
      ]],
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 10, halign: 'center' }
    });

    nextY = doc.lastAutoTable.finalY + 12;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('2. Causa Raíz y Repuestos Utilizados', 14, nextY);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Causa Raíz Identificada: ${ot.causaRaiz || 'No especificada'}`, 14, nextY + 6);

    const repuestos = Array.isArray(ot.repuestos) ? ot.repuestos : [];
    if (repuestos.length > 0) {
      autoTable(doc, {
        startY: nextY + 10,
        head: [['Código', 'Nombre', 'Cantidad', 'Coste Unit.', 'Coste Total']],
        body: repuestos.map(r => [
          r.codigo,
          r.nombre,
          `${r.cantidad || 1} uds`,
          `${r.costeUnitario || 0} €`,
          `${(r.cantidad || 1) * (r.costeUnitario || 0)} €`
        ]),
        foot: [['', '', '', 'Total Repuestos:', `${ot.costeTotal || 0} €`]],
        theme: 'striped',
        headStyles: { fillColor: [139, 92, 246] },
        footStyles: { fillColor: [241, 245, 249], textColor: [30, 41, 59], fontStyle: 'bold' },
        styles: { fontSize: 9 }
      });
      nextY = doc.lastAutoTable.finalY + 12;
    } else {
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 116, 139);
      doc.text('No se han registrado repuestos para esta intervención.', 14, nextY + 12);
      nextY += 20;
      doc.setTextColor(30, 41, 59);
    }

    const bitacora = Array.isArray(ot.bitacora) ? ot.bitacora : [];
    if (bitacora.length > 0) {
      if (nextY > 250) {
        doc.addPage();
        renderPdfHeaderAndFooter(doc, `INFORME DE ORDEN DE TRABAJO (${ot.codigo || 'OT'})`);
        nextY = 40;
      }
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('3. Bitácora de Intervención (Histórico cronológico)', 14, nextY);
      
      const bitacoraRows = [...bitacora].reverse().map(b => [
        new Date(b.fecha).toLocaleString(),
        b.autor || 'Sistema',
        b.texto || ''
      ]);

      autoTable(doc, {
        startY: nextY + 4,
        head: [['Fecha/Hora', 'Autor', 'Anotación']],
        body: bitacoraRows,
        theme: 'plain',
        headStyles: { fillColor: [226, 232, 240], textColor: [15, 23, 42] },
        styles: { fontSize: 9, cellPadding: 3, overflow: 'linebreak' },
        columnStyles: { 0: { cellWidth: 35 }, 1: { cellWidth: 30 }, 2: { cellWidth: 'auto' } }
      });
      nextY = doc.lastAutoTable.finalY + 12;
    }

    const fotos = Array.isArray(ot.fotos) ? ot.fotos : [];
    if (fotos.length > 0) {
      if (nextY > 200) {
        doc.addPage();
        renderPdfHeaderAndFooter(doc, `INFORME DE ORDEN DE TRABAJO (${ot.codigo || 'OT'})`);
        nextY = 40;
      }
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('4. Evidencias Visuales (Fotografías)', 14, nextY);
      
      let curX = 14;
      let curY = nextY + 6;
      const imgWidth = 85;
      const imgHeight = 85;

      fotos.forEach((foto, i) => {
        if (i > 0 && i % 2 === 0) {
          curX = 14;
          curY += imgHeight + 15;
          if (curY > 220) {
            doc.addPage();
            renderPdfHeaderAndFooter(doc, `INFORME DE ORDEN DE TRABAJO (${ot.codigo || 'OT'})`);
            curY = 40;
          }
        }
        try {
          doc.addImage(foto.dataUrl, 'JPEG', curX, curY, imgWidth, imgHeight);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.text(`${foto.etiqueta || 'Evidencia'} - ${new Date(foto.fecha).toLocaleString()}`, curX, curY + imgHeight + 5);
        } catch (err) {
          console.warn('No se pudo añadir imagen al PDF', err);
        }
        curX += imgWidth + 10;
      });
    }

    doc.save(`Informe_OT_${ot.codigo || Date.now()}.pdf`);
    return { name: `Informe_OT_${ot.codigo || Date.now()}.pdf`, type: 'OT', format: 'PDF' };
  } catch (error) {
    console.error('Error generando PDF de OT:', error);
    alert('Error al generar el informe PDF. Revisa la consola.');
    return null;
  }
}
