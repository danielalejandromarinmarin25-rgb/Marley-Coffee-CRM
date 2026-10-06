import type { Perfil } from "../types";

export type Capa = "gerencia" | "comercial" | "cliente" | "partner";

export const capaDe: Record<Perfil, Capa> = {
  gerencia: "gerencia",
  vendedor: "comercial",
  kam: "comercial",
  cliente_admin: "cliente",
  cliente_integrante: "cliente",
  partner: "partner",
};

export const nombrePerfil: Record<Perfil, string> = {
  gerencia: "Gerencia",
  vendedor: "Vendedor",
  kam: "Key Account Manager",
  cliente_admin: "Administrador",
  cliente_integrante: "Integrante",
  partner: "Partner",
};

export const nombreCanal: Record<string, string> = {
  horeca: "Horeca",
  ocs: "OCS",
  conveniencia: "Estaciones y conveniencia",
  panaderia: "Panaderías",
};

// Mensajes de error que devuelve el servidor, en palabras de quien usa la app.
const mensajes: Record<string, string> = {
  sin_permiso: "Tu perfil no permite esta acción.",
  no_encontrado: "No encontramos ese registro.",
  cuenta_existente: "Ese correo ya tiene una cuenta en Marley Conecta.",
  invitacion_pendiente_en_otra_organizacion: "Ese correo tiene una invitación pendiente en otra empresa.",
  email_invalido: "Revisa el correo.",
  nombre_requerido: "Escribe el nombre de la persona.",
  empresa_ya_activada: "Esta empresa ya está activa en la app.",
  empresa_suspendida: "La empresa está suspendida en el CRM.",
  no_puede_cambiarse_a_si_mismo: "No puedes cambiar tu propio acceso.",
  requiere_nueva_invitacion: "Esta persona nunca activó su cuenta. Envíale una invitación nueva.",
  invitacion_vencida: "Tu invitación venció. Pide a quien te invitó que la envíe de nuevo.",
  invitacion_revocada: "Tu invitación ya no es válida. Pide una nueva.",
  cuenta_desactivada: "Tu cuenta está desactivada.",
  falta_contrasena: "Define tu contraseña para activar la cuenta.",
  limite_de_correos: "Se alcanzó el límite de correos por ahora. Intenta más tarde.",
  no_se_pudo_enviar: "No pudimos enviar el correo. Intenta de nuevo.",
  sesion_expirada: "Tu sesión expiró. Vuelve a iniciar sesión.",
  pedido_ya_confirmado: "Este pedido ya fue confirmado. No se creó un pedido duplicado.",
  alerta_cerrada: "Este aviso ya no está pendiente: el cliente lo confirmó o se resolvió.",
  faltan_bolsas_restantes: "Indica cuántas bolsas te quedan de cada café.",
  cantidad_invalida: "Revisa las cantidades (entre 0 y 99 bolsas).",
  pedido_vacio: "El pedido necesita al menos una bolsa.",
  lineas_invalidas: "Revisa las cantidades del pedido.",
};

export function mensajeDeError(codigo: string | undefined | null): string {
  return (codigo && mensajes[codigo]) || "Algo falló. Intenta de nuevo.";
}
