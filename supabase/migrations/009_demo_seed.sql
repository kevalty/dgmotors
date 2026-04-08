-- ==============================================
-- 009_demo_seed.sql — Datos de demostración
-- DG Motors — Taller Automotriz
-- ==============================================
-- INSTRUCCIONES:
--   Ejecutar en Supabase → SQL Editor DESPUÉS de
--   haber corrido las migraciones 001 al 008.
--
-- Crea:
--   • 2 mecánicos
--   • 5 clientes con teléfono y cédula
--   • 7 vehículos Ford (especialidad del taller)
--   • 11 citas en distintos estados (pendiente,
--     confirmada, en_proceso, completada, cancelada)
--   • 5 registros de mantenimiento con repuestos
--   • 7 cambios de aceite con próximos vencimientos
-- ==============================================

DO $$
DECLARE
  -- ---- UUIDs de usuarios ----
  uid_mec1  UUID := '11111111-0000-0000-0000-000000000001';
  uid_mec2  UUID := '11111111-0000-0000-0000-000000000002';
  uid_cli1  UUID := '22222222-0000-0000-0000-000000000001'; -- Juan Vargas
  uid_cli2  UUID := '22222222-0000-0000-0000-000000000002'; -- Andrea Morales
  uid_cli3  UUID := '22222222-0000-0000-0000-000000000003'; -- Roberto Chiriboga
  uid_cli4  UUID := '22222222-0000-0000-0000-000000000004'; -- Stephanie Alvarado
  uid_cli5  UUID := '22222222-0000-0000-0000-000000000005'; -- Diego Espinoza

  -- ---- UUIDs de vehículos ----
  vid1 UUID := '33333333-0000-0000-0000-000000000001'; -- F-150  / Vargas
  vid2 UUID := '33333333-0000-0000-0000-000000000002'; -- Explorer / Vargas
  vid3 UUID := '33333333-0000-0000-0000-000000000003'; -- Ranger  / Morales
  vid4 UUID := '33333333-0000-0000-0000-000000000004'; -- F-250   / Chiriboga
  vid5 UUID := '33333333-0000-0000-0000-000000000005'; -- Mustang / Chiriboga
  vid6 UUID := '33333333-0000-0000-0000-000000000006'; -- Escape  / Alvarado
  vid7 UUID := '33333333-0000-0000-0000-000000000007'; -- Expedition / Espinoza

  -- ---- IDs de servicios (desde seed 003) ----
  serv_aceite  UUID;
  serv_mant5k  UUID;
  serv_mant10k UUID;
  serv_diag    UUID;
  serv_frenos  UUID;
  serv_amort   UUID;

  inst_id UUID;

