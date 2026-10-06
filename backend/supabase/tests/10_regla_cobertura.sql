-- Pruebas unitarias de la regla de cobertura (funciones puras: no leen tablas ni la hora).
begin;
create extension if not exists pgtap with schema extensions;
select plan(38);

-- Fuente del consumo, por punto
select is(private.fuente_de_punto(true), 'telemetria', 'con telemetría: Modo A');
select is(private.fuente_de_punto(false), 'declarado', 'sin telemetría: Modo B (declarado por el cliente)');
select is(private.fuente_de_punto(null), 'declarado', 'sin dato de telemetría: Modo B');

-- Cobertura = saldo ÷ consumo diario
select is(private.cobertura_dias(10, 2), 5.0, 'cobertura = saldo ÷ consumo');
select is(private.cobertura_dias(1.25, 0.671), 1.9, 'redondea a un decimal');
select is(private.cobertura_dias(0, 2), 0::numeric, 'sin saldo: cero días');
select is(private.cobertura_dias(-1, 2), 0::numeric, 'saldo negativo: cero días');
select is(private.cobertura_dias(5, 0), null, 'sin consumo: no se agota (null)');
select is(private.cobertura_dias(5, null), null, 'consumo desconocido: null');

-- Plazo de entrega por zona
select is(private.plazo_entrega('rm', 2, 4), 2::numeric, 'RM: 48 horas');
select is(private.plazo_entrega('regiones', 2, 4), 4::numeric, 'regiones: hasta 96 horas');

-- Semáforo (plazo 2 + gestión 1 + margen 2 = 5 días en RM)
select is(private.severidad(1.9, 2, 1, 2), 'roja', 'se acaba antes de que llegue un pedido de hoy: roja');
select is(private.severidad(2, 2, 1, 2), 'roja', 'límite: cobertura igual al plazo es roja');
select is(private.severidad(3.4, 2, 1, 2), 'amarilla', 'no alcanza plazo + gestión + margen: amarilla');
select is(private.severidad(5, 2, 1, 2), 'amarilla', 'límite: igual a plazo + gestión + margen es amarilla');
select is(private.severidad(5.1, 2, 1, 2), null, 'alcanza con holgura: verde (sin alerta)');
select is(private.severidad(null, 2, 1, 2), null, 'sin consumo: verde');
select is(private.severidad(6, 4, 1, 2), 'amarilla', 'en regiones el umbral es mayor (7 días)');

-- Paso a crítica
select ok(private.debe_ser_critica(1.9, 3, 'abierta'), 'bajo el umbral y sin confirmar: crítica');
select ok(private.debe_ser_critica(3, 3, 'abierta'), 'en el umbral: crítica');
select ok(not private.debe_ser_critica(3.1, 3, 'abierta'), 'sobre el umbral: no es crítica');
select ok(private.debe_ser_critica(1, 3, 'pospuesta'), 'posponer no evita que pase a crítica');
select ok(not private.debe_ser_critica(1, 3, 'confirmada'), 'confirmada: nunca pasa a crítica');
select ok(not private.debe_ser_critica(null, 3, 'abierta'), 'sin cobertura calculable: no es crítica');

-- Modo B: consumo del ciclo (ejemplo de la nota de stock)
select is(private.consumo_declarado(2, 10, 2, 14), 0.714, 'quedaban 2 + llegaron 10 − quedan 2 en 14 días ≈ 0,7 kg/día');
select is(private.consumo_declarado(2, 6, 1, 14), 0.500, 'otro ciclo: 0,5 kg/día');
select is(private.consumo_declarado(2, 10, 2, 0), null, 'ciclo de menos de un día: sin tasa');
select is(private.consumo_declarado(1, 0, 5, 7), null, 'quedan más de las que había: dato inconsistente, sin tasa');

-- Saldo
select is(private.saldo_proyectado(4, 10, 12.76), 1.24, 'saldo = conteo + entregas − consumo');
select is(private.saldo_proyectado(1, 0, 5), 0::numeric, 'el saldo nunca es negativo');
select is(private.saldo_proyectado(null, null, null), 0::numeric, 'sin datos: cero');

-- Pedido sugerido (plazo 2 + ciclo 14 días)
select is(private.bolsas_sugeridas(0.671, 1.25, 1, 2, 14, 6), 10, 'cubre el plazo más un ciclo, descontando el saldo');
select is(private.bolsas_sugeridas(null, 1, 1, 2, 14, 6), 6, 'sin tasa de consumo: la compra habitual');
select is(private.bolsas_sugeridas(50, 0, 1, 2, 14, 6), 99, 'tope de 99 bolsas');
select is(private.bolsas_sugeridas(0.1, 30, 1, 2, 14, 6), 1, 'mínimo una bolsa');

-- Agotamiento estimado
select is(private.agotamiento_estimado('2026-10-05', 1.9), '2026-10-06'::date, 'agotamiento: hoy + días enteros de cobertura');
select is(private.agotamiento_estimado('2026-10-05', 0), '2026-10-05'::date, 'sin saldo: hoy');
select is(private.agotamiento_estimado('2026-10-05', null), null, 'no se agota: sin fecha');

select * from finish();
rollback;
