import { useAuth, useSesion } from "../../auth/AuthProvider";
import { PageHeading } from "../../components/ui";
import { useConsulta } from "../../lib/datos";
import type { Organizacion } from "../../lib/modelo";
import { supabase } from "../../lib/supabase";
import { ErrorCarga } from "../errores/Errores";
import { DatosEmpresa, Puntos } from "./Empresa";
import { EjecutivoAsignado } from "../inicio/Inicio";

// Cliente B2B: datos de su empresa y sus puntos. El administrador edita el nombre comercial,
// el contacto y los datos operativos de cada punto; agregar o dar de baja un punto lo hace Marley.
export function MiEmpresa() {
  const sesion = useSesion();
  const { puede } = useAuth();
  const org = useConsulta<Organizacion>(() =>
    supabase
      .from("organizations")
      .select("id, tipo, rut, razon_social, nombre_comercial, contacto_nombre, contacto_email, contacto_telefono")
      .eq("id", sesion.organizationId)
      .single(),
  );
  if (org.error) return <ErrorCarga alReintentar={() => void org.recargar()} />;
  if (!org.datos) return <p className="muted">Cargando…</p>;
  return (
    <>
      <PageHeading
        eyebrow="MI EMPRESA"
        title={org.datos.nombre_comercial}
        description="La razón social, el RUT y las condiciones comerciales vienen de Marley. Para cambiarlos, escribe a tu ejecutivo."
      />
      <EjecutivoAsignado />
      <DatosEmpresa
        key={org.datos.nombre_comercial + org.datos.contacto_nombre}
        org={org.datos}
        editable={puede("empresa.editar")}
        alGuardar={() => void org.recargar()}
      />
      <Puntos
        organizationId={sesion.organizationId}
        permisos={{ editar: puede("puntos.editar"), gestionar: false, maquinas: false }}
      />
    </>
  );
}
