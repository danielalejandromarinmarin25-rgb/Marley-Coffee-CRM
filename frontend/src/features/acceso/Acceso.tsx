import { useState, type FormEvent, type ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { useAuth, type Motivo } from "../../auth/AuthProvider";
import { mensajeDeError } from "../../auth/perfiles";
import { PrimaryButton } from "../../components/ui";
import { aErrorApp } from "../../lib/datos";
import { supabase, URL_APP } from "../../lib/supabase";

function Marco({ titulo, bajada, children }: { titulo: string; bajada?: string; children: ReactNode }) {
  return (
    <main className="login">
      <section className="login-story">
        <div className="brand">
          <img className="brand-logo" src="./marley-coffee-logo.webp" alt="Marley Coffee" width="100" height="100" />
          <small>CONECTA</small>
        </div>
        <div>
          <span className="eyebrow">ONE LOVE. ONE TEAM.</span>
          <h1>
            Más cerca.
            <br />
            Cada día.
          </h1>
          <p>
            Tu café, tus puntos y tu equipo,
            <br />
            conectados con Marley Coffee.
          </p>
        </div>
        <small>MARLEY COFFEE · CONECTA</small>
      </section>
      <section className="login-form">
        <img className="login-logo" src="./marley-coffee-logo.webp" alt="Marley Coffee" width="112" height="112" />
        <h1>{titulo}</h1>
        {bajada && <p>{bajada}</p>}
        {children}
      </section>
    </main>
  );
}

function Aviso({ tono = "info", children }: { tono?: "info" | "warning" | "danger"; children: ReactNode }) {
  return (
    <div className={`notice ${tono}`} role={tono === "danger" ? "alert" : "status"}>
      <p>{children}</p>
    </div>
  );
}

const avisoPorMotivo: Record<Exclude<Motivo, null>, [string, "info" | "warning" | "danger"]> = {
  expirada: ["Tu sesión expiró. Vuelve a iniciar sesión para continuar.", "warning"],
  desactivada: ["Tu cuenta está desactivada. Si crees que es un error, habla con el administrador de tu empresa o con Marley.", "danger"],
  sin_cuenta: ["Esta cuenta no tiene acceso a Marley Conecta.", "danger"],
  enlace_invalido: ["El enlace venció o ya se usó. Pide uno nuevo.", "warning"],
  contrasena_actualizada: ["Tu contraseña se actualizó. Inicia sesión con la nueva.", "info"],
};

export function IniciarSesion({ motivo }: { motivo: Motivo }) {
  const [modo, setModo] = useState<"entrar" | "recuperar">("entrar");
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  async function entrar(e: FormEvent) {
    e.preventDefault();
    setOcupado(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: clave });
    setOcupado(false);
    // Mismo mensaje si el correo no existe o la contraseña no coincide: no revela qué cuentas existen.
    if (error) setError(error.status === 429 ? "Demasiados intentos. Espera unos minutos." : "Correo o contraseña incorrectos.");
  }

  async function recuperar(e: FormEvent) {
    e.preventDefault();
    setOcupado(true);
    await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: URL_APP });
    setOcupado(false);
    // Respuesta neutra exista o no la cuenta.
    setEnviado(true);
  }

  if (modo === "recuperar")
    return (
      <Marco titulo="Recupera tu acceso" bajada="Te enviaremos un enlace para definir una contraseña nueva.">
        {enviado ? (
          <Aviso>Si {email.trim()} tiene una cuenta, recibirás un correo con el enlace. Revisa también la carpeta de spam.</Aviso>
        ) : (
          <form onSubmit={recuperar}>
            <label>
              Correo
              <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <PrimaryButton disabled={ocupado}>Enviar enlace</PrimaryButton>
          </form>
        )}
        <button className="text-link" onClick={() => { setModo("entrar"); setEnviado(false); }}>
          Volver a iniciar sesión
        </button>
      </Marco>
    );

  return (
    <Marco titulo="Inicia sesión" bajada="Bienvenido a Marley Conecta.">
      {motivo && <Aviso tono={avisoPorMotivo[motivo][1]}>{avisoPorMotivo[motivo][0]}</Aviso>}
      {error && <Aviso tono="danger">{error}</Aviso>}
      <form onSubmit={entrar}>
        <label>
          Correo
          <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Contraseña
          <input type="password" required autoComplete="current-password" value={clave} onChange={(e) => setClave(e.target.value)} />
        </label>
        <PrimaryButton disabled={ocupado}>
          Entrar <ArrowRight size={18} />
        </PrimaryButton>
      </form>
      <button className="text-link" onClick={() => setModo("recuperar")}>
        ¿Olvidaste tu contraseña?
      </button>
      <p className="login-note">El acceso es solo por invitación de Marley o del administrador de tu empresa.</p>
    </Marco>
  );
}

