import { execSync } from "node:child_process";
import { expect, type Page } from "@playwright/test";

export const CLAVE = "marley-local-1";

export const CUENTAS = {
  gerencia: "gerencia@marley.local",
  vendedora: "vendedora@marley.local",
  kam: "kam@marley.local",
  andino: "admin@andino.local",
  hotel: "admin@hotelpacifico.local",
  oficinas: "admin@oficinasur.local",
} as const;

export async function entrar(page: Page, email: string) {
  await page.goto("/#/");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña").fill(CLAVE);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.locator("#main-content")).toBeVisible();
}

// Comando interno para avanzar un pedido (el mismo que se usa en la demo).
export function avanzarPedido(codigo: string, estado?: string) {
  return execSync(`npx pnpm@10 --silent run pedido:avanzar ${codigo} ${estado ?? ""}`, { cwd: "../backend", encoding: "utf8" });
}

export interface Problema {
  tipo: string;
  detalle: string;
}

// Revisión de una pantalla: desbordamiento horizontal, elementos fuera del ancho, objetivos
// táctiles, letra de los campos y botones tapados por otros elementos.
export async function revisarPantalla(page: Page): Promise<Problema[]> {
  return page.evaluate(() => {
    const problemas: { tipo: string; detalle: string }[] = [];
    const ancho = document.documentElement.clientWidth;
    const describir = (el: Element) => {
      const texto = (el.getAttribute("aria-label") || (el as HTMLElement).innerText || el.tagName).trim().replace(/\s+/g, " ");
      return `${el.tagName.toLowerCase()}${el.className && typeof el.className === "string" ? "." + el.className.split(" ")[0] : ""} «${texto.slice(0, 40)}»`;
    };
    const visible = (el: Element) => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none" && !el.closest("dialog:not([open])");
    };

    if (document.documentElement.scrollWidth > ancho + 1) {
      problemas.push({ tipo: "scroll horizontal", detalle: `página de ${document.documentElement.scrollWidth}px en ${ancho}px` });
    }

    for (const el of document.querySelectorAll("body *")) {
      if (!visible(el) || el.closest(".skip-link")) continue;
      const r = el.getBoundingClientRect();
      if (r.right > ancho + 1 || r.left < -1) {
        // Un elemento recortado por un ancestro con overflow oculto no se ve fuera de la pantalla.
        let recortado = false;
        for (let p = el.parentElement; p; p = p.parentElement) {
          const o = getComputedStyle(p).overflowX;
          if (o === "hidden" || o === "auto" || o === "clip") {
            const rp = p.getBoundingClientRect();
            if (rp.right <= ancho + 1 && rp.left >= -1) recortado = true;
            break;
          }
        }
        if (!recortado) problemas.push({ tipo: "fuera del ancho", detalle: describir(el) });
      }
    }

    const tactiles = document.querySelectorAll(
      "button, input, select, textarea, nav a, a.button, .fila-enlace, .enlace-fila, .campana, .back-link, .acceso-rapido",
    );
    for (const el of tactiles) {
      if (!visible(el) || el.closest(".skip-link")) continue;
      const r = el.getBoundingClientRect();
      if (r.height < 43.5 || r.width < 43.5) {
        problemas.push({ tipo: "objetivo táctil < 44px", detalle: `${describir(el)} ${Math.round(r.width)}×${Math.round(r.height)}` });
      }
    }

    for (const el of document.querySelectorAll("input:not([type=checkbox]):not([type=radio]), select, textarea")) {
      if (!visible(el)) continue;
      const tam = parseFloat(getComputedStyle(el).fontSize);
      if (tam < 16) problemas.push({ tipo: "campo < 16px", detalle: `${describir(el)} ${tam}px` });
    }

    // Botones y enlaces dentro de la pantalla visible: su centro no puede estar tapado por otro elemento.
    // Con un diálogo modal abierto, solo cuenta lo que está dentro de él (el resto queda inerte).
    // Lo que pasa por debajo de una barra fija o pegajosa al hacer scroll no es superposición.
    const dialogo = document.querySelector("dialog[open]");
    const fijo = (n: Element | null) => {
      for (let p = n; p; p = p.parentElement) {
        const pos = getComputedStyle(p).position;
        if (pos === "fixed" || pos === "sticky") return p;
      }
      return null;
    };
    const candidatos = dialogo
      ? dialogo.querySelectorAll("button, a")
      : document.querySelectorAll("main button, main a.button, .barra-accion button, header a, header button, .bottom-nav a");
    for (const el of candidatos) {
      if (!visible(el)) continue;
      const r = el.getBoundingClientRect();
      const x = r.left + r.width / 2;
      const y = r.top + r.height / 2;
      if (y < 0 || y > window.innerHeight || x < 0 || x > ancho) continue;
      const arriba = document.elementFromPoint(x, y);
      const capa = fijo(arriba);
      if (capa && !capa.contains(el) && !dialogo) continue;
      if (arriba && arriba !== el && !el.contains(arriba)) {
        problemas.push({ tipo: "tapado", detalle: `${describir(el)} bajo ${describir(arriba)}` });
      }
    }
    return problemas;
  });
}
