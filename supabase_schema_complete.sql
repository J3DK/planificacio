-- ==============================================================================
-- ESQUEMA COMPLETO Y SEED DE SUPABASE PARA TODA LA APP MES (7 MÓDULOS)
-- ==============================================================================
-- Copia este archivo y pégalo completo en el SQL Editor de tu Supabase Dashboard:
-- https://supabase.com/dashboard/project/lxqsuzrhssdqbnuxkpsc/sql
-- y pulsa "Run" para crear/actualizar todas las tablas y datos del proyecto.
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

ALTER TABLE public.lineas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acceso total a lineas" ON public.lineas;
CREATE POLICY "Acceso total a lineas" ON public.lineas FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.lineas (id, nombre, descripcion, estado, turno, operarios, oee, disponibilidad, rendimiento, calidad, produccion_hoy, objetivo_hoy, velocidad_actual, velocidad_nominal, producto, cliente, proximo_mantenimiento, motivo_parada)
VALUES
  ('L1', 'Línea 1', 'Ensamblaje baterías 48V', 'en_marcha', 'Mañana', 4, 88.5, 95.2, 97.4, 95.3, 246, 240, 215, 220, 'BAT-48V-100Ah', 'Cliente A', '02/06/2024', NULL),
  ('L2', 'Línea 2', 'Ensamblaje baterías 24V', 'en_marcha', 'Mañana', 3, 82.1, 90.0, 95.2, 95.8, 226, 230, 198, 210, 'BAT-24V-200Ah', 'Cliente B', '05/06/2024', NULL),
  ('L3', 'Línea 3', 'Ensamblaje baterías 12V', 'parada', 'Mañana', 3, 71.4, 82.5, 90.2, 96.0, 326, 350, 0, 185, 'BAT-12V-100Ah', 'Cliente C', '01/06/2024', 'Avería soldadora automática — En reparación'),
  ('L4', 'Línea 4', 'Ensamblaje baterías especiales', 'en_marcha', 'Mañana', 5, 91.2, 97.5, 97.8, 95.6, 253, 250, 225, 225, 'BAT-48V-200Ah', 'Cliente D', '10/06/2024', NULL),
  ('L5', 'Línea 5', 'Ensamblaje baterías industriales', 'mantenimiento', 'Mañana', 2, 79.3, 88.0, 93.5, 96.4, 175, 180, 0, 160, 'BAT-24V-100Ah', 'Cliente E', '31/05/2024', 'Mantenimiento preventivo programado')
ON CONFLICT (id) DO UPDATE SET
  estado = EXCLUDED.estado, oee = EXCLUDED.oee, produccion_hoy = EXCLUDED.produccion_hoy;


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
  "origenId" TEXT,
  resuelta BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.alertas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acceso total a alertas" ON public.alertas;
CREATE POLICY "Acceso total a alertas" ON public.alertas FOR ALL USING (true) WITH CHECK (true);

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
DROP POLICY IF EXISTS "Acceso total a paradas" ON public.paradas;
CREATE POLICY "Acceso total a paradas" ON public.paradas FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.paradas (linea, inicio, fin, duracion, tipo, causa, impacto, estado)
VALUES
  ('Línea 3', '07:15', '07:42', 27, 'averia', 'Avería soldadora automática', 85, 'cerrada'),
  ('Línea 5', '06:00', NULL, 315, 'mantenimiento', 'Mantenimiento preventivo P5-M12', 315, 'abierta'),
  ('Línea 2', '08:30', '08:45', 15, 'cambio', 'Cambio de referencia BAT-24V-100Ah → 200Ah', 28, 'cerrada'),
  ('Línea 1', '09:55', '10:05', 10, 'calidad', 'Control de calidad — muestra inspección', 20, 'cerrada'),
  ('Línea 3', '10:30', NULL, 45, 'averia', 'Falta material — cables 6mm² sin stock', 45, 'abierta')
ON CONFLICT DO NOTHING;


