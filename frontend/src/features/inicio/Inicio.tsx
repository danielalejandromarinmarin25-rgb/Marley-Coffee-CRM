import { Users } from "lucide-react";
import { useSesion } from "../../auth/AuthProvider";
import { capaDe, nombreCanal } from "../../auth/perfiles";
import { EmptyState, PageHeading, StatusChip } from "../../components/ui";
import { useConsulta } from "../../lib/datos";
import type { Punto } from "../../lib/modelo";
import { supabase } from "../../lib/supabase";
import { Hoy } from "../comercial/Hoy";
import { Reposicion } from "../reposicion/Reposicion";
import { Supervision } from "../supervision/Supervision";

// La pantalla de entrada de cada perfil es su tarea del día (flujo de reposición, Fase 3):
// Reposición para el cliente, Hoy para el vendedor o KAM y Supervisión para gerencia.
export function Inicio() {
  const sesion = useSesion();
  const capa = capaDe[sesion.perfil];
  if (capa === "cliente") return <Reposicion />;
  if (capa === "comercial") return <Hoy />;
  if (capa === "gerencia") return <Supervision />;
  return <InicioPartner />;
}

// Cliente: su ejecutivo en Marley y el acceso a Mi equipo (se muestra en Mi empresa).
export function EjecutivoAsignado() {
  const ejecutivo = useConsulta<{ nombre: string; email: string; perfil: string }[]>(() => supabase.rpc("mi_ejecutivo"));
  const contacto = ejecutivo.datos?.[0];
  return (
    <div className="accesos">
      {contacto && (
        <section className="card">
          <h2>Tu ejecutivo en Marley</h2>
          <div className="detail-row">
            <small>{contacto.perfil === "kam" ? "Key Account Manager" : "Vendedor"}</small>
            <b>
              {contacto.nombre} · <a href={`mailto:${contacto.email}`}>{contacto.email}</a>
            </b>
          </div>
        </section>
      )}
      <a className="card acceso-rapido" href="#/equipo">
        <Users size={22} />
        <b>Mi equipo</b>
        <span className="muted">Personas con acceso</span>
      </a>
    </div>
  );
}

// Partner: solo los puntos que atiende (la carga de reportes queda documentada, fuera de esta fase).
function InicioPartner() {
  const sesion = useSesion();
  const puntos = useConsulta<Pick<Punto, "id" | "nombre" | "canal" | "direccion">[]>(() =>
    supabase.from("points").select("id, nombre, canal, direccion").eq("partner_org_id", sesion.organizationId).order("nombre"),
  );
  return (
    <>
      <PageHeading eyebrow={sesion.organizacionNombre.toUpperCase()} title="Mis puntos" description="Puntos que atiendes para Marley Coffee." />
      {puntos.datos && puntos.datos.length === 0 ? (
        <EmptyState title="Aún no tienes puntos asignados" />
      ) : (
        <section className="card">
          <ul className="lista-filas">
            {(puntos.datos ?? []).map((p) => (
              <li key={p.id} className="fila">
                <div>
                  <b>{p.nombre}</b>
                  <small>{p.direccion || "Sin dirección"}</small>
                </div>
                <StatusChip tone="info">{nombreCanal[p.canal]}</StatusChip>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
