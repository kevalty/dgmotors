-- =============================================
-- 016_consulta_ant.sql
-- Cache de consultas ANT para no repetir requests externos
-- =============================================

CREATE TABLE IF NOT EXISTS public.ant_cache (
  placa       TEXT PRIMARY KEY,
  datos       JSONB NOT NULL,  -- {marca, modelo, anio, color, propietario, cedula, tipo}
  consultado  TIMESTAMPTZ DEFAULT NOW(),
  expira      TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days'
);

ALTER TABLE public.ant_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ant_r" ON public.ant_cache;
DROP POLICY IF EXISTS "ant_w" ON public.ant_cache;

CREATE POLICY "ant_r" ON public.ant_cache
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "ant_w" ON public.ant_cache
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.perfiles
      WHERE id = auth.uid()
        AND rol IN ('admin','asesor_servicios','facturadora','gerente','mecanico')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.perfiles
      WHERE id = auth.uid()
        AND rol IN ('admin','asesor_servicios','facturadora','gerente','mecanico')
    )
  );
