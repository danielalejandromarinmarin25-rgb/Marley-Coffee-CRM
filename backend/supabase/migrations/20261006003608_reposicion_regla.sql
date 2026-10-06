-- Marley Conecta · Fase 3 · Regla de cobertura, cálculo diario y acciones del flujo
--
-- 1. Funciones PURAS (immutable): toda la decisión de la regla. Se prueban con pgTAP como
--    pruebas unitarias (tests/10_regla_cobertura.sql). No leen tablas ni la hora.
-- 2. recalcular_reposicion(): lee los datos, aplica las funciones puras y crea o actualiza
--    saldos, alertas, pedidos sugeridos y avisos. La corre pg_cron cada día y un comando manual.
-- 3. Acciones de la app (ajustar, confirmar, posponer, gestionar): security definer, con el
--    permiso comprobado en role_permissions. Solo el cliente confirma.
-- 4. Comandos internos (solo service_role): avanzar el estado de un pedido y el resumen de correo.

-- 1. Funciones puras ---------------------------------------------------------------------------

-- Fuente del consumo, decidida por punto: con telemetría, Modo A; sin ella, Modo B (declarado).
create function private.fuente_de_punto(p_telemetria boolean) returns public.fuente_consumo
language sql immutable set search_path = '' as $$
  select case when coalesce(p_telemetria, false) then 'telemetria' else 'declarado' end::public.fuente_consumo
$$;

-- Cobertura = saldo ÷ consumo diario (días que alcanza). null = no se agota con el consumo actual.
create function private.cobertura_dias(p_saldo_kg numeric, p_consumo_kg_dia numeric) returns numeric
language sql immutable set search_path = '' as $$
  select case
    when p_consumo_kg_dia is null or p_consumo_kg_dia <= 0 then null
    when p_saldo_kg is null or p_saldo_kg <= 0 then 0
    else round(p_saldo_kg / p_consumo_kg_dia, 1)
  end
$$;

-- Plazo de entrega según la zona del punto.
create function private.plazo_entrega(p_zona public.zona_entrega, p_plazo_rm numeric, p_plazo_regiones numeric)
returns numeric language sql immutable set search_path = '' as $$
  select case when p_zona = 'regiones' then p_plazo_regiones else p_plazo_rm end
$$;

-- Semáforo: roja si se acaba antes de que llegue un pedido hecho hoy; amarilla si la cobertura
-- no alcanza plazo + gestión + margen; null (verde) si alcanza con holgura.
create function private.severidad(p_cobertura numeric, p_plazo numeric, p_gestion numeric, p_margen numeric)
returns public.severidad_alerta language sql immutable set search_path = '' as $$
  select case
    when p_cobertura is null then null
    when p_cobertura <= p_plazo then 'roja'
    when p_cobertura <= p_plazo + p_gestion + p_margen then 'amarilla'
    else null
  end::public.severidad_alerta
$$;

-- Una alerta sin confirmar pasa a crítica cuando la cobertura cae bajo el umbral configurable.
create function private.debe_ser_critica(p_cobertura numeric, p_umbral numeric, p_estado public.estado_alerta)
returns boolean language sql immutable set search_path = '' as $$
  select p_estado in ('abierta', 'pospuesta') and p_cobertura is not null and p_cobertura <= p_umbral
$$;

-- Modo B: consumo del ciclo = quedaban + entregado − quedan ahora, dividido por los días.
create function private.consumo_declarado(p_quedaban_kg numeric, p_entregado_kg numeric, p_quedan_kg numeric, p_dias numeric)
returns numeric language sql immutable set search_path = '' as $$
  select case
    when p_dias is null or p_dias < 1 then null
    when p_quedaban_kg + p_entregado_kg - p_quedan_kg < 0 then null
    else round((p_quedaban_kg + p_entregado_kg - p_quedan_kg) / p_dias, 3)
  end
$$;

-- Saldo = último conteo + entregas − consumo desde ese conteo. Nunca negativo.
create function private.saldo_proyectado(p_ancla_kg numeric, p_entregado_kg numeric, p_consumido_kg numeric)
returns numeric language sql immutable set search_path = '' as $$
  select greatest(0, round(coalesce(p_ancla_kg, 0) + coalesce(p_entregado_kg, 0) - coalesce(p_consumido_kg, 0), 2))
$$;

