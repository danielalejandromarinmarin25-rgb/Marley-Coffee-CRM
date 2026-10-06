// Prueba de punta a punta contra el stack LOCAL de Supabase (supabase start + seed.sql).
// Recorre los flujos de cuenta como lo haría la app: solo con la clave publicable, el JWT de
// cada persona y los correos que llegan a Mailpit. No usa la clave secreta.
// Requiere la base recién reiniciada (pnpm db:reset), porque activa una empresa del seed.
import { execFileSync } from "node:child_process";
import { test } from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";

const estado = Object.fromEntries(
  execFileSync("supabase", ["status", "--workdir", ".", "-o", "env"], { encoding: "utf8" })
    .split("\n")
    .map((l) => l.match(/^([A-Z_]+)="?([^"]*)"?$/))
    .filter(Boolean)
    .map((m) => [m[1], m[2]]),
);
const URL_API = estado.API_URL;
const CLAVE_PUBLICA = estado.PUBLISHABLE_KEY || estado.ANON_KEY;
const MAILPIT = estado.MAILPIT_URL || estado.INBUCKET_URL;
const CLAVE = "marley-local-1";
const ORG_SUR = "20000000-0000-4000-8000-00000000000b";

function cliente() {
  return createClient(URL_API, CLAVE_PUBLICA, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function entrar(email, clave = CLAVE) {
  const c = cliente();
  const { error } = await c.auth.signInWithPassword({ email, password: clave });
  assert.equal(error, null, `inicio de sesión de ${email}: ${error?.message}`);
  return c;
}

// Espera el último correo a un destinatario y devuelve el enlace de Auth que trae.
async function enlaceDelCorreo(destinatario) {
  for (let intento = 0; intento < 20; intento++) {
    const r = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${destinatario}`)}`);
    const { messages = [] } = await r.json();
    if (messages.length) {
      const m = await (await fetch(`${MAILPIT}/api/v1/message/${messages[0].ID}`)).json();
      const enlace = m.HTML.match(/href="([^"]+\/auth\/v1\/verify[^"]+)"/)?.[1];
      assert.ok(enlace, "el correo trae un enlace de verificación");
      return { asunto: m.Subject, enlace: enlace.replaceAll("&amp;", "&") };
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`No llegó correo a ${destinatario}`);
}

// Abre el enlace del correo como lo haría el navegador y devuelve los datos que Auth deja en el fragmento.
async function seguirEnlace(enlace) {
  const r = await fetch(enlace, { redirect: "manual" });
  const destino = r.headers.get("location");
  assert.ok(destino, "el enlace redirige a la app");
  const fragmento = new URLSearchParams(new URL(destino).hash.slice(1));
  return { destino, fragmento };
}

async function invitar(c, cuerpo) {
  const { data } = await c.auth.getSession();
  const r = await fetch(`${URL_API}/functions/v1/invite-user`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: CLAVE_PUBLICA,
      Authorization: `Bearer ${data.session.access_token}`,
    },
    body: JSON.stringify(cuerpo),
  });
  return { status: r.status, cuerpo: await r.json() };
}

const sufijo = Date.now().toString(36);
const correoAdmin = `admin.espiga.${sufijo}@prueba.local`;

test("inicio de sesión: credenciales correctas e incorrectas", async () => {
  const c = await entrar("gerencia@marley.local");
  const { data } = await c.rpc("mi_sesion");
  assert.equal(data[0].perfil, "gerencia");
  const { error } = await cliente().auth.signInWithPassword({ email: "gerencia@marley.local", password: "otra-clave-9" });
  assert.ok(error, "una contraseña incorrecta no inicia sesión");
});

test("el registro público está cerrado: solo se entra por invitación", async () => {
  const { error } = await cliente().auth.signUp({ email: `intruso.${sufijo}@prueba.local`, password: "clave-intrusa-1" });
  assert.ok(error, "signUp debe fallar");
});

