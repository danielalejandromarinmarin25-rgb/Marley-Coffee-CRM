import { useAuth, useSesion } from "../../auth/AuthProvider";
import { PageHeading } from "../../components/ui";
import { Personas } from "./Personas";

// Cliente B2B. El administrador invita, activa y desactiva; los integrantes solo ven.
export function MiEquipo() {
  const sesion = useSesion();
  const { puede } = useAuth();
  const gestiona = puede("equipo.gestionar");
  return (
    <>
      <PageHeading
        eyebrow={sesion.organizacionNombre.toUpperCase()}
        title="Mi equipo"
        description={
          gestiona
            ? "Invita a las personas de tu empresa y administra su acceso."
            : "Personas de tu empresa con acceso a Marley Conecta. Solo el administrador puede hacer cambios."
        }
      />
      <Personas
        organizationId={sesion.organizationId}
        titulo="Personas"
        invitables={gestiona ? ["cliente_integrante", "cliente_admin"] : []}
        gestiona={gestiona}
      />
    </>
  );
}
