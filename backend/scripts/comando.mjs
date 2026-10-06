// Comandos internos de Marley Conecta. No están en la interfaz: los usa el equipo para la demo.
//
//   pnpm reposicion:calcular              recalcula saldos y alertas (lo mismo que hace pg_cron cada día)
//   pnpm pedido:avanzar MC-01041          pasa el pedido al estado siguiente
//   pnpm pedido:avanzar MC-01041 entregado   o directo a un estado (recibido, en_preparacion, en_reparto, entregado)
//   pnpm correo:resumen                   envía el resumen de avisos por correo (modo prueba sin RESEND_API_KEY)
//
// Por omisión actúa sobre el Supabase LOCAL (lee las claves de `supabase status`). Para el proyecto
// remoto: SUPABASE_URL=… SUPABASE_SECRET_KEY=… pnpm pedido:avanzar MC-01041 (la clave secreta solo
// en la terminal, nunca en un archivo versionado).
import { execFileSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

function credenciales() {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY) {
    return { url: process.env.SUPABASE_URL, secreta: process.env.SUPABASE_SECRET_KEY };
  }
  const estado = Object.fromEntries(
    execFileSync("supabase", ["status", "--workdir", ".", "-o", "env"], { encoding: "utf8" })
      .split("\n")
      .map((l) => l.match(/^([A-Z_]+)="?([^"]*)"?$/))
      .filter(Boolean)
      .map((m) => [m[1], m[2]]),
  );
  return { url: estado.API_URL, secreta: estado.SERVICE_ROLE_KEY || estado.SECRET_KEY };
}

const NOMBRE_ESTADO = {
  recibido: "Recibido",
  en_preparacion: "En preparación",
  en_reparto: "En reparto",
  entregado: "Entregado",
};

const [comando, ...args] = process.argv.slice(2);
const { url, secreta } = credenciales();
const admin = createClient(url, secreta, { auth: { persistSession: false } });

function fallar(error) {
  console.error(`✗ ${error.message}${error.details ? ` (${error.details})` : ""}`);
  process.exit(1);
}

switch (comando) {
  case "calcular": {
    const { data, error } = await admin.rpc("recalcular_reposicion");
    if (error) fallar(error);
    console.log(
      `✓ Cálculo hecho: ${data.cafes_evaluados} cafés por punto evaluados, ${data.alertas_nuevas} alertas nuevas, ` +
        `${data.alertas_criticas} pasaron a críticas, ${data.alertas_resueltas} resueltas.`,
    );
    break;
  }
  case "avanzar": {
    const [codigo, estado] = args;
    if (!codigo) {
      const { data } = await admin.from("pedidos").select("codigo, estado").neq("estado", "entregado").order("codigo");
      console.log("Uso: pnpm pedido:avanzar <código> [estado]\nPedidos abiertos:");
      for (const p of data ?? []) console.log(`  ${p.codigo} · ${NOMBRE_ESTADO[p.estado]}`);
      process.exit(1);
    }
    const { data, error } = await admin.rpc("avanzar_pedido", { p_codigo: codigo, p_estado: estado ?? null });
    if (error) fallar(error);
    console.log(`✓ ${codigo.toUpperCase()} → ${NOMBRE_ESTADO[data]}`);
    break;
  }
  case "correo": {
    const r = await fetch(`${url}/functions/v1/enviar-resumen`, {
      method: "POST",
      headers: { Authorization: `Bearer ${secreta}`, "Content-Type": "application/json" },
      body: "{}",
    });
    const cuerpo = await r.json().catch(() => ({}));
    if (!r.ok) fallar({ message: `enviar-resumen respondió ${r.status}: ${JSON.stringify(cuerpo)}` });
    console.log(
      `✓ Resumen (${cuerpo.modo === "real" ? "envío real" : "modo prueba, sin enviar"}): ` +
        `${cuerpo.enviados} correos con ${cuerpo.avisos} avisos${cuerpo.fallidos ? `, ${cuerpo.fallidos} fallidos` : ""}.`,
    );
    break;
  }
  default:
    console.error("Comandos: calcular · avanzar <código> [estado] · correo");
    process.exit(1);
}
