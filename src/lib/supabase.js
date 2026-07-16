import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Detecta si estamos en entorno de test (Vitest/Node)
const isTestEnv = (typeof process !== 'undefined' && (process.env.VITEST === 'true' || process.env.NODE_ENV === 'test')) || Boolean(import.meta.env.VITEST);

// Inicializa el cliente de Supabase solo si las credenciales están configuradas y no es entorno de test local
export const supabase = (supabaseUrl && supabaseAnonKey && !isTestEnv)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Comprueba si el cliente de Supabase está listo para ser utilizado
 * @returns {boolean}
 */
export const isSupabaseConfigured = () => Boolean(supabase);
