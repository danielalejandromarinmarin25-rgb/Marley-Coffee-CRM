// Ruta de la demo, de principio a fin, con los datos del seed:
//   1. Gerencia ve la alerta crítica.  2. La vendedora la ve y ajusta una cantidad.
//   3. El cliente recibe el aviso, ve el cambio y confirma (se cuentan los clics: máximo tres).
//   4. El cliente ve avanzar el estado del pedido.  5. Se repite con un punto sin telemetría.
// Los pasos 1–4 en celular (390 px) y el 5 en escritorio (1440 px); gerencia en ambos.
import { expect, test, type Locator, type Page } from "@playwright/test";
import { avanzarPedido, CUENTAS, entrar } from "./ayudas";

test.describe.configure({ mode: "serial" });

const CELULAR = { width: 390, height: 844 };
const ESCRITORIO = { width: 1440, height: 900 };

// Cuenta cada clic de la persona.
function contador() {
  let n = 0;
  return {
    clic: async (l: Locator) => {
      n++;
      await l.click();
    },
    get total() {
      return n;
    },
  };
}

// El botón está dentro de la pantalla sin desplazarse y nada lo tapa.
async function visibleSinScroll(page: Page, boton: Locator) {
  const caja = (await boton.boundingBox())!;
  const vista = page.viewportSize()!;
  expect(caja.y + caja.height, "el botón principal cabe en la pantalla").toBeLessThanOrEqual(vista.height);
  const encima = await page.evaluate(
    ([x, y]) => document.elementFromPoint(x, y)?.closest("button")?.textContent ?? "",
    [caja.x + caja.width / 2, caja.y + caja.height / 2],
  );
  expect(encima).toContain("Confirmar pedido");
}

let codigoPedido = "";

for (const vista of [CELULAR, ESCRITORIO]) {
  test(`1. gerencia ve la alerta crítica (${vista.width}px)`, async ({ page }) => {
    await page.setViewportSize(vista);
    await entrar(page, CUENTAS.gerencia);
    const criticas = page.locator("section", { has: page.getByRole("heading", { name: "Alertas críticas" }) });
    await expect(criticas.getByText("Andino Providencia")).toBeVisible();
    await expect(criticas.getByText("Crítica", { exact: true })).toBeVisible();
    await expect(criticas.getByText("Valentina Vendedora")).toBeVisible();
    await expect(page.getByRole("button", { name: /Confirmar/ })).toHaveCount(0);
  });
}

test("2. la vendedora ve la alerta, tiene WhatsApp en un toque y ajusta una cantidad (390px)", async ({ page }) => {
  await page.setViewportSize(CELULAR);
  await entrar(page, CUENTAS.vendedora);
  const tarjeta = page.locator(".tarjeta-alerta", { hasText: "Andino Providencia" });
  await expect(tarjeta.getByText("Crítica", { exact: true })).toBeVisible();
  await expect(tarjeta.getByText(/Telemetría · /)).toBeVisible();

  const whatsapp = tarjeta.getByRole("link", { name: "WhatsApp" });
  const enlace = await whatsapp.getAttribute("href");
  expect(enlace).toMatch(/^https:\/\/wa\.me\/56961234400\?text=/);
  expect(decodeURIComponent(enlace!.split("text=")[1])).toContain("10 bolsas de Buffalo Soldier");

  // El vendedor no tiene cómo confirmar.
  await expect(page.getByRole("button", { name: /Confirmar/ })).toHaveCount(0);

  await tarjeta.getByRole("button", { name: "Ajustar cantidades" }).click();
  const hoja = page.getByRole("dialog", { name: "Ajustar pedido sugerido" });
  await expect(hoja).toBeVisible();
  await hoja.getByRole("button", { name: /Agregar una · Buffalo Soldier/ }).click();
  await hoja.getByRole("button", { name: /Guardar · 11 bolsas/ }).click();
  await expect(page.getByRole("status").filter({ hasText: "El cliente lo verá antes de confirmar" })).toBeVisible();
  await expect(tarjeta.getByText("11 bolsas de Buffalo Soldier")).toBeVisible();

  // Esc cierra la hoja y el foco vuelve al botón que la abrió.
  await tarjeta.getByRole("button", { name: "Ajustar cantidades" }).click();
  await expect(hoja).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(hoja).toBeHidden();
  await expect(tarjeta.getByRole("button", { name: "Ajustar cantidades" })).toBeFocused();
});

