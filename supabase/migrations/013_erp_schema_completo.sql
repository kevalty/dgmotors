-- =============================================
-- 013_erp_schema_completo.sql
-- ERP: Todas las tablas en orden correcto de dependencias
-- Ejecutar completo en una sola vez en Supabase SQL Editor
-- Idempotente: se puede ejecutar múltiples veces sin error
-- =============================================

-- ─── 1. CATEGORIAS DE REPUESTOS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.categorias_repuesto (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      TEXT NOT NULL,
  descripcion TEXT,
  orden       INTEGER DEFAULT 0
);

-- ─── 2. REPUESTOS / MATERIALES ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.repuestos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria_id    UUID REFERENCES public.categorias_repuesto(id),
  codigo          TEXT UNIQUE,
  nombre          TEXT NOT NULL,
  descripcion     TEXT,
  unidad          TEXT DEFAULT 'unidad'
                    CHECK (unidad IN ('unidad','litro','kg','metro','par','juego')),
  precio_costo    NUMERIC(10,2),
  precio_venta    NUMERIC(10,2),
  stock_actual    NUMERIC(10,3) DEFAULT 0,
  stock_minimo    NUMERIC(10,3) DEFAULT 0,
  stock_maximo    NUMERIC(10,3),
  ubicacion       TEXT,
  aplica_iva      BOOLEAN DEFAULT TRUE,
  activo          BOOLEAN DEFAULT TRUE,
  sucursal        TEXT CHECK (sucursal IN ('quito','guayaquil','ambos')) DEFAULT 'ambos',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_rep_updated ON public.repuestos;
