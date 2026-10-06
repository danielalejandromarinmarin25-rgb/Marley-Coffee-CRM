-- Cálculo diario con datos reales: crea la alerta, el pedido sugerido, los avisos y la escalada a
-- gerencia, sin duplicar nada si corre varias veces. Al entregar, el saldo sube y la alerta se resuelve.
begin;
\ir _escenario.psql
select plan(16);
select tests.como_sistema();

insert into public.productos (id, sku, nombre, formato, kg_por_bolsa)
values ('f0000000-0000-4000-8000-000000000002', 'TEST2-1K', 'Café recálculo', 'Bolsa 1 kg', 1);

-- pb1 (empresa B, KAM k1, con telemetría): 2 bolsas hace 3 días y ~1,4 kg/día → se acaba hoy.
insert into public.mezcla_punto (point_id, producto_id, organization_id, proporcion, bolsas_habituales)
values (tests.id('pb1'), 'f0000000-0000-4000-8000-000000000002', tests.id('orgB'), 1, 5);
insert into public.declaraciones_stock (organization_id, point_id, producto_id, bolsas, declarado_at)
values (tests.id('orgB'), tests.id('pb1'), 'f0000000-0000-4000-8000-000000000002', 2, now() - interval '3 days');
insert into public.lecturas_telemetria (organization_id, point_id, fecha, bebidas, gramos_por_bebida)
select tests.id('orgB'), tests.id('pb1'), current_date - d, 200, 7 from generate_series(1, 2) d;

select private.recalcular_reposicion(tests.id('pb1'));

select is((select count(*)::integer from public.alertas where point_id = tests.id('pb1')), 1, 'se crea una alerta');
select is((select estado::text from public.alertas where point_id = tests.id('pb1')), 'critica', 'bajo el umbral, la alerta nace crítica');
select is((select fuente::text from public.saldos where point_id = tests.id('pb1')), 'telemetria', 'el saldo usa la telemetría del punto');
select is((select count(*)::integer from public.pedidos_sugeridos ps join public.alertas a on a.id = ps.alerta_id where a.point_id = tests.id('pb1')),
  1, 'con su pedido sugerido');
select ok((select bolsas from public.lineas_sugeridas l join public.pedidos_sugeridos ps on ps.id = l.pedido_sugerido_id
           join public.alertas a on a.id = ps.alerta_id where a.point_id = tests.id('pb1')) >= 1, 'el pedido sugerido trae cantidades');
select is((select count(*)::integer from public.notificaciones where user_id = tests.id('ba') and tipo = 'alerta_nueva'), 1, 'el cliente recibe la alerta');
select is((select count(*)::integer from public.notificaciones where user_id = tests.id('k1') and tipo = 'alerta_nueva'), 1, 'el KAM la recibe a la vez');
select is((select count(*)::integer from public.notificaciones where user_id = tests.id('g') and tipo = 'alerta_critica'), 1, 'la crítica sube a gerencia');
select is((select count(*)::integer from public.notificaciones where user_id = tests.id('k1') and tipo = 'alerta_critica'), 1, 'y sigue visible para el KAM');

-- Correr de nuevo no duplica nada.
select private.recalcular_reposicion(tests.id('pb1'));
select private.recalcular_reposicion(null);
select is((select count(*)::integer from public.alertas where point_id = tests.id('pb1')), 1, 'recalcular no duplica la alerta');
select is((select count(*) - count(distinct (user_id, tipo)) from public.notificaciones
           where alerta_id = (select id from public.alertas where point_id = tests.id('pb1')))::integer,
  0, 'recalcular no duplica avisos: uno por persona y tipo');

-- El cliente confirma y el pedido se entrega: el saldo sube y la alerta se resuelve.
select tests.como(tests.id('ba'));
select codigo from public.confirmar_pedido((select ps.id from public.pedidos_sugeridos ps join public.alertas a on a.id = ps.alerta_id
  where a.point_id = tests.id('pb1')));
select tests.como_sistema();
select public.avanzar_pedido((select codigo from public.pedidos where point_id = tests.id('pb1')));
select is((select estado::text from public.pedidos where point_id = tests.id('pb1')), 'en_preparacion', 'el comando avanza al estado siguiente');
select public.avanzar_pedido((select codigo from public.pedidos where point_id = tests.id('pb1')), 'entregado');
select is((select count(*)::integer from public.historial_pedido h join public.pedidos p on p.id = h.pedido_id where p.point_id = tests.id('pb1')),
  4, 'el historial del pedido tiene los cuatro estados');
select is((select estado::text from public.alertas where point_id = tests.id('pb1') order by creada_at limit 1), 'resuelta', 'al entregar, la alerta se resuelve');
select ok((select saldo_kg from public.saldos where point_id = tests.id('pb1')) > 0, 'la entrega sube el saldo');
select throws_ok($$select public.avanzar_pedido((select codigo from public.pedidos where point_id = 'c0000000-0000-4000-8000-0000000000b1'))$$,
  'P0001', 'estado_invalido', 'un pedido entregado no avanza más');

select * from finish();
rollback;
