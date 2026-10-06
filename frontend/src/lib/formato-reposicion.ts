// Formato y textos del flujo de reposición. Funciones puras (sin React ni Supabase): las prueba
// tests/reposicion.test.ts. La decisión de la regla (cobertura, severidad, crítica) vive en la base;
// aquí solo se presenta.

export type EstadoAlerta = "abierta" | "pospuesta" | "critica" | "confirmada" | "resuelta";
export type Severidad = "amarilla" | "roja";
export type Fuente = "telemetria" | "declarado";
export type EstadoPedido = "recibido" | "en_preparacion" | "en_reparto" | "entregado";

export const ESTADOS_PEDIDO: EstadoPedido[] = ["recibido", "en_preparacion", "en_reparto", "entregado"];

export const nombreEstadoPedido: Record<EstadoPedido, string> = {
  recibido: "Recibido",
  en_preparacion: "En preparación",
  en_reparto: "En reparto",
  entregado: "Entregado",
};

export const nombreFuente: Record<Fuente, string> = {
  telemetria: "Telemetría",
  declarado: "Declarado por el cliente",
};

// Estado visible de una alerta: texto + tono. El texto siempre acompaña al color (accesibilidad).
export function estadoAlerta(estado: EstadoAlerta, severidad: Severidad): { texto: string; tono: string } {
  if (estado === "critica") return { texto: "Crítica", tono: "danger" };
  if (estado === "confirmada") return { texto: "Confirmada", tono: "success" };
  if (estado === "resuelta") return { texto: "Resuelta", tono: "neutral" };
  if (estado === "pospuesta") return { texto: "Pospuesta", tono: "info" };
  return severidad === "roja" ? { texto: "Urgente", tono: "danger" } : { texto: "Pendiente", tono: "warning" };
}

// "Se agota hoy", "Se agota mañana", "Se agota en 3 días". null = no se agota con el consumo actual.
export function textoCobertura(dias: number | null): string {
  if (dias === null) return "Sin agotamiento proyectado";
  const enteros = Math.floor(dias);
  if (enteros <= 0) return "Se agota hoy";
  if (enteros === 1) return "Se agota mañana";
  return `Se agota en ${enteros} días`;
}

export const textoDias = (dias: number | null) =>
  dias === null ? "—" : `${dias.toLocaleString("es-CL", { maximumFractionDigits: 1 })} ${dias === 1 ? "día" : "días"}`;

export const bolsas = (n: number) => `${n.toLocaleString("es-CL", { maximumFractionDigits: 1 })} ${n === 1 ? "bolsa" : "bolsas"}`;

// Zona horaria de Chile para todas las fechas visibles.
const ZONA = "America/Santiago";

export function fechaCorta(iso: string | null, ahora = new Date()): string {
  if (!iso) return "—";
  const fecha = new Date(iso);
  const dia = (d: Date) => d.toLocaleDateString("es-CL", { timeZone: ZONA });
  const hora = fecha.toLocaleTimeString("es-CL", { timeZone: ZONA, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  if (dia(fecha) === dia(ahora)) return `hoy ${hora}`;
  const ayer = new Date(ahora.getTime() - 86_400_000);
  if (dia(fecha) === dia(ayer)) return `ayer ${hora}`;
  return `${fecha.toLocaleDateString("es-CL", { timeZone: ZONA, day: "numeric", month: "short" })} ${hora}`;
}

export function fechaDia(isoFecha: string | null): string {
  if (!isoFecha) return "—";
  // Las fechas sin hora (YYYY-MM-DD) se leen como fecha local, no UTC.
  const [a, m, d] = isoFecha.slice(0, 10).split("-").map(Number);
  return new Date(a, m - 1, d).toLocaleDateString("es-CL", { weekday: "short", day: "numeric", month: "short" });
}

// Fuente del dato y su fecha, como se mostraría en producción.
export const textoFuente = (fuente: Fuente, datoAt: string | null, ahora = new Date()) =>
  `${nombreFuente[fuente]} · ${fechaCorta(datoAt, ahora)}`;

// Enlace de WhatsApp con el mensaje precargado (sin API: abre la app del teléfono).
export function enlaceWhatsapp(telefono: string | null, mensaje: string): string | null {
  if (!telefono) return null;
  let digitos = telefono.replace(/\D/g, "");
  if (digitos.length === 9 && digitos.startsWith("9")) digitos = `56${digitos}`; // celular chileno sin código
  if (digitos.length < 10) return null;
  return `https://wa.me/${digitos}?text=${encodeURIComponent(mensaje)}`;
}

export function mensajeWhatsapp(p: {
  contacto: string | null;
  vendedor: string;
  punto: string;
  lineas: { cafe: string; bolsas: number }[];
  textoCobertura: string;
}): string {
  const saludo = p.contacto ? `Hola ${p.contacto.split(" ")[0]}` : "Hola";
  const detalle = p.lineas.map((l) => `${bolsas(l.bolsas)} de ${l.cafe}`).join(", ");
  return (
    `${saludo}, soy ${p.vendedor.split(" ")[0]} de Marley Coffee. ` +
    `En ${p.punto} el café ${p.textoCobertura.toLowerCase()}. ` +
    `Te dejé listo el pedido sugerido (${detalle}) en Marley Conecta: solo falta que lo confirmes.`
  );
}

// Bolsas que quedan, prellenadas con lo que estima el sistema (Modo B). El cliente solo corrige.
export const bolsasEstimadas = (saldoKg: number | null, kgPorBolsa: number) =>
  saldoKg === null ? 0 : Math.max(0, Math.round((saldoKg / kgPorBolsa) * 2) / 2);

// Orden de prioridad para "Hoy": crítica, luego urgente (roja), luego por menor cobertura.
export function prioridad(a: { estado: EstadoAlerta; severidad: Severidad; cobertura_dias: number | null }): number {
  const base = a.estado === "critica" ? 0 : a.severidad === "roja" ? 1000 : 2000;
  return base + (a.cobertura_dias ?? 999);
}

export const recortar = (texto: string, max: number) => (texto.length > max ? `${texto.slice(0, max - 1)}…` : texto);
