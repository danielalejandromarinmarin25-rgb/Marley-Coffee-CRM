-- Datos de la demo de reposición (Fase 3). Se carga después de seed.sql en `supabase db reset`
-- y no modifica lo que dejó la Fase 1: solo agrega empresas, puntos, productos y consumo.
-- Todas las fechas son relativas al momento de la carga: recargar antes de cada demo
-- (pnpm db:reset) para que las coberturas calcen con lo que se cuenta abajo.
-- Contraseña de las cuentas nuevas: marley-local-1 (igual que seed.sql).
--
-- Situaciones listas para la demo (las alertas NO se escriben a mano: las genera la regla real):
--   · CRÍTICA  · Café Andino · Andino Providencia (Horeca, telemetría) · Buffalo Soldier, ~1,4 días
--   · NUEVA    · Café Andino · Andino Ñuñoa (Horeca, sin telemetría)  · One Love, ~3,5 días
--   · EN REPARTO · Oficinas del Sur · Torre Apoquindo piso 12 (OCS, telemetría): pedido confirmado
--   · Más alertas nuevas en estaciones (telemetría) y panaderías (sin telemetría)
--   · Puntos en verde en cada canal, con y sin telemetría
--   · Nombres y direcciones largos (Gran Hotel Pacífico) para probar el responsive

create function pg_temp.cuenta_demo(p_id uuid, p_email text) returns void language plpgsql as $$
begin
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change)
  values ('00000000-0000-0000-0000-000000000000', p_id, 'authenticated', 'authenticated', p_email,
    extensions.crypt('marley-local-1', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');
  insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), p_id, p_id::text, 'email',
    jsonb_build_object('sub', p_id::text, 'email', p_email, 'email_verified', true), now(), now(), now());
end $$;

-- Lecturas diarias de telemetría de los últimos p_dias días (sin hoy), con una variación
-- determinista de ±10 bebidas para que no se vea plano. 7 g de café por bebida.
create function pg_temp.telemetria(p_point uuid, p_dias integer, p_bebidas integer) returns void language sql as $$
  insert into public.lecturas_telemetria (organization_id, point_id, fecha, bebidas, gramos_por_bebida, recibida_at)
  select p.organization_id, p.id, current_date - d,
         p_bebidas + ((d * 7) % 21) - 10, 7,
         (current_date - d + 1)::timestamptz + interval '6 hours'
  from public.points p, generate_series(1, p_dias) as d
  where p.id = p_point;
  -- La última lectura llegó hoy temprano.
  update public.lecturas_telemetria set recibida_at = date_trunc('hour', now()) - interval '2 hours'
  where point_id = p_point and fecha = current_date - 1;
$$;

create function pg_temp.conteo(p_point uuid, p_sku text, p_bolsas numeric, p_hace interval) returns void language sql as $$
  insert into public.declaraciones_stock (organization_id, point_id, producto_id, bolsas, declarado_at)
  select p.organization_id, p.id, pr.id, p_bolsas, now() - p_hace
  from public.points p, public.productos pr where p.id = p_point and pr.sku = p_sku;
$$;

create function pg_temp.entrega(p_point uuid, p_sku text, p_bolsas integer, p_hace interval) returns void language sql as $$
  insert into public.entregas (organization_id, point_id, producto_id, bolsas, entregada_at)
  select p.organization_id, p.id, pr.id, p_bolsas, now() - p_hace
  from public.points p, public.productos pr where p.id = p_point and pr.sku = p_sku;
$$;

create function pg_temp.mezcla(p_point uuid, p_sku text, p_proporcion numeric, p_habituales integer) returns void language sql as $$
  insert into public.mezcla_punto (point_id, producto_id, organization_id, proporcion, bolsas_habituales)
  select p.id, pr.id, p.organization_id, p_proporcion, p_habituales
  from public.points p, public.productos pr where p.id = p_point and pr.sku = p_sku;
$$;

