import { AuthProvider, useAuth } from "../auth/AuthProvider";
import { capaDe } from "../auth/perfiles";
import { configuracionCompleta } from "../lib/supabase";
import {
  ActivarCuenta,
  Cargando,
  FaltaConfiguracion,
  IniciarSesion,
  NuevaContrasena,
} from "../features/acceso/Acceso";
import { resolver, useRuta } from "./rutas";
import { Shell } from "./Shell";

// Cada cuenta tiene un único perfil, leído del servidor al iniciar sesión. No existe ninguna
// forma de cambiar de perfil desde la interfaz.
function Aplicacion() {
  const { estado } = useAuth();
  const ruta = useRuta();
  switch (estado.fase) {
    case "cargando":
      return <Cargando />;
    case "sin_sesion":
      return <IniciarSesion motivo={estado.motivo} />;
    case "activar_cuenta":
      return <ActivarCuenta nombre={estado.nombre} email={estado.email} />;
    case "nueva_contrasena":
      return <NuevaContrasena />;
    case "lista":
      return <Shell ruta={ruta}>{resolver(ruta, capaDe[estado.sesion.perfil])}</Shell>;
  }
}

export default function App() {
  if (!configuracionCompleta) return <FaltaConfiguracion />;
  return (
    <AuthProvider>
      <Aplicacion />
    </AuthProvider>
  );
}
