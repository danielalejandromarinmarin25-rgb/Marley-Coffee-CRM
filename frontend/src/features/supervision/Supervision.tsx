// Gerencia · Supervisión: las alertas críticas (cerca del quiebre y sin confirmación) y el estado
// de los pedidos. Solo lectura: gerencia supervisa; el vendedor o KAM sigue a cargo del contacto.
import { AlertTriangle, PackageCheck, Truck } from "lucide-react";
import { useSesion } from "../../auth/AuthProvider";
import { EmptyState, MetricCard, PageHeading } from "../../components/ui";
import { Cargando, ChipAlerta, FuenteDato, Truncado } from "../../components/reposicion-ui";
import { useConsulta, useRefresco } from "../../lib/datos";
import { ESTADOS_PEDIDO, fechaCorta, nombreEstadoPedido, textoCobertura, type EstadoPedido } from "../../lib/formato-reposicion";
import { SELECT_PEDIDO, uno, type AlertaVista, type PedidoVista } from "../../lib/reposicion";
import { supabase } from "../../lib/supabase";
import { ErrorCarga } from "../errores/Errores";
import { ChipPedido } from "../pedidos/Pedidos";

type AlertaSupervision = Pick<
  AlertaVista,
  "id" | "estado" | "severidad" | "cobertura_dias" | "fuente" | "dato_at" | "critica_at" | "points" | "productos"
> & {
  organizations: { nombre_comercial: string; crm_empresas: { profiles: { nombre: string } | null } | null };
};

const primerNombre = (n: string) => n.split(" ")[0];

export function Supervision() {
  const sesion = useSesion();
  const alertas = useConsulta<AlertaSupervision[]>(
    () =>
      supabase
        .from("alertas")
        .select(
          `id, estado, severidad, cobertura_dias, fuente, dato_at, critica_at,
           points(id, nombre, direccion, telemetria_disponible, canal), productos(id, nombre, formato, kg_por_bolsa),
           organizations(nombre_comercial, crm_empresas(profiles(nombre)))`,
        )
        .in("estado", ["abierta", "pospuesta", "critica"])
        .order("cobertura_dias", { ascending: true }) as never,
  );
  const pedidos = useConsulta<PedidoVista[]>(
    () => supabase.from("pedidos").select(SELECT_PEDIDO).order("confirmado_at", { ascending: false }).limit(20) as never,
  );
  useRefresco(() => {
    void alertas.recargar();
    void pedidos.recargar();
  }, 60_000);

  if (alertas.error || pedidos.error) return <ErrorCarga alReintentar={() => void alertas.recargar()} />;
  const criticas = (alertas.datos ?? []).filter((a) => a.estado === "critica");
  const enCurso = (pedidos.datos ?? []).filter((p) => p.estado !== "entregado");
  const porEstado = (e: EstadoPedido) => (pedidos.datos ?? []).filter((p) => p.estado === e).length;

  return (
    <>
      <PageHeading
        eyebrow="GERENCIA · SUPERVISIÓN"
        title={`Hola, ${primerNombre(sesion.nombre)}`}
        description="Alertas que llegaron a crítica sin confirmación del cliente y el avance de los pedidos."
      />
      {!alertas.datos || !pedidos.datos ? (
        <Cargando />
      ) : (
        <>
          <div className="metrics metricas-supervision">
            <MetricCard label="Alertas críticas" value={criticas.length} detail="Sin confirmación, cerca del quiebre" icon={<AlertTriangle size={18} />} accent={criticas.length > 0} />
            <MetricCard label="Alertas abiertas" value={alertas.datos.length} detail="En gestión por el equipo comercial" />
            <MetricCard label="Pedidos en curso" value={enCurso.length} detail={`${porEstado("en_reparto")} en reparto`} icon={<Truck size={18} />} />
            <MetricCard label="Entregados" value={porEstado("entregado")} detail="Últimos 20 pedidos" icon={<PackageCheck size={18} />} />
          </div>

          <section aria-labelledby="criticas">
            <div className="section-heading">
              <h2 id="criticas">Alertas críticas</h2>
            </div>
            {criticas.length === 0 ? (
              <EmptyState title="Sin alertas críticas" description="Todas las alertas están en plazo o ya confirmadas." />
            ) : (
              <div className="tabla-o-tarjetas">
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Cliente y punto</th>
                      <th scope="col">Café</th>
                      <th scope="col">Cobertura</th>
                      <th scope="col">Responsable</th>
                      <th scope="col">Fuente y fecha</th>
                      <th scope="col">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {criticas.map((a) => (
                      <tr key={a.id}>
                        <td data-etiqueta="Cliente" className="celda-principal">
                          <Truncado texto={a.organizations.nombre_comercial} como="b" />
                          <Truncado texto={a.points.nombre} />
                        </td>
                        <td data-etiqueta="Café">{a.productos.nombre}</td>
                        <td data-etiqueta="Cobertura">
                          <b>{textoCobertura(a.cobertura_dias)}</b>
                        </td>
                        <td data-etiqueta="Responsable">{uno(a.organizations.crm_empresas)?.profiles?.nombre ?? "Sin asignar"}</td>
                        <td data-etiqueta="Fuente">
                          <FuenteDato fuente={a.fuente} datoAt={a.dato_at} />
                        </td>
                        <td data-etiqueta="Estado" className="celda-estado">
                          <span>
                            <ChipAlerta estado={a.estado} severidad={a.severidad} />
                            <small className="muted">desde {fechaCorta(a.critica_at)}</small>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section aria-labelledby="estado-pedidos">
            <div className="section-heading">
              <h2 id="estado-pedidos">Estado de los pedidos</h2>
              <a href="#/pedidos">Ver todos</a>
            </div>
            <ol className="embudo" aria-label="Pedidos por estado">
              {ESTADOS_PEDIDO.map((e) => (
                <li key={e}>
                  <b>{porEstado(e)}</b>
                  <span>{nombreEstadoPedido[e]}</span>
                </li>
              ))}
            </ol>
            {enCurso.length > 0 && (
              <ul className="lista-tarjetas compacta">
                {enCurso.map((p) => (
                  <li key={p.id} className="card">
                    <a className="fila-enlace" href={`#/pedidos/${p.id}`}>
                      <span className="grow">
                        <Truncado texto={`${p.codigo} · ${p.organizations.nombre_comercial}`} como="b" />
                        <small>
                          {p.points.nombre} · confirmado {fechaCorta(p.confirmado_at)}
                        </small>
                      </span>
                      <ChipPedido estado={p.estado} />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </>
  );
}
