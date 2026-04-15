-- =============================================
-- 014_checklist_fotos_ot.sql
-- Agrega checklist de recepción y soporte de fotos a ordenes_trabajo
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- Checklist de recepción (JSONB con estructura predefinida)
ALTER TABLE public.ordenes_trabajo
  ADD COLUMN IF NOT EXISTS checklist_entrada JSONB DEFAULT '{}';

-- Firma digital del cliente (base64 o URL)
ALTER TABLE public.ordenes_trabajo
  ADD COLUMN IF NOT EXISTS firma_url TEXT;

-- Email del cliente al momento de entrada (para notificaciones)
ALTER TABLE public.ordenes_trabajo
  ADD COLUMN IF NOT EXISTS cliente_email TEXT;
