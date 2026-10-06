# Backend de Marley Conecta

Supabase: Postgres, Auth y Row Level Security (RLS), más una Edge Function para las invitaciones. La seguridad vive en la base de datos: cada consulta y modificación se filtra por la identidad, el perfil, la organización y la cartera de quien la hace, también cuando alguien abre un enlace directo o cambia un ID.

- **Fase 1 (cimientos)**: cuentas, organizaciones, invitaciones, permisos, puntos y máquinas mínimos, historial de acciones y pruebas de aislamiento.
- **Fase 3 (flujo de reposición)**: stock por punto y café, regla de cobertura, alertas, pedidos sugeridos, pedidos, avisos y resumen por correo. Ver [Flujo de reposición](#flujo-de-reposición-fase-3).

## Estructura

```text
supabase/
  config.toml                 configuración local (Auth solo por invitación, contraseñas, plantillas)
  migrations/                 esquema versionado, se aplica en orden
    ..._esquema_base.sql      tablas, catálogo de permisos e integridad
    ..._funciones_acceso.sql  funciones que leen la membresía activa de la sesión
    ..._rls.sql               permisos por columna y políticas por fila
    ..._auditoria.sql         audit_log por triggers, inmutable
    ..._flujos_cuenta.sql     activar empresa, invitar, aceptar, activar/desactivar
    ..._reposicion_modelo.sql stock, alertas, pedidos sugeridos, pedidos y avisos, con RLS y auditoría
    ..._reposicion_regla.sql  regla de cobertura (funciones puras), cálculo diario y acciones del flujo
    ..._reposicion_cron.sql   tareas programadas (pg_cron): cálculo diario y resumen de correo
  functions/invite-user/      Edge Function: única pieza de la Fase 1 que usa la clave secreta
  functions/enviar-resumen/   Edge Function: resumen de avisos por correo (Resend), solo desde el servidor
  templates/                  correos de invitación y recuperación en español
  tests/                      pruebas de acceso pgTAP (matriz perfil × recurso)
  seed.sql                    cuentas y datos mínimos SOLO para desarrollo local
  seed_demo.sql               datos de la demo de reposición (cuatro canales, con y sin telemetría)
scripts/e2e.mjs               prueba de punta a punta de cuentas contra el stack local
scripts/e2e-reposicion.mjs    prueba de punta a punta del flujo de reposición (concurrencia, correo)
scripts/comando.mjs           comandos internos: recalcular, avanzar un pedido, enviar el resumen
```

## Modelo

| Tabla | Para qué |
| --- | --- |
| `profiles` | Datos personales de cada cuenta de Auth |
| `memberships` | Perfil, organización y estado de la cuenta. `user_id` es la clave primaria: **un único perfil por cuenta** |
| `organizations` | Marley (una sola), empresas cliente (por RUT) y partners |
| `crm_empresas` | CRM simulado: RUT, vendedor o KAM asignado, canal, segmento y estado. La app solo lo lee; el cliente nunca lo ve |
| `invitations` | Invitaciones pendientes, aceptadas o revocadas, con vencimiento a 7 días |
| `points` | Puntos de cada empresa, con canal y `telemetria_disponible` (la fuente de consumo se decide por punto) |
| `machines` | Máquinas de cada punto |
| `role_permissions` | Catálogo de permisos por perfil. Ya incluye `pedido_sugerido.ajustar` (vendedor, KAM y cliente) y `pedido.confirmar` (solo cliente) para la Fase 3 |
| `audit_log` | Quién (y con qué perfil) hizo qué, cuándo y sobre qué empresa, con el antes y el después |

Perfiles: `gerencia`, `vendedor`, `kam`, `cliente_admin`, `cliente_integrante` y `partner`. Un trigger impide asignar un perfil que no calce con el tipo de organización (por ejemplo, un `vendedor` en una empresa cliente).

## Reglas de acceso

| | Gerencia | Vendedor | KAM | Cliente admin | Cliente integrante | Partner |
| --- | --- | --- | --- | --- | --- | --- |
| Empresas cliente | Todas | Su cartera | Su cartera | La suya | La suya | — |
| CRM (canal, segmento, estado) | Todo | Su cartera | Su cartera | — | — | — |
| Activar empresa del CRM | Sí | Su cartera | Su cartera | — | — | — |
| Nombre comercial y contacto | Edita | Edita | Edita | Edita | Ve | — |
| Puntos: dirección, horario, recepción | Edita | Edita | Edita | Edita | Ve | Ve los suyos |
| Puntos: agregar, canal, telemetría, baja | Sí | Sí | Sí | — | — | — |
| Máquinas | Edita | **Ve** | **Edita** | Ve | Ve | — |
| Invitar | Equipo comercial y administradores | Administrador de su cartera | Administrador de su cartera | Su equipo | — | — |
| Activar o desactivar personas | Equipo comercial | — | — | Su equipo | — (Mi equipo en solo lectura) | — |
| Historial de acciones | Sí | — | — | — | — | — |

Además:

- Nadie se cambia de perfil ni de organización, ni edita el perfil de otra persona. Sin políticas de escritura en `memberships` ni `invitations`: solo cambian por las funciones de flujos de cuenta.
- Una cuenta desactivada o con la invitación sin aceptar no ve nada. El corte es inmediato aunque su token siga vigente, porque las funciones de acceso leen la membresía en cada consulta.
- Un registro fuera de alcance responde lo mismo que uno inexistente (vacío o `no_encontrado`), sin revelar qué existe.
- Sin sesión (`anon`) no hay acceso a ninguna tabla ni función.

## Desarrollo local

Requisitos: Docker en ejecución y Node 20 o superior. La CLI de Supabase se instala como dependencia del paquete.

```sh
cd backend
npx pnpm@10 install
npx pnpm@10 db:start      # levanta Postgres, Auth, API, Edge Functions y Mailpit; aplica migraciones y seed
cp supabase/functions/.env.example supabase/functions/.env
```

Los correos locales (invitaciones y recuperación) llegan a Mailpit: http://127.0.0.1:54324. Las cuentas del seed usan la contraseña `marley-local-1` (por ejemplo, `vendedora@marley.local`, `kam@marley.local` o `admin@andino.local`).

Para conectar el frontend al stack local, pon en `frontend/.env.local` la `API_URL` y la `PUBLISHABLE_KEY` que muestra `npx supabase status --workdir backend`. Son claves locales de desarrollo.

## Pruebas

```sh
npx pnpm@10 test          # reinicia la base, corre pgTAP, las dos pruebas de punta a punta y deja la base limpia
npx pnpm@10 test:db       # solo pgTAP
```

Resultado actual: **pgTAP 310 de 310** (189 de la Fase 1 + 121 de la Fase 3), punta a punta 9 de 9 (cuentas) y 5 de 5 (reposición).

- **pgTAP (189 casos)**:
  - `01_matriz_lectura`: qué ve cada perfil de cada recurso, consultando por ID.
  - `02_escritura`: ediciones, escalamiento de perfil, cambio de ID y columnas protegidas.
  - `03_flujos_cuenta`: activación, invitación, aceptación, vencimiento y desactivación.
  - `04_auditoria_y_anonimo`: historial y acceso sin sesión.
  - Cada archivo corre en una transacción que se revierte.
- **Punta a punta (`scripts/e2e.mjs`)**:
  - Login, registro público cerrado e invitación por la Edge Function con correo real en Mailpit.
  - Activación de cuenta, enlace de un solo uso, recuperación de acceso, cambio de ID por la API REST y cierre de sesión.
  - Usa solo la clave publicable. Necesita la base recién reiniciada, porque activa una empresa del seed.

- **pgTAP de la Fase 3**:
  - `10_regla_cobertura`: pruebas unitarias de las funciones puras de la regla (fuente por punto, cobertura, semáforo, paso a crítica, consumo del Modo B, saldo, pedido sugerido).
  - `11_reposicion_acceso`: quién ve y quién hace qué. El vendedor, el KAM y gerencia **no** confirman; una empresa no ve alertas ni pedidos de otra; cada vendedor ve solo su cartera; gerencia ve las críticas; la base impide un segundo pedido para la misma alerta.
  - `12_recalculo`: el cálculo con datos reales crea la alerta, el pedido sugerido, los avisos y la escalada a gerencia sin duplicar nada; al entregar, el saldo sube y la alerta se resuelve.
- **Punta a punta de reposición (`scripts/e2e-reposicion.mjs`)**: dos confirmaciones realmente simultáneas desde dos conexiones crean un solo pedido; el vendedor no confirma por la API; el ajuste del vendedor llega al cliente; el resumen de correo agrupa y no repite.

Si cambias el esquema, regenera los tipos del frontend con `npx pnpm@10 types`.

## Flujo de reposición (Fase 3)

Diseño en Obsidian: *Definición del MVP* (sección 6) y *Control de stock e inventario*.

### Modelo

| Tabla | Para qué |
| --- | --- |
| `productos` | Cafés y formato (kg por bolsa) |
| `parametros_reposicion` | Plazo RM y regiones, gestión, margen, umbral crítico, días de ciclo y ventana de telemetría (una fila) |
| `consumo_referencia` | Consumo diario del segmento por canal, para el primer ciclo del Modo B |
| `mezcla_punto` | Mezcla de compra habitual de cada punto: proporción por café y bolsas habituales |
| `entregas` | Entradas exactas (en producción, del ERP) |
| `lecturas_telemetria` | Modo A: bebidas por día × gramos por bebida = kg |
| `declaraciones_stock` | Modo B y conteo inicial: bolsas que quedan, quién y cuándo |
| `saldos` | Saldo, consumo diario, cobertura, agotamiento, fuente y fecha del dato, por punto y café |
| `alertas` | Una **viva** por punto y café (índice único parcial). Estado y severidad |
| `alerta_gestiones` | Contacto por WhatsApp o nota del vendedor o KAM. Solo las ve Marley |
| `pedidos_sugeridos` + `lineas_sugeridas` | **Uno por alerta** (`alerta_id` único). Guardan la cantidad sugerida original y la ajustada, con quién y cuándo ajustó |
| `pedidos` + `lineas_pedido` + `historial_pedido` | **Un pedido por alerta** (`alerta_id` y `pedido_sugerido_id` únicos). Estados Recibido → En preparación → En reparto → Entregado |
| `notificaciones` | Avisos por persona, sin duplicados (índice único por persona, tipo, alerta, pedido y estado) |
| `envios_correo` | Correos enviados, para respetar el límite diario de Resend. Solo el servidor |

Las sesiones solo **leen** estas tablas (RLS con las mismas funciones de acceso de la Fase 1). Toda escritura pasa por funciones del servidor, que comprueban `role_permissions`:

| Función | Quién | Regla |
| --- | --- | --- |
| `ajustar_pedido_sugerido` | Cliente (su empresa), vendedor o KAM (su cartera) | Permiso `pedido_sugerido.ajustar`. No cambia el estado de la alerta. Si ajusta Marley, el cliente recibe un aviso (uno solo aunque ajuste varias veces) |
| `confirmar_pedido` | **Solo el cliente** | Permiso `pedido.confirmar` y su propia empresa. Bloquea la fila del pedido sugerido, así dos confirmaciones simultáneas no duplican; la restricción única es el respaldo. Sin telemetría exige las bolsas que quedan; con telemetría no pide nada |
| `posponer_alerta` | Cliente | 1 a 7 días. Igual pasa a crítica si cae bajo el umbral |
| `registrar_gestion` | Vendedor o KAM de la cartera | Contacto por WhatsApp o nota interna |
| `marcar_notificaciones_leidas` | Cada persona | Solo las propias |
| `recalcular_reposicion`, `avanzar_pedido`, `resumenes_correo_pendientes`, `registrar_envio_correo` | Solo `service_role` | Comandos internos; la app no puede llamarlos |

Todas las tablas del flujo (salvo lecturas de telemetría, saldos y avisos, que son datos derivados o de alto volumen) quedan en `audit_log`: quién ajustó, quién confirmó y cuándo.

### Regla de cobertura y simplificaciones frente a la nota de stock

La decisión vive en funciones **puras** (`immutable`, sin leer tablas ni la hora), probadas con pgTAP en `10_regla_cobertura.sql`:

- **Fuente por punto**: `telemetria_disponible` → Modo A; si no, Modo B (declarado por el cliente).
- **Cobertura** = saldo ÷ consumo diario.
- **Semáforo**: roja si la cobertura ≤ plazo de entrega (se acaba antes de que llegue un pedido hecho hoy); amarilla si ≤ plazo + gestión + margen; verde si no.
- **Crítica**: una alerta abierta o pospuesta pasa a crítica si la cobertura ≤ umbral crítico (3 días por omisión) y nadie confirmó. Sube a gerencia y sigue en manos del vendedor o KAM.
- **Pedido sugerido**: las bolsas que faltan para cubrir el plazo de entrega más un ciclo de compra (14 días), descontando el saldo; sin tasa de consumo, la compra habitual. Entre 1 y 99 bolsas.

Simplificaciones frente a *Control de stock e inventario*:

1. **Telemetría ya agregada por día**: cada lectura trae bebidas y un gramaje promedio por bebida, no bebidas por receta con su gramaje propio.
2. **Sin calibración cada 90 días**: el gramaje no se ajusta comparando kg entregados contra kg consumidos.
3. **Sin detección de tolva vacía**: no existe la alarma de tolva ni el "quiebre real, saldo = 0" por horas sin consumo en horario de uso.
4. **Saldo anclado al último conteo**: saldo = último conteo de bolsas + entregas desde entonces − consumo desde entonces. En el Modo A el ancla es el conteo inicial al activar la telemetría.
5. **Consumo del Modo A**: promedio simple de los últimos 14 días con lectura, repartido según la mezcla de compra. No hay estacionalidad, días hábiles ni tendencias.
6. **Consumo del Modo B**: el del último ciclo entre dos conteos; en el primer ciclo, un consumo de referencia por canal (`consumo_referencia`), no "el promedio del segmento" calculado.
7. **Plazos fijos por zona**: 2 días en RM y 4 en regiones (el máximo de 72–96 h), más 1 día de gestión y 2 de margen, todos en `parametros_reposicion`. No dependen del horario de recepción ni de feriados.
8. **Sin validación contra el stock de Marley (ERP)**: el pedido sugerido no ofrece sustitutos ni envío parcial.
9. **Una alerta por punto y café**: si un punto tiene dos cafés por agotarse, ve dos alertas con un pedido sugerido cada una. No se consolidan en un solo despacho.
10. **Las llamadas proactivas no registran bolsas**: el vendedor deja nota o contacto, pero no declara el stock (en la nota, cada llamada del Modo B también lo registra).
11. **Sin Modo C** (reportes de partners): fuera del alcance de la fase.
12. **Las entregas las registra el comando interno** al marcar un pedido como Entregado, no el ERP.

### Cálculo diario y comandos internos

`pg_cron` (un "despertador" dentro de Postgres) corre `recalcular_reposicion` todos los días a las 06:00 de Chile (09:00 UTC) y pide el resumen de correo a las 06:15. Para la demo:

```sh
npx pnpm@10 demo:preparar                    # recarga la base con seed.sql + seed_demo.sql (fechas relativas a hoy)
npx pnpm@10 reposicion:calcular              # recalcula saldos y alertas ahora
npx pnpm@10 pedido:avanzar                   # lista los pedidos abiertos
npx pnpm@10 pedido:avanzar MC-01041          # pasa el pedido al estado siguiente
npx pnpm@10 pedido:avanzar MC-01041 entregado
npx pnpm@10 correo:resumen                   # envía el resumen de avisos (modo prueba sin RESEND_API_KEY)
```

Los comandos actúan sobre el Supabase local. Para el remoto: `SUPABASE_URL=… SUPABASE_SECRET_KEY=… npx pnpm@10 pedido:avanzar MC-01041`, con la clave secreta solo en la terminal. Ninguno está en la interfaz.

### Datos de la demo (`seed_demo.sql`)

Se suman a `seed.sql` sin modificarlo y son repetibles: `demo:preparar` reinicia la base y vuelve a cargarlos. Las alertas no están escritas a mano: las calcula la regla real a partir de los conteos, las entregas y la telemetría cargados.

| Canal | Empresa (responsable) | Punto | Fuente | Situación |
| --- | --- | --- | --- | --- |
| Horeca | Café Andino (Valentina) | Andino Providencia | Telemetría | **Crítica**: Buffalo Soldier, ~1,9 días |
| Horeca | Café Andino (Valentina) | Andino Ñuñoa | Declarado | **Nueva**: One Love, ~3,4 días |
| Horeca | Gran Hotel Pacífico del Litoral Central (Valentina) | Terraza Mirador y Salón de Desayunos · Cafetería del Lobby | Telemetría · declarado | Al día. Nombres y direcciones largos, regiones |
| OCS | Oficinas del Sur (Karen) | Torre Apoquindo piso 12 | Telemetría | **Confirmada, pedido MC-01041 en reparto** |
| OCS | Nueva Las Condes (Karen) | Edificio Cerro Colorado piso 21 | Declarado | Al día |
| Estaciones | Ruta Sur (Karen) | Buin Km 35 · Rancagua Norte | Telemetría · declarado | Nueva (~4,8 días) · al día |
| Panaderías | Los Aromos (Valentina) | La Florida · Maipú | Declarado · telemetría | Nueva (~4 días) · al día |

Cuentas (contraseña `marley-local-1`): `gerencia@marley.local`, `vendedora@marley.local`, `kam@marley.local`, `admin@andino.local` (y `barista@andino.local`, integrante), `admin@oficinasur.local`, `admin@hotelpacifico.local`, `admin@nuevalascondes.local`, `admin@rutasur.local` y `admin@losaromos.local`.

Las fechas son relativas al momento de la carga: hay que recargar (`demo:preparar`) antes de cada demo. Las pruebas de punta a punta modifican los datos; `npx pnpm@10 test` deja la base recargada al terminar.

### Correo (Resend)

`enviar-resumen` manda **un correo por persona** con todos sus avisos pendientes de las últimas 24 horas, como máximo una vez al día. Para cuidar el plan gratuito (100 al día, 3.000 al mes):

- Marca cada aviso al enviarlo, así no se repite. Además usa una clave de idempotencia de Resend.
- No envía avisos ya leídos en la app.
- Corta en 90 correos diarios (`RESEND_LIMITE_DIARIO`), contados en `envios_correo`.
- Solo la llama el servidor: exige la clave secreta del proyecto.

Variables en `supabase/functions/.env` (local) o como secretos de la función (remoto): `RESEND_API_KEY`, `RESEND_FROM`, `RESEND_SOLO_A` y `APP_URL`. Sin `RESEND_API_KEY` corre en **modo prueba**: registra a quién enviaría, sin enviar nada.

Sin dominio verificado, Resend solo acepta `onboarding@resend.dev` como remitente y solo entrega al correo dueño de la cuenta. Por eso, mientras no haya dominio, `RESEND_SOLO_A` redirige todos los resúmenes a esa dirección.

Para que pg_cron llame a la función en el remoto, se guardan en Vault los secretos `url_proyecto` y `clave_servicio`. Sin ellos, la tarea no hace nada.

## Configurar el proyecto remoto

Proyecto: `zgricmmfqfsfksgkzsab` (Marley Conecta, organización Agencia 14, región sa-east-1). Migraciones y Edge Function `invite-user` ya aplicadas el 5 de octubre de 2026; lo que sigue es la configuración del panel. El conector de Supabase no configura Auth, así que estos pasos se hacen en el panel:

1. **Authentication → Sign In / Providers**:
   - Desactivar *Allow new users to sign up*. Es imprescindible: con el registro abierto, cualquiera con la clave publicable podría crearse una cuenta. No vería datos, porque no tendría membresía, pero no debe existir.
   - Mantener activo el proveedor *Email*.
2. **Authentication → URL Configuration**:
   - *Site URL*: la URL pública de la app.
   - *Redirect URLs*: esa misma URL más `http://127.0.0.1:5174` para desarrollo.
3. **Authentication → Email**:
   - *Email OTP Expiration*: `86400`, para que el enlace de invitación dure 24 horas.
   - Contraseñas: mínimo 8 caracteres, con letras y números.
4. **Authentication → Email Templates**: copiar `supabase/templates/invite.html` y `recovery.html`, con los asuntos que define `config.toml`.
5. **SMTP con Resend** (*Authentication → Emails → SMTP Settings*):
   - Host `smtp.resend.com`, puerto `465`, usuario `resend`.
   - Contraseña: tu API key de Resend. Se pega solo en el panel; no va en el repositorio ni en el frontend.
   - Remitente: `onboarding@resend.dev` mientras no haya dominio verificado.
6. **Edge Function**:
   - Desplegar `invite-user` con `verify_jwt = false` (la función autoriza en su código).
   - Definir el secreto `APP_URL` (la URL pública de la app) en *Edge Functions → Secrets*.
   - `SUPABASE_URL` y las claves las inyecta Supabase.
7. **Primera persona de gerencia**:
   - Crearla en *Authentication → Users → Add user*.
   - Luego, en el editor SQL: `select public.registrar_gerencia_inicial('correo@marley.cl', 'Nombre');`. Esta función no se puede llamar desde la app.
8. **CRM simulado**: cargar `crm_empresas` (RUT, razón social, vendedor o KAM asignado, canal) desde el editor SQL. Es la cartera que después se activa desde la app.

### Límite de Resend sin dominio verificado

Sin dominio verificado, Resend solo entrega correos a la dirección dueña de la cuenta: *"You can only send testing emails to your own email address"*. En el proyecto remoto, entonces:

- Funciona: invitar o recuperar el acceso **del correo dueño de la cuenta Resend**.
- No se puede probar: invitar a cualquier otra persona, ni recuperar su acceso. Resend rechaza el envío y la app muestra "No pudimos enviar el correo"; la invitación queda revocada para reenviarla después.
- El flujo completo, con varios correos, está probado en local (Mailpit) por `scripts/e2e.mjs`.
- Además, el plan gratuito de Resend permite 100 correos al día y 3.000 al mes.

## Despliegue de migraciones

Las migraciones se aplican al proyecto remoto solo con confirmación explícita. Una vez aplicada una migración en el remoto, no se edita: los cambios van en una migración nueva.
