-- Historial de acciones y acceso sin sesión.
begin;
\ir _escenario.psql
select plan(11);

select tests.como(tests.id('aa'));
select tests.filas(format($$update public.organizations set nombre_comercial = 'Andino Café' where id = %L$$, tests.id('orgA')));
select tests.como_sistema();
select is(
  (select actor_id from public.audit_log where tabla = 'organizations' and operacion = 'UPDATE' order by id desc limit 1),
  tests.id('aa'), 'el historial registra quién hizo el cambio');
select is(
  (select actor_perfil::text from public.audit_log where tabla = 'organizations' and operacion = 'UPDATE' order by id desc limit 1),
  'cliente_admin', 'el historial registra con qué perfil');
select is(
  (select organization_id from public.audit_log where tabla = 'organizations' and operacion = 'UPDATE' order by id desc limit 1),
  tests.id('orgA'), 'el historial registra la empresa afectada');
select is(
  (select despues ->> 'nombre_comercial' from public.audit_log where tabla = 'organizations' and operacion = 'UPDATE' order by id desc limit 1),
  'Andino Café', 'el historial guarda el valor nuevo');
select throws_ok($$update public.audit_log set actor_id = null$$, '42501', null,
  'el historial es inmutable incluso para el dueño de la tabla');

select tests.como(tests.id('k1'));
select tests.filas(format($$update public.machines set modelo = 'S9' where id = %L$$, tests.id('mb1')));
select tests.como_sistema();
select is(
  (select organization_id from public.audit_log where tabla = 'machines' order by id desc limit 1),
  tests.id('orgB'), 'los cambios de máquinas quedan asociados a la empresa del punto');

-- Sin sesión no hay acceso a nada.
select tests.como_anonimo();
select throws_ok($$select count(*) from public.organizations$$, '42501', null, 'anónimo NO lee organizaciones');
select throws_ok($$select count(*) from public.points$$, '42501', null, 'anónimo NO lee puntos');
select throws_ok($$select count(*) from public.profiles$$, '42501', null, 'anónimo NO lee perfiles');
select throws_ok($$select * from public.mi_sesion()$$, '42501', null, 'anónimo NO llama funciones de la app');
select throws_ok($$select public.activar_empresa('11111111-1')$$, '42501', null, 'anónimo NO activa empresas');

select * from finish();
rollback;
