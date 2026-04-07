-- 005_mecanico_role.sql — Add mecanico role with scoped permissions

-- Extend the rol check constraint to include 'mecanico'
ALTER TABLE public.perfiles DROP CONSTRAINT IF EXISTS perfiles_rol_check;
ALTER TABLE public.perfiles ADD CONSTRAINT perfiles_rol_check
  CHECK (rol IN ('cliente', 'admin', 'mecanico'));

-- Helper function for mecanico check
CREATE OR REPLACE FUNCTION is_mecanico()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.perfiles
    WHERE id = auth.uid() AND rol = 'mecanico'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Vehículos: mechanics can see all vehicles
DROP POLICY IF EXISTS "vehiculos_select" ON public.vehiculos;
CREATE POLICY "vehiculos_select" ON public.vehiculos
  FOR SELECT USING (cliente_id = auth.uid() OR is_admin() OR is_mecanico());

-- Mantenimientos: mechanics can insert, update, and read all
DROP POLICY IF EXISTS "mant_select" ON public.mantenimientos;
CREATE POLICY "mant_select" ON public.mantenimientos
  FOR SELECT USING (
    vehiculo_id IN (SELECT id FROM public.vehiculos WHERE cliente_id = auth.uid())
    OR is_admin() OR is_mecanico()
  );

DROP POLICY IF EXISTS "mant_insert" ON public.mantenimientos;
CREATE POLICY "mant_insert" ON public.mantenimientos
  FOR INSERT WITH CHECK (is_admin() OR is_mecanico());

DROP POLICY IF EXISTS "mant_update" ON public.mantenimientos;
CREATE POLICY "mant_update" ON public.mantenimientos
  FOR UPDATE USING (is_admin() OR is_mecanico());

-- Cambios de aceite: mechanics can insert, update, and read all
DROP POLICY IF EXISTS "aceite_select" ON public.cambios_aceite;
CREATE POLICY "aceite_select" ON public.cambios_aceite
  FOR SELECT USING (
    vehiculo_id IN (SELECT id FROM public.vehiculos WHERE cliente_id = auth.uid())
    OR is_admin() OR is_mecanico()
  );

DROP POLICY IF EXISTS "aceite_insert" ON public.cambios_aceite;
CREATE POLICY "aceite_insert" ON public.cambios_aceite
  FOR INSERT WITH CHECK (is_admin() OR is_mecanico());

DROP POLICY IF EXISTS "aceite_update" ON public.cambios_aceite;
CREATE POLICY "aceite_update" ON public.cambios_aceite
  FOR UPDATE USING (is_admin() OR is_mecanico());

-- Citas: mechanics can read all citas (to pick vehicle/cita context)
DROP POLICY IF EXISTS "citas_select" ON public.citas;
CREATE POLICY "citas_select" ON public.citas
  FOR SELECT USING (cliente_id = auth.uid() OR is_admin() OR is_mecanico());

-- Perfiles: mechanics can read all profiles (to show client name on vehicle)
DROP POLICY IF EXISTS "perfiles_select_own" ON public.perfiles;
CREATE POLICY "perfiles_select_own" ON public.perfiles
  FOR SELECT USING (auth.uid() = id OR is_admin() OR is_mecanico());

-- Notificaciones: mechanics can see their own, can also insert for admins
CREATE POLICY "notif_insert_mecanico" ON public.notificaciones
  FOR INSERT WITH CHECK (is_admin() OR is_mecanico());
