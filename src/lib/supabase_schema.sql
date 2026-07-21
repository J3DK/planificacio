-- ==============================================================================
-- SISTEMA MES BASE44 - ESQUEMA COMPLETO DE BASE DE DATOS PARA SUPABASE
-- ==============================================================================
-- Instrucciones de ejecuciÃ³n:
-- 1. Ve a tu proyecto en https://supabase.com -> Editor de SQL (SQL Editor).
-- 2. Crea una nueva consulta ("New Query"), pega todo este script y pulsa "Run".
-- 3. Este script es "idempotente" (usa CREATE TABLE IF NOT EXISTS y ADD COLUMN),
--    por lo que puedes ejecutarlo tanto en bases de datos nuevas como existentes.
-- ==============================================================================

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- 1. TABLA DE PRODUCTOS Y REFERENCIAS DE FABRICACIÃ“N (BOM + IMAGEN)
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.productos (
  id TEXT PRIMARY KEY,
  codigo TEXT UNIQUE NOT NULL,
  descripcion TEXT NOT NULL,
  cliente TEXT DEFAULT 'Cliente Industrial Principal',
  familia TEXT DEFAULT 'General',
  "tiempoCiclo" NUMERIC DEFAULT 120,
  "objetivoHora" NUMERIC DEFAULT 30,
  peso NUMERIC DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  notas TEXT,
  "bomPendiente" BOOLEAN DEFAULT false,
  bom JSONB DEFAULT '[]'::jsonb,
  imagen TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Si la tabla ya existÃ­a anteriormente, garantizamos las columnas nuevas:
DO $$ BEGIN
  ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS imagen TEXT;
  ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS bom JSONB DEFAULT '[]'::jsonb;
  ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS "bomPendiente" BOOLEAN DEFAULT false;
  ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS "tiempoCiclo" NUMERIC DEFAULT 120;
  ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS "objetivoHora" NUMERIC DEFAULT 30;
EXCEPTION WHEN OTHERS THEN NULL; END $$;


-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- 2. TABLA DE MATERIAS PRIMAS / COMPONENTES BOM (CON IMAGEN)
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.materias_primas (
  id TEXT PRIMARY KEY,
  codigo TEXT UNIQUE NOT NULL,
  descripcion TEXT NOT NULL,
  unidad TEXT DEFAULT 'ud',
  stock_actual NUMERIC DEFAULT 0,
  stock_minimo NUMERIC DEFAULT 0,
  stock_maximo NUMERIC DEFAULT 0,
  pedido_pendiente NUMERIC DEFAULT 0,
  fecha_entrega TEXT,
  criticidad TEXT DEFAULT 'Media',
  proveedor TEXT,
  stock_reservado NUMERIC DEFAULT 0,
  imagen TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
  ALTER TABLE public.materias_primas ADD COLUMN IF NOT EXISTS imagen TEXT;
  ALTER TABLE public.materias_primas ADD COLUMN IF NOT EXISTS stock_reservado NUMERIC DEFAULT 0;
  ALTER TABLE public.materias_primas ADD COLUMN IF NOT EXISTS codigo_barras TEXT;
  ALTER TABLE public.materias_primas ADD COLUMN IF NOT EXISTS coste_unitario NUMERIC DEFAULT 0;
  ALTER TABLE public.materias_primas ADD COLUMN IF NOT EXISTS ubicacion_id TEXT;
  ALTER TABLE public.materias_primas ADD COLUMN IF NOT EXISTS movimientos JSONB DEFAULT '[]'::jsonb;
EXCEPTION WHEN OTHERS THEN NULL; END $$;


-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- 3. TABLA DE LÃNEAS DE PRODUCCIÃ“N Y ESTADO OEE
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.lineas (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  estado TEXT DEFAULT 'Inactiva',
  turno TEXT DEFAULT 'MaÃ±ana',
  operarios INTEGER DEFAULT 0,
  oee NUMERIC DEFAULT 0,
  disponibilidad NUMERIC DEFAULT 0,
  rendimiento NUMERIC DEFAULT 0,
  calidad NUMERIC DEFAULT 0,
  produccion_hoy NUMERIC DEFAULT 0,
  objetivo_hoy NUMERIC DEFAULT 0,
  velocidad_actual NUMERIC DEFAULT 0,
  velocidad_nominal NUMERIC DEFAULT 0,
  producto TEXT,
  cliente TEXT,
  proximo_mantenimiento TEXT,
  motivo_parada TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- 4. TABLA DE SECUENCIA Y Ã“RDENES DE PRODUCCIÃ“N
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.secuencia (
  id TEXT PRIMARY KEY,
  secuencia INTEGER DEFAULT 1,
  orden TEXT UNIQUE NOT NULL,
  cliente TEXT,
  producto TEXT NOT NULL,
  familia TEXT,
  cantidad_total NUMERIC DEFAULT 0,
  cantidad_producida NUMERIC DEFAULT 0,
  velocidad_objetivo NUMERIC DEFAULT 0,
  fecha_inicio TEXT,
  fecha_fin_estimada TEXT,
  fecha_compromiso TEXT,
  estado TEXT DEFAULT 'pendiente',
  prioridad TEXT DEFAULT 'normal',
  linea_asignada TEXT,
  operarios_requeridos INTEGER DEFAULT 1,
  eficiencia_estimada NUMERIC DEFAULT 100,
  progreso NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- 5. TABLA DE ALERTAS MES
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.alertas (
  id TEXT PRIMARY KEY,
  tipo TEXT NOT NULL,
  linea TEXT,
  mensaje TEXT NOT NULL,
  detalle TEXT,
  hora TEXT,
  atendida BOOLEAN DEFAULT false,
  impacto TEXT DEFAULT 'Medio',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- 6. TABLA DE REGISTRO DE PARADAS Y MOTIVOS
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.paradas (
  id TEXT PRIMARY KEY,
  linea TEXT NOT NULL,
  motivo TEXT NOT NULL,
  categoria TEXT DEFAULT 'Operativa',
  duracion_min NUMERIC DEFAULT 0,
  hora_inicio TEXT,
  hora_fin TEXT,
  resuelta BOOLEAN DEFAULT false,
  impacto_oee TEXT DEFAULT 'Medio',
  operario TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- 7. TABLA DE CATÃLOGO DE PARADAS PREDETERMINADAS
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.paradas_predeterminadas (
  id TEXT PRIMARY KEY,
  codigo TEXT UNIQUE NOT NULL,
  motivo TEXT NOT NULL,
  categoria TEXT DEFAULT 'Operativa',
  impacto_oee TEXT DEFAULT 'Medio',
  descripcion TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- 8. TABLA DE CONTROL DE CALIDAD Y DEFECTOS
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.calidad (
  id TEXT PRIMARY KEY,
  codigo TEXT UNIQUE NOT NULL,
  linea TEXT,
  producto TEXT,
  tipo_defecto TEXT NOT NULL,
  gravedad TEXT DEFAULT 'Leve',
  cantidad_afectada NUMERIC DEFAULT 1,
  lote TEXT,
  operario TEXT,
  fecha_hora TEXT,
  resuelto BOOLEAN DEFAULT false,
  accion_correctiva TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- 9. TABLA DE HISTÃ“RICO DE PRODUCCIÃ“N POR HORA
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.produccion (
  id TEXT PRIMARY KEY,
  linea TEXT NOT NULL,
  producto TEXT,
  turno TEXT DEFAULT 'MaÃ±ana',
  hora TEXT,
  cantidad_producida NUMERIC DEFAULT 0,
  objetivo_hora NUMERIC DEFAULT 0,
  piezas_buenas NUMERIC DEFAULT 0,
  piezas_defectuosas NUMERIC DEFAULT 0,
  velocidad_media NUMERIC DEFAULT 0,
  oee_hora NUMERIC DEFAULT 0,
  fecha TEXT,
  operario TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- 10. TABLA DE CONFIGURACIÃ“N DE MÃ‰TRICAS / KPIS
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.metricas_config (
  id TEXT PRIMARY KEY,
  nombre TEXT UNIQUE NOT NULL,
  objetivo NUMERIC DEFAULT 100,
  alerta NUMERIC DEFAULT 85,
  unidad TEXT DEFAULT '%',
  orden INTEGER DEFAULT 1,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- 11. TABLA DE OPERARIOS Y PLANTILLA
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.operarios (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  apellidos TEXT,
  puesto TEXT DEFAULT 'Operario de LÃ­nea',
  linea_asignada TEXT,
  turno TEXT DEFAULT 'MaÃ±ana',
  eficiencia NUMERIC DEFAULT 100,
  horas_trabajadas NUMERIC DEFAULT 8,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- 12. TABLA DE Ã“RDENES DE TRABAJO (MANTENIMIENTO)
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.ordenes_trabajo (
  id TEXT PRIMARY KEY,
  codigo TEXT UNIQUE NOT NULL,
  equipo TEXT NOT NULL,
  tipo TEXT DEFAULT 'Preventivo',
  prioridad TEXT DEFAULT 'Media',
  estado TEXT DEFAULT 'Pendiente',
  descripcion TEXT,
  tecnico_asignado TEXT,
  fecha_creacion TEXT,
  fecha_cierre TEXT,
  horas_estimadas NUMERIC DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- 13. TABLA DE ACTIVOS DE MANTENIMIENTO (MAQUINARIA)
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.activos_mantenimiento (
  id TEXT PRIMARY KEY,
  codigo TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  tipo TEXT DEFAULT 'Maquinaria',
  linea TEXT,
  estado TEXT DEFAULT 'Operativo',
  ultimo_mantenimiento TEXT,
  proximo_mantenimiento TEXT,
  horas_funcionamiento NUMERIC DEFAULT 0,
  mtbf NUMERIC DEFAULT 0,
  mttr NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ==============================================================================
-- SEGURIDAD (ROW LEVEL SECURITY - RLS) Y POLÃTICAS DE ACCESO PÃšBLICO
-- ==============================================================================
-- Habilitamos RLS en todas las tablas y otorgamos acceso completo (SELECT, INSERT, UPDATE, DELETE)
-- para llamadas desde la API REST (anon / authenticated).

DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN ARRAY[
    'productos', 'materias_primas', 'lineas', 'secuencia', 'alertas', 'paradas',
    'paradas_predeterminadas', 'calidad', 'produccion', 'metricas_config',
    'operarios', 'ordenes_trabajo', 'activos_mantenimiento'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    
    -- Si la polÃ­tica ya existe la borramos y la recreamos para evitar errores:
    EXECUTE format('DROP POLICY IF EXISTS "Acceso total publico para MES %I" ON public.%I;', t, t);
    EXECUTE format('CREATE POLICY "Acceso total publico para MES %I" ON public.%I FOR ALL USING (true) WITH CHECK (true);', t, t);
  END LOOP;
END $$;

-- Permisos de lectura y escritura para el rol pÃºblico anon en el esquema:
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- Â¡Listo! Esquema completo configurado y preparado para sincronizaciÃ³n con MES Base44.

-- ------------------------------------------------------------------------------
-- BLOQUE A - TABLAS KAIZEN, SMED Y 5S (LEAN)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kaizen (
  id TEXT PRIMARY KEY,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  linea TEXT,
  categoria TEXT,
  proponente TEXT,
  fecha TIMESTAMPTZ DEFAULT now(),
  estado TEXT DEFAULT 'propuesta',
  "impactoEstimado" TEXT,
  "ahorroEstimado" NUMERIC,
  fotos JSONB DEFAULT '[]',
  evaluador TEXT,
  "fechaEvaluacion" TIMESTAMPTZ,
  "comentarioEvaluacion" TEXT,
  "fechaImplementacion" TIMESTAMPTZ
);
ALTER TABLE public.kaizen ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acceso total a kaizen" ON public.kaizen;
CREATE POLICY "Acceso total a kaizen" ON public.kaizen FOR ALL USING (true) WITH CHECK (true);
ALTER PUBLICATION supabase_realtime ADD TABLE public.kaizen;

CREATE TABLE IF NOT EXISTS public.cambios_formato (
  id TEXT PRIMARY KEY,
  linea TEXT,
  "ordenAnteriorId" TEXT,
  "productoAnterior" TEXT,
  "ordenNuevaId" TEXT,
  "productoNuevo" TEXT,
  "fechaInicio" TIMESTAMPTZ,
  "fechaFin" TIMESTAMPTZ,
  "duracionMinutos" NUMERIC,
  "operarioId" TEXT,
  "tipoCambio" TEXT
);
ALTER TABLE public.cambios_formato ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acceso total a cambios_formato" ON public.cambios_formato;
CREATE POLICY "Acceso total a cambios_formato" ON public.cambios_formato FOR ALL USING (true) WITH CHECK (true);
ALTER PUBLICATION supabase_realtime ADD TABLE public.cambios_formato;

CREATE TABLE IF NOT EXISTS public.auditorias_5s (
  id TEXT PRIMARY KEY,
  linea TEXT,
  "templateId" TEXT,
  operario TEXT,
  fecha TIMESTAMPTZ DEFAULT now(),
  resultados JSONB DEFAULT '[]',
  "puntuacionGlobal" NUMERIC
);
ALTER TABLE public.auditorias_5s ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acceso total a auditorias_5s" ON public.auditorias_5s;
CREATE POLICY "Acceso total a auditorias_5s" ON public.auditorias_5s FOR ALL USING (true) WITH CHECK (true);
ALTER PUBLICATION supabase_realtime ADD TABLE public.auditorias_5s;