-- Bolsas del pedido sugerido: lo que falta para cubrir el plazo de entrega más un ciclo de compra.
-- Sin tasa de consumo, la compra habitual. Entre 1 y 99 bolsas.
create function private.bolsas_sugeridas(
  p_consumo_kg_dia numeric, p_saldo_kg numeric, p_kg_por_bolsa numeric,
  p_plazo numeric, p_dias_ciclo integer, p_habituales integer
) returns integer language sql immutable set search_path = '' as $$
  select case
    when p_consumo_kg_dia is null or p_consumo_kg_dia <= 0 then greatest(1, least(99, p_habituales))
    else greatest(1, least(99, ceil(
      (p_consumo_kg_dia * (p_plazo + p_dias_ciclo) - greatest(coalesce(p_saldo_kg, 0), 0)) / p_kg_por_bolsa
    )::integer))
  end
$$;

-- Fecha estimada de agotamiento.
create function private.agotamiento_estimado(p_hoy date, p_cobertura numeric) returns date
language sql immutable set search_path = '' as $$
  select case when p_cobertura is null then null else p_hoy + floor(p_cobertura)::integer end
$$;

-- 2. Destinatarios y avisos -------------------------------------------------------------------

create function private.personas_cliente(p_org uuid) returns setof uuid
language sql stable security definer set search_path = '' as $$
  select m.user_id from public.memberships m
  where m.organization_id = p_org and m.estado = 'activa'
    and m.perfil in ('cliente_admin', 'cliente_integrante')
$$;