// Misma regla que Auth en el servidor: mínimo 8 caracteres, con letras y números.
function validarClave(clave: string, repetida: string): string {
  if (clave.length < 8) return "Usa al menos 8 caracteres.";
  if (!/[a-zA-Z]/.test(clave) || !/[0-9]/.test(clave)) return "Combina letras y números.";
  if (clave !== repetida) return "Las contraseñas no coinciden.";
  return "";
}

function FormularioClave({ boton, alGuardar }: { boton: string; alGuardar: (clave: string) => Promise<string> }) {
  const [clave, setClave] = useState("");
  const [repetida, setRepetida] = useState("");
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const problema = validarClave(clave, repetida);
        if (problema) return setError(problema);
        setOcupado(true);
        const resultado = await alGuardar(clave);
        setOcupado(false);
        setError(resultado);
      }}
    >
      {error && <Aviso tono="danger">{error}</Aviso>}
      <label>
        Contraseña nueva
        <input type="password" required autoComplete="new-password" value={clave} onChange={(e) => setClave(e.target.value)} />
      </label>
      <label>
        Repite la contraseña
        <input type="password" required autoComplete="new-password" value={repetida} onChange={(e) => setRepetida(e.target.value)} />
      </label>
      <p className="muted">Mínimo 8 caracteres, con letras y números.</p>
      <PrimaryButton disabled={ocupado}>{boton}</PrimaryButton>
    </form>
  );
}

function errorDeClave(mensaje: string): string {
  if (/different from the old/i.test(mensaje)) return "La contraseña nueva debe ser distinta de la anterior.";
  if (/weak|characters/i.test(mensaje)) return "La contraseña es muy débil. Usa al menos 8 caracteres con letras y números.";
  return "No pudimos guardar la contraseña. Intenta de nuevo.";
}

export function ActivarCuenta({ nombre, email }: { nombre: string; email: string }) {
  const { recargarSesion, cerrarSesion } = useAuth();
  return (
    <Marco titulo={`Hola, ${nombre}`} bajada={`Define tu contraseña para activar tu cuenta (${email}).`}>
      <FormularioClave
        boton="Activar mi cuenta"
        alGuardar={async (clave) => {
          const { error } = await supabase.auth.updateUser({ password: clave });
          if (error) return errorDeClave(error.message);
          const { error: errorAceptar } = await supabase.rpc("aceptar_invitacion");
          if (errorAceptar) return mensajeDeError(aErrorApp(errorAceptar)?.codigo);
          await recargarSesion();
          return "";
        }}
      />
      <button className="text-link" onClick={() => void cerrarSesion()}>
        Salir
      </button>
    </Marco>
  );
}

export function NuevaContrasena() {
  const { recargarSesion } = useAuth();
  return (
    <Marco titulo="Define tu contraseña nueva">
      <FormularioClave
        boton="Guardar contraseña"
        alGuardar={async (clave) => {
          const { error } = await supabase.auth.updateUser({ password: clave });
          if (error) return errorDeClave(error.message);
          await recargarSesion();
          return "";
        }}
      />
    </Marco>
  );
}

export function Cargando() {
  return (
    <main className="login" role="status" aria-live="polite">
      <section className="login-form">
        <img className="login-logo" src="./marley-coffee-logo.webp" alt="Marley Coffee" width="112" height="112" />
        <p>Cargando tu espacio…</p>
      </section>
    </main>
  );
}

export function FaltaConfiguracion() {
  return (
    <Marco titulo="Falta configurar la conexión">
      <Aviso tono="danger">
        Define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en frontend/.env.local (ver frontend/.env.example) y vuelve a iniciar la app.
      </Aviso>
    </Marco>
  );
}
