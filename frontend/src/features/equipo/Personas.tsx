import { useState, type FormEvent } from "react";
import { MailPlus } from "lucide-react";
import { useAuth, useSesion } from "../../auth/AuthProvider";
import { mensajeDeError, nombrePerfil } from "../../auth/perfiles";
import { PrimaryButton, SecondaryButton, StatusChip } from "../../components/ui";
import { aErrorApp, invitar, useConsulta } from "../../lib/datos";
import type { Invitacion, Miembro } from "../../lib/modelo";
import { supabase } from "../../lib/supabase";
import type { Perfil } from "../../types";
import { ErrorCarga } from "../errores/Errores";

const tonoEstado = { activa: "success", invitada: "info", desactivada: "danger" } as const;
const textoEstado = { activa: "Activa", invitada: "Invitación enviada", desactivada: "Desactivada" };

export function Mensaje({ texto, tono }: { texto: string; tono: "info" | "danger" }) {
  return texto ? (
    <div className={`notice ${tono}`} role={tono === "danger" ? "alert" : "status"}>
      <p>{texto}</p>
    </div>
  ) : null;
}

interface Props {
  organizationId: string;
  titulo: string;
  // Perfiles que la sesión puede invitar aquí (vacío: no se muestra el formulario).
  invitables: Perfil[];
  // La sesión puede activar o desactivar a estas personas (el servidor lo vuelve a comprobar).
  gestiona: boolean;
}

