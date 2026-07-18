import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Shield, ShieldAlert, Users as UsersIcon, Check, X, AlertCircle } from 'lucide-react';

export default function Usuarios() {
  const [perfiles, setPerfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadPerfiles();
  }, []);

  async function loadPerfiles() {
    if (!isSupabaseConfigured()) {
      setPerfiles([
        { id: 'mock-1', nombre: 'Administrador Demo', rol: 'admin', activo: true, email: 'admin@demo.com' },
        { id: 'mock-2', nombre: 'Operario Demo', rol: 'operario', activo: true, email: 'operario@demo.com' }
      ]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.from('perfiles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setPerfiles(data || []);
    } catch (err) {
      console.error(err);
      setErrorMsg('Error al cargar perfiles.');
    } finally {
      setLoading(false);
    }
  }

  async function updateRol(id, nuevoRol) {
    if (!isSupabaseConfigured()) {
      setPerfiles(prev => prev.map(p => p.id === id ? { ...p, rol: nuevoRol } : p));
      return;
    }
    const { error } = await supabase.from('perfiles').update({ rol: nuevoRol }).eq('id', id);
    if (!error) {
      setPerfiles(prev => prev.map(p => p.id === id ? { ...p, rol: nuevoRol } : p));
    } else {
      alert('Error al actualizar rol');
    }
  }

  async function toggleActivo(id, estadoActual) {
    if (!isSupabaseConfigured()) {
      setPerfiles(prev => prev.map(p => p.id === id ? { ...p, activo: !estadoActual } : p));
      return;
    }
    const { error } = await supabase.from('perfiles').update({ activo: !estadoActual }).eq('id', id);
    if (!error) {
      setPerfiles(prev => prev.map(p => p.id === id ? { ...p, activo: !estadoActual } : p));
    } else {
      alert('Error al actualizar estado');
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-inner">
            <UsersIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">Gestión de Accesos y Roles</h1>
            <p className="text-xs text-slate-400 mt-1">
              Asigna permisos y roles a los usuarios registrados en Supabase Auth
            </p>
          </div>
        </div>
      </div>

      {!isSupabaseConfigured() && (
        <div className="bg-amber-500/10 border-l-4 border-amber-500 p-4 rounded-r-2xl">
          <p className="text-xs font-bold text-amber-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> Entorno de Desarrollo (Mock)
          </p>
          <p className="text-[11px] text-amber-200 mt-1">
            Supabase no está configurado. Los datos mostrados son de prueba y no se guardarán en la base de datos.
          </p>
        </div>
      )}

      {errorMsg && <div className="text-red-400 text-sm font-bold">{errorMsg}</div>}

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400">
              <tr>
                <th className="p-4 font-black">ID (Auth)</th>
                <th className="p-4 font-black">Nombre</th>
                <th className="p-4 font-black">Rol Asignado</th>
                <th className="p-4 font-black text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr><td colSpan="4" className="p-8 text-center text-slate-500 animate-pulse">Cargando perfiles...</td></tr>
              ) : perfiles.map(p => (
                <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 font-mono text-[10px] text-slate-500">{p.id}</td>
                  <td className="p-4">
                    <div className="font-bold text-white">{p.nombre || 'Sin nombre'}</div>
                    {p.email && <div className="text-xs text-slate-500">{p.email}</div>}
                  </td>
                  <td className="p-4">
                    <select
                      value={p.rol}
                      onChange={(e) => updateRol(p.id, e.target.value)}
                      className="bg-slate-950 border border-slate-700 text-slate-200 text-xs font-bold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="admin">Administrador</option>
                      <option value="supervisor">Supervisor</option>
                      <option value="mantenimiento">Mantenimiento</option>
                      <option value="calidad">Calidad (QC)</option>
                      <option value="operario">Operario</option>
                    </select>
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => toggleActivo(p.id, p.activo)}
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase transition-colors ${
                        p.activo ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                      }`}
                    >
                      {p.activo ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                </tr>
              ))}
              {perfiles.length === 0 && !loading && (
                <tr><td colSpan="4" className="p-8 text-center text-slate-500">No hay perfiles registrados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
