-- Marley Conecta · Fase 1 · Esquema base
-- Organizaciones, cuentas, cartera (CRM simulado), invitaciones, puntos y máquinas.
-- Las reglas de acceso viven en las migraciones siguientes; aquí solo estructura e integridad.

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

-- Nada nuevo en public queda expuesto por omisión: cada permiso se concede explícitamente.
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;
alter default privileges in schema private revoke execute on functions from public, anon, authenticated;

create type public.tipo_organizacion as enum ('marley', 'cliente', 'partner');
create type public.perfil as enum (
  'gerencia', 'vendedor', 'kam', 'cliente_admin', 'cliente_integrante', 'partner'
);
create type public.estado_membresia as enum ('invitada', 'activa', 'desactivada');
create type public.estado_invitacion as enum ('pendiente', 'aceptada', 'revocada');
create type public.canal as enum ('horeca', 'ocs', 'conveniencia', 'panaderia');
create type public.estado_empresa_crm as enum ('activa', 'suspendida');

-- Datos personales. Una fila por cuenta de Supabase Auth.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null check (length(trim(nombre)) between 1 and 120),
  email text not null check (email = lower(email)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- CRM simulado: la empresa existe aquí, con su RUT y su vendedor o KAM asignado, antes de
-- activarse en la app. Canal, segmento y estado son datos comerciales internos: el cliente no los ve.
-- En producción esta tabla la alimenta el conector del CRM; la app nunca la edita.
create table public.crm_empresas (
  rut text primary key check (rut ~ '^[0-9]{7,8}-[0-9Kk]$'),
  razon_social text not null,
  asignado_a uuid references public.profiles (id) on delete set null,
  canal public.canal not null,
  segmento text,
  estado public.estado_empresa_crm not null default 'activa',
  updated_at timestamptz not null default now()
);
create index crm_empresas_asignado_idx on public.crm_empresas (asignado_a);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  tipo public.tipo_organizacion not null,
  rut text unique references public.crm_empresas (rut),
  razon_social text not null,
  nombre_comercial text not null check (length(trim(nombre_comercial)) between 1 and 120),
  contacto_nombre text,
  contacto_email text check (contacto_email is null or contacto_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  contacto_telefono text,
  activada_por uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Solo las empresas cliente se cruzan con el CRM por RUT.
  constraint organizations_rut_cliente check ((tipo = 'cliente') = (rut is not null))
);
-- Marley es una sola organización.
create unique index organizations_una_marley on public.organizations (tipo) where tipo = 'marley';

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  email text not null check (email = lower(email) and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  nombre text not null check (length(trim(nombre)) between 1 and 120),
  perfil public.perfil not null,
  estado public.estado_invitacion not null default 'pendiente',
  invitado_por uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days',
  aceptada_at timestamptz
);
create index invitations_org_idx on public.invitations (organization_id);
create unique index invitations_una_pendiente_por_email on public.invitations (email) where estado = 'pendiente';

-- Membresía: user_id es la clave primaria, así cada cuenta tiene un único perfil y una única organización.
create table public.memberships (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete restrict,
  perfil public.perfil not null,
  estado public.estado_membresia not null default 'invitada',
  invitacion_id uuid references public.invitations (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index memberships_org_idx on public.memberships (organization_id);

-- Punto o sucursal. La fuente de consumo (telemetría o Modo B) se decide por punto.
create table public.points (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  partner_org_id uuid references public.organizations (id) on delete set null,
  nombre text not null check (length(trim(nombre)) between 1 and 120),
  canal public.canal not null,
  telemetria_disponible boolean not null default false,
  direccion text,
  horario text,
  contacto_recepcion text,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index points_org_idx on public.points (organization_id);
create index points_partner_idx on public.points (partner_org_id);

create table public.machines (
  id uuid primary key default gen_random_uuid(),
  point_id uuid not null references public.points (id) on delete restrict,
  modelo text not null check (length(trim(modelo)) between 1 and 120),
  numero_serie text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index machines_point_idx on public.machines (point_id);

-- Catálogo de permisos por perfil. Las políticas consultan este catálogo, no listas de perfiles
-- repartidas por el código. Incluye ya los permisos del flujo de reposición (Fase 3).
create table public.role_permissions (
  perfil public.perfil not null,
  permiso text not null,
  primary key (perfil, permiso)
);

insert into public.role_permissions (perfil, permiso) values
  ('gerencia', 'empresas.activar'),
  ('gerencia', 'empresa.editar'),
  ('gerencia', 'puntos.gestionar'),
  ('gerencia', 'puntos.editar'),
  ('gerencia', 'maquinas.editar'),
  ('gerencia', 'equipo_comercial.gestionar'),
  ('gerencia', 'clientes.invitar_admin'),
  ('gerencia', 'auditoria.ver'),
  ('vendedor', 'empresas.activar'),
  ('vendedor', 'empresa.editar'),
  ('vendedor', 'puntos.gestionar'),
  ('vendedor', 'puntos.editar'),
  ('vendedor', 'clientes.invitar_admin'),
  ('vendedor', 'pedido_sugerido.ajustar'),
  ('kam', 'empresas.activar'),
  ('kam', 'empresa.editar'),
  ('kam', 'puntos.gestionar'),
  ('kam', 'puntos.editar'),
  ('kam', 'maquinas.editar'),
  ('kam', 'clientes.invitar_admin'),
  ('kam', 'pedido_sugerido.ajustar'),
  ('cliente_admin', 'equipo.gestionar'),
  ('cliente_admin', 'empresa.editar'),
  ('cliente_admin', 'puntos.editar'),
  ('cliente_admin', 'pedido_sugerido.ajustar'),
  ('cliente_admin', 'pedido.confirmar'),
  ('cliente_admin', 'pedido.posponer'),
  ('cliente_integrante', 'pedido_sugerido.ajustar'),
  ('cliente_integrante', 'pedido.confirmar'),
  ('cliente_integrante', 'pedido.posponer'),
  ('partner', 'reportes.subir');

-- La organización Marley existe desde el inicio; el resto se crea al activar empresas.
insert into public.organizations (tipo, razon_social, nombre_comercial)
values ('marley', 'Marley Coffee', 'Marley Coffee');

-- updated_at
create function private.marcar_actualizacion() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger profiles_updated before update on public.profiles
  for each row execute function private.marcar_actualizacion();
create trigger crm_empresas_updated before update on public.crm_empresas
  for each row execute function private.marcar_actualizacion();
create trigger organizations_updated before update on public.organizations
  for each row execute function private.marcar_actualizacion();
create trigger memberships_updated before update on public.memberships
  for each row execute function private.marcar_actualizacion();
create trigger points_updated before update on public.points
  for each row execute function private.marcar_actualizacion();
create trigger machines_updated before update on public.machines
  for each row execute function private.marcar_actualizacion();

-- Las validaciones de integridad son security definer: no dependen de lo que ve quien escribe
-- (eso lo decide RLS), solo de los datos reales.

-- Integridad: el perfil calza con el tipo de organización.
create function private.validar_membresia() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_tipo public.tipo_organizacion;
begin
  select tipo into v_tipo from public.organizations where id = new.organization_id;
  if not (
    (new.perfil in ('gerencia', 'vendedor', 'kam') and v_tipo = 'marley')
    or (new.perfil in ('cliente_admin', 'cliente_integrante') and v_tipo = 'cliente')
    or (new.perfil = 'partner' and v_tipo = 'partner')
  ) then
    raise exception 'perfil_incompatible' using errcode = '23514',
      detail = format('El perfil %s no corresponde a una organización %s', new.perfil, v_tipo);
  end if;
  return new;
end $$;

create trigger memberships_validar before insert or update of perfil, organization_id on public.memberships
  for each row execute function private.validar_membresia();

-- Integridad: la cartera solo se asigna a vendedores o KAM.
create function private.validar_asignacion_crm() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.asignado_a is not null and not exists (
    select 1 from public.memberships m
    where m.user_id = new.asignado_a and m.perfil in ('vendedor', 'kam')
  ) then
    raise exception 'asignacion_invalida' using errcode = '23514',
      detail = 'La cartera solo se asigna a vendedores o KAM';
  end if;
  return new;
end $$;

create trigger crm_empresas_validar before insert or update of asignado_a on public.crm_empresas
  for each row execute function private.validar_asignacion_crm();

-- Integridad: un punto pertenece a una empresa cliente y, si tiene partner, es una organización partner.
create function private.validar_punto() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.organizations where id = new.organization_id and tipo = 'cliente') then
    raise exception 'organizacion_invalida' using errcode = '23514';
  end if;
  if new.partner_org_id is not null and not exists (
    select 1 from public.organizations where id = new.partner_org_id and tipo = 'partner'
  ) then
    raise exception 'partner_invalido' using errcode = '23514';
  end if;
  return new;
end $$;

create trigger points_validar before insert or update of organization_id, partner_org_id on public.points
  for each row execute function private.validar_punto();
