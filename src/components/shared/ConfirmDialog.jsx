import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, X, AlertTriangle, Save, Info } from 'lucide-react';

/**
 * ConfirmDialog — Diálogo de confirmación para eliminar o guardar registros.
 *
 * Props:
 *   isOpen        {boolean}   — Mostrar o no el diálogo
 *   onCancel      {fn}        — Cancelar (o onClose)
 *   onConfirm     {fn}        — Confirmar la acción
 *   title         {string}    — Título del diálogo
 *   message       {string}    — Mensaje descriptivo
 *   isDestructive {boolean}   — True para eliminar (rojo), False para guardar/confirmar (azul)
 *   confirmText   {string}    — Texto del botón de confirmar
 */
export default function ConfirmDialog({ 
  isOpen, onClose, onCancel, onConfirm, title, message, 
  deleting = false, isDestructive = true, confirmText 
}) {
  const handleCancel = onCancel || onClose;
  const isDanger = isDestructive;
  const finalConfirmText = confirmText || (isDanger ? (deleting ? 'Eliminando…' : 'Eliminar') : 'Confirmar');

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={handleCancel}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 12 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={`relative w-full max-w-sm bg-slate-900 border rounded-2xl shadow-2xl overflow-hidden ${
              isDanger ? 'border-red-500/30 shadow-red-900/20' : 'border-blue-500/30 shadow-blue-900/20'
            }`}
            onClick={e => e.stopPropagation()}
          >
            {/* Top bar */}
            <div className={`h-1 w-full bg-gradient-to-r ${
              isDanger ? 'from-red-600 to-red-400' : 'from-blue-600 to-blue-400'
            }`} />

            {/* Content */}
            <div className="px-6 pt-6 pb-5">
              <div className="flex items-start gap-4 mb-4">
                <div className={`flex-shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center ${
                  isDanger ? 'bg-red-500/15 border-red-500/30' : 'bg-blue-500/15 border-blue-500/30'
                }`}>
                  {isDanger ? <Trash2 className="w-5 h-5 text-red-400" /> : <Info className="w-5 h-5 text-blue-400" />}
                </div>
                <div>
                  <h3 className="text-white font-black text-base leading-tight">{title}</h3>
                  <p className="text-slate-400 text-sm mt-1 leading-relaxed">{message}</p>
                </div>
                <button
                  onClick={handleCancel}
                  className="ml-auto p-1 text-slate-600 hover:text-slate-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {isDanger && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 mb-5">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                  <p className="text-xs text-red-400 font-semibold">Esta acción no se puede deshacer.</p>
                </div>
              )}

              <div className="flex gap-3 mt-5">
                <button
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={onConfirm}
                  disabled={deleting}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black text-white transition-all disabled:opacity-60 shadow-lg ${
                    isDanger 
                      ? 'bg-red-600 hover:bg-red-500 shadow-red-900/40' 
                      : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/40'
                  }`}
                >
                  {isDanger ? <Trash2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                  {finalConfirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
