-- 010_contactos_table.sql
-- Tabla para mensajes del formulario de contacto público

CREATE TABLE IF NOT EXISTS public.contactos (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre     TEXT NOT NULL,
  email      TEXT NOT NULL,
  telefono   TEXT,
  sucursal   TEXT,
  mensaje    TEXT NOT NULL,
  leido      BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.contactos ENABLE ROW LEVEL SECURITY;

-- Solo admin puede leer y actualizar
CREATE POLICY "contactos_admin_select" ON public.contactos
  FOR SELECT USING (is_admin());

CREATE POLICY "contactos_admin_update" ON public.contactos
  FOR UPDATE USING (is_admin());

-- Cualquiera puede insertar (formulario público)
CREATE POLICY "contactos_public_insert" ON public.contactos
  FOR INSERT WITH CHECK (TRUE);