-- 4. TABLA: secuencia (Secuencia de Fabricación MTO)
CREATE TABLE IF NOT EXISTS public.secuencia (
  id INTEGER PRIMARY KEY,
  secuencia INTEGER NOT NULL,
  referencia TEXT NOT NULL,
  cliente TEXT NOT NULL,
  fecha_compromiso TEXT NOT NULL,
  progreso INTEGER DEFAULT 0,
  cumplimiento INTEGER DEFAULT 0,
  desvio INTEGER DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'pendiente',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.secuencia ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acceso total a secuencia" ON public.secuencia;
CREATE POLICY "Acceso total a secuencia" ON public.secuencia FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.secuencia (id, secuencia, referencia, cliente, fecha_compromiso, progreso, cumplimiento, desvio, estado)
VALUES
  (1, 1, 'BAT-48V-100Ah', 'Cliente A', '31/05/2024 07:30', 100, 100, 0, 'a_tiempo'),
  (2, 2, 'BAT-24V-200Ah', 'Cliente B', '31/05/2024 08:11', 100, 100, 0, 'a_tiempo'),
  (3, 3, 'BAT-48V-100Ah', 'Cliente A', '31/05/2024 09:00', 100, 100, 0, 'a_tiempo'),
  (4, 4, 'BAT-12V-100Ah', 'Cliente C', '31/05/2024 10:30', 68, 60, -8, 'en_riesgo'),
  (5, 5, 'BAT-48V-200Ah', 'Cliente B', '31/05/2024 11:45', 42, 0, -34, 'retrasado'),
  (6, 6, 'BAT-24V-100Ah', 'Cliente D', '31/05/2024 12:00', 0, 0, 0, 'pendiente'),
  (7, 7, 'BAT-48V-100Ah', 'Cliente A', '31/05/2024 13:00', 0, 0, 0, 'pendiente'),
  (8, 8, 'BAT-12V-200Ah', 'Cliente E', '31/05/2024 13:30', 0, 0, 0, 'pendiente')
ON CONFLICT (id) DO UPDATE SET progreso = EXCLUDED.progreso, estado = EXCLUDED.estado;


-- 5. TABLA: calidad (Defectos y Control de Calidad)
CREATE TABLE IF NOT EXISTS public.calidad (
  id SERIAL PRIMARY KEY,
  causa TEXT NOT NULL,
  cantidad INTEGER DEFAULT 0,
  pct NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.calidad ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acceso total a calidad" ON public.calidad;
CREATE POLICY "Acceso total a calidad" ON public.calidad FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.calidad (causa, cantidad, pct)
VALUES
  ('Soldadura defectuosa', 180, 28),
  ('Aislamiento incorrecto', 145, 23),
  ('Mal montaje conector', 120, 19),
  ('Celda dañada', 98, 15),
  ('Etiquetado incorrecto', 60, 9),
  ('Otros', 37, 6)
ON CONFLICT DO NOTHING;


-- 6. TABLA: produccion (Producción Histórica y Diaria)
CREATE TABLE IF NOT EXISTS public.produccion (
  id SERIAL PRIMARY KEY,
  dia TEXT NOT NULL,
  plan INTEGER DEFAULT 0,
  real INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.produccion ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acceso total a produccion" ON public.produccion;
CREATE POLICY "Acceso total a produccion" ON public.produccion FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.produccion (dia, plan, real)
VALUES
  ('Lun', 1250, 1240),
  ('Mar', 1250, 1280),
  ('Mié', 1250, 1195),
  ('Jue', 1250, 1260),
  ('Vie', 1250, 1220)
ON CONFLICT DO NOTHING;


-- 7. TABLA: materias_primas (Inventario de Materiales)
CREATE TABLE IF NOT EXISTS public.materias_primas (
  id INTEGER PRIMARY KEY,
  codigo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  unidad TEXT NOT NULL,
  stock_actual INTEGER DEFAULT 0,
  stock_minimo INTEGER DEFAULT 0,
  stock_maximo INTEGER DEFAULT 0,
  pedido_pendiente INTEGER DEFAULT 0,
  fecha_entrega TEXT,
  criticidad TEXT NOT NULL DEFAULT 'baja',
  proveedor TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.materias_primas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acceso total a materias_primas" ON public.materias_primas;
CREATE POLICY "Acceso total a materias_primas" ON public.materias_primas FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.materias_primas (id, codigo, descripcion, unidad, stock_actual, stock_minimo, stock_maximo, pedido_pendiente, fecha_entrega, criticidad, proveedor)
VALUES
  (1, 'CAB-6MM-001', 'Cable 6mm² negro (rollo 100m)', 'rollo', 3, 10, 50, 20, '01/06/2024', 'alta', 'ElectroCable S.L.'),
  (2, 'CEL-LFP-48V', 'Celda LFP 48V 50Ah', 'ud', 85, 50, 300, 200, '03/06/2024', 'media', 'BatteryPro GmbH'),
  (3, 'CON-MC4-001', 'Conector MC4 macho-hembra', 'par', 420, 200, 1000, 0, NULL, 'baja', 'Stäubli España'),
  (4, 'BMS-48V-100', 'BMS 48V 100A con balanceo', 'ud', 12, 20, 80, 50, '02/06/2024', 'alta', 'SmartBMS Ltd.'),
  (5, 'CAJ-ALU-48V', 'Caja aluminio 48V serie B', 'ud', 67, 40, 150, 0, NULL, 'baja', 'MetalFab S.A.'),
  (6, 'TER-CAL-025', 'Terminal calibre 25mm²', 'caja', 8, 15, 60, 30, '04/06/2024', 'media', 'Conector Plus'),
  (7, 'CAB-1MM-RJ', 'Cable señal 1mm² trenzado', 'rollo', 22, 10, 80, 0, NULL, 'baja', 'ElectroCable S.L.'),
  (8, 'ETI-LBL-A4', 'Etiquetas identificación A4', 'caja', 2, 5, 20, 10, '31/05/2024', 'media', 'LabelMaster')
ON CONFLICT (id) DO UPDATE SET stock_actual = EXCLUDED.stock_actual, pedido_pendiente = EXCLUDED.pedido_pendiente;


-- 8. TABLA: metricas_config (Configuración del Dashboard)
CREATE TABLE IF NOT EXISTS public.metricas_config (
  id TEXT PRIMARY KEY,
  widget_nombre TEXT NOT NULL,
  descripcion TEXT,
  activo BOOLEAN DEFAULT TRUE,
  orden INTEGER DEFAULT 0,
  umbral NUMERIC(5,2),
  umbral_label TEXT,
  icono TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.metricas_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acceso total a metricas_config" ON public.metricas_config;
CREATE POLICY "Acceso total a metricas_config" ON public.metricas_config FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.metricas_config (id, widget_nombre, descripcion, activo, orden, umbral, umbral_label, icono)
VALUES
  ('cumplimiento_plan',      'Cumplimiento Plan',          'Porcentaje de cumplimiento del plan maestro', true,  1, 98.0,  '% objetivo',    'TrendingUp'),
  ('produccion_vs_plan',     'Producción vs Plan',         'Gráfico de producción real vs planificada',  true,  2, null,  null,            'BarChart2'),
  ('oee_planta',             'OEE Planta',                 'OEE agregado de todas las líneas activas',  true,  3, 85.0,  '% mínimo OEE',  'Activity'),
  ('alertas_criticas',       'Alertas Críticas',           'Número de alertas críticas activas',         true,  4, null,  null,            'AlertTriangle'),
  ('velocidad_linea',        'Velocidad de Línea',         'Ritmo real vs ritmo objetivo (uds/h)',       true,  5, null,  null,            'Zap'),
  ('produccion_por_hora',    'Producción por Hora',        'Gráfico de cadencia horaria del turno',     true,  6, null,  null,            'LineChart'),
  ('cumplimiento_por_linea', 'Cumplimiento por Línea',     'Tabla de cumplimiento % por cada línea',    true,  7, 95.0,  '% mínimo',      'Factory'),
  ('causas_desviacion',      'Causas de Desviación',       'Top causas de desvío en el turno actual',   false, 8, null,  null,            'PieChart')
ON CONFLICT (id) DO NOTHING;

