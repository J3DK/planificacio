import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, TrendingUp, Lightbulb, Activity, ArrowRight, CheckSquare } from 'lucide-react';
import Kaizen from './Kaizen'; // We will create this
import { 
  fetchCambiosFormato, fetchTiemposCambioEstandar, fetchKaizen,
  getChecklistTemplates, insertChecklistEjecucion, fetchLineas, getChecklistEjecuciones
} from '@/services/dataService';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Radar 
} from 'recharts';
import { useAuth } from '@/context/AuthContext';

export default function Lean() {
  const { perfil } = useAuth();
  const userName = perfil?.nombre || perfil?.email || 'Usuario';
  const [activeTab, setActiveTab] = useState('kaizen'); // kaizen, smed, 5s
  const [smedData, setSmedData] = useState([]);
  const [smedEstandar, setSmedEstandar] = useState([]);
  const [kaizenData, setKaizenData] = useState([]);
  const [templates5S, setTemplates5S] = useState([]);
  const [ejecuciones5S, setEjecuciones5S] = useState([]);
  const [lineas, setLineas] = useState([]);
  
  // Auditoría en curso
  const [auditoriaActiva, setAuditoriaActiva] = useState(null); // { templateId, lineaId, items: { id: puntuacion } }

  // Radar 5S data (promedios históricos por dimensión)
  const data5S = React.useMemo(() => {
    const sums = { 'Seiri': 0, 'Seiton': 0, 'Seiso': 0, 'Seiketsu': 0, 'Shitsuke': 0 };
    const counts = { 'Seiri': 0, 'Seiton': 0, 'Seiso': 0, 'Seiketsu': 0, 'Shitsuke': 0 };

    ejecuciones5S.forEach(e => {
      (e.resultados || []).forEach(r => {
        let dim = null;
        if(r.itemId === 'IT-5S-01') dim = 'Seiri';
        if(r.itemId === 'IT-5S-02') dim = 'Seiton';
        if(r.itemId === 'IT-5S-03') dim = 'Seiso';
        if(r.itemId === 'IT-5S-04') dim = 'Seiketsu';
        if(r.itemId === 'IT-5S-05') dim = 'Shitsuke';
        
        if(dim && r.puntuacion) {
          sums[dim] += r.puntuacion;
          counts[dim]++;
        }
      });
    });

    return [
      { subject: 'Seiri (Clasificar)', A: counts.Seiri ? Math.round((sums.Seiri / counts.Seiri) * 20) : 0, fullMark: 100 },
      { subject: 'Seiton (Ordenar)', A: counts.Seiton ? Math.round((sums.Seiton / counts.Seiton) * 20) : 0, fullMark: 100 },
      { subject: 'Seiso (Limpiar)', A: counts.Seiso ? Math.round((sums.Seiso / counts.Seiso) * 20) : 0, fullMark: 100 },
      { subject: 'Seiketsu (Estandarizar)', A: counts.Seiketsu ? Math.round((sums.Seiketsu / counts.Seiketsu) * 20) : 0, fullMark: 100 },
      { subject: 'Shitsuke (Disciplina)', A: counts.Shitsuke ? Math.round((sums.Shitsuke / counts.Shitsuke) * 20) : 0, fullMark: 100 },
    ];
  }, [ejecuciones5S]);

  // Tendencia (últimas 6 auditorías o agrupar por mes)
  const tendencia5S = React.useMemo(() => {
    const sorted = [...ejecuciones5S].sort((a,b)=>new Date(a.fecha)-new Date(b.fecha));
    return sorted.slice(-10).map((e, idx) => {
      const maxP = e.resultados.length * 5;
      const score = e.resultados.reduce((a,b)=>a+(b.puntuacion||0),0);
      const pct = Math.round((score/maxP)*100) || 0;
      return {
        id: `Auditoría ${idx+1}`,
        fecha: new Date(e.fecha).toLocaleDateString(),
        score: pct
      };
    });
  }, [ejecuciones5S]);

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('cambios_formato_updated', handleUpdate);
    window.addEventListener('kaizen_updated', handleUpdate);
    return () => {
      window.removeEventListener('cambios_formato_updated', handleUpdate);
      window.removeEventListener('kaizen_updated', handleUpdate);
    };
  }, []);

  const loadData = async () => {
    const [{ data: cf }, { data: est }, { data: kz }, { data: tpls }, { data: lines }, { data: execs }] = await Promise.all([
      fetchCambiosFormato(),
      fetchTiemposCambioEstandar(),
      fetchKaizen(),
      getChecklistTemplates(),
      fetchLineas(),
      getChecklistEjecuciones()
    ]);
    setSmedData(cf || []);
    setSmedEstandar(est || []);
    setKaizenData(kz || []);
    setTemplates5S((tpls || []).filter(t => t.categoria === '5s'));
    setLineas(lines || []);
    setEjecuciones5S((execs || []).filter(e => e.categoria === '5s'));
  };

  const handleStartAuditoria = (tpl) => {
    const initItems = {};
    tpl.items.forEach(i => initItems[i.id] = 3); // Valor por defecto 3
    setAuditoriaActiva({
      templateId: tpl.id,
      templateName: tpl.nombre,
      lineaId: lineas[0]?.id || 'L1',
      items: initItems,
      observaciones: {}
    });
  };

  const handleSaveAuditoria = async () => {
    if(!auditoriaActiva) return;
    const tpl = templates5S.find(t => t.id === auditoriaActiva.templateId);
    if(!tpl) return;

    const resultados = tpl.items.map(it => ({
      itemId: it.id,
      estado: auditoriaActiva.items[it.id] >= 3 ? 'ok' : 'nok',
      puntuacion: auditoriaActiva.items[it.id],
      observacion: auditoriaActiva.observaciones[it.id] || ''
    }));

    await insertChecklistEjecucion({
      templateId: tpl.id,
      categoria: '5s',
      linea: lineas.find(l=>l.id===auditoriaActiva.lineaId)?.nombre || auditoriaActiva.lineaId,
      ordenFabricacion: 'N/A',
      operario: userName,
      fecha: new Date().toISOString(),
      turno: 'Mañana',
      resultados
    });

    setAuditoriaActiva(null);
    loadData();
  };

  const mejorasImplementadas = kaizenData.filter(k => k.estado === 'implementada').length;
  const ahorroTotal = kaizenData
    .filter(k => k.estado === 'implementada')
    .reduce((sum, k) => sum + (Number(k.ahorroEstimado) || 0), 0);
  
  // Chart data for SMED
  const smedChartData = smedData.map(cf => {
    const estandarInfo = smedEstandar.find(e => 
      e.productoAnterior === cf.productoAnterior && 
      e.productoNuevo === cf.productoNuevo
    );
    return {
      nombre: `${cf.productoAnterior.split(' ')[0]} -> ${cf.productoNuevo.split(' ')[0]}`,
      Real: cf.duracionMinutos,
      Estandar: estandarInfo ? estandarInfo.duracionMinutos || estandarInfo.minutosEstandar : 30
    };
  }).slice(0, 10);

  return (
    <div className="p-6 md:p-8 space-y-8 select-none">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-amber-400" />
            Excelencia Operacional (Lean)
          </h1>
          <p className="text-slate-400 mt-1">Mejora continua, SMED y Auditorías 5S</p>
        </div>
        
        {/* KPIs Cabecera */}
        <div className="flex gap-4 overflow-x-auto pb-2">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4 min-w-[200px]">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Lightbulb className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500">Mejoras Imp. (Mes)</p>
              <p className="text-2xl font-black text-white font-mono">{mejorasImplementadas}</p>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4 min-w-[200px]">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500">T. Cambio Medio</p>
              <p className="text-2xl font-black text-white font-mono">
                {smedData.length ? Math.round(smedData.reduce((a,b)=>a+b.duracionMinutos,0)/smedData.length) : 0} min
              </p>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4 min-w-[200px]">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <CheckSquare className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500">5S Planta</p>
              <p className="text-2xl font-black text-white font-mono">
                {tendencia5S.length > 0 ? tendencia5S[tendencia5S.length - 1].score + '%' : '—'}
              </p>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4 min-w-[200px]">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500">Ahorro Est. (Total)</p>
              <p className="text-2xl font-black text-emerald-400 font-mono">{ahorroTotal}€</p>
            </div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-4">
        {[
          { id: 'kaizen', label: 'Kaizen (Buzón de Ideas)', icon: Lightbulb, color: 'text-amber-400 border-amber-500 bg-amber-500/10' },
          { id: 'smed', label: 'SMED (Cambios de Formato)', icon: ArrowRight, color: 'text-blue-400 border-blue-500 bg-blue-500/10' },
          { id: '5s', label: 'Auditorías 5S', icon: CheckSquare, color: 'text-purple-400 border-purple-500 bg-purple-500/10' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
              activeTab === t.id 
                ? `border ${t.color}` 
                : 'text-slate-400 hover:bg-slate-800 border border-transparent'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          {activeTab === 'kaizen' && <Kaizen data={kaizenData} reload={loadData} />}
          
          {activeTab === 'smed' && (
            <div className="space-y-6">
              <div className="card p-6 border-blue-500/30">
                <h3 className="text-xl font-black text-white mb-4">Tiempos de Cambio por Combinación (Real vs Estándar)</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={smedChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="nombre" stroke="#64748b" fontSize={12} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
                      <Legend />
                      <Bar dataKey="Real" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Estandar" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="card p-6">
                <h3 className="text-xl font-black text-white mb-4">Registro Histórico de Cambios</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-xs uppercase font-black text-slate-500">
                        <th className="p-3">Línea</th>
                        <th className="p-3">Combinación</th>
                        <th className="p-3">Inicio</th>
                        <th className="p-3">Duración</th>
                        <th className="p-3">Operario</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {smedData.map(cf => (
                        <tr key={cf.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                          <td className="p-3 font-bold text-white">{cf.linea}</td>
                          <td className="p-3">
                            <span className="text-slate-400">{cf.productoAnterior}</span>
                            <ArrowRight className="inline mx-2 w-4 h-4 text-blue-400" />
                            <span className="text-white">{cf.productoNuevo}</span>
                          </td>
                          <td className="p-3 text-slate-400">{new Date(cf.fechaInicio).toLocaleString()}</td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                              cf.duracionMinutos > 30 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                            }`}>
                              {cf.duracionMinutos} min
                            </span>
                          </td>
                          <td className="p-3 text-slate-400">{cf.operarioId}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === '5s' && (
            <div className="space-y-6">
              {!auditoriaActiva ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div className="card p-6 border-purple-500/30 bg-gradient-to-br from-purple-950/10 to-slate-900">
                      <h3 className="text-xl font-black text-white mb-4">Iniciar Nueva Auditoría 5S</h3>
                      {templates5S.length > 0 ? (
                        <div className="space-y-3">
                          {templates5S.map(tpl => (
                            <div key={tpl.id} className="bg-slate-900 border border-slate-700 p-4 rounded-xl flex justify-between items-center">
                              <div>
                                <h4 className="font-bold text-white text-sm">{tpl.nombre}</h4>
                                <p className="text-xs text-slate-400">{tpl.descripcion}</p>
                              </div>
                              <button
                                onClick={() => handleStartAuditoria(tpl)}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-900/30 transition-all"
                              >
                                Iniciar
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-400 text-sm">No hay plantillas de categoría '5s' configuradas.</p>
                      )}
                    </div>
                    <div className="card p-6">
                      <h3 className="text-xl font-black text-white mb-4">Historial de Auditorías</h3>
                      <div className="space-y-3">
                        {ejecuciones5S.length > 0 ? ejecuciones5S.slice(0, 5).map(exe => {
                          const maxP = exe.resultados.length * 5;
                          const score = exe.resultados.reduce((a,b)=>a+(b.puntuacion||0),0);
                          const pct = Math.round((score/maxP)*100) || 0;
                          return (
                            <div key={exe.id} className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex justify-between items-center">
                              <div>
                                <p className="text-sm font-bold text-white">{exe.linea}</p>
                                <p className="text-xs text-slate-400">{new Date(exe.fecha).toLocaleString()}</p>
                              </div>
                              <div className="text-right">
                                <span className={`font-black text-lg ${pct>=80?'text-emerald-400':pct>=60?'text-amber-400':'text-red-400'}`}>
                                  {pct}%
                                </span>
                              </div>
                            </div>
                          )
                        }) : <p className="text-slate-400 text-xs">Aún no hay auditorías.</p>}
                      </div>
                    </div>
                  </div>
                  <div className="card p-6">
                    <h3 className="text-xl font-black text-white mb-4">Tendencia Global de 5S</h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={tendencia5S}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                          <XAxis dataKey="fecha" stroke="#64748b" fontSize={12} tickLine={false} />
                          <YAxis stroke="#64748b" fontSize={12} tickLine={false} domain={[50, 100]} />
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
                          <Line type="monotone" dataKey="score" stroke="#a855f7" strokeWidth={3} dot={{ r: 4, fill: '#a855f7' }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="card p-6 border-purple-500/50 bg-slate-950 shadow-2xl max-w-4xl mx-auto">
                  <div className="flex justify-between items-start mb-6 border-b border-slate-800 pb-4">
                    <div>
                      <h2 className="text-2xl font-black text-white flex items-center gap-2">
                        <CheckSquare className="w-6 h-6 text-purple-400" />
                        {auditoriaActiva.templateName}
                      </h2>
                      <p className="text-slate-400 mt-1">Puntúa del 1 (Muy deficiente) al 5 (Excelente)</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="text-xs font-bold text-slate-400 uppercase">Línea Auditada:</label>
                      <select
                        value={auditoriaActiva.lineaId}
                        onChange={e => setAuditoriaActiva({...auditoriaActiva, lineaId: e.target.value})}
                        className="bg-slate-900 border border-slate-700 text-white px-3 py-1.5 rounded-lg text-sm font-bold focus:outline-none"
                      >
                        {lineas.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {templates5S.find(t=>t.id===auditoriaActiva.templateId)?.items.map((it, idx) => (
                      <div key={it.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                        <p className="text-sm font-bold text-white mb-4">
                          <span className="text-purple-400 mr-2">{idx+1}.</span>{it.texto}
                        </p>
                        <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between">
                          <div className="flex items-center gap-2">
                            {[1,2,3,4,5].map(val => (
                              <button
                                key={val}
                                onClick={() => setAuditoriaActiva({
                                  ...auditoriaActiva,
                                  items: { ...auditoriaActiva.items, [it.id]: val }
                                })}
                                className={`w-12 h-12 rounded-xl font-black text-lg flex items-center justify-center transition-all ${
                                  auditoriaActiva.items[it.id] === val
                                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/50 scale-110 border-2 border-purple-400'
                                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'
                                }`}
                              >
                                {val}
                              </button>
                            ))}
                          </div>
                          <input
                            type="text"
                            placeholder="Observaciones (opcional)..."
                            value={auditoriaActiva.observaciones[it.id] || ''}
                            onChange={e => setAuditoriaActiva({
                              ...auditoriaActiva,
                              observaciones: { ...auditoriaActiva.observaciones, [it.id]: e.target.value }
                            })}
                            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-800 flex justify-end gap-4">
                    <button
                      onClick={() => setAuditoriaActiva(null)}
                      className="px-6 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveAuditoria}
                      className="px-8 py-3 rounded-xl bg-purple-600 text-white font-black shadow-lg shadow-purple-900/40 hover:bg-purple-500 transition-all"
                    >
                      Finalizar y Guardar Auditoría
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
