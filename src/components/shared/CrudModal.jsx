import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Plus } from 'lucide-react';

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
export default function CrudModal({ isOpen, onClose, onSave, title, fields = [], initialData = {}, saving = false, children = null }) {
  const [formData, setFormData] = React.useState({});

  useEffect(() => {
    if (isOpen) {
      const initial = {};
      fields.forEach(f => {
        initial[f.key] = initialData[f.key] !== undefined ? initialData[f.key] : (f.default ?? (['multi-select', 'tag-list'].includes(f.type) ? [] : ''));
      });
      setFormData(initial);
    }
  }, [isOpen, initialData]);

  const handleChange = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
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
            className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden"
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
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {fields.map(field => (
                <div key={field.key}>
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

                  {!['select', 'badge-select', 'textarea', 'multi-select', 'tag-list'].includes(field.type) && (
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
              ))}

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
