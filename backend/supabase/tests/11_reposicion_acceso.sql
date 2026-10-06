-- Matriz de acceso del flujo de reposición: quién ve y quién hace qué.
-- Regla central: cliente y vendedor/KAM ven la alerta; ambos pueden ajustar; SOLO el cliente confirma.
begin;
\ir _escenario.psql
\ir _escenario_reposicion.psql
select plan(67);

-- Lectura ---------------------------------------------------------------------------------------
create or replace function tests.ve(p_actor text, p_tabla text, p_columna text, p_id uuid) returns boolean
language plpgsql as $$
declare n integer;
begin
  perform tests.como(tests.id(p_actor));
  n := tests.visibles(p_tabla, p_columna, p_id::text);
  perform tests.como_sistema();
  return n > 0;
end $$;

-- El cliente ve lo de su empresa y nada de otra.
select ok(tests.ve('aa', 'alertas', 'id', tests.rid('alA1')), 'administrador A ve la alerta de su empresa');
select ok(tests.ve('ai', 'alertas', 'id', tests.rid('alA1')), 'integrante A ve la alerta de su empresa');
select ok(not tests.ve('aa', 'alertas', 'id', tests.rid('alB1')), 'empresa A NO ve alertas de la empresa B');
select ok(not tests.ve('ba', 'alertas', 'id', tests.rid('alA1')), 'empresa B NO ve alertas de la empresa A');
select ok(not tests.ve('ba', 'pedidos_sugeridos', 'id', tests.rid('sA1')), 'empresa B NO ve el pedido sugerido de A');
select ok(not tests.ve('ba', 'lineas_sugeridas', 'pedido_sugerido_id', tests.rid('sA1')), 'empresa B NO ve las líneas sugeridas de A');
select ok(not tests.ve('aa', 'alerta_gestiones', 'alerta_id', tests.rid('alA1')), 'el cliente NO ve las notas internas de Marley');

-- Vendedor y KAM: solo su cartera.
select ok(tests.ve('v1', 'alertas', 'id', tests.rid('alA1')), 'vendedor v1 ve la alerta de su cartera');
select ok(not tests.ve('v1', 'alertas', 'id', tests.rid('alB1')), 'vendedor v1 NO ve alertas fuera de su cartera');
select ok(tests.ve('k1', 'alertas', 'id', tests.rid('alB1')), 'KAM k1 ve la alerta de su cartera');
select ok(not tests.ve('k1', 'alertas', 'id', tests.rid('alA1')), 'KAM k1 NO ve alertas fuera de su cartera');
select ok(not tests.ve('v2', 'alertas', 'id', tests.rid('alA1')), 'otro vendedor NO ve la alerta');
select ok(tests.ve('v1', 'alerta_gestiones', 'alerta_id', tests.rid('alA1')), 'el vendedor ve las gestiones de su cartera');
select ok(not tests.ve('vx', 'alertas', 'id', tests.rid('alA1')), 'una cuenta desactivada no ve nada');

-- Gerencia: supervisión de todo, incluidas las críticas.
select ok(tests.ve('g', 'alertas', 'id', tests.rid('alA1')), 'gerencia ve la crítica de A');
select ok(tests.ve('g', 'alertas', 'id', tests.rid('alB1')), 'gerencia ve la crítica de B');
select tests.como(tests.id('g'));
select is((select count(*)::integer from public.alertas where estado = 'critica' and id in (tests.rid('alA1'), tests.rid('alB1'))),
  2, 'gerencia lista todas las alertas críticas');
select tests.como_sistema();

-- Partner: atiende pa1, pero no ve stock, alertas ni pedidos de la empresa cliente.
select ok(not tests.ve('pp', 'alertas', 'id', tests.rid('alA1')), 'el partner NO ve alertas del cliente');
select ok(not tests.ve('pp', 'pedidos_sugeridos', 'id', tests.rid('sA1')), 'el partner NO ve pedidos sugeridos');

-- Notificaciones: cada persona solo las suyas.
select tests.como(tests.id('aa'));
select is((select count(*)::integer from public.notificaciones where titulo in ('Aviso A', 'Aviso B')), 1, 'cada persona ve solo sus avisos');
select tests.como_sistema();

-- Escritura directa: bloqueada para todos -------------------------------------------------------
select tests.como(tests.id('aa'));
select throws_ok(format($$insert into public.pedidos (organization_id, point_id) values (%L, %L)$$, tests.id('orgA'), tests.id('pa1')),
  '42501', null, 'nadie crea pedidos escribiendo la tabla directamente');
select throws_ok(format($$update public.lineas_sugeridas set bolsas = 50 where pedido_sugerido_id = %L$$, tests.rid('sA1')),
  '42501', null, 'nadie cambia cantidades escribiendo la tabla directamente');
select throws_ok(format($$update public.alertas set estado = 'resuelta' where id = %L$$, tests.rid('alA1')),
  '42501', null, 'nadie cambia el estado de una alerta directamente');
