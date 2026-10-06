-- Marley Conecta · Fase 1 · Permisos de tabla y Row Level Security
-- Dos barreras, ambas en el servidor:
--   1. GRANT por columna: qué columnas puede escribir una sesión autenticada (nunca perfil,
--      organización, RUT ni razón social).
--   2. RLS por fila: qué registros ve o modifica cada perfil. Un ID ajeno en la URL o en la
--      consulta no devuelve nada o falla.
-- anon no tiene acceso a ninguna tabla. Altas de organizaciones, membresías e invitaciones
-- solo ocurren por las funciones de flujos de cuenta (migración 500), nunca por escritura directa.

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

alter table public.profiles enable row level security;
alter table public.crm_empresas enable row level security;
alter table public.organizations enable row level security;
alter table public.invitations enable row level security;
alter table public.memberships enable row level security;
alter table public.points enable row level security;
alter table public.machines enable row level security;
alter table public.role_permissions enable row level security;

-- Perfiles ---------------------------------------------------------------------------------
grant select on public.profiles to authenticated;
grant update (nombre) on public.profiles to authenticated;

create policy profiles_ver on public.profiles for select to authenticated
  using (private.puede_ver_persona(id));
-- Cada persona edita solo sus propios datos: nadie edita ni suplanta a otro.
create policy profiles_editar_propio on public.profiles for update to authenticated
  using (id = (select auth.uid()) and private.mi_perfil() is not null)
  with check (id = (select auth.uid()));

-- CRM simulado (cartera) -------------------------------------------------------------------
-- Solo personal de Marley. El cliente nunca ve canal, segmento ni estado comercial.
grant select on public.crm_empresas to authenticated;

create policy crm_ver on public.crm_empresas for select to authenticated
  using (private.es_gerencia() or (private.es_comercial() and asignado_a = (select auth.uid())));

-- Organizaciones ---------------------------------------------------------------------------
grant select on public.organizations to authenticated;
grant update (nombre_comercial, contacto_nombre, contacto_email, contacto_telefono)
  on public.organizations to authenticated;

create policy organizations_ver on public.organizations for select to authenticated
  using (private.puede_ver_org(id));
create policy organizations_editar on public.organizations for update to authenticated
  using (
    tipo = 'cliente'
    and private.tiene_permiso('empresa.editar')
    and (private.atiende_org(id) or id = private.mi_org())
  )
  with check (
    tipo = 'cliente'
    and private.tiene_permiso('empresa.editar')
    and (private.atiende_org(id) or id = private.mi_org())
  );

-- Membresías -------------------------------------------------------------------------------
grant select on public.memberships to authenticated;

create policy memberships_ver on public.memberships for select to authenticated
  using (private.puede_ver_persona(user_id));

-- Invitaciones -----------------------------------------------------------------------------
grant select on public.invitations to authenticated;

create policy invitations_ver on public.invitations for select to authenticated
  using (
    private.es_gerencia()
    or private.en_mi_cartera(organization_id)
    or (
      organization_id = private.mi_org()
      and private.mi_perfil() in ('cliente_admin', 'cliente_integrante', 'partner')
    )
  );

-- Puntos -----------------------------------------------------------------------------------
grant select on public.points to authenticated;
grant insert (organization_id, partner_org_id, nombre, canal, telemetria_disponible,
              direccion, horario, contacto_recepcion)
  on public.points to authenticated;
grant update (partner_org_id, nombre, canal, telemetria_disponible, direccion, horario,
              contacto_recepcion, activo)
  on public.points to authenticated;

create policy points_ver on public.points for select to authenticated
  using (
    private.puede_ver_org(organization_id)
    -- El partner ve solo los puntos que atiende, nunca el resto de la empresa cliente.
    or (private.mi_perfil() = 'partner' and partner_org_id = private.mi_org())
  );
-- Agregar un punto: solo Marley (el cliente puede solicitarlo).
create policy points_agregar on public.points for insert to authenticated
  with check (private.tiene_permiso('puntos.gestionar') and private.atiende_org(organization_id));
-- Editar dirección, horario y contacto: Marley y el administrador de la empresa.
create policy points_editar on public.points for update to authenticated
  using (
    private.tiene_permiso('puntos.editar')
    and (private.atiende_org(organization_id) or organization_id = private.mi_org())
  )
  with check (
    private.tiene_permiso('puntos.editar')
    and (private.atiende_org(organization_id) or organization_id = private.mi_org())
  );
-- No hay política de borrado: un punto se da de baja con activo = false.

-- Canal, telemetría, partner y baja de un punto: solo quien gestiona puntos (Marley).
create function private.proteger_campos_punto() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user = 'authenticated' and not private.tiene_permiso('puntos.gestionar') and (
    new.canal is distinct from old.canal
    or new.telemetria_disponible is distinct from old.telemetria_disponible
    or new.partner_org_id is distinct from old.partner_org_id
    or new.activo is distinct from old.activo
  ) then
    raise exception 'sin_permiso' using errcode = '42501',
      detail = 'Canal, telemetría, partner y baja del punto los gestiona Marley';
  end if;
  return new;
end $$;

create trigger points_proteger_campos before update on public.points
  for each row execute function private.proteger_campos_punto();

-- Máquinas ---------------------------------------------------------------------------------
-- Las ve quien ve el punto (salvo el partner). Solo el KAM y gerencia las editan; el vendedor solo las ve.
grant select, insert, delete on public.machines to authenticated;
grant update (point_id, modelo, numero_serie) on public.machines to authenticated;

create policy machines_ver on public.machines for select to authenticated
  using (exists (
    select 1 from public.points p
    where p.id = point_id and private.puede_ver_org(p.organization_id)
  ));
create policy machines_agregar on public.machines for insert to authenticated
  with check (private.tiene_permiso('maquinas.editar') and exists (
    select 1 from public.points p
    where p.id = point_id and private.atiende_org(p.organization_id)
  ));
create policy machines_editar on public.machines for update to authenticated
  using (private.tiene_permiso('maquinas.editar') and exists (
    select 1 from public.points p
    where p.id = point_id and private.atiende_org(p.organization_id)
  ))
  with check (private.tiene_permiso('maquinas.editar') and exists (
    select 1 from public.points p
    where p.id = point_id and private.atiende_org(p.organization_id)
  ));
create policy machines_quitar on public.machines for delete to authenticated
  using (private.tiene_permiso('maquinas.editar') and exists (
    select 1 from public.points p
    where p.id = point_id and private.atiende_org(p.organization_id)
  ));

-- Catálogo de permisos ---------------------------------------------------------------------
-- Cada persona ve solo los permisos de su propio perfil (la interfaz los usa para mostrar acciones).
grant select on public.role_permissions to authenticated;

create policy role_permissions_ver on public.role_permissions for select to authenticated
  using (perfil = private.mi_perfil());
