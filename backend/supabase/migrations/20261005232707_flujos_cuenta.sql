-- Marley Conecta · Fase 1 · Flujos de cuenta
-- Activar empresa cliente, invitar, aceptar invitación y activar o desactivar personas.
-- Son las únicas vías para crear organizaciones, membresías e invitaciones. Cada función
-- comprueba en el servidor el perfil, la organización y la cartera de quien la llama.
-- Errores: 'sin_permiso' (42501), 'no_encontrado' (P0002) y códigos de negocio (P0001).
-- Un registro fuera del alcance de quien consulta responde 'no_encontrado', igual que uno
-- inexistente, para no revelar qué existe.

-- Datos de la sesión actual, incluso si la membresía no está activa (para mostrar el motivo).
create function public.mi_sesion()
returns table (
  user_id uuid, nombre text, email text, perfil public.perfil, estado public.estado_membresia,
  organization_id uuid, organizacion_tipo public.tipo_organizacion, organizacion_nombre text,
  permisos text[]
)
language sql stable security definer set search_path = '' as $$
  select p.id, p.nombre, p.email, m.perfil, m.estado, o.id, o.tipo, o.nombre_comercial,
    case when m.estado = 'activa' then
      array(select rp.permiso from public.role_permissions rp where rp.perfil = m.perfil order by 1)
    else '{}'::text[] end
  from public.profiles p
  join public.memberships m on m.user_id = p.id
  join public.organizations o on o.id = m.organization_id
  where p.id = (select auth.uid())
$$;

-- El cliente ve quién es su vendedor o KAM, sin acceder a la cartera del CRM.
create function public.mi_ejecutivo()
returns table (nombre text, email text, perfil public.perfil)
language sql stable security definer set search_path = '' as $$
  select p.nombre, p.email, m.perfil
  from public.organizations o
  join public.crm_empresas c on c.rut = o.rut
  join public.profiles p on p.id = c.asignado_a
  join public.memberships m on m.user_id = p.id and m.estado = 'activa'
  where o.id = private.mi_org()
    and private.mi_perfil() in ('cliente_admin', 'cliente_integrante')
$$;

-- Paso 2 de la creación de empresas: vendedor, KAM o gerencia activa en la app una empresa
-- que ya existe en el CRM. Crea su organización.
create function public.activar_empresa(p_rut text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_crm public.crm_empresas;
  v_org uuid;
begin
  if not private.tiene_permiso('empresas.activar') then
    raise exception 'sin_permiso' using errcode = '42501';
  end if;

  select * into v_crm from public.crm_empresas where rut = upper(trim(p_rut));
  if not found or not (private.es_gerencia() or v_crm.asignado_a = (select auth.uid())) then
    raise exception 'no_encontrado' using errcode = 'P0002';
  end if;
  if v_crm.estado <> 'activa' then
    raise exception 'empresa_suspendida' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.organizations where rut = v_crm.rut) then
    raise exception 'empresa_ya_activada' using errcode = 'P0001';
  end if;

  insert into public.organizations (tipo, rut, razon_social, nombre_comercial, activada_por)
  values ('cliente', v_crm.rut, v_crm.razon_social, v_crm.razon_social, (select auth.uid()))
  returning id into v_org;
  return v_org;
end $$;

-- Quién puede invitar a quién:
--   cliente_admin      → gerencia o el vendedor/KAM de la cartera (paso 3), o un administrador de la misma empresa
--   cliente_integrante → solo un administrador de la misma empresa (Mi equipo)
--   vendedor, kam, gerencia → solo gerencia (Equipo comercial), en la organización Marley
--   partner            → solo gerencia, en una organización partner
create function private.puede_invitar(p_org uuid, p_perfil public.perfil) returns boolean
language plpgsql stable security definer set search_path = '' as $$
declare
  v_tipo public.tipo_organizacion;
begin
  select tipo into v_tipo from public.organizations where id = p_org;
  return case p_perfil
    when 'cliente_admin' then v_tipo = 'cliente' and (
      (private.tiene_permiso('clientes.invitar_admin') and private.atiende_org(p_org))
      or (private.tiene_permiso('equipo.gestionar') and p_org = private.mi_org()))
    when 'cliente_integrante' then v_tipo = 'cliente'
      and private.tiene_permiso('equipo.gestionar') and p_org = private.mi_org()
    when 'partner' then v_tipo = 'partner' and private.es_gerencia()
    else v_tipo = 'marley' and private.tiene_permiso('equipo_comercial.gestionar')
  end;
end $$;

