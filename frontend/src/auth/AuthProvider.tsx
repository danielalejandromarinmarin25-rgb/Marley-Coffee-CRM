import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { enlaceRecibido, supabase } from "../lib/supabase";
import type { Perfil } from "../types";

export interface SesionMarley {
  userId: string;
  nombre: string;
  email: string;
  perfil: Perfil;
  organizationId: string;
  organizacionNombre: string;
  permisos: string[];
}

// Por qué se volvió a la pantalla de inicio de sesión.
export type Motivo =
  | "expirada"
  | "desactivada"
  | "sin_cuenta"
  | "enlace_invalido"
  | "contrasena_actualizada"
  | null;

type Estado =
  | { fase: "cargando" }
  | { fase: "sin_sesion"; motivo: Motivo }
  | { fase: "activar_cuenta"; nombre: string; email: string }
  | { fase: "nueva_contrasena" }
  | { fase: "lista"; sesion: SesionMarley };

interface Valor {
  estado: Estado;
  cerrarSesion: () => Promise<void>;
  // Se llama cuando una consulta responde que la sesión ya no sirve (401 o JWT vencido).
  sesionInvalida: () => void;
  recargarSesion: () => Promise<void>;
  puede: (permiso: string) => boolean;
}

const Contexto = createContext<Valor | null>(null);
const REVISION_MS = 5 * 60 * 1000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<Estado>(() =>
    enlaceRecibido.error ? { fase: "sin_sesion", motivo: "enlace_invalido" } : { fase: "cargando" },
  );
  const salidaVoluntaria = useRef(false);
  const recuperando = useRef(enlaceRecibido.tipo === "recovery");

  const salir = useCallback(async (motivo: Motivo) => {
    // La bandera la consume el evento SIGNED_OUT, que llega después y de forma diferida.
    salidaVoluntaria.current = true;
    setEstado({ fase: "sin_sesion", motivo });
    await supabase.auth.signOut({ scope: "local" });
  }, []);

  // Lee perfil, organización y estado de la cuenta desde el servidor. La app nunca decide el perfil.
  const cargar = useCallback(
    async (session: Session | null) => {
      if (!session) {
        setEstado((previo) =>
          previo.fase === "sin_sesion" ? previo : { fase: "sin_sesion", motivo: null },
        );
        return;
      }
      if (recuperando.current) {
        setEstado({ fase: "nueva_contrasena" });
        return;
      }
      const { data, error } = await supabase.rpc("mi_sesion");
      if (error) {
        await salir(error.code === "PGRST301" || error.message.includes("JWT") ? "expirada" : null);
        return;
      }
      const fila = data?.[0];
      if (!fila) return salir("sin_cuenta");
      if (fila.estado === "desactivada") return salir("desactivada");
      if (fila.estado === "invitada") {
        setEstado({ fase: "activar_cuenta", nombre: fila.nombre, email: fila.email });
        return;
      }
      setEstado({
        fase: "lista",
        sesion: {
          userId: fila.user_id,
          nombre: fila.nombre,
          email: fila.email,
          perfil: fila.perfil,
          organizationId: fila.organization_id,
          organizacionNombre: fila.organizacion_nombre,
          permisos: fila.permisos ?? [],
        },
      });
    },
    [salir],
  );

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((evento, session) => {
      // Las llamadas a Supabase dentro de este callback se difieren (recomendación de supabase-js).
      setTimeout(() => {
        if (evento === "PASSWORD_RECOVERY") {
          recuperando.current = true;
          setEstado({ fase: "nueva_contrasena" });
        } else if (evento === "SIGNED_OUT") {
          // Sin que la persona lo pidiera: el token de renovación venció o fue revocado.
          if (salidaVoluntaria.current) salidaVoluntaria.current = false;
          else setEstado({ fase: "sin_sesion", motivo: "expirada" });
        } else if (evento === "INITIAL_SESSION" || evento === "SIGNED_IN") {
          void cargar(session);
        }
      }, 0);
    });
    return () => data.subscription.unsubscribe();
  }, [cargar]);

  // Una cuenta desactivada pierde el acceso a los datos de inmediato (RLS); aquí además se
  // cierra la sesión en la interfaz al volver a la pestaña o cada cinco minutos.
  useEffect(() => {
    if (estado.fase !== "lista") return;
    const revisar = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) await cargar(data.session);
    };
    const alVolver = () => document.visibilityState === "visible" && void revisar();
    const intervalo = setInterval(revisar, REVISION_MS);
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      clearInterval(intervalo);
      document.removeEventListener("visibilitychange", alVolver);
    };
  }, [estado.fase, cargar]);

  const valor: Valor = {
    estado,
    cerrarSesion: () => salir(null),
    sesionInvalida: () => void salir("expirada"),
    recargarSesion: async () => {
      recuperando.current = false;
      const { data } = await supabase.auth.getSession();
      await cargar(data.session);
    },
    puede: (permiso) => estado.fase === "lista" && estado.sesion.permisos.includes(permiso),
  };
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useAuth() {
  const valor = useContext(Contexto);
  if (!valor) throw new Error("AuthProvider no está montado");
  return valor;
}

export function useSesion(): SesionMarley {
  const { estado } = useAuth();
  if (estado.fase !== "lista") throw new Error("No hay sesión activa");
  return estado.sesion;
}
