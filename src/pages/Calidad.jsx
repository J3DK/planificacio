import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import {
  ShieldCheck, AlertTriangle, Wrench, MessageSquareWarning, Trash2,
  Plus, Edit2, Save, XCircle, Check, RefreshCw, ChevronDown,
  Factory, TrendingUp, Package, ShieldAlert, Lock, Unlock
} from 'lucide-react';
import {
  fetchDefectos, insertDefecto, updateDefecto, deleteDefecto,
  fetchRetrabajos, insertRetrabajo, updateRetrabajo, deleteRetrabajo,
  fetchReclamaciones, insertReclamacion, updateReclamacion, deleteReclamacion,
  fetchScraps, insertScrap, updateScrap, deleteScrap,
  fetchRetencionesCalidad, insertRetencionCalidad, updateRetencionCalidad, deleteRetencionCalidad,
  getCurrentShiftInfo
} from '@/services/dataService';
import { kpisCalidad, evolucionCalidad, calidadPorLinea } from '@/data/mockCalidad';
import KPICard from '@/components/shared/KPICard';
import MiniGauge from '@/components/shared/MiniGauge';

const COLORS_PIE = ['#ef4444', '#f59e0b', '#8b5cf6', '#3b82f6', '#10b981', '#64748b'];

// ─── Formularios vacíos por defecto ─────────────────────────────────────────
const EMPTY_DEFECTO      = { causa: '', categoria: 'Proceso', cantidad: '', pct: '', linea: '', gravedad: 'media' };
const EMPTY_RETRABAJO    = { descripcion: '', causa: '', cantidad: '', tiempoUnitario: '', linea: '', fecha: new Date().toISOString().slice(0,10), operario: '', estado: 'pendiente' };
const EMPTY_RECLAMACION  = { referencia: '', cliente: '', producto: '', descripcion: '', cantidad: '', gravedad: 'media', estado: 'abierta', fechaApertura: new Date().toISOString().slice(0,10), fechaCierre: '', responsable: '', accionCorrectora: '' };
const EMPTY_SCRAP        = { descripcion: '', causa: '', cantidad: '', unidad: 'ud', costeUnitario: '', linea: '', fecha: new Date().toISOString().slice(0,10), turno: getCurrentShiftInfo().shift, destino: 'Chatarra' };
const EMPTY_RETENCION    = { codigo: '', linea: 'L1', motivo: '', gravedad: 'critica', estado: 'abierta', inspector: 'Inspector Calidad' };

// ─── Modal genérico ──────────────────────────────────────────────────────────
function CrudModal({ title, icon: Icon, iconColor, onClose, onSave, saving, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className={`card p-6 border-${iconColor}-500/40 bg-gradient-to-br from-${iconColor}-950/15 to-slate-900`}
    >
      <div className="flex items-center justify-between mb-5">
        <h4 className="text-lg font-black text-white flex items-center gap-2">
          <Icon className={`w-5 h-5 text-${iconColor}-400`} />
          {title}
        </h4>
        <button onClick={onClose} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 transition-all">
          <XCircle className="w-5 h-5" />
        </button>
      </div>
      <div className="space-y-4">{children}</div>
      <div className="flex items-center gap-3 mt-5 pt-5 border-t border-slate-800">
        <button
          onClick={onSave} disabled={saving}
          className={`px-6 py-3 rounded-2xl bg-${iconColor}-600 hover:bg-${iconColor}-500 text-white font-black text-sm shadow-lg flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50`}
        >
          <Save className="w-4 h-4" />
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
        <button onClick={onClose} className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-black text-sm transition-all">
          Cancelar
        </button>
      </div>
    </motion.div>
  );
}

// ─── Campo de formulario ─────────────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div>
      <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = 'text', ...rest }) {
  return (
    <input
      type={type} value={value} onChange={onChange} placeholder={placeholder}
      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-current"
      {...rest}
    />
  );
}

function Select({ value, onChange, children }) {
  return (
    <select value={value} onChange={onChange}
      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm font-bold text-white focus:outline-none">
      {children}
    </select>
  );
}

function Textarea({ value, onChange, placeholder, rows = 2 }) {
  return (
    <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows}
      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm font-bold text-white focus:outline-none resize-none" />
  );
}

// ─── Badge de gravedad / estado ───────────────────────────────────────────────
function BadgeGravedad({ v }) {
  const cls = v === 'alta' ? 'bg-red-500/20 text-red-400' : v === 'media' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-400';
  return <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${cls}`}>{v}</span>;
}
function BadgeEstado({ v }) {
  const cls = v === 'abierta' || v === 'en_curso' ? 'bg-amber-500/20 text-amber-400' : v === 'cerrada' || v === 'cerrado' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400';
  return <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${cls}`}>{v.replace('_', ' ')}</span>;
}

