-- 011_demo_contactos.sql — Mensajes de contacto para el demo
-- Ejecutar DESPUÉS de 010_contactos_table.sql

INSERT INTO public.contactos (nombre, email, telefono, sucursal, mensaje, leido, created_at) VALUES

  -- Nuevo lead — no leído
  ('Patricia Suárez', 'patricia.suarez@gmail.com', '+593 99 234 5678', 'quito',
   'Buenos días, tengo una Ford Explorer 2018 y quisiera cotizar el mantenimiento de los 50.000 km. ¿Cuánto estaría costando aproximadamente? Gracias.',
   FALSE, NOW() - INTERVAL '2 hours'),

  -- Nuevo lead — no leído
  ('Fernando Lozada', 'flozada@hotmail.com', '+593 98 876 5432', 'guayaquil',
   'Hola, mi camioneta Ranger diésel 2020 está botando humo negro. Quisiera agendar un diagnóstico lo antes posible. ¿Tienen disponibilidad esta semana?',
   FALSE, NOW() - INTERVAL '5 hours'),

  -- Nuevo lead — no leído
  ('Valeria Cárdenas', 'valeria.cardenas@outlook.com', '+593 99 111 2233', 'quito',
   'Buenas tardes. Vi su perfil de Instagram y me interesa el servicio de analizador de opacidad para mi vehículo diésel. ¿Necesito cita previa o puedo ir directo?',
   FALSE, NOW() - INTERVAL '1 day'),

  -- Leído — ayer
  ('Andrés Montoya', 'andres.montoya@gmail.com', '+593 98 445 6677', 'cualquiera',
   'Tengo un Ford F-150 2016 con problemas en los frenos, hace un ruido metálico al frenar. ¿Manejan repuestos originales Ford? ¿Cuál es el precio aproximado para cambio de pastillas y discos delanteros?',
   TRUE, NOW() - INTERVAL '2 days'),

  -- Leído — hace 3 días
  ('Lucía Herrera', 'lucia.herrera@gmail.com', NULL, 'quito',
   'Hola, quería preguntarles si hacen cambio de aceite para vehículos híbridos. Tengo un Ford Escape Hybrid 2021. Gracias por su atención.',
   TRUE, NOW() - INTERVAL '3 days'),

  -- Leído — hace 5 días
  ('Carlos Mejía', 'cmejia.empresa@empresa.ec', '+593 99 887 6655', 'guayaquil',
   'Buen día. Representamos a una empresa con flota de 4 camionetas Ford F-150 en Guayaquil y estamos buscando taller de confianza para mantenimientos mensuales. ¿Manejan convenios corporativos?',
   TRUE, NOW() - INTERVAL '5 days')
;
