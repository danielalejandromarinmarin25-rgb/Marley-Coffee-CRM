// Recarga la base local con seed.sql + seed_demo.sql para que cada corrida parta igual, y espera
// a que Auth vuelva a responder (db reset reinicia sus contenedores).
import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync } from "node:fs";

function variable(nombre: string): string {
  const linea = readFileSync(".env.e2e.local", "utf8").split("\n").find((l) => l.startsWith(`${nombre}=`));
  if (!linea) throw new Error(`Falta ${nombre} en frontend/.env.e2e.local`);
  return linea.slice(nombre.length + 1).trim();
}

async function esperarAuth() {
  const url = variable("VITE_SUPABASE_URL");
  const clave = variable("VITE_SUPABASE_ANON_KEY");
  for (let intento = 0; intento < 60; intento++) {
    try {
      const r = await fetch(`${url}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: { apikey: clave, "Content-Type": "application/json" },
        body: JSON.stringify({ email: "admin@andino.local", password: "marley-local-1" }),
      });
      if (r.ok) return;
    } catch {
      // Auth aún no levanta.
    }
    await new Promise((listo) => setTimeout(listo, 1000));
  }
  throw new Error("Auth local no respondió después de recargar la base");
}

export default async function preparar() {
  if (!variable("VITE_SUPABASE_URL").includes("127.0.0.1")) {
    throw new Error(".env.e2e.local debe apuntar al Supabase local: las pruebas recargan la base");
  }
  execSync("npx pnpm@10 run demo:preparar", { cwd: "../backend", stdio: "ignore" });
  await esperarAuth();
  rmSync("test-results/capturas", { recursive: true, force: true });
  mkdirSync("test-results/capturas", { recursive: true });
}
