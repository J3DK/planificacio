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

-- Política 1: Lectura abierta para evitar bucles de recursión
CREATE POLICY "Lectura libre para autenticados" 
  ON public.perfiles FOR SELECT 
  USING (true);

-- Política 2: Solo los administradores pueden modificar perfiles
CREATE POLICY "Admin Update" 
  ON public.perfiles FOR UPDATE 
  USING ( (SELECT rol FROM public.perfiles WHERE id = auth.uid()) = 'admin' );

CREATE POLICY "Admin Insert" 
  ON public.perfiles FOR INSERT 
  WITH CHECK ( (SELECT rol FROM public.perfiles WHERE id = auth.uid()) = 'admin' );

CREATE POLICY "Admin Delete" 
  ON public.perfiles FOR DELETE 
  USING ( (SELECT rol FROM public.perfiles WHERE id = auth.uid()) = 'admin' );

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
