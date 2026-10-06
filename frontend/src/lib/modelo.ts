// Filas tal como las expone la API (ver backend/supabase/migrations). Cada consulta solo
// devuelve lo que RLS permite al perfil de la sesión.
import type { Perfil } from "../types";

export type Canal = "horeca" | "ocs" | "conveniencia" | "panaderia";

export interface Organizacion {
  id: string;
  tipo: "marley" | "cliente" | "partner";
  rut: string | null;
  razon_social: string;
  nombre_comercial: string;
  contacto_nombre: string | null;
  contacto_email: string | null;
  contacto_telefono: string | null;
}

export interface EmpresaCrm {
  rut: string;
  razon_social: string;
  asignado_a: string | null;
  canal: Canal;
  segmento: string | null;
  estado: "activa" | "suspendida";
  organizations: { id: string; nombre_comercial: string } | null;
}

export interface Punto {
  id: string;
  organization_id: string;
  nombre: string;
  canal: Canal;
  telemetria_disponible: boolean;
  direccion: string | null;
  horario: string | null;
  contacto_recepcion: string | null;
  activo: boolean;
  machines?: Maquina[];
}

export interface Maquina {
  id: string;
  point_id: string;
  modelo: string;
  numero_serie: string;
}

export interface Miembro {
  user_id: string;
  perfil: Perfil;
  estado: "invitada" | "activa" | "desactivada";
  profiles: { nombre: string; email: string } | null;
}

export interface Invitacion {
  id: string;
  email: string;
  nombre: string;
  perfil: Perfil;
  estado: "pendiente" | "aceptada" | "revocada";
  expires_at: string;
}
