import { useState } from "react";
import { useStore } from "../../store/AppStore";
import {
  AlertCard,
  PageHeading,
  SecondaryButton,
  PrimaryButton,
  EmptyState,
  ConfirmDialog,
} from "../../components/ui";
import { day, shortDate } from "../../utils/domain";
import { AlertService } from "../../services";
export function Alerts({ id }: { id?: string }) {
  const { data, save, online } = useStore();
  const [tab, setTab] = useState("Todas");
  const [postpone, setPostpone] = useState("");
  const [date, setDate] = useState(day(1));
  const alerts = data.alerts.filter(
    (a) => (!id || a.id === id) && (tab === "Todas" || a.category === tab),
  );
  return (
    <>
      {id && (
        <a href="#/alertas" className="back-link">
          ← Todas las alertas
        </a>
      )}
      <PageHeading
        title="A tiempo, más cerca."
        eyebrow="ALERTAS Y REPOSICIÓN"
        description="Detecta lo importante y mantén viva la relación."
      />
      <div className="tabs">
        {["Todas", "Atención", "Reposición", "Seguimiento"].map((t) => (
          <button
            className={tab === t ? "active" : ""}
            onClick={() => setTab(t)}
            key={t}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="alert-grid">
        {alerts.map((a) => {
          const c = data.customers.find((c) => c.id === a.customerId);
          return (
            <AlertCard key={a.id} alert={a} customer={c}>
              {a.type === "REPLENISHMENT" && (
                <div className="replenishment-detail">
                  <div>
                    <small>Última compra</small>
                    <b>{c && shortDate(c.lastPurchase)}</b>
                  </div>
                  <div>
                    <small>Frecuencia</small>
                    <b>{c?.frequency} días</b>
                  </div>
                  <div>
                    <small>Cantidad habitual</small>
                    <b>{a.quantity} unidades</b>
                  </div>
                  <div>
                    <small>Reposición estimada</small>
                    <b>{c && shortDate(c.replenishment)}</b>
                  </div>
                  <p>{data.products.find((p) => p.id === a.productId)?.name}</p>
                  {a.status === "OPEN" && (
                    <p className="notice warning">
                      Atención del vendedor hasta{" "}
                      {new Date(a.deadline).toLocaleString("es-CL", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      . El CRM gestiona la automatización de 24 horas.
                    </p>
                  )}
                </div>
              )}
              {a.type === "REPLENISHMENT" && AlertService.canSend(a.status) && (
                <PrimaryButton
                  onClick={() =>
                    void save(
                      "alerts",
                      { ...a, status: "SENT_BY_SELLER" },
                      "Recordatorio de reposición gestionado por vendedor (demo)",
                    )
                  }
                >
                  {online
                    ? "Enviar recordatorio · demo"
                    : "Guardar gestión pendiente"}
                </PrimaryButton>
              )}
              <a
                className="button secondary"
                href={`#/pedidos/nuevo?cliente=${a.customerId}`}
              >
                Crear pedido
              </a>
              <a className="text-link" href={`#/clientes/${a.customerId}`}>
                Ver cliente y contactar →
              </a>
              {a.status === "OPEN" && (
                <SecondaryButton onClick={() => setPostpone(a.id)}>
                  Posponer
                </SecondaryButton>
              )}
            </AlertCard>
          );
        })}
      </div>
      {!alerts.length && (
        <EmptyState
          title="No tienes alertas pendientes"
          description="Las nuevas alertas aparecerán aquí."
        />
      )}
      {postpone && (
        <ConfirmDialog title="Posponer alerta" onClose={() => setPostpone("")}>
          <label>
            Volver a revisar el
            <input
              type="date"
              min={day(1)}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <PrimaryButton
            disabled={!date || date < day(1)}
            onClick={async () => {
              const a = data.alerts.find((a) => a.id === postpone)!;
              await save(
                "alerts",
                { ...a, status: "SNOOZED", snoozedUntil: date },
                `Alerta pospuesta hasta ${shortDate(date)}`,
              );
              setPostpone("");
            }}
          >
            Guardar fecha
          </PrimaryButton>
        </ConfirmDialog>
      )}
    </>
  );
}