// ─── Botones de acción CRUD en tabla ─────────────────────────────────────────
function AccionesFila({ id, confirmDel, setConfirmDel, onEdit, onDelete }) {
  return (
    <td className="table-cell">
      <div className="flex items-center gap-1.5">
        <button onClick={onEdit}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-blue-900/40 text-blue-400 border border-slate-700 hover:border-blue-500/40 transition-all">
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        {confirmDel === id ? (
          <>
            <button onClick={onDelete}
              className="px-2 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-black text-[10px] transition-all">
              ¡Sí, borrar!
            </button>
            <button onClick={() => setConfirmDel(null)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 transition-all">
              <XCircle className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <button onClick={() => setConfirmDel(id)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-900/40 text-red-400 border border-slate-700 hover:border-red-500/40 transition-all">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </td>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function Calidad() {
  const [activeTab, setActiveTab] = useState('resumen');
  const [loading, setLoading] = useState(true);

  // Datos de los 5 catálogos
  const [defectos,     setDefectos]     = useState([]);
  const [retrabajos,   setRetrabajos]   = useState([]);
  const [reclamaciones,setReclamaciones]= useState([]);
  const [scraps,       setScraps]       = useState([]);
  const [retenciones,  setRetenciones]  = useState([]);

  // Estado modal + formulario activo
  const [modal,    setModal]    = useState(null); // 'new' | 'edit'
  const [saving,   setSaving]   = useState(false);
  const [editId,   setEditId]   = useState(null);
  const [success,  setSuccess]  = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);

  // Formularios
  const [formDef, setFormDef]  = useState(EMPTY_DEFECTO);
  const [formRet, setFormRet]  = useState(EMPTY_RETRABAJO);
  const [formRec, setFormRec]  = useState(EMPTY_RECLAMACION);
  const [formScr, setFormScr]  = useState(EMPTY_SCRAP);
  const [formReten, setFormReten] = useState(EMPTY_RETENCION);

  const loadAll = async () => {
    setLoading(true);
    const [d, r, c, s, ret] = await Promise.all([
      fetchDefectos(), fetchRetrabajos(), fetchReclamaciones(), fetchScraps(), fetchRetencionesCalidad()
    ]);
    if (d.data) setDefectos(d.data);
    if (r.data) setRetrabajos(r.data);
    if (c.data) setReclamaciones(c.data);
    if (s.data) setScraps(s.data);
    if (ret.data) setRetenciones(ret.data);
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  const showSuccess = () => { setSuccess(true); setTimeout(() => setSuccess(false), 2500); };

  // ─── Helpers por tab ──────────────────────────────────────────────────────
  const tabConfig = {
    defectos:     { label: 'Causas de Defectos', icon: AlertTriangle, color: 'red',    empty: EMPTY_DEFECTO,     set: setFormDef,  form: formDef,  data: defectos,      setData: setDefectos,      insert: insertDefecto,    update: updateDefecto,    del: deleteDefecto },
    retrabajos:   { label: 'Retrabajos',         icon: Wrench,        color: 'amber',  empty: EMPTY_RETRABAJO,   set: setFormRet,  form: formRet,  data: retrabajos,    setData: setRetrabajos,    insert: insertRetrabajo,  update: updateRetrabajo,  del: deleteRetrabajo },
    reclamaciones:{ label: 'Reclamaciones',      icon: MessageSquareWarning, color: 'purple', empty: EMPTY_RECLAMACION, set: setFormRec, form: formRec, data: reclamaciones, setData: setReclamaciones, insert: insertReclamacion,update: updateReclamacion,del: deleteReclamacion },
    scraps:       { label: 'Scrap / Mermas',     icon: Trash2,        color: 'orange', empty: EMPTY_SCRAP,       set: setFormScr,  form: formScr,  data: scraps,        setData: setScraps,        insert: insertScrap,      update: updateScrap,      del: deleteScrap },
    retenciones:  { label: 'Retenciones (Hold)', icon: ShieldAlert,   color: 'rose',   empty: EMPTY_RETENCION,   set: setFormReten,form: formReten,data: retenciones,   setData: setRetenciones,   insert: insertRetencionCalidad, update: updateRetencionCalidad, del: deleteRetencionCalidad },
  };

  const tab = tabConfig[activeTab];

  const abrirNuevo = () => {
    if (!tab) return;
    setEditId(null);
    tab.set(tab.empty);
    setModal('new');
  };

  const abrirEditar = (item) => {
    if (!tab) return;
    setEditId(item.id);
    tab.set({ ...item });
    setModal('edit');
  };

  const guardar = async () => {
    if (!tab) return;
    setSaving(true);
    if (editId) {
      const { data } = await tab.update(editId, tab.form);
      if (data) tab.setData(prev => prev.map(r => r.id === editId ? data : r));
    } else {
      const { data } = await tab.insert(tab.form);
      if (data) tab.setData(prev => [...prev, data]);
    }
    setSaving(false);
    setModal(null);
    showSuccess();
  };

  const borrar = async (id) => {
    if (!tab) return;
    await tab.del(id);
    tab.setData(prev => prev.filter(r => r.id !== id));
    setConfirmDel(null);
  };

  // ─── Datos del gráfico de pie para defectos ────────────────────────────────
  const pieData = useMemo(() =>
    defectos.map(d => ({ name: d.causa, value: Number(d.cantidad) || 0 })),
  [defectos]);

  // ─── Coste total scraps ───────────────────────────────────────────────────
  const costeScrap = useMemo(() =>
    scraps.reduce((s, r) => s + (Number(r.cantidad) * Number(r.costeUnitario || 0)), 0),
  [scraps]);

  const tabs = [
    { id: 'resumen',      label: 'Resumen KPIs',       icon: ShieldCheck,         color: 'emerald' },
    { id: 'defectos',     label: 'Causas de Defectos', icon: AlertTriangle,       color: 'red' },
    { id: 'retrabajos',   label: 'Retrabajos',         icon: Wrench,              color: 'amber' },
    { id: 'reclamaciones',label: 'Reclamaciones',      icon: MessageSquareWarning,color: 'purple' },
    { id: 'scraps',       label: 'Scrap / Mermas',     icon: Trash2,              color: 'orange' },
  ];

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* CABECERA */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3">
            <ShieldCheck className="w-7 h-7 text-emerald-400" />
            Calidad
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">First Pass Yield · Scrap · Retrabajos · Reclamaciones de Cliente</p>
        </div>
        <div className="flex items-center gap-3">
          {success && (
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-xs font-black animate-bounce">
              ✓ Guardado correctamente
            </span>
          )}
          <button onClick={loadAll} disabled={loading}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-all">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </motion.div>

      {/* TABS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {tabs.map(t => {
          const isAct = activeTab === t.id;
          const ac = {
            emerald: 'bg-emerald-600/15 border-emerald-500', red: 'bg-red-600/15 border-red-500',
            amber: 'bg-amber-600/15 border-amber-500', purple: 'bg-purple-600/15 border-purple-500',
            orange: 'bg-orange-600/15 border-orange-500',
          };
          const ic = {
            emerald: 'bg-emerald-600 text-white', red: 'bg-red-600 text-white',
            amber: 'bg-amber-600 text-white', purple: 'bg-purple-600 text-white',
            orange: 'bg-orange-600 text-white',
          };
          return (
            <button key={t.id} onClick={() => { setActiveTab(t.id); setModal(null); setConfirmDel(null); }}
              className={`p-3 rounded-2xl border-2 transition-all flex items-center gap-3 ${isAct ? ac[t.color] : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'}`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${isAct ? ic[t.color] : 'bg-slate-800 text-slate-400'}`}>
                <t.icon className="w-4 h-4" />
              </div>
              <span className={`font-black text-xs ${isAct ? 'text-white' : 'text-slate-400'}`}>{t.label}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">

        {/* ── TAB RESUMEN ─────────────────────────────────────────────────── */}
        {activeTab === 'resumen' && (
          <motion.div key="resumen" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="card p-5 flex flex-col items-center justify-center text-center">
                <MiniGauge value={kpisCalidad.fpy} max={100} color="auto" label="FPY" size={96} />
                <p className="section-title mt-3">First Pass Yield</p>
                <p className="text-[10px] text-slate-500">Obj: {kpisCalidad.objetivoFPY}%</p>
              </div>
              <KPICard title="Scrap" value={kpisCalidad.scrap.toLocaleString('es')} unit="uds" sub={`${kpisCalidad.scrapPct}% producción`} color="red" size="lg" />
              <KPICard title="Retrabajos" value={kpisCalidad.retrabajos} unit="uds" sub={`${kpisCalidad.retrabajoPct}% producción`} color="amber" size="lg" />
              <KPICard title="Reclamaciones" value={kpisCalidad.reclamaciones} sub="Abiertas en cliente" color={kpisCalidad.reclamaciones === 0 ? 'green' : 'red'} size="lg" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Pie defectos */}
              <div className="card p-5">
                <h3 className="section-title">Top Causas de Defectos</h3>
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <ResponsiveContainer width={160} height={160}>
                      <PieChart>
                        <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2}>
                          {pieData.map((_, i) => <Cell key={i} fill={COLORS_PIE[i % COLORS_PIE.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v) => [`${v} uds`, '']} contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-2">
                    {defectos.map((d, i) => (
                      <div key={d.id || i} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: COLORS_PIE[i % COLORS_PIE.length] }} />
                        <span className="text-xs text-slate-400 flex-1 truncate">{d.causa}</span>
                        <span className="text-xs font-black text-white">{d.cantidad} <span className="text-slate-500">({d.pct}%)</span></span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Evolución FPY */}
              <div className="card p-5">
                <h3 className="section-title">Evolución FPY Semanal (%)</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={evolucionCalidad} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="dia" tick={{ fill: '#64748b', fontSize: 11 }} />
                    <YAxis domain={[96, 100]} tick={{ fill: '#64748b', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, fontSize: 11 }} />
                    <ReferenceLine y={kpisCalidad.objetivoFPY} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: `Obj ${kpisCalidad.objetivoFPY}%`, fill: '#f59e0b', fontSize: 10, position: 'right' }} />
                    <Line type="monotone" dataKey="fpy" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: '#10b981' }} name="FPY %" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Calidad por línea */}
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-800">
                <h3 className="section-title mb-0">Calidad por Línea</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-800">
                      {['Línea','FPY (%)','Scrap (uds)','NOK en cliente','Estado'].map(h => (
                        <th key={h} className="table-header text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {calidadPorLinea.map(row => (
                      <tr key={row.linea} className="hover:bg-slate-800/30 transition-colors">
                        <td className="table-cell font-bold text-slate-200">{row.linea}</td>
                        <td className="table-cell">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden max-w-[80px]">
                              <div className={`h-full rounded-full ${row.fpy >= 99 ? 'bg-emerald-500' : row.fpy >= 98 ? 'bg-blue-500' : 'bg-amber-500'}`}
                                style={{ width: `${((row.fpy - 96) / 4) * 100}%` }} />
                            </div>
                            <span className={`text-sm font-black ${row.fpy >= 99 ? 'text-emerald-400' : row.fpy >= 98 ? 'text-blue-400' : 'text-amber-400'}`}>{row.fpy}%</span>
                          </div>
                        </td>
                        <td className="table-cell text-red-400 font-bold">{row.scrap}</td>
                        <td className="table-cell text-center">
                          <span className={`font-black ${row.nok === 0 ? 'text-emerald-400' : row.nok <= 2 ? 'text-amber-400' : 'text-red-400'}`}>{row.nok}</span>
                        </td>
                        <td className="table-cell">
                          <span className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${row.fpy >= 99 ? 'badge-ok' : row.fpy >= 98 ? 'badge-info' : 'badge-warn'}`}>
                            {row.fpy >= 99 ? 'OK' : row.fpy >= 98 ? 'Aceptable' : 'Atención'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── TAB CAUSAS DE DEFECTOS ─────────────────────────────────────── */}
        {activeTab === 'defectos' && (
          <motion.div key="defectos" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-400" /> Causas de Defectos</h3>
                <p className="text-xs text-slate-400 mt-0.5">Catálogo de causas raíz de defectos detectados en línea</p>
              </div>
              <button onClick={abrirNuevo} className="px-4 py-2.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-sm flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-red-900/30">
                <Plus className="w-4 h-4" /> Nueva Causa
              </button>
            </div>
            <AnimatePresence>
              {modal && (
                <CrudModal title={editId ? 'Editar Causa' : 'Nueva Causa de Defecto'} icon={AlertTriangle} iconColor="red" onClose={() => setModal(null)} onSave={guardar} saving={saving}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Causa raíz *"><Input value={formDef.causa} onChange={e => setFormDef(f => ({...f, causa: e.target.value}))} placeholder="Ej: Soldadura defectuosa" /></Field>
                    <Field label="Categoría"><Select value={formDef.categoria} onChange={e => setFormDef(f => ({...f, categoria: e.target.value}))}><option>Proceso</option><option>Material</option><option>Máquina</option><option>Persona</option><option>Otros</option></Select></Field>
                    <Field label="Cantidad (uds)"><Input type="number" value={formDef.cantidad} onChange={e => setFormDef(f => ({...f, cantidad: e.target.value}))} placeholder="0" /></Field>
                    <Field label="% del total"><Input type="number" value={formDef.pct} onChange={e => setFormDef(f => ({...f, pct: e.target.value}))} placeholder="0" /></Field>
                    <Field label="Línea"><Input value={formDef.linea} onChange={e => setFormDef(f => ({...f, linea: e.target.value}))} placeholder="Ej: Línea 1" /></Field>
                    <Field label="Gravedad"><Select value={formDef.gravedad} onChange={e => setFormDef(f => ({...f, gravedad: e.target.value}))}><option value="alta">Alta</option><option value="media">Media</option><option value="baja">Baja</option></Select></Field>
                  </div>
                </CrudModal>
              )}
            </AnimatePresence>
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead><tr className="border-b border-slate-800 text-[11px] text-slate-400 uppercase">
                  {['ID','Causa Raíz','Categoría','Línea','Cantidad','%','Gravedad','Acciones'].map(h => <th key={h} className="table-header text-left">{h}</th>)}
                </tr></thead>
                <tbody className="divide-y divide-slate-800/60">
                  {defectos.map(r => (
                    <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="table-cell font-mono text-slate-500 text-xs">{r.id}</td>
                      <td className="table-cell font-bold text-white">{r.causa}</td>
                      <td className="table-cell text-slate-400">{r.categoria}</td>
                      <td className="table-cell text-slate-400">{r.linea}</td>
                      <td className="table-cell font-mono text-red-400 font-bold">{r.cantidad}</td>
                      <td className="table-cell font-mono text-slate-300">{r.pct}%</td>
                      <td className="table-cell"><BadgeGravedad v={r.gravedad} /></td>
                      <AccionesFila id={r.id} confirmDel={confirmDel} setConfirmDel={setConfirmDel} onEdit={() => abrirEditar(r)} onDelete={() => borrar(r.id)} />
                    </tr>
                  ))}
                  {defectos.length === 0 && <tr><td colSpan={8} className="table-cell text-center text-slate-500 py-8">Sin registros. Pulsa «Nueva Causa» para empezar.</td></tr>}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* ── TAB RETRABAJOS ────────────────────────────────────────────── */}
        {activeTab === 'retrabajos' && (
          <motion.div key="retrabajos" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2"><Wrench className="w-5 h-5 text-amber-400" /> Retrabajos</h3>
                <p className="text-xs text-slate-400 mt-0.5">Registro de operaciones de reparación / corrección antes de salida de línea</p>
              </div>
              <button onClick={abrirNuevo} className="px-4 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-black text-sm flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-amber-900/30">
                <Plus className="w-4 h-4" /> Nuevo Retrabajo
              </button>
            </div>
            <AnimatePresence>
              {modal && (
                <CrudModal title={editId ? 'Editar Retrabajo' : 'Registrar Retrabajo'} icon={Wrench} iconColor="amber" onClose={() => setModal(null)} onSave={guardar} saving={saving}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2"><Field label="Descripción *"><Input value={formRet.descripcion} onChange={e => setFormRet(f => ({...f, descripcion: e.target.value}))} placeholder="Ej: Re-soldadura de conexiones frías" /></Field></div>
                    <Field label="Causa raíz"><Input value={formRet.causa} onChange={e => setFormRet(f => ({...f, causa: e.target.value}))} placeholder="Ej: Soldadura defectuosa" /></Field>
                    <Field label="Cantidad (uds)"><Input type="number" value={formRet.cantidad} onChange={e => setFormRet(f => ({...f, cantidad: e.target.value}))} placeholder="0" /></Field>
                    <Field label="Tiempo unitario (min)"><Input type="number" value={formRet.tiempoUnitario} onChange={e => setFormRet(f => ({...f, tiempoUnitario: e.target.value}))} placeholder="0" /></Field>
                    <Field label="Línea"><Input value={formRet.linea} onChange={e => setFormRet(f => ({...f, linea: e.target.value}))} placeholder="Ej: Línea 2" /></Field>
                    <Field label="Operario"><Input value={formRet.operario} onChange={e => setFormRet(f => ({...f, operario: e.target.value}))} placeholder="Nombre operario" /></Field>
                    <Field label="Fecha"><Input type="date" value={formRet.fecha} onChange={e => setFormRet(f => ({...f, fecha: e.target.value}))} /></Field>
                    <Field label="Estado"><Select value={formRet.estado} onChange={e => setFormRet(f => ({...f, estado: e.target.value}))}><option value="pendiente">Pendiente</option><option value="en_curso">En curso</option><option value="cerrado">Cerrado</option></Select></Field>
                  </div>
                </CrudModal>
              )}
            </AnimatePresence>
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead><tr className="border-b border-slate-800 text-[11px] text-slate-400 uppercase">
                  {['ID','Descripción','Causa','Línea','Uds','Min/ud','Operario','Fecha','Estado','Acciones'].map(h => <th key={h} className="table-header text-left">{h}</th>)}
                </tr></thead>
                <tbody className="divide-y divide-slate-800/60">
                  {retrabajos.map(r => (
                    <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="table-cell font-mono text-slate-500 text-xs">{r.id}</td>
                      <td className="table-cell font-bold text-white max-w-[200px] truncate">{r.descripcion}</td>
                      <td className="table-cell text-slate-400 text-xs">{r.causa}</td>
                      <td className="table-cell text-slate-400">{r.linea}</td>
                      <td className="table-cell font-mono text-amber-400 font-bold">{r.cantidad}</td>
                      <td className="table-cell font-mono text-slate-300">{r.tiempoUnitario}</td>
                      <td className="table-cell text-slate-400 text-xs">{r.operario}</td>
                      <td className="table-cell font-mono text-slate-500 text-xs">{r.fecha}</td>
                      <td className="table-cell"><BadgeEstado v={r.estado} /></td>
                      <AccionesFila id={r.id} confirmDel={confirmDel} setConfirmDel={setConfirmDel} onEdit={() => abrirEditar(r)} onDelete={() => borrar(r.id)} />
                    </tr>
                  ))}
                  {retrabajos.length === 0 && <tr><td colSpan={10} className="table-cell text-center text-slate-500 py-8">Sin retrabajos registrados.</td></tr>}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* ── TAB RECLAMACIONES ─────────────────────────────────────────── */}
        {activeTab === 'reclamaciones' && (
          <motion.div key="reclamaciones" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2"><MessageSquareWarning className="w-5 h-5 text-purple-400" /> Reclamaciones de Cliente</h3>
                <p className="text-xs text-slate-400 mt-0.5">Seguimiento de no conformidades reportadas por clientes y acciones correctoras</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-xl text-xs font-black ${reclamaciones.filter(r => r.estado === 'abierta').length > 0 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                  {reclamaciones.filter(r => r.estado === 'abierta').length} abiertas
                </span>
                <button onClick={abrirNuevo} className="px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-sm flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-purple-900/30">
                  <Plus className="w-4 h-4" /> Nueva Reclamación
                </button>
              </div>
            </div>
            <AnimatePresence>
              {modal && (
                <CrudModal title={editId ? 'Editar Reclamación' : 'Nueva Reclamación'} icon={MessageSquareWarning} iconColor="purple" onClose={() => setModal(null)} onSave={guardar} saving={saving}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Referencia"><Input value={formRec.referencia} onChange={e => setFormRec(f => ({...f, referencia: e.target.value}))} placeholder="Ej: REC-2026-042" /></Field>
                    <Field label="Cliente *"><Input value={formRec.cliente} onChange={e => setFormRec(f => ({...f, cliente: e.target.value}))} placeholder="Ej: Cliente A" /></Field>
                    <Field label="Producto"><Input value={formRec.producto} onChange={e => setFormRec(f => ({...f, producto: e.target.value}))} placeholder="Ej: BAT-48V-100Ah" /></Field>
                    <Field label="Cantidad (uds afectadas)"><Input type="number" value={formRec.cantidad} onChange={e => setFormRec(f => ({...f, cantidad: e.target.value}))} placeholder="0" /></Field>
                    <div className="md:col-span-2"><Field label="Descripción del problema *"><Textarea value={formRec.descripcion} onChange={e => setFormRec(f => ({...f, descripcion: e.target.value}))} placeholder="Describe el defecto o problema reportado por el cliente..." /></Field></div>
                    <Field label="Gravedad"><Select value={formRec.gravedad} onChange={e => setFormRec(f => ({...f, gravedad: e.target.value}))}><option value="alta">Alta</option><option value="media">Media</option><option value="baja">Baja</option></Select></Field>
                    <Field label="Estado"><Select value={formRec.estado} onChange={e => setFormRec(f => ({...f, estado: e.target.value}))}><option value="abierta">Abierta</option><option value="cerrada">Cerrada</option></Select></Field>
                    <Field label="Fecha apertura"><Input type="date" value={formRec.fechaApertura} onChange={e => setFormRec(f => ({...f, fechaApertura: e.target.value}))} /></Field>
                    <Field label="Fecha cierre"><Input type="date" value={formRec.fechaCierre || ''} onChange={e => setFormRec(f => ({...f, fechaCierre: e.target.value}))} /></Field>
                    <Field label="Responsable"><Input value={formRec.responsable} onChange={e => setFormRec(f => ({...f, responsable: e.target.value}))} placeholder="Ej: Dpto. Calidad" /></Field>
                    <div className="md:col-span-2"><Field label="Acción correctora"><Textarea value={formRec.accionCorrectora} onChange={e => setFormRec(f => ({...f, accionCorrectora: e.target.value}))} placeholder="Acción correctora implementada o en curso..." /></Field></div>
                  </div>
                </CrudModal>
              )}
            </AnimatePresence>
            <div className="space-y-3">
              {reclamaciones.map(r => (
                <div key={r.id} className={`card p-5 border-l-4 ${r.estado === 'abierta' ? 'border-l-red-500' : 'border-l-emerald-500'}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-mono text-xs text-purple-400 font-bold">{r.referencia}</span>
                        <BadgeGravedad v={r.gravedad} />
                        <BadgeEstado v={r.estado} />
                      </div>
                      <h4 className="font-black text-white">{r.descripcion}</h4>
                      <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-400">
                        <span>👤 <strong className="text-slate-300">{r.cliente}</strong></span>
                        <span>📦 <strong className="text-slate-300">{r.producto}</strong></span>
                        <span>🔢 <strong className="text-slate-300">{r.cantidad} uds</strong></span>
                        <span>📅 Apertura: <strong className="text-slate-300">{r.fechaApertura}</strong></span>
                        {r.fechaCierre && <span>✅ Cierre: <strong className="text-slate-300">{r.fechaCierre}</strong></span>}
                        <span>👷 {r.responsable}</span>
                      </div>
                      {r.accionCorrectora && (
                        <p className="mt-2 text-xs text-slate-500 bg-slate-800/50 rounded-xl px-3 py-2 border border-slate-700">
                          <strong className="text-slate-400">Acción correctora:</strong> {r.accionCorrectora}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button onClick={() => abrirEditar(r)} className="p-2 rounded-xl bg-slate-800 hover:bg-purple-900/40 text-purple-400 border border-slate-700 hover:border-purple-500/40 transition-all"><Edit2 className="w-4 h-4" /></button>
                      {confirmDel === r.id ? (
                        <>
                          <button onClick={() => borrar(r.id)} className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs transition-all">¡Borrar!</button>
                          <button onClick={() => setConfirmDel(null)} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 transition-all"><XCircle className="w-4 h-4" /></button>
                        </>
                      ) : (
                        <button onClick={() => setConfirmDel(r.id)} className="p-2 rounded-xl bg-slate-800 hover:bg-red-900/40 text-red-400 border border-slate-700 hover:border-red-500/40 transition-all"><Trash2 className="w-4 h-4" /></button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {reclamaciones.length === 0 && (
                <div className="card p-10 text-center text-slate-500">
                  <MessageSquareWarning className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="font-bold">Sin reclamaciones registradas</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── TAB SCRAP / MERMAS ────────────────────────────────────────── */}
        {activeTab === 'scraps' && (
          <motion.div key="scraps" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2"><Trash2 className="w-5 h-5 text-orange-400" /> Scrap / Mermas</h3>
                <p className="text-xs text-slate-400 mt-0.5">Registro de material desechado — coste total acumulado: <strong className="text-orange-400">€{costeScrap.toLocaleString('es', { minimumFractionDigits: 2 })}</strong></p>
              </div>
              <button onClick={abrirNuevo} className="px-4 py-2.5 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-black text-sm flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-orange-900/30">
                <Plus className="w-4 h-4" /> Registrar Scrap
              </button>
            </div>
            <AnimatePresence>
              {modal && (
                <CrudModal title={editId ? 'Editar Scrap' : 'Registrar Scrap / Merma'} icon={Trash2} iconColor="orange" onClose={() => setModal(null)} onSave={guardar} saving={saving}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2"><Field label="Descripción *"><Input value={formScr.descripcion} onChange={e => setFormScr(f => ({...f, descripcion: e.target.value}))} placeholder="Ej: Celdas LFP con voltaje fuera de rango" /></Field></div>
                    <Field label="Causa"><Input value={formScr.causa} onChange={e => setFormScr(f => ({...f, causa: e.target.value}))} placeholder="Ej: Celda dañada" /></Field>
                    <Field label="Cantidad"><Input type="number" value={formScr.cantidad} onChange={e => setFormScr(f => ({...f, cantidad: e.target.value}))} placeholder="0" /></Field>
                    <Field label="Unidad"><Select value={formScr.unidad} onChange={e => setFormScr(f => ({...f, unidad: e.target.value}))}><option value="ud">ud</option><option value="m">m</option><option value="kg">kg</option><option value="L">L</option></Select></Field>
                    <Field label="Coste unitario (€)"><Input type="number" step="0.01" value={formScr.costeUnitario} onChange={e => setFormScr(f => ({...f, costeUnitario: e.target.value}))} placeholder="0.00" /></Field>
                    <Field label="Línea"><Input value={formScr.linea} onChange={e => setFormScr(f => ({...f, linea: e.target.value}))} placeholder="Ej: Línea 1" /></Field>
                    <Field label="Turno"><Select value={formScr.turno} onChange={e => setFormScr(f => ({...f, turno: e.target.value}))}><option>Mañana</option><option>Tarde</option><option>Noche</option></Select></Field>
                    <Field label="Fecha"><Input type="date" value={formScr.fecha} onChange={e => setFormScr(f => ({...f, fecha: e.target.value}))} /></Field>
                    <Field label="Destino"><Select value={formScr.destino} onChange={e => setFormScr(f => ({...f, destino: e.target.value}))}><option>Chatarra</option><option>Proveedor (RMA)</option><option>Retrabajo</option><option>Cuarentena</option></Select></Field>
                  </div>
                </CrudModal>
              )}
            </AnimatePresence>
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead><tr className="border-b border-slate-800 text-[11px] text-slate-400 uppercase">
                  {['ID','Descripción','Causa','Línea','Turno','Cantidad','€ Unit.','Coste Total','Destino','Fecha','Acciones'].map(h => <th key={h} className="table-header text-left">{h}</th>)}
                </tr></thead>
                <tbody className="divide-y divide-slate-800/60">
                  {scraps.map(r => {
                    const coste = (Number(r.cantidad) * Number(r.costeUnitario || 0));
                    return (
                      <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="table-cell font-mono text-slate-500 text-xs">{r.id}</td>
                        <td className="table-cell font-bold text-white max-w-[180px] truncate">{r.descripcion}</td>
                        <td className="table-cell text-slate-400 text-xs">{r.causa}</td>
                        <td className="table-cell text-slate-400">{r.linea}</td>
                        <td className="table-cell text-xs">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${r.turno === 'Mañana' ? 'bg-amber-500/20 text-amber-300' : r.turno === 'Tarde' ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-700 text-slate-300'}`}>{r.turno}</span>
                        </td>
                        <td className="table-cell font-mono text-orange-400 font-bold">{r.cantidad} {r.unidad}</td>
                        <td className="table-cell font-mono text-slate-300">{r.costeUnitario ? `€${Number(r.costeUnitario).toFixed(2)}` : '—'}</td>
                        <td className="table-cell font-mono font-black text-red-400">€{coste.toLocaleString('es', { minimumFractionDigits: 2 })}</td>
                        <td className="table-cell text-xs text-slate-400">{r.destino}</td>
                        <td className="table-cell font-mono text-slate-500 text-xs">{r.fecha}</td>
                        <AccionesFila id={r.id} confirmDel={confirmDel} setConfirmDel={setConfirmDel} onEdit={() => abrirEditar(r)} onDelete={() => borrar(r.id)} />
                      </tr>
                    );
                  })}
                  {scraps.length === 0 && <tr><td colSpan={11} className="table-cell text-center text-slate-500 py-8">Sin scraps registrados.</td></tr>}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* ── TAB RETENCIONES (QUALITY HOLD) ────────────────────────────── */}
        {activeTab === 'retenciones' && (
          <motion.div key="retenciones" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-rose-500 animate-pulse" /> Retenciones de Calidad (Quality Hold)</h3>
                <p className="text-xs text-slate-400 mt-0.5">Control y bloqueo de líneas en el Gantt — <span className="text-rose-400 font-bold">{retenciones.filter(r => r.estado !== 'cerrada').length} retenciones activas en planta</span></p>
              </div>
              <button onClick={abrirNuevo} className="px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-sm flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-rose-900/30">
                <Plus className="w-4 h-4" /> Retener Línea por Calidad
              </button>
            </div>
            <AnimatePresence>
              {modal && (
                <CrudModal title={editId ? 'Editar Retención' : 'Marcar Retención en Línea'} icon={ShieldAlert} iconColor="rose" onClose={() => setModal(null)} onSave={guardar} saving={saving}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Código / Referencia"><Input value={formReten.codigo} onChange={e => setFormReten(f => ({...f, codigo: e.target.value}))} placeholder="Ej: HOLD-102" /></Field>
                    <Field label="Línea"><Input value={formReten.linea} onChange={e => setFormReten(f => ({...f, linea: e.target.value}))} placeholder="Ej: L1, L2..." /></Field>
                    <div className="md:col-span-2"><Field label="Motivo de Retención *"><Input value={formReten.motivo} onChange={e => setFormReten(f => ({...f, motivo: e.target.value}))} placeholder="Describe el fallo o motivo grave por el cual se bloquea la línea..." /></Field></div>
                    <Field label="Gravedad"><Select value={formReten.gravedad} onChange={e => setFormReten(f => ({...f, gravedad: e.target.value}))}><option value="alta">Alta</option><option value="critica">Crítica (Bloquea Gantt)</option></Select></Field>
                    <Field label="Estado"><Select value={formReten.estado} onChange={e => setFormReten(f => ({...f, estado: e.target.value}))}><option value="abierta">Abierta (Bloqueada)</option><option value="cerrada">Cerrada (Liberada)</option></Select></Field>
                    <div className="md:col-span-2"><Field label="Inspector Responsable"><Input value={formReten.inspector} onChange={e => setFormReten(f => ({...f, inspector: e.target.value}))} placeholder="Ej: Laura QC" /></Field></div>
                  </div>
                </CrudModal>
              )}
            </AnimatePresence>
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead><tr className="border-b border-slate-800 text-[11px] text-slate-400 uppercase">
                  {['Código','Línea','Motivo','Gravedad','Estado','Inspector','Apertura','Cierre / Liberación','Acciones'].map(h => <th key={h} className="table-header text-left">{h}</th>)}
                </tr></thead>
                <tbody className="divide-y divide-slate-800/60">
                  {retenciones.map(r => {
                    const activa = r.estado !== 'cerrada';
                    return (
                      <tr key={r.id} className={`hover:bg-slate-800/30 transition-colors ${activa ? 'bg-rose-950/15' : ''}`}>
                        <td className="table-cell font-mono text-white font-bold text-xs">{r.codigo}</td>
                        <td className="table-cell font-black text-rose-400">{r.linea}</td>
                        <td className="table-cell font-bold text-white max-w-[240px] truncate">{r.motivo}</td>
                        <td className="table-cell">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">{r.gravedad}</span>
                        </td>
                        <td className="table-cell">
                          {activa ? (
                            <span className="px-2.5 py-1 rounded-full bg-red-600/30 text-red-300 font-black text-xs border border-red-500/50 flex items-center gap-1.5 w-fit animate-pulse">
                              <Lock className="w-3.5 h-3.5" /> RETENIDA
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-600/20 text-emerald-300 font-bold text-xs border border-emerald-500/30 flex items-center gap-1.5 w-fit">
                              <Unlock className="w-3.5 h-3.5" /> LIBERADA
                            </span>
                          )}
                        </td>
                        <td className="table-cell text-xs text-slate-300">{r.inspector}</td>
                        <td className="table-cell font-mono text-slate-500 text-xs">{r.fechaApertura}</td>
                        <td className="table-cell font-mono text-xs">
                          {activa ? (
                            <button
                              onClick={async () => {
                                const upd = await updateRetencionCalidad(r.id, { estado: 'cerrada', fechaCierre: new Date().toISOString().slice(0, 16).replace('T', ' ') });
                                if (upd.data) {
                                  setRetenciones(prev => prev.map(item => item.id === r.id ? upd.data : item));
                                  showSuccess();
                                }
                              }}
                              className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1"
                            >
                              <Unlock className="w-3.5 h-3.5" /> Liberar Retención
                            </button>
                          ) : (
                            <span className="text-emerald-400 font-bold">{r.fechaCierre || 'Resuelto'}</span>
                          )}
                        </td>
                        <AccionesFila id={r.id} confirmDel={confirmDel} setConfirmDel={setConfirmDel} onEdit={() => abrirEditar(r)} onDelete={() => borrar(r.id)} />
                      </tr>
                    );
                  })}
                  {retenciones.length === 0 && <tr><td colSpan={9} className="table-cell text-center text-slate-500 py-8">Sin retenciones de calidad activas ni pasadas.</td></tr>}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
