# Marley Conecta

Plataforma B2B de Marley Coffee (proyecto Duoc UC). Flujo principal del MVP: reposición inteligente (alerta → pedido sugerido → seguimiento).

## Estructura

| Carpeta | Contenido |
| --- | --- |
| `frontend/` | App React + TypeScript + Vite (base: ex Marley Vendedores), con sesión real y navegación por perfil. Ver [frontend/README.md](frontend/README.md). |
| `backend/` | Supabase: migraciones, Row Level Security, Edge Function de invitaciones y pruebas de acceso. Ver [backend/README.md](backend/README.md). |
| `shared/` | Tipos y contratos compartidos entre frontend y backend. |
| `legacy/` | Código anterior, solo de referencia: app original React/Express (con Gemini) y el prototipo HTML de Conecta. No se construye ni se despliega, salvo el prototipo HTML. |

## Ejecutar en local

```sh
cd backend && npx pnpm@10 install && npx pnpm@10 db:start   # requiere Docker
cd ../frontend && cp .env.example .env.local                # completar con los datos de `supabase status`
npx pnpm@10 install && npx pnpm@10 dev
```

Pruebas: `cd backend && npx pnpm@10 test` (aislamiento entre perfiles y empresas) y `cd frontend && npx pnpm@10 test && npx pnpm@10 build`.

## Credenciales

No versionar `.env` ni claves. Los archivos `.env*` están ignorados salvo `.env.example`.

| Variable | Dónde va | Pública |
| --- | --- | --- |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | `frontend/.env.local` y variables del repositorio para GitHub Pages | Sí: viajan al navegador; protege RLS |
| Clave secreta de Supabase (`service_role` / `sb_secret_…`) | Solo la inyecta Supabase en la Edge Function | **No** |
| API key de Resend | Supabase → Auth → SMTP y secreto `RESEND_API_KEY` de la Edge Function `enviar-resumen` (local: `backend/supabase/functions/.env`) | **No** |
| `APP_URL` | Secreto de la Edge Function `invite-user` (local: `backend/supabase/functions/.env`) | Sí |

Todo lo que lleve el prefijo `VITE_` queda publicado en el navegador. El build del frontend falla si detecta una clave secreta en `dist/`.

## Estado

Fase 1 (cimientos de acceso y seguridad):

- Inicio de sesión real, invitaciones, organizaciones y perfiles.
- Permisos en la base (RLS) e historial de acciones.
- Pruebas automáticas de aislamiento entre perfiles y empresas.

Fase 3 (flujo de reposición), verificada en local:

- Alertas por punto y café, con la regla de cobertura y la fuente del dato por punto (telemetría o declarado por el cliente).
- Pedido sugerido que el vendedor o KAM puede ajustar y que solo el cliente confirma.
- Pedidos con su estado, avisos en la app y resumen por correo con Resend.
- Pantallas responsive para cliente, vendedor o KAM y gerencia.

Ver `backend/README.md` (regla, simplificaciones, comandos y datos de la demo) y `frontend/README.md` (pantallas y pruebas en navegador). Falta aplicarla al Supabase remoto.
