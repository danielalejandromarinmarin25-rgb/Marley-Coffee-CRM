// Prueba de punta a punta del flujo de reposición contra el Supabase LOCAL (seed.sql + seed_demo.sql).
// Usa la API como la app: clave publicable y la sesión de cada persona. Cubre lo que pgTAP no puede:
// dos confirmaciones realmente simultáneas desde conexiones distintas, y la Edge Function de correo.
// Requiere la base recién reiniciada (pnpm db:reset). Modifica Ruta Sur y Los Aromos, no la ruta de la demo.
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
const CLAVE_SECRETA = estado.SERVICE_ROLE_KEY || estado.SECRET_KEY;

const PUNTO_BUIN = "30000000-0000-4000-8000-0000000000e1";
const PUNTO_FLORIDA = "30000000-0000-4000-8000-0000000000f2";
const PUNTO_PROVIDENCIA = "30000000-0000-4000-8000-0000000000a1";

async function entrar(email) {
  const c = createClient(URL_API, CLAVE_PUBLICA, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await c.auth.signInWithPassword({ email, password: "marley-local-1" });
  assert.equal(error, null, `inicio de sesión de ${email}: ${error?.message}`);
  return c;
}

async function sugeridoDe(c, punto) {
  const { data, error } = await c
    .from("alertas")
    .select("id, estado, pedidos_sugeridos(id, lineas_sugeridas(producto_id, bolsas, bolsas_sugeridas))")
    .eq("point_id", punto)
    .in("estado", ["abierta", "critica", "pospuesta"])
    .single();
  assert.equal(error, null, error?.message);
  return { alerta: data.id, sugerido: data.pedidos_sugeridos.id, lineas: data.pedidos_sugeridos.lineas_sugeridas };
}

test("el vendedor no puede confirmar por la API, ni escribiendo la tabla", async () => {
  const vendedora = await entrar("vendedora@marley.local");
  const { sugerido } = await sugeridoDe(vendedora, PUNTO_PROVIDENCIA);
  const confirmar = await vendedora.rpc("confirmar_pedido", { p_sugerido: sugerido });
  assert.equal(confirmar.error?.code, "42501");
  const insertar = await vendedora.from("pedidos").insert({ organization_id: "20000000-0000-4000-8000-00000000000a", point_id: PUNTO_PROVIDENCIA });
  assert.ok(insertar.error, "escribir pedidos directo falla");
});

test("el vendedor ajusta y el cliente ve el cambio antes de confirmar", async () => {
  const vendedora = await entrar("vendedora@marley.local");
  const { sugerido, lineas } = await sugeridoDe(vendedora, PUNTO_FLORIDA);
  const nueva = lineas[0].bolsas + 2;
  const { error } = await vendedora.rpc("ajustar_pedido_sugerido", {
    p_sugerido: sugerido,
    p_lineas: [{ producto_id: lineas[0].producto_id, bolsas: nueva }],
  });
  assert.equal(error, null, error?.message);

  const cliente = await entrar("admin@losaromos.local");
  const { data } = await cliente
    .from("pedidos_sugeridos")
    .select("ajustado_por_nombre, lineas_sugeridas(bolsas, bolsas_sugeridas)")
    .eq("id", sugerido)
    .single();
  assert.equal(data.ajustado_por_nombre, "Valentina Vendedora");
  assert.equal(data.lineas_sugeridas[0].bolsas, nueva);
  const { data: avisos } = await cliente.from("notificaciones").select("tipo").eq("tipo", "pedido_ajustado");
  assert.equal(avisos.length, 1, "el cliente recibe el aviso del ajuste");
});

test("dos confirmaciones simultáneas crean un solo pedido", async () => {
  const [a, b] = await Promise.all([entrar("admin@rutasur.local"), entrar("admin@rutasur.local")]);
  const { alerta, sugerido } = await sugeridoDe(a, PUNTO_BUIN);
  const resultados = await Promise.all([
    a.rpc("confirmar_pedido", { p_sugerido: sugerido }),
    b.rpc("confirmar_pedido", { p_sugerido: sugerido }),
  ]);
  const ok = resultados.filter((r) => !r.error);
  const rechazados = resultados.filter((r) => r.error);
  assert.equal(ok.length, 1, "una confirmación gana");
  assert.equal(rechazados.length, 1, "la otra se rechaza");
  assert.equal(rechazados[0].error.message, "pedido_ya_confirmado");
  const { data } = await a.from("pedidos").select("id, codigo, estado").eq("alerta_id", alerta);
  assert.equal(data.length, 1, "existe un solo pedido para la alerta");
  assert.equal(data[0].estado, "recibido");
});

test("una empresa no ve alertas ni pedidos de otra, aunque pida el ID", async () => {
  const andino = await entrar("admin@andino.local");
  const { data: alertas } = await andino.from("alertas").select("id").eq("point_id", PUNTO_BUIN);
  assert.deepEqual(alertas, []);
  const { data: pedidos } = await andino.from("pedidos").select("id").eq("point_id", PUNTO_BUIN);
  assert.deepEqual(pedidos, []);
});

test("el resumen de correo agrupa por persona y no repite avisos", async () => {
  const llamar = () =>
    fetch(`${URL_API}/functions/v1/enviar-resumen`, {
      method: "POST",
      headers: { Authorization: `Bearer ${CLAVE_SECRETA}`, "Content-Type": "application/json" },
      body: "{}",
    }).then(async (r) => ({ status: r.status, cuerpo: await r.json() }));

  const sinClave = await fetch(`${URL_API}/functions/v1/enviar-resumen`, { method: "POST", body: "{}" });
  assert.equal(sinClave.status, 401, "sin la clave del servidor no se envía nada");

  const primera = await llamar();
  assert.equal(primera.status, 200, JSON.stringify(primera.cuerpo));
  assert.ok(primera.cuerpo.enviados >= 1, "hay resúmenes pendientes");
  assert.ok(primera.cuerpo.avisos > primera.cuerpo.enviados, "cada correo agrupa varios avisos");
  const segunda = await llamar();
  assert.equal(segunda.cuerpo.enviados, 0, "una segunda corrida no repite correos");
});
