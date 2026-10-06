-- Matriz perfil × recurso (escritura), intentos de escalar privilegios y cambio de ID.
-- 0 filas afectadas = la fila no está al alcance (RLS). 42501 = operación o columna no permitida.
begin;
\ir _escenario.psql
select plan(52);

-- Datos de la empresa ----------------------------------------------------------------------
select tests.como(tests.id('aa'));
select is(tests.filas(format($$update public.organizations set nombre_comercial = 'Andino' where id = %L$$, tests.id('orgA'))), 1,
  'aa edita el nombre comercial de su empresa');
select is(tests.filas(format($$update public.organizations set nombre_comercial = 'X' where id = %L$$, tests.id('orgB'))), 0,
  'aa NO edita otra empresa cambiando el ID');
select throws_ok(format($$update public.organizations set razon_social = 'X' where id = %L$$, tests.id('orgA')), '42501', null,
  'aa NO edita la razón social (viene del CRM/ERP)');
select throws_ok(format($$update public.organizations set rut = '99999999-9' where id = %L$$, tests.id('orgA')), '42501', null,
  'aa NO edita el RUT');
select throws_ok($$insert into public.organizations (tipo, razon_social, nombre_comercial) values ('cliente', 'X', 'X')$$, '42501', null,
  'nadie crea organizaciones por escritura directa');
select throws_ok(format($$delete from public.organizations where id = %L$$, tests.id('orgA')), '42501', null,
  'nadie borra organizaciones');

select tests.como(tests.id('ai'));
select is(tests.filas(format($$update public.organizations set nombre_comercial = 'X' where id = %L$$, tests.id('orgA'))), 0,
  'ai (integrante) NO edita los datos de su empresa');

select tests.como(tests.id('v1'));
select is(tests.filas(format($$update public.organizations set contacto_nombre = 'Ana' where id = %L$$, tests.id('orgA'))), 1,
  'v1 edita el contacto de una empresa de su cartera');
select is(tests.filas(format($$update public.organizations set contacto_nombre = 'X' where id = %L$$, tests.id('orgB'))), 0,
  'v1 NO edita una empresa fuera de su cartera');
select is(tests.filas(format($$update public.organizations set nombre_comercial = 'X' where id = %L$$, tests.org_marley())), 0,
  'v1 NO edita la organización Marley');

select tests.como(tests.id('g'));
select is(tests.filas(format($$update public.organizations set contacto_nombre = 'Gerencia' where id = %L$$, tests.id('orgB'))), 1,
  'g edita cualquier empresa cliente');

select tests.como(tests.id('vx'));
select is(tests.filas(format($$update public.organizations set contacto_nombre = 'X' where id = %L$$, tests.id('orgD'))), 0,
  'vx (desactivado) NO edita su antigua cartera');

-- Perfiles y membresías: nadie se cambia de perfil ni suplanta a otro -------------------------
select tests.como(tests.id('aa'));
select is(tests.filas(format($$update public.profiles set nombre = 'Ana Admin' where id = %L$$, tests.id('aa'))), 1,
  'aa edita su propio nombre');
select is(tests.filas(format($$update public.profiles set nombre = 'Hackeado' where id = %L$$, tests.id('ai'))), 0,
  'aa NO edita el perfil de otra persona');
select throws_ok(format($$update public.profiles set email = 'x@x.cl' where id = %L$$, tests.id('aa')), '42501', null,
  'aa NO cambia su correo por la tabla de perfiles');
select throws_ok(format($$update public.memberships set perfil = 'gerencia' where user_id = %L$$, tests.id('aa')), '42501', null,
  'aa NO se cambia a gerencia');
select throws_ok(format($$update public.memberships set organization_id = %L where user_id = %L$$, tests.id('orgB'), tests.id('aa')), '42501', null,
  'aa NO se cambia de empresa');
select throws_ok(format($$insert into public.memberships (user_id, organization_id, perfil, estado) values (%L, %L, 'cliente_admin', 'activa')$$, tests.id('aa'), tests.id('orgB')), '42501', null,
  'aa NO se agrega a otra empresa');
select throws_ok(format($$insert into public.invitations (organization_id, email, nombre, perfil) values (%L, 'x@x.cl', 'X', 'gerencia')$$, tests.org_marley()), '42501', null,
  'nadie crea invitaciones por escritura directa');
select throws_ok($$insert into public.role_permissions (perfil, permiso) values ('cliente_admin', 'maquinas.editar')$$, '42501', null,
  'nadie se agrega permisos');
select throws_ok($$select public.registrar_gerencia_inicial('aa@prueba.marley.test', 'Yo')$$, '42501', null,
  'nadie se registra como gerencia desde la app');

select tests.como(tests.id('v1'));
select throws_ok(format($$update public.crm_empresas set asignado_a = %L where rut = '22222222-2'$$, tests.id('v1')), '42501', null,
  'v1 NO se asigna empresas (la asignación viene del CRM)');
select throws_ok(format($$update public.memberships set perfil = 'kam' where user_id = %L$$, tests.id('v1')), '42501', null,
  'v1 NO se cambia a KAM');

-- Puntos -----------------------------------------------------------------------------------
select tests.como(tests.id('aa'));
select is(tests.filas(format($$update public.points set horario = '8 a 18' where id = %L$$, tests.id('pa1'))), 1,
  'aa edita el horario de un punto de su empresa');
select throws_ok(format($$update public.points set telemetria_disponible = false where id = %L$$, tests.id('pa1')), '42501', null,
  'aa NO cambia la marca de telemetría');
