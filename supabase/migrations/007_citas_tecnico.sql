-- Agregar campo tecnico_id a citas (mecánico responsable)
ALTER TABLE public.citas
  ADD COLUMN IF NOT EXISTS tecnico_id UUID REFERENCES public.perfiles(id);

-- Política: mecánico puede actualizar citas (para cambiar estado)
CREATE POLICY "citas_update_mecanico" ON public.citas
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.perfiles
      WHERE id = auth.uid() AND rol IN ('admin', 'mecanico')
    )
  );
