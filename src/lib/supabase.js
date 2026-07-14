import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Inicializa el cliente de Supabase solo si las credenciales están configuradas en .env
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Comprueba si el cliente de Supabase está listo para ser utilizado
 * @returns {boolean}
 */
export const isSupabaseConfigured = () => Boolean(supabase);
