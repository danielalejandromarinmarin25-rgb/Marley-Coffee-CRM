// Consultas y acciones del flujo de reposición. Cada lectura devuelve solo lo que RLS permite al
// perfil de la sesión; cada acción la valida el servidor (role_permissions): la interfaz solo
// decide qué botones mostrar.
import type { PostgrestError } from "@supabase/supabase-js";
import type { EstadoAlerta, EstadoPedido, Fuente, Severidad } from "./formato-reposicion";
import { aErrorApp } from "./datos";
import { supabase } from "./supabase";

export interface ProductoVista {
  id: string;
  nombre: string;
  formato: string;
  kg_por_bolsa: number;
}

export interface LineaSugerida {
  id: string;
  producto_id: string;
  bolsas: number;
  bolsas_sugeridas: number;
  productos: ProductoVista;
}

export interface AlertaVista {
  id: string;
  estado: EstadoAlerta;
  severidad: Severidad;
  cobertura_dias: number | null;
  agotamiento_estimado: string | null;
  fuente: Fuente;
  dato_at: string | null;
  creada_at: string;
  critica_at: string | null;
  confirmada_at: string | null;
  pospuesta_hasta: string | null;
  point_id: string;
  organization_id: string;
  points: { id: string; nombre: string; direccion: string | null; telemetria_disponible: boolean; canal: string };
  productos: ProductoVista;
  organizations: { id: string; nombre_comercial: string; contacto_nombre: string | null; contacto_telefono: string | null };
  pedidos_sugeridos: {
    id: string;
    ajustado_por_nombre: string | null;
    ajustado_por_perfil: string | null;
    ajustado_at: string | null;
    lineas_sugeridas: LineaSugerida[];
  } | null;
  pedidos: { id: string; codigo: string; estado: EstadoPedido } | null;
}

export const SELECT_ALERTA = `id, estado, severidad, cobertura_dias, agotamiento_estimado, fuente, dato_at, creada_at,
  critica_at, confirmada_at, pospuesta_hasta, point_id, organization_id,
  points(id, nombre, direccion, telemetria_disponible, canal),
  productos(id, nombre, formato, kg_por_bolsa),
  organizations(id, nombre_comercial, contacto_nombre, contacto_telefono),
  pedidos_sugeridos(id, ajustado_por_nombre, ajustado_por_perfil, ajustado_at,
    lineas_sugeridas(id, producto_id, bolsas, bolsas_sugeridas, productos(id, nombre, formato, kg_por_bolsa))),
  pedidos(id, codigo, estado)`;

export const ESTADOS_VIVOS: EstadoAlerta[] = ["abierta", "pospuesta", "critica"];

export interface PedidoVista {
  id: string;
  codigo: string;
  estado: EstadoPedido;
  confirmado_at: string;
  confirmado_por_nombre: string | null;
  point_id: string;
  organization_id: string;
  points: { nombre: string; direccion: string | null };
  organizations: { nombre_comercial: string };
  lineas_pedido: { bolsas: number; productos: { nombre: string; formato: string } }[];
  historial_pedido: { estado: EstadoPedido; ocurrido_at: string }[];
}

export const SELECT_PEDIDO = `id, codigo, estado, confirmado_at, confirmado_por_nombre, point_id, organization_id,
  points(nombre, direccion), organizations(nombre_comercial),
  lineas_pedido(bolsas, productos(nombre, formato)),
  historial_pedido(estado, ocurrido_at)`;

export interface SaldoVista {
  point_id: string;
  producto_id: string;
  organization_id: string;
  saldo_kg: number;
  consumo_diario_kg: number | null;
  cobertura_dias: number | null;
  agotamiento_estimado: string | null;
  fuente: Fuente;
  dato_at: string | null;
  points: { id: string; nombre: string; direccion: string | null; canal: string; telemetria_disponible: boolean };
  productos: ProductoVista;
  organizations: { nombre_comercial: string };
}

export const SELECT_SALDO = `point_id, producto_id, organization_id, saldo_kg, consumo_diario_kg, cobertura_dias,
  agotamiento_estimado, fuente, dato_at,
  points!inner(id, nombre, direccion, canal, telemetria_disponible, activo),
  productos(id, nombre, formato, kg_por_bolsa),
  organizations(nombre_comercial)`;

type Resultado<T> = { ok: true; datos: T } | { ok: false; codigo: string };

function resultado<T>(data: T, error: PostgrestError | null): Resultado<T> {
  const e = aErrorApp(error);
  return e ? { ok: false, codigo: e.codigo } : { ok: true, datos: data };
}

export async function ajustarPedidoSugerido(sugeridoId: string, lineas: { producto_id: string; bolsas: number }[]) {
  const { error } = await supabase.rpc("ajustar_pedido_sugerido", { p_sugerido: sugeridoId, p_lineas: lineas });
  return resultado(null, error);
}

export async function confirmarPedido(sugeridoId: string, quedan: { producto_id: string; bolsas: number }[] | null) {
  const { data, error } = await supabase.rpc("confirmar_pedido", { p_sugerido: sugeridoId, p_quedan: quedan ?? undefined });
  return resultado(data?.[0] ?? null, error);
}

export async function posponerAlerta(alertaId: string, dias = 2) {
  const { error } = await supabase.rpc("posponer_alerta", { p_alerta: alertaId, p_dias: dias });
  return resultado(null, error);
}

export async function registrarGestion(alertaId: string, tipo: "whatsapp" | "nota", nota?: string) {
  const { error } = await supabase.rpc("registrar_gestion", { p_alerta: alertaId, p_tipo: tipo, p_nota: nota });
  return resultado(null, error);
}

// PostgREST devuelve una relación uno a uno como objeto, o como arreglo si no la detecta.
export const uno = <T,>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? (v[0] ?? null) : (v ?? null));

export const totalBolsas = (lineas: { bolsas: number }[]) => lineas.reduce((s, l) => s + l.bolsas, 0);
