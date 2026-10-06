import { useSesion } from "../../auth/AuthProvider";
import { PageHeading } from "../../components/ui";
import { useConsulta } from "../../lib/datos";
import type { EmpresaCrm } from "../../lib/modelo";
import { supabase } from "../../lib/supabase";
import { Personas } from "./Personas";

// Gerencia. Invita, activa y desactiva a vendedores y KAM. La asignación de clientes
// viene del CRM y aquí solo se muestra.
export function EquipoComercial() {
  const sesion = useSesion();
  const cartera = useConsulta<(Pick<EmpresaCrm, "rut" | "razon_social"> & { profiles: { nombre: string } | null })[]>(
    () => supabase.from("crm_empresas").select("rut, razon_social, profiles(nombre)").order("razon_social"),
  );
  const porPersona = new Map<string, string[]>();
  for (const c of cartera.datos ?? []) {
    const nombre = c.profiles?.nombre ?? "Sin asignar";
    porPersona.set(nombre, [...(porPersona.get(nombre) ?? []), c.razon_social]);
  }
  return (
    <>
      <PageHeading eyebrow="GERENCIA" title="Equipo comercial" description="Vendedores, KAM y gerencia con acceso a Marley Conecta." />
      <Personas
        organizationId={sesion.organizationId}
        titulo="Personas de Marley"
        invitables={["vendedor", "kam", "gerencia"]}
        gestiona
      />
      <section className="card">
        <h2>Clientes asignados</h2>
        <p className="muted">La asignación se define en el CRM.</p>
        <ul className="lista-filas">
          {[...porPersona.entries()].map(([nombre, empresas]) => (
            <li key={nombre} className="fila">
              <div>
                <b>{nombre}</b>
                <small>{empresas.join(" · ")}</small>
              </div>
              <span className="muted">{empresas.length}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
