import { useState } from "react";
import { Plus, MapPin, Play, Check } from "lucide-react";
import { useStore } from "../../store/AppStore";
import {
  PageHeading,
  VisitCard,
  EmptyState,
  PrimaryButton,
  SecondaryButton,
  StatusChip,
  ConfirmDialog,
} from "../../components/ui";
import { RecordForm } from "../management/RecordForm";
import { Photos } from "../../components/Photos";
import { AgendaMap } from "./AgendaMap";
import { day, shortDate, uid } from "../../utils/domain";
import type { Visit } from "../../types";
export function Agenda() {
  const { data } = useStore();
  const [tab, setTab] = useState("Hoy");
  const [newVisit, setNewVisit] = useState(false);
  const visits = data.visits
    .filter((v) =>
      tab === "Hoy" ? v.date === day() : v.date >= day() && v.date <= day(6),
    )
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  return (
    <>
      <PageHeading
        title="Tu agenda"
        description="Llega preparado. Haz que cada visita cuente."
      >
        <PrimaryButton onClick={() => setNewVisit(true)}>
          <Plus size={18} />
          Nueva visita
        </PrimaryButton>
      </PageHeading>
      <div className="tabs">
        {["Hoy", "Semana", "Mapa"].map((t) => (
          <button
            key={t}
            className={tab === t ? "active" : ""}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "Mapa" && (
        <div className="notice info">
          <MapPin size={20} />
          <p>
            Ubicaciones de tus visitas de los próximos 7 días. Abre cada
            dirección en Google Maps para consultar la ruta.
          </p>
        </div>
      )}
      {tab === "Mapa" && <AgendaMap visits={visits} />}
      <div className="card">
        {visits.map((v) => (
          <div key={v.id}>
            <VisitCard
              visit={v}
              customer={data.customers.find((c) => c.id === v.customerId)}
            />
            {tab === "Mapa" && (
              <a
                className="text-link"
                target="_blank"
                rel="noreferrer"
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.customers.find((c) => c.id === v.customerId)?.address ?? "Santiago")}`}
              >
                <MapPin size={16} />
                Cómo llegar
              </a>
            )}
          </div>
        ))}
        {!visits.length && (
          <EmptyState
            title={
              tab === "Hoy"
                ? "No tienes visitas programadas hoy"
                : "No tienes visitas para esta semana"
            }
            description="Programa una conversación con tu próximo cliente."
          />
        )}
      </div>
      {newVisit && (
        <RecordForm kind="visits" onClose={() => setNewVisit(false)} />
      )}
    </>
  );
}
export function VisitDetail({ id }: { id: string }) {
  const { data, save, notify } = useStore();
  const v = data.visits.find((v) => v.id === id);
  const c = data.customers.find((c) => c.id === v?.customerId);
  const [form, setForm] = useState("");
  const [cancel, setCancel] = useState(false);
  const [reason, setReason] = useState("Cliente solicitó reprogramar");
  const [newDate, setNewDate] = useState("");
  const [saving, setSaving] = useState(false);
  if (!v || !c) return <EmptyState title="Visita no disponible" />;
  const change = async (patch: Partial<Visit>) => {
    setSaving(true);
    try {
      await save("visits", { ...v, ...patch });
    } finally {
      setSaving(false);
    }
  };
  const cancelVisit = async () => {
    await save(
      "visits",
      { ...v, status: "Cancelada", cancelReason: reason },
      `Visita cancelada: ${reason}`,
    );
    if (newDate)
      await save(
        "visits",
        {
          ...v,
          id: uid("visit"),
          date: newDate,
          status: "Programada",
          startedAt: undefined,
        },
        `Visita reprogramada para ${shortDate(newDate)}`,
      );
    setCancel(false);
  };
  return (
    <>
      <a href="#/agenda" className="back-link">
        ← Volver a agenda
      </a>
      <PageHeading
        eyebrow="TU PRÓXIMA CONVERSACIÓN"
        title={c.name}
        description={`${shortDate(v.date)} · ${v.time} · ${c.channel}`}
      >
        <StatusChip
          tone={
            v.status === "En curso"
              ? "info"
              : v.status === "Realizada"
                ? "success"
                : "neutral"
          }
        >
          {v.status === "En curso" ? "Visita en curso" : v.status}
        </StatusChip>
      </PageHeading>
      <div className="two-columns">
        <section className="card">
          <h2>
            {v.status === "Programada"
              ? "Antes de comenzar"
              : "Detalle de la visita"}
          </h2>
          <p>{c.address}</p>
          <div className="detail-row">
            <span>Última compra</span>
            <b>{shortDate(c.lastPurchase)}</b>
          </div>
          <div className="detail-row">
            <span>Última visita</span>
            <b>
              {data.visits
                .filter(
                  (x) => x.customerId === c.id && x.status === "Realizada",
                )
                .sort((a, b) => b.date.localeCompare(a.date))[0]?.date ??
                "Sin registro previo"}
            </b>
          </div>
          <div className="detail-row">
            <span>Productos habituales</span>
            <b>
              {data.products
                .filter((p) => c.products.includes(p.id))
                .map((p) => p.name)
                .join(", ")}
            </b>
          </div>
          <h3 className="spaced">Última nota comercial</h3>
          <p>{c.note}</p>
          {c.risk && <p className="notice danger">{c.risk}</p>}
          <h3 className="spaced">Alertas, casos y oportunidades</h3>
          {data.alerts
            .filter((a) => a.customerId === c.id)
            .map((a) => (
              <a className="detail-row" href={`#/alertas/${a.id}`} key={a.id}>
                {a.title} →
              </a>
            ))}
          {data.cases
            .filter((a) => a.customerId === c.id)
            .map((a) => (
              <a className="detail-row" href={`#/casos/${a.id}`} key={a.id}>
                {a.description} →
              </a>
            ))}
          {data.opportunities
            .filter((a) => a.customerId === c.id)
            .map((a) => (
              <a
                className="detail-row"
                href={`#/oportunidades/${a.id}`}
                key={a.id}
              >
                {a.name} →
              </a>
            ))}
        </section>
        <section className="card">
          {v.status === "Programada" ? (
            <>
              <h2>Todo listo para escuchar</h2>
              <p>
                Revisa el contexto del cliente y registra el inicio al comenzar
                tu visita.
              </p>
              <PrimaryButton
                onClick={() =>
                  void save(
                    "visits",
                    {
                      ...v,
                      status: "En curso",
                      startedAt: new Date().toISOString(),
                    },
                    "Visita iniciada",
                  )
                }
              >
                <Play size={17} />
                Iniciar visita
              </PrimaryButton>
              <div className="actions spaced">
                <SecondaryButton onClick={() => setForm("visits")}>
                  Reprogramar
                </SecondaryButton>
                <SecondaryButton onClick={() => setCancel(true)}>
                  Cancelar visita
                </SecondaryButton>
              </div>
            </>
          ) : v.status === "En curso" ? (
            <>
              <div className="row">
                <h2>Registra tu visita</h2>
                <small role="status">
                  {saving ? "Guardando…" : "Guardado localmente"}
                </small>
              </div>
              <p>
                Inicio:{" "}
                {new Date(v.startedAt!).toLocaleTimeString("es-CL", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <div className="actions">
                <a
                  className="button secondary"
                  href={`#/pedidos/nuevo?cliente=${c.id}`}
                >
                  Crear pedido
                </a>
                <SecondaryButton onClick={() => setForm("opportunities")}>
                  Crear oportunidad
                </SecondaryButton>
                <SecondaryButton onClick={() => setForm("cases")}>
                  Reportar problema
                </SecondaryButton>
              </div>
              <label>
                Resultado
                <select
                  value={v.result ?? "Neutral"}
                  onChange={(e) => void change({ result: e.target.value })}
                >
                  {["Positiva", "Neutral", "Requiere seguimiento"].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label>
                Comentarios
                <textarea
                  key={v.id}
                  defaultValue={v.notes}
                  onChange={(e) => void change({ notes: e.target.value })}
                  placeholder="Acuerdos, necesidades y próximos pasos…"
                />
              </label>
              <details>
                <summary>Agregar más detalles</summary>
                {[
                  ["products", "Productos conversados"],
                  ["opportunities", "Oportunidades detectadas"],
                  ["problems", "Problemas encontrados"],
                  ["competition", "Competencia observada"],
                ].map(([key, label]) => (
                  <label key={key}>
                    {label}
                    <textarea
                      defaultValue={v[key as keyof Visit] ?? ""}
                      onChange={(e) => void change({ [key]: e.target.value })}
                    />
                  </label>
                ))}
                <label>
                  Próxima visita
                  <input
                    type="date"
                    defaultValue={v.nextVisit}
                    onChange={(e) => void change({ nextVisit: e.target.value })}
                  />
                </label>
              </details>
              <Photos customerId={c.id} entityId={v.id} />
              <PrimaryButton
                className="spaced"
                disabled={saving}
                onClick={async () => {
                  await save(
                    "visits",
                    {
                      ...v,
                      status: "Realizada",
                      result: v.result ?? "Neutral",
                    },
                    `Visita finalizada: ${v.result ?? "Neutral"}`,
                  );
                  if (v.nextVisit)
                    await save(
                      "visits",
                      {
                        id: uid("visit"),
                        customerId: c.id,
                        date: v.nextVisit,
                        time: v.time,
                        status: "Programada",
                        notes: "Seguimiento de visita anterior",
                        syncStatus: "PENDING",
                      },
                      "Próxima visita programada",
                    );
                  notify("Visita finalizada y guardada");
                }}
              >
                <Check size={18} />
                Finalizar visita
              </PrimaryButton>
            </>
          ) : (
            <>
              <h2>
                {v.status === "Realizada"
                  ? "Visita completada"
                  : "Visita cancelada"}
              </h2>
              <p>{v.result ?? v.cancelReason}</p>
              <p>{v.notes}</p>
              <Photos customerId={c.id} entityId={v.id} />
            </>
          )}
        </section>
      </div>
      {form && (
        <RecordForm
          kind={form as "visits"}
          existing={form === "visits" ? v : undefined}
          customerId={c.id}
          onClose={() => setForm("")}
        />
      )}{" "}
      {cancel && (
        <ConfirmDialog title="Cancelar visita" onClose={() => setCancel(false)}>
          <label>
            Motivo
            <select value={reason} onChange={(e) => setReason(e.target.value)}>
              {[
                "Cliente solicitó reprogramar",
                "Cliente no disponible",
                "Vendedor no disponible",
                "Problema de ruta",
                "Otro",
              ].map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
          <label>
            ¿Quieres reprogramarla? Elige una nueva fecha
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
            />
          </label>
          <div className="actions">
            <SecondaryButton onClick={() => setCancel(false)}>
              Volver
            </SecondaryButton>
            <PrimaryButton onClick={() => void cancelVisit()}>
              {newDate ? "Cancelar y reprogramar" : "Cancelar sin reprogramar"}
            </PrimaryButton>
          </div>
        </ConfirmDialog>
      )}
    </>
  );
}
