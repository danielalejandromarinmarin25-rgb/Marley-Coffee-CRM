-- Marley Conecta · Fase 1 · Funciones de acceso
-- Todas leen la membresía ACTIVA de quien consulta (auth.uid()) en cada llamada. Desactivar una
-- cuenta corta su acceso en la siguiente consulta, aunque su token de sesión siga vigente.
-- Son security definer para no depender de las políticas de las tablas que leen (evita recursión),
-- y viven en el esquema private, que la API no expone.

create function private.mi_membresia() returns public.memberships
language sql stable security definer set search_path = '' as $$
  select m.* from public.memberships m
  where m.user_id = (select auth.uid()) and m.estado = 'activa'
$$;

create function private.mi_perfil() returns public.perfil
language sql stable security definer set search_path = '' as $$
  select (private.mi_membresia()).perfil
$$;

create function private.mi_org() returns uuid
language sql stable security definer set search_path = '' as $$
  select (private.mi_membresia()).organization_id
$$;

create function private.es_gerencia() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(private.mi_perfil() = 'gerencia', false)
$$;

create function private.es_comercial() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(private.mi_perfil() in ('vendedor', 'kam'), false)
$$;

create function private.tiene_permiso(p_permiso text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.role_permissions rp
    where rp.perfil = private.mi_perfil() and rp.permiso = p_permiso
  )
$$;

-- La organización está en la cartera de quien consulta (vendedor o KAM asignado en el CRM).
create function private.en_mi_cartera(p_org uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select private.es_comercial() and exists (
    select 1
    from public.organizations o
    join public.crm_empresas c on c.rut = o.rut
    where o.id = p_org and c.asignado_a = (select auth.uid())
  )
$$;

-- Quien consulta puede ver los datos de esta organización:
-- gerencia (supervisión de todo), su cartera, o su propia organización.
create function private.puede_ver_org(p_org uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select private.es_gerencia()
      or private.en_mi_cartera(p_org)
      or (p_org is not null and p_org = private.mi_org())
$$;

-- Personal de Marley que atiende a esta empresa cliente: gerencia o su vendedor/KAM.
create function private.atiende_org(p_org uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select private.es_gerencia() or private.en_mi_cartera(p_org)
$$;

-- Visibilidad de personas (perfiles y membresías):
-- uno mismo; gerencia ve a todos; el vendedor/KAM ve a las personas de su cartera;
-- en una empresa cliente o partner, sus miembros se ven entre sí (Mi equipo).
-- Los vendedores y KAM no ven al resto del equipo comercial: esa vista es de gerencia.
create function private.puede_ver_persona(p_user uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select p_user = (select auth.uid())
      or private.es_gerencia()
      or exists (
        select 1
        from public.memberships m
        join public.organizations o on o.id = m.organization_id
        where m.user_id = p_user
          and (
            private.en_mi_cartera(m.organization_id)
            or (o.tipo <> 'marley' and m.organization_id = private.mi_org())
          )
      )
$$;

grant execute on all functions in schema private to authenticated, service_role;
