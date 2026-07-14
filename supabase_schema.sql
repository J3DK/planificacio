-- ==============================================================================
-- SCHEMA DE SUPABASE PARA MES / PLANIFICACIÓN DE PRODUCCIÓN
-- ==============================================================================
-- Puedes ejecutar este archivo directamente en el SQL Editor de Supabase
-- (https://supabase.com/dashboard/project/_/sql) para crear las tablas y los
-- datos iniciales.
-- ==============================================================================

-- 1. TABLA: lineas (Líneas de Producción)
CREATE TABLE IF NOT EXISTS public.lineas (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  estado TEXT NOT NULL DEFAULT 'parada',
  turno TEXT NOT NULL DEFAULT 'Mañana',
  operarios INTEGER DEFAULT 0,
  oee NUMERIC(5,2) DEFAULT 0,
  disponibilidad NUMERIC(5,2) DEFAULT 0,
  rendimiento NUMERIC(5,2) DEFAULT 0,
  calidad NUMERIC(5,2) DEFAULT 0,
  produccion_hoy INTEGER DEFAULT 0,
  objetivo_hoy INTEGER DEFAULT 0,
  velocidad_actual INTEGER DEFAULT 0,
  velocidad_nominal INTEGER DEFAULT 0,
  producto TEXT,
  cliente TEXT,
  proximo_mantenimiento TEXT,
  motivo_parada TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS) y crear política de acceso total para desarrollo/anon
ALTER TABLE public.lineas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acceso total a lineas para anon y autenticados" ON public.lineas
  FOR ALL USING (true) WITH CHECK (true);

-- Insertar datos iniciales de ejemplo para Líneas de Producción
INSERT INTO public.lineas (id, nombre, descripcion, estado, turno, operarios, oee, disponibilidad, rendimiento, calidad, produccion_hoy, objetivo_hoy, velocidad_actual, velocidad_nominal, producto, cliente, proximo_mantenimiento, motivo_parada)
VALUES
  ('L1', 'Línea 1', 'Ensamblaje baterías 48V', 'en_marcha', 'Mañana', 4, 88.5, 95.2, 97.4, 95.3, 246, 240, 215, 220, 'BAT-48V-100Ah', 'Cliente A', '02/06/2024', NULL),
  ('L2', 'Línea 2', 'Ensamblaje baterías 24V', 'en_marcha', 'Mañana', 3, 82.1, 90.0, 95.2, 95.8, 226, 230, 198, 210, 'BAT-24V-200Ah', 'Cliente B', '05/06/2024', NULL),
  ('L3', 'Línea 3', 'Ensamblaje baterías 12V', 'parada', 'Mañana', 3, 71.4, 82.5, 90.2, 96.0, 326, 350, 0, 185, 'BAT-12V-100Ah', 'Cliente C', '01/06/2024', 'Avería soldadora automática — En reparación'),
  ('L4', 'Línea 4', 'Ensamblaje baterías especiales', 'en_marcha', 'Mañana', 5, 91.2, 97.5, 97.8, 95.6, 253, 250, 225, 225, 'BAT-48V-200Ah', 'Cliente D', '10/06/2024', NULL),
  ('L5', 'Línea 5', 'Ensamblaje baterías industriales', 'mantenimiento', 'Mañana', 2, 79.3, 88.0, 93.5, 96.4, 175, 180, 0, 160, 'BAT-24V-100Ah', 'Cliente E', '31/05/2024', 'Mantenimiento preventivo programado')
ON CONFLICT (id) DO NOTHING;


-- 2. TABLA: alertas (Historial de Alertas)
CREATE TABLE IF NOT EXISTS public.alertas (
  id SERIAL PRIMARY KEY,
  tipo TEXT NOT NULL DEFAULT 'info',
  icono TEXT DEFAULT 'AlertTriangle',
  titulo TEXT NOT NULL,
  descripcion TEXT,
  modulo TEXT,
  linea TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  leida BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.alertas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acceso total a alertas para anon y autenticados" ON public.alertas
  FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.alertas (tipo, icono, titulo, descripcion, modulo, linea, timestamp, leida)
VALUES
  ('critica', 'AlertTriangle', 'Ruptura de stock — Cable 6mm²', 'Stock actual (3 rollos) por debajo del mínimo (10 rollos). Línea 3 parada.', 'materias_primas', 'Línea 3', '2024-05-31T10:30:00Z', false),
  ('critica', 'Wrench', 'Avería soldadora automática L3', 'La soldadora de la Línea 3 (modelo Fronius TPS 400i) ha reportado fallo E-04. Técnico en camino.', 'paradas', 'Línea 3', '2024-05-31T07:15:00Z', false),
  ('advertencia', 'Clock', 'Orden MO24051-005 — Retraso 34 uds', 'La orden BAT-48V-200Ah del Cliente B acumula 34 uds de retraso. Fecha compromiso: 11:45.', 'secuencia', 'Línea 2', '2024-05-31T09:50:00Z', false),
  ('advertencia', 'TrendingDown', 'Línea 3 — Cumplimiento 93.2% (obj. 100%)', 'El cumplimiento de la Línea 3 está 6.8pp por debajo del objetivo. Revisar causas en el módulo de Paradas.', 'lineas', 'Línea 3', '2024-05-31T11:00:00Z', true),
  ('info', 'CheckCircle', 'Mantenimiento preventivo L5 iniciado', 'El mantenimiento preventivo P5-M12 de Línea 5 ha comenzado según lo planificado.', 'paradas', 'Línea 5', '2024-05-31T06:00:00Z', true)
ON CONFLICT DO NOTHING;


-- 3. TABLA: paradas (Registro de Paradas e Incidencias)
CREATE TABLE IF NOT EXISTS public.paradas (
  id SERIAL PRIMARY KEY,
  linea TEXT NOT NULL,
  inicio TEXT NOT NULL,
  fin TEXT,
  duracion INTEGER DEFAULT 0,
  tipo TEXT NOT NULL,
  causa TEXT NOT NULL,
  impacto INTEGER DEFAULT 0,
  estado TEXT DEFAULT 'cerrada',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.paradas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acceso total a paradas para anon y autenticados" ON public.paradas
  FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.paradas (linea, inicio, fin, duracion, tipo, causa, impacto, estado)
VALUES
  ('Línea 3', '07:15', '07:42', 27, 'averia', 'Avería soldadora automática', 85, 'cerrada'),
  ('Línea 5', '06:00', NULL, 315, 'mantenimiento', 'Mantenimiento preventivo P5-M12', 315, 'abierta'),
  ('Línea 2', '08:30', '08:45', 15, 'cambio', 'Cambio de referencia BAT-24V-100Ah → 200Ah', 28, 'cerrada'),
  ('Línea 1', '09:55', '10:05', 10, 'calidad', 'Control de calidad — muestra inspección', 20, 'cerrada'),
  ('Línea 3', '10:30', NULL, 45, 'averia', 'Falta material — cables 6mm² sin stock', 45, 'abierta')
ON CONFLICT DO NOTHING;
