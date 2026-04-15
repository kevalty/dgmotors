-- ==============================================
-- 012_reset_y_seed_final.sql
-- DG Motors — Reset completo + Seed de presentación
-- ==============================================
-- ⚠️  ADVERTENCIA: Borra TODOS los usuarios y datos.
--     Ejecutar solo en entorno de demo/desarrollo.
--
-- CREDENCIALES (todos con contraseña: Demo1234!)
-- ─────────────────────────────────────────────
--  admin1@dgmotors.com       → Admin
--  carlos@dgmotors.com       → Mecánico (Quito)
--  miguel@dgmotors.com       → Mecánico (Guayaquil)
--  jvargas@gmail.com         → Cliente — F-150 + Explorer
--  amorales@gmail.com        → Cliente — Ranger
--  rchiriboga@gmail.com      → Cliente — F-250 + Mustang
--  salvarado@gmail.com       → Cliente — Escape
--  despinoza@gmail.com       → Cliente — Expedition
-- ==============================================

-- ============================================================
-- PASO 1: LIMPIAR TODO
-- ============================================================
TRUNCATE public.contactos          RESTART IDENTITY CASCADE;
TRUNCATE public.reseñas            RESTART IDENTITY CASCADE;
TRUNCATE public.notificaciones     RESTART IDENTITY CASCADE;
TRUNCATE public.cambios_aceite     RESTART IDENTITY CASCADE;
TRUNCATE public.mantenimientos     RESTART IDENTITY CASCADE;
TRUNCATE public.citas              RESTART IDENTITY CASCADE;
TRUNCATE public.vehiculos          RESTART IDENTITY CASCADE;
TRUNCATE public.perfiles           RESTART IDENTITY CASCADE;
DELETE FROM auth.users;

-- ============================================================
-- PASO 2: SEED COMPLETO
-- ============================================================
DO $$
DECLARE
  -- UUIDs usuarios
  uid_admin UUID := 'aaaaaaaa-0000-0000-0000-000000000001';
  uid_mec1  UUID := 'bbbbbbbb-0000-0000-0000-000000000001';
  uid_mec2  UUID := 'bbbbbbbb-0000-0000-0000-000000000002';
  uid_cli1  UUID := 'cccccccc-0000-0000-0000-000000000001'; -- Juan Vargas
  uid_cli2  UUID := 'cccccccc-0000-0000-0000-000000000002'; -- Andrea Morales
  uid_cli3  UUID := 'cccccccc-0000-0000-0000-000000000003'; -- Roberto Chiriboga
  uid_cli4  UUID := 'cccccccc-0000-0000-0000-000000000004'; -- Stephanie Alvarado
  uid_cli5  UUID := 'cccccccc-0000-0000-0000-000000000005'; -- Diego Espinoza

  -- UUIDs vehículos
  vid1 UUID := 'dddddddd-0000-0000-0000-000000000001'; -- F-150  / Vargas
  vid2 UUID := 'dddddddd-0000-0000-0000-000000000002'; -- Explorer / Vargas
  vid3 UUID := 'dddddddd-0000-0000-0000-000000000003'; -- Ranger / Morales
  vid4 UUID := 'dddddddd-0000-0000-0000-000000000004'; -- F-250 / Chiriboga
  vid5 UUID := 'dddddddd-0000-0000-0000-000000000005'; -- Mustang / Chiriboga
  vid6 UUID := 'dddddddd-0000-0000-0000-000000000006'; -- Escape / Alvarado
  vid7 UUID := 'dddddddd-0000-0000-0000-000000000007'; -- Expedition / Espinoza

  -- IDs de servicios
  serv_aceite  UUID;
  serv_mant5k  UUID;
  serv_mant10k UUID;
  serv_diag    UUID;
  serv_frenos  UUID;
  serv_amort   UUID;

  inst_id UUID;