test("3–4. el cliente ve el ajuste, confirma en tres clics desde el aviso y ve avanzar el pedido (390px)", async ({ page }) => {
  await page.setViewportSize(CELULAR);
  await entrar(page, CUENTAS.andino);
  const pasos = contador();

  // Ver la alerta: la campana avisa; el aviso lleva directo al pedido sugerido.
  await expect(page.getByRole("link", { name: /Avisos: \d+ sin leer/ })).toBeVisible();
  await pasos.clic(page.getByRole("link", { name: /Avisos: \d+ sin leer/ }));
  await pasos.clic(page.getByRole("link", { name: /Valentina Vendedora ajustó tu pedido sugerido/ }));

  await expect(page.getByText(/Valentina \(tu vendedor\) ajustó el pedido/)).toBeVisible();
  await expect(page.getByText("Buffalo Soldier: 10 → 11")).toBeVisible();
  const confirmar = page.getByRole("button", { name: /Confirmar pedido · 11 bolsas/ });
  await visibleSinScroll(page, confirmar);
  // Con telemetría no se le pide nada al cliente.
  await expect(page.getByText("¿Cuántas bolsas te quedan?")).toHaveCount(0);
  await pasos.clic(confirmar);

  const titulo = page.getByRole("heading", { name: /Pedido MC-\d+ recibido/ });
  await expect(titulo).toBeVisible();
  expect(pasos.total, "ver alerta → confirmar pedido en tres clics o menos").toBeLessThanOrEqual(3);
  codigoPedido = (await titulo.textContent())!.match(/MC-\d+/)![0];

  // Seguimiento: el estado avanza con el comando interno y la pantalla lo muestra sola.
  await page.getByRole("link", { name: "Ver el estado del pedido" }).click();
  await expect(page.getByRole("heading", { name: "Recibido", level: 1 })).toBeVisible();
  avanzarPedido(codigoPedido);
  await expect(page.getByRole("heading", { name: "En preparación", level: 1 })).toBeVisible({ timeout: 30_000 });
  avanzarPedido(codigoPedido);
  await page.reload();
  await expect(page.getByRole("heading", { name: "En reparto", level: 1 })).toBeVisible();
  await expect(page.locator("[aria-current=step]")).toContainText("En reparto");
});

test("3b. sin alertas, la pantalla lo dice en vez de quedar vacía (390px)", async ({ page }) => {
  await page.setViewportSize(CELULAR);
  await entrar(page, CUENTAS.hotel);
  await expect(page.getByText("Todo en orden")).toBeVisible();
});

test("5. punto sin telemetría: pide las bolsas que quedan, prellenadas, en dos clics (1440px)", async ({ page }) => {
  await page.setViewportSize(ESCRITORIO);
  await entrar(page, CUENTAS.andino);
  const pasos = contador();
  await pasos.clic(page.locator(".tarjeta-alerta", { hasText: "Andino Ñuñoa" }).getByRole("link", { name: "Revisar y confirmar" }));
  await expect(page.getByText("Declarado por el cliente", { exact: false }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "¿Cuántas bolsas te quedan?" })).toBeVisible();
  const quedan = page.getByLabel("One Love, quedan", { exact: true });
  await expect(quedan).toHaveValue("2.5");
  await expect(quedan).toHaveAttribute("inputmode", "decimal");
  const confirmar = page.getByRole("button", { name: /Confirmar pedido/ });
  await visibleSinScroll(page, confirmar);
  await pasos.clic(confirmar);
  await expect(page.getByRole("heading", { name: /Pedido MC-\d+ recibido/ })).toBeVisible();
  expect(pasos.total).toBeLessThanOrEqual(3);

  // La declaración del cliente pasa a ser la fuente del dato del punto.
  await page.goto("/#/stock");
  const punto = page.locator(".punto-stock", { hasText: "Andino Ñuñoa" });
  await expect(punto.getByText(/Declarado por el cliente · hoy/)).toBeVisible();
});

test("5b. sin telemetría en el celular más angosto: dos clics desde Reposición y el botón cabe (360px)", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await entrar(page, "admin@losaromos.local");
  const pasos = contador();
  await pasos.clic(page.locator(".tarjeta-alerta", { hasText: "Los Aromos La Florida" }).getByRole("link", { name: "Revisar y confirmar" }));
  await expect(page.getByRole("heading", { name: "¿Cuántas bolsas te quedan?" })).toBeVisible();
  const confirmar = page.getByRole("button", { name: /Confirmar pedido/ });
  await visibleSinScroll(page, confirmar);
  await pasos.clic(confirmar);
  await expect(page.getByRole("heading", { name: /Pedido MC-\d+ recibido/ })).toBeVisible();
  expect(pasos.total).toBeLessThanOrEqual(2);
});

test("6. gerencia ve los pedidos nuevos y su estado (1440px)", async ({ page }) => {
  await page.setViewportSize(ESCRITORIO);
  await entrar(page, CUENTAS.gerencia);
  await page.goto("/#/pedidos");
  await expect(page.getByRole("link", { name: codigoPedido })).toBeVisible();
  const fila = page.getByRole("row", { name: new RegExp(codigoPedido) });
  await expect(fila.getByText("En reparto")).toBeVisible();
});
