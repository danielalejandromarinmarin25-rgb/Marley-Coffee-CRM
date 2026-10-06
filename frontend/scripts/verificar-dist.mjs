// Falla el build si el paquete publicado contiene una clave secreta de Supabase:
// una clave sb_secret_… o un JWT con rol service_role (clave heredada).
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = fileURLToPath(new URL("../dist/", import.meta.url));
const archivos = (dir) =>
  readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? archivos(join(dir, n)) : [join(dir, n)]));

const hallazgos = [];
for (const archivo of archivos(raiz)) {
  const texto = readFileSync(archivo, "utf8");
  if (/sb_secret_[A-Za-z0-9_-]{10,}/.test(texto)) hallazgos.push(`${archivo}: clave sb_secret_`);
  for (const [jwt] of texto.matchAll(/eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g)) {
    try {
      const carga = JSON.parse(Buffer.from(jwt.split(".")[1], "base64url").toString());
      if (carga.role === "service_role") hallazgos.push(`${archivo}: JWT service_role`);
    } catch {
      // no es un JWT válido
    }
  }
  if (/SERVICE_ROLE|SECRET_KEY|RESEND_API_KEY/.test(texto)) hallazgos.push(`${archivo}: nombre de variable secreta`);
}

if (hallazgos.length) {
  console.error("Se encontraron claves secretas en dist/. No publiques este build:\n" + hallazgos.join("\n"));
  process.exit(1);
}
console.log("dist/ sin claves secretas.");