-- Catálogo ---------------------------------------------------------------------------------------
insert into public.productos (id, sku, nombre, formato, kg_por_bolsa) values
  ('40000000-0000-4000-8000-000000000001', 'MC-BUF-1K', 'Buffalo Soldier', 'Grano · bolsa 1 kg', 1),
  ('40000000-0000-4000-8000-000000000002', 'MC-ONE-1K', 'One Love', 'Grano · bolsa 1 kg', 1),
  ('40000000-0000-4000-8000-000000000003', 'MC-GUS-1K', 'Get Up Stand Up', 'Grano · bolsa 1 kg', 1),
  ('40000000-0000-4000-8000-000000000004', 'MC-MYS-1K', 'Mystic Morning', 'Molido · bolsa 1 kg', 1);

-- Cuentas nuevas ---------------------------------------------------------------------------------
select pg_temp.cuenta_demo('10000000-0000-4000-8000-000000000011', 'admin@hotelpacifico.local');
select pg_temp.cuenta_demo('10000000-0000-4000-8000-000000000012', 'admin@rutasur.local');
select pg_temp.cuenta_demo('10000000-0000-4000-8000-000000000013', 'admin@losaromos.local');
select pg_temp.cuenta_demo('10000000-0000-4000-8000-000000000014', 'admin@nuevalascondes.local');

insert into public.profiles (id, nombre, email) values
  ('10000000-0000-4000-8000-000000000011', 'María José Valdebenito Echeverría', 'admin@hotelpacifico.local'),
  ('10000000-0000-4000-8000-000000000012', 'Claudia Fuentes', 'admin@rutasur.local'),
  ('10000000-0000-4000-8000-000000000013', 'Marcela Rojas', 'admin@losaromos.local'),
  ('10000000-0000-4000-8000-000000000014', 'Rodrigo Saavedra', 'admin@nuevalascondes.local');

-- Cartera en el CRM simulado: Valentina (vendedora) y Karen (KAM).
insert into public.crm_empresas (rut, razon_social, asignado_a, canal, segmento) values
  ('76555555-5', 'Inversiones Hoteleras Gran Pacífico del Litoral Central SpA', '10000000-0000-4000-8000-000000000002', 'horeca', 'hotel'),
  ('76666666-6', 'Centro Corporativo Nueva Las Condes Ltda.', '10000000-0000-4000-8000-000000000003', 'ocs', 'corporativo'),
  ('76777777-7', 'Estaciones de Servicio Ruta Sur SpA', '10000000-0000-4000-8000-000000000003', 'conveniencia', 'estación'),
  ('76888888-8', 'Panificadora y Pastelería Los Aromos Ltda.', '10000000-0000-4000-8000-000000000002', 'panaderia', 'cadena');

insert into public.organizations (id, tipo, rut, razon_social, nombre_comercial, contacto_nombre, contacto_email, contacto_telefono, activada_por) values
  ('20000000-0000-4000-8000-0000000000c1', 'cliente', '76555555-5', 'Inversiones Hoteleras Gran Pacífico del Litoral Central SpA',
   'Gran Hotel Pacífico del Litoral Central', 'María José Valdebenito Echeverría', 'admin@hotelpacifico.local', '+56 9 6123 4501',
   '10000000-0000-4000-8000-000000000002'),
  ('20000000-0000-4000-8000-0000000000c2', 'cliente', '76666666-6', 'Centro Corporativo Nueva Las Condes Ltda.',
   'Nueva Las Condes', 'Rodrigo Saavedra', 'admin@nuevalascondes.local', '+56 9 6123 4502', '10000000-0000-4000-8000-000000000003'),
  ('20000000-0000-4000-8000-0000000000c3', 'cliente', '76777777-7', 'Estaciones de Servicio Ruta Sur SpA',
   'Ruta Sur', 'Claudia Fuentes', 'admin@rutasur.local', '+56 9 6123 4503', '10000000-0000-4000-8000-000000000003'),
  ('20000000-0000-4000-8000-0000000000c4', 'cliente', '76888888-8', 'Panificadora y Pastelería Los Aromos Ltda.',
   'Los Aromos', 'Marcela Rojas', 'admin@losaromos.local', '+56 9 6123 4504', '10000000-0000-4000-8000-000000000002');

