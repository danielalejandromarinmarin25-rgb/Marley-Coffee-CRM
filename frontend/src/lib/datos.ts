import { useCallback, useEffect, useRef, useState } from "react";
import type { PostgrestError } from "@supabase/supabase-js";
import { useAuth } from "../auth/AuthProvider";
import { supabase, URL_FUNCIONES } from "./supabase";

export interface ErrorApp {
  codigo: string;
  sesionVencida: boolean;
}

// Traduce un error de PostgREST al código que devuelven las funciones de la base.
export function aErrorApp(error: PostgrestError | null): ErrorApp | null {
  if (!error) return null;
  const sesionVencida = error.code === "PGRST301" || error.code === "PGRST303" || /JWT/i.test(error.message);
  const codigo =
    error.code === "42501" ? "sin_permiso"
    : error.code === "P0002" ? "no_encontrado"
    : error.code === "P0001" ? error.message
    : sesionVencida ? "sesion_expirada"
    : "error";
  return { codigo, sesionVencida };
}

// Ejecuta una consulta al montar y cuando cambian sus dependencias. Si la sesión venció,
// devuelve a la pantalla de inicio de sesión con el aviso correspondiente.
export function useConsulta<T>(
  consulta: () => PromiseLike<{ data: T | null; error: PostgrestError | null }>,
  dependencias: unknown[] = [],
) {
  const { sesionInvalida } = useAuth();
  const [estado, setEstado] = useState<{ datos: T | null; error: ErrorApp | null; cargando: boolean }>({
    datos: null,
    error: null,
    cargando: true,
  });
  const ejecutar = useCallback(async () => {
    const { data, error } = await consulta();
    const e = aErrorApp(error);
    if (e?.sesionVencida) return sesionInvalida();
    setEstado({ datos: data, error: e, cargando: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencias);
  useEffect(() => {
    setEstado((s) => ({ ...s, cargando: true }));
    void ejecutar();
  }, [ejecutar]);
  return { ...estado, recargar: ejecutar };
}

export interface DatosInvitacion {
  organization_id: string;
  email: string;
  nombre: string;
  perfil: string;
}

// La invitación pasa por la Edge Function: es la única que puede crear cuentas en Auth.
// El permiso lo decide la base con la sesión de quien invita.
export async function invitar(datos: DatosInvitacion): Promise<{ ok: true } | { ok: false; codigo: string }> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) return { ok: false, codigo: "sesion_expirada" };
  try {
    const r = await fetch(`${URL_FUNCIONES}/invite-user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${data.session.access_token}`,
      },
      body: JSON.stringify(datos),
    });
    if (r.ok) return { ok: true };
    const cuerpo = await r.json().catch(() => ({}));
    return { ok: false, codigo: r.status === 401 ? "sesion_expirada" : cuerpo.error ?? "error" };
  } catch {
    return { ok: false, codigo: "error" };
  }
}

// Vuelve a ejecutar fn cada cierto tiempo y cuando la pestaña recupera el foco (sin Realtime:
// basta para avisos y estados de pedido, y funciona igual en una conexión móvil).
export function useRefresco(fn: () => void, cadaMs: number) {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    const t = setInterval(() => ref.current(), cadaMs);
    const alVolver = () => document.visibilityState === "visible" && ref.current();
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", alVolver);
    };
  }, [cadaMs]);
}