// Lista de personas de una organización, con invitaciones pendientes. Se usa en Mi equipo,
// Equipo comercial y la ficha del cliente; lo que cada perfil ve lo filtra RLS.
export function Personas({ organizationId, titulo, invitables, gestiona }: Props) {
  const sesion = useSesion();
  const { sesionInvalida } = useAuth();
  const [mensaje, setMensaje] = useState<{ texto: string; tono: "info" | "danger" }>({ texto: "", tono: "info" });

  const miembros = useConsulta<Miembro[]>(
    () =>
      supabase
        .from("memberships")
        .select("user_id, perfil, estado, profiles(nombre, email)")
        .eq("organization_id", organizationId)
        .order("created_at"),
    [organizationId],
  );
  const invitaciones = useConsulta<Invitacion[]>(
    () =>
      supabase
        .from("invitations")
        .select("id, email, nombre, perfil, estado, expires_at")
        .eq("organization_id", organizationId)
        .eq("estado", "pendiente")
        .order("created_at"),
    [organizationId],
  );
  const recargar = () => {
    void miembros.recargar();
    void invitaciones.recargar();
  };

  async function resultado(error: Parameters<typeof aErrorApp>[0], exito: string) {
    const e = aErrorApp(error);
    if (e?.sesionVencida) return sesionInvalida();
    setMensaje(e ? { texto: mensajeDeError(e.codigo), tono: "danger" } : { texto: exito, tono: "info" });
    recargar();
  }

  async function cambiarEstado(m: Miembro, activo: boolean) {
    const { error } = await supabase.rpc("cambiar_estado_miembro", { p_user: m.user_id, p_activo: activo });
    await resultado(error, activo ? "Acceso reactivado." : "Acceso desactivado.");
  }

  async function revocar(i: Invitacion) {
    const { error } = await supabase.rpc("revocar_invitacion", { p_invitacion: i.id });
    await resultado(error, "Invitación revocada.");
  }

  async function reenviar(i: Invitacion) {
    const r = await invitar({ organization_id: organizationId, email: i.email, nombre: i.nombre, perfil: i.perfil });
    if (!r.ok && r.codigo === "sesion_expirada") return sesionInvalida();
    setMensaje(r.ok ? { texto: `Reenviamos la invitación a ${i.email}.`, tono: "info" } : { texto: mensajeDeError(r.codigo), tono: "danger" });
    recargar();
  }

  if (miembros.error || invitaciones.error) return <ErrorCarga alReintentar={recargar} />;

  return (
    <section className="card">
      <h2>{titulo}</h2>
      <Mensaje {...mensaje} />
      {miembros.cargando ? (
        <p className="muted">Cargando…</p>
      ) : (miembros.datos ?? []).length === 0 ? (
        <p className="muted">Aún no hay personas con acceso.</p>
      ) : (
        <ul className="lista-filas">
          {(miembros.datos ?? []).map((m) => (
            <li key={m.user_id} className="fila">
              <div>
                <b>{m.profiles?.nombre}</b>
                {m.user_id === sesion.userId && <span className="muted"> (tú)</span>}
                <small>
                  {m.profiles?.email} · {nombrePerfil[m.perfil]}
                </small>
              </div>
              <div className="fila-acciones">
                <StatusChip tone={tonoEstado[m.estado]}>{textoEstado[m.estado]}</StatusChip>
                {gestiona && m.user_id !== sesion.userId && m.estado === "activa" && (
                  <SecondaryButton onClick={() => void cambiarEstado(m, false)}>Desactivar</SecondaryButton>
                )}
                {gestiona && m.user_id !== sesion.userId && m.estado === "desactivada" && (
                  <SecondaryButton onClick={() => void cambiarEstado(m, true)}>Reactivar</SecondaryButton>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {(invitaciones.datos ?? []).length > 0 && (
        <>
          <h3>Invitaciones pendientes</h3>
          <ul className="lista-filas">
            {invitaciones.datos!.map((i) => (
              <li key={i.id} className="fila">
                <div>
                  <b>{i.nombre}</b>
                  <small>
                    {i.email} · {nombrePerfil[i.perfil]} · vence el{" "}
                    {new Date(i.expires_at).toLocaleDateString("es-CL")}
                  </small>
                </div>
                {invitables.includes(i.perfil) && (
                  <div className="fila-acciones">
                    <SecondaryButton onClick={() => void reenviar(i)}>Reenviar</SecondaryButton>
                    <SecondaryButton onClick={() => void revocar(i)}>Revocar</SecondaryButton>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
      {invitables.length > 0 && (
        <FormularioInvitacion
          organizationId={organizationId}
          perfiles={invitables}
          alInvitar={(email) => {
            setMensaje({ texto: `Enviamos la invitación a ${email}.`, tono: "info" });
            recargar();
          }}
          alFallar={(codigo) => setMensaje({ texto: mensajeDeError(codigo), tono: "danger" })}
        />
      )}
    </section>
  );
}

function FormularioInvitacion({
  organizationId,
  perfiles,
  alInvitar,
  alFallar,
}: {
  organizationId: string;
  perfiles: Perfil[];
  alInvitar: (email: string) => void;
  alFallar: (codigo: string) => void;
}) {
  const { sesionInvalida } = useAuth();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [perfil, setPerfil] = useState<Perfil>(perfiles[0]);
  const [ocupado, setOcupado] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setOcupado(true);
    const r = await invitar({ organization_id: organizationId, email: email.trim(), nombre: nombre.trim(), perfil });
    setOcupado(false);
    if (r.ok) {
      alInvitar(email.trim());
      setNombre("");
      setEmail("");
    } else if (r.codigo === "sesion_expirada") sesionInvalida();
    else alFallar(r.codigo);
  }

  return (
    <form className="formulario-invitacion" onSubmit={enviar}>
      <h3>
        <MailPlus size={18} /> Invitar a una persona
      </h3>
      <div className="campos">
        <label>
          Nombre
          <input required maxLength={120} value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </label>
        <label>
          Correo
          <input type="email" required maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        {perfiles.length > 1 && (
          <label>
            Perfil
            <select value={perfil} onChange={(e) => setPerfil(e.target.value as Perfil)}>
              {perfiles.map((p) => (
                <option key={p} value={p}>
                  {nombrePerfil[p]}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <PrimaryButton disabled={ocupado}>{ocupado ? "Enviando…" : "Enviar invitación"}</PrimaryButton>
    </form>
  );
}
