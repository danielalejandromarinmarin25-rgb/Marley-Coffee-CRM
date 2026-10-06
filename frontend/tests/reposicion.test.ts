import { test } from "node:test";
import assert from "node:assert/strict";
import {
  bolsasEstimadas,
  enlaceWhatsapp,
  estadoAlerta,
  fechaCorta,
  mensajeWhatsapp,
  prioridad,
  textoCobertura,
  textoFuente,
} from "../src/lib/formato-reposicion.ts";

test("cobertura en palabras del cliente", () => {
  assert.equal(textoCobertura(0), "Se agota hoy");
  assert.equal(textoCobertura(0.6), "Se agota hoy");
  assert.equal(textoCobertura(1.9), "Se agota mañana");
  assert.equal(textoCobertura(3.4), "Se agota en 3 días");
  assert.equal(textoCobertura(null), "Sin agotamiento proyectado");
});

test("el estado nunca depende solo del color", () => {
  assert.deepEqual(estadoAlerta("critica", "roja"), { texto: "Crítica", tono: "danger" });
  assert.deepEqual(estadoAlerta("abierta", "roja"), { texto: "Urgente", tono: "danger" });
  assert.deepEqual(estadoAlerta("abierta", "amarilla"), { texto: "Pendiente", tono: "warning" });
  assert.deepEqual(estadoAlerta("confirmada", "roja"), { texto: "Confirmada", tono: "success" });
});

test("fuente del dato como en producción, sin avisos de demo", () => {
  const ahora = new Date("2026-10-05T15:00:00-03:00");
  assert.equal(textoFuente("telemetria", "2026-10-05T07:10:00-03:00", ahora), "Telemetría · hoy 07:10");
  assert.match(textoFuente("declarado", "2026-10-04T12:00:00-03:00", ahora), /^Declarado por el cliente · ayer/);
  assert.match(fechaCorta("2026-09-21T12:00:00-03:00", ahora), /21 sept?/);
});

test("WhatsApp: enlace con el mensaje precargado y número chileno normalizado", () => {
  assert.equal(enlaceWhatsapp("+56 9 6123 4400", "Hola"), "https://wa.me/56961234400?text=Hola");
  assert.equal(enlaceWhatsapp("9 6123 4400", "Hola"), "https://wa.me/56961234400?text=Hola");
  assert.equal(enlaceWhatsapp(null, "Hola"), null);
  assert.equal(enlaceWhatsapp("123", "Hola"), null);
  const m = mensajeWhatsapp({
    contacto: "Andrés Administrador",
    vendedor: "Valentina Vendedora",
    punto: "Andino Providencia",
    lineas: [{ cafe: "Buffalo Soldier", bolsas: 10 }],
    textoCobertura: "Se agota mañana",
  });
  assert.equal(
    m,
    "Hola Andrés, soy Valentina de Marley Coffee. En Andino Providencia el café se agota mañana. " +
      "Te dejé listo el pedido sugerido (10 bolsas de Buffalo Soldier) en Marley Conecta: solo falta que lo confirmes.",
  );
});

test("bolsas que quedan prellenadas con la estimación, en medias bolsas", () => {
  assert.equal(bolsasEstimadas(2.37, 1), 2.5);
  assert.equal(bolsasEstimadas(0, 1), 0);
  assert.equal(bolsasEstimadas(null, 1), 0);
});

test("prioridad de Hoy: crítica, luego urgente, luego menor cobertura", () => {
  const lista = [
    { id: "amarilla", estado: "abierta", severidad: "amarilla", cobertura_dias: 3.4 },
    { id: "critica", estado: "critica", severidad: "roja", cobertura_dias: 1.9 },
    { id: "roja", estado: "abierta", severidad: "roja", cobertura_dias: 2 },
    { id: "amarilla2", estado: "abierta", severidad: "amarilla", cobertura_dias: 4.8 },
  ] as const;
  assert.deepEqual(
    [...lista].sort((a, b) => prioridad(a) - prioridad(b)).map((a) => a.id),
    ["critica", "roja", "amarilla", "amarilla2"],
  );
});