select throws_ok($$select public.recalcular_reposicion()$$, '42501', null, 'la app no dispara el cálculo');
select throws_ok($$select public.avanzar_pedido('MC-00001')$$, '42501', null, 'la app no avanza estados de pedido');
select throws_ok($$select * from public.resumenes_correo_pendientes()$$, '42501', null, 'la app no lee la cola de correo');
select tests.como_sistema();

-- Ajustar el pedido sugerido ---------------------------------------------------------------------
select tests.como(tests.id('v1'));
select lives_ok(format($$select public.ajustar_pedido_sugerido(%L, %L)$$, tests.rid('sA1'),
  json_build_array(json_build_object('producto_id', tests.rid('cafe'), 'bolsas', 6))),
  'el vendedor ajusta las cantidades del pedido sugerido de su cartera');
select tests.como_sistema();
select is((select bolsas from public.lineas_sugeridas where pedido_sugerido_id = tests.rid('sA1')), 6, 'la cantidad quedó ajustada');
select is((select bolsas_sugeridas from public.lineas_sugeridas where pedido_sugerido_id = tests.rid('sA1')), 4, 'se conserva la cantidad sugerida original');
select is((select ajustado_por_nombre from public.pedidos_sugeridos where id = tests.rid('sA1')), 'Persona v1', 'queda quién ajustó');
select is((select estado::text from public.alertas where id = tests.rid('alA1')), 'critica', 'ajustar no cambia el estado de la alerta');
select is((select count(*)::integer from public.notificaciones where user_id = tests.id('aa') and tipo = 'pedido_ajustado'),
  1, 'el cliente recibe el aviso del ajuste');
select is((select actor_id from public.audit_log where tabla = 'lineas_sugeridas' and operacion = 'UPDATE' order by id desc limit 1),
  tests.id('v1'), 'el historial registra quién ajustó');

-- Un segundo ajuste no duplica el aviso.
select tests.como(tests.id('v1'));
select public.ajustar_pedido_sugerido(tests.rid('sA1'), json_build_array(json_build_object('producto_id', tests.rid('cafe'), 'bolsas', 7))::jsonb);
select tests.como_sistema();
select is((select count(*)::integer from public.notificaciones where user_id = tests.id('aa') and tipo = 'pedido_ajustado'),
  1, 'varios ajustes generan un solo aviso');

select tests.como(tests.id('k1'));
select throws_ok(format($$select public.ajustar_pedido_sugerido(%L, '[{"producto_id":"%s","bolsas":1}]')$$, tests.rid('sA1'), tests.rid('cafe')),
  'P0002', 'no_encontrado', 'el KAM no ajusta fuera de su cartera');
select tests.como(tests.id('g'));
select throws_ok(format($$select public.ajustar_pedido_sugerido(%L, '[{"producto_id":"%s","bolsas":1}]')$$, tests.rid('sA1'), tests.rid('cafe')),
  '42501', 'sin_permiso', 'gerencia supervisa: no ajusta');
select tests.como(tests.id('ba'));
select throws_ok(format($$select public.ajustar_pedido_sugerido(%L, '[{"producto_id":"%s","bolsas":1}]')$$, tests.rid('sA1'), tests.rid('cafe')),
  'P0002', 'no_encontrado', 'otra empresa no ajusta (ni sabe que existe)');
select tests.como(tests.id('pp'));
select throws_ok(format($$select public.ajustar_pedido_sugerido(%L, '[{"producto_id":"%s","bolsas":1}]')$$, tests.rid('sA1'), tests.rid('cafe')),
  'P0002', 'no_encontrado', 'el partner no ajusta');
select tests.como(tests.id('aa'));
select throws_ok(format($$select public.ajustar_pedido_sugerido(%L, '[{"producto_id":"%s","bolsas":500}]')$$, tests.rid('sA1'), tests.rid('cafe')),
  'P0001', 'cantidad_invalida', 'cantidades fuera de rango se rechazan');
select tests.como_sistema();

-- Confirmar: solo el cliente ------------------------------------------------------------------
select tests.como(tests.id('v1'));
select throws_ok(format($$select * from public.confirmar_pedido(%L)$$, tests.rid('sA1')),
  '42501', 'sin_permiso', 'el vendedor NO puede confirmar un pedido');
select tests.como(tests.id('k1'));
select throws_ok(format($$select * from public.confirmar_pedido(%L)$$, tests.rid('sB1')),
  '42501', 'sin_permiso', 'el KAM NO puede confirmar ni en su cartera');
select tests.como(tests.id('g'));
select throws_ok(format($$select * from public.confirmar_pedido(%L)$$, tests.rid('sA1')),
  '42501', 'sin_permiso', 'gerencia NO puede confirmar');
select tests.como(tests.id('ba'));
select throws_ok(format($$select * from public.confirmar_pedido(%L)$$, tests.rid('sA1')),
  'P0002', 'no_encontrado', 'otra empresa NO confirma (ni sabe que existe)');
select tests.como(tests.id('pp'));
select throws_ok(format($$select * from public.confirmar_pedido(%L)$$, tests.rid('sA1')),
  'P0002', 'no_encontrado', 'el partner NO confirma');

