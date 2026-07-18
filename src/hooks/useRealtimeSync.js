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

    // Use a unique channel name per hook instance to prevent
    // "cannot add postgres_changes callbacks after subscribe()" errors
    // when multiple components listen to the same table or React StrictMode re-mounts.
    const channelName = `realtime:${tableName}:${Math.random().toString(36).substring(2, 9)}`;

    const channel = supabase.channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, (payload) => {
        if (onChange) onChange(payload);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableName]); // Remove onChange from deps to avoid re-subscribing if onChange changes without useCallback

}
