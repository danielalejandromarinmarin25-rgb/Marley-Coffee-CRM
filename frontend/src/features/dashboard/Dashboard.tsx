import {
  ArrowRight,
  Plus,
  CalendarDays,
  RefreshCw,
  TriangleAlert,
  ListTodo,
  ArrowUpRight,
} from "lucide-react";
import { useStore } from "../../store/AppStore";
import {
  MetricCard,
  PageHeading,
  VisitCard,
  StatusChip,
  EmptyState,
} from "../../components/ui";
import { day, money } from "../../utils/domain";
import { performance } from "../../services/PerformanceService";
export function Dashboard() {
  const { data, user, save } = useStore();
  const metrics = performance(data);
  const visits = data.visits.filter(
    (v) => v.date === day() && v.status !== "Cancelada",
  );
  const tasks = data.tasks.filter((t) => !t.done);
  const name = user.name.split(" ")[0];
  return (
    <>
      <PageHeading
        eyebrow={new Date()
          .toLocaleDateString("es-CL", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })
          .toUpperCase()}
        title={`Buenos días, ${name}.`}
        description="Cada conversación cuenta. Este es tu día."
      >
        <a href="#/pedidos/nuevo" className="button primary">
          <Plus size={18} /> Crear pedido
        </a>
      </PageHeading>
      <section className="day-banner">
        <div>
          <span className="eyebrow">CERCA DE TUS CLIENTES</span>
          <h2>
            Un buen café empieza
            <br />
            con una buena relación.
          </h2>
          <p>Tu cartera, tus visitas y el próximo paso. Todo en un lugar.</p>
          <a href="#/agenda">
            Preparar mi día <ArrowRight size={17} />
          </a>
        </div>
        <div className="banner-art" aria-hidden="true">
          <div className="orbit o1" />
          <div className="orbit o2" />
          <div className="coffee-seal">
            <img src="./marley-coffee-logo.webp" alt="" width="128" height="128" />
          </div>
          <span className="art-note">Cultivamos relaciones.</span>
        </div>
      </section>
      <div className="section-heading">
        <h2>Mi día</h2>
        <span className="muted">Lo importante, a primera vista</span>
      </div>
      <div className="metrics four">
        <MetricCard
          label="Visitas de hoy"
          value={visits.length.toString().padStart(2, "0")}
          detail={`${visits.filter((v) => v.status === "Realizada").length} completadas`}
          icon={<CalendarDays size={19} />}
        />
        <MetricCard
          label="Reposiciones"
          value={data.alerts
            .filter((a) => a.type === "REPLENISHMENT" && a.status === "OPEN")
            .length.toString()
            .padStart(2, "0")}
          detail="Esperan tu gestión"
          icon={<RefreshCw size={19} />}
          accent
        />
        <MetricCard
          label="Clientes en riesgo"
          value={data.customers
            .filter((c) => c.risk)
            .length.toString()
            .padStart(2, "0")}
          detail="Una conversación puede ayudar"
          icon={<TriangleAlert size={19} />}
        />
        <MetricCard
          label="Tareas pendientes"
          value={tasks.length.toString().padStart(2, "0")}
          detail="Sigue avanzando"
          icon={<ListTodo size={19} />}
        />
      </div>
      <div className="dashboard-grid">
        <section>
          <div className="section-heading">
            <h2>Prioridades</h2>
            <a href="#/alertas">
              Ver todas <ArrowUpRight size={15} />
            </a>
          </div>
          <div className="card priorities">
            {data.alerts
              .filter((a) => a.status === "OPEN")
              .slice(0, 3)
              .map((a) => (
                <a
                  key={a.id}
                  href={`#/alertas/${a.id}`}
                  className="priority-row"
                >
                  <div
                    className={`priority-icon ${a.category === "Atención" ? "red" : "amber"}`}
                  >
                    {a.category === "Atención" ? (
                      <TriangleAlert size={20} />
                    ) : (
                      <RefreshCw size={20} />
                    )}
                  </div>
                  <div className="grow">
                    <StatusChip
                      tone={a.category === "Atención" ? "danger" : "warning"}
                    >
                      {a.category === "Atención"
                        ? "Cliente en riesgo"
                        : "Reposición pendiente"}
                    </StatusChip>
                    <h3>
                      {data.customers.find((c) => c.id === a.customerId)?.name}
                    </h3>
                    <p>{a.description}</p>
                  </div>
                  <ArrowUpRight size={19} />
                </a>
              ))}
            {!data.alerts.some((a) => a.status === "OPEN") && (
              <EmptyState title="No tienes alertas pendientes" />
            )}
          </div>
        </section>
        <section>
          <div className="section-heading">
            <h2>Próximas visitas</h2>
            <a href="#/agenda">
              Ver agenda <ArrowUpRight size={15} />
            </a>
          </div>
          <div className="card visits-mini">
            {visits
              .filter((v) => v.status !== "Realizada")
              .slice(0, 3)
              .map((v) => (
                <VisitCard
                  key={v.id}
                  visit={v}
                  customer={data.customers.find((c) => c.id === v.customerId)}
                />
              ))}
            {!visits.length && (
              <EmptyState title="No tienes visitas programadas hoy" />
            )}
          </div>
        </section>
      </div>
      <div className="section-heading">
        <h2>Mi mes</h2>
        <a href="#/gestion">
          Ver mi gestión <ArrowUpRight size={15} />
        </a>
      </div>
      <div className="month-strip">
        <div>
          <small>Ventas del mes</small>
          <strong>{money(metrics.sales)}</strong>
        </div>
        <div className="goal-block">
          <div className="row">
            <small>Cumplimiento de meta</small>
            <b>{Math.round((metrics.sales / metrics.goal) * 100)}%</b>
          </div>
          <progress aria-label="Cumplimiento de meta" max={metrics.goal} value={metrics.sales} />
        </div>
        <div>
          <small>Pedidos</small>
          <strong>{metrics.orders}</strong>
        </div>
        <div>
          <small>Ticket promedio</small>
          <strong>{money(metrics.sales / metrics.orders)}</strong>
        </div>
      </div>
      <div className="section-heading">
        <h2>Pendientes para avanzar</h2>
      </div>
      <div className="card">
        {tasks.map((t) => (
          <label className="task-row" key={t.id}>
            <input
              type="checkbox"
              checked={t.done}
              onChange={() =>
                void save(
                  "tasks",
                  { ...t, done: true },
                  `Tarea completada: ${t.title}`,
                )
              }
            />
            <span>
              <b>{t.title}</b>
              <small>
                {data.customers.find((c) => c.id === t.customerId)?.name}
              </small>
            </span>
          </label>
        ))}
        {!tasks.length && (
          <p className="muted">Todo al día. No tienes tareas pendientes.</p>
        )}
      </div>
    </>
  );
}
