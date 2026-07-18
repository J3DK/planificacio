-- ==============================================================================
-- ESQUEMA COMPLETO: FASE 2 (Mantenimiento, Productos, Operarios, Checklists)
-- ==============================================================================

-- ==========================================
-- 1. PRODUCTOS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.productos (
  id TEXT PRIMARY KEY,
  codigo TEXT NOT NULL,
  descripcion TEXT,
  cliente TEXT,
  familia TEXT,
  "tiempoCiclo" NUMERIC,
  "objetivoHora" NUMERIC,
  peso NUMERIC,
  activo BOOLEAN DEFAULT true,
  imagen TEXT,
  notas TEXT,
  "bomPendiente" BOOLEAN DEFAULT false,
  bom JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 2. OPERARIOS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.operarios (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  apellidos TEXT,
  foto TEXT,
  turno TEXT,
  estado TEXT DEFAULT 'activo',
  "lineaActualId" TEXT,
  rendimiento NUMERIC DEFAULT 0,
  calidad NUMERIC DEFAULT 0,
  skills JSONB DEFAULT '[]'::jsonb,
  formaciones JSONB DEFAULT '[]'::jsonb,
  permisos JSONB DEFAULT '[]'::jsonb,
  autorizaciones JSONB DEFAULT '[]'::jsonb,
  historial JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 3. MANTENIMIENTO: ACTIVOS (activos_mantenimiento)
-- ==========================================
-- Flattened structure to support parent_id index
CREATE TABLE IF NOT EXISTS public.activos_mantenimiento (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL, -- planta, linea, maquina, componente
  fabricante TEXT,
  "numSerie" TEXT,
  "fechaInstalacion" TEXT,
  criticidad TEXT,
  "horasFuncionamiento" NUMERIC DEFAULT 0,
  intervenciones INTEGER DEFAULT 0,
  parent_id TEXT REFERENCES public.activos_mantenimiento(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 4. MANTENIMIENTO: PLANES PREVENTIVOS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.planes_preventivos (
  id TEXT PRIMARY KEY,
  codigo TEXT,
  titulo TEXT NOT NULL,
  "activoId" TEXT REFERENCES public.activos_mantenimiento(id) ON DELETE CASCADE,
  "activoNombre" TEXT,
  "frecuenciaDias" INTEGER,
  "frecuenciaHoras" INTEGER,
  "ultimaEjecucion" TEXT,
  "proximaEjecucion" TEXT,
  estado TEXT,
  responsable TEXT,
  checklist JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 5. MANTENIMIENTO: ORDENES DE TRABAJO
-- ==========================================
CREATE TABLE IF NOT EXISTS public.ordenes_trabajo (
  id TEXT PRIMARY KEY,
  codigo TEXT,
  titulo TEXT NOT NULL,
  "activoId" TEXT REFERENCES public.activos_mantenimiento(id) ON DELETE CASCADE,
  "activoNombre" TEXT,
  linea TEXT,
  tipo TEXT NOT NULL,
  prioridad TEXT,
  estado TEXT DEFAULT 'abierta',
  tecnico TEXT,
  turno TEXT,
  "fechaApertura" TEXT,
  "fechaCierre" TEXT,
  "tiempoEst" INTEGER,
  "tiempoReal" INTEGER,
  repuestos JSONB DEFAULT '[]'::jsonb,
  "causaRaiz" TEXT,
  "paradaId" INTEGER, -- opcionalmente foreign key a paradas
  "costeTotal" NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 6. CHECKLISTS TEMPLATES Y EJECUCIONES
-- ==========================================
CREATE TABLE IF NOT EXISTS public.checklist_templates (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  categoria TEXT,
  "aplicaA" JSONB DEFAULT '{}'::jsonb,
  frecuencia TEXT,
  activo BOOLEAN DEFAULT true,
  items JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.checklist_ejecuciones (
  id TEXT PRIMARY KEY,
  "templateId" TEXT REFERENCES public.checklist_templates(id) ON DELETE CASCADE,
  "templateNombre" TEXT,
  linea TEXT,
  turno TEXT,
  "operarioId" TEXT, -- no FK para no romper nada
  "fechaEjecucion" TEXT,
  respuestas JSONB DEFAULT '[]'::jsonb,
  estado TEXT,
  comentarios TEXT,
  "tiempoReal" INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- ÍNDICES REQUERIDOS (Optimización)
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_activos_parent_id ON public.activos_mantenimiento(parent_id);
CREATE INDEX IF NOT EXISTS idx_ot_linea ON public.ordenes_trabajo(linea);
CREATE INDEX IF NOT EXISTS idx_ot_estado ON public.ordenes_trabajo(estado);
CREATE INDEX IF NOT EXISTS idx_checklist_ejecuciones_template_id ON public.checklist_ejecuciones("templateId");
CREATE INDEX IF NOT EXISTS idx_operario_turno ON public.operarios(turno);

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activos_mantenimiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planes_preventivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordenes_trabajo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_ejecuciones ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura para autenticados
CREATE POLICY "Lectura productos" ON public.productos FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Lectura operarios" ON public.operarios FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Lectura activos" ON public.activos_mantenimiento FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Lectura planes" ON public.planes_preventivos FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Lectura ordenes" ON public.ordenes_trabajo FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Lectura checklist_templates" ON public.checklist_templates FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Lectura checklist_ejecuciones" ON public.checklist_ejecuciones FOR SELECT USING (auth.role() = 'authenticated');

-- Políticas de escritura (ALL) para autenticados
CREATE POLICY "Escritura productos" ON public.productos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Escritura operarios" ON public.operarios FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Escritura activos" ON public.activos_mantenimiento FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Escritura planes" ON public.planes_preventivos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Escritura ordenes" ON public.ordenes_trabajo FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Escritura checklist_templates" ON public.checklist_templates FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Escritura checklist_ejecuciones" ON public.checklist_ejecuciones FOR ALL USING (auth.role() = 'authenticated');

-- ==========================================
-- SUPABASE REALTIME
-- ==========================================
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;

ALTER PUBLICATION supabase_realtime ADD TABLE public.lineas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alertas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.paradas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.secuencia;
ALTER PUBLICATION supabase_realtime ADD TABLE public.calidad;
ALTER PUBLICATION supabase_realtime ADD TABLE public.produccion;
ALTER PUBLICATION supabase_realtime ADD TABLE public.materias_primas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.metricas_config;
ALTER PUBLICATION supabase_realtime ADD TABLE public.productos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.operarios;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activos_mantenimiento;
ALTER PUBLICATION supabase_realtime ADD TABLE public.planes_preventivos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ordenes_trabajo;
ALTER PUBLICATION supabase_realtime ADD TABLE public.checklist_templates;
ALTER PUBLICATION supabase_realtime ADD TABLE public.checklist_ejecuciones;
