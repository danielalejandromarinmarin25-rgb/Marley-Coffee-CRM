-- Flujos de cuenta: activar empresa, invitar, activar cuenta y activar o desactivar personas.
begin;
\ir _escenario.psql
select plan(38);

-- Activar empresa cliente (paso 2) ---------------------------------------------------------
select tests.como(tests.id('v2'));
select isnt(public.activar_empresa('33333333-3'), null, 'v2 activa la empresa de su cartera');
select ok(exists (select 1 from public.organizations where rut = '33333333-3'), 'v2 ve la empresa recién activada');
select throws_ok($$select public.activar_empresa('33333333-3')$$, 'P0001', 'empresa_ya_activada',
  'una empresa no se activa dos veces');
select tests.como(tests.id('v1'));
select throws_ok($$select public.activar_empresa('55555555-5')$$, 'P0001', 'empresa_suspendida',
  'una empresa suspendida en el CRM no se activa');
select throws_ok($$select public.activar_empresa('99999999-9')$$, 'P0002', 'no_encontrado',
  'un RUT inexistente responde no_encontrado');
select tests.como(tests.id('k1'));
select throws_ok($$select public.activar_empresa('11111111-1')$$, 'P0002', 'no_encontrado',
  'k1 NO activa empresas de otra cartera');

-- Invitaciones: quién invita a quién ------------------------------------------------------
select tests.como(tests.id('v1'));
select lives_ok(format($$select * from public.crear_invitacion(%L, 'admin2@andino.cl', 'Admin Dos', 'cliente_admin')$$, tests.id('orgA')),
  'v1 invita al administrador de una empresa de su cartera (paso 3)');
select throws_ok(format($$select * from public.crear_invitacion(%L, 'int@andino.cl', 'Int', 'cliente_integrante')$$, tests.id('orgA')), '42501', 'sin_permiso',
  'v1 NO invita integrantes (lo hace el administrador)');
select throws_ok(format($$select * from public.crear_invitacion(%L, 'x@x.cl', 'X', 'cliente_admin')$$, tests.id('orgB')), 'P0002', 'no_encontrado',
  'v1 NO invita en empresas fuera de su cartera');
select throws_ok(format($$select * from public.crear_invitacion(%L, 'kam@marley.cl', 'Kam', 'kam')$$, tests.org_marley()), '42501', 'sin_permiso',
  'v1 NO invita al equipo comercial');

select tests.como(tests.id('aa'));
select lives_ok(format($$select * from public.crear_invitacion(%L, 'barista@andino.cl', 'Barista', 'cliente_integrante')$$, tests.id('orgA')),
  'aa invita integrantes a su empresa (paso 4)');
select throws_ok(format($$select * from public.crear_invitacion(%L, 'aa@prueba.marley.test', 'Yo', 'cliente_integrante')$$, tests.id('orgA')), 'P0001', 'cuenta_existente',
  'un correo con cuenta no recibe un segundo perfil');
select throws_ok(format($$select * from public.crear_invitacion(%L, 'admin2@andino.cl', 'Otra', 'cliente_integrante')$$, tests.id('orgA')), 'P0001', 'invitacion_pendiente_en_otra_organizacion',
  'un correo con invitación pendiente a otro perfil no se reinvita');
select throws_ok(format($$select * from public.crear_invitacion(%L, 'v@marley.cl', 'V', 'vendedor')$$, tests.org_marley()), 'P0002', 'no_encontrado',
  'aa NO invita al equipo de Marley');

select tests.como(tests.id('ai'));
select throws_ok(format($$select * from public.crear_invitacion(%L, 'otro@andino.cl', 'Otro', 'cliente_integrante')$$, tests.id('orgA')), '42501', 'sin_permiso',
  'ai (integrante) NO invita: Mi equipo es de solo lectura');

select tests.como(tests.id('g'));
select lives_ok(format($$select * from public.crear_invitacion(%L, 'nueva.kam@marley.cl', 'Nueva KAM', 'kam')$$, tests.org_marley()),
  'g invita al equipo comercial');
select lives_ok(format($$select * from public.crear_invitacion(%L, 'admin.b@sur.cl', 'Admin B2', 'cliente_admin')$$, tests.id('orgB')),
  'g invita administradores de cualquier empresa');

-- Activar cuenta: la cuenta nace en Auth con la invitación y queda 'invitada' -------------
select tests.como_sistema();
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, raw_user_meta_data, created_at, updated_at)
select '00000000-0000-0000-0000-000000000000', 'f0000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated',
       'barista@andino.cl', '', jsonb_build_object('invitation_id', i.id), now(), now()
