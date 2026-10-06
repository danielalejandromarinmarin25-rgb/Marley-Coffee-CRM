-- Marley Conecta · Fase 3 · Modelo de reposición
-- Stock por punto y café, alertas, pedidos sugeridos, pedidos y notificaciones.
-- Ver "Control de stock e inventario" en Obsidian. Lectura con RLS por organización (las mismas
-- funciones de acceso de la Fase 1); la escritura de la app ocurre SOLO por las funciones de la
-- migración siguiente, que comprueban role_permissions en el servidor.
-- Todas las tablas por empresa llevan organization_id: simplifica RLS y el registro de acciones.

create type public.fuente_consumo as enum ('telemetria', 'declarado');
create type public.severidad_alerta as enum ('amarilla', 'roja');
create type public.estado_alerta as enum ('abierta', 'pospuesta', 'critica', 'confirmada', 'resuelta');
create type public.estado_pedido as enum ('recibido', 'en_preparacion', 'en_reparto', 'entregado');
create type public.zona_entrega as enum ('rm', 'regiones');

-- El plazo de entrega depende de la zona del punto (48 h RM · 72–96 h regiones).
alter table public.points add column zona public.zona_entrega not null default 'rm';

-- Catálogo -------------------------------------------------------------------------------------
create table public.productos (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  nombre text not null check (length(trim(nombre)) between 1 and 120),
  formato text not null,
  kg_por_bolsa numeric(6, 3) not null check (kg_por_bolsa > 0),
  activo boolean not null default true
);

-- Parámetros de la regla de cobertura (una sola fila). Los define Marley, no la app.
create table public.parametros_reposicion (
  id boolean primary key default true check (id),
  plazo_rm_dias numeric(4, 1) not null default 2,
  plazo_regiones_dias numeric(4, 1) not null default 4,
  gestion_dias numeric(4, 1) not null default 1,
  margen_dias numeric(4, 1) not null default 2,
  -- Bajo esta cobertura, una alerta sin confirmar pasa a crítica y sube a gerencia.
  umbral_critico_dias numeric(4, 1) not null default 3,
  -- Días que debe cubrir un pedido sugerido (un ciclo de compra).
  dias_ciclo integer not null default 14 check (dias_ciclo between 1 and 60),
  -- Días de telemetría con que se promedia el consumo diario.
  ventana_telemetria_dias integer not null default 14 check (ventana_telemetria_dias between 1 and 90)
);
insert into public.parametros_reposicion default values;

-- Consumo de referencia del segmento (Modo B, ciclo 1: aún no hay tasa propia del punto).
create table public.consumo_referencia (
  canal public.canal primary key,
  kg_dia numeric(6, 3) not null check (kg_dia > 0)
);
insert into public.consumo_referencia (canal, kg_dia) values
  ('horeca', 1.0), ('ocs', 0.6), ('conveniencia', 0.8), ('panaderia', 0.5);

-- Mezcla de compra habitual: cómo se reparte el consumo del punto entre cafés.
create table public.mezcla_punto (
  point_id uuid not null references public.points (id) on delete cascade,
  producto_id uuid not null references public.productos (id),
  organization_id uuid not null references public.organizations (id),
  proporcion numeric(4, 3) not null check (proporcion > 0 and proporcion <= 1),
  bolsas_habituales integer not null check (bolsas_habituales between 1 and 99),
  primary key (point_id, producto_id)
);

-- Entradas: entregas exactas (en producción vienen del ERP).
create table public.entregas (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  point_id uuid not null references public.points (id),
  producto_id uuid not null references public.productos (id),
  bolsas integer not null check (bolsas > 0),
  entregada_at timestamptz not null default now(),
  pedido_id uuid
);
create index entregas_punto_idx on public.entregas (point_id, producto_id, entregada_at);

-- Modo A: lecturas diarias de telemetría por punto (bebidas × gramos por receta = kg).
create table public.lecturas_telemetria (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations (id),
  point_id uuid not null references public.points (id),
  fecha date not null,
  bebidas integer not null check (bebidas >= 0),
  gramos_por_bebida numeric(5, 2) not null check (gramos_por_bebida > 0),
  kg numeric(8, 3) generated always as (bebidas * gramos_por_bebida / 1000) stored,
  recibida_at timestamptz not null default now(),
  unique (point_id, fecha)
);

