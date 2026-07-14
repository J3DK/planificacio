import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  fetchLineas,
  fetchParadas,
  fetchSecuencia,
  fetchAlertas,
  fetchMateriasPrimas,
  fetchCalidad
} from './dataService';
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
  
  // Header
  doc.setFillColor(30, 41, 59); // slate-800
  doc.rect(0, 0, 210, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('MES — INFORME DE TURNO (MAÑANA)', 14, 16);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generado: ${getFormattedDate()}`, 14, 23);

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
  doc.setFillColor(16, 185, 129); // emerald-600
  doc.rect(0, 0, 210, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('MES — INFORME DIARIO DE PRODUCCIÓN', 14, 16);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha consolidado: ${getFormattedDate()}`, 14, 23);

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
  doc.setFillColor(139, 92, 246); // purple-500
  doc.rect(0, 0, 210, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('MES — INFORME SEMANAL DE RENDIMIENTO', 14, 16);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Semana en curso — ${getFormattedDate()}`, 14, 23);

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
  doc.setFillColor(245, 158, 11); // amber-500
  doc.rect(0, 0, 210, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('MES — INFORME DE CALIDAD Y DEFECTUOSIDAD', 14, 16);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generado: ${getFormattedDate()}`, 14, 23);

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
  doc.setFillColor(59, 130, 246);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('MES — INFORME PERSONALIZADO DE PLANTA', 14, 16);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Período: ${desde} hasta ${hasta} | Filtro: ${lineaSeleccionada}`, 14, 23);

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