CREATE TRIGGER trg_rep_updated
  BEFORE UPDATE ON public.repuestos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── 3. ÓRDENES DE TRABAJO ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ordenes_trabajo (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero          INTEGER GENERATED ALWAYS AS IDENTITY UNIQUE,
  vehiculo_id     UUID NOT NULL REFERENCES public.vehiculos(id),
  cliente_id      UUID NOT NULL REFERENCES public.perfiles(id),
  sucursal        TEXT NOT NULL CHECK (sucursal IN ('quito','guayaquil')),
  estado          TEXT NOT NULL DEFAULT 'presupuesto'
                    CHECK (estado IN ('presupuesto','aprobado','en_proceso','pausado',
                                      'completado','facturado','entregado','cancelado')),
  tipo            TEXT NOT NULL CHECK (tipo IN ('preventivo','correctivo','revision','otro')),
  km_entrada      INTEGER,
  km_salida       INTEGER,
  fecha_entrada   TIMESTAMPTZ DEFAULT NOW(),
  fecha_prometida TIMESTAMPTZ,
  fecha_salida    TIMESTAMPTZ,
  descripcion     TEXT,
  diagnostico     TEXT,
  observaciones   TEXT,
  firma_cliente   BOOLEAN DEFAULT FALSE,
  fotos_entrada   JSONB DEFAULT '[]',
  fotos_salida    JSONB DEFAULT '[]',
  cita_id         UUID REFERENCES public.citas(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_ot_updated ON public.ordenes_trabajo;
CREATE TRIGGER trg_ot_updated
  BEFORE UPDATE ON public.ordenes_trabajo
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── 4. LÍNEAS DE OT ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ot_lineas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ot_id           UUID NOT NULL REFERENCES public.ordenes_trabajo(id) ON DELETE CASCADE,
  tipo            TEXT NOT NULL CHECK (tipo IN ('servicio','repuesto','mano_obra','otro')),
  descripcion     TEXT NOT NULL,
  cantidad        NUMERIC(10,3) NOT NULL DEFAULT 1,
  precio_unitario NUMERIC(10,2) NOT NULL,
  descuento_pct   NUMERIC(5,2) DEFAULT 0,
  subtotal        NUMERIC(10,2) GENERATED ALWAYS AS
                    (ROUND(cantidad * precio_unitario * (1 - descuento_pct/100), 2)) STORED,
  repuesto_id     UUID REFERENCES public.repuestos(id),
  servicio_id     UUID REFERENCES public.servicios(id),
  mecanico_id     UUID REFERENCES public.perfiles(id),
  completado      BOOLEAN DEFAULT FALSE,
  notas           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 5. MECÁNICOS ASIGNADOS A OT ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ot_mecanicos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ot_id       UUID NOT NULL REFERENCES public.ordenes_trabajo(id) ON DELETE CASCADE,
  mecanico_id UUID NOT NULL REFERENCES public.perfiles(id),
  rol         TEXT DEFAULT 'principal' CHECK (rol IN ('principal','apoyo')),
  horas_est   NUMERIC(5,2),
  horas_real  NUMERIC(5,2),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 6. HISTORIAL DE ESTADOS DE OT ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ot_historial (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ot_id       UUID NOT NULL REFERENCES public.ordenes_trabajo(id) ON DELETE CASCADE,
  estado_ant  TEXT,
  estado_new  TEXT NOT NULL,
  usuario_id  UUID REFERENCES public.perfiles(id),
  nota        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 7. MOVIMIENTOS DE INVENTARIO ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.inventario_movimientos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repuesto_id UUID NOT NULL REFERENCES public.repuestos(id),
  tipo        TEXT NOT NULL CHECK (tipo IN ('entrada','salida','ajuste','devolucion')),
  cantidad    NUMERIC(10,3) NOT NULL,
  stock_ant   NUMERIC(10,3),
  stock_new   NUMERIC(10,3),
  referencia  TEXT,
  ot_id       UUID REFERENCES public.ordenes_trabajo(id),
  compra_id   UUID,  -- FK se agrega con ALTER al final (depende de compras)
  usuario_id  UUID REFERENCES public.perfiles(id),
  notas       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 8. CAJAS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cajas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sucursal    TEXT NOT NULL CHECK (sucursal IN ('quito','guayaquil')),
  nombre      TEXT NOT NULL DEFAULT 'Caja Principal',
  activa      BOOLEAN DEFAULT TRUE
);

-- ─── 9. SESIONES DE CAJA ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.caja_sesiones (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caja_id             UUID NOT NULL REFERENCES public.cajas(id),
  usuario_id          UUID NOT NULL REFERENCES public.perfiles(id),
  fecha_apertura      TIMESTAMPTZ DEFAULT NOW(),
  fecha_cierre        TIMESTAMPTZ,
  monto_apertura      NUMERIC(10,2) NOT NULL DEFAULT 0,
  monto_cierre        NUMERIC(10,2),
  total_efectivo      NUMERIC(10,2) DEFAULT 0,
  total_tarjeta       NUMERIC(10,2) DEFAULT 0,
  total_transferencia NUMERIC(10,2) DEFAULT 0,
  total_ventas        NUMERIC(10,2) DEFAULT 0,
  diferencia          NUMERIC(10,2),
  observaciones       TEXT,
  estado              TEXT DEFAULT 'abierta' CHECK (estado IN ('abierta','cerrada'))
);

-- ─── 10. FACTURAS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.facturas (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero           TEXT UNIQUE NOT NULL,
  tipo             TEXT NOT NULL DEFAULT 'factura'
                     CHECK (tipo IN ('factura','nota_credito','proforma','recibo')),
  ot_id            UUID REFERENCES public.ordenes_trabajo(id),
  cliente_id       UUID NOT NULL REFERENCES public.perfiles(id),
  sucursal         TEXT NOT NULL CHECK (sucursal IN ('quito','guayaquil')),
  fecha_emision    DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_vence      DATE,
  subtotal         NUMERIC(10,2) NOT NULL,
  descuento        NUMERIC(10,2) DEFAULT 0,
  subtotal_neto    NUMERIC(10,2),
  iva_pct          NUMERIC(5,2) DEFAULT 15,
  iva_valor        NUMERIC(10,2),
  total            NUMERIC(10,2) NOT NULL,
  estado           TEXT DEFAULT 'pendiente'
                     CHECK (estado IN ('pendiente','pagada','parcial','anulada','vencida')),
  notas            TEXT,
  sri_clave        TEXT,
  sri_autorizacion TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 11. LÍNEAS DE FACTURA ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.factura_lineas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  factura_id      UUID NOT NULL REFERENCES public.facturas(id) ON DELETE CASCADE,
  descripcion     TEXT NOT NULL,
  cantidad        NUMERIC(10,3) NOT NULL,
  precio_unitario NUMERIC(10,2) NOT NULL,
  descuento_pct   NUMERIC(5,2) DEFAULT 0,
  subtotal        NUMERIC(10,2),
  aplica_iva      BOOLEAN DEFAULT TRUE,
  ot_linea_id     UUID REFERENCES public.ot_lineas(id)
);

-- ─── 12. PAGOS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pagos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  factura_id  UUID NOT NULL REFERENCES public.facturas(id),
  monto       NUMERIC(10,2) NOT NULL,
  metodo      TEXT NOT NULL
                CHECK (metodo IN ('efectivo','tarjeta_credito','tarjeta_debito',
                                  'transferencia','cheque','otro')),
  referencia  TEXT,
  fecha       TIMESTAMPTZ DEFAULT NOW(),
  caja_id     UUID REFERENCES public.cajas(id),
  usuario_id  UUID REFERENCES public.perfiles(id),
  notas       TEXT
);

-- ─── 13. MOVIMIENTOS DE CAJA ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.caja_movimientos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sesion_id   UUID NOT NULL REFERENCES public.caja_sesiones(id),
  tipo        TEXT NOT NULL CHECK (tipo IN ('ingreso','egreso')),
  concepto    TEXT NOT NULL,
  monto       NUMERIC(10,2) NOT NULL,
  pago_id     UUID REFERENCES public.pagos(id),
  usuario_id  UUID REFERENCES public.perfiles(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 14. PROVEEDORES ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.proveedores (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      TEXT NOT NULL,
  ruc         TEXT UNIQUE,
  telefono    TEXT,
  email       TEXT,
  direccion   TEXT,
  contacto    TEXT,
  notas       TEXT,
  activo      BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 15. ÓRDENES DE COMPRA ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.compras (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero          TEXT UNIQUE,
  proveedor_id    UUID NOT NULL REFERENCES public.proveedores(id),
  sucursal        TEXT CHECK (sucursal IN ('quito','guayaquil')),
  fecha           DATE DEFAULT CURRENT_DATE,
  fecha_esperada  DATE,
  estado          TEXT DEFAULT 'pendiente'
                    CHECK (estado IN ('pendiente','recibida','parcial','cancelada')),
  subtotal        NUMERIC(10,2),
  iva             NUMERIC(10,2),
  total           NUMERIC(10,2),
  notas           TEXT,
  usuario_id      UUID REFERENCES public.perfiles(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 16. LÍNEAS DE COMPRA ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.compra_lineas (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  compra_id         UUID NOT NULL REFERENCES public.compras(id) ON DELETE CASCADE,
  repuesto_id       UUID NOT NULL REFERENCES public.repuestos(id),
  cantidad          NUMERIC(10,3) NOT NULL,
  precio_unitario   NUMERIC(10,2) NOT NULL,
  cantidad_recibida NUMERIC(10,3) DEFAULT 0,
  subtotal          NUMERIC(10,2)
);

-- ─── 17. FK diferida: inventario_movimientos → compras ────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'inventario_movimientos_compra_id_fkey'
      AND table_name = 'inventario_movimientos'
  ) THEN
    ALTER TABLE public.inventario_movimientos
      ADD CONSTRAINT inventario_movimientos_compra_id_fkey
      FOREIGN KEY (compra_id) REFERENCES public.compras(id);
  END IF;
END $$;

-- ─── 18. ROW LEVEL SECURITY ───────────────────────────────────────────────

ALTER TABLE public.ordenes_trabajo        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ot_lineas              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ot_mecanicos           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ot_historial           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repuestos              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias_repuesto    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario_movimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facturas               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.factura_lineas         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cajas                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caja_sesiones          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caja_movimientos       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proveedores            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compras                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compra_lineas          ENABLE ROW LEVEL SECURITY;

-- Órdenes de trabajo
DROP POLICY IF EXISTS "ot_cliente_select" ON public.ordenes_trabajo;
DROP POLICY IF EXISTS "ot_admin_insert"   ON public.ordenes_trabajo;
DROP POLICY IF EXISTS "ot_admin_update"   ON public.ordenes_trabajo;
CREATE POLICY "ot_cliente_select" ON public.ordenes_trabajo
  FOR SELECT USING (cliente_id = auth.uid() OR is_admin());
CREATE POLICY "ot_admin_insert"   ON public.ordenes_trabajo
  FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "ot_admin_update"   ON public.ordenes_trabajo
  FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());

-- Líneas OT
DROP POLICY IF EXISTS "ot_lineas_read"  ON public.ot_lineas;
DROP POLICY IF EXISTS "ot_lineas_admin" ON public.ot_lineas;
CREATE POLICY "ot_lineas_read"  ON public.ot_lineas
  FOR SELECT USING (
    ot_id IN (SELECT id FROM public.ordenes_trabajo WHERE cliente_id = auth.uid())
    OR is_admin()
  );
CREATE POLICY "ot_lineas_admin" ON public.ot_lineas
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- OT Mecánicos
DROP POLICY IF EXISTS "ot_mec_admin"  ON public.ot_mecanicos;
CREATE POLICY "ot_mec_admin" ON public.ot_mecanicos
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Historial OT
DROP POLICY IF EXISTS "ot_hist_read"  ON public.ot_historial;
DROP POLICY IF EXISTS "ot_hist_admin" ON public.ot_historial;
CREATE POLICY "ot_hist_read"  ON public.ot_historial
  FOR SELECT USING (
    ot_id IN (SELECT id FROM public.ordenes_trabajo WHERE cliente_id = auth.uid())
    OR is_admin()
  );
CREATE POLICY "ot_hist_admin" ON public.ot_historial
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Repuestos y categorías
DROP POLICY IF EXISTS "rep_read"      ON public.repuestos;
DROP POLICY IF EXISTS "rep_admin"     ON public.repuestos;
DROP POLICY IF EXISTS "cat_rep_read"  ON public.categorias_repuesto;
DROP POLICY IF EXISTS "cat_rep_admin" ON public.categorias_repuesto;
CREATE POLICY "rep_read"      ON public.repuestos           FOR SELECT USING (TRUE);
CREATE POLICY "rep_admin"     ON public.repuestos           FOR ALL    USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "cat_rep_read"  ON public.categorias_repuesto FOR SELECT USING (TRUE);
CREATE POLICY "cat_rep_admin" ON public.categorias_repuesto FOR ALL    USING (is_admin()) WITH CHECK (is_admin());

-- Inventario, caja, proveedores, compras: solo admin
DROP POLICY IF EXISTS "inv_admin"  ON public.inventario_movimientos;
DROP POLICY IF EXISTS "caja_admin" ON public.cajas;
DROP POLICY IF EXISTS "ses_admin"  ON public.caja_sesiones;
DROP POLICY IF EXISTS "mov_admin"  ON public.caja_movimientos;
DROP POLICY IF EXISTS "prov_admin" ON public.proveedores;
DROP POLICY IF EXISTS "comp_admin" ON public.compras;
DROP POLICY IF EXISTS "clin_admin" ON public.compra_lineas;
CREATE POLICY "inv_admin"  ON public.inventario_movimientos FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "caja_admin" ON public.cajas                  FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "ses_admin"  ON public.caja_sesiones          FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "mov_admin"  ON public.caja_movimientos       FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "prov_admin" ON public.proveedores            FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "comp_admin" ON public.compras                FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "clin_admin" ON public.compra_lineas          FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Facturas: cliente ve las suyas, admin todo
DROP POLICY IF EXISTS "factura_cliente"    ON public.facturas;
DROP POLICY IF EXISTS "factura_admin"      ON public.facturas;
DROP POLICY IF EXISTS "flin_admin"         ON public.factura_lineas;
DROP POLICY IF EXISTS "flin_cliente"       ON public.factura_lineas;
DROP POLICY IF EXISTS "pagos_admin"        ON public.pagos;
DROP POLICY IF EXISTS "pagos_cliente"      ON public.pagos;
CREATE POLICY "factura_cliente" ON public.facturas
  FOR SELECT USING (cliente_id = auth.uid() OR is_admin());
CREATE POLICY "factura_admin"   ON public.facturas
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "flin_admin"      ON public.factura_lineas
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "flin_cliente"    ON public.factura_lineas
  FOR SELECT USING (
    factura_id IN (SELECT id FROM public.facturas WHERE cliente_id = auth.uid())
  );
CREATE POLICY "pagos_admin"     ON public.pagos
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "pagos_cliente"   ON public.pagos
  FOR SELECT USING (
    factura_id IN (SELECT id FROM public.facturas WHERE cliente_id = auth.uid())
  );

-- ─── 19. DATOS INICIALES ──────────────────────────────────────────────────

-- Cajas por sucursal
INSERT INTO public.cajas (sucursal, nombre) VALUES
  ('quito',     'Caja Principal Quito'),
  ('guayaquil', 'Caja Principal Guayaquil')
ON CONFLICT DO NOTHING;

-- Categorías de repuestos
INSERT INTO public.categorias_repuesto (nombre, orden) VALUES
  ('Aceites y lubricantes',  1),
  ('Filtros',                2),
  ('Frenos',                 3),
  ('Suspensión',             4),
  ('Motor',                  5),
  ('Eléctrico',              6),
  ('Correas y cadenas',      7),
  ('Refrigeración',          8),
  ('Otros',                  9)
ON CONFLICT DO NOTHING;
