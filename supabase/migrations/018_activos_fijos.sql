-- =============================================
-- 018_activos_fijos.sql
-- Activos fijos, depreciación y categorías
-- Requiere: 017_contabilidad.sql ejecutada primero
-- =============================================

-- CATEGORÍAS DE ACTIVO (define vida útil y método de depreciación)
CREATE TABLE IF NOT EXISTS public.categorias_activo (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre           TEXT NOT NULL,
  vida_util_anios  INTEGER NOT NULL DEFAULT 5,
  metodo_dep       TEXT DEFAULT 'linea_recta' CHECK (metodo_dep IN ('linea_recta','saldo_decreciente')),
  cuenta_activo    UUID REFERENCES public.plan_cuentas(id),
  cuenta_dep_acu   UUID REFERENCES public.plan_cuentas(id),
  cuenta_gasto_dep UUID REFERENCES public.plan_cuentas(id),
  activa           BOOLEAN DEFAULT TRUE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ACTIVOS FIJOS
CREATE TABLE IF NOT EXISTS public.activos_fijos (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria_id   UUID REFERENCES public.categorias_activo(id),
  codigo         TEXT UNIQUE NOT NULL,         -- ej: ACT-001
  nombre         TEXT NOT NULL,
  descripcion    TEXT,
  fecha_compra   DATE NOT NULL,
  costo_original NUMERIC(15,2) NOT NULL,
  valor_residual NUMERIC(15,2) DEFAULT 0,
  dep_acumulada  NUMERIC(15,2) DEFAULT 0,
  ubicacion      TEXT,
  sucursal       TEXT CHECK (sucursal IN ('quito','guayaquil')),
  proveedor      TEXT,
  factura_ref    TEXT,
  estado         TEXT DEFAULT 'activo' CHECK (estado IN ('activo','depreciado','dado_de_baja','vendido')),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- DEPRECIACIONES (registro mensual por activo)
CREATE TABLE IF NOT EXISTS public.depreciaciones (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activo_id    UUID NOT NULL REFERENCES public.activos_fijos(id) ON DELETE CASCADE,
  periodo_id   UUID REFERENCES public.periodos_contables(id),
  anio         INTEGER NOT NULL,
  mes          INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
  monto        NUMERIC(15,2) NOT NULL,
  acu_anterior NUMERIC(15,2) NOT NULL DEFAULT 0,
  acu_nuevo    NUMERIC(15,2) NOT NULL,
  asiento_id   UUID REFERENCES public.asientos_contables(id),
  procesado    BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(activo_id, anio, mes)
);

-- Trigger updated_at
CREATE TRIGGER trg_activos_updated
  BEFORE UPDATE ON public.activos_fijos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- RLS
-- =============================================

ALTER TABLE public.categorias_activo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activos_fijos     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.depreciaciones     ENABLE ROW LEVEL SECURITY;

-- Reusar tiene_rol() definido en 017
CREATE POLICY "cat_af_r" ON public.categorias_activo FOR SELECT USING (tiene_rol(ARRAY['admin','contador','gerente']));
CREATE POLICY "cat_af_w" ON public.categorias_activo FOR ALL    USING (tiene_rol(ARRAY['admin','contador'])) WITH CHECK (tiene_rol(ARRAY['admin','contador']));

CREATE POLICY "af_r"  ON public.activos_fijos  FOR SELECT USING (tiene_rol(ARRAY['admin','contador','gerente']));
CREATE POLICY "af_w"  ON public.activos_fijos  FOR ALL    USING (tiene_rol(ARRAY['admin','contador'])) WITH CHECK (tiene_rol(ARRAY['admin','contador']));

CREATE POLICY "dep_r" ON public.depreciaciones FOR SELECT USING (tiene_rol(ARRAY['admin','contador','gerente']));
CREATE POLICY "dep_w" ON public.depreciaciones FOR ALL    USING (tiene_rol(ARRAY['admin','contador'])) WITH CHECK (tiene_rol(ARRAY['admin','contador']));

-- =============================================
-- SEED: Categorías básicas de activos
-- =============================================

INSERT INTO public.categorias_activo (nombre, vida_util_anios, metodo_dep) VALUES
  ('Maquinaria y Equipo',          10, 'linea_recta'),
  ('Equipo de Cómputo',             3, 'linea_recta'),
  ('Muebles y Enseres',            10, 'linea_recta'),
  ('Vehículos',                     5, 'linea_recta'),
  ('Herramientas y Accesorios',     5, 'linea_recta')
ON CONFLICT DO NOTHING;
