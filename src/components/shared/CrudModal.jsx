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
 *
 * Cada campo en `fields`:
 *   { key, label, type: 'text'|'number'|'select'|'textarea'|'badge-select', options?, placeholder?, required? }
 */
export default function CrudModal({ isOpen, onClose, onSave, title, fields = [], initialData = {}, saving = false }) {
  const [formData, setFormData] = React.useState({});

  useEffect(() => {
    if (isOpen) {
      const initial = {};
      fields.forEach(f => {
        initial[f.key] = initialData[f.key] !== undefined ? initialData[f.key] : (f.default ?? '');
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
                      {field.options?.map(o => (
                        <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
                      ))}
                    </select>
                  )}

                  {field.type === 'textarea' && (
                    <textarea
                      value={formData[field.key] ?? ''}
                      onChange={e => handleChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      required={field.required}
                      rows={3}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors resize-none"
                    />
                  )}

                  {(field.type === 'text' || field.type === 'number' || !field.type) && (
                    <input
                      type={field.type || 'text'}
                      value={formData[field.key] ?? ''}
                      onChange={e => handleChange(field.key, field.type === 'number' ? Number(e.target.value) : e.target.value)}
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
                type="submit"
                form="crud-form"
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
