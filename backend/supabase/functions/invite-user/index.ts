// Marley Conecta · Invitar a una persona.
//
// La autorización NO ocurre aquí: la función llama a public.crear_invitacion con la sesión de
// quien invita, y es la base de datos la que decide si puede (perfil, organización y cartera).
// Solo si esa llamada se acepta, se usa la clave secreta para crear la cuenta en Auth y enviar
// el correo. La clave secreta vive únicamente en el entorno de esta función.
import { createClient } from "npm:@supabase/supabase-js@2";

const PERFILES = ["gerencia", "vendedor", "kam", "cliente_admin", "cliente_integrante", "partner"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function clave(nombreNueva: string, nombreLegado: string): string {
  const nuevas = Deno.env.get(nombreNueva);
  if (nuevas) {
    try {
      const valor = JSON.parse(nuevas)["default"];
      if (valor) return valor;
    } catch {
      // formato inesperado: se usa la clave heredada
    }
  }
  const legado = Deno.env.get(nombreLegado);
  if (!legado) throw new Error(`Falta ${nombreNueva} o ${nombreLegado}`);
  return legado;
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const PUBLISHABLE = clave("SUPABASE_PUBLISHABLE_KEYS", "SUPABASE_ANON_KEY");
const SECRET = clave("SUPABASE_SECRET_KEYS", "SUPABASE_SERVICE_ROLE_KEY");
// URL pública de la app, a la que vuelve el enlace de invitación. Debe estar en la lista de
// redirecciones permitidas de Auth.
const APP_URL = Deno.env.get("APP_URL") ?? "";
const ORIGENES = APP_URL ? [new URL(APP_URL).origin] : [];

function cors(origen: string | null): Record<string, string> {
  const permitido = origen && ORIGENES.includes(origen) ? origen : ORIGENES[0] ?? "";
  return {
    "Access-Control-Allow-Origin": permitido,
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

function responder(req: Request, status: number, cuerpo: Record<string, unknown>) {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { "Content-Type": "application/json", ...cors(req.headers.get("Origin")) },
  });
}

// Traduce los errores de la base de datos a respuestas HTTP sin filtrar detalles internos.
function errorDeBase(req: Request, error: { code?: string; message?: string }) {
  if (error.code === "42501") return responder(req, 403, { error: "sin_permiso" });
  if (error.code === "P0002") return responder(req, 404, { error: "no_encontrado" });
  if (error.code === "P0001") return responder(req, 409, { error: error.message });
  console.error("crear_invitacion", error);
  return responder(req, 500, { error: "error_interno" });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors(req.headers.get("Origin")) });
  if (req.method !== "POST") return responder(req, 405, { error: "metodo_no_permitido" });
  if (!APP_URL) {
    console.error("APP_URL no está configurada");
    return responder(req, 500, { error: "error_interno" });
  }

  const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return responder(req, 401, { error: "sesion_requerida" });

  let cuerpo: { organization_id?: string; email?: string; nombre?: string; perfil?: string };
  try {
    cuerpo = await req.json();
  } catch {
    return responder(req, 400, { error: "solicitud_invalida" });
  }
  const { organization_id, email, nombre, perfil } = cuerpo;
  if (
    typeof organization_id !== "string" || !UUID.test(organization_id) ||
    typeof email !== "string" || email.length > 254 ||
    typeof nombre !== "string" || nombre.trim().length === 0 || nombre.length > 120 ||
    typeof perfil !== "string" || !PERFILES.includes(perfil)
  ) {
    return responder(req, 400, { error: "solicitud_invalida" });
  }

  // Cliente con la sesión de quien invita: RLS y las funciones aplican sus permisos.
  const comoUsuario = createClient(SUPABASE_URL, PUBLISHABLE, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: usuario, error: errorSesion } = await comoUsuario.auth.getUser(token);
  if (errorSesion || !usuario.user) return responder(req, 401, { error: "sesion_expirada" });

  const { data: filas, error } = await comoUsuario.rpc("crear_invitacion", {
    p_org: organization_id,
    p_email: email,
    p_nombre: nombre,
    p_perfil: perfil,
  });
  if (error) return errorDeBase(req, error);
  const { invitacion_id, reemplazar_usuario } = (filas as { invitacion_id: string; reemplazar_usuario: string | null }[])[0];

  const admin = createClient(SUPABASE_URL, SECRET, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Reenvío: la cuenta invitada nunca entró. Se recrea para emitir un enlace nuevo.
  // crear_invitacion ya verificó que es de la misma organización y perfil, y que no ha iniciado sesión.
  if (reemplazar_usuario) {
    const { error: errorBorrar } = await admin.auth.admin.deleteUser(reemplazar_usuario);
    if (errorBorrar) {
      console.error("deleteUser", errorBorrar);
      await admin.from("invitations").update({ estado: "revocada" }).eq("id", invitacion_id);
      return responder(req, 500, { error: "error_interno" });
    }
  }

  const { error: errorInvitar } = await admin.auth.admin.inviteUserByEmail(email.trim().toLowerCase(), {
    data: { invitation_id: invitacion_id },
    redirectTo: APP_URL,
  });
  if (errorInvitar) {
    console.error("inviteUserByEmail", errorInvitar);
    await admin.from("invitations").update({ estado: "revocada" }).eq("id", invitacion_id);
    const limite = errorInvitar.status === 429 || /rate limit/i.test(errorInvitar.message);
    return responder(req, limite ? 429 : 502, { error: limite ? "limite_de_correos" : "no_se_pudo_enviar" });
  }

  return responder(req, 200, { invitacion_id });
});
