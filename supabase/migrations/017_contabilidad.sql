-- =============================================
-- 017_contabilidad.sql
-- Plan de cuentas, centros de costo, períodos y asientos contables
-- =============================================

-- PLAN DE CUENTAS (jerarquía hasta nivel 5)
CREATE TABLE IF NOT EXISTS public.plan_cuentas (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo       TEXT UNIQUE NOT NULL,        -- ej: 1.1.01.001
  nombre       TEXT NOT NULL,
  tipo         TEXT NOT NULL CHECK (tipo IN ('activo','pasivo','patrimonio','ingreso','gasto','costo')),
  nivel        INTEGER NOT NULL,            -- 1=grupo 2=subgrupo 3=cuenta 4=subcuenta 5=auxiliar
  padre_id     UUID REFERENCES public.plan_cuentas(id),
  permite_mov  BOOLEAN DEFAULT FALSE,       -- solo nivel 5 permite movimientos
  aplica_iva   BOOLEAN DEFAULT FALSE,
  activa       BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- CENTROS DE COSTOS
CREATE TABLE IF NOT EXISTS public.centros_costos (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo    TEXT UNIQUE NOT NULL,
  nombre    TEXT NOT NULL,
  sucursal  TEXT CHECK (sucursal IN ('quito','guayaquil','ambos')),
  activo    BOOLEAN DEFAULT TRUE
);

-- PERÍODOS CONTABLES
CREATE TABLE IF NOT EXISTS public.periodos_contables (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anio       INTEGER NOT NULL,
  mes        INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
  estado     TEXT DEFAULT 'abierto' CHECK (estado IN ('abierto','cerrado')),
  cerrado_en TIMESTAMPTZ,
  cerrado_por UUID REFERENCES public.perfiles(id),
  UNIQUE(anio, mes)
);

-- ASIENTOS CONTABLES
CREATE TABLE IF NOT EXISTS public.asientos_contables (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero       INTEGER GENERATED ALWAYS AS IDENTITY UNIQUE,
  fecha        DATE NOT NULL,
  descripcion  TEXT NOT NULL,
  tipo         TEXT DEFAULT 'manual' CHECK (tipo IN ('manual','automatico','apertura','cierre')),
  modulo       TEXT,   -- 'ventas','compras','caja','nomina'
  referencia   TEXT,   -- número de documento origen
  periodo_id   UUID REFERENCES public.periodos_contables(id),
  usuario_id   UUID REFERENCES public.perfiles(id),
  estado       TEXT DEFAULT 'borrador' CHECK (estado IN ('borrador','contabilizado','anulado')),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- LÍNEAS DE ASIENTO (partida doble — debe = haber siempre)
CREATE TABLE IF NOT EXISTS public.asiento_lineas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asiento_id      UUID NOT NULL REFERENCES public.asientos_contables(id) ON DELETE CASCADE,
  cuenta_id       UUID NOT NULL REFERENCES public.plan_cuentas(id),
  centro_costo_id UUID REFERENCES public.centros_costos(id),
  descripcion     TEXT,
  debe            NUMERIC(15,2) DEFAULT 0,
  haber           NUMERIC(15,2) DEFAULT 0,
  referencia      TEXT
);

-- =============================================
-- RLS
-- =============================================

ALTER TABLE public.plan_cuentas       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.centros_costos     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.periodos_contables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asientos_contables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asiento_lineas     ENABLE ROW LEVEL SECURITY;

-- Helper de rol (si no existe ya de migration 021)
CREATE OR REPLACE FUNCTION tiene_rol(roles TEXT[])
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol = ANY(roles)
  );
$$ LANGUAGE sql SECURITY DEFINER;

DROP POLICY IF EXISTS "pc_r"  ON public.plan_cuentas;
DROP POLICY IF EXISTS "pc_w"  ON public.plan_cuentas;
DROP POLICY IF EXISTS "cc_r"  ON public.centros_costos;
DROP POLICY IF EXISTS "cc_w"  ON public.centros_costos;
DROP POLICY IF EXISTS "per_r" ON public.periodos_contables;
DROP POLICY IF EXISTS "per_w" ON public.periodos_contables;
DROP POLICY IF EXISTS "asi_r" ON public.asientos_contables;
DROP POLICY IF EXISTS "asi_w" ON public.asientos_contables;
DROP POLICY IF EXISTS "al_r"  ON public.asiento_lineas;
DROP POLICY IF EXISTS "al_w"  ON public.asiento_lineas;

CREATE POLICY "pc_r"  ON public.plan_cuentas       FOR SELECT USING (tiene_rol(ARRAY['admin','contador','gerente']));
CREATE POLICY "pc_w"  ON public.plan_cuentas       FOR ALL    USING (tiene_rol(ARRAY['admin','contador'])) WITH CHECK (tiene_rol(ARRAY['admin','contador']));
CREATE POLICY "cc_r"  ON public.centros_costos      FOR SELECT USING (tiene_rol(ARRAY['admin','contador','gerente']));
CREATE POLICY "cc_w"  ON public.centros_costos      FOR ALL    USING (tiene_rol(ARRAY['admin','contador'])) WITH CHECK (tiene_rol(ARRAY['admin','contador']));
CREATE POLICY "per_r" ON public.periodos_contables  FOR SELECT USING (tiene_rol(ARRAY['admin','contador','gerente']));
CREATE POLICY "per_w" ON public.periodos_contables  FOR ALL    USING (tiene_rol(ARRAY['admin','contador'])) WITH CHECK (tiene_rol(ARRAY['admin','contador']));
CREATE POLICY "asi_r" ON public.asientos_contables  FOR SELECT USING (tiene_rol(ARRAY['admin','contador','gerente']));
CREATE POLICY "asi_w" ON public.asientos_contables  FOR ALL    USING (tiene_rol(ARRAY['admin','contador'])) WITH CHECK (tiene_rol(ARRAY['admin','contador']));
CREATE POLICY "al_r"  ON public.asiento_lineas      FOR SELECT USING (tiene_rol(ARRAY['admin','contador','gerente']));
CREATE POLICY "al_w"  ON public.asiento_lineas      FOR ALL    USING (tiene_rol(ARRAY['admin','contador'])) WITH CHECK (tiene_rol(ARRAY['admin','contador']));