test("activar empresa e invitar a su administrador, activar la cuenta por correo", async () => {
  const vendedora = await entrar("vendedora@marley.local");
  const { data: org, error } = await vendedora.rpc("activar_empresa", { p_rut: "76333333-3" });
  assert.equal(error, null, error?.message);

  const r = await invitar(vendedora, {
    organization_id: org, email: correoAdmin, nombre: "Elena Espiga", perfil: "cliente_admin",
  });
  assert.equal(r.status, 200, JSON.stringify(r.cuerpo));

  const { asunto, enlace } = await enlaceDelCorreo(correoAdmin);
  assert.equal(asunto, "Te invitaron a Marley Conecta");
  const { fragmento } = await seguirEnlace(enlace);
  assert.equal(fragmento.get("type"), "invite");

  const nueva = cliente();
  await nueva.auth.setSession({
    access_token: fragmento.get("access_token"), refresh_token: fragmento.get("refresh_token"),
  });
  // Antes de definir contraseña y aceptar, la cuenta no ve datos.
  const antes = await nueva.from("organizations").select("id");
  assert.deepEqual(antes.data, []);
  const { error: errorClave } = await nueva.auth.updateUser({ password: "clave-espiga-1" });
  assert.equal(errorClave, null, errorClave?.message);
  const { data: perfil, error: errorAceptar } = await nueva.rpc("aceptar_invitacion");
  assert.equal(errorAceptar, null, errorAceptar?.message);
  assert.equal(perfil, "cliente_admin");

  // Ya activa: entra con su contraseña y ve solo su empresa.
  const admin = await entrar(correoAdmin, "clave-espiga-1");
  const { data: orgs } = await admin.from("organizations").select("id");
  assert.deepEqual(orgs.map((o) => o.id), [org]);
});

test("el enlace de invitación funciona una sola vez", async () => {
  const { enlace } = await enlaceDelCorreo(correoAdmin);
  const { fragmento } = await seguirEnlace(enlace);
  assert.equal(fragmento.get("access_token"), null);
  assert.ok(fragmento.get("error_code"), "un enlace usado devuelve un error");
});

test("invitar: permisos comprobados en el servidor", async () => {
  const vendedora = await entrar("vendedora@marley.local");
  const fuera = await invitar(vendedora, {
    organization_id: ORG_SUR, email: `x.${sufijo}@prueba.local`, nombre: "X", perfil: "cliente_admin",
  });
  assert.equal(fuera.status, 404, "fuera de la cartera responde no encontrado");

  const integrante = await entrar("barista@andino.local");
  const { data: sesion } = await integrante.rpc("mi_sesion");
  const soloLectura = await invitar(integrante, {
    organization_id: sesion[0].organization_id, email: `y.${sufijo}@prueba.local`, nombre: "Y", perfil: "cliente_integrante",
  });
  assert.equal(soloLectura.status, 403, "el integrante no invita");

  const sinSesion = await fetch(`${URL_API}/functions/v1/invite-user`, {
    method: "POST", headers: { apikey: CLAVE_PUBLICA, "Content-Type": "application/json" }, body: "{}",
  });
  assert.equal(sinSesion.status, 401, "sin sesión no se invita");
});

test("cambio de ID por la API: no se lee ni se modifica lo ajeno", async () => {
  const admin = await entrar("admin@andino.local");
  const leer = await admin.from("organizations").select("*").eq("id", ORG_SUR);
  assert.deepEqual(leer.data, [], "leer otra empresa por ID devuelve vacío");
  const editar = await admin.from("organizations").update({ nombre_comercial: "Hackeado" }).eq("id", ORG_SUR).select();
  assert.deepEqual(editar.data, [], "editar otra empresa por ID no afecta filas");
  const escalar = await admin.from("memberships").update({ perfil: "gerencia" }).eq("user_id", (await admin.auth.getUser()).data.user.id);
  assert.ok(escalar.error, "cambiarse el perfil falla");
  const gerencia = await entrar("gerencia@marley.local");
  const { data } = await gerencia.from("organizations").select("nombre_comercial").eq("id", ORG_SUR);
  assert.equal(data[0].nombre_comercial, "Oficinas del Sur", "la otra empresa quedó intacta");
});

test("sin sesión no se lee nada", async () => {
  const anonimo = cliente();
  const { data, error } = await anonimo.from("organizations").select("id");
  assert.ok(error || data.length === 0);
});

test("recuperar acceso por correo", async () => {
  const c = cliente();
  const { error } = await c.auth.resetPasswordForEmail("kam@marley.local", { redirectTo: "http://127.0.0.1:5174" });
  assert.equal(error, null, error?.message);
  const { asunto, enlace } = await enlaceDelCorreo("kam@marley.local");
  assert.equal(asunto, "Recupera tu acceso a Marley Conecta");
  const { fragmento } = await seguirEnlace(enlace);
  assert.equal(fragmento.get("type"), "recovery");
  const r = cliente();
  await r.auth.setSession({ access_token: fragmento.get("access_token"), refresh_token: fragmento.get("refresh_token") });
  assert.equal((await r.auth.updateUser({ password: "clave-kam-nueva-1" })).error, null);
  await entrar("kam@marley.local", "clave-kam-nueva-1");
});

test("cerrar sesión invalida el refresh token", async () => {
  const c = await entrar("admin@oficinasur.local");
  const { data } = await c.auth.getSession();
  const refresh = data.session.refresh_token;
  await c.auth.signOut();
  const otra = cliente();
  const { error } = await otra.auth.refreshSession({ refresh_token: refresh });
  assert.ok(error, "la sesión cerrada no se puede renovar");
});
