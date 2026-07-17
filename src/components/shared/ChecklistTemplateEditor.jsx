import React, { useState } from 'react';
import { CheckSquare, Plus, Trash2, Edit2, Check, X, AlertTriangle, ArrowUp, ArrowDown } from 'lucide-react';

export default function ChecklistTemplateEditor({ items = [], onChange }) {
  const [newTexto, setNewTexto] = useState('');
  const [newCritico, setNewCritico] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingTexto, setEditingTexto] = useState('');
  const [editingCritico, setEditingCritico] = useState(false);

  const handleAdd = (e) => {
    if (e) e.preventDefault();
    const txt = newTexto.trim();
    if (!txt) return;

    const newItem = {
      id: `IT-${Date.now().toString().slice(-4)}-${items.length + 1}`,
      texto: txt,
      orden: items.length + 1,
      critico: newCritico
    };

    onChange([...items, newItem]);
    setNewTexto('');
    setNewCritico(false);
  };

  const handleStartEdit = (idx, item) => {
    setEditingIndex(idx);
    setEditingTexto(item.texto || '');
    setEditingCritico(item.critico || false);
  };

  const handleSaveEdit = (idx) => {
    if (!editingTexto.trim()) return;
    const updated = items.map((it, i) => i === idx ? { ...it, texto: editingTexto.trim(), critico: editingCritico } : it);
    onChange(updated);
    setEditingIndex(null);
  };

  const handleRemove = (idx) => {
    const updated = items.filter((_, i) => i !== idx).map((it, i) => ({ ...it, orden: i + 1 }));
    onChange(updated);
  };

  const handleMove = (idx, direction) => {
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= items.length) return;
    const updated = [...items];
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;
    // recalcular orden
    const reordered = updated.map((it, i) => ({ ...it, orden: i + 1 }));
    onChange(reordered);
  };

  return (
    <div className="space-y-4 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-emerald-400" /> Puntos de Verificación / Tareas ({items.length})
        </span>
        <span className="text-[11px] text-slate-400 font-medium">Marca con ⚡ si el punto es crítico</span>
      </div>

      {/* Lista de Ítems */}
      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
        {items.map((item, idx) => {
          const isEditing = editingIndex === idx;
          return (
            <div
              key={item.id || idx}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                item.critico ? 'bg-red-950/20 border-red-500/40' : 'bg-slate-900/90 border-slate-800'
              }`}
            >
              {isEditing ? (
                <div className="flex items-center gap-2 flex-1 w-full flex-wrap sm:flex-nowrap">
                  <input
                    type="text"
                    value={editingTexto}
                    onChange={e => setEditingTexto(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') { e.preventDefault(); handleSaveEdit(idx); }
                      if (e.key === 'Escape') setEditingIndex(null);
                    }}
                    autoFocus
                    className="flex-1 bg-slate-950 border border-emerald-500 rounded-lg px-3 py-1.5 text-xs text-white font-bold focus:outline-none"
                  />
                  <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-500/20 text-red-300 text-xs font-black cursor-pointer border border-red-500/30">
                    <input
                      type="checkbox"
                      checked={editingCritico}
                      onChange={e => setEditingCritico(e.target.checked)}
                      className="rounded bg-slate-900 border-red-500 text-red-600 focus:ring-0"
                    />
                    ⚡ Crítico
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(idx)}
                      className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors"
                      title="Guardar"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingIndex(null)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs transition-colors"
                      title="Cancelar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between w-full gap-3">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-400 font-mono font-bold text-xs flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-200 truncate">{item.texto}</span>
                    {item.critico && (
                      <span className="px-2 py-0.5 rounded-md bg-red-500/20 border border-red-500/40 text-red-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 flex-shrink-0">
                        <AlertTriangle className="w-3 h-3" /> Crítico
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleMove(idx, -1)}
                      disabled={idx === 0}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 disabled:opacity-30 disabled:pointer-events-none"
                      title="Subir"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMove(idx, 1)}
                      disabled={idx === items.length - 1}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 disabled:opacity-30 disabled:pointer-events-none"
                      title="Bajar"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStartEdit(idx, item)}
                      className="p-1.5 rounded bg-slate-800 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 transition-colors"
                      title="Editar ítem"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(idx)}
                      className="p-1.5 rounded bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                      title="Eliminar ítem"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {items.length === 0 && (
          <div className="text-center py-6 text-slate-500 text-xs italic">
            No hay puntos de verificación en esta plantilla. Añade el primero abajo.
          </div>
        )}
      </div>

      {/* Formulario de añadir nuevo ítem */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
        <input
          type="text"
          value={newTexto}
          onChange={e => setNewTexto(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
          placeholder="Escribe el nuevo punto de inspección o tarea..."
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-bold focus:outline-none focus:border-emerald-500"
        />
        <label
          onClick={() => setNewCritico(!newCritico)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black cursor-pointer border transition-all select-none ${
            newCritico
              ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-900/50'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" /> Crítico
        </label>
        <button
          type="button"
          onClick={handleAdd}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-900/40 flex items-center gap-1 transition-all active:scale-95 flex-shrink-0"
        >
          <Plus className="w-4 h-4" /> Añadir
        </button>
      </div>
    </div>
  );
}
