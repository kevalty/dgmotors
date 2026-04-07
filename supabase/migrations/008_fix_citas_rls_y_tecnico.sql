-- ============================================================
-- 008_fix_citas_rls_y_tecnico.sql
-- EJECUTAR ESTE ARCHIVO EN SUPABASE SQL EDITOR
-- Consolida las migraciones 007 + correcciones de RLS para citas
-- ============================================================

-- 1. Agregar columna tecnico_id a citas si no existe
ALTER TABLE public.citas
  ADD COLUMN IF NOT EXISTS tecnico_id UUID REFERENCES public.perfiles(id);

-- 2. Recrear todas las políticas de citas con DROP + CREATE para evitar conflictos

DROP POLICY IF EXISTS "citas_select" ON public.citas;
DROP POLICY IF EXISTS "citas_insert" ON public.citas;
DROP POLICY IF EXISTS "citas_update" ON public.citas;
DROP POLICY IF EXISTS "citas_delete" ON public.citas;
DROP POLICY IF EXISTS "citas_update_mecanico" ON public.citas;

-- SELECT: cliente ve las suyas, admin y mecánico ven todas
CREATE POLICY "citas_select" ON public.citas
  FOR SELECT USING (
    cliente_id = auth.uid()
    OR is_admin()
    OR is_mecanico()
  );

-- INSERT: cliente crea la suya, admin crea para cualquiera
CREATE POLICY "citas_insert" ON public.citas
  FOR INSERT WITH CHECK (
    cliente_id = auth.uid() OR is_admin()
  );

-- UPDATE: admin y mecánico pueden actualizar (cambiar estado, asignar técnico)
CREATE POLICY "citas_update" ON public.citas
  FOR UPDATE USING (
    cliente_id = auth.uid() OR is_admin() OR is_mecanico()
  );

-- DELETE: solo admin
CREATE POLICY "citas_delete" ON public.citas
  FOR DELETE USING (is_admin());

-- 3. Asegurarse que perfiles sea legible por mecánicos (para ver nombre del cliente en citas)
DROP POLICY IF EXISTS "perfiles_select_own" ON public.perfiles;
CREATE POLICY "perfiles_select_own" ON public.perfiles
  FOR SELECT USING (
    auth.uid() = id OR is_admin() OR is_mecanico()
  );

-- 4. Asegurarse que vehículos sea legible por mecánicos
DROP POLICY IF EXISTS "vehiculos_select" ON public.vehiculos;
CREATE POLICY "vehiculos_select" ON public.vehiculos
  FOR SELECT USING (
    cliente_id = auth.uid() OR is_admin() OR is_mecanico()
  );
