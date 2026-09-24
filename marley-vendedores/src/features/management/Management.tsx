import { useState } from "react";
import { Plus, ArrowUpRight, Bell, CheckCheck } from "lucide-react";
import { useStore } from "../../store/AppStore";
import {
  PageHeading,
  PrimaryButton,
  SecondaryButton,
  StatusChip,
  EmptyState,
  MetricCard,
} from "../../components/ui";
import { RecordForm } from "./RecordForm";
import { Photos } from "../../components/Photos";
import { money, shortDate } from "../../utils/domain";
export function Management({
  kind,
  id,
}: {
  kind: "opportunities" | "cases";
  id?: string;
}) {
  const { data } = useStore();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const list = kind === "opportunities" ? data.opportunities : data.cases;
  const selected = list.find((x) => x.id === id);
  const statuses =
    kind === "opportunities"
      ? ["Nueva", "En seguimiento", "Propuesta", "Ganada", "Perdida"]
      : ["Abierto", "En proceso", "Resuelto", "Cerrado"];
  return (
    <>
      {id && (
        <a
          className="back-link"
          href={kind === "opportunities" ? "#/oportunidades" : "#/casos"}
        >
          ← Volver al listado
        </a>
      )}
      <PageHeading
        title={kind === "opportunities" ? "Oportunidades" : "Casos"}
        description={
          kind === "opportunities"
            ? "Convierte conversaciones en nuevas posibilidades."
            : "Acompaña al cliente hasta resolverlo."
        }
      >
        <PrimaryButton onClick={() => setOpen(true)}>
          <Plus size={18} />
          {selected
            ? "Editar"
            : kind === "opportunities"
              ? "Nueva oportunidad"
              : "Nuevo caso"}
        </PrimaryButton>
      </PageHeading>
      {!id && (
        <div className="tabs">
          <button
            className={!filter ? "active" : ""}
            onClick={() => setFilter("")}
          >
            Todas
          </button>
          {statuses.map((s) => (
            <button
              className={filter === s ? "active" : ""}
              key={s}
              onClick={() => setFilter(s)}
            >
              {s}
            </button>
          ))}
        </div>
      )}
      <div className="stack">
        {list
          .filter(
            (x) =>
              (!id || x.id === id) &&
              (!filter || ("stage" in x ? x.stage : x.status) === filter),
          )
          .map((x) => (
            <article className="card" key={x.id}>
              <div className="row">
                <span className="eyebrow">
                  {data.customers.find((c) => c.id === x.customerId)?.name}
                </span>
                <StatusChip
                  tone={
                    ("stage" in x ? x.stage : x.status) === "Ganada"
                      ? "success"
                      : "info"
                  }
                >
                  {"stage" in x ? x.stage : x.status}
                </StatusChip>
              </div>
              <h2>{"name" in x ? x.name : x.description}</h2>
              {"value" in x ? (
                <div className="row">
                  <p>
                    {x.product} · Cierre esperado {shortDate(x.expectedDate)}
                  </p>
                  <h2>{money(x.value)}</h2>
                </div>
              ) : (
                <p>
                  {x.type} · Prioridad {x.priority} · {x.responsible}
                </p>
              )}
              {id ? (
                <>
                  <p>{x.comments || "Sin comentarios adicionales."}</p>
                  {kind === "cases" && (
                    <Photos customerId={x.customerId} entityId={x.id} />
                  )}
                </>
              ) : (
                <a
                  className="text-link"
                  href={`#/${kind === "opportunities" ? "oportunidades" : "casos"}/${x.id}`}
                >
                  Ver detalle <ArrowUpRight size={16} />
                </a>
              )}
            </article>
          ))}
      </div>
      {!list.filter(
        (x) =>
          (!id || x.id === id) &&
          (!filter || ("stage" in x ? x.stage : x.status) === filter),
      ).length && (
        <EmptyState
          title={
            id
              ? "Registro no disponible"
              : `No hay ${kind === "opportunities" ? "oportunidades" : "casos"} en este estado`
          }
        />
      )}{" "}
      {open && (
        <RecordForm
          kind={kind}
          existing={selected}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
export function Performance() {
  const { data } = useStore();
  const m = data.metrics;
  const additional = data.orders.filter(
    (o) => o.id.startsWith("TMP") && o.syncStatus === "SYNCED",
  );
  const sales = m.sales + additional.reduce((s, o) => s + o.total, 0);
  const orders = m.orders + additional.length;
  return (
    <>
      <PageHeading
        title="Mi gestión"
        description="Tu avance, tus relaciones y lo que estás construyendo."
      />
      <section className="performance-hero">
        <div>
          <div className="eyebrow">VENTAS DEL MES · DEMOSTRACIÓN</div>
          <h1>{money(sales)}</h1>
          <p>Meta mensual: {money(m.goal)}</p>
        </div>
        <div>
          <strong>
            {Math.round((sales / m.goal) * 100)}
            <small>%</small>
          </strong>
          <progress max={m.goal} value={sales} />
          <span>Cumplimiento de meta</span>
        </div>
      </section>
      <div className="metrics three spaced">
        <MetricCard label="Pedidos" value={orders} />
        <MetricCard label="Ticket promedio" value={money(sales / orders)} />
        <MetricCard label="Clientes activos" value={m.activeCustomers} />
        <MetricCard label="Clientes recuperados" value={m.recoveredCustomers} />
        <MetricCard
          label="Visitas realizadas"
          value={data.visits.filter((v) => v.status === "Realizada").length}
        />
        <MetricCard
          label="Reposiciones gestionadas"
          value={
            data.alerts.filter((a) => a.status === "SENT_BY_SELLER").length
          }
        />
        <MetricCard label="Oportunidades" value={data.opportunities.length} />
        <MetricCard
          label="Valor de oportunidades abiertas"
          value={money(
            data.opportunities
              .filter((o) => !["Ganada", "Perdida"].includes(o.stage))
              .reduce((s, o) => s + o.value, 0),
          )}
        />
        <MetricCard
          label="Casos pendientes"
          value={
            data.cases.filter(
              (c) => !["Resuelto", "Cerrado"].includes(c.status),
            ).length
          }
        />
      </div>
      <p className="muted spaced">
        Cifras referenciales de la cartera asignada. Los pedidos nuevos
        procesados en la demo se suman a la base mensual.
      </p>
    </>
  );
}
export function Notifications() {
  const { data, update } = useStore();
  return (
    <>
      <PageHeading
        title="Notificaciones"
        description="Todo lo que necesita tu atención, en un lugar."
      >
        <SecondaryButton
          onClick={() =>
            void update((d) => ({
              ...d,
              notifications: d.notifications.map((n) => ({ ...n, read: true })),
            }))
          }
        >
          <CheckCheck size={17} />
          Marcar todas como leídas
        </SecondaryButton>
      </PageHeading>
      <div className="card">
        {data.notifications.map((n) => (
          <a
            className={`notification-row ${n.read ? "" : "unread"}`}
            href={`#${n.route}`}
            key={n.id}
            onClick={() =>
              void update((d) => ({
                ...d,
                notifications: d.notifications.map((x) =>
                  x.id === n.id ? { ...x, read: true } : x,
                ),
              }))
            }
          >
            <span className="priority-icon">
              <Bell size={19} />
            </span>
            <div className="grow">
              <small>
                {n.type} · {shortDate(n.createdAt)}
              </small>
              <h3>{n.title}</h3>
              <span className="muted">{n.read ? "Leído" : "No leído"}</span>
            </div>
            <ArrowUpRight size={19} />
          </a>
        ))}
        {!data.notifications.length && (
          <EmptyState
            title="Estás al día"
            description="Tus nuevas notificaciones aparecerán aquí."
          />
        )}
      </div>
    </>
  );
}
