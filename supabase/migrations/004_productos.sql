-- 004_productos.sql — Product catalog tables

CREATE TABLE IF NOT EXISTS categorias_producto (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  orden INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS productos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria_id uuid REFERENCES categorias_producto(id) ON DELETE SET NULL,
  nombre TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  marca TEXT,
  precio_referencial NUMERIC(10,2),
  imagen_url TEXT,
  variantes JSONB DEFAULT '[]',
  compatible_con TEXT[] DEFAULT '{}',
  destacado BOOLEAN DEFAULT false,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE categorias_producto ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "categorias_producto_public_read" ON categorias_producto
  FOR SELECT USING (true);

CREATE POLICY "productos_public_read" ON productos
  FOR SELECT USING (activo = true);

-- Admin full access
CREATE POLICY "categorias_producto_admin_all" ON categorias_producto
  FOR ALL USING (
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin')
  );

CREATE POLICY "productos_admin_all" ON productos
  FOR ALL USING (
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin')
  );

-- Seed: product categories
INSERT INTO categorias_producto (nombre, slug, orden) VALUES
  ('Aceites y Lubricantes', 'aceites-lubricantes', 1),
  ('Filtros', 'filtros', 2),
  ('Frenos', 'frenos', 3),
  ('Suspensión', 'suspension', 4),
  ('Electricidad', 'electricidad', 5),
  ('Accesorios', 'accesorios', 6)
ON CONFLICT (slug) DO NOTHING;