insert into public.memberships (user_id, organization_id, perfil, estado) values
  ('10000000-0000-4000-8000-000000000011', '20000000-0000-4000-8000-0000000000c1', 'cliente_admin', 'activa'),
  ('10000000-0000-4000-8000-000000000014', '20000000-0000-4000-8000-0000000000c2', 'cliente_admin', 'activa'),
  ('10000000-0000-4000-8000-000000000012', '20000000-0000-4000-8000-0000000000c3', 'cliente_admin', 'activa'),
  ('10000000-0000-4000-8000-000000000013', '20000000-0000-4000-8000-0000000000c4', 'cliente_admin', 'activa');

-- Teléfono de contacto para WhatsApp en las empresas de la Fase 1.
update public.organizations set contacto_telefono = '+56 9 6123 4400' where id = '20000000-0000-4000-8000-00000000000a';
update public.organizations set contacto_telefono = '+56 9 6123 4411' where id = '20000000-0000-4000-8000-00000000000b';

-- Puntos nuevos (los tres de la Fase 1 se mantienen) ----------------------------------------------
insert into public.points (id, organization_id, nombre, canal, telemetria_disponible, zona, direccion, horario, contacto_recepcion) values
  ('30000000-0000-4000-8000-0000000000c1', '20000000-0000-4000-8000-0000000000c1',
   'Gran Hotel Pacífico — Terraza Mirador y Salón de Desayunos', 'horeca', true, 'regiones',
   'Avenida Jorge Montt 12.345, Torre B, local 3, Recreo, Viña del Mar, Región de Valparaíso',
   'Todos los días 6:30–23:00', 'Recepción de proveedores, acceso por calle Los Pinos'),
  ('30000000-0000-4000-8000-0000000000c2', '20000000-0000-4000-8000-0000000000c1',
   'Gran Hotel Pacífico — Cafetería del Lobby', 'horeca', false, 'regiones',
   'Avenida Jorge Montt 12.345, Recreo, Viña del Mar', 'Todos los días 7:00–21:00', null),
  ('30000000-0000-4000-8000-0000000000d1', '20000000-0000-4000-8000-0000000000c2',
   'Nueva Las Condes · Edificio Cerro Colorado piso 21', 'ocs', false, 'rm',
   'Cerro Colorado 5240, Las Condes', 'Lun a vie 8:30–18:30', 'Conserjería'),
  ('30000000-0000-4000-8000-0000000000e1', '20000000-0000-4000-8000-0000000000c3',
   'Ruta Sur · Buin Km 35', 'conveniencia', true, 'rm',
   'Ruta 5 Sur Km 35, Buin', 'Abierto 24 horas', 'Jefe de turno'),
  ('30000000-0000-4000-8000-0000000000e2', '20000000-0000-4000-8000-0000000000c3',
   'Ruta Sur · Rancagua Norte', 'conveniencia', false, 'regiones',
   'Ruta 5 Sur Km 82, Rancagua', 'Abierto 24 horas', null),
  ('30000000-0000-4000-8000-0000000000f1', '20000000-0000-4000-8000-0000000000c4',
   'Los Aromos Maipú', 'panaderia', true, 'rm',
   'Avenida Pajaritos 2150, Maipú', 'Lun a dom 7:00–21:00', 'Marcela'),
  ('30000000-0000-4000-8000-0000000000f2', '20000000-0000-4000-8000-0000000000c4',
   'Los Aromos La Florida', 'panaderia', false, 'rm',
   'Avenida Vicuña Mackenna 7110, La Florida', 'Lun a sáb 7:00–20:00', null);

-- Mezcla de compra, conteos, entregas y telemetría -----------------------------------------------
-- Modo A: saldo = conteo inicial + entregas − consumo medido × mezcla.
-- Modo B: tasa del ciclo entre los dos últimos conteos; saldo baja cada día según esa tasa.

-- CRÍTICA · Andino Providencia (telemetría): ~0,98 kg/día; Buffalo 70 % → saldo ~1 kg ≈ 1,4 días.
select pg_temp.mezcla('30000000-0000-4000-8000-0000000000a1', 'MC-BUF-1K', 0.7, 6);
select pg_temp.mezcla('30000000-0000-4000-8000-0000000000a1', 'MC-ONE-1K', 0.3, 3);
select pg_temp.conteo('30000000-0000-4000-8000-0000000000a1', 'MC-BUF-1K', 4, interval '20 days');
select pg_temp.conteo('30000000-0000-4000-8000-0000000000a1', 'MC-ONE-1K', 3, interval '20 days');
select pg_temp.entrega('30000000-0000-4000-8000-0000000000a1', 'MC-BUF-1K', 10, interval '10 days');
select pg_temp.entrega('30000000-0000-4000-8000-0000000000a1', 'MC-ONE-1K', 6, interval '10 days');
select pg_temp.telemetria('30000000-0000-4000-8000-0000000000a1', 19, 140);