select tests.como(tests.id('ai'));
select lives_ok(format($$select * from public.confirmar_pedido(%L)$$, tests.rid('sA1')),
  'el integrante de la empresa confirma el pedido (con telemetría no se le pide nada)');
select tests.como_sistema();
select is((select count(*)::integer from public.pedidos where alerta_id = tests.rid('alA1')), 1, 'se creó un pedido');
select is((select bolsas from public.lineas_pedido l join public.pedidos p on p.id = l.pedido_id where p.alerta_id = tests.rid('alA1')),
  7, 'el pedido lleva la cantidad ajustada por el vendedor');
select is((select estado::text from public.alertas where id = tests.rid('alA1')), 'confirmada', 'la alerta pasa a confirmada');
select is((select estado::text from public.pedidos where alerta_id = tests.rid('alA1')), 'recibido', 'el pedido nace como Recibido');
select is((select actor_id from public.audit_log where tabla = 'pedidos' and operacion = 'INSERT' order by id desc limit 1),
  tests.id('ai'), 'el historial registra quién confirmó');
select is((select count(*)::integer from public.notificaciones where user_id = tests.id('v1') and tipo = 'pedido_confirmado'),
  1, 'el vendedor recibe el aviso de la confirmación');

-- Sin duplicados.
select tests.como(tests.id('aa'));
select throws_ok(format($$select * from public.confirmar_pedido(%L)$$, tests.rid('sA1')),
  'P0001', 'pedido_ya_confirmado', 'una segunda confirmación de la misma alerta se rechaza');
select tests.como(tests.id('v1'));
select throws_ok(format($$select public.ajustar_pedido_sugerido(%L, '[{"producto_id":"%s","bolsas":1}]')$$, tests.rid('sA1'), tests.rid('cafe')),
  'P0001', 'alerta_cerrada', 'después de confirmar ya no se ajusta');
select tests.como_sistema();
select throws_ok(format($$insert into public.pedidos (alerta_id, organization_id, point_id) values (%L, %L, %L)$$,
  tests.rid('alA1'), tests.id('orgA'), tests.id('pa1')),
  '23505', null, 'la base impide un segundo pedido para la misma alerta');
select throws_ok(format($$insert into public.pedidos_sugeridos (alerta_id, organization_id, point_id) values (%L, %L, %L)$$,
  tests.rid('alA2'), tests.id('orgA'), tests.id('pa2')),
  '23505', null, 'la base impide un segundo pedido sugerido para la misma alerta');
select throws_ok(format($$insert into public.alertas (organization_id, point_id, producto_id, severidad, fuente) values (%L, %L, %L, 'amarilla', 'declarado')$$,
  tests.id('orgA'), tests.id('pa2'), tests.rid('cafe')),
  '23505', null, 'la base impide dos alertas vivas para el mismo punto y café');

-- Modo B: sin telemetría se piden las bolsas que quedan.
select tests.como(tests.id('aa'));
select throws_ok(format($$select * from public.confirmar_pedido(%L)$$, tests.rid('sA2')),
  'P0001', 'faltan_bolsas_restantes', 'sin telemetría, confirmar exige las bolsas que quedan');
select lives_ok(format($$select * from public.confirmar_pedido(%L, '[{"producto_id":"%s","bolsas":1.5}]')$$, tests.rid('sA2'), tests.rid('cafe')),
  'con las bolsas que quedan, el pedido se confirma');
select tests.como_sistema();
select is((select bolsas from public.declaraciones_stock where point_id = tests.id('pa2') order by declarado_at desc limit 1),
  1.5, 'queda registrada la declaración del cliente (Modo B)');
select is((select declarado_por from public.declaraciones_stock where point_id = tests.id('pa2') order by declarado_at desc limit 1),
  tests.id('aa'), 'con quién la declaró');

-- Posponer y gestionar ---------------------------------------------------------------------------
select tests.como(tests.id('k1'));
select throws_ok(format($$select public.posponer_alerta(%L, 2)$$, tests.rid('alB1')), '42501', 'sin_permiso', 'el KAM no pospone por el cliente');
select lives_ok(format($$select public.registrar_gestion(%L, 'whatsapp')$$, tests.rid('alB1')), 'el KAM registra el contacto por WhatsApp');
select tests.como(tests.id('ba'));
select throws_ok(format($$select public.registrar_gestion(%L, 'nota', 'hola')$$, tests.rid('alB1')), '42501', 'sin_permiso', 'el cliente no escribe notas internas');
select lives_ok(format($$select public.posponer_alerta(%L, 2)$$, tests.rid('alB1')), 'el cliente pospone su alerta');
select tests.como_sistema();
select is((select estado::text from public.alertas where id = tests.rid('alB1')), 'pospuesta', 'la alerta queda pospuesta');

-- Sin sesión ------------------------------------------------------------------------------------
select tests.como_anonimo();
select throws_ok($$select count(*) from public.alertas$$, '42501', null, 'anónimo NO lee alertas');
select throws_ok(format($$select * from public.confirmar_pedido(%L)$$, tests.rid('sB1')), '42501', null, 'anónimo NO confirma');

select * from finish();
rollback;
