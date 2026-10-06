import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Solo valores públicos: la URL del proyecto y la clave publicable (anon). Ambas viajan al
// navegador por diseño; lo que protege los datos es RLS en la base. La clave secreta
// (service_role) nunca se lee aquí ni lleva prefijo VITE_.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const clavePublica = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const configuracionCompleta = Boolean(url && clavePublica);

// Los enlaces de invitación y recuperación vuelven con el resultado en el fragmento de la URL
// (#access_token=…&type=invite). Se lee antes de que el cliente lo procese y lo limpie.
const fragmento = new URLSearchParams(location.hash.startsWith("#/") ? "" : location.hash.slice(1));
export const enlaceRecibido = {
  tipo: fragmento.get("type") as "invite" | "recovery" | null,
  error: fragmento.get("error_code") ?? fragmento.get("error"),
};

export const supabase = createClient<Database>(url ?? "http://localhost", clavePublica ?? "sin-configurar", {
  auth: {
    flowType: "implicit",
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
  },
});

export const URL_APP = `${location.origin}${location.pathname}`;
export const URL_FUNCIONES = `${url}/functions/v1`;