-- NUEVA · Andino Ñuñoa (sin telemetría): ciclo anterior 2 + 12 − 3 en 16 días ≈ 0,69 kg/día.
-- Último conteo hace 14 días (3 bolsas), entrega de 9 → saldo ~2,4 kg ≈ 3,5 días (amarilla).
select pg_temp.mezcla('30000000-0000-4000-8000-0000000000a2', 'MC-ONE-1K', 1, 8);
select pg_temp.conteo('30000000-0000-4000-8000-0000000000a2', 'MC-ONE-1K', 2, interval '30 days');
select pg_temp.entrega('30000000-0000-4000-8000-0000000000a2', 'MC-ONE-1K', 12, interval '29 days');
select pg_temp.conteo('30000000-0000-4000-8000-0000000000a2', 'MC-ONE-1K', 3, interval '14 days');
select pg_temp.entrega('30000000-0000-4000-8000-0000000000a2', 'MC-ONE-1K', 9, interval '13 days');

-- EN REPARTO · Torre Apoquindo (OCS, telemetría): ~0,7 kg/día, saldo ~2,5 kg ≈ 3,6 días.
select pg_temp.mezcla('30000000-0000-4000-8000-0000000000b1', 'MC-MYS-1K', 1, 10);
select pg_temp.conteo('30000000-0000-4000-8000-0000000000b1', 'MC-MYS-1K', 3, interval '15 days');
select pg_temp.entrega('30000000-0000-4000-8000-0000000000b1', 'MC-MYS-1K', 9, interval '12 days');
select pg_temp.telemetria('30000000-0000-4000-8000-0000000000b1', 14, 100);

-- VERDE · Gran Hotel, terraza (telemetría, regiones): saldo amplio.
select pg_temp.mezcla('30000000-0000-4000-8000-0000000000c1', 'MC-BUF-1K', 0.6, 12);
select pg_temp.mezcla('30000000-0000-4000-8000-0000000000c1', 'MC-GUS-1K', 0.4, 8);
select pg_temp.conteo('30000000-0000-4000-8000-0000000000c1', 'MC-BUF-1K', 6, interval '10 days');
select pg_temp.conteo('30000000-0000-4000-8000-0000000000c1', 'MC-GUS-1K', 4, interval '10 days');
select pg_temp.entrega('30000000-0000-4000-8000-0000000000c1', 'MC-BUF-1K', 20, interval '6 days');
select pg_temp.entrega('30000000-0000-4000-8000-0000000000c1', 'MC-GUS-1K', 14, interval '6 days');
select pg_temp.telemetria('30000000-0000-4000-8000-0000000000c1', 9, 200);

-- VERDE · Gran Hotel, lobby (sin telemetría, ciclo 1: tasa del segmento).
select pg_temp.mezcla('30000000-0000-4000-8000-0000000000c2', 'MC-ONE-1K', 1, 6);
select pg_temp.conteo('30000000-0000-4000-8000-0000000000c2', 'MC-ONE-1K', 12, interval '2 days');

-- VERDE · Nueva Las Condes (OCS, sin telemetría).
select pg_temp.mezcla('30000000-0000-4000-8000-0000000000d1', 'MC-MYS-1K', 1, 8);
select pg_temp.conteo('30000000-0000-4000-8000-0000000000d1', 'MC-MYS-1K', 2, interval '24 days');
select pg_temp.entrega('30000000-0000-4000-8000-0000000000d1', 'MC-MYS-1K', 10, interval '23 days');
select pg_temp.conteo('30000000-0000-4000-8000-0000000000d1', 'MC-MYS-1K', 4, interval '4 days');
select pg_temp.entrega('30000000-0000-4000-8000-0000000000d1', 'MC-MYS-1K', 8, interval '3 days');

