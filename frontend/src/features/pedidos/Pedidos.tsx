// Pedidos: lista y detalle con su estado. El estado lo cambia Marley (en producción, el ERP);
// la app solo lo muestra. En celular, tarjetas; en pantallas anchas, tabla.
import { ArrowLeft, Check } from "lucide-react";
import { useSesion } from "../../auth/AuthProvider";
import { capaDe } from "../../auth/perfiles";
import { EmptyState, PageHeading, StatusChip } from "../../components/ui";
import { Cargando, Truncado } from "../../components/reposicion-ui";
import { useConsulta, useRefresco } from "../../lib/datos";
import { bolsas, ESTADOS_PEDIDO, fechaCorta, nombreEstadoPedido, type EstadoPedido } from "../../lib/formato-reposicion";
import { SELECT_PEDIDO, totalBolsas, type PedidoVista } from "../../lib/reposicion";
import { supabase } from "../../lib/supabase";
import { ErrorCarga, NoEncontrado } from "../errores/Errores";

const tonoEstado: Record<EstadoPedido, string> = {
  recibido: "info",
  en_preparacion: "warning",
  en_reparto: "warning",
  entregado: "success",
};

export const ChipPedido = ({ estado }: { estado: EstadoPedido }) => (
  <StatusChip tone={tonoEstado[estado]}>{nombreEstadoPedido[estado]}</StatusChip>
);

export function Pedidos() {
  const sesion = useSesion();
  const marley = capaDe[sesion.perfil] !== "cliente";
  const pedidos = useConsulta<PedidoVista[]>(
    () => supabase.from("pedidos").select(SELECT_PEDIDO).order("confirmado_at", { ascending: false }).limit(50) as never,
  );
  if (pedidos.error) return <ErrorCarga alReintentar={() => void pedidos.recargar()} />;
  const lista = pedidos.datos ?? [];
  return (
    <>
      <PageHeading
        eyebrow={marley ? "PEDIDOS DE MIS CLIENTES" : sesion.organizacionNombre.toUpperCase()}
        title="Pedidos"
        description="Cada pedido confirmado, con su estado de entrega."
      />
      {pedidos.cargando && !pedidos.datos ? (
        <Cargando />
      ) : lista.length === 0 ? (
        <EmptyState title="Aún no hay pedidos" description="Cuando confirmes un pedido sugerido, lo verás aquí con su estado." />
      ) : (
        <div className="tabla-o-tarjetas">
          <table>
            <thead>
              <tr>
                <th scope="col">Pedido</th>
                {marley && <th scope="col">Cliente</th>}
                <th scope="col">Punto</th>
                <th scope="col">Cafés</th>
                <th scope="col">Confirmado</th>
                <th scope="col">Estado</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((p) => (
                <tr key={p.id}>
                  <td data-etiqueta="Pedido">
                    <a className="enlace-fila" href={`#/pedidos/${p.id}`}>
                      {p.codigo}
                    </a>
                  </td>
                  {marley && (
                    <td data-etiqueta="Cliente">
                      <Truncado texto={p.organizations.nombre_comercial} />
                    </td>
                  )}
                  <td data-etiqueta="Punto">
                    <Truncado texto={p.points.nombre} />
                  </td>
                  <td data-etiqueta="Cafés">{bolsas(totalBolsas(p.lineas_pedido))}</td>
                  <td data-etiqueta="Confirmado">{fechaCorta(p.confirmado_at)}</td>
                  <td data-etiqueta="Estado" className="celda-estado">
                    <ChipPedido estado={p.estado} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export function DetallePedido({ id }: { id: string }) {
  const pedido = useConsulta<PedidoVista>(() => supabase.from("pedidos").select(SELECT_PEDIDO).eq("id", id).maybeSingle() as never, [id]);
  // El estado avanza mientras la pantalla está abierta: se vuelve a consultar cada 20 s y al volver a la pestaña.
  useRefresco(() => void pedido.recargar(), 20_000);

  if (pedido.error) return <ErrorCarga alReintentar={() => void pedido.recargar()} />;
  if (pedido.cargando && !pedido.datos) return <Cargando />;
  const p = pedido.datos;
  if (!p) return <NoEncontrado />;
  const actual = ESTADOS_PEDIDO.indexOf(p.estado);
  const fechaDe = (e: EstadoPedido) => p.historial_pedido.find((h) => h.estado === e)?.ocurrido_at ?? null;

  return (
    <>
      <a className="back-link" href="#/pedidos">
        <ArrowLeft size={14} aria-hidden="true" /> Pedidos
      </a>
      <PageHeading eyebrow={`PEDIDO ${p.codigo}`} title={nombreEstadoPedido[p.estado]} description={p.points.nombre} />
      <div className="dos-columnas">
        <section className="card" aria-labelledby="seguimiento">
          <h2 id="seguimiento">Seguimiento</h2>
          <ol className="linea-tiempo">
            {ESTADOS_PEDIDO.map((e, i) => {
              const estado = i < actual ? "hecho" : i === actual ? "actual" : "pendiente";
              return (
                <li key={e} className={estado} aria-current={estado === "actual" ? "step" : undefined}>
                  <span className="marca" aria-hidden="true">
                    {i <= actual && <Check size={14} />}
                  </span>
                  <div>
                    <b>{nombreEstadoPedido[e]}</b>
                    <small>
                      {estado === "pendiente" ? "Pendiente" : fechaCorta(fechaDe(e))}
                      {estado === "actual" && " · estado actual"}
                    </small>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
        <section className="card" aria-labelledby="detalle">
          <h2 id="detalle">Detalle</h2>
          <ul className="lista-filas">
            {p.lineas_pedido.map((l) => (
              <li key={l.productos.nombre} className="fila fila-fija">
                <div>
                  <b>{l.productos.nombre}</b>
                  <small>{l.productos.formato}</small>
                </div>
                <b>{bolsas(l.bolsas)}</b>
              </li>
            ))}
          </ul>
          <dl className="datos">
            <dt>Entrega en</dt>
            <dd>
              {p.points.nombre}
              {p.points.direccion && <small>{p.points.direccion}</small>}
            </dd>
            <dt>Confirmado por</dt>
            <dd>
              {p.confirmado_por_nombre ?? "—"} · {fechaCorta(p.confirmado_at)}
            </dd>
          </dl>
        </section>
      </div>
    </>
  );
}