-- Registra la invitación. El correo lo envía la Edge Function invite-user con la API de
-- administración de Auth (la clave de servicio nunca sale del servidor).
-- reemplazar_usuario: cuenta invitada que nunca entró y debe recrearse para reenviar el enlace.
create function public.crear_invitacion(
  p_org uuid, p_email text, p_nombre text, p_perfil public.perfil
)
returns table (invitacion_id uuid, reemplazar_usuario uuid)
language plpgsql security definer set search_path = '' as $$
declare
  v_email text := lower(trim(p_email));
  v_usuario record;
  v_reemplazar uuid;
  v_id uuid;
begin
  if not private.puede_ver_org(p_org) then
    raise exception 'no_encontrado' using errcode = 'P0002';
  end if;
  if not private.puede_invitar(p_org, p_perfil) then
    raise exception 'sin_permiso' using errcode = '42501';
  end if;
  if v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'email_invalido' using errcode = 'P0001';
  end if;
  if length(trim(coalesce(p_nombre, ''))) = 0 then
    raise exception 'nombre_requerido' using errcode = 'P0001';
  end if;

  -- Un único perfil por cuenta: un correo que ya tiene cuenta no se puede invitar a otro perfil.
  select u.id, u.last_sign_in_at, m.estado, m.organization_id, m.perfil into v_usuario
  from auth.users u left join public.memberships m on m.user_id = u.id
  where lower(u.email) = v_email;
  if found then
    if v_usuario.estado = 'invitada' and v_usuario.last_sign_in_at is null
       and v_usuario.organization_id = p_org and v_usuario.perfil = p_perfil then
      v_reemplazar := v_usuario.id;
    else
      raise exception 'cuenta_existente' using errcode = 'P0001';
    end if;
  end if;

  -- Una invitación pendiente al mismo correo se reemplaza si es de esta organización y perfil.
  if exists (
    select 1 from public.invitations
    where email = v_email and estado = 'pendiente'
      and not (organization_id = p_org and perfil = p_perfil)
  ) then
    raise exception 'invitacion_pendiente_en_otra_organizacion' using errcode = 'P0001';
  end if;
  update public.invitations set estado = 'revocada'
  where email = v_email and estado = 'pendiente';

  insert into public.invitations (organization_id, email, nombre, perfil, invitado_por)
  values (p_org, v_email, trim(p_nombre), p_perfil, (select auth.uid()))
  returning id into v_id;

  return query select v_id, v_reemplazar;
end $$;

-- Al crearse la cuenta en Auth por invitación, se crean su perfil y su membresía (aún 'invitada').
-- El registro público está desactivado: las cuentas solo nacen desde la API de administración.
create function private.crear_cuenta_invitada() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_inv public.invitations;
  v_id text := new.raw_user_meta_data ->> 'invitation_id';
begin
  if v_id is null or v_id !~ '^[0-9a-f-]{36}$' then
    return new;
  end if;
  select * into v_inv from public.invitations
  where id = v_id::uuid and estado = 'pendiente' and email = lower(new.email) and expires_at > now();
  if not found then
    return new;
  end if;

  insert into public.profiles (id, nombre, email) values (new.id, v_inv.nombre, lower(new.email));
  insert into public.memberships (user_id, organization_id, perfil, estado, invitacion_id)
  values (new.id, v_inv.organization_id, v_inv.perfil, 'invitada', v_inv.id);
  return new;
end $$;

create trigger crear_cuenta_invitada after insert on auth.users
  for each row execute function private.crear_cuenta_invitada();

-- Paso final de la activación: la persona ya definió su contraseña y acepta la invitación.
create function public.aceptar_invitacion() returns public.perfil
language plpgsql security definer set search_path = '' as $$
declare
  v_m public.memberships;
  v_inv public.invitations;
begin
  select * into v_m from public.memberships where user_id = (select auth.uid());
  if not found then
    raise exception 'no_encontrado' using errcode = 'P0002';
  end if;
  if v_m.estado = 'activa' then
    return v_m.perfil;
  end if;
  if v_m.estado <> 'invitada' then
    raise exception 'cuenta_desactivada' using errcode = 'P0001';
  end if;

  select * into v_inv from public.invitations where id = v_m.invitacion_id;
  if not found or v_inv.estado <> 'pendiente' then
    raise exception 'invitacion_revocada' using errcode = 'P0001';
  end if;
  if v_inv.expires_at <= now() then
    raise exception 'invitacion_vencida' using errcode = 'P0001';
  end if;
  if not exists (
    select 1 from auth.users
    where id = (select auth.uid()) and coalesce(encrypted_password, '') <> ''
  ) then
    raise exception 'falta_contrasena' using errcode = 'P0001';
  end if;

  update public.invitations set estado = 'aceptada', aceptada_at = now() where id = v_inv.id;
  update public.memberships set estado = 'activa' where user_id = v_m.user_id;
  return v_m.perfil;