from public.invitations i where i.email = 'barista@andino.cl';
select is((select perfil::text || '/' || estado::text from public.memberships where user_id = 'f0000000-0000-4000-8000-000000000001'),
  'cliente_integrante/invitada', 'la cuenta invitada nace con el perfil de la invitación, sin acceso aún');

-- Una cuenta con un invitation_id ajeno (otro correo) no recibe perfil.
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, raw_user_meta_data, created_at, updated_at)
select '00000000-0000-0000-0000-000000000000', 'f0000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated',
       'intruso@mal.cl', '', jsonb_build_object('invitation_id', i.id), now(), now()
from public.invitations i where i.email = 'nueva.kam@marley.cl';
select ok(not exists (select 1 from public.memberships where user_id = 'f0000000-0000-4000-8000-000000000002'),
  'una invitación no se puede usar con otro correo');

select tests.como('f0000000-0000-4000-8000-000000000001');
select is((select count(*) from public.organizations), 0::bigint, 'la cuenta invitada no ve datos antes de activarse');
select throws_ok($$select public.aceptar_invitacion()$$, 'P0001', 'falta_contrasena',
  'no se activa sin definir contraseña');
select tests.como_sistema();
update auth.users set encrypted_password = extensions.crypt('clave-nueva-1', extensions.gen_salt('bf'))
where id = 'f0000000-0000-4000-8000-000000000001';
select tests.como('f0000000-0000-4000-8000-000000000001');
select is(public.aceptar_invitacion(), 'cliente_integrante'::public.perfil, 'activa su cuenta con contraseña');
select is((select count(*) from public.organizations where id = tests.id('orgA')), 1::bigint, 'ya activa, ve su empresa');
select is((select estado::text from public.invitations where email = 'barista@andino.cl'), 'aceptada', 'la invitación queda aceptada');

-- Invitación vencida
select tests.como_sistema();
update public.invitations set expires_at = now() - interval '1 minute' where email = 'iv@prueba.marley.test';
update auth.users set encrypted_password = 'x' where id = tests.id('iv');
select tests.como(tests.id('iv'));
select throws_ok($$select public.aceptar_invitacion()$$, 'P0001', 'invitacion_vencida', 'una invitación vencida no activa la cuenta');

-- Activar y desactivar personas ------------------------------------------------------------
select tests.como(tests.id('aa'));
select is(public.cambiar_estado_miembro(tests.id('ai'), false), 'desactivada'::public.estado_membresia, 'aa desactiva a un integrante');
select tests.como(tests.id('ai'));
select is((select count(*) from public.points), 0::bigint, 'el integrante desactivado pierde el acceso de inmediato');
select is((select estado::text from public.mi_sesion()), 'desactivada', 'mi_sesion informa que la cuenta está desactivada');
select tests.como(tests.id('aa'));
select is(public.cambiar_estado_miembro(tests.id('ai'), true), 'activa'::public.estado_membresia, 'aa reactiva al integrante');
select throws_ok(format($$select public.cambiar_estado_miembro(%L, false)$$, tests.id('aa')), 'P0001', 'no_puede_cambiarse_a_si_mismo',
  'aa NO se desactiva a sí mismo');
select throws_ok(format($$select public.cambiar_estado_miembro(%L, false)$$, tests.id('ba')), 'P0002', 'no_encontrado',
  'aa NO desactiva personas de otra empresa');

select tests.como(tests.id('ai'));
select throws_ok(format($$select public.cambiar_estado_miembro(%L, false)$$, tests.id('aa')), '42501', 'sin_permiso',
  'ai (integrante) NO desactiva a nadie');

select tests.como(tests.id('v1'));
select throws_ok(format($$select public.cambiar_estado_miembro(%L, false)$$, tests.id('ai')), '42501', 'sin_permiso',
  'v1 NO gestiona el equipo de un cliente');

select tests.como(tests.id('g'));
select is(public.cambiar_estado_miembro(tests.id('v1'), false), 'desactivada'::public.estado_membresia, 'g desactiva a un vendedor');
select tests.como(tests.id('v1'));
select is((select count(*) from public.organizations), 0::bigint, 'el vendedor desactivado no ve ni su cartera');
select tests.como(tests.id('g'));
select throws_ok(format($$select public.cambiar_estado_miembro(%L, false)$$, tests.id('aa')), '42501', 'sin_permiso',
  'g NO gestiona el equipo de un cliente (lo hace su administrador)');

-- Contacto con el vendedor asignado ------------------------------------------------------
select tests.como(tests.id('ba'));
select is((select nombre from public.mi_ejecutivo()), 'Persona k1', 'el cliente ve a su KAM asignado');
select tests.como(tests.id('k1'));
select is((select count(*) from public.mi_ejecutivo()), 0::bigint, 'mi_ejecutivo no devuelve nada al personal de Marley');

select * from finish();
rollback;
