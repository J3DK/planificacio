import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, X, AlertTriangle } from 'lucide-react';

/**
 * ConfirmDialog — Diálogo de confirmación para eliminar registros.
 *
 * Props:
 *   isOpen    {boolean}   — Mostrar o no el diálogo
 *   onClose   {fn}        — Cancelar
 *   onConfirm {fn}        — Confirmar la eliminación
 *   title     {string}    — Título del diálogo (ej: "Eliminar Línea 3")
 *   message   {string}    — Mensaje descriptivo
 *   deleting  {boolean}   — True mientras se procesa la eliminación
 */
export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, deleting = false }) {
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
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 12 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="relative w-full max-w-sm bg-slate-900 border border-red-500/30 rounded-2xl shadow-2xl shadow-red-900/20 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Top danger bar */}
            <div className="h-1 w-full bg-gradient-to-r from-red-600 to-red-400" />

            {/* Content */}
            <div className="px-6 pt-6 pb-5">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-white font-black text-base leading-tight">{title}</h3>
                  <p className="text-slate-400 text-sm mt-1 leading-relaxed">{message}</p>
                </div>
                <button
                  onClick={onClose}
                  className="ml-auto p-1 text-slate-600 hover:text-slate-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 mb-5">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                <p className="text-xs text-red-400 font-semibold">Esta acción no se puede deshacer.</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={onConfirm}
                  disabled={deleting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black bg-red-600 hover:bg-red-500 text-white transition-all disabled:opacity-60 shadow-lg shadow-red-900/40"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {deleting ? 'Eliminando…' : 'Eliminar'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
