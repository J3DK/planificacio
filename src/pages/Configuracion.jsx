import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, Upload, Image as ImageIcon, CheckCircle2, Sparkles,
  Building2, FileText, Sliders, RefreshCw, Zap, Trash2, Eye, EyeOff,
  SlidersHorizontal, Check, AlertCircle, Laptop, Printer, ArrowUp, ArrowDown,
  LayoutDashboard, CalendarDays, ListOrdered, Factory, Users, Boxes,
  BarChart2, CheckSquare, StopCircle, Package, FileBarChart,
  Bell, Cpu, History, Menu
} from 'lucide-react';
import { getAppConfig, updateAppConfig, DEFAULT_APP_CONFIG, DEFAULT_MENU_ITEMS } from '@/services/configService';

export default function Configuracion() {
  const [config, setConfig] = useState(getAppConfig());
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [activeTab, setActiveTab] = useState('branding'); // branding | empresa | sistema | navegacion

  useEffect(() => {
    setConfig(getAppConfig());
  }, []);

  const handleChange = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleUpdateMenuOrder = (newList) => {
    const updated = { ...config, menuOrder: newList };
    setConfig(updated);
    updateAppConfig(updated);
    setSuccessMsg('Orden del menú lateral actualizado al instante.');
    setTimeout(() => setSuccessMsg(''), 2500);
  };

  const moveMenuItemUp = (idx) => {
    if (idx <= 0) return;
    const list = Array.isArray(config.menuOrder) ? [...config.menuOrder] : [...DEFAULT_MENU_ITEMS];
    const temp = list[idx];
    list[idx] = list[idx - 1];
    list[idx - 1] = temp;
    handleUpdateMenuOrder(list);
  };

  const moveMenuItemDown = (idx) => {
    const list = Array.isArray(config.menuOrder) ? [...config.menuOrder] : [...DEFAULT_MENU_ITEMS];
    if (idx >= list.length - 1) return;
    const temp = list[idx];
    list[idx] = list[idx + 1];
    list[idx + 1] = temp;
    handleUpdateMenuOrder(list);
  };

  const toggleMenuVisibility = (idx) => {
    const list = Array.isArray(config.menuOrder) ? [...config.menuOrder] : [...DEFAULT_MENU_ITEMS];
    if (!list[idx]) return;
    list[idx] = { ...list[idx], visible: list[idx].visible === false ? true : false };
    handleUpdateMenuOrder(list);
  };

  const resetMenuOrder = () => {
    handleUpdateMenuOrder(DEFAULT_MENU_ITEMS);
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Redimensionar preservando transparencia en formato PNG
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/png');
        handleChange('logoUrl', dataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    handleChange('logoUrl', '');
  };

  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);
    updateAppConfig(config);
    setTimeout(() => {
      setSaving(false);
      setSuccessMsg('Configuración global actualizada y aplicada a toda la aplicación e informes.');
      setTimeout(() => setSuccessMsg(''), 4000);
    }, 400);
  };

  const handleReset = () => {
    if (window.confirm('¿Deseas restaurar toda la configuración y branding a los valores por defecto del sistema?')) {
      setConfig(DEFAULT_APP_CONFIG);
      updateAppConfig(DEFAULT_APP_CONFIG);
      setSuccessMsg('Valores por defecto restaurados.');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  return (
    <div className="space-y-6 pb-16 animate-fade-in">
      {/* ── BANNER EXPLICATIVO / ALERTA DE EXITO ── */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-emerald-500/20 border-2 border-emerald-500/50 rounded-2xl p-4 flex items-center gap-3 text-emerald-300 shadow-xl shadow-emerald-950/40"
          >
            <CheckCircle2 className="w-6 h-6 flex-shrink-0 text-emerald-400" />
            <span className="font-bold text-sm">{successMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HEADER DE LA PÁGINA ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900/90 to-indigo-950/50 p-6 rounded-3xl border border-slate-800 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 flex-shrink-0">
            <Settings className="w-7 h-7 text-white animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-500/30">
                Ajustes del Sistema & Identidad
              </span>
              <span className="text-xs text-slate-400 font-medium">Global App Settings</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight mt-1">
              Configuración General & Logo de Empresa
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            type="button"
            className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-2xl font-bold text-xs border border-slate-700 flex items-center gap-2 transition-all active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Restaurar Defectos</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            type="button"
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-900/50 flex items-center gap-2.5 transition-all active:scale-95"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            <span>Guardar Configuración</span>
          </button>
        </div>
      </div>

      {/* ── NAVEGADOR DE PESTAÑAS ── */}
      <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 p-1.5 rounded-2xl overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('branding')}
          className={`px-5 py-2.5 rounded-xl font-black text-xs flex items-center gap-2.5 transition-all whitespace-nowrap ${
            activeTab === 'branding'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Branding & Logo Corporativo</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('empresa')}
          className={`px-5 py-2.5 rounded-xl font-black text-xs flex items-center gap-2.5 transition-all whitespace-nowrap ${
            activeTab === 'empresa'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Datos de Empresa para Reportes</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('sistema')}
          className={`px-5 py-2.5 rounded-xl font-black text-xs flex items-center gap-2.5 transition-all whitespace-nowrap ${
            activeTab === 'sistema'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Parámetros & KPIs Planta</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('navegacion')}
          className={`px-5 py-2.5 rounded-xl font-black text-xs flex items-center gap-2.5 transition-all whitespace-nowrap ${
            activeTab === 'navegacion'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Orden del Menú & Navegación</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* ── PESTAÑA 1: BRANDING & LOGO CORPORATIVO ── */}
        {activeTab === 'branding' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
            {/* Carga de Logo y Opciones */}
            <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-white text-lg">Subir Logo desde el Ordenador (PC)</h3>
                  <p className="text-xs text-slate-400">Esta imagen aparecerá en la cabecera de la aplicación y en los reportes</p>
                </div>
              </div>

              {/* Selector e Input File */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                <div className="col-span-1 flex flex-col items-center justify-center bg-slate-950 border-2 border-dashed border-slate-700 rounded-2xl p-6 relative group overflow-hidden h-40">
                  {config.logoUrl ? (
                    <img src={config.logoUrl} alt="Logo subido" className="max-h-24 max-w-full object-contain filter drop-shadow-md" />
                  ) : (
                    <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-2">
                        <Zap className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Sin logo personalizado</span>
                    </div>
                  )}
                </div>

                <div className="col-span-1 sm:col-span-2 space-y-3">
                  <label className="cursor-pointer bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs px-5 py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/30 active:scale-95 w-full">
                    <Upload className="w-4 h-4" />
                    <span>Seleccionar Archivo de Logo (PNG/JPG)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>

                  {config.logoUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="w-full py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-bold text-xs flex items-center justify-center gap-2 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar Logo subido</span>
                    </button>
                  )}

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    💡 <strong className="text-slate-300">Recomendación pro:</strong> Sube una imagen en formato <span className="text-blue-400 font-bold">PNG con fondo transparente</span> o rectangular de buena nitidez. Se ajustará automáticamente sin deformar su proporción.
                  </p>
                </div>
              </div>

              {/* Nombres y Títulos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Nombre Corto de la App / Marca *
                  </label>
                  <input
                    type="text"
                    value={config.nombreEmpresa}
                    onChange={e => handleChange('nombreEmpresa', e.target.value)}
                    placeholder="Ej: MPS Producción"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Subtítulo o Eslogan
                  </label>
                  <input
                    type="text"
                    value={config.subtituloEmpresa}
                    onChange={e => handleChange('subtituloEmpresa', e.target.value)}
                    placeholder="Ej: Smart MES Factory"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-300 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Previsualización en Vivo de Aplicación y Reportes */}
            <div className="lg:col-span-5 space-y-6">
              {/* Simulador de App Sidebar */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
                <div className="flex items-center justify-between text-xs font-black uppercase text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Laptop className="w-4 h-4 text-blue-400" />
                    <span>Vista previa en Menú Lateral (App)</span>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[9px]">EN VIVO</span>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
                  {config.logoUrl ? (
                    <img src={config.logoUrl} alt="Logo" className="h-9 max-w-[110px] object-contain flex-shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-900/50">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-white font-black text-sm leading-none tracking-tight truncate">{config.nombreEmpresa || 'MPS'}</p>
                    <p className="text-slate-500 text-[9px] font-bold uppercase tracking-[0.15em] mt-0.5 truncate">{config.subtituloEmpresa || 'Producción'}</p>
                  </div>
                </div>
              </div>

              {/* Simulador de Cabecera de Reportes / Documento PDF */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
                <div className="flex items-center justify-between text-xs font-black uppercase text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Printer className="w-4 h-4 text-emerald-400" />
                    <span>Vista previa en Reportes & Impresión</span>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px]">DOCS & INFORMES</span>
                </div>
                
                {/* Cabecera Tipo Documento Oficial (Fondo claro o elegante) */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                    <div className="flex items-center gap-3">
                      {config.logoUrl ? (
                        <img src={config.logoUrl} alt="Logo Reporte" className="h-10 max-w-[130px] object-contain" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black">
                          MPS
                        </div>
                      )}
                      <div>
                        <h4 className="font-black text-white text-sm">{config.nombreEmpresa}</h4>
                        <p className="text-[10px] text-slate-400">{config.razonSocial || 'Smart MES Industrial S.L.'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20">
                        INFORME DE PRODUCCIÓN
                      </span>
                      <p className="text-[9px] text-slate-500 font-mono mt-1">Fecha: 14/07/2026 · Turno: Mañana</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 italic">
                    «{config.pieReportes}»
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── PESTAÑA 2: DATOS DE EMPRESA PARA REPORTES ── */}
        {activeTab === 'empresa' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-6 animate-fade-in">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-white text-lg">Información Fiscal y Datos para Informes</h3>
                <p className="text-xs text-slate-400">Estos campos se insertan en las cabeceras y pies de los reportes PDF del módulo de Informes</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Razón Social / Nombre Legal *
                </label>
                <input
                  type="text"
                  value={config.razonSocial || ''}
                  onChange={e => handleChange('razonSocial', e.target.value)}
                  placeholder="Ej: MPS Manufacturing Services S.L."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  CIF / NIF Identificador Fiscal
                </label>
                <input
                  type="text"
                  value={config.cif || ''}
                  onChange={e => handleChange('cif', e.target.value)}
                  placeholder="Ej: B-12345678"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Dirección Física de la Planta / Sede
              </label>
              <input
                type="text"
                value={config.direccion || ''}
                onChange={e => handleChange('direccion', e.target.value)}
                placeholder="Polígono Industrial Las Azucenas, Nave 4, 28001 Madrid"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Teléfono de Contacto
                </label>
                <input
                  type="text"
                  value={config.telefono || ''}
                  onChange={e => handleChange('telefono', e.target.value)}
                  placeholder="+34 910 123 456"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Correo Electrónico de Operaciones
                </label>
                <input
                  type="email"
                  value={config.emailContacto || ''}
                  onChange={e => handleChange('emailContacto', e.target.value)}
                  placeholder="operaciones@mpsproud.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Pie de Página Oficial (Legal / Certificación MES en Reportes)
              </label>
              <textarea
                rows="2"
                value={config.pieReportes || ''}
                onChange={e => handleChange('pieReportes', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 focus:outline-none focus:border-blue-500 leading-relaxed"
                placeholder="Texto legal que saldrá al final de cada informe emitido..."
              />
            </div>
          </div>
        )}

        {/* ── PESTAÑA 3: PARÁMETROS DEL SISTEMA & KPIS PLANTA ── */}
        {activeTab === 'sistema' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-6 animate-fade-in">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-white text-lg">Estándares Globales y KPIs de Planta</h3>
                <p className="text-xs text-slate-400">Parámetros de referencia para el cálculo de productividad OEE y costes</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Objetivo OEE Estándar de Planta (%)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={config.objetivoOEEPlanta || 85}
                    onChange={e => handleChange('objetivoOEEPlanta', Number(e.target.value))}
                    className="w-32 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-base font-black text-amber-400 focus:outline-none focus:border-amber-500 font-mono text-center"
                  />
                  <span className="text-xs text-slate-400">
                    % mínimo aceptado antes de marcar las líneas con alerta de bajo rendimiento
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Moneda de Costes y Scrap
                </label>
                <select
                  value={config.moneda || 'EUR'}
                  onChange={e => handleChange('moneda', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="EUR">Euros (€ - EUR)</option>
                  <option value="USD">Dólares ($ - USD)</option>
                  <option value="MXN">Pesos Mexicanos ($ - MXN)</option>
                  <option value="GBP">Libras Esterlinas (£ - GBP)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ── PESTAÑA 4: ORDEN DE LA BARRA DE NAVEGACIÓN LATERAL ── */}
        {activeTab === 'navegacion' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-white text-lg">Personalizar Orden y Visibilidad del Menú Lateral</h3>
                  <p className="text-xs text-slate-400">Desplaza los módulos hacia arriba o hacia abajo para priorizar lo más importante en tu fábrica. Los cambios se aplican inmediatamente.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={resetMenuOrder}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-2 transition-all active:scale-95 self-start md:self-auto"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Restaurar Orden por Defecto</span>
              </button>
            </div>

            <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {(Array.isArray(config.menuOrder) ? config.menuOrder : DEFAULT_MENU_ITEMS).map((item, idx, arr) => (
                  <motion.div
                    key={item.path}
                    layout
                    transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                      item.visible === false
                        ? 'bg-slate-950/40 border-slate-800/50 opacity-50'
                        : 'bg-slate-900 border-slate-700/80 hover:border-indigo-500/60 shadow-md'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-[11px] font-black font-mono text-indigo-300 flex-shrink-0">
                        #{String(idx + 1).padStart(2, '0')}
                      </span>
                      <div className="min-w-0 truncate">
                        <span className="text-sm font-black text-white block truncate">{item.label}</span>
                        <span className="text-[10px] text-slate-400 font-mono block truncate">{item.path}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleMenuVisibility(idx)}
                        title={item.visible === false ? 'Mostrar sección en el menú' : 'Ocultar sección del menú'}
                        className={`p-1.5 rounded-lg transition-colors ${
                          item.visible === false ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        {item.visible === false ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => moveMenuItemUp(idx)}
                        disabled={idx === 0}
                        title="Subir posición"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white disabled:opacity-20 disabled:hover:bg-slate-800 transition-all active:scale-90"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => moveMenuItemDown(idx)}
                        disabled={idx === arr.length - 1}
                        title="Bajar posición"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white disabled:opacity-20 disabled:hover:bg-slate-800 transition-all active:scale-90"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
