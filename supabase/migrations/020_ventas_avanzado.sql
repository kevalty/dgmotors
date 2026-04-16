-- =============================================
-- 020_ventas_avanzado.sql
-- Retenciones SRI, anticipos, prospectos
-- y campo factura_origen_id para notas de crédito
-- =============================================

-- Agregar referencia de origen a facturas (para notas de crédito/débito)
ALTER TABLE public.facturas
  ADD COLUMN IF NOT EXISTS factura_origen_id UUID REFERENCES public.facturas(id),
  ADD COLUMN IF NOT EXISTS motivo_nc TEXT;   -- motivo de la nota de crédito

-- RETENCIONES EN VENTAS (SRI Ecuador)
-- El cliente (pagador) retiene un % del pago y entrega un comprobante de retención
CREATE TABLE public.retenciones_venta (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  factura_id     UUID NOT NULL REFERENCES public.facturas(id) ON DELETE CASCADE,
  numero_ret     TEXT,                    -- número del comprobante de retención
  fecha          DATE NOT NULL,
  tipo           TEXT NOT NULL CHECK (tipo IN ('renta','iva')),
  codigo_ret     TEXT,                    -- código SRI (ej: 303, 312, 721, 722)
  concepto_ret   TEXT,                    -- descripción del concepto de retención
  porcentaje     NUMERIC(5,2) NOT NULL,
  base_imponible NUMERIC(15,2) NOT NULL,
  valor          NUMERIC(15,2) NOT NULL,  -- base × porcentaje / 100
  autorizacion   TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ANTICIPOS DE CLIENTES
-- El cliente paga antes de que se emita la factura
CREATE TABLE public.anticipos_cliente (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id  UUID NOT NULL REFERENCES public.perfiles(id),
  fecha       DATE NOT NULL,
  monto       NUMERIC(15,2) NOT NULL,
  saldo       NUMERIC(15,2) NOT NULL,     -- saldo disponible (monto - aplicado)
  metodo_pago TEXT CHECK (metodo_pago IN ('efectivo','tarjeta','transferencia','cheque')),
  referencia  TEXT,
  notas       TEXT,
  aplicado    BOOLEAN DEFAULT FALSE,      -- true cuando saldo = 0
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- APLICACIONES DE ANTICIPO A FACTURA
CREATE TABLE public.anticipo_aplicaciones (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anticipo_id UUID NOT NULL REFERENCES public.anticipos_cliente(id),
  factura_id  UUID NOT NULL REFERENCES public.facturas(id),
  monto       NUMERIC(15,2) NOT NULL,
  fecha       DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- PROSPECTOS (leads para vender el sistema a otros talleres)
CREATE TABLE public.prospectos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      TEXT NOT NULL,
  empresa     TEXT,
  cargo       TEXT,
  telefono    TEXT,
  email       TEXT,
  ciudad      TEXT,
  pais        TEXT DEFAULT 'Ecuador',
  estado      TEXT DEFAULT 'nuevo'
                CHECK (estado IN ('nuevo','contactado','interesado','propuesta','negociacion','cerrado','perdido')),
  origen      TEXT,   -- 'referido', 'redes', 'llamada', 'evento', etc.
  notas       TEXT,
  valor_est   NUMERIC(15,2),  -- valor estimado del contrato
  vendedor_id UUID REFERENCES public.perfiles(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger updated_at prospectos
CREATE TRIGGER trg_prospectos_updated
  BEFORE UPDATE ON public.prospectos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE public.retenciones_venta    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anticipos_cliente    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anticipo_aplicaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospectos           ENABLE ROW LEVEL SECURITY;

-- Retenciones: facturadora y contador gestionan, gerente lee
CREATE POLICY "ret_r" ON public.retenciones_venta
  FOR SELECT USING (tiene_rol(ARRAY['admin','contador','gerente','facturadora']));
CREATE POLICY "ret_w" ON public.retenciones_venta
  FOR ALL USING (tiene_rol(ARRAY['admin','facturadora','contador']));

-- Anticipos: facturadora registra, cliente ve los suyos
CREATE POLICY "antc_r" ON public.anticipos_cliente
  FOR SELECT USING (
    tiene_rol(ARRAY['admin','facturadora','gerente','contador'])
    OR cliente_id = auth.uid()
  );
CREATE POLICY "antc_w" ON public.anticipos_cliente
  FOR ALL USING (tiene_rol(ARRAY['admin','facturadora']));

CREATE POLICY "antap_r" ON public.anticipo_aplicaciones
  FOR SELECT USING (tiene_rol(ARRAY['admin','facturadora','gerente','contador']));
CREATE POLICY "antap_w" ON public.anticipo_aplicaciones
  FOR ALL USING (tiene_rol(ARRAY['admin','facturadora']));

-- Prospectos: admin y gerente
CREATE POLICY "pros_r" ON public.prospectos
  FOR SELECT USING (tiene_rol(ARRAY['admin','gerente']));
CREATE POLICY "pros_w" ON public.prospectos
  FOR ALL USING (tiene_rol(ARRAY['admin','gerente']));
