# Marley Conecta · frontend

React + TypeScript + Vite. Una sola app para las tres capas (gerencia, vendedores y KAM, clientes B2B) más el partner. Cada cuenta entra con su correo y contraseña y llega solo a la navegación de su perfil, que lee del servidor. No hay forma de cambiar de perfil desde la interfaz.

## Configurar

```sh
cd frontend
cp .env.example .env.local    # completar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
npx pnpm@10 install
npx pnpm@10 dev               # http://127.0.0.1:5174
```

| Variable | Dónde se obtiene | Notas |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Supabase → Project Settings → API | Pública |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Project Settings → API Keys (publicable `sb_publishable_…` o `anon`) | Pública por diseño: lo que protege los datos es RLS |

Todo lo que empieza con `VITE_` termina dentro del JavaScript que descarga el navegador. La clave secreta (`service_role` o `sb_secret_…`) y la API key de Resend **nunca** van aquí: viven solo en Supabase (Edge Functions y SMTP de Auth). `pnpm build` falla si encuentra una clave secreta en `dist/`.

Sin las variables, la app muestra una pantalla que indica qué falta.

## Pruebas y build

```sh
npx pnpm@10 test             # reglas de dominio y formato de reposición
npx pnpm@10 build            # tipos, build y verificación de claves en dist/
npx pnpm@10 test:navegador   # Playwright: responsive (6 anchos) y ruta de la demo
```

`test:navegador` necesita el Supabase local levantado (`backend/`, `npx pnpm@10 db:start`) y un `frontend/.env.e2e.local` con la `API_URL` y la `PUBLISHABLE_KEY` locales. Usa su propio servidor (`vite --mode e2e`, puerto 5175), así nunca toca el proyecto remoto aunque `.env.local` apunte a él. Antes de empezar recarga la base local.

- **Responsive.** Recorre 18 pantallas en 360, 390, 768, 1024 y 1440 px, más 844×390 en horizontal. Falla si hay scroll horizontal, elementos fuera del ancho, objetivos táctiles de menos de 44 px, campos con letra de menos de 16 px o botones tapados. Deja capturas en `test-results/capturas/`.
- **Ruta de la demo.** Gerencia ve la crítica → la vendedora ajusta → el cliente confirma en ≤ 3 clics (se cuentan) → el pedido avanza → se repite sin telemetría.

Las pruebas de acceso (aislamiento entre perfiles y empresas) están en `backend/`.

## Pantallas por perfil

La pantalla de entrada de cada perfil es su tarea del día. En el celular la navegación va en una barra inferior; en tablet y escritorio, en una barra lateral.

| Perfil | Navegación |
| --- | --- |
| Gerencia | **Supervisión** (alertas críticas y estado de pedidos) · Pedidos · Clientes · Equipo comercial · Perfil |
| Vendedor y KAM | **Hoy** (a quién contactar, WhatsApp, ajustar cantidades) · Agotamientos proyectados · Pedidos · Clientes · Perfil. El KAM edita las máquinas; el vendedor solo las ve |
| Cliente administrador | **Reposición** (aviso y pedido sugerido, confirmar) · Pedidos · Stock por punto · Empresa (con su ejecutivo y Mi equipo) · Perfil |
| Cliente integrante | Lo mismo que el administrador, en solo lectura en Mi equipo y en los datos de la empresa |
| Partner | Mis puntos · Perfil |

Todos los perfiles tienen la campana de avisos. Solo el cliente ve el botón "Confirmar pedido", y el servidor lo exige igual.

Pantallas comunes:

- Iniciar sesión, recuperar acceso, activar cuenta por invitación y definir contraseña nueva.
- Aviso de sesión expirada y de cuenta desactivada.
- Sin permiso, para una ruta de otra capa abierta por enlace directo.
- No encontrado, para una ruta inexistente o un registro fuera de alcance.

## Estructura

```text
src/
  app/          App, rutas por capa y shell de navegación
  auth/         sesión (AuthProvider), perfiles y mensajes de error
  lib/          cliente de Supabase, tipos generados de la base, consultas e invitaciones
  features/     acceso, inicio, empresas, equipo, perfil, errores y el flujo de reposición
                (reposicion, pedidos, stock, comercial, supervision, notificaciones)
e2e/            pruebas en navegador (Playwright)
  components/   componentes de interfaz reutilizables
  styles/       tokens visuales y responsive
```

### Módulos del prototipo anterior

Los módulos del prototipo de vendedores siguen en el repositorio como referencia de diseño para la Fase 3, pero no se compilan ni se publican (ver `exclude` en `tsconfig.json`):

- Inicio, clientes 360°, agenda y visitas.
- Pedidos, alertas, oportunidades y casos.
- El store con IndexedDB, la cola offline y los mocks.

El service worker offline quedó desactivado. `public/sw.js` ahora solo borra las cachés y se desinstala en los navegadores que lo tenían instalado.

## Publicación

El workflow de GitHub Pages necesita las variables del repositorio `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (*Settings → Secrets and variables → Actions → Variables*). La URL publicada debe estar en las Redirect URLs de Supabase Auth y en el secreto `APP_URL` de la Edge Function.
