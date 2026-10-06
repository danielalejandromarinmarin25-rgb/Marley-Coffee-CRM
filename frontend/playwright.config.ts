// Pruebas en navegador real (Chromium) contra el Supabase LOCAL con los datos de seed_demo.sql.
//   npx pnpm@10 test:navegador
// Antes de correr: `supabase start` en backend/. El setup global recarga la base (db reset).
// Usan su propio servidor (modo e2e, puerto 5175) y frontend/.env.e2e.local, que apunta SIEMPRE al
// stack local: así nunca tocan el proyecto remoto aunque .env.local apunte a él.
// Capturas y resultados en test-results/ (ignorado por git).
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  globalSetup: "./e2e/preparar.ts",
  workers: 1,
  fullyParallel: false,
  timeout: 120_000,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:5175",
    locale: "es-CL",
    timezoneId: "America/Santiago",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npx pnpm@10 exec vite --mode e2e --host 127.0.0.1 --port 5175 --strictPort",
    url: "http://127.0.0.1:5175",
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