BEGIN
  -- Obtener instance_id del proyecto
  SELECT instance_id INTO inst_id FROM auth.users LIMIT 1;
  IF inst_id IS NULL THEN
    inst_id := '00000000-0000-0000-0000-000000000000';
  END IF;

  -- Buscar IDs de servicios
  SELECT id INTO serv_aceite  FROM public.servicios WHERE nombre ILIKE '%aceite%'               LIMIT 1;
  SELECT id INTO serv_mant5k  FROM public.servicios WHERE nombre ILIKE '%5.000%'                LIMIT 1;
  SELECT id INTO serv_mant10k FROM public.servicios WHERE nombre ILIKE '%10.000%'               LIMIT 1;
  SELECT id INTO serv_diag    FROM public.servicios WHERE nombre ILIKE '%diagnóstico computar%' LIMIT 1;
  SELECT id INTO serv_frenos  FROM public.servicios WHERE nombre ILIKE '%pastillas%'            LIMIT 1;
  SELECT id INTO serv_amort   FROM public.servicios WHERE nombre ILIKE '%amortiguadores%'       LIMIT 1;

  -- ============================================================
  -- 1. USUARIOS EN AUTH.USERS
  --    El trigger handle_new_user() crea el perfil automáticamente
  -- ============================================================
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_user_meta_data, raw_app_meta_data,
    created_at, updated_at, role, aud,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) VALUES
    -- Mecánico 1 — Carlos Aguirre (Quito)
    (uid_mec1, inst_id,
     'carlos.aguirre@dgmotors.com',
     crypt('Demo1234!', gen_salt('bf')),
     NOW() - INTERVAL '6 months',
     '{"nombre":"Carlos","apellido":"Aguirre"}'::jsonb,
     '{"provider":"email","providers":["email"]}'::jsonb,
     NOW() - INTERVAL '6 months', NOW(),
     'authenticated', 'authenticated',
     '', '', '', ''),

    -- Mecánico 2 — Miguel Torres (Guayaquil)
    (uid_mec2, inst_id,
     'miguel.torres@dgmotors.com',
     crypt('Demo1234!', gen_salt('bf')),
     NOW() - INTERVAL '5 months',
     '{"nombre":"Miguel","apellido":"Torres"}'::jsonb,
     '{"provider":"email","providers":["email"]}'::jsonb,
     NOW() - INTERVAL '5 months', NOW(),
     'authenticated', 'authenticated',
     '', '', '', ''),

    -- Cliente 1 — Juan Vargas
    (uid_cli1, inst_id,
     'jvargas@gmail.com',
     crypt('Demo1234!', gen_salt('bf')),
     NOW() - INTERVAL '4 months',
     '{"nombre":"Juan","apellido":"Vargas"}'::jsonb,
     '{"provider":"email","providers":["email"]}'::jsonb,
     NOW() - INTERVAL '4 months', NOW(),
     'authenticated', 'authenticated',
     '', '', '', ''),

    -- Cliente 2 — Andrea Morales
    (uid_cli2, inst_id,
     'andrea.morales@gmail.com',
     crypt('Demo1234!', gen_salt('bf')),
     NOW() - INTERVAL '3 months',
     '{"nombre":"Andrea","apellido":"Morales"}'::jsonb,
     '{"provider":"email","providers":["email"]}'::jsonb,
     NOW() - INTERVAL '3 months', NOW(),
     'authenticated', 'authenticated',
     '', '', '', ''),

    -- Cliente 3 — Roberto Chiriboga
    (uid_cli3, inst_id,
     'roberto.chiriboga@hotmail.com',
     crypt('Demo1234!', gen_salt('bf')),
     NOW() - INTERVAL '2 months',
     '{"nombre":"Roberto","apellido":"Chiriboga"}'::jsonb,
     '{"provider":"email","providers":["email"]}'::jsonb,
     NOW() - INTERVAL '2 months', NOW(),
     'authenticated', 'authenticated',
     '', '', '', ''),

    -- Cliente 4 — Stephanie Alvarado
    (uid_cli4, inst_id,
     'stephanie.alvarado@gmail.com',
     crypt('Demo1234!', gen_salt('bf')),
     NOW() - INTERVAL '2 months',
     '{"nombre":"Stephanie","apellido":"Alvarado"}'::jsonb,
     '{"provider":"email","providers":["email"]}'::jsonb,
     NOW() - INTERVAL '2 months', NOW(),
     'authenticated', 'authenticated',
     '', '', '', ''),

    -- Cliente 5 — Diego Espinoza
    (uid_cli5, inst_id,
     'diego.espinoza@gmail.com',
     crypt('Demo1234!', gen_salt('bf')),
     NOW() - INTERVAL '1 month',
     '{"nombre":"Diego","apellido":"Espinoza"}'::jsonb,
     '{"provider":"email","providers":["email"]}'::jsonb,
     NOW() - INTERVAL '1 month', NOW(),
     'authenticated', 'authenticated',
     '', '', '', '')

  ON CONFLICT (id) DO NOTHING;

  -- ============================================================
  -- 2. ACTUALIZAR PERFILES (creados por el trigger)
  --    Agregar teléfono, cédula y rol correcto
  -- ============================================================
  UPDATE public.perfiles SET
    nombre = 'Carlos', apellido = 'Aguirre',
    telefono = '+593 98 123 4501', rol = 'mecanico'
  WHERE id = uid_mec1;

  UPDATE public.perfiles SET
    nombre = 'Miguel', apellido = 'Torres',
    telefono = '+593 98 123 4502', rol = 'mecanico'
  WHERE id = uid_mec2;

  UPDATE public.perfiles SET
    nombre = 'Juan', apellido = 'Vargas',
    telefono = '+593 99 456 7801', cedula = '1712345678'
  WHERE id = uid_cli1;

  UPDATE public.perfiles SET
    nombre = 'Andrea', apellido = 'Morales',
    telefono = '+593 99 456 7802', cedula = '1712345679'
  WHERE id = uid_cli2;

  UPDATE public.perfiles SET
    nombre = 'Roberto', apellido = 'Chiriboga',
    telefono = '+593 99 456 7803', cedula = '1712345680'
  WHERE id = uid_cli3;

  UPDATE public.perfiles SET
    nombre = 'Stephanie', apellido = 'Alvarado',
    telefono = '+593 98 789 0104', cedula = '0912345681'
  WHERE id = uid_cli4;

  UPDATE public.perfiles SET
    nombre = 'Diego', apellido = 'Espinoza',
    telefono = '+593 98 789 0105', cedula = '0912345682'
  WHERE id = uid_cli5;

  -- ============================================================
  -- 3. VEHÍCULOS — Ford (especialidad del taller)
  -- ============================================================
  INSERT INTO public.vehiculos
    (id, cliente_id, placa, marca, modelo, anio, color, kilometraje, tipo, combustible)
  VALUES
    (vid1, uid_cli1, 'PBA-1234', 'Ford', 'F-150',       2019, 'Blanco',  87500, 'pickup',   'gasolina'),
    (vid2, uid_cli1, 'PCA-5678', 'Ford', 'Explorer',    2021, 'Gris',    45200, 'suv',      'gasolina'),
    (vid3, uid_cli2, 'GUB-2345', 'Ford', 'Ranger',      2020, 'Negro',   62300, 'pickup',   'diesel'),
    (vid4, uid_cli3, 'PBB-3456', 'Ford', 'F-250',       2018, 'Rojo',   112000, 'pickup',   'diesel'),
    (vid5, uid_cli3, 'PDA-7890', 'Ford', 'Mustang',     2017, 'Azul',    58000, 'sedan',    'gasolina'),
    (vid6, uid_cli4, 'GUA-4567', 'Ford', 'Escape',      2022, 'Blanco',  28400, 'suv',      'gasolina'),
    (vid7, uid_cli5, 'PBA-9012', 'Ford', 'Expedition',  2016, 'Negro',  143000, 'suv',      'gasolina')
  ON CONFLICT (placa) DO NOTHING;

  -- ============================================================
  -- 4. CITAS — variedad de estados para el demo
  -- ============================================================
  INSERT INTO public.citas
    (cliente_id, vehiculo_id, servicio_id, sucursal, fecha_hora, estado, notas_cliente, notas_admin, tecnico_id)
  VALUES

    -- HOY: pendiente — recién agendada, admin debe confirmar
    (uid_cli5, vid7, serv_aceite, 'quito',
     (CURRENT_DATE + TIME '09:00')::TIMESTAMPTZ,
     'pendiente',
     'El motor hace un ruido extraño al arrancar en frío. También quiero cambio de aceite.',
     NULL, NULL),

    -- HOY: pendiente — otra esperando confirmación
    (uid_cli2, vid3, serv_diag, 'guayaquil',
     (CURRENT_DATE + TIME '11:30')::TIMESTAMPTZ,
     'pendiente',
     'Luz de check engine encendida hace 3 días.',
     NULL, NULL),

    -- HOY: confirmada con mecánico asignado
    (uid_cli1, vid1, serv_mant10k, 'quito',
     (CURRENT_DATE + TIME '10:00')::TIMESTAMPTZ,
     'confirmada',
     'Mantenimiento de 10.000 km. Por favor revisar también frenos.',
     'Cliente VIP. Tiene dos vehículos registrados.',
     uid_mec1),

    -- HOY: en proceso — vehículo en el taller ahora mismo
    (uid_cli3, vid4, serv_frenos, 'quito',
     (CURRENT_DATE + TIME '08:00')::TIMESTAMPTZ,
     'en_proceso',
     'Frenos hacen ruido al frenar fuerte, especialmente en bajadas.',
     'Se inspeccionaron los 4 frenos. Se reemplazarán pastillas delanteras y traseras.',
     uid_mec1),

    -- MAÑANA: pendiente
    (uid_cli4, vid6, serv_mant5k, 'guayaquil',
     (CURRENT_DATE + INTERVAL '1 day' + TIME '14:00')::TIMESTAMPTZ,
     'pendiente',
     NULL, NULL, NULL),

    -- MAÑANA: confirmada
    (uid_cli1, vid2, serv_diag, 'quito',
     (CURRENT_DATE + INTERVAL '1 day' + TIME '10:30')::TIMESTAMPTZ,
     'confirmada',
     'Revisión general pre-viaje largo. Quiero que revisen todo.',
     NULL,
     uid_mec2),

    -- SEMANA PASADA: completadas
    (uid_cli2, vid3, serv_aceite, 'guayaquil',
     (CURRENT_DATE - INTERVAL '5 days' + TIME '09:00')::TIMESTAMPTZ,
     'completada',
     'Cambio de aceite sintético.',
     'Se realizó cambio de aceite Shell 5W-40 y filtro. Cliente satisfecho.',
     uid_mec2),

    (uid_cli5, vid7, serv_amort, 'quito',
     (CURRENT_DATE - INTERVAL '6 days' + TIME '11:00')::TIMESTAMPTZ,
     'completada',
     'Ruido en la suspensión delantera al pasar por huecos.',
     'Se reemplazaron amortiguadores delanteros Monroe. Se verificó alineación.',
     uid_mec1),

    (uid_cli4, vid6, serv_diag, 'guayaquil',
     (CURRENT_DATE - INTERVAL '8 days' + TIME '10:00')::TIMESTAMPTZ,
     'completada',
     'Diagnóstico general por compra reciente del vehículo.',
     'Diagnóstico sin fallas. Vehículo en excelente estado.',
     uid_mec2),

    -- HACE 2 SEMANAS: completadas
    (uid_cli1, vid1, serv_frenos, 'quito',
     (CURRENT_DATE - INTERVAL '14 days' + TIME '09:00')::TIMESTAMPTZ,
     'completada',
     'Cambio de pastillas delanteras.',
     'Se colocaron pastillas Bosch. Discos en buen estado.',
     uid_mec1),

    -- CANCELADA
    (uid_cli3, vid5, serv_mant5k, 'quito',
     (CURRENT_DATE - INTERVAL '10 days' + TIME '15:00')::TIMESTAMPTZ,
     'cancelada',
     NULL,
     'Cliente canceló por viaje imprevisto.',
     NULL)
  ;

  -- ============================================================
  -- 5. MANTENIMIENTOS — con repuestos y costos reales
  -- ============================================================
  INSERT INTO public.mantenimientos
    (vehiculo_id, tipo, descripcion, kilometraje, fecha, costo,
     proxima_fecha, proximo_km, repuestos, observaciones, tecnico_id)
  VALUES

    -- Ranger / Morales — cambio de aceite (hace 5 días)
    (vid3, 'cambio_aceite',
     'Cambio de aceite sintético Shell Helix 5W-40 y filtro de aceite. Revisión de niveles completa.',
     62300,
     CURRENT_DATE - INTERVAL '5 days',
     78.00,
     CURRENT_DATE + INTERVAL '3 months', 67300,
     '[{"nombre":"Aceite Shell Helix 5W-40 6L","cantidad":1,"costo":54},{"nombre":"Filtro aceite Motorcraft","cantidad":1,"costo":12},{"nombre":"Mano de obra","cantidad":1,"costo":12}]'::jsonb,
     'Se revisaron frenos y neumáticos. Todo en orden.',
     uid_mec2),

    -- Expedition / Espinoza — amortiguadores (hace 6 días)
    (vid7, 'correctivo',
     'Cambio de amortiguadores delanteros Monroe OESpectrum. Se verificó geometría de suspensión y alineación.',
     143000,
     CURRENT_DATE - INTERVAL '6 days',
     390.00,
     NULL, NULL,
     '[{"nombre":"Amortiguador Monroe delantero der.","cantidad":1,"costo":148},{"nombre":"Amortiguador Monroe delantero izq.","cantidad":1,"costo":148},{"nombre":"Bujes de amortiguador","cantidad":2,"costo":22},{"nombre":"Mano de obra","cantidad":1,"costo":72}]'::jsonb,
     'Amortiguadores originales tenían 143.000 km. Recomendable revisar traseros en próxima visita.',
     uid_mec1),

    -- Escape / Alvarado — diagnóstico (hace 8 días)
    (vid6, 'preventivo',
     'Diagnóstico computarizado completo. Lectura de códigos OBD-II. Revisión de sistemas de motor, transmisión y escape.',
     28400,
     CURRENT_DATE - INTERVAL '8 days',
     45.00,
     CURRENT_DATE + INTERVAL '6 months', NULL,
     '[]'::jsonb,
     'Sin códigos de falla activos. Vehículo en excelente condición. Se recomendó mantenimiento preventivo en 6 meses.',
     uid_mec2),

    -- F-150 / Vargas — frenos (hace 14 días)
    (vid1, 'correctivo',
     'Cambio de pastillas de freno delanteras Bosch QuietCast. Revisión de discos (desgaste uniforme, en buen estado). Purga y cambio de líquido de frenos DOT4.',
     87500,
     CURRENT_DATE - INTERVAL '14 days',
     125.00,
     NULL, NULL,
     '[{"nombre":"Pastillas Bosch QuietCast delanteras F-150","cantidad":1,"costo":72},{"nombre":"Líquido de frenos DOT4 500ml","cantidad":1,"costo":18},{"nombre":"Mano de obra","cantidad":1,"costo":35}]'::jsonb,
     'Se recomendó cambio de discos traseros en aprox. 20.000 km adicionales.',
     uid_mec1),

    -- F-250 / Chiriboga — mantenimiento mayor (hace 3 semanas)
    (vid4, 'preventivo',
     'Mantenimiento mayor 110.000 km. Cambio de aceite diésel 15W-40, filtros de aceite, aire y combustible. Revisión de correa de accesorios, batería y sistema de refrigeración.',
     110000,
     CURRENT_DATE - INTERVAL '21 days',
     210.00,
     CURRENT_DATE + INTERVAL '4 months', 115000,
     '[{"nombre":"Aceite Castrol 15W-40 Diesel 7L","cantidad":1,"costo":85},{"nombre":"Filtro de aceite Motorcraft","cantidad":1,"costo":14},{"nombre":"Filtro de aire Ford F-250","cantidad":1,"costo":28},{"nombre":"Filtro de combustible diesel","cantidad":1,"costo":22},{"nombre":"Mano de obra","cantidad":1,"costo":61}]'::jsonb,
     'Batería con 72% de carga, recomendable cambiar en 6–8 meses. Correa de accesorios en buen estado.',
     uid_mec1)
  ;

  -- ============================================================
  -- 6. CAMBIOS DE ACEITE — historial por vehículo
  -- ============================================================
  INSERT INTO public.cambios_aceite
    (vehiculo_id, fecha, kilometraje, tipo_aceite, marca_aceite, viscosidad, cantidad_litros, proxima_fecha, proximo_km)
  VALUES
    -- F-150 / Vargas — hace 3 meses (próximo en 1 mes)
    (vid1, CURRENT_DATE - INTERVAL '3 months',
     82000, 'sintético', 'Mobil 1', '5W-30', 5.0,
     CURRENT_DATE + INTERVAL '1 month', 92000),

    -- Explorer / Vargas — hace 1 mes
    (vid2, CURRENT_DATE - INTERVAL '1 month',
     44000, 'sintético', 'Mobil 1', '5W-30', 4.5,
     CURRENT_DATE + INTERVAL '3 months', 49000),

    -- Ranger / Morales — hace 5 días (reciente)
    (vid3, CURRENT_DATE - INTERVAL '5 days',
     62300, 'sintético', 'Shell Helix', '5W-40', 6.0,
     CURRENT_DATE + INTERVAL '3 months', 67300),

    -- F-250 / Chiriboga — hace 3 semanas
    (vid4, CURRENT_DATE - INTERVAL '21 days',
     110000, 'sintético', 'Castrol', '15W-40', 7.0,
     CURRENT_DATE + INTERVAL '4 months', 115000),

    -- Mustang / Chiriboga — hace 5 meses (VENCIDO — buen ejemplo de alerta)
    (vid5, CURRENT_DATE - INTERVAL '5 months',
     54000, 'sintético', 'Motorcraft', '5W-20', 5.0,
     CURRENT_DATE - INTERVAL '2 months', 59000),

    -- Escape / Alvarado — hace 4 meses (vencido por fecha)
    (vid6, CURRENT_DATE - INTERVAL '4 months',
     24000, 'sintético', 'Mobil', '5W-30', 4.0,
     CURRENT_DATE - INTERVAL '1 month', 34000),

    -- Expedition / Espinoza — hace 2 meses
    (vid7, CURRENT_DATE - INTERVAL '2 months',
     140000, 'semisintético', 'Valvoline', '10W-40', 6.5,
     CURRENT_DATE + INTERVAL '1 month', 145000)
  ;

END $$;
