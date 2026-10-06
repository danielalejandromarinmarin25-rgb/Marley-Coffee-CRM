-- Marley Conecta · Fase 1 · Registro de acciones
-- Cada alta, cambio o baja en las tablas del dominio queda registrada por trigger, con quién,
-- con qué perfil y cuándo. El registro no se puede editar ni borrar desde la app.

create table public.audit_log (
  id bigint generated always as identity primary key,
  ocurrido_at timestamptz not null default now(),
  actor_id uuid,              -- null cuando actúa el sistema (migraciones, carga del CRM)
  actor_perfil public.perfil,
  tabla text not null,
  operacion text not null check (operacion in ('INSERT', 'UPDATE', 'DELETE')),
  registro_id text,
  organization_id uuid,
  antes jsonb,
  despues jsonb
);
create index audit_log_org_idx on public.audit_log (organization_id, ocurrido_at desc);
create index audit_log_actor_idx on public.audit_log (actor_id, ocurrido_at desc);

alter table public.audit_log enable row level security;
revoke all on public.audit_log from anon, authenticated;
grant select on public.audit_log to authenticated;

-- Solo gerencia consulta el historial completo (supervisión).
create policy audit_log_ver on public.audit_log for select to authenticated
  using (private.tiene_permiso('auditoria.ver'));

create function private.registrar_auditoria() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_antes jsonb;
  v_despues jsonb;
  v_fila jsonb;
  v_org uuid;
begin
  if tg_op <> 'INSERT' then v_antes := to_jsonb(old); end if;
  if tg_op <> 'DELETE' then v_despues := to_jsonb(new); end if;
  v_fila := coalesce(v_despues, v_antes);

  v_org := case tg_table_name
    when 'organizations' then (v_fila ->> 'id')::uuid
    when 'machines' then (select p.organization_id from public.points p where p.id = (v_fila ->> 'point_id')::uuid)
    when 'crm_empresas' then (select o.id from public.organizations o where o.rut = v_fila ->> 'rut')
    else (v_fila ->> 'organization_id')::uuid
  end;

  insert into public.audit_log (actor_id, actor_perfil, tabla, operacion, registro_id, organization_id, antes, despues)
  values (
    auth.uid(),
    (select m.perfil from public.memberships m where m.user_id = auth.uid()),
    tg_table_name,
    tg_op,
    coalesce(v_fila ->> 'id', v_fila ->> 'user_id', v_fila ->> 'rut'),
    v_org,
    v_antes,
    v_despues
  );
  return null;
end $$;

create trigger auditoria after insert or update or delete on public.profiles
  for each row execute function private.registrar_auditoria();
create trigger auditoria after insert or update or delete on public.crm_empresas
  for each row execute function private.registrar_auditoria();
create trigger auditoria after insert or update or delete on public.organizations
  for each row execute function private.registrar_auditoria();
create trigger auditoria after insert or update or delete on public.invitations
  for each row execute function private.registrar_auditoria();
create trigger auditoria after insert or update or delete on public.memberships
  for each row execute function private.registrar_auditoria();
create trigger auditoria after insert or update or delete on public.points
  for each row execute function private.registrar_auditoria();
create trigger auditoria after insert or update or delete on public.machines
  for each row execute function private.registrar_auditoria();
create trigger auditoria after insert or update or delete on public.role_permissions
  for each row execute function private.registrar_auditoria();

-- Ni siquiera el dueño de la tabla la altera sin desactivar este trigger a propósito.
create function private.bloquear_cambios_auditoria() returns trigger
language plpgsql set search_path = '' as $$
begin
  raise exception 'audit_log es de solo escritura' using errcode = '42501';
end $$;

create trigger audit_log_inmutable before update or delete on public.audit_log
  for each row execute function private.bloquear_cambios_auditoria();
