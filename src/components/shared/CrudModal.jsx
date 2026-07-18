import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Plus } from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';

/**
 * CrudModal — Modal genérico reutilizable para Crear / Editar entidades.
 *
 * Props:
 *   isOpen      {boolean}   — Mostrar o no el modal
 *   onClose     {fn}        — Llamado al cerrar sin guardar
 *   onSave      {fn(data)}  — Llamado con los datos del formulario al guardar
 *   title       {string}    — Título del modal (ej: "Nueva Línea")
 *   fields      {Array}     — Definición de campos del formulario
 *   initialData {Object}    — Valores iniciales (para editar)
 *   saving      {boolean}   — Deshabilitar botón mientras se guarda
 *   children    {ReactNode} — Contenido adicional opcional en el formulario
 */
export default function CrudModal({ isOpen, onClose, onSave, title, fields = [], initialData = {}, saving = false, children = null, onFormChange = null }) {
  const [formData, setFormData] = React.useState({});
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const initial = {};
      fields.forEach(f => {
        initial[f.key] = initialData[f.key] !== undefined ? initialData[f.key] : (f.default ?? (['multi-select', 'tag-list'].includes(f.type) ? [] : ''));
      });
      setFormData(initial);
      if (onFormChange) onFormChange(initial);
      setShowConfirm(false);
    }
  }, [isOpen, initialData]);

  const handleChange = (key, value) => setFormData(prev => {
    const next = { ...prev, [key]: value };
    if (onFormChange) onFormChange(next);
    return next;
  });

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    setShowConfirm(true);
  };

  const handleConfirmSave = () => {
    setShowConfirm(false);
    onSave(formData);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                  <Plus className="w-4 h-4 text-blue-400" />
                </div>
                <h3 className="text-white font-black text-base">{title}</h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {fields.map(field => {
                const isFullWidth = field.type === 'textarea' || field.type === 'bitacora' || field.type === 'gallery' || field.type === 'multi-select' || field.type === 'tag-list' || field.fullWidth;
                return (
                <div key={field.key} className={isFullWidth ? 'sm:col-span-2' : 'sm:col-span-1'}>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    {field.label}{field.required && <span className="text-red-400 ml-1">*</span>}
                  </label>

                  {field.type === 'select' && (
                    <select
                      value={formData[field.key] ?? ''}
                      onChange={e => handleChange(field.key, e.target.value)}
                      required={field.required}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                    >
                      {field.placeholder && <option value="">{field.placeholder}</option>}
                      {field.options?.map(o => {
                        const val = typeof o === 'object' ? o.value : o;
                        const label = typeof o === 'object' ? o.label : o;
                        return <option key={val} value={val}>{label}</option>;
                      })}
                    </select>
                  )}

                  {field.type === 'badge-select' && (
                    <div className="flex flex-wrap gap-2">
                      {field.options?.map(o => {
                        const val = typeof o === 'object' ? o.value : o;
                        const label = typeof o === 'object' ? o.label : o;
                        const active = formData[field.key] === val;
                        return (
                          <button
                            type="button"
                            key={val}
                            onClick={() => handleChange(field.key, val)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                              active
                                ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-900/40'
                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {field.type === 'textarea' && (
                    <textarea
                      value={formData[field.key] ?? ''}
                      onChange={e => handleChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      required={field.required}
                      rows={3}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                    />
                  )}

                  {/* multi-select: checkboxes para arrays */}
                  {field.type === 'multi-select' && (
                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 max-h-40 overflow-y-auto space-y-1.5">
                      {(field.options || []).map(opt => {
                        const val = typeof opt === 'object' ? opt.value : opt;
                        const label = typeof opt === 'object' ? opt.label : opt;
                        const current = Array.isArray(formData[field.key]) ? formData[field.key] : [];
                        const checked = current.includes(val);
                        return (
                          <label key={val} className="flex items-center gap-2.5 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                const next = checked
                                  ? current.filter(v => v !== val)
                                  : [...current, val];
                                handleChange(field.key, next);
                              }}
                              className="w-4 h-4 rounded accent-blue-500"
                            />
                            <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{label}</span>
                          </label>
                        );
                      })}
                      {(!field.options || field.options.length === 0) && (
                        <p className="text-xs text-slate-500 italic">No hay opciones disponibles</p>
                      )}
                    </div>
                  )}

                  {/* tag-list: añadir/eliminar ítems de texto en un array */}
                  {field.type === 'tag-list' && (
                    <TagListField
                      value={Array.isArray(formData[field.key]) ? formData[field.key] : []}
                      onChange={val => handleChange(field.key, val)}
                      placeholder={field.placeholder || 'Añadir ítem...'}
                    />
                  )}

                  
                  {/* bitacora: Lista de logs cronologicos */}
                  {field.type === 'bitacora' && (
                    <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                      <div className="max-h-64 overflow-y-auto pr-2 space-y-3">
                        {(!formData[field.key] || formData[field.key].length === 0) ? (
                          <p className="text-xs text-slate-500 italic">No hay entradas en la bitácora.</p>
                        ) : (
                          [...(formData[field.key] || [])].reverse().map(entry => (
                            <div key={entry.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-sm">
                              <div className="flex justify-between items-start mb-1.5">
                                <span className="text-[11px] font-black text-blue-400 bg-blue-900/20 px-2 py-0.5 rounded-full">{entry.autor || 'Sistema'}</span>
                                <span className="text-[10px] text-slate-500 font-medium">
                                  {new Date(entry.fecha).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-sm text-slate-300 leading-relaxed break-words">{entry.texto}</p>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
                        <textarea
                          id={`bitacora-input-${field.key}`}
                          placeholder="Añadir una nueva nota a la intervención..."
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none h-16"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.getElementById(`bitacora-input-${field.key}`);
                            if (!input || !input.value.trim()) return;
                            const current = Array.isArray(formData[field.key]) ? formData[field.key] : [];
                            const newEntry = {
                              id: Date.now().toString(),
                              fecha: new Date().toISOString(),
                              autor: field.userContext || 'Técnico',
                              texto: input.value.trim()
                            };
                            handleChange(field.key, [...current, newEntry]);
                            input.value = '';
                          }}
                          className="self-end px-4 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-bold transition-colors"
                        >
                          Añadir Nota
                        </button>
                      </div>
                    </div>
                  )}

                  {/* gallery: Multiples fotos etiquetadas */}
                  {field.type === 'gallery' && (
                    <div className="space-y-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl cursor-pointer transition-colors border border-slate-700 shadow-sm text-xs font-bold">
                          <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                          Tomar o Adjuntar Foto
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const dataUrl = event.target.result;
                                const current = Array.isArray(formData[field.key]) ? formData[field.key] : [];
                                const newPic = {
                                  id: Date.now().toString(),
                                  fecha: new Date().toISOString(),
                                  dataUrl: dataUrl,
                                  etiqueta: 'Evidencia visual'
                                };
                                handleChange(field.key, [...current, newPic]);
                              };
                              reader.readAsDataURL(file);
                            }}
                          />
                        </label>
                      </div>
                      
                      {Array.isArray(formData[field.key]) && formData[field.key].length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {formData[field.key].map(pic => (
                            <div key={pic.id} className="relative group rounded-xl overflow-hidden border border-slate-700 bg-slate-900 shadow-sm aspect-square">
                              <img src={pic.dataUrl} alt="Evidencia" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-between">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const current = formData[field.key].filter(p => p.id !== pic.id);
                                    handleChange(field.key, current);
                                  }}
                                  className="self-end p-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded-lg shadow transition-colors"
                                  title="Eliminar foto"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                                
                                <select
                                  value={pic.etiqueta}
                                  onChange={(e) => {
                                    const current = formData[field.key].map(p => p.id === pic.id ? { ...p, etiqueta: e.target.value } : p);
                                    handleChange(field.key, current);
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-full bg-slate-800/90 text-xs text-white border-0 rounded p-1 focus:ring-1 focus:ring-blue-500 truncate"
                                >
                                  <option value="Antes">Antes</option>
                                  <option value="Durante">Durante</option>
                                  <option value="Después">Después</option>
                                  <option value="Detalle del fallo">Detalle del fallo</option>
                                  <option value="Evidencia visual">Evidencia</option>
                                </select>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}


                  {/* image_upload: subida de archivos de imagen locales con FileReader y preview */}
                  {field.type === 'image_upload' && (
                    <div className="space-y-2.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                      <div className="flex items-center gap-4">
                        {formData[field.key] ? (
                          <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-700 shadow-md flex-shrink-0 bg-slate-900">
                            <img src={formData[field.key]} alt="Vista previa" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => handleChange(field.key, '')}
                              className="absolute top-1 right-1 p-1 bg-red-600/90 hover:bg-red-600 text-white rounded-full shadow transition-colors"
                              title="Eliminar imagen"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-xl border border-dashed border-slate-700 bg-slate-800/40 flex items-center justify-center text-slate-500 text-[10px] flex-shrink-0 text-center p-1 font-semibold">
                            Sin foto
                          </div>
                        )}
                        <div className="flex-1">
                          <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white font-black text-xs transition-all border border-blue-500/30 shadow-sm">
                            <span>{formData[field.key] ? '🔄 Cambiar archivo de imagen' : '📷 Subir archivo de imagen'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={e => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const reader = new FileReader();
                                reader.onload = event => {
                                  handleChange(field.key, event.target.result);
                                };
                                reader.readAsDataURL(file);
                              }}
                            />
                          </label>
                          <p className="text-[10px] text-slate-400 mt-1 font-medium">
                            Sube cualquier archivo (PNG, JPG, SVG, WEBP). Se vinculará para rápida identificación.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {!['select', 'badge-select', 'textarea', 'multi-select', 'tag-list', 'image_upload'].includes(field.type) && (
                    <input
                      type={field.type || 'text'}
                      value={formData[field.key] ?? ''}
                      onChange={e => handleChange(field.key, field.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)}
                      placeholder={field.placeholder}
                      required={field.required}
                      step={field.step}
                      min={field.min}
                      max={field.max}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  )}
                </div>
                );
              })}

              {children && (
                <div className="pt-3 border-t border-slate-800">
                  {children}
                </div>
              )}
            </form>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-900/50">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-black bg-blue-600 hover:bg-blue-500 text-white transition-all disabled:opacity-60 shadow-lg shadow-blue-900/40"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Popup Global de Confirmación de Guardado */}
      <ConfirmDialog
        isOpen={showConfirm}
        title="Confirmar Guardado"
        message="¿Estás seguro de que quieres guardar los datos introducidos?"
        onConfirm={handleConfirmSave}
        onCancel={() => setShowConfirm(false)}
        isDestructive={false}
        confirmText="Sí, Guardar"
      />
    </AnimatePresence>
  );
}

// Subcomponente para campo de lista de etiquetas
function TagListField({ value, onChange, placeholder }) {
  const [inputVal, setInputVal] = React.useState('');
  const [editingIndex, setEditingIndex] = React.useState(null);
  const [editingVal, setEditingVal] = React.useState('');

  const addItem = () => {
    const trimmed = inputVal.trim();
    if (!trimmed) return;
    onChange([...value, trimmed]);
    setInputVal('');
  };

  const removeItem = (idx) => onChange(value.filter((_, i) => i !== idx));

  const startEdit = (idx) => { setEditingIndex(idx); setEditingVal(value[idx]); };
  const saveEdit = () => {
    if (editingVal.trim()) {
      onChange(value.map((v, i) => i === editingIndex ? editingVal.trim() : v));
    }
    setEditingIndex(null);
    setEditingVal('');
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addItem(); } }}
          placeholder={placeholder}
          className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
        />
        <button
          type="button"
          onClick={addItem}
          className="px-3 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/30 text-xs font-black transition-all"
        >
          + Añadir
        </button>
      </div>
      {value.length > 0 && (
        <div className="space-y-1 max-h-36 overflow-y-auto">
          {value.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 p-2 bg-slate-800/60 rounded-lg border border-slate-700/60 group">
              {editingIndex === idx ? (
                <>
                  <input
                    autoFocus
                    type="text"
                    value={editingVal}
                    onChange={e => setEditingVal(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); saveEdit(); } if (e.key === 'Escape') { setEditingIndex(null); } }}
                    className="flex-1 bg-slate-700 border border-blue-500/50 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                  />
                  <button type="button" onClick={saveEdit} className="text-[10px] px-2 py-1 rounded bg-blue-600/30 text-blue-400 font-bold hover:bg-blue-600/50">✓</button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-xs text-slate-300">{item}</span>
                  <button type="button" onClick={() => startEdit(idx)} className="opacity-0 group-hover:opacity-100 text-[10px] px-2 py-0.5 rounded bg-slate-700 text-slate-400 hover:text-white transition-all">✏</button>
                  <button type="button" onClick={() => removeItem(idx)} className="opacity-0 group-hover:opacity-100 text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all">✕</button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
