import { useState } from "react";
import { useAuth, useSesion } from "../../auth/AuthProvider";
import { nombrePerfil } from "../../auth/perfiles";
import { PageHeading, PrimaryButton, SecondaryButton } from "../../components/ui";
import { aErrorApp } from "../../lib/datos";
import { supabase } from "../../lib/supabase";
import { Mensaje } from "../equipo/Personas";

// Datos personales. El perfil y la organización los asigna el servidor y aquí solo se muestran.
export function MiPerfil() {
  const sesion = useSesion();
  const { cerrarSesion, recargarSesion, sesionInvalida } = useAuth();
  const [nombre, setNombre] = useState(sesion.nombre);
  const [aviso, setAviso] = useState<{ texto: string; tono: "info" | "danger" }>({ texto: "", tono: "info" });
  const [enviado, setEnviado] = useState(false);

  async function guardar() {
    const { error } = await supabase.from("profiles").update({ nombre: nombre.trim() }).eq("id", sesion.userId);
    const e = aErrorApp(error);
    if (e?.sesionVencida) return sesionInvalida();
    setAviso(e ? { texto: "No pudimos guardar tu nombre.", tono: "danger" } : { texto: "Nombre actualizado.", tono: "info" });
    if (!e) await recargarSesion();
  }

  async function cambiarContrasena() {
    // Se usa el mismo flujo que "recuperar acceso": un enlace al correo de la cuenta.
    await supabase.auth.resetPasswordForEmail(sesion.email, { redirectTo: `${location.origin}${location.pathname}` });
    setEnviado(true);
  }

  return (
    <>
      <PageHeading eyebrow="MI PERFIL" title={sesion.nombre} description={`${nombrePerfil[sesion.perfil]} · ${sesion.organizacionNombre}`} />
      <section className="card">
        <h2>Datos personales</h2>
        <Mensaje {...aviso} />
        <label>
          Nombre
          <input maxLength={120} value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </label>
        <div className="detail-row">
          <small>Correo</small>
          <b>{sesion.email}</b>
        </div>
        <div className="detail-row">
          <small>Perfil</small>
          <b>{nombrePerfil[sesion.perfil]}</b>
        </div>
        <PrimaryButton disabled={!nombre.trim() || nombre.trim() === sesion.nombre} onClick={() => void guardar()}>
          Guardar
        </PrimaryButton>
      </section>
      <section className="card">
        <h2>Contraseña y sesión</h2>
        {enviado ? (
          <p>Te enviamos un enlace a {sesion.email} para definir una contraseña nueva.</p>
        ) : (
          <SecondaryButton onClick={() => void cambiarContrasena()}>Cambiar mi contraseña</SecondaryButton>
        )}
        <SecondaryButton onClick={() => void cerrarSesion()}>Cerrar sesión</SecondaryButton>
      </section>
    </>
  );
}
