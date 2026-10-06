-- Datos mínimos para desarrollo LOCAL (supabase start / db reset). No se aplica al proyecto remoto.
-- Contraseña de todas las cuentas: marley-local-1
-- Los datos de prueba por canal para la demo son parte de la Fase 3.

create function pg_temp.cuenta(p_id uuid, p_email text) returns void language plpgsql as $$
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

select pg_temp.cuenta('10000000-0000-4000-8000-000000000001', 'gerencia@marley.local');
select pg_temp.cuenta('10000000-0000-4000-8000-000000000002', 'vendedora@marley.local');
select pg_temp.cuenta('10000000-0000-4000-8000-000000000003', 'kam@marley.local');
select pg_temp.cuenta('10000000-0000-4000-8000-000000000004', 'admin@andino.local');
select pg_temp.cuenta('10000000-0000-4000-8000-000000000005', 'barista@andino.local');
select pg_temp.cuenta('10000000-0000-4000-8000-000000000006', 'admin@oficinasur.local');
select pg_temp.cuenta('10000000-0000-4000-8000-000000000007', 'partner@operador.local');

select public.registrar_gerencia_inicial('gerencia@marley.local', 'Gabriela Gerencia');

insert into public.profiles (id, nombre, email) values
  ('10000000-0000-4000-8000-000000000002', 'Valentina Vendedora', 'vendedora@marley.local'),
  ('10000000-0000-4000-8000-000000000003', 'Karen KAM', 'kam@marley.local'),
  ('10000000-0000-4000-8000-000000000004', 'Andrés Administrador', 'admin@andino.local'),
  ('10000000-0000-4000-8000-000000000005', 'Bruno Barista', 'barista@andino.local'),
  ('10000000-0000-4000-8000-000000000006', 'Sofía Administradora', 'admin@oficinasur.local'),
  ('10000000-0000-4000-8000-000000000007', 'Pablo Partner', 'partner@operador.local');

insert into public.memberships (user_id, organization_id, perfil, estado)
select u, (select id from public.organizations where tipo = 'marley'), p::public.perfil, 'activa'
from (values ('10000000-0000-4000-8000-000000000002'::uuid, 'vendedor'),
             ('10000000-0000-4000-8000-000000000003'::uuid, 'kam')) as v(u, p);

-- Cartera en el CRM simulado. La Panadería La Espiga queda sin activar para probar el flujo.
insert into public.crm_empresas (rut, razon_social, asignado_a, canal, segmento) values
  ('76111111-1', 'Café Andino SpA',          '10000000-0000-4000-8000-000000000002', 'horeca', 'cadena'),
  ('76222222-2', 'Oficinas del Sur Ltda.',   '10000000-0000-4000-8000-000000000003', 'ocs', 'corporativo'),
  ('76333333-3', 'Panadería La Espiga SpA',  '10000000-0000-4000-8000-000000000002', 'panaderia', 'independiente'),
  ('76444444-4', 'Servicentro Norte SpA',    '10000000-0000-4000-8000-000000000003', 'conveniencia', 'estación');

insert into public.organizations (id, tipo, rut, razon_social, nombre_comercial, contacto_nombre, contacto_email, activada_por) values
  ('20000000-0000-4000-8000-00000000000a', 'cliente', '76111111-1', 'Café Andino SpA', 'Café Andino',
   'Andrés Administrador', 'admin@andino.local', '10000000-0000-4000-8000-000000000002'),
  ('20000000-0000-4000-8000-00000000000b', 'cliente', '76222222-2', 'Oficinas del Sur Ltda.', 'Oficinas del Sur',
   'Sofía Administradora', 'admin@oficinasur.local', '10000000-0000-4000-8000-000000000003'),
  ('20000000-0000-4000-8000-0000000000ff', 'partner', null, 'Operador Partner SpA', 'Operador Partner', null, null, null);

insert into public.memberships (user_id, organization_id, perfil, estado) values
  ('10000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-00000000000a', 'cliente_admin', 'activa'),
  ('10000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-00000000000a', 'cliente_integrante', 'activa'),
  ('10000000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-00000000000b', 'cliente_admin', 'activa'),
  ('10000000-0000-4000-8000-000000000007', '20000000-0000-4000-8000-0000000000ff', 'partner', 'activa');

insert into public.points (id, organization_id, partner_org_id, nombre, canal, telemetria_disponible, direccion, horario, contacto_recepcion) values
  ('30000000-0000-4000-8000-0000000000a1', '20000000-0000-4000-8000-00000000000a', '20000000-0000-4000-8000-0000000000ff',
   'Andino Providencia', 'horeca', true, 'Av. Providencia 1234, Providencia', 'Lun a sáb 8:00–20:00', 'Bruno, +56 9 1111 1111'),
  ('30000000-0000-4000-8000-0000000000a2', '20000000-0000-4000-8000-00000000000a', null,
   'Andino Ñuñoa', 'horeca', false, 'Av. Irarrázaval 2345, Ñuñoa', 'Lun a vie 8:00–18:00', null),
  ('30000000-0000-4000-8000-0000000000b1', '20000000-0000-4000-8000-00000000000b', null,
   'Torre Apoquindo piso 12', 'ocs', true, 'Av. Apoquindo 3456, Las Condes', 'Lun a vie 9:00–18:00', 'Recepción piso 12');

insert into public.machines (point_id, modelo, numero_serie) values
  ('30000000-0000-4000-8000-0000000000a1', 'Superautomática Pro 2 grupos', 'MC-HOR-0001'),
  ('30000000-0000-4000-8000-0000000000b1', 'Superautomática Oficina', 'MC-OCS-0001'),
  ('30000000-0000-4000-8000-0000000000b1', 'Superautomática Oficina', 'MC-OCS-0002');
