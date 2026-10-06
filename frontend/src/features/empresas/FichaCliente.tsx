import { useAuth } from "../../auth/AuthProvider";
import { PageHeading } from "../../components/ui";
import { useConsulta } from "../../lib/datos";
import type { Organizacion } from "../../lib/modelo";
import { supabase } from "../../lib/supabase";
import { ErrorCarga, NoEncontrado } from "../errores/Errores";
import { Personas } from "../equipo/Personas";
import { DatosEmpresa, Puntos } from "./Empresa";

// Ficha de una empresa cliente para gerencia, vendedor o KAM. Si el ID no está al alcance de
// la sesión, la consulta vuelve vacía (RLS) y se muestra "no encontrado".
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function FichaCliente({ id }: { id: string }) {
  return UUID.test(id) ? <Ficha id={id} /> : <NoEncontrado />;
}

function Ficha({ id }: { id: string }) {
  const { puede } = useAuth();
  const org = useConsulta<Organizacion | null>(
    () =>
      supabase
        .from("organizations")
        .select("id, tipo, rut, razon_social, nombre_comercial, contacto_nombre, contacto_email, contacto_telefono")
        .eq("id", id)
        .eq("tipo", "cliente")
        .maybeSingle(),
    [id],
  );
  const recienActivada = location.hash.includes("activada=1");

  if (org.cargando) return <p className="muted">Cargando…</p>;
  if (org.error) return <ErrorCarga alReintentar={() => void org.recargar()} />;
  if (!org.datos) return <NoEncontrado />;

  const o = org.datos;
  return (
    <>
      <PageHeading eyebrow="FICHA DEL CLIENTE" title={o.nombre_comercial} description={`${o.razon_social} · RUT ${o.rut}`}>
        <a className="button secondary" href="#/clientes">
          Volver a clientes
        </a>
      </PageHeading>
      {recienActivada && (
        <div className="notice info" role="status">
          <p>La empresa quedó activa en la app. Invita ahora a su administrador.</p>
        </div>
      )}
      <div className="two-columns">
        <DatosEmpresa key={o.nombre_comercial + o.contacto_nombre} org={o} editable={puede("empresa.editar")} alGuardar={() => void org.recargar()} />
        <Personas
          organizationId={o.id}
          titulo="Personas de la empresa"
          invitables={puede("clientes.invitar_admin") ? ["cliente_admin"] : []}
          gestiona={false}
        />
      </div>
      <Puntos
        organizationId={o.id}
        permisos={{
          editar: puede("puntos.editar"),
          gestionar: puede("puntos.gestionar"),
          maquinas: puede("maquinas.editar"),
        }}
      />
    </>
  );
}