end $$;

-- Activar o desactivar a una persona:
--   el administrador de una empresa, a las personas de su empresa (Mi equipo);
--   gerencia, al equipo comercial y a partners (Equipo comercial).
-- Nadie se desactiva a sí mismo. Desactivar una invitación pendiente la revoca.
create function public.cambiar_estado_miembro(p_user uuid, p_activo boolean) returns public.estado_membresia
language plpgsql security definer set search_path = '' as $$
declare
  v_m public.memberships;
  v_nuevo public.estado_membresia;
begin
  select * into v_m from public.memberships where user_id = p_user;
  if not found or not private.puede_ver_persona(p_user) then
    raise exception 'no_encontrado' using errcode = 'P0002';
  end if;
  if p_user = (select auth.uid()) then
    raise exception 'no_puede_cambiarse_a_si_mismo' using errcode = 'P0001';
  end if;
  if not (
    (v_m.perfil in ('cliente_admin', 'cliente_integrante')
      and private.tiene_permiso('equipo.gestionar') and v_m.organization_id = private.mi_org())
    or (v_m.perfil in ('gerencia', 'vendedor', 'kam', 'partner')
      and private.tiene_permiso('equipo_comercial.gestionar'))
  ) then
    raise exception 'sin_permiso' using errcode = '42501';
  end if;

  if p_activo then
    if v_m.estado = 'activa' then return v_m.estado; end if;
    -- Solo se reactiva a quien ya había activado su cuenta; una invitación revocada se reenvía.
    if v_m.estado = 'invitada' or exists (
      select 1 from public.invitations i where i.id = v_m.invitacion_id and i.estado <> 'aceptada'
    ) then
      raise exception 'requiere_nueva_invitacion' using errcode = 'P0001';
    end if;
    v_nuevo := 'activa';
  else
    if v_m.estado = 'desactivada' then return v_m.estado; end if;
    update public.invitations set estado = 'revocada'
    where id = v_m.invitacion_id and estado = 'pendiente';
    v_nuevo := 'desactivada';
  end if;

  update public.memberships set estado = v_nuevo where user_id = p_user;
  return v_nuevo;
end $$;

-- Revocar una invitación pendiente (por id de invitación).
create function public.revocar_invitacion(p_invitacion uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_inv public.invitations;
begin
  select * into v_inv from public.invitations where id = p_invitacion;
  if not found or not private.puede_ver_org(v_inv.organization_id) then
    raise exception 'no_encontrado' using errcode = 'P0002';
  end if;
  if not private.puede_invitar(v_inv.organization_id, v_inv.perfil) then
    raise exception 'sin_permiso' using errcode = '42501';
  end if;
  if v_inv.estado <> 'pendiente' then
    raise exception 'invitacion_no_pendiente' using errcode = 'P0001';
  end if;
  update public.invitations set estado = 'revocada' where id = p_invitacion;
  update public.memberships set estado = 'desactivada'
  where invitacion_id = p_invitacion and estado = 'invitada';
end $$;

-- Arranque: registra a la primera persona de gerencia. Solo se ejecuta desde el editor SQL o un
-- script con la clave de servicio, sobre una cuenta ya creada en Auth (Authentication → Add user).
create function public.registrar_gerencia_inicial(p_email text, p_nombre text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid;
  v_marley uuid;
begin
  select id into v_user from auth.users where lower(email) = lower(trim(p_email));
  if not found then
    raise exception 'La cuenta % no existe en Auth', p_email;
  end if;
  select id into v_marley from public.organizations where tipo = 'marley';
  insert into public.profiles (id, nombre, email) values (v_user, trim(p_nombre), lower(trim(p_email)))
  on conflict (id) do update set nombre = excluded.nombre;
  insert into public.memberships (user_id, organization_id, perfil, estado)
  values (v_user, v_marley, 'gerencia', 'activa')
  on conflict (user_id) do nothing;
  return v_user;
end $$;

revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.mi_sesion() to authenticated;
grant execute on function public.mi_ejecutivo() to authenticated;
grant execute on function public.activar_empresa(text) to authenticated;
grant execute on function public.crear_invitacion(uuid, text, text, public.perfil) to authenticated;
grant execute on function public.aceptar_invitacion() to authenticated;
grant execute on function public.cambiar_estado_miembro(uuid, boolean) to authenticated;
grant execute on function public.revocar_invitacion(uuid) to authenticated;
-- registrar_gerencia_inicial: sin grant a authenticated; solo service_role y postgres.
grant execute on function public.registrar_gerencia_inicial(text, text) to service_role;
grant execute on function private.puede_invitar(uuid, public.perfil) to authenticated, service_role;