create function private.ejecutivo_de(p_org uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select c.asignado_a
  from public.organizations o
  join public.crm_empresas c on c.rut = o.rut
  join public.memberships m on m.user_id = c.asignado_a and m.estado = 'activa'
  where o.id = p_org
$$;

create function private.gerentes() returns setof uuid
language sql stable security definer set search_path = '' as $$
  select user_id from public.memberships where perfil = 'gerencia' and estado = 'activa'
$$;

-- Crea un aviso sin duplicar. Con p_renovar, un aviso repetido se actualiza y vuelve a no leído
-- (por ejemplo, varios ajustes del vendedor sobre la misma alerta generan un solo aviso).
create function private.notificar(
  p_user uuid, p_org uuid, p_tipo text, p_alerta uuid, p_pedido uuid, p_detalle text,
  p_titulo text, p_cuerpo text, p_enlace text, p_correo boolean, p_renovar boolean default false
) returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_user is null then return; end if;
  if p_renovar then
    insert into public.notificaciones (user_id, organization_id, tipo, alerta_id, pedido_id, detalle, titulo, cuerpo, enlace, por_correo)
    values (p_user, p_org, p_tipo, p_alerta, p_pedido, p_detalle, p_titulo, p_cuerpo, p_enlace, p_correo)
    on conflict (user_id, tipo, alerta_id, pedido_id, detalle) do update
      set titulo = excluded.titulo, cuerpo = excluded.cuerpo, creada_at = now(), leida_at = null,
          por_correo = excluded.por_correo,
          correo_enviado_at = case when excluded.por_correo then null else public.notificaciones.correo_enviado_at end;
  else
    insert into public.notificaciones (user_id, organization_id, tipo, alerta_id, pedido_id, detalle, titulo, cuerpo, enlace, por_correo)
    values (p_user, p_org, p_tipo, p_alerta, p_pedido, p_detalle, p_titulo, p_cuerpo, p_enlace, p_correo)
    on conflict do nothing;
  end if;
end $$;

-- Avisos de una alerta a cliente, vendedor o KAM y, si es crítica, a gerencia.
create function private.avisar_alerta(p_alerta uuid, p_tipo text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v record;
  v_user uuid;
  v_dias text;
  v_titulo text;
begin
  select a.id, a.organization_id, a.cobertura_dias, a.estado, pr.nombre as cafe, p.nombre as punto,
         o.nombre_comercial as empresa
  into v
  from public.alertas a
  join public.productos pr on pr.id = a.producto_id
  join public.points p on p.id = a.point_id
  join public.organizations o on o.id = a.organization_id
  where a.id = p_alerta;

  v_dias := case
    when v.cobertura_dias is null then 'pronto'
    when v.cobertura_dias < 1 then 'hoy'
    else format('en %s días', floor(v.cobertura_dias)) end;
  v_titulo := case when p_tipo = 'alerta_critica'
    then format('Crítico: %s se agota %s', v.cafe, v_dias)
    else format('%s se agota %s', v.cafe, v_dias) end;

  for v_user in select private.personas_cliente(v.organization_id) loop
    perform private.notificar(v_user, v.organization_id, p_tipo, v.id, null, null, v_titulo,
      format('%s. Tu pedido sugerido está listo para confirmar.', v.punto),
      '/reposicion/' || v.id, true);
  end loop;
  perform private.notificar(private.ejecutivo_de(v.organization_id), v.organization_id, p_tipo, v.id, null, null,
    v_titulo, format('%s · %s. Contacta al cliente con el pedido sugerido.', v.empresa, v.punto),
    '/hoy', true);
  if p_tipo = 'alerta_critica' then
    for v_user in select private.gerentes() loop
      perform private.notificar(v_user, v.organization_id, p_tipo, v.id, null, null, v_titulo,
        format('%s · %s. Sin confirmación del cliente.', v.empresa, v.punto), '/supervision', true);
    end loop;
  end if;
end $$;

-- 3. Cálculo diario -----------------------------------------------------------------------------

-- Recalcula saldos y alertas de todos los puntos activos (o de uno). Devuelve un resumen.
create function private.recalcular_reposicion(p_point uuid default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  par public.parametros_reposicion;
  r record;
  a public.alertas;
  v_fuente public.fuente_consumo;
  v_ancla_kg numeric; v_ancla_at timestamptz;
  v_prev_kg numeric; v_prev_at timestamptz;
  v_entregado numeric; v_consumido numeric; v_consumo numeric;
  v_saldo numeric; v_cobertura numeric; v_dato_at timestamptz;
  v_plazo numeric; v_sev public.severidad_alerta; v_estado public.estado_alerta;
  v_sugerido uuid; v_alerta uuid;
  n_puntos integer := 0; n_nuevas integer := 0; n_criticas integer := 0; n_resueltas integer := 0;
begin
  select * into par from public.parametros_reposicion;

  for r in
    select p.id as point_id, p.organization_id, p.canal, p.zona, p.telemetria_disponible,
           m.producto_id, m.proporcion, m.bolsas_habituales, pr.kg_por_bolsa
    from public.points p
    join public.mezcla_punto m on m.point_id = p.id
    join public.productos pr on pr.id = m.producto_id
    where p.activo and (p_point is null or p.id = p_point)
    order by p.id, m.producto_id
  loop
    n_puntos := n_puntos + 1;
    v_fuente := private.fuente_de_punto(r.telemetria_disponible);

    -- Último conteo (en Modo A es el conteo inicial al activar la telemetría).
    select d.bolsas * r.kg_por_bolsa, d.declarado_at into v_ancla_kg, v_ancla_at
    from public.declaraciones_stock d
    where d.point_id = r.point_id and d.producto_id = r.producto_id
    order by d.declarado_at desc limit 1;

    if v_ancla_at is null and v_fuente = 'declarado' then
      continue; -- Sin telemetría ni conteo no hay dato: el punto aparece "sin datos".
    end if;
    v_ancla_kg := coalesce(v_ancla_kg, 0);

    select coalesce(sum(e.bolsas), 0) * r.kg_por_bolsa into v_entregado
    from public.entregas e
    where e.point_id = r.point_id and e.producto_id = r.producto_id
      and e.entregada_at > coalesce(v_ancla_at, '-infinity') and e.entregada_at <= now();

    if v_fuente = 'telemetria' then
      -- Modo A: consumo medido, repartido según la mezcla de compra del punto.
      select coalesce(sum(l.kg), 0) * r.proporcion into v_consumido
      from public.lecturas_telemetria l
      where l.point_id = r.point_id and l.fecha > coalesce(v_ancla_at, '-infinity')::date;

      select sum(l.kg) / nullif(count(*), 0) * r.proporcion, max(l.recibida_at)
      into v_consumo, v_dato_at
      from public.lecturas_telemetria l
      where l.point_id = r.point_id and l.fecha > current_date - par.ventana_telemetria_dias;
      v_dato_at := coalesce(v_dato_at, v_ancla_at);
    else
      -- Modo B: tasa del último ciclo entre dos conteos; en el ciclo 1, la del segmento.
      select d.bolsas * r.kg_por_bolsa, d.declarado_at into v_prev_kg, v_prev_at
      from public.declaraciones_stock d
      where d.point_id = r.point_id and d.producto_id = r.producto_id and d.declarado_at < v_ancla_at
      order by d.declarado_at desc limit 1;

      v_consumo := null;
      if v_prev_at is not null then
        v_consumo := private.consumo_declarado(
          v_prev_kg,
          (select coalesce(sum(e.bolsas), 0) * r.kg_por_bolsa from public.entregas e
           where e.point_id = r.point_id and e.producto_id = r.producto_id
             and e.entregada_at > v_prev_at and e.entregada_at <= v_ancla_at),
          v_ancla_kg,
          extract(epoch from v_ancla_at - v_prev_at) / 86400);
      end if;
      if v_consumo is null then
        select c.kg_dia * r.proporcion into v_consumo from public.consumo_referencia c where c.canal = r.canal;
      end if;
      v_consumido := v_consumo * extract(epoch from now() - v_ancla_at) / 86400;
      v_dato_at := v_ancla_at;
    end if;

    v_saldo := private.saldo_proyectado(v_ancla_kg, v_entregado, v_consumido);
    v_cobertura := private.cobertura_dias(v_saldo, v_consumo);

    insert into public.saldos (point_id, producto_id, organization_id, saldo_kg, consumo_diario_kg,
      cobertura_dias, agotamiento_estimado, fuente, dato_at, calculado_at)
    values (r.point_id, r.producto_id, r.organization_id, v_saldo, round(v_consumo, 3), v_cobertura,
      private.agotamiento_estimado(current_date, v_cobertura), v_fuente, v_dato_at, now())
    on conflict (point_id, producto_id) do update set
      saldo_kg = excluded.saldo_kg, consumo_diario_kg = excluded.consumo_diario_kg,
      cobertura_dias = excluded.cobertura_dias, agotamiento_estimado = excluded.agotamiento_estimado,
      fuente = excluded.fuente, dato_at = excluded.dato_at, calculado_at = excluded.calculado_at;

    v_plazo := private.plazo_entrega(r.zona, par.plazo_rm_dias, par.plazo_regiones_dias);
    v_sev := private.severidad(v_cobertura, v_plazo, par.gestion_dias, par.margen_dias);

    select * into a from public.alertas
    where point_id = r.point_id and producto_id = r.producto_id
      and estado in ('abierta', 'pospuesta', 'critica', 'confirmada')
    for update;

    if found then
      if a.estado = 'confirmada' then
        update public.alertas set cobertura_dias = v_cobertura, dato_at = v_dato_at,
          agotamiento_estimado = private.agotamiento_estimado(current_date, v_cobertura)
        where id = a.id and cobertura_dias is distinct from v_cobertura;
        continue;
      end if;
      if v_sev is null then
        -- La cobertura se recuperó sin pedido (por ejemplo, bajó el consumo).
        update public.alertas set estado = 'resuelta', resuelta_at = now(), cobertura_dias = v_cobertura
        where id = a.id;
        n_resueltas := n_resueltas + 1;
        continue;
      end if;
      v_estado := case when a.estado = 'pospuesta' and a.pospuesta_hasta <= current_date then 'abierta' else a.estado end;
      if private.debe_ser_critica(v_cobertura, par.umbral_critico_dias, v_estado) then
        v_estado := 'critica';
      end if;
      update public.alertas set
        estado = v_estado, severidad = v_sev, cobertura_dias = v_cobertura, fuente = v_fuente, dato_at = v_dato_at,
        agotamiento_estimado = private.agotamiento_estimado(current_date, v_cobertura),
        pospuesta_hasta = case when v_estado = 'pospuesta' then pospuesta_hasta end,
        critica_at = case when v_estado = 'critica' then coalesce(critica_at, now()) end
      where id = a.id
        and (estado, severidad, cobertura_dias, dato_at) is distinct from (v_estado, v_sev, v_cobertura, v_dato_at);
      if v_estado = 'critica' and a.estado <> 'critica' then
        perform private.avisar_alerta(a.id, 'alerta_critica');
        n_criticas := n_criticas + 1;
      end if;
    elsif v_sev is not null then
      v_estado := case when private.debe_ser_critica(v_cobertura, par.umbral_critico_dias, 'abierta')
        then 'critica' else 'abierta' end;
      insert into public.alertas (organization_id, point_id, producto_id, estado, severidad, cobertura_dias,
        agotamiento_estimado, fuente, dato_at, critica_at)
      values (r.organization_id, r.point_id, r.producto_id, v_estado, v_sev, v_cobertura,
        private.agotamiento_estimado(current_date, v_cobertura), v_fuente, v_dato_at,
        case when v_estado = 'critica' then now() end)
      returning id into v_alerta;

      insert into public.pedidos_sugeridos (alerta_id, organization_id, point_id)
      values (v_alerta, r.organization_id, r.point_id)
      returning id into v_sugerido;
      insert into public.lineas_sugeridas (pedido_sugerido_id, organization_id, producto_id, bolsas_sugeridas, bolsas)
      select v_sugerido, r.organization_id, r.producto_id, b, b
      from private.bolsas_sugeridas(v_consumo, v_saldo, r.kg_por_bolsa, v_plazo, par.dias_ciclo, r.bolsas_habituales) as b;

      perform private.avisar_alerta(v_alerta, 'alerta_nueva');
      if v_estado = 'critica' then
        perform private.avisar_alerta(v_alerta, 'alerta_critica');
        n_criticas := n_criticas + 1;
      end if;
      n_nuevas := n_nuevas + 1;
    end if;
  end loop;

  return jsonb_build_object('cafes_evaluados', n_puntos, 'alertas_nuevas', n_nuevas,
    'alertas_criticas', n_criticas, 'alertas_resueltas', n_resueltas);
end $$;

-- 4. Acciones de la app -------------------------------------------------------------------------

-- Ajustar cantidades del pedido sugerido: cliente (su empresa) o vendedor/KAM (su cartera).
-- p_lineas: [{"producto_id": "...", "bolsas": 6}, ...]. No cambia el estado de la alerta.
create function public.ajustar_pedido_sugerido(p_sugerido uuid, p_lineas jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_ps public.pedidos_sugeridos;
  v_alerta public.alertas;
  v_linea jsonb;
  v_bolsas integer;
  v_nombre text;
  v_perfil public.perfil;
  v_user uuid;
begin
  select * into v_ps from public.pedidos_sugeridos where id = p_sugerido for update;
  if not found or not private.puede_ver_org(v_ps.organization_id) then
    raise exception 'no_encontrado' using errcode = 'P0002';
  end if;
  v_perfil := private.mi_perfil();
  if not private.tiene_permiso('pedido_sugerido.ajustar')
     or not (v_ps.organization_id = private.mi_org() or private.en_mi_cartera(v_ps.organization_id)) then
    raise exception 'sin_permiso' using errcode = '42501';
  end if;
  select * into v_alerta from public.alertas where id = v_ps.alerta_id;
  if v_alerta.estado not in ('abierta', 'pospuesta', 'critica') then
    raise exception 'alerta_cerrada' using errcode = 'P0001';
  end if;
  if jsonb_typeof(p_lineas) <> 'array' or jsonb_array_length(p_lineas) = 0 then
    raise exception 'lineas_invalidas' using errcode = 'P0001';
  end if;

  for v_linea in select * from jsonb_array_elements(p_lineas) loop
    v_bolsas := (v_linea ->> 'bolsas')::integer;
    if v_bolsas is null or v_bolsas < 0 or v_bolsas > 99 then
      raise exception 'cantidad_invalida' using errcode = 'P0001';
    end if;
    update public.lineas_sugeridas set bolsas = v_bolsas
    where pedido_sugerido_id = p_sugerido and producto_id = (v_linea ->> 'producto_id')::uuid;
    if not found then
      raise exception 'lineas_invalidas' using errcode = 'P0001';
    end if;
  end loop;

  select nombre into v_nombre from public.profiles where id = (select auth.uid());
  update public.pedidos_sugeridos
  set ajustado_por = (select auth.uid()), ajustado_por_nombre = v_nombre, ajustado_por_perfil = v_perfil, ajustado_at = now()
  where id = p_sugerido;

  -- Si ajusta Marley, el cliente lo ve antes de confirmar.
  if v_perfil in ('vendedor', 'kam') then
    for v_user in select private.personas_cliente(v_ps.organization_id) loop
      perform private.notificar(v_user, v_ps.organization_id, 'pedido_ajustado', v_ps.alerta_id, null, null,
        format('%s ajustó tu pedido sugerido', v_nombre),
        'Revisa las cantidades antes de confirmar.', '/reposicion/' || v_ps.alerta_id, true, true);
    end loop;
  end if;
end $$;

-- Confirmar el pedido sugerido: SOLO el cliente (permiso pedido.confirmar) y solo de su empresa.
-- En un punto sin telemetría exige las bolsas que quedan por café (Modo B); con telemetría no
-- se le pide nada. Devuelve el pedido creado. Nunca crea dos pedidos para una alerta.
create function public.confirmar_pedido(p_sugerido uuid, p_quedan jsonb default null)
returns table (pedido_id uuid, codigo text)
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
declare
  v_ps public.pedidos_sugeridos;
  v_alerta public.alertas;
  v_telemetria boolean;
  v_pedido uuid;
  v_codigo text;
  v_nombre text;
  v_item jsonb;
  v_bolsas numeric;
  v_punto text;
begin
  -- El bloqueo de la fila serializa confirmaciones simultáneas: la segunda espera y luego ve
  -- la alerta confirmada.
  select * into v_ps from public.pedidos_sugeridos where id = p_sugerido for update;
  if not found or not private.puede_ver_org(v_ps.organization_id) then
    raise exception 'no_encontrado' using errcode = 'P0002';
  end if;
  if not private.tiene_permiso('pedido.confirmar') or v_ps.organization_id is distinct from private.mi_org() then
    raise exception 'sin_permiso' using errcode = '42501';
  end if;
  select * into v_alerta from public.alertas where id = v_ps.alerta_id;
  if v_alerta.estado in ('confirmada', 'resuelta') then
    raise exception 'pedido_ya_confirmado' using errcode = 'P0001';
  end if;
  if not exists (select 1 from public.lineas_sugeridas where pedido_sugerido_id = p_sugerido and bolsas > 0) then
    raise exception 'pedido_vacio' using errcode = 'P0001';
  end if;

  select telemetria_disponible, nombre into v_telemetria, v_punto from public.points where id = v_ps.point_id;
  select nombre into v_nombre from public.profiles where id = (select auth.uid());

  begin
    insert into public.pedidos (alerta_id, pedido_sugerido_id, organization_id, point_id,
      confirmado_por, confirmado_por_nombre)
    values (v_ps.alerta_id, p_sugerido, v_ps.organization_id, v_ps.point_id, (select auth.uid()), v_nombre)
    returning id, pedidos.codigo into v_pedido, v_codigo;
  exception when unique_violation then
    raise exception 'pedido_ya_confirmado' using errcode = 'P0001';
  end;

  if not v_telemetria then
    -- Modo B: una declaración por cada café del pedido.
    if p_quedan is null or jsonb_typeof(p_quedan) <> 'array' then
      raise exception 'faltan_bolsas_restantes' using errcode = 'P0001';
    end if;
    if exists (
      select 1 from public.lineas_sugeridas l
      where l.pedido_sugerido_id = p_sugerido
        and not exists (select 1 from jsonb_array_elements(p_quedan) q where (q ->> 'producto_id')::uuid = l.producto_id)
    ) then
      raise exception 'faltan_bolsas_restantes' using errcode = 'P0001';
    end if;
    for v_item in select * from jsonb_array_elements(p_quedan) loop
      v_bolsas := (v_item ->> 'bolsas')::numeric;
      if v_bolsas is null or v_bolsas < 0 or v_bolsas > 999 then
        raise exception 'cantidad_invalida' using errcode = 'P0001';
      end if;
      insert into public.declaraciones_stock (organization_id, point_id, producto_id, bolsas, declarado_por, pedido_id)
      select v_ps.organization_id, v_ps.point_id, l.producto_id, v_bolsas, (select auth.uid()), v_pedido
      from public.lineas_sugeridas l
      where l.pedido_sugerido_id = p_sugerido and l.producto_id = (v_item ->> 'producto_id')::uuid;
    end loop;
  end if;

  insert into public.lineas_pedido (pedido_id, organization_id, producto_id, bolsas)
  select v_pedido, v_ps.organization_id, producto_id, bolsas
  from public.lineas_sugeridas where pedido_sugerido_id = p_sugerido and bolsas > 0;

  insert into public.historial_pedido (pedido_id, organization_id, estado) values (v_pedido, v_ps.organization_id, 'recibido');

  update public.alertas set estado = 'confirmada', confirmada_at = now(), pospuesta_hasta = null
  where id = v_ps.alerta_id;

  perform private.notificar(private.ejecutivo_de(v_ps.organization_id), v_ps.organization_id, 'pedido_confirmado',
    v_ps.alerta_id, v_pedido, null, format('%s confirmó el pedido %s', v_nombre, v_codigo), v_punto, '/hoy', false);

  -- Modo B: la declaración recién hecha es el dato más fresco del punto; el saldo se actualiza ya.
  if not v_telemetria then
    perform private.recalcular_reposicion(v_ps.point_id);
  end if;

  return query select v_pedido, v_codigo;
end $$;

-- Posponer: el cliente decide esperar unos días. Si la cobertura cae bajo el umbral, igual pasa a crítica.
create function public.posponer_alerta(p_alerta uuid, p_dias integer default 2) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_alerta public.alertas;
begin
  select * into v_alerta from public.alertas where id = p_alerta for update;
  if not found or not private.puede_ver_org(v_alerta.organization_id) then
    raise exception 'no_encontrado' using errcode = 'P0002';
  end if;
  if not private.tiene_permiso('pedido.posponer') or v_alerta.organization_id is distinct from private.mi_org() then
    raise exception 'sin_permiso' using errcode = '42501';
  end if;
  if v_alerta.estado not in ('abierta', 'critica', 'pospuesta') then
    raise exception 'alerta_cerrada' using errcode = 'P0001';
  end if;
  if p_dias is null or p_dias not between 1 and 7 then
    raise exception 'cantidad_invalida' using errcode = 'P0001';
  end if;
  update public.alertas set estado = 'pospuesta', pospuesta_hasta = current_date + p_dias where id = p_alerta;
end $$;

-- Gestión del vendedor o KAM sobre una alerta de su cartera: contacto por WhatsApp o nota interna.
create function public.registrar_gestion(p_alerta uuid, p_tipo text, p_nota text default null) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_alerta public.alertas;
begin
  select * into v_alerta from public.alertas where id = p_alerta;
  if not found or not private.puede_ver_org(v_alerta.organization_id) then
    raise exception 'no_encontrado' using errcode = 'P0002';
  end if;
  if not private.en_mi_cartera(v_alerta.organization_id) then
    raise exception 'sin_permiso' using errcode = '42501';
  end if;
  if p_tipo not in ('whatsapp', 'nota') or (p_tipo = 'nota' and coalesce(length(trim(p_nota)), 0) = 0) then
    raise exception 'nota_invalida' using errcode = 'P0001';
  end if;
  insert into public.alerta_gestiones (alerta_id, organization_id, autor_id, tipo, nota)
  values (p_alerta, v_alerta.organization_id, (select auth.uid()), p_tipo, nullif(left(trim(p_nota), 500), ''));
end $$;

-- Marcar avisos como leídos (todos, o los indicados). Solo los propios.
create function public.marcar_notificaciones_leidas(p_ids uuid[] default null) returns integer
language plpgsql security definer set search_path = '' as $$
declare n integer;
begin
  if private.mi_perfil() is null then
    raise exception 'sin_permiso' using errcode = '42501';
  end if;
  update public.notificaciones set leida_at = now()
  where user_id = (select auth.uid()) and leida_at is null and (p_ids is null or id = any (p_ids));
  get diagnostics n = row_count;
  return n;
end $$;

-- 5. Comandos internos (solo service_role; no están en la interfaz) ------------------------------

-- Recalcular a pedido (demo) o desde pg_cron.
create function public.recalcular_reposicion() returns jsonb
language sql security definer set search_path = '' as $$
  select private.recalcular_reposicion(null)
$$;

-- Avanza un pedido al estado siguiente (o al indicado). Al entregarse, registra la entrega
-- (el saldo sube), resuelve la alerta y recalcula el punto. En producción el estado llega del ERP.
create function public.avanzar_pedido(p_codigo text, p_estado public.estado_pedido default null)
returns public.estado_pedido
language plpgsql security definer set search_path = '' as $$
declare
  v_p public.pedidos;
  v_nuevo public.estado_pedido;
  v_user uuid;
  v_texto text;
begin
  select * into v_p from public.pedidos where codigo = upper(trim(p_codigo)) for update;
  if not found then
    raise exception 'no_encontrado' using errcode = 'P0002';
  end if;
  v_nuevo := coalesce(p_estado, case v_p.estado
    when 'recibido' then 'en_preparacion'
    when 'en_preparacion' then 'en_reparto'
    when 'en_reparto' then 'entregado'
    else null end::public.estado_pedido);
  if v_nuevo is null or v_nuevo <= v_p.estado then
    raise exception 'estado_invalido' using errcode = 'P0001', detail = format('El pedido ya está %s', v_p.estado);
  end if;

  update public.pedidos set estado = v_nuevo where id = v_p.id;
  insert into public.historial_pedido (pedido_id, organization_id, estado)
  select v_p.id, v_p.organization_id, e
  from unnest(enum_range(v_p.estado, v_nuevo)) as e
  where e > v_p.estado
  on conflict do nothing;

  v_texto := case v_nuevo
    when 'en_preparacion' then 'está en preparación'
    when 'en_reparto' then 'va en camino'
    when 'entregado' then 'fue entregado' end;
  for v_user in select private.personas_cliente(v_p.organization_id) loop
    perform private.notificar(v_user, v_p.organization_id, 'pedido_estado', v_p.alerta_id, v_p.id, v_nuevo::text,
      format('Tu pedido %s %s', v_p.codigo, v_texto),
      (select nombre from public.points where id = v_p.point_id), '/pedidos/' || v_p.id, false);
  end loop;

  if v_nuevo = 'entregado' then
    insert into public.entregas (organization_id, point_id, producto_id, bolsas, pedido_id)
    select v_p.organization_id, v_p.point_id, producto_id, bolsas, v_p.id
    from public.lineas_pedido where pedido_id = v_p.id;
    update public.alertas set estado = 'resuelta', resuelta_at = now() where id = v_p.alerta_id;
    perform private.recalcular_reposicion(v_p.point_id);
  end if;
  return v_nuevo;
end $$;

-- Resumen de correo: avisos pendientes agrupados por persona, respetando el límite diario.
-- Un correo por persona por corrida, con todos sus avisos pendientes de las últimas 24 horas.
create function public.resumenes_correo_pendientes(p_limite_diario integer default 90)
returns table (user_id uuid, email text, nombre text, avisos jsonb)
language sql security definer set search_path = '' as $$
  with cupo as (
    select greatest(0, p_limite_diario - (
      select count(*) from public.envios_correo
      where modo = 'real' and enviado_at >= date_trunc('day', now())
    ))::integer as restante
  )
  select n.user_id, p.email, p.nombre,
         jsonb_agg(jsonb_build_object('id', n.id, 'titulo', n.titulo, 'cuerpo', n.cuerpo, 'enlace', n.enlace)
                   order by n.creada_at) as avisos
  from public.notificaciones n
  join public.profiles p on p.id = n.user_id
  join public.memberships m on m.user_id = n.user_id and m.estado = 'activa'
  where n.por_correo and n.correo_enviado_at is null and n.leida_at is null
    and n.creada_at > now() - interval '24 hours'
  group by n.user_id, p.email, p.nombre
  order by min(n.creada_at)
  limit (select restante from cupo)
$$;

create function public.registrar_envio_correo(p_user uuid, p_email text, p_ids uuid[], p_modo text, p_proveedor_id text)
returns void language sql security definer set search_path = '' as $$
  update public.notificaciones set correo_enviado_at = now() where id = any (p_ids) and user_id = p_user;
  insert into public.envios_correo (user_id, email, avisos, modo, proveedor_id)
  values (p_user, p_email, cardinality(p_ids), p_modo, p_proveedor_id);
$$;

-- Permisos de ejecución ------------------------------------------------------------------------
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.mi_sesion() to authenticated;
grant execute on function public.mi_ejecutivo() to authenticated;
grant execute on function public.activar_empresa(text) to authenticated;
grant execute on function public.crear_invitacion(uuid, text, text, public.perfil) to authenticated;
grant execute on function public.aceptar_invitacion() to authenticated;
grant execute on function public.cambiar_estado_miembro(uuid, boolean) to authenticated;
grant execute on function public.revocar_invitacion(uuid) to authenticated;
grant execute on function public.ajustar_pedido_sugerido(uuid, jsonb) to authenticated;
grant execute on function public.confirmar_pedido(uuid, jsonb) to authenticated;
grant execute on function public.posponer_alerta(uuid, integer) to authenticated;
grant execute on function public.registrar_gestion(uuid, text, text) to authenticated;
grant execute on function public.marcar_notificaciones_leidas(uuid[]) to authenticated;
-- Comandos internos: solo el servidor.
grant execute on function public.recalcular_reposicion() to service_role;
grant execute on function public.avanzar_pedido(text, public.estado_pedido) to service_role;
grant execute on function public.resumenes_correo_pendientes(integer) to service_role;
grant execute on function public.registrar_envio_correo(uuid, text, uuid[], text, text) to service_role;
-- Las funciones privadas nuevas no tienen grant a authenticated (privilegios por omisión de la
-- Fase 1): solo las usan las funciones security definer.
