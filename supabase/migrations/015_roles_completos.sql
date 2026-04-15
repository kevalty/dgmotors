-- =============================================
-- 015_roles_completos.sql
-- Agrega roles adicionales al constraint de perfiles
-- =============================================

ALTER TABLE public.perfiles
  DROP CONSTRAINT IF EXISTS perfiles_rol_check,
  ADD CONSTRAINT perfiles_rol_check
    CHECK (rol IN (
      'cliente','admin','mecanico',
      'gerente','facturadora','asesor_servicios',
      'asesor_repuestos','bodeguero','contador'
    ));
