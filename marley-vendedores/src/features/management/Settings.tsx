import { useStore } from "../../store/AppStore";
import {
  PageHeading,
  PrimaryButton,
  SecondaryButton,
  StatusChip,
  EmptyState,
} from "../../components/ui";
export function Settings() {
  const {
    data,
    user,
    online,
    sync,
    syncing,
    mockOffline,
    setOffline,
    setExpired,
    update,
  } = useStore();
  const pending = data.queue.filter((q) => q.status !== "SYNCED");
  return (
    <>
      <PageHeading
        title="Configuración"
        description="Tu dispositivo y tus cambios, bajo control."
      />
      <div className="two-columns">
        <section className="card">
          <h2>Conexión y sincronización</h2>
          <StatusChip tone={online ? "success" : "warning"}>
            {online ? "Con conexión" : "Sin conexión"}
          </StatusChip>
          <p className="spaced">
            Los cambios se guardan por usuario en este dispositivo. La
            sincronización de esta versión es simulada; no envía datos a
            Salesforce.
          </p>
          <label className="task-row">
            <input
              type="checkbox"
              checked={mockOffline}
              onChange={(e) => setOffline(e.target.checked)}
            />
            Simular trabajo sin conexión
          </label>
          <PrimaryButton
            disabled={!online || syncing}
            onClick={async () => {
              await update((d) => ({
                ...d,
                queue: d.queue.map((q) =>
                  q.status === "FAILED" ? { ...q, nextRetryAt: 0 } : q,
                ),
              }));
              await sync();
            }}
          >
            {syncing ? "Sincronizando…" : "Reintentar sincronización"}
          </PrimaryButton>
          <h3 className="spaced">Prueba de stock</h3>
          <p>
            Modifica el stock de demostración para probar conflictos al enviar
            pedidos offline.
          </p>
          {data.products.map((p) => (
            <label key={p.id}>
              {p.name}
              <input
                aria-label={`Stock ${p.name}`}
                type="number"
                min="0"
                value={p.stock}
                onChange={(e) => {
                  const stock = Math.max(0, Math.floor(Number(e.target.value)));
                  void update((d) => ({
                    ...d,
                    products: d.products.map((x) =>
                      x.id === p.id ? { ...x, stock } : x,
                    ),
                  }));
                }}
              />
            </label>
          ))}
        </section>
        <section className="card">
          <h2>
            Cambios pendientes <span className="muted">{pending.length}</span>
          </h2>
          {pending.map((q) => (
            <div className="detail-row" key={q.id}>
              <div>
                <b>
                  {
                    {
                      orders: "Pedido",
                      visits: "Visita",
                      opportunities: "Oportunidad",
                      cases: "Caso",
                      tasks: "Tarea",
                      alerts: "Alerta",
                      activities: "Actividad",
                      photos: "Fotografía",
                    }[q.entityType]
                  }
                </b>
                <small>
                  {q.status === "NEEDS_REVIEW"
                    ? "Requiere revisión"
                    : q.status === "FAILED"
                      ? "No pudimos sincronizar este cambio"
                      : q.status === "SYNCING"
                        ? "Sincronizando"
                        : "Pendiente de envío"}
                </small>
                {q.error && <p>{q.error}</p>}
                {q.entityType === "orders" && q.status === "NEEDS_REVIEW" && (
                  <a href={`#/pedidos/${q.entityId}`}>Revisar pedido →</a>
                )}
              </div>
            </div>
          ))}
          {!pending.length && (
            <EmptyState
              title="Todo actualizado"
              description="No hay cambios pendientes en esta demostración."
            />
          )}
        </section>
      </div>
      <section className="card spaced">
        <h2>Sesión y privacidad</h2>
        <p>
          {user.name} · {user.territory}
        </p>
        <p>
          Los datos locales se mantienen asociados a tu usuario. Para esta
          primera versión el acceso es de demostración.
        </p>
        <SecondaryButton onClick={() => setExpired(true)}>
          Probar sesión expirada
        </SecondaryButton>
      </section>
    </>
  );
}
