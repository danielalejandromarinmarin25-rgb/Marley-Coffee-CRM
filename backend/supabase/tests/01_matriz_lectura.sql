-- Matriz perfil × recurso (lectura).
-- Cada fila dice si una persona debe poder ver un registro concreto. La consulta filtra por el ID
-- del registro, así que cubre también el acceso por enlace directo o cambio de ID: si la fila
-- no es visible, la consulta por su ID devuelve vacío.
begin;
\ir _escenario.psql

create table tests.matriz (
  actor text, tabla text, columna text, registro text, visible boolean
);
grant select on tests.matriz to authenticated;

insert into tests.matriz values
  -- Gerencia: supervisión de todo
  ('g',  'organizations', 'id', 'orgA', true),
  ('g',  'organizations', 'id', 'orgB', true),
  ('g',  'organizations', 'id', 'orgP', true),
  ('g',  'crm_empresas',  'rut', '33333333-3', true),
  ('g',  'points',        'id', 'pb1', true),
  ('g',  'machines',      'id', 'ma1', true),
  ('g',  'profiles',      'id', 'aa',  true),
  ('g',  'profiles',      'id', 'v1',  true),
  ('g',  'memberships',   'user_id', 'ba', true),
  -- Vendedor v1: solo su cartera (empresa A)
  ('v1', 'organizations', 'id', 'orgA', true),
  ('v1', 'organizations', 'id', 'orgB', false),
  ('v1', 'organizations', 'id', 'orgD', false),
  ('v1', 'organizations', 'id', 'orgP', false),
  ('v1', 'crm_empresas',  'rut', '11111111-1', true),
  ('v1', 'crm_empresas',  'rut', '22222222-2', false),
  ('v1', 'crm_empresas',  'rut', '33333333-3', false),
  ('v1', 'points',        'id', 'pa1', true),
  ('v1', 'points',        'id', 'pb1', false),
  ('v1', 'machines',      'id', 'ma1', true),
  ('v1', 'machines',      'id', 'mb1', false),
  ('v1', 'profiles',      'id', 'aa',  true),
  ('v1', 'profiles',      'id', 'ba',  false),
  ('v1', 'profiles',      'id', 'k1',  false),
  ('v1', 'profiles',      'id', 'g',   false),
  ('v1', 'memberships',   'user_id', 'ai', true),
  ('v1', 'memberships',   'user_id', 'ba', false),
  -- Vendedor v2: su cartera aún no está activada; no ve ninguna empresa cliente
  ('v2', 'crm_empresas',  'rut', '33333333-3', true),
  ('v2', 'organizations', 'id', 'orgA', false),
  ('v2', 'points',        'id', 'pa1', false),
  ('v2', 'profiles',      'id', 'aa',  false),
  -- KAM k1: solo su cartera (empresa B)
  ('k1', 'organizations', 'id', 'orgB', true),
  ('k1', 'organizations', 'id', 'orgA', false),
  ('k1', 'crm_empresas',  'rut', '22222222-2', true),
  ('k1', 'crm_empresas',  'rut', '11111111-1', false),
  ('k1', 'points',        'id', 'pb1', true),
  ('k1', 'points',        'id', 'pa1', false),
  ('k1', 'machines',      'id', 'mb1', true),
  ('k1', 'machines',      'id', 'ma1', false),
  ('k1', 'profiles',      'id', 'ba',  true),
  ('k1', 'profiles',      'id', 'aa',  false),
  -- Administrador de A: solo su empresa, nunca el CRM ni Marley
  ('aa', 'organizations', 'id', 'orgA', true),
  ('aa', 'organizations', 'id', 'orgB', false),
  ('aa', 'organizations', 'id', 'orgP', false),
  ('aa', 'crm_empresas',  'rut', '11111111-1', false),
  ('aa', 'points',        'id', 'pa1', true),
  ('aa', 'points',        'id', 'pb1', false),
  ('aa', 'machines',      'id', 'ma1', true),
  ('aa', 'machines',      'id', 'mb1', false),
  ('aa', 'profiles',      'id', 'ai',  true),
  ('aa', 'profiles',      'id', 'iv',  true),
  ('aa', 'profiles',      'id', 'ba',  false),
  ('aa', 'profiles',      'id', 'v1',  false),
  ('aa', 'profiles',      'id', 'g',   false),
  ('aa', 'memberships',   'user_id', 'ba', false),
  -- Integrante de A: ve lo mismo que su administrador (Mi equipo en solo lectura)
  ('ai', 'organizations', 'id', 'orgA', true),
  ('ai', 'organizations', 'id', 'orgB', false),
  ('ai', 'crm_empresas',  'rut', '11111111-1', false),
  ('ai', 'points',        'id', 'pa2', true),
  ('ai', 'points',        'id', 'pb1', false),
  ('ai', 'profiles',      'id', 'aa',  true),
  ('ai', 'memberships',   'user_id', 'aa', true),
  ('ai', 'profiles',      'id', 'ba',  false),
  -- Administrador de B: no ve nada de A
  ('ba', 'organizations', 'id', 'orgB', true),
  ('ba', 'organizations', 'id', 'orgA', false),
  ('ba', 'points',        'id', 'pa1', false),
  ('ba', 'machines',      'id', 'ma1', false),
  ('ba', 'profiles',      'id', 'aa',  false),
  ('ba', 'memberships',   'user_id', 'ai', false),
  -- Partner: solo sus puntos, nunca la empresa cliente, sus máquinas ni sus personas
  ('pp', 'organizations', 'id', 'orgP', true),
  ('pp', 'organizations', 'id', 'orgA', false),
  ('pp', 'points',        'id', 'pa1', true),
  ('pp', 'points',        'id', 'pa2', false),
  ('pp', 'points',        'id', 'pb1', false),
  ('pp', 'machines',      'id', 'ma1', false),
  ('pp', 'crm_empresas',  'rut', '11111111-1', false),
  ('pp', 'profiles',      'id', 'aa',  false),
  -- Vendedor desactivado: no ve ni su cartera
  ('vx', 'organizations', 'id', 'orgD', false),
  ('vx', 'crm_empresas',  'rut', '44444444-4', false),
  ('vx', 'points',        'id', 'pd1', false),
  -- Invitada que no ha activado su cuenta: aún no ve su empresa
  ('iv', 'organizations', 'id', 'orgA', false),
  ('iv', 'points',        'id', 'pa1', false),
  ('iv', 'profiles',      'id', 'aa',  false);

