import { useState } from "react";
import {
  Phone,
  Mail,
  MessageCircle,
  Plus,
  MapPin,
  CalendarDays,
} from "lucide-react";
import { useStore } from "../../store/AppStore";
import {
  CustomerCard,
  SearchBar,
  FilterSheet,
  PageHeading,
  StatusChip,
  MetricCard,
  OrderCard,
  VisitCard,
  EmptyState,
  ConfirmDialog,
  PrimaryButton,
  SecondaryButton,
} from "../../components/ui";
import { day, money, shortDate, uid } from "../../utils/domain";
import { RecordForm } from "../management/RecordForm";
export function Customers() {
  const { data } = useStore();
  const [query, setQuery] = useState("");
  const [channel, setChannel] = useState("");
  const [filter, setFilter] = useState("");
  const customers = data.customers.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) &&
      (!channel || c.channel === channel) &&
      (!filter ||
        (filter === "risk"
          ? c.risk
          : filter === "replenishment"
            ? c.replenishment <= day()
            : filter === "case"
              ? data.cases.some(
                  (x) =>
                    x.customerId === c.id &&
                    !["Cerrado", "Resuelto"].includes(x.status),
                )
              : filter === "visit"
                ? data.visits.some(
                    (x) => x.customerId === c.id && x.status === "Programada",
                  )
                : filter === "opportunity"
                  ? data.opportunities.some(
                      (x) =>
                        x.customerId === c.id &&
                        !["Ganada", "Perdida"].includes(x.stage),
                    )
                  : c.lastPurchase < day(-20))),
  );
  return (
    <>
      <PageHeading
        title="Clientes"
        description="Conoce tu cartera. Cultiva cada relación."
      />
      <FilterSheet>
        <SearchBar value={query} onChange={setQuery} />
        <select
          aria-label="Filtrar canal"
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
        >
          <option value="">Todos los canales</option>
          {["Horeca", "OCS", "Conveniencia", "Panaderías"].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select
          aria-label="Filtrar estado"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">Todos los estados</option>
          <option value="risk">En riesgo</option>
          <option value="replenishment">Reposición pendiente</option>
          <option value="visit">Visita pendiente</option>
          <option value="opportunity">Con oportunidad</option>
          <option value="case">Caso abierto</option>
          <option value="purchase">Sin compra en 20 días</option>
        </select>
      </FilterSheet>
      <p className="list-count">{customers.length} clientes en tu cartera</p>
      <div className="customer-grid">
        {customers.map((c) => (
          <CustomerCard key={c.id} customer={c} />
        ))}
      </div>
      {!customers.length && (
        <EmptyState
          title="No encontramos clientes"
          description="Prueba con otro nombre o ajusta los filtros."
        />
      )}
    </>
  );
}
export function Customer360({ id }: { id: string }) {
  const { data, save } = useStore();
  const c = data.customers.find((c) => c.id === id);
  const [tab, setTab] = useState("Resumen");
  const [communication, setCommunication] = useState("");
  const [comment, setComment] = useState("");
  const [form, setForm] = useState("");
  if (!c) return <EmptyState title="Cliente no disponible en tu cartera" />;
  return (
    <>
      <a href="#/clientes" className="back-link">
        ← Volver a clientes
      </a>
      <PageHeading
        eyebrow={`CLIENTE 360° / ${c.channel.toUpperCase()}`}
        title={c.name}
        description={c.address}
      >
        <StatusChip tone={c.risk ? "danger" : "success"}>
          {c.risk ? "En riesgo" : "Activo"}
        </StatusChip>
      </PageHeading>
      <div className="card contact-card">
        <div>
          <b>{c.contact.name}</b>
          <p>Contacto principal</p>
        </div>
        <span>
          <Phone size={16} />
          {c.contact.phone}
        </span>
        <span>
          <Mail size={16} />
          {c.contact.email}
        </span>
        <small>Contacto ficticio de demostración</small>
      </div>
      <div className="actions quick-actions">
        <a href={`#/pedidos/nuevo?cliente=${c.id}`} className="button primary">
          <Plus size={17} />
          Crear pedido
        </a>
        {[
          ["WhatsApp", MessageCircle],
          ["Llamar", Phone],
          ["Correo", Mail],
        ].map(([label, Icon]) => {
          const I = Icon as typeof Phone;
          return (
            <SecondaryButton
              key={label as string}
              onClick={() => setCommunication(label as string)}
            >
              <I size={17} />
              {label as string}
            </SecondaryButton>
          );
        })}
        <SecondaryButton onClick={() => setForm("visits")}>
          <CalendarDays size={17} />
          Registrar visita
        </SecondaryButton>
      </div>
      <div className="tabs">
        {["Resumen", "Compras", "Gestión", "Actividad"].map((t) => (
          <button
            key={t}
            className={tab === t ? "active" : ""}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "Resumen" && (
        <>
          <div className="metrics four">
            <MetricCard
              label="Última compra"
              value={shortDate(c.lastPurchase)}
            />
            <MetricCard
              label="Próxima reposición"
              value={shortDate(c.replenishment)}
              accent
            />
            <MetricCard label="Frecuencia" value={`${c.frequency} días`} />
            <MetricCard label="Venta mensual" value={money(c.monthlySales)} />
          </div>
          <div className="two-columns spaced">
            <section className="card">
              <h2>El pulso de tu cliente</h2>
              <p className="muted">Indicadores de {c.channel}</p>
              {c.indicators.map((i) => (
                <div className="detail-row" key={i.label}>
                  <span>{i.label}</span>
                  <b>{i.value}</b>
                </div>
              ))}
              {c.risk && (
                <div className="notice danger">
                  <b>Motivo del riesgo</b>
                  <p>{c.risk}</p>
                </div>
              )}
              <h3 className="spaced">Última nota comercial</h3>
              <p>{c.note}</p>
            </section>
            <section className="card">
              <h2>Productos habituales</h2>
              {data.products
                .filter((p) => c.products.includes(p.id))
                .map((p) => (
                  <div className="detail-row" key={p.id}>
                    <span>
                      <b>{p.name}</b>
                      <small>{p.unit}</small>
                    </span>
                    <span>{p.usual} unidades</span>
                  </div>
                ))}
              <h3 className="spaced">Alertas y reposición</h3>
              {data.alerts
                .filter((a) => a.customerId === id)
                .map((a) => (
                  <a
                    className="detail-row"
                    key={a.id}
                    href={`#/alertas/${a.id}`}
                  >
                    {a.title}
                    <span>Ver →</span>
                  </a>
                ))}
            </section>
          </div>
        </>
      )}
      {tab === "Compras" && (
        <div className="stack">
          {data.orders
            .filter((o) => o.customerId === id)
            .map((o) => (
              <OrderCard key={o.id} order={o} customer={c} />
            ))}
          {!data.orders.some((o) => o.customerId === id) && (
            <EmptyState title="Aún no hay pedidos registrados" />
          )}
        </div>
      )}
      {tab === "Gestión" && (
        <>
          <div className="actions">
            <SecondaryButton onClick={() => setForm("opportunities")}>
              Crear oportunidad
            </SecondaryButton>
            <SecondaryButton onClick={() => setForm("cases")}>
              Crear caso
            </SecondaryButton>
            <SecondaryButton onClick={() => setForm("tasks")}>
              Crear tarea
            </SecondaryButton>
          </div>
          <div className="two-columns spaced">
            <section className="card">
              <h2>Visitas</h2>
              {data.visits
                .filter((v) => v.customerId === id)
                .map((v) => (
                  <VisitCard key={v.id} visit={v} customer={c} />
                ))}
              <h2 className="spaced">Tareas</h2>
              {data.tasks
                .filter((t) => t.customerId === id)
                .map((t) => (
                  <label className="task-row" key={t.id}>
                    <input
                      type="checkbox"
                      checked={t.done}
                      onChange={() =>
                        void save(
                          "tasks",
                          { ...t, done: !t.done },
                          `Tarea: ${t.title}`,
                        )
                      }
                    />
                    {t.title}
                  </label>
                ))}
            </section>
            <section className="card">
              <h2>Oportunidades</h2>
              {data.opportunities
                .filter((o) => o.customerId === id)
                .map((o) => (
                  <a
                    href={`#/oportunidades/${o.id}`}
                    className="detail-row"
                    key={o.id}
                  >
                    {o.name}
                    <StatusChip>{o.stage}</StatusChip>
                  </a>
                ))}
              <h2 className="spaced">Casos</h2>
              {data.cases
                .filter((o) => o.customerId === id)
                .map((o) => (
                  <a href={`#/casos/${o.id}`} className="detail-row" key={o.id}>
                    {o.description}
                    <StatusChip>{o.status}</StatusChip>
                  </a>
                ))}
            </section>
          </div>
        </>
      )}
      {tab === "Actividad" && (
        <section className="card">
          <h2>Una historia compartida</h2>
          <div className="timeline">
            {data.activities
              .filter((a) => a.customerId === id)
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
              .map((a) => (
                <div key={a.id}>
                  <span className="timeline-dot" />
                  <small>
                    {shortDate(a.createdAt)} ·{" "}
                    {new Date(a.createdAt).toLocaleTimeString("es-CL", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </small>
                  <h3>{a.comment}</h3>
                </div>
              ))}
          </div>
          <SecondaryButton onClick={() => setCommunication("Nota")}>
            Registrar actividad
          </SecondaryButton>
        </section>
      )}
      {form && (
        <RecordForm
          kind={form as "visits"}
          customerId={id}
          onClose={() => setForm("")}
        />
      )}{" "}
      {communication && (
        <ConfirmDialog
          title="¿Registrar actividad?"
          onClose={() => setCommunication("")}
        >
          <p>
            Registra el resultado de tu interacción por{" "}
            {communication.toLowerCase()}. Los contactos de esta demostración
            son ficticios; no se envían mensajes externos.
          </p>
          <label>
            Comentario
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="¿Qué conversaron?"
            />
          </label>
          <PrimaryButton
            disabled={!comment.trim()}
            onClick={async () => {
              await save("activities", {
                id: uid("act"),
                customerId: id,
                type: communication,
                comment: comment.trim(),
                createdAt: new Date().toISOString(),
              });
              setCommunication("");
              setComment("");
            }}
          >
            Guardar actividad
          </PrimaryButton>
        </ConfirmDialog>
      )}
    </>
  );
}
