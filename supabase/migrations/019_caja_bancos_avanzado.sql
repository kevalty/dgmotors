-- =============================================
-- 019_caja_bancos_avanzado.sql
-- Cuentas bancarias, movimientos y tarjetas
-- =============================================

-- BANCOS / CUENTAS BANCARIAS
CREATE TABLE public.bancos (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre       TEXT NOT NULL,
  numero_cta   TEXT NOT NULL,
  tipo_cta     TEXT CHECK (tipo_cta IN ('corriente','ahorros')),
  cuenta_id    UUID REFERENCES public.plan_cuentas(id),
  sucursal     TEXT CHECK (sucursal IN ('quito','guayaquil','ambos')),
  saldo_inicial NUMERIC(15,2) DEFAULT 0,
  activo       BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- MOVIMIENTOS BANCARIOS
-- monto: positivo = ingreso, negativo = egreso
CREATE TABLE public.movimientos_banco (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  banco_id     UUID NOT NULL REFERENCES public.bancos(id) ON DELETE CASCADE,
  fecha        DATE NOT NULL,
  tipo         TEXT NOT NULL CHECK (tipo IN ('deposito','retiro','transferencia_entrada','transferencia_salida','nota_debito','nota_credito')),
  concepto     TEXT NOT NULL,
  monto        NUMERIC(15,2) NOT NULL,          -- siempre positivo; tipo define dirección
  referencia   TEXT,
  beneficiario TEXT,
  conciliado   BOOLEAN DEFAULT FALSE,
  usuario_id   UUID REFERENCES public.perfiles(id),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- TARJETAS DE CRÉDITO / DÉBITO
CREATE TABLE public.tarjetas (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre   TEXT NOT NULL,
  tipo     TEXT CHECK (tipo IN ('credito','debito')),
  banco_id UUID REFERENCES public.bancos(id) ON DELETE SET NULL,
  activa   BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger updated_at para bancos
CREATE TRIGGER trg_bancos_updated
  BEFORE UPDATE ON public.bancos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE public.bancos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos_banco ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tarjetas          ENABLE ROW LEVEL SECURITY;

-- Función auxiliar (puede ya existir de 021 — usar CREATE OR REPLACE)
CREATE OR REPLACE FUNCTION tiene_rol(roles TEXT[])
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol = ANY(roles)
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Bancos: contador y admin gestionan, gerente y facturadora ven
CREATE POLICY "ban_r" ON public.bancos
  FOR SELECT USING (tiene_rol(ARRAY['admin','contador','gerente','facturadora']));
CREATE POLICY "ban_w" ON public.bancos
  FOR ALL USING (tiene_rol(ARRAY['admin','contador']));

-- Movimientos: admin/contador/facturadora insertan, gerente solo lee
CREATE POLICY "mb_r" ON public.movimientos_banco
  FOR SELECT USING (tiene_rol(ARRAY['admin','contador','gerente','facturadora']));
CREATE POLICY "mb_w" ON public.movimientos_banco
  FOR ALL USING (tiene_rol(ARRAY['admin','contador','facturadora']));

-- Tarjetas: igual que bancos
CREATE POLICY "tar_r" ON public.tarjetas
  FOR SELECT USING (tiene_rol(ARRAY['admin','contador','gerente','facturadora']));
CREATE POLICY "tar_w" ON public.tarjetas
  FOR ALL USING (tiene_rol(ARRAY['admin','contador']));
