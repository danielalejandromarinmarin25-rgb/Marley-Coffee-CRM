// Avisos dentro de la app: campana con el número de no leídos y la lista de avisos de cada persona.
// RLS entrega solo los avisos propios. Se actualizan cada minuto y al volver a la pestaña.
import { useEffect, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { EmptyState, PageHeading } from "../../components/ui";
import { Cargando } from "../../components/reposicion-ui";
import { useConsulta, useRefresco } from "../../lib/datos";
import { fechaCorta } from "../../lib/formato-reposicion";
import { supabase } from "../../lib/supabase";
import { ErrorCarga } from "../errores/Errores";

interface Aviso {
  id: string;
  tipo: string;
  titulo: string;
  cuerpo: string;
  enlace: string;
  creada_at: string;
  leida_at: string | null;
}

const EVENTO = "marley:avisos";
const avisar = () => window.dispatchEvent(new Event(EVENTO));

export function Campana() {
  const [noLeidos, setNoLeidos] = useState(0);
  const contar = async () => {
    const { count } = await supabase.from("notificaciones").select("id", { count: "exact", head: true }).is("leida_at", null);
    setNoLeidos(count ?? 0);
  };
  useEffect(() => {
    void contar();
    window.addEventListener(EVENTO, contar);
    window.addEventListener("hashchange", contar);
    return () => {
      window.removeEventListener(EVENTO, contar);
      window.removeEventListener("hashchange", contar);
    };
  }, []);
  useRefresco(() => void contar(), 60_000);
  const etiqueta = noLeidos ? `Avisos: ${noLeidos} sin leer` : "Avisos";
  return (
    <a href="#/avisos" className="campana icon-button" aria-label={etiqueta} title={etiqueta}>
      <Bell size={21} aria-hidden="true" />
      {noLeidos > 0 && (
        <span className="campana-numero" aria-hidden="true">
          {noLeidos > 9 ? "9+" : noLeidos}
        </span>
      )}
    </a>
  );
}

export function Notificaciones() {
  const avisos = useConsulta<Aviso[]>(
    () =>
      supabase
        .from("notificaciones")
        .select("id, tipo, titulo, cuerpo, enlace, creada_at, leida_at")
        .order("creada_at", { ascending: false })
        .limit(50) as never,
  );
  useRefresco(() => void avisos.recargar(), 60_000);
  const sinLeer = (avisos.datos ?? []).filter((a) => !a.leida_at).length;

  async function marcar(ids: string[] | null) {
    await supabase.rpc("marcar_notificaciones_leidas", { p_ids: ids ?? undefined });
    avisar();
    void avisos.recargar();
  }

  if (avisos.error) return <ErrorCarga alReintentar={() => void avisos.recargar()} />;
  return (
    <>
      <PageHeading eyebrow="AVISOS" title="Avisos" description={sinLeer ? `${sinLeer} sin leer` : "Estás al día."}>
        {sinLeer > 0 && (
          <button className="button secondary" type="button" onClick={() => void marcar(null)}>
            <CheckCheck size={18} aria-hidden="true" /> Marcar todo como leído
          </button>
        )}
      </PageHeading>
      {avisos.cargando && !avisos.datos ? (
        <Cargando />
      ) : (avisos.datos ?? []).length === 0 ? (
        <EmptyState title="Sin avisos" description="Aquí verás las alertas de reposición y el avance de tus pedidos." />
      ) : (
        <ul className="lista-tarjetas compacta" aria-label="Avisos">
          {avisos.datos!.map((a) => (
            <li key={a.id} className={`card aviso ${a.leida_at ? "leido" : "nuevo"}`}>
              <a
                className="fila-enlace"
                href={`#${a.enlace}`}
                onClick={() => {
                  if (!a.leida_at) void marcar([a.id]);
                }}
              >
                <span className="grow">
                  <b>
                    {!a.leida_at && <span className="etiqueta-nuevo">Nuevo</span>}
                    {a.titulo}
                  </b>
                  <small>{a.cuerpo}</small>
                  <small>{fechaCorta(a.creada_at)}</small>
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