-- Modo B (y conteo inicial): bolsas que quedan por café, declaradas al pedir.
create table public.declaraciones_stock (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  point_id uuid not null references public.points (id),
  producto_id uuid not null references public.productos (id),
  bolsas numeric(6, 1) not null check (bolsas >= 0 and bolsas <= 999),
  declarado_at timestamptz not null default now(),
  declarado_por uuid references public.profiles (id) on delete set null,
  pedido_id uuid
);
create index declaraciones_punto_idx on public.declaraciones_stock (point_id, producto_id, declarado_at desc);

-- Saldo calculado por punto y café (lo reescribe el cálculo diario).
create table public.saldos (
  point_id uuid not null references public.points (id) on delete cascade,
  producto_id uuid not null references public.productos (id),
  organization_id uuid not null references public.organizations (id),
  saldo_kg numeric(8, 2) not null,
  consumo_diario_kg numeric(8, 3),
  cobertura_dias numeric(6, 1),
  agotamiento_estimado date,
  fuente public.fuente_consumo not null,
  dato_at timestamptz,
  calculado_at timestamptz not null default now(),
  primary key (point_id, producto_id)
);

-- Alertas ---------------------------------------------------------------------------------------
create table public.alertas (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  point_id uuid not null references public.points (id),
  producto_id uuid not null references public.productos (id),
  estado public.estado_alerta not null default 'abierta',
  severidad public.severidad_alerta not null,
  cobertura_dias numeric(6, 1),
  agotamiento_estimado date,
  fuente public.fuente_consumo not null,
  dato_at timestamptz,
  pospuesta_hasta date,
  creada_at timestamptz not null default now(),
  critica_at timestamptz,
  confirmada_at timestamptz,
  resuelta_at timestamptz,
  updated_at timestamptz not null default now()
);
-- Una sola alerta viva por punto y café.
create unique index alertas_una_viva on public.alertas (point_id, producto_id)
  where estado in ('abierta', 'pospuesta', 'critica', 'confirmada');
create index alertas_org_idx on public.alertas (organization_id, estado);

-- Gestiones del vendedor o KAM sobre una alerta (contacto, nota). Solo las ve Marley.
create table public.alerta_gestiones (
  id uuid primary key default gen_random_uuid(),
  alerta_id uuid not null references public.alertas (id) on delete cascade,
  organization_id uuid not null references public.organizations (id),
  autor_id uuid references public.profiles (id) on delete set null,
  tipo text not null check (tipo in ('whatsapp', 'nota')),
  nota text check (nota is null or length(nota) <= 500),
  creada_at timestamptz not null default now()
);
create index alerta_gestiones_alerta_idx on public.alerta_gestiones (alerta_id);

-- Pedido sugerido: exactamente uno por alerta.
create table public.pedidos_sugeridos (
  id uuid primary key default gen_random_uuid(),
  alerta_id uuid not null unique references public.alertas (id) on delete cascade,
  organization_id uuid not null references public.organizations (id),
  point_id uuid not null references public.points (id),
  creado_at timestamptz not null default now(),
  ajustado_por uuid references public.profiles (id) on delete set null,
  -- Copia del nombre: el cliente no puede leer perfiles de Marley, pero debe ver quién ajustó.
  ajustado_por_nombre text,
  ajustado_por_perfil public.perfil,
  ajustado_at timestamptz
);

create table public.lineas_sugeridas (
  id uuid primary key default gen_random_uuid(),
  pedido_sugerido_id uuid not null references public.pedidos_sugeridos (id) on delete cascade,
  organization_id uuid not null references public.organizations (id),
  producto_id uuid not null references public.productos (id),
  bolsas_sugeridas integer not null check (bolsas_sugeridas between 0 and 99),
  bolsas integer not null check (bolsas between 0 and 99),
  unique (pedido_sugerido_id, producto_id)
);

-- Pedidos ---------------------------------------------------------------------------------------
create sequence public.pedidos_numero_seq start 1041;