-- =============================================
-- SEED: Plan de Cuentas Ecuador (estructura básica NEC/NIIF)
-- =============================================

INSERT INTO public.plan_cuentas (codigo, nombre, tipo, nivel, permite_mov) VALUES
-- ACTIVOS
('1',         'ACTIVOS',                           'activo',    1, false),
('1.1',       'ACTIVO CORRIENTE',                  'activo',    2, false),
('1.1.01',    'CAJA Y BANCOS',                     'activo',    3, false),
('1.1.01.001','Caja General',                      'activo',    4, true),
('1.1.01.002','Caja Chica',                        'activo',    4, true),
('1.1.02',    'CUENTAS POR COBRAR',                'activo',    3, false),
('1.1.02.001','Clientes',                          'activo',    4, true),
('1.1.02.002','Anticipos a Proveedores',           'activo',    4, true),
('1.1.03',    'INVENTARIO',                        'activo',    3, false),
('1.1.03.001','Repuestos y Materiales',            'activo',    4, true),
('1.2',       'ACTIVO NO CORRIENTE',               'activo',    2, false),
('1.2.01',    'PROPIEDAD PLANTA Y EQUIPO',         'activo',    3, false),
('1.2.01.001','Maquinaria y Equipo',               'activo',    4, true),
('1.2.01.002','(-) Dep. Acumulada Maquinaria',     'activo',    4, true),
('1.2.01.003','Vehículos',                         'activo',    4, true),
('1.2.01.004','(-) Dep. Acumulada Vehículos',      'activo',    4, true),
-- PASIVOS
('2',         'PASIVOS',                           'pasivo',    1, false),
('2.1',       'PASIVO CORRIENTE',                  'pasivo',    2, false),
('2.1.01',    'CUENTAS POR PAGAR',                 'pasivo',    3, false),
('2.1.01.001','Proveedores',                       'pasivo',    4, true),
('2.1.01.002','Anticipos de Clientes',             'pasivo',    4, true),
('2.1.02',    'OBLIGACIONES FISCALES',             'pasivo',    3, false),
('2.1.02.001','IVA en Ventas',                     'pasivo',    4, true),
('2.1.02.002','Retenciones en la Fuente por Pagar','pasivo',    4, true),
-- PATRIMONIO
('3',         'PATRIMONIO',                        'patrimonio',1, false),
('3.1',       'CAPITAL SOCIAL',                    'patrimonio',2, false),
('3.1.01.001','Capital Suscrito y Pagado',         'patrimonio',4, true),
('3.2',       'RESULTADOS',                        'patrimonio',2, false),
('3.2.01.001','Utilidad del Ejercicio',            'patrimonio',4, true),
('3.2.01.002','Pérdida del Ejercicio',             'patrimonio',4, true),
-- INGRESOS
('4',         'INGRESOS',                          'ingreso',   1, false),
('4.1',       'INGRESOS OPERACIONALES',            'ingreso',   2, false),
('4.1.01',    'VENTAS',                            'ingreso',   3, false),
('4.1.01.001','Ventas de Servicios',               'ingreso',   4, true),
('4.1.01.002','Ventas de Repuestos',               'ingreso',   4, true),
('4.2',       'OTROS INGRESOS',                    'ingreso',   2, false),
('4.2.01.001','Intereses Ganados',                 'ingreso',   4, true),
-- GASTOS
('5',         'GASTOS',                            'gasto',     1, false),
('5.1',       'GASTOS OPERACIONALES',              'gasto',     2, false),
('5.1.01',    'GASTOS DE PERSONAL',                'gasto',     3, false),
('5.1.01.001','Sueldos y Salarios',                'gasto',     4, true),
('5.1.01.002','Beneficios Sociales',               'gasto',     4, true),
('5.1.02',    'GASTOS GENERALES',                  'gasto',     3, false),
('5.1.02.001','Arriendo',                          'gasto',     4, true),
('5.1.02.002','Servicios Básicos',                 'gasto',     4, true),
('5.1.02.003','Depreciación Activos',              'gasto',     4, true),
-- COSTOS
('6',         'COSTOS',                            'costo',     1, false),
('6.1',       'COSTOS DE VENTAS',                  'costo',     2, false),
('6.1.01.001','Costo de Repuestos Vendidos',       'costo',     4, true),
('6.1.01.002','Costo de Mano de Obra',             'costo',     4, true)
ON CONFLICT (codigo) DO NOTHING;

-- SEED: Centros de costos por sucursal
INSERT INTO public.centros_costos (codigo, nombre, sucursal) VALUES
('UIO', 'Sucursal Quito',     'quito'),
('GYE', 'Sucursal Guayaquil', 'guayaquil')
ON CONFLICT (codigo) DO NOTHING;

-- SEED: Período contable actual (Abril 2026)
INSERT INTO public.periodos_contables (anio, mes, estado) VALUES
(2026, 1, 'cerrado'),
(2026, 2, 'cerrado'),
(2026, 3, 'cerrado'),
(2026, 4, 'abierto')
ON CONFLICT (anio, mes) DO NOTHING;