-- NUEVA · Ruta Sur Buin (estación, telemetría): ~0,84 kg/día, saldo ~3,8 kg ≈ 4,5 días.
select pg_temp.mezcla('30000000-0000-4000-8000-0000000000e1', 'MC-GUS-1K', 1, 10);
select pg_temp.conteo('30000000-0000-4000-8000-0000000000e1', 'MC-GUS-1K', 5, interval '12 days');
select pg_temp.entrega('30000000-0000-4000-8000-0000000000e1', 'MC-GUS-1K', 8, interval '8 days');
select pg_temp.telemetria('30000000-0000-4000-8000-0000000000e1', 11, 120);

-- VERDE · Ruta Sur Rancagua (estación, sin telemetría).
select pg_temp.mezcla('30000000-0000-4000-8000-0000000000e2', 'MC-GUS-1K', 1, 8);
select pg_temp.conteo('30000000-0000-4000-8000-0000000000e2', 'MC-GUS-1K', 10, interval '3 days');

-- VERDE · Los Aromos Maipú (panadería, telemetría).
select pg_temp.mezcla('30000000-0000-4000-8000-0000000000f1', 'MC-ONE-1K', 1, 6);
select pg_temp.conteo('30000000-0000-4000-8000-0000000000f1', 'MC-ONE-1K', 8, interval '5 days');
select pg_temp.telemetria('30000000-0000-4000-8000-0000000000f1', 4, 60);

-- NUEVA · Los Aromos La Florida (panadería, sin telemetría): ciclo 2 + 6 − 1 en 14 días = 0,5 kg/día,
-- último conteo hace 6 días (1 bolsa) + entrega de 4 → saldo ~2 kg ≈ 4 días.
select pg_temp.mezcla('30000000-0000-4000-8000-0000000000f2', 'MC-ONE-1K', 0.8, 5);
select pg_temp.mezcla('30000000-0000-4000-8000-0000000000f2', 'MC-MYS-1K', 0.2, 2);
select pg_temp.conteo('30000000-0000-4000-8000-0000000000f2', 'MC-ONE-1K', 2, interval '20 days');
select pg_temp.entrega('30000000-0000-4000-8000-0000000000f2', 'MC-ONE-1K', 6, interval '19 days');
select pg_temp.conteo('30000000-0000-4000-8000-0000000000f2', 'MC-ONE-1K', 1, interval '6 days');
select pg_temp.entrega('30000000-0000-4000-8000-0000000000f2', 'MC-ONE-1K', 4, interval '5 days');
select pg_temp.conteo('30000000-0000-4000-8000-0000000000f2', 'MC-MYS-1K', 3, interval '6 days');

-- Cálculo con la regla real: crea saldos, alertas, pedidos sugeridos y avisos.
select private.recalcular_reposicion(null);

-- EN REPARTO: Sofía (administradora de Oficinas del Sur) confirmó el pedido sugerido hace un rato,
-- por la misma función que usa la app, y el pedido avanzó dos estados.
select set_config('request.jwt.claims', json_build_object('sub', '10000000-0000-4000-8000-000000000006', 'role', 'authenticated')::text, false);
select public.confirmar_pedido(ps.id)
from public.pedidos_sugeridos ps where ps.point_id = '30000000-0000-4000-8000-0000000000b1';
select set_config('request.jwt.claims', '', false);
select public.avanzar_pedido(codigo) from public.pedidos where point_id = '30000000-0000-4000-8000-0000000000b1';
select public.avanzar_pedido(codigo) from public.pedidos where point_id = '30000000-0000-4000-8000-0000000000b1';
-- Fechas creíbles para la línea de tiempo del pedido.
update public.pedidos set confirmado_at = now() - interval '26 hours' where point_id = '30000000-0000-4000-8000-0000000000b1';
update public.historial_pedido h set ocurrido_at = now() - case h.estado
    when 'recibido' then interval '26 hours' when 'en_preparacion' then interval '20 hours' else interval '3 hours' end
from public.pedidos p where p.id = h.pedido_id and p.point_id = '30000000-0000-4000-8000-0000000000b1';
update public.alertas set confirmada_at = now() - interval '26 hours' where point_id = '30000000-0000-4000-8000-0000000000b1';
