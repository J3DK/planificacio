import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Search, RefreshCw, Eye } from 'lucide-react';
import { fetchAuditoria } from '@/services/dataService';
import StatusBadge from '@/components/shared/StatusBadge';

export default function Auditoria() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const loadData = async () => {
    setLoading(true);
    const { data } = await fetchAuditoria();
    if (data) setLogs(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredLogs = logs.filter(log => 
    log.tabla.toLowerCase().includes(filter.toLowerCase()) ||
    log.accion.toLowerCase().includes(filter.toLowerCase()) ||
    (log.usuario_nombre || '').toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
            <Activity className="w-8 h-8 text-blue-500" />
            Registro de Auditoría
          </h1>
          <p className="text-slate-400 mt-1">
            Trazabilidad de cambios críticos en el sistema.
          </p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all font-bold text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-400' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* Buscador */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Buscar por tabla, acción o usuario..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full bg-slate-900/50 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Tabla */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-300">
            <thead className="text-xs text-slate-400 uppercase bg-slate-900/80 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 font-bold">Fecha</th>
                <th className="px-6 py-4 font-bold">Usuario</th>
                <th className="px-6 py-4 font-bold">Tabla / Entidad</th>
                <th className="px-6 py-4 font-bold">Acción</th>
                <th className="px-6 py-4 font-bold text-right">Cambios</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <motion.tr
                  key={log.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-b border-slate-800/50 hover:bg-slate-800/50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-medium text-slate-200">
                      {new Date(log.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-200">{log.usuario_nombre || 'Desconocido'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-white">{log.tabla}</div>
                    <div className="text-xs text-slate-500 mt-0.5">ID: {log.registro_id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge
                      status={log.accion === 'insert' ? 'completado' : log.accion === 'update' ? 'en_curso' : 'critica'}
                      text={log.accion.toUpperCase()}
                    />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="max-w-[200px] inline-block truncate bg-slate-950 p-2 rounded border border-slate-800 text-xs font-mono text-slate-400">
                      {JSON.stringify(log.cambios)}
                    </div>
                  </td>
                </motion.tr>
              ))}
              {filteredLogs.length === 0 && !loading && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    No hay registros de auditoría que coincidan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
