import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FileBarChart, Download, FileText, BarChart2, Calendar, Clock, CheckCircle2, Check, RefreshCw, Settings, Building2 } from 'lucide-react';
import {
  generarInformeTurno,
  generarInformeDiario,
  generarInformeSemanal,
  generarInformeCalidad,
  generarInformePersonalizado
} from '@/services/reportService';
import { useAppConfig } from '@/services/configService';

const informesTipo = [
  {
    id: 'turno',
    icono: Clock,
    titulo: 'Informe de Turno',
    descripcion: 'Resumen completo del turno: producción, calidad, paradas y secuencia.',
    color: 'blue',
    generados: 3,
    ultimo: '31/05/2024 14:00',
  },
  {
    id: 'diario',
    icono: Calendar,
    titulo: 'Informe Diario',
    descripcion: 'Consolidado del día con todos los KPIs, stock de materiales y comparativa vs plan.',
    color: 'emerald',
    generados: 1,
    ultimo: '30/05/2024',
  },
  {
    id: 'semanal',
    icono: BarChart2,
    titulo: 'Informe Semanal',
    descripcion: 'Análisis de tendencias semanal y eficiencia OEE por cada línea.',
    color: 'purple',
    generados: 1,
    ultimo: '27/05/2024',
  },
  {
    id: 'calidad',
    icono: CheckCircle2,
    titulo: 'Informe de Calidad',
    descripcion: 'FPY, Scrap, retrabajos, pareto de defectos y causas detalladas.',
    color: 'amber',
    generados: 5,
    ultimo: '31/05/2024 11:00',
  },
];

const historialInicial = [
  { id: 1, nombre: 'Informe Turno Mañana — 31/05/2024', tipo: 'Turno', fecha: '31/05/2024 14:00', size: '215 KB', formato: 'PDF', generador: 'turno' },
  { id: 2, nombre: 'Informe Turno Tarde — 30/05/2024',  tipo: 'Turno', fecha: '30/05/2024 22:00', size: '184 KB', formato: 'Excel', generador: 'turno' },
  { id: 3, nombre: 'Informe Diario — 30/05/2024',       tipo: 'Diario', fecha: '30/05/2024 23:59', size: '290 KB', formato: 'Excel', generador: 'diario' },
  { id: 4, nombre: 'Informe Calidad S22',               tipo: 'Calidad', fecha: '29/05/2024 09:00', size: '210 KB', formato: 'PDF', generador: 'calidad' },
  { id: 5, nombre: 'Informe Semanal S21',               tipo: 'Semanal', fecha: '26/05/2024 08:00', size: '310 KB', formato: 'Excel', generador: 'semanal' },
];

const colorMap = {
  blue:   'border-blue-500/30 bg-blue-500/10 text-blue-400',
  emerald:'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  purple: 'border-purple-500/30 bg-purple-500/10 text-purple-400',
  amber:  'border-amber-500/30 bg-amber-500/10 text-amber-400',
};