create table public.pedidos (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique default ('MC-' || lpad(nextval('public.pedidos_numero_seq')::text, 5, '0')),
  -- Un pedido por alerta y por pedido sugerido: la base impide duplicados aunque cliente
  -- y vendedor actúen a la vez.
  alerta_id uuid unique references public.alertas (id),
  pedido_sugerido_id uuid unique references public.pedidos_sugeridos (id),
  organization_id uuid not null references public.organizations (id),
  point_id uuid not null references public.points (id),
  estado public.estado_pedido not null default 'recibido',
  confirmado_por uuid references public.profiles (id) on delete set null,
  confirmado_por_nombre text,
  confirmado_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index pedidos_org_idx on public.pedidos (organization_id, confirmado_at desc);

create table public.lineas_pedido (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos (id) on delete cascade,
  organization_id uuid not null references public.organizations (id),
  producto_id uuid not null references public.productos (id),
  bolsas integer not null check (bolsas between 1 and 99),
  unique (pedido_id, producto_id)
);

create table public.historial_pedido (
  id bigint generated always as identity primary key,
  pedido_id uuid not null references public.pedidos (id) on delete cascade,
  organization_id uuid not null references public.organizations (id),
  estado public.estado_pedido not null,
  ocurrido_at timestamptz not null default now(),
  unique (pedido_id, estado)
);

alter table public.entregas add constraint entregas_pedido_fk foreign key (pedido_id) references public.pedidos (id);
alter table public.declaraciones_stock add constraint declaraciones_pedido_fk foreign key (pedido_id) references public.pedidos (id);

-- Notificaciones --------------------------------------------------------------------------------
create table public.notificaciones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  organization_id uuid references public.organizations (id),
  tipo text not null check (tipo in (
    'alerta_nueva', 'alerta_critica', 'pedido_ajustado', 'pedido_confirmado', 'pedido_estado'
  )),
  alerta_id uuid references public.alertas (id) on delete cascade,
  pedido_id uuid references public.pedidos (id) on delete cascade,
  -- Para pedido_estado: a qué estado pasó (un aviso por estado, no por recálculo).
  detalle text,
  titulo text not null,
  cuerpo text not null,
  enlace text not null,
  creada_at timestamptz not null default now(),
  leida_at timestamptz,
  -- Correo: solo los avisos que lo ameritan, agrupados en un resumen.
  por_correo boolean not null default false,
  correo_enviado_at timestamptz
);
-- Sin duplicados: un mismo aviso no se repite aunque el cálculo corra varias veces.
create unique index notificaciones_sin_duplicados on public.notificaciones
  (user_id, tipo, alerta_id, pedido_id, detalle) nulls not distinct;
create index notificaciones_usuario_idx on public.notificaciones (user_id, creada_at desc);
create index notificaciones_correo_idx on public.notificaciones (user_id) where por_correo and correo_enviado_at is null;

-- Registro de correos enviados (para respetar el límite diario de Resend). Solo el servidor.
create table public.envios_correo (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles (id) on delete set null,
  email text not null,
  avisos integer not null,
  modo text not null check (modo in ('real', 'prueba')),
  proveedor_id text,
  enviado_at timestamptz not null default now()
);

-- updated_at ------------------------------------------------------------------------------------
create trigger alertas_updated before update on public.alertas
  for each row execute function private.marcar_actualizacion();
create trigger pedidos_updated before update on public.pedidos
  for each row execute function private.marcar_actualizacion();

-- Permisos de tabla y RLS -----------------------------------------------------------------------
-- Las sesiones solo leen. Toda escritura pasa por funciones security definer.
alter table public.productos enable row level security;
alter table public.parametros_reposicion enable row level security;
alter table public.consumo_referencia enable row level security;
alter table public.mezcla_punto enable row level security;
alter table public.entregas enable row level security;
alter table public.lecturas_telemetria enable row level security;
alter table public.declaraciones_stock enable row level security;
alter table public.saldos enable row level security;
alter table public.alertas enable row level security;
alter table public.alerta_gestiones enable row level security;
alter table public.pedidos_sugeridos enable row level security;
alter table public.lineas_sugeridas enable row level security;
alter table public.pedidos enable row level security;
alter table public.lineas_pedido enable row level security;
alter table public.historial_pedido enable row level security;
alter table public.notificaciones enable row level security;
alter table public.envios_correo enable row level security;

revoke all on public.productos, public.parametros_reposicion, public.consumo_referencia,
  public.mezcla_punto, public.entregas, public.lecturas_telemetria, public.declaraciones_stock,
  public.saldos, public.alertas, public.alerta_gestiones, public.pedidos_sugeridos,
  public.lineas_sugeridas, public.pedidos, public.lineas_pedido, public.historial_pedido,
  public.notificaciones, public.envios_correo
  from anon, authenticated;
