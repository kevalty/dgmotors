-- 006_seed_productos.sql — 10 sample products for DG Motors catalog

INSERT INTO productos (categoria_id, nombre, slug, descripcion, marca, precio_referencial, destacado, activo)
SELECT c.id, p.nombre, p.slug, p.descripcion, p.marca, p.precio_referencial, p.destacado, true
FROM (VALUES
  ('aceites-lubricantes', 'Aceite Motor Sintético 5W-30 1L',     'aceite-sintetico-5w30-1l',      'Aceite de motor 100% sintético para vehículos modernos con motores de alta tecnología. Protección superior y menor consumo.',        'Mobil 1',   18.50,  true),
  ('aceites-lubricantes', 'Aceite Motor Semisintético 10W-40 4L', 'aceite-semisistetico-10w40-4l', 'Aceite semisintético multiuso para gasolina y diésel. Ideal para motores con alto kilometraje.',                                    'Castrol',   32.00,  true),
  ('aceites-lubricantes', 'Aceite Caja Automática ATF Dexron VI', 'aceite-caja-automatica-atf',    'Fluido para transmisiones automáticas. Compatible con la mayoría de cajas automáticas Ford y GM.',                                 'Valvoline',  24.90, false),
  ('filtros',             'Filtro de Aceite Ford F-150 5.0L',     'filtro-aceite-ford-f150-5l',    'Filtro de aceite de alta calidad, compatible con Ford F-150 motor 5.0L V8 años 2011–2023. Retiene partículas desde 20 micras.',    'Motorcraft',  8.50,  true),
  ('filtros',             'Filtro de Aire para Toyota Hilux',      'filtro-aire-toyota-hilux',      'Filtro de aire de papel de alto rendimiento para Toyota Hilux 2.8L diésel. Mejora el rendimiento del motor.',                     'Toyota OEM', 14.00, false),
  ('filtros',             'Filtro de Combustible Universal Diésel','filtro-combustible-diesel',     'Filtro de combustible para motores diésel. Retiene impurezas y agua. Compatibilidad universal para la mayoría de camionetas.',    'Bosch',      11.90, false),
  ('frenos',              'Pastillas de Freno Delantera Ford Explorer', 'pastillas-freno-ford-explorer', 'Pastillas de freno cerámicas para Ford Explorer 2011–2022. Baja generación de polvo, silenciosas y de larga duración.',      'Monroe',    38.00,  true),
  ('frenos',              'Disco de Freno Ventilado Trasero',      'disco-freno-ventilado-trasero', 'Disco de freno trasero ventilado de alta resistencia al calor. Compatible con Ford F-150 y Explorer.',                           'Brembo',    65.00,  true),
  ('suspension',          'Amortiguador Delantero Chevrolet D-Max','amortiguador-chevrolet-dmax',   'Amortiguador de gas monotubo para Chevrolet D-Max y similares. Mayor control y confort en todo terreno.',                        'KYB',       89.00, false),
  ('electricidad',        'Batería 65Ah 12V MF',                   'bateria-65ah-12v',              'Batería libre de mantenimiento 65Ah 12V 580 CCA. Compatible con la mayoría de vehículos americanos y asiáticos.',               'Hankook',   95.00,  true)
) AS p(cat_slug, nombre, slug, descripcion, marca, precio_referencial, destacado)
JOIN categorias_producto c ON c.slug = p.cat_slug
ON CONFLICT (slug) DO NOTHING;
