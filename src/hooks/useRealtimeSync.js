import { useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

/**
 * useRealtimeSync
 * Suscribe a los cambios en tiempo real de una tabla en Supabase.
 * Ignora la suscripción si Supabase no está configurado (modo local).
 * 
 * @param {string} tableName - Nombre de la tabla a escuchar.
 * @param {function} onChange - Función callback que se ejecuta al recibir cambios.
 */
export function useRealtimeSync(tableName, onChange) {
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const channel = supabase.channel(`realtime:${tableName}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, (payload) => {
        if (onChange) onChange(payload);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableName, onChange]);
}
