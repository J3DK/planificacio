import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mock development admin logic
  const mockAdminPerfil = {
    id: 'mock-dev-id',
    nombre: 'Modo Desarrollo (Demo)',
    rol: 'admin',
    activo: true
  };

  useEffect(() => {
    let subscription;

    async function loadSession() {
      try {
        if (!isSupabaseConfigured()) {
          // Entorno de desarrollo sin Supabase configurado (mock)
          setUser({ id: 'mock-dev-id', email: 'dev@localhost' });
          setPerfil(mockAdminPerfil);
          return;
        }

        // Obtener sesión activa
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (session?.user) {
          setUser(session.user);
          await fetchPerfil(session.user.id);
        } else {
          setUser(null);
          setPerfil(null);
        }

        // Suscribirse a cambios de auth
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
          if (currentSession?.user) {
            setUser(currentSession.user);
            await fetchPerfil(currentSession.user.id);
          } else {
            setUser(null);
            setPerfil(null);
          }
          setLoading(false);
        });
        
        subscription = authListener.subscription;
      } catch (err) {
        console.error('Error cargando sesión de Supabase:', err);
      } finally {
        setLoading(false);
      }
    }

    loadSession();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  async function fetchPerfil(userId) {
    if (!isSupabaseConfigured()) return;
    try {
      const { data, error } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error && error.code !== 'PGRST116') {
        console.error('Error obteniendo perfil:', error);
      }
      setPerfil(data || null);
    } catch (err) {
      console.error('Excepción obteniendo perfil:', err);
    }
  }

  async function signIn(email, password) {
    if (!isSupabaseConfigured()) {
      // Si no está configurado, simulamos el login como admin
      console.warn("Supabase no configurado: Login simulado como Admin.");
      setUser({ id: 'mock-dev-id', email });
      setPerfil(mockAdminPerfil);
      return { error: null };
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  }

  async function signOut() {
    if (!isSupabaseConfigured()) {
      setUser(null);
      setPerfil(null);
      return { error: null };
    }
    const { error } = await supabase.auth.signOut();
    return { error };
  }

  const value = {
    user,
    perfil,
    loading,
    signIn,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