select throws_ok(format($$update public.points set activo = false where id = %L$$, tests.id('pa1')), '42501', null,
  'aa NO da de baja un punto (lo solicita)');
select is(tests.filas(format($$update public.points set horario = 'X' where id = %L$$, tests.id('pb1'))), 0,
  'aa NO edita un punto de otra empresa');
select throws_ok(format($$insert into public.points (organization_id, nombre, canal) values (%L, 'Nuevo', 'horeca')$$, tests.id('orgA')), '42501', null,
  'aa NO agrega puntos (lo solicita)');
select throws_ok(format($$update public.points set organization_id = %L where id = %L$$, tests.id('orgB'), tests.id('pa1')), '42501', null,
  'nadie mueve un punto a otra empresa');
select throws_ok(format($$delete from public.points where id = %L$$, tests.id('pa1')), '42501', null,
  'nadie borra puntos');

select tests.como(tests.id('ai'));
select is(tests.filas(format($$update public.points set horario = 'X' where id = %L$$, tests.id('pa1'))), 0,
  'ai (integrante) NO edita puntos');

select tests.como(tests.id('v1'));
select is(tests.filas(format($$update public.points set telemetria_disponible = false where id = %L$$, tests.id('pa1'))), 1,
  'v1 cambia la marca de telemetría en su cartera');
select lives_ok(format($$insert into public.points (organization_id, nombre, canal) values (%L, 'Andino Centro', 'horeca')$$, tests.id('orgA')),
  'v1 agrega un punto en su cartera');
select throws_ok(format($$insert into public.points (organization_id, nombre, canal) values (%L, 'Intruso', 'ocs')$$, tests.id('orgB')), '42501', null,
  'v1 NO agrega puntos fuera de su cartera');

select tests.como(tests.id('pp'));
select is(tests.filas(format($$update public.points set horario = 'X' where id = %L$$, tests.id('pa1'))), 0,
  'pp (partner) NO edita puntos');

-- Máquinas: el KAM edita, el vendedor solo ve --------------------------------------------
select tests.como(tests.id('v1'));
select throws_ok(format($$insert into public.machines (point_id, modelo, numero_serie) values (%L, 'M', 'SER-V1')$$, tests.id('pa1')), '42501', null,
  'v1 (vendedor) NO agrega máquinas en su cartera');
select is(tests.filas(format($$update public.machines set modelo = 'X' where id = %L$$, tests.id('ma1'))), 0,
  'v1 (vendedor) NO edita máquinas en su cartera');
select is(tests.filas(format($$delete from public.machines where id = %L$$, tests.id('ma1'))), 0,
  'v1 (vendedor) NO quita máquinas en su cartera');

select tests.como(tests.id('k1'));
select lives_ok(format($$insert into public.machines (point_id, modelo, numero_serie) values (%L, 'M', 'SER-K1')$$, tests.id('pb1')),
  'k1 (KAM) agrega una máquina en su cartera');
select is(tests.filas(format($$update public.machines set modelo = 'S3' where id = %L$$, tests.id('mb1'))), 1,
  'k1 (KAM) edita una máquina en su cartera');
select is(tests.filas(format($$update public.machines set modelo = 'X' where id = %L$$, tests.id('ma1'))), 0,
  'k1 NO edita máquinas fuera de su cartera');
select throws_ok(format($$update public.machines set point_id = %L where id = %L$$, tests.id('pa1'), tests.id('mb1')), '42501', null,
  'k1 NO mueve una máquina a un punto fuera de su cartera');
select throws_ok(format($$insert into public.machines (point_id, modelo, numero_serie) values (%L, 'M', 'SER-K2')$$, tests.id('pa1')), '42501', null,
  'k1 NO agrega máquinas fuera de su cartera');

select tests.como(tests.id('g'));
select is(tests.filas(format($$update public.machines set modelo = 'Revisada' where id = %L$$, tests.id('ma1'))), 1,
  'g edita máquinas');

select tests.como(tests.id('aa'));
select is(tests.filas(format($$update public.machines set modelo = 'X' where id = %L$$, tests.id('ma1'))), 0,
  'aa (cliente) ve pero NO edita máquinas');

-- Historial: nadie lo altera ---------------------------------------------------------------
select tests.como(tests.id('g'));
select throws_ok($$delete from public.audit_log$$, '42501', null, 'g NO borra el historial');
select throws_ok($$update public.audit_log set actor_id = null$$, '42501', null, 'g NO edita el historial');
select throws_ok($$insert into public.audit_log (tabla, operacion) values ('x', 'INSERT')$$, '42501', null,
  'g NO inserta en el historial');

-- Funciones con un ID fuera del alcance responden igual que si no existiera ----------------
select tests.como(tests.id('v1'));
select throws_ok($$select public.activar_empresa('33333333-3')$$, 'P0002', 'no_encontrado',
  'v1 NO activa una empresa de la cartera de otro (no_encontrado)');
select throws_ok(format($$select public.cambiar_estado_miembro(%L, false)$$, tests.id('ba')), 'P0002', 'no_encontrado',
  'v1 NO desactiva personas fuera de su cartera (no_encontrado)');
select tests.como(tests.id('aa'));
select throws_ok($$select public.activar_empresa('11111111-1')$$, '42501', 'sin_permiso',
  'aa NO activa empresas');
select throws_ok(format($$select * from public.crear_invitacion(%L, 'x@x.cl', 'X', 'cliente_admin')$$, tests.id('orgB')), 'P0002', 'no_encontrado',
  'aa NO invita personas a otra empresa (no_encontrado)');

select * from finish();
rollback;
