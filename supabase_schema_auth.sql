-- ==============================================================================
-- ESQUEMA DE AUTENTICACIÓN Y ROLES (Supabase Auth)
-- ==============================================================================
-- Ejecuta este script en el SQL Editor de Supabase para crear la tabla de perfiles.
-- ==============================================================================

-- 1. Crear tabla perfiles vinculada a auth.users
CREATE TABLE IF NOT EXISTS public.perfiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT,
  rol TEXT NOT NULL DEFAULT 'operario', -- 'admin' | 'supervisor' | 'operario' | 'calidad' | 'mantenimiento'
  operario_id TEXT, -- referencia opcional al id de operarios (mockOperarios/tabla operarios)
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Configurar RLS (Row Level Security)
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;

-- Política 1: Todos los usuarios autenticados pueden leer su propio perfil
CREATE POLICY "Los usuarios pueden ver su propio perfil" 
  ON public.perfiles FOR SELECT 
  USING (auth.uid() = id);

-- Política 2: Solo los administradores pueden leer y editar todos los perfiles
-- (asumimos que verificamos el rol del propio usuario que hace la petición)
CREATE POLICY "Los administradores pueden gestionar todos los perfiles" 
  ON public.perfiles FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- ==============================================================================
-- INSTRUCCIONES PARA CREAR EL PRIMER ADMINISTRADOR:
-- 1. Ve al panel de Supabase: Authentication -> Users -> Add user
-- 2. Crea un usuario con email y contraseña.
-- 3. Ve a Table Editor -> perfiles (si no se crea automáticamente mediante un trigger, insértalo a mano).
-- 4. Inserta una fila en public.perfiles con:
--    id = [el UUID del usuario que acabas de crear]
--    nombre = 'Administrador Principal'
--    rol = 'admin'
--    activo = true
-- ==============================================================================