revoke all on sequence public.pedidos_numero_seq from anon, authenticated;

grant select on public.productos, public.parametros_reposicion, public.mezcla_punto,
  public.entregas, public.lecturas_telemetria, public.declaraciones_stock, public.saldos,
  public.alertas, public.alerta_gestiones, public.pedidos_sugeridos, public.lineas_sugeridas,
  public.pedidos, public.lineas_pedido, public.historial_pedido, public.notificaciones
  to authenticated;
-- envios_correo y consumo_referencia: sin acceso desde la app.

-- Catálogo y parámetros: cualquier cuenta activa.
create policy productos_ver on public.productos for select to authenticated
  using (private.mi_perfil() is not null);
create policy parametros_ver on public.parametros_reposicion for select to authenticated
  using (private.mi_perfil() is not null);

-- Datos de stock, alertas y pedidos: quien ve la empresa (gerencia, su cartera o la propia
-- empresa). El partner no ve stock ni pedidos de la empresa cliente.
create policy mezcla_ver on public.mezcla_punto for select to authenticated
  using (private.puede_ver_org(organization_id));
create policy entregas_ver on public.entregas for select to authenticated
  using (private.puede_ver_org(organization_id));
create policy lecturas_ver on public.lecturas_telemetria for select to authenticated
  using (private.puede_ver_org(organization_id));
create policy declaraciones_ver on public.declaraciones_stock for select to authenticated
  using (private.puede_ver_org(organization_id));
create policy saldos_ver on public.saldos for select to authenticated
  using (private.puede_ver_org(organization_id));
create policy alertas_ver on public.alertas for select to authenticated
  using (private.puede_ver_org(organization_id));
-- Las gestiones internas (contacto, notas) son de Marley: el cliente no las ve.
create policy alerta_gestiones_ver on public.alerta_gestiones for select to authenticated
  using (private.atiende_org(organization_id));
create policy pedidos_sugeridos_ver on public.pedidos_sugeridos for select to authenticated
  using (private.puede_ver_org(organization_id));
create policy lineas_sugeridas_ver on public.lineas_sugeridas for select to authenticated
  using (private.puede_ver_org(organization_id));
create policy pedidos_ver on public.pedidos for select to authenticated
  using (private.puede_ver_org(organization_id));
create policy lineas_pedido_ver on public.lineas_pedido for select to authenticated
  using (private.puede_ver_org(organization_id));
create policy historial_pedido_ver on public.historial_pedido for select to authenticated
  using (private.puede_ver_org(organization_id));

-- Notificaciones: cada persona ve solo las suyas, y solo con la cuenta activa.
create policy notificaciones_ver on public.notificaciones for select to authenticated
  using (user_id = (select auth.uid()) and private.mi_perfil() is not null);

-- Registro de acciones --------------------------------------------------------------------------
-- Reusa el trigger de la Fase 1: todas estas tablas tienen organization_id.
-- No se auditan lecturas de telemetría, saldos ni notificaciones: son datos derivados o de alto
-- volumen, no acciones de personas.
create trigger auditoria after insert or update or delete on public.mezcla_punto
  for each row execute function private.registrar_auditoria();
create trigger auditoria after insert or update or delete on public.entregas
  for each row execute function private.registrar_auditoria();
create trigger auditoria after insert or update or delete on public.declaraciones_stock
  for each row execute function private.registrar_auditoria();
create trigger auditoria after insert or update or delete on public.alertas
  for each row execute function private.registrar_auditoria();
create trigger auditoria after insert or update or delete on public.alerta_gestiones
  for each row execute function private.registrar_auditoria();
create trigger auditoria after insert or update or delete on public.pedidos_sugeridos
  for each row execute function private.registrar_auditoria();
create trigger auditoria after insert or update or delete on public.lineas_sugeridas
  for each row execute function private.registrar_auditoria();
create trigger auditoria after insert or update or delete on public.pedidos
  for each row execute function private.registrar_auditoria();
create trigger auditoria after insert or update or delete on public.lineas_pedido
  for each row execute function private.registrar_auditoria();
create trigger auditoria after insert or update or delete on public.parametros_reposicion
  for each row execute function private.registrar_auditoria();