select plan((select count(*)::int from tests.matriz) + 6);

-- Recorre la matriz como cada persona.
create function tests.recorrer_matriz() returns setof text language plpgsql as $$
declare
  r record;
  n integer;
  v_valor text;
begin
  for r in select * from tests.matriz loop
    v_valor := case when r.columna = 'rut' then r.registro else tests.id(r.registro)::text end;
    perform tests.como(tests.id(r.actor));
    n := tests.visibles(r.tabla, r.columna, v_valor);
    perform tests.como_sistema();
    return next is(n > 0, r.visible,
      format('%s %s %s %s', r.actor, case when r.visible then 've' else 'NO ve' end, r.tabla, r.registro));
  end loop;
end $$;

select * from tests.recorrer_matriz();

-- Historial de acciones: solo gerencia.
select tests.como(tests.id('g'));
select ok((select count(*) from public.audit_log) > 0, 'g ve el historial de acciones');
select tests.como(tests.id('v1'));
select is((select count(*) from public.audit_log), 0::bigint, 'v1 NO ve el historial de acciones');
select tests.como(tests.id('aa'));
select is((select count(*) from public.audit_log), 0::bigint, 'aa NO ve el historial de acciones');

-- Catálogo de permisos: cada uno ve solo los de su perfil.
select tests.como(tests.id('v1'));
select ok(not exists (select 1 from public.role_permissions where permiso = 'maquinas.editar'),
  'el vendedor no tiene maquinas.editar');
select tests.como(tests.id('k1'));
select ok(exists (select 1 from public.role_permissions where permiso = 'maquinas.editar'),
  'el KAM tiene maquinas.editar');
select tests.como(tests.id('ai'));
select ok(not exists (select 1 from public.role_permissions where permiso = 'equipo.gestionar'),
  'el integrante no gestiona Mi equipo');

select * from finish();
rollback;