export default function Informes() {
  const appConfig = useAppConfig();
  const [generando, setGenerando] = useState(null); // inf.id + '-PDF' | '-XLS'
  const [historial, setHistorial] = useState(historialInicial);
  const [descargandoId, setDescargandoId] = useState(null);

  // Estados para filtro personalizado
  const [desde, setDesde] = useState(new Date().toISOString().split('T')[0]);
  const [hasta, setHasta] = useState(new Date().toISOString().split('T')[0]);
  const [lineaSel, setLineaSel] = useState('Todas las líneas');
  const [generandoCustom, setGenerandoCustom] = useState(null); // 'PDF' | 'XLS'

  const handleGenerar = async (id, formato) => {
    const key = `${id}-${formato}`;
    setGenerando(key);

    try {
      let resultado;
      if (id === 'turno') resultado = await generarInformeTurno(formato);
      else if (id === 'diario') resultado = await generarInformeDiario(formato);
      else if (id === 'semanal') resultado = await generarInformeSemanal(formato);
      else if (id === 'calidad') resultado = await generarInformeCalidad(formato);

      if (resultado) {
        setHistorial(prev => [
          {
            id: Date.now(),
            nombre: resultado.name,
            tipo: resultTipoLabel(id),
            fecha: new Date().toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }),
            size: resultado.size,
            formato: formato === 'XLS' ? 'Excel' : 'PDF',
            generador: id
          },
          ...prev
        ]);
      }
    } catch (err) {
      console.error('Error al generar informe:', err);
      alert('Hubo un error al generar el archivo. Por favor verifica la consola.');
    } finally {
      setGenerando(null);
    }
  };

  const handleGenerarCustom = async (formato) => {
    setGenerandoCustom(formato);
    try {
      const result = await generarInformePersonalizado(desde, hasta, lineaSel, formato);
      if (result) {
        setHistorial(prev => [
          {
            id: Date.now(),
            nombre: result.name,
            tipo: 'Personalizado',
            fecha: new Date().toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }),
            size: result.size,
            formato: formato === 'XLS' ? 'Excel' : 'PDF',
            generador: 'custom'
          },
          ...prev
        ]);
      }
    } catch (err) {
      console.error('Error al generar informe custom:', err);
      alert('Error al generar el archivo personalizado.');
    } finally {
      setGenerandoCustom(null);
    }
  };

  const handleReDescargar = async (inf) => {
    setDescargandoId(inf.id);
    const form = inf.formato === 'Excel' ? 'XLS' : 'PDF';
    try {
      if (inf.generador === 'turno') await generarInformeTurno(form);
      else if (inf.generador === 'diario') await generarInformeDiario(form);
      else if (inf.generador === 'semanal') await generarInformeSemanal(form);
      else if (inf.generador === 'calidad') await generarInformeCalidad(form);
      else await generarInformePersonalizado(desde, hasta, lineaSel, form);
    } catch (err) {
      console.error(err);
    } finally {
      setDescargandoId(null);
    }
  };

  const resultTipoLabel = (id) => {
    const map = { turno: 'Turno', diario: 'Diario', semanal: 'Semanal', calidad: 'Calidad' };
    return map[id] || 'Informe';
  };

  return (
    <div className="space-y-6 max-w-[1250px] mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white">Informes de Producción y Calidad</h2>
          <p className="text-slate-500 text-sm">Exportación inmediata de documentos en PDF estructurado y hojas de cálculo EXCEL</p>
        </div>

        {/* Tarjeta Membrete Oficial */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex items-center gap-3.5 shadow-md">
          {appConfig.logoUrl ? (
            <img src={appConfig.logoUrl} alt="Logo Oficial" className="h-9 max-w-[100px] object-contain flex-shrink-0" />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-xs flex-shrink-0">
              MPS
            </div>
          )}
          <div className="text-left min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase text-blue-400">MEMBRETE OFICIAL</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-xs font-black text-white leading-none tracking-tight truncate">{appConfig.nombreEmpresa}</p>
            <p className="text-[9px] text-slate-400 truncate">{appConfig.razonSocial || 'Industrial MES S.L.'}</p>
          </div>
          <Link
            to="/configuracion"
            className="ml-2 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all flex items-center gap-1 text-xs font-bold"
            title="Ajustar Logo e Identidad para reportes"
          >
            <Settings className="w-3.5 h-3.5" />
          </Link>
        </div>
      </motion.div>

      {/* Tipos de informe */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {informesTipo.map((inf, i) => (
          <motion.div
            key={inf.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className={`card border p-5 flex flex-col justify-between transition-all ${colorMap[inf.color].split(' ')[0]}`}
          >
            <div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colorMap[inf.color]}`}>
                <inf.icono className="w-5 h-5" />
              </div>
              <h3 className="font-black text-white text-sm mb-1">{inf.titulo}</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">{inf.descripcion}</p>
            </div>

            <div>
              <div className="text-[10px] text-slate-600 mb-3 border-t border-slate-800/60 pt-2 flex justify-between">
                <span>{inf.generados} generados</span>
                <span>Último: {inf.ultimo}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleGenerar(inf.id, 'PDF')}
                  disabled={generando !== null}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-black transition-all shadow-lg ${
                    generando === `${inf.id}-PDF`
                      ? 'bg-red-600/50 text-white cursor-wait'
                      : 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/20 active:scale-95'
                  }`}
                >
                  {generando === `${inf.id}-PDF` ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      PDF...
                    </>
                  ) : (
                    <>
                      <FileText className="w-3.5 h-3.5" />
                      PDF
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleGenerar(inf.id, 'XLS')}
                  disabled={generando !== null}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-black transition-all shadow-lg ${
                    generando === `${inf.id}-XLS`
                      ? 'bg-emerald-600/50 text-white cursor-wait'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20 active:scale-95'
                  }`}
                >
                  {generando === `${inf.id}-XLS` ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      EXCEL...
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      EXCEL
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Configuración de período */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="card p-5 border-blue-500/20">
        <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
          <h3 className="section-title mb-0">Generador Personalizado por Rango de Fechas</h3>
          <span className="text-[10px] text-blue-400 font-bold uppercase">Filtros Avanzados</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-end">
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Desde</label>
            <input
              type="date"
              value={desde}
              onChange={e => setDesde(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Hasta</label>
            <input
              type="date"
              value={hasta}
              onChange={e => setHasta(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Línea de Fabricación</label>
            <select
              value={lineaSel}
              onChange={e => setLineaSel(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="Todas las líneas">Todas las líneas</option>
              <option value="Línea 1">Línea 1</option>
              <option value="Línea 2">Línea 2</option>
              <option value="Línea 3">Línea 3</option>
              <option value="Línea 4">Línea 4</option>
              <option value="Línea 5">Línea 5</option>
            </select>
          </div>
          <div>
            <button
              onClick={() => handleGenerarCustom('PDF')}
              disabled={generandoCustom !== null}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/30 transition-all active:scale-95"
            >
              {generandoCustom === 'PDF' ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <FileBarChart className="w-3.5 h-3.5" />
              )}
              Generar PDF
            </button>
          </div>
          <div>
            <button
              onClick={() => handleGenerarCustom('XLS')}
              disabled={generandoCustom !== null}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30 transition-all active:scale-95"
            >
              {generandoCustom === 'XLS' ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              Generar EXCEL
            </button>
          </div>
        </div>
      </motion.div>

      {/* Historial */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex justify-between items-center">
          <h3 className="section-title mb-0">Historial de Informes Descargados</h3>
          <span className="text-xs text-slate-500">{historial.length} archivos en el registro</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                {['Nombre de Archivo','Tipo','Fecha de Generación','Tamaño','Formato','Acción'].map(h => (
                  <th key={h} className="table-header text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {historial.map((inf) => (
                  <motion.tr
                    key={inf.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="hover:bg-slate-800/30 transition-colors border-b border-slate-800/50"
                  >
                    <td className="table-cell font-mono text-xs font-bold text-slate-200">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${inf.formato === 'PDF' ? 'bg-red-500' : 'bg-emerald-500'}`} />
                        {inf.nombre}
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="badge-info px-2 py-0.5 rounded-lg text-[10px] font-black uppercase">{inf.tipo}</span>
                    </td>
                    <td className="table-cell text-xs font-mono text-slate-400">{inf.fecha}</td>
                    <td className="table-cell text-xs text-slate-500 font-mono">{inf.size}</td>
                    <td className="table-cell">
                      <span className={`text-xs font-black ${inf.formato === 'PDF' ? 'text-red-400' : 'text-emerald-400'}`}>{inf.formato}</span>
                    </td>
                    <td className="table-cell">
                      <button
                        onClick={() => handleReDescargar(inf)}
                        disabled={descargandoId === inf.id}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-white transition-all disabled:opacity-50"
                      >
                        {descargandoId === inf.id ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Download className="w-3 h-3" />
                        )}
                        Descargar
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
