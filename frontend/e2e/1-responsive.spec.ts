// Responsive: cada pantalla del flujo, en cada ancho obligatorio. Falla si hay scroll horizontal,
// elementos fuera del ancho, objetivos táctiles menores de 44 px, campos con letra menor de 16 px
// o botones tapados. Guarda una captura de cada combinación y el resultado en test-results/.
import { appendFileSync, writeFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { CUENTAS, entrar, revisarPantalla } from "./ayudas";

const ANCHOS = [
  { nombre: "360", width: 360, height: 780 },
  { nombre: "390", width: 390, height: 844 },
  { nombre: "768", width: 768, height: 1024 },
  { nombre: "1024", width: 1024, height: 768 },
  { nombre: "1440", width: 1440, height: 900 },
  { nombre: "844h", width: 844, height: 390 },
];

interface Pantalla {
  nombre: string;
  ir: (page: Page) => Promise<void>;
}

const hash = (ruta: string) => async (page: Page) => {
  await page.goto(`/#${ruta}`);
  await page.waitForLoadState("networkidle");
};

// Abre el primer enlace que coincide (los IDs de alertas y pedidos se crean al cargar los datos).
const seguir = (desde: string, enlace: RegExp | string) => async (page: Page) => {
  await hash(desde)(page);
  await page.getByRole("link", { name: enlace }).first().click();
  await page.waitForLoadState("networkidle");
};

const PERFILES: { cuenta: string; pantallas: Pantalla[] }[] = [
  {
    cuenta: CUENTAS.andino,
    pantallas: [
      { nombre: "cliente · Reposición", ir: hash("/") },
      { nombre: "cliente · Pedido sugerido (telemetría)", ir: async (p) => {
        await hash("/")(p);
        await p.locator(".tarjeta-alerta", { hasText: "Andino Providencia" }).getByRole("link", { name: "Revisar y confirmar" }).click();
        await p.waitForLoadState("networkidle");
      } },
      { nombre: "cliente · Hacer pedido (sin telemetría)", ir: async (p) => {
        await hash("/")(p);
        await p.locator(".tarjeta-alerta", { hasText: "Andino Ñuñoa" }).getByRole("link", { name: "Revisar y confirmar" }).click();
        await p.waitForLoadState("networkidle");
      } },
      { nombre: "cliente · Stock por punto", ir: hash("/stock") },
      { nombre: "cliente · Avisos", ir: hash("/avisos") },
      { nombre: "cliente · Pedidos (vacío)", ir: hash("/pedidos") },
    ],
  },
  {
    cuenta: CUENTAS.oficinas,
    pantallas: [
      { nombre: "cliente · Pedidos", ir: hash("/pedidos") },
      { nombre: "cliente · Detalle de pedido", ir: seguir("/pedidos", /^MC-/) },
    ],
  },
  {
    cuenta: CUENTAS.hotel,
    pantallas: [
      { nombre: "cliente nombres largos · Reposición", ir: hash("/") },
      { nombre: "cliente nombres largos · Stock", ir: hash("/stock") },
      { nombre: "cliente nombres largos · Mi empresa", ir: hash("/empresa") },
    ],
  },
  {
    cuenta: CUENTAS.vendedora,
    pantallas: [
      { nombre: "vendedor · Hoy", ir: hash("/") },
      { nombre: "vendedor · Ajustar cantidades", ir: async (p) => {
        await hash("/")(p);
        await p.locator(".tarjeta-alerta", { hasText: "Andino Providencia" }).getByRole("button", { name: "Ajustar cantidades" }).click();
        await expect(p.getByRole("dialog")).toBeVisible();
      } },
      { nombre: "vendedor · Agotamientos", ir: hash("/agotamientos") },
      { nombre: "vendedor · Pedidos", ir: hash("/pedidos") },
    ],
  },
  {
    cuenta: CUENTAS.gerencia,
    pantallas: [
      { nombre: "gerencia · Supervisión", ir: hash("/") },
      { nombre: "gerencia · Pedidos", ir: hash("/pedidos") },
      { nombre: "gerencia · Clientes", ir: hash("/clientes") },
    ],
  },
];

const RESULTADOS = "test-results/responsive.jsonl";
test.beforeAll(() => writeFileSync(RESULTADOS, ""));

for (const perfil of PERFILES) {
  test.describe(perfil.cuenta, () => {
    for (const ancho of ANCHOS) {
      test(`${ancho.nombre}px`, async ({ page }) => {
        await page.setViewportSize({ width: ancho.width, height: ancho.height });
        await entrar(page, perfil.cuenta);
        const fallas: string[] = [];
        for (const pantalla of perfil.pantallas) {
          await pantalla.ir(page);
          await page.waitForTimeout(150);
          const problemas = await revisarPantalla(page);
          const archivo = `test-results/capturas/${ancho.nombre}/${pantalla.nombre.replace(/[^\p{L}\p{N}]+/gu, "-")}.png`;
          await page.screenshot({ path: archivo, fullPage: true });
          appendFileSync(RESULTADOS, JSON.stringify({ pantalla: pantalla.nombre, ancho: ancho.nombre, problemas, captura: archivo }) + "\n");
          for (const p of problemas) fallas.push(`${pantalla.nombre} · ${p.tipo}: ${p.detalle}`);
        }
        expect(fallas, fallas.join("\n")).toEqual([]);
      });
    }
  });
}
