import React, { useState } from 'react';
import { Lightbulb, Plus, Check, X, Clock, Upload, XCircle, ArrowRight } from 'lucide-react';
import { updateKaizen } from '@/services/dataService';
import { useAuth } from '@/context/AuthContext';

export default function Kaizen({ data, reload }) {
  const { perfil } = useAuth();
  const userName = perfil?.nombre || perfil?.email || 'Usuario';
  const [draggedItem, setDraggedItem] = useState(null);
  const [evalModal, setEvalModal] = useState(null); // { id, newStatus }

  const columnas = [
    { id: 'propuesta', titulo: 'Nuevas Propuestas', color: 'border-blue-500' },
    { id: 'en_evaluacion', titulo: 'En Evaluación', color: 'border-amber-500' },
    { id: 'aprobada', titulo: 'Aprobadas', color: 'border-emerald-500' },
    { id: 'implementada', titulo: 'Implementadas', color: 'border-purple-500' },
    { id: 'rechazada', titulo: 'Rechazadas', color: 'border-red-500' },
  ];

  const handleDragStart = (e, item) => {
    setDraggedItem(item);
  };

  const handleDrop = (e, colId) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.estado === colId) return;

    if (['en_evaluacion', 'aprobada', 'rechazada', 'implementada'].includes(colId)) {
      setEvalModal({ id: draggedItem.id, newStatus: colId });
    } else {
      updateItemStatus(draggedItem.id, colId);
    }
    setDraggedItem(null);
  };

  const updateItemStatus = async (id, status, extra = {}) => {
    await updateKaizen(id, { estado: status, ...extra });
    reload();
    setEvalModal(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
        {columnas.map(col => {
          const items = data.filter(k => k.estado === col.id);
          return (
            <div
              key={col.id}
              className={`flex-shrink-0 w-80 bg-slate-900 border-t-4 ${col.color} rounded-2xl flex flex-col max-h-[70vh] snap-center`}
              onDragOver={e => e.preventDefault()}
              onDrop={e => handleDrop(e, col.id)}
            >
              <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 rounded-t-2xl">
                <h3 className="font-black text-white text-sm uppercase tracking-wide">{col.titulo}</h3>
                <span className="bg-slate-800 text-slate-300 text-xs font-bold px-2 py-0.5 rounded-full">
                  {items.length}
                </span>
              </div>
              <div className="p-3 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                {items.map(item => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={e => handleDragStart(e, item)}
                    className="bg-slate-800 hover:bg-slate-750 p-4 rounded-xl border border-slate-700 shadow-md cursor-grab active:cursor-grabbing transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-md ${
                        item.categoria === 'seguridad' ? 'bg-red-500/20 text-red-400' :
                        item.categoria === 'calidad' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-amber-500/20 text-amber-400'
                      }`}>
                        {item.categoria}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">#{item.id.slice(0,5)}</span>
                    </div>
                    <h4 className="font-bold text-white text-sm mb-1">{item.titulo}</h4>
                    <p className="text-xs text-slate-400 line-clamp-2">{item.descripcion}</p>
                    <div className="mt-3 flex items-center justify-between text-[10px] font-bold text-slate-500">
                      <span>Línea: {item.linea}</span>
                      <span>Por: OP-{item.proponente}</span>
                    </div>
                  </div>
                ))}
                {items.length === 0 && (
                  <div className="text-center py-8 text-slate-500 text-xs font-bold border-2 border-dashed border-slate-800 rounded-xl">
                    Arrastra aquí
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {evalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-black text-white mb-2">Actualizar Estado de Mejora</h3>
            <p className="text-sm text-slate-400 mb-4">
              Moviendo a: <strong className="text-white uppercase">{evalModal.newStatus.replace('_', ' ')}</strong>
            </p>
            <form onSubmit={e => {
              e.preventDefault();
              const comentario = e.target.comentario.value;
              updateItemStatus(evalModal.id, evalModal.newStatus, { 
                evaluador: userName,
                comentarioEvaluacion: comentario,
                fechaEvaluacion: new Date().toISOString()
              });
            }}>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Comentario de Evaluación / Implementación</label>
                  <textarea 
                    name="comentario" 
                    required 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-500 h-24"
                    placeholder="Escribe el porqué de esta decisión..."
                  ></textarea>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button 
                  type="button" 
                  onClick={() => setEvalModal(null)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white font-bold text-sm"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm shadow-lg shadow-amber-900/50"
                >
                  Confirmar Cambio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