BEGIN
  SELECT instance_id INTO inst_id FROM auth.users LIMIT 1;
  IF inst_id IS NULL THEN
    inst_id := '00000000-0000-0000-0000-000000000000';
  END IF;

  SELECT id INTO serv_aceite  FROM public.servicios WHERE nombre ILIKE '%aceite%'               LIMIT 1;
  SELECT id INTO serv_mant5k  FROM public.servicios WHERE nombre ILIKE '%5.000%'                LIMIT 1;
  SELECT id INTO serv_mant10k FROM public.servicios WHERE nombre ILIKE '%10.000%'               LIMIT 1;
  SELECT id INTO serv_diag    FROM public.servicios WHERE nombre ILIKE '%diagnóstico computar%' LIMIT 1;
  SELECT id INTO serv_frenos  FROM public.servicios WHERE nombre ILIKE '%pastillas%'            LIMIT 1;
  SELECT id INTO serv_amort   FROM public.servicios WHERE nombre ILIKE '%amortiguadores%'       LIMIT 1;

  -- ──────────────────────────────────────────
  -- USUARIOS EN AUTH
  -- ──────────────────────────────────────────
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_user_meta_data, raw_app_meta_data,
    created_at, updated_at, role, aud,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) VALUES
    -- Admin
    (uid_admin, inst_id, 'admin1@dgmotors.com',
     crypt('Demo1234!', gen_salt('bf')), NOW() - INTERVAL '1 year',
     '{"nombre":"Admin","apellido":"DG Motors"}'::jsonb,
     '{"provider":"email","providers":["email"]}'::jsonb,
     NOW() - INTERVAL '1 year', NOW(), 'authenticated', 'authenticated',
     '', '', '', ''),

    -- Mecánico 1
    (uid_mec1, inst_id, 'carlos@dgmotors.com',
     crypt('Demo1234!', gen_salt('bf')), NOW() - INTERVAL '8 months',
     '{"nombre":"Carlos","apellido":"Aguirre"}'::jsonb,
     '{"provider":"email","providers":["email"]}'::jsonb,
     NOW() - INTERVAL '8 months', NOW(), 'authenticated', 'authenticated',
     '', '', '', ''),

    -- Mecánico 2
    (uid_mec2, inst_id, 'miguel@dgmotors.com',
     crypt('Demo1234!', gen_salt('bf')), NOW() - INTERVAL '7 months',
     '{"nombre":"Miguel","apellido":"Torres"}'::jsonb,
     '{"provider":"email","providers":["email"]}'::jsonb,
     NOW() - INTERVAL '7 months', NOW(), 'authenticated', 'authenticated',
     '', '', '', ''),

    -- Clientes
    (uid_cli1, inst_id, 'jvargas@gmail.com',
     crypt('Demo1234!', gen_salt('bf')), NOW() - INTERVAL '5 months',
     '{"nombre":"Juan","apellido":"Vargas"}'::jsonb,
     '{"provider":"email","providers":["email"]}'::jsonb,
     NOW() - INTERVAL '5 months', NOW(), 'authenticated', 'authenticated',
     '', '', '', ''),

    (uid_cli2, inst_id, 'amorales@gmail.com',
     crypt('Demo1234!', gen_salt('bf')), NOW() - INTERVAL '4 months',
     '{"nombre":"Andrea","apellido":"Morales"}'::jsonb,
     '{"provider":"email","providers":["email"]}'::jsonb,
     NOW() - INTERVAL '4 months', NOW(), 'authenticated', 'authenticated',
     '', '', '', ''),

    (uid_cli3, inst_id, 'rchiriboga@gmail.com',
     crypt('Demo1234!', gen_salt('bf')), NOW() - INTERVAL '3 months',
     '{"nombre":"Roberto","apellido":"Chiriboga"}'::jsonb,
     '{"provider":"email","providers":["email"]}'::jsonb,
     NOW() - INTERVAL '3 months', NOW(), 'authenticated', 'authenticated',
     '', '', '', ''),

    (uid_cli4, inst_id, 'salvarado@gmail.com',
     crypt('Demo1234!', gen_salt('bf')), NOW() - INTERVAL '2 months',
     '{"nombre":"Stephanie","apellido":"Alvarado"}'::jsonb,
     '{"provider":"email","providers":["email"]}'::jsonb,
     NOW() - INTERVAL '2 months', NOW(), 'authenticated', 'authenticated',
     '', '', '', ''),

    (uid_cli5, inst_id, 'despinoza@gmail.com',
     crypt('Demo1234!', gen_salt('bf')), NOW() - INTERVAL '1 month',
     '{"nombre":"Diego","apellido":"Espinoza"}'::jsonb,
     '{"provider":"email","providers":["email"]}'::jsonb,
     NOW() - INTERVAL '1 month', NOW(), 'authenticated', 'authenticated',
     '', '', '', '')
  ON CONFLICT (id) DO NOTHING;

  -- ──────────────────────────────────────────
  -- ACTUALIZAR PERFILES
  -- ──────────────────────────────────────────
  UPDATE public.perfiles SET
    nombre = 'Admin', apellido = 'DG Motors',
    telefono = '+593 99 000 0001', rol = 'admin'
  WHERE id = uid_admin;

  UPDATE public.perfiles SET
    nombre = 'Carlos', apellido = 'Aguirre',
    telefono = '+593 98 100 0001', rol = 'mecanico'
  WHERE id = uid_mec1;

  UPDATE public.perfiles SET
    nombre = 'Miguel', apellido = 'Torres',
    telefono = '+593 98 100 0002', rol = 'mecanico'
  WHERE id = uid_mec2;

  UPDATE public.perfiles SET
    nombre = 'Juan', apellido = 'Vargas',
    telefono = '+593 99 200 0001', cedula = '1712345601'
  WHERE id = uid_cli1;

  UPDATE public.perfiles SET
    nombre = 'Andrea', apellido = 'Morales',
    telefono = '+593 99 200 0002', cedula = '1712345602'
  WHERE id = uid_cli2;

  UPDATE public.perfiles SET
    nombre = 'Roberto', apellido = 'Chiriboga',
    telefono = '+593 99 200 0003', cedula = '1712345603'
  WHERE id = uid_cli3;

  UPDATE public.perfiles SET
    nombre = 'Stephanie', apellido = 'Alvarado',
    telefono = '+593 98 200 0004', cedula = '0912345604'
  WHERE id = uid_cli4;

  UPDATE public.perfiles SET
    nombre = 'Diego', apellido = 'Espinoza',
    telefono = '+593 98 200 0005', cedula = '0912345605'
  WHERE id = uid_cli5;

  -- ──────────────────────────────────────────
  -- VEHÍCULOS
  -- ──────────────────────────────────────────
  INSERT INTO public.vehiculos
    (id, cliente_id, placa, marca, modelo, anio, color, kilometraje, tipo, combustible)
  VALUES
    (vid1, uid_cli1, 'PBA-1234', 'Ford', 'F-150',      2019, 'Blanco',  87500, 'pickup', 'gasolina'),
    (vid2, uid_cli1, 'PCA-5678', 'Ford', 'Explorer',   2021, 'Gris',    45200, 'suv',    'gasolina'),
    (vid3, uid_cli2, 'GUB-2345', 'Ford', 'Ranger',     2020, 'Negro',   62300, 'pickup', 'diesel'),
    (vid4, uid_cli3, 'PBB-3456', 'Ford', 'F-250',      2018, 'Rojo',   112000, 'pickup', 'diesel'),
    (vid5, uid_cli3, 'PDA-7890', 'Ford', 'Mustang',    2017, 'Azul',    58000, 'sedan',  'gasolina'),
    (vid6, uid_cli4, 'GUA-4567', 'Ford', 'Escape',     2022, 'Blanco',  28400, 'suv',    'gasolina'),
    (vid7, uid_cli5, 'PBA-9012', 'Ford', 'Expedition', 2016, 'Negro',  143000, 'suv',    'gasolina')
  ON CONFLICT (placa) DO NOTHING;

  -- ──────────────────────────────────────────
  -- CITAS
  -- ──────────────────────────────────────────
  INSERT INTO public.citas
    (cliente_id, vehiculo_id, servicio_id, sucursal, fecha_hora, estado, notas_cliente, notas_admin, tecnico_id)
  VALUES
    -- HOY pendientes (admin debe confirmar)
    (uid_cli5, vid7, serv_aceite,  'quito',
     (CURRENT_DATE + TIME '09:00')::TIMESTAMPTZ, 'pendiente',
     'El motor hace un ruido extraño al arrancar en frío. También quiero cambio de aceite.', NULL, NULL),

    (uid_cli2, vid3, serv_diag, 'guayaquil',
     (CURRENT_DATE + TIME '11:30')::TIMESTAMPTZ, 'pendiente',
     'Luz de check engine encendida hace 3 días.', NULL, NULL),

    -- HOY confirmada con mecánico
    (uid_cli1, vid1, serv_mant10k, 'quito',
     (CURRENT_DATE + TIME '10:00')::TIMESTAMPTZ, 'confirmada',
     'Mantenimiento de 10.000 km. Por favor revisar también frenos.',
     'Cliente con dos vehículos registrados.', uid_mec1),

    -- HOY en proceso
    (uid_cli3, vid4, serv_frenos, 'quito',
     (CURRENT_DATE + TIME '08:00')::TIMESTAMPTZ, 'en_proceso',
     'Frenos hacen ruido al frenar fuerte.',
     'Se inspeccionaron los 4 frenos. Reemplazando pastillas delanteras y traseras.', uid_mec1),

    -- MAÑANA pendiente
    (uid_cli4, vid6, serv_mant5k, 'guayaquil',
     (CURRENT_DATE + INTERVAL '1 day' + TIME '14:00')::TIMESTAMPTZ, 'pendiente',
     NULL, NULL, NULL),

    -- MAÑANA confirmada
    (uid_cli1, vid2, serv_diag, 'quito',
     (CURRENT_DATE + INTERVAL '1 day' + TIME '10:30')::TIMESTAMPTZ, 'confirmada',
     'Revisión general pre-viaje largo.', NULL, uid_mec2),

    -- SEMANA PASADA completadas
    (uid_cli2, vid3, serv_aceite, 'guayaquil',
     (CURRENT_DATE - INTERVAL '5 days' + TIME '09:00')::TIMESTAMPTZ, 'completada',
     'Cambio de aceite sintético.',
     'Cambio de aceite Shell 5W-40 y filtro. Cliente satisfecho.', uid_mec2),

    (uid_cli5, vid7, serv_amort, 'quito',
     (CURRENT_DATE - INTERVAL '6 days' + TIME '11:00')::TIMESTAMPTZ, 'completada',
     'Ruido en suspensión delantera al pasar por huecos.',
     'Amortiguadores Monroe reemplazados. Alineación verificada.', uid_mec1),

    (uid_cli4, vid6, serv_diag, 'guayaquil',
     (CURRENT_DATE - INTERVAL '8 days' + TIME '10:00')::TIMESTAMPTZ, 'completada',
     'Diagnóstico general por compra reciente.',
     'Sin fallas. Vehículo en excelente estado.', uid_mec2),

    -- HACE 2 SEMANAS completadas
    (uid_cli1, vid1, serv_frenos, 'quito',
     (CURRENT_DATE - INTERVAL '14 days' + TIME '09:00')::TIMESTAMPTZ, 'completada',
     'Cambio de pastillas delanteras.',
     'Pastillas Bosch colocadas. Discos en buen estado.', uid_mec1),

    -- CANCELADA
    (uid_cli3, vid5, serv_mant5k, 'quito',
     (CURRENT_DATE - INTERVAL '10 days' + TIME '15:00')::TIMESTAMPTZ, 'cancelada',
     NULL, 'Cliente canceló por viaje imprevisto.', NULL)
  ;

  -- ──────────────────────────────────────────
  -- MANTENIMIENTOS
  -- ──────────────────────────────────────────
  INSERT INTO public.mantenimientos
    (vehiculo_id, tipo, descripcion, kilometraje, fecha, costo,
     proxima_fecha, proximo_km, repuestos, observaciones, tecnico_id)
  VALUES
    (vid3, 'cambio_aceite',
     'Cambio de aceite sintético Shell Helix 5W-40 y filtro. Revisión de niveles completa.',
     62300, CURRENT_DATE - INTERVAL '5 days', 78.00,
     CURRENT_DATE + INTERVAL '3 months', 67300,
     '[{"nombre":"Aceite Shell Helix 5W-40 6L","cantidad":1,"costo":54},{"nombre":"Filtro aceite Motorcraft","cantidad":1,"costo":12},{"nombre":"Mano de obra","cantidad":1,"costo":12}]'::jsonb,
     'Frenos y neumáticos revisados. Todo en orden.', uid_mec2),

    (vid7, 'correctivo',
     'Cambio de amortiguadores delanteros Monroe OESpectrum. Geometría de suspensión y alineación verificada.',
     143000, CURRENT_DATE - INTERVAL '6 days', 390.00, NULL, NULL,
     '[{"nombre":"Amortiguador Monroe delantero der.","cantidad":1,"costo":148},{"nombre":"Amortiguador Monroe delantero izq.","cantidad":1,"costo":148},{"nombre":"Bujes de amortiguador","cantidad":2,"costo":22},{"nombre":"Mano de obra","cantidad":1,"costo":72}]'::jsonb,
     'Amortiguadores con 143.000 km. Revisar traseros en próxima visita.', uid_mec1),

    (vid6, 'preventivo',
     'Diagnóstico computarizado completo. Lectura de códigos OBD-II. Revisión de motor, transmisión y escape.',
     28400, CURRENT_DATE - INTERVAL '8 days', 45.00,
     CURRENT_DATE + INTERVAL '6 months', NULL,
     '[]'::jsonb,
     'Sin códigos de falla. Vehículo en excelente condición.', uid_mec2),

    (vid1, 'correctivo',
     'Cambio de pastillas de freno delanteras Bosch QuietCast. Discos revisados (buen estado). Purga de líquido DOT4.',
     87500, CURRENT_DATE - INTERVAL '14 days', 125.00, NULL, NULL,
     '[{"nombre":"Pastillas Bosch QuietCast F-150","cantidad":1,"costo":72},{"nombre":"Líquido frenos DOT4","cantidad":1,"costo":18},{"nombre":"Mano de obra","cantidad":1,"costo":35}]'::jsonb,
     'Discos traseros recomendados cambiar en ~20.000 km adicionales.', uid_mec1),

    (vid4, 'preventivo',
     'Mantenimiento mayor 110.000 km. Aceite diésel, filtros de aceite/aire/combustible. Revisión de correa y batería.',
     110000, CURRENT_DATE - INTERVAL '21 days', 210.00,
     CURRENT_DATE + INTERVAL '4 months', 115000,
     '[{"nombre":"Aceite Castrol 15W-40 Diesel 7L","cantidad":1,"costo":85},{"nombre":"Filtro aceite Motorcraft","cantidad":1,"costo":14},{"nombre":"Filtro de aire F-250","cantidad":1,"costo":28},{"nombre":"Filtro combustible diesel","cantidad":1,"costo":22},{"nombre":"Mano de obra","cantidad":1,"costo":61}]'::jsonb,
     'Batería al 72% — recomendable cambiar en 6-8 meses.', uid_mec1)
  ;

  -- ──────────────────────────────────────────
  -- CAMBIOS DE ACEITE
  -- ──────────────────────────────────────────
  INSERT INTO public.cambios_aceite
    (vehiculo_id, fecha, kilometraje, tipo_aceite, marca_aceite, viscosidad, cantidad_litros, proxima_fecha, proximo_km)
  VALUES
    -- F-150 Vargas — próximo en 1 mes (alerta amarilla)
    (vid1, CURRENT_DATE - INTERVAL '3 months',
     82000, 'sintético', 'Mobil 1', '5W-30', 5.0,
     CURRENT_DATE + INTERVAL '1 month', 92000),

    -- Explorer Vargas — ok
    (vid2, CURRENT_DATE - INTERVAL '1 month',
     44000, 'sintético', 'Mobil 1', '5W-30', 4.5,
     CURRENT_DATE + INTERVAL '3 months', 49000),

    -- Ranger Morales — reciente
    (vid3, CURRENT_DATE - INTERVAL '5 days',
     62300, 'sintético', 'Shell Helix', '5W-40', 6.0,
     CURRENT_DATE + INTERVAL '3 months', 67300),

    -- F-250 Chiriboga — ok
    (vid4, CURRENT_DATE - INTERVAL '21 days',
     110000, 'sintético', 'Castrol', '15W-40', 7.0,
     CURRENT_DATE + INTERVAL '4 months', 115000),

    -- Mustang Chiriboga — VENCIDO (alerta roja para demo)
    (vid5, CURRENT_DATE - INTERVAL '5 months',
     54000, 'sintético', 'Motorcraft', '5W-20', 5.0,
     CURRENT_DATE - INTERVAL '2 months', 59000),

    -- Escape Alvarado — VENCIDO (alerta roja para demo)
    (vid6, CURRENT_DATE - INTERVAL '4 months',
     24000, 'sintético', 'Mobil', '5W-30', 4.0,
     CURRENT_DATE - INTERVAL '1 month', 34000),

    -- Expedition Espinoza — próximo en 1 mes
    (vid7, CURRENT_DATE - INTERVAL '2 months',
     140000, 'semisintético', 'Valvoline', '10W-40', 6.5,
     CURRENT_DATE + INTERVAL '1 month', 145000)
  ;

  -- ──────────────────────────────────────────
  -- MENSAJES DE CONTACTO
  -- ──────────────────────────────────────────
  INSERT INTO public.contactos (nombre, email, telefono, sucursal, mensaje, leido, created_at) VALUES
    ('Patricia Suárez', 'patricia.suarez@gmail.com', '+593 99 234 5678', 'quito',
     'Buenos días, tengo una Ford Explorer 2018 y quisiera cotizar el mantenimiento de los 50.000 km. ¿Cuánto estaría costando?',
     FALSE, NOW() - INTERVAL '2 hours'),

    ('Fernando Lozada', 'flozada@hotmail.com', '+593 98 876 5432', 'guayaquil',
     'Hola, mi camioneta Ranger diésel 2020 está botando humo negro. Quisiera agendar diagnóstico lo antes posible.',
     FALSE, NOW() - INTERVAL '5 hours'),

    ('Valeria Cárdenas', 'valeria.cardenas@outlook.com', '+593 99 111 2233', 'quito',
     'Vi su perfil de Instagram y me interesa el analizador de opacidad para mi vehículo diésel. ¿Necesito cita previa?',
     FALSE, NOW() - INTERVAL '1 day'),

    ('Andrés Montoya', 'andres.montoya@gmail.com', '+593 98 445 6677', 'cualquiera',
     'Tengo un Ford F-150 2016 con ruido metálico al frenar. ¿Cuál es el precio de cambio de pastillas y discos delanteros?',
     TRUE, NOW() - INTERVAL '2 days'),

    ('Carlos Mejía', 'cmejia@empresa.ec', '+593 99 887 6655', 'guayaquil',
     'Representamos una empresa con flota de 4 camionetas Ford F-150. Buscamos taller de confianza para mantenimientos mensuales. ¿Manejan convenios corporativos?',
     TRUE, NOW() - INTERVAL '4 days')
  ;

END $$;
