import { useState } from "react";
import { useStore } from "../../store/AppStore";
import {
  ConfirmDialog,
  PrimaryButton,
  SecondaryButton,
} from "../../components/ui";
import { Photos } from "../../components/Photos";
import { day, uid } from "../../utils/domain";
import type { Opportunity, Case, Visit, Task } from "../../types";
export type RecordKind = "opportunities" | "cases" | "visits" | "tasks";
type RecordEntity = Opportunity | Case | Visit | Task;
export function RecordForm({
  kind,
  customerId,
  onClose,
  existing: original,
}: {
  kind: RecordKind;
  customerId?: string;
  onClose: () => void;
  existing?: RecordEntity;
}) {
  const { data, save, update } = useStore();
  const draftKey = `${kind}:${original?.id ?? customerId ?? "new"}`;
  const draft = data.formDrafts?.[draftKey];
  const [id] = useState(original?.id ?? draft?.id ?? uid(kind));
  const [existing] = useState(
    (draft ? { ...original, ...draft.values } : original) as
      RecordEntity | undefined,
  );
  const [selectedCustomer, setSelectedCustomer] = useState(
    existing?.customerId ?? customerId ?? "",
  );
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(true);
  const title = {
    opportunities: "oportunidad",
    cases: "caso",
    visits: "visita",
    tasks: "tarea",
  }[kind];
  async function clearDraft() {
    await update((d) => {
      const formDrafts = { ...d.formDrafts };
      delete formDrafts[draftKey];
      return { ...d, formDrafts };
    });
  }
  return (
    <ConfirmDialog
      title={`${original ? "Editar" : "Nueva"} ${title}`}
      onClose={onClose}
    >
      <p className="muted" role="status">
        {saved
          ? "Borrador guardado en este dispositivo"
          : "Guardando borrador…"}
      </p>
      <form
        onChange={async (e) => {
          const values = Object.fromEntries(
            new FormData(e.currentTarget),
          ) as Record<string, string>;
          setSaved(false);
          await update((d) => ({
            ...d,
            formDrafts: { ...d.formDrafts, [draftKey]: { id, values } },
          }));
          setSaved(true);
        }}
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            const values = Object.fromEntries(new FormData(e.currentTarget));
            const entity = {
              ...original,
              ...values,
              id,
              syncStatus: "PENDING",
              ...(kind === "opportunities"
                ? { value: Number(values.value) }
                : {}),
              ...(kind === "visits"
                ? { status: (original as Visit)?.status ?? "Programada" }
                : {}),
              ...(kind === "tasks"
                ? { done: (original as Task)?.done ?? false }
                : {}),
            };
            await save(
              kind,
              entity,
              `${original ? "Actualización" : "Registro"} de ${title}`,
            );
            await clearDraft();
            onClose();
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Cliente
          <select
            name="customerId"
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
            required
            disabled={!!original}
          >
            <option value="" disabled>
              Selecciona un cliente
            </option>
            {data.customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        {original && (
          <input type="hidden" name="customerId" value={selectedCustomer} />
        )}
        {kind === "opportunities" && (
          <>
            <label>
              Nombre de la oportunidad
              <input
                name="name"
                required
                maxLength={120}
                defaultValue={(existing as Opportunity)?.name}
              />
            </label>
            <label>
              Producto o servicio
              <input
                name="product"
                required
                defaultValue={(existing as Opportunity)?.product}
              />
            </label>
            <div className="two-columns">
              <label>
                Valor estimado (CLP)
                <input
                  type="number"
                  min="0"
                  step="1"
                  name="value"
                  required
                  defaultValue={(existing as Opportunity)?.value ?? 0}
                />
              </label>
              <label>
                Fecha esperada
                <input
                  name="expectedDate"
                  type="date"
                  required
                  defaultValue={
                    (existing as Opportunity)?.expectedDate ?? day(14)
                  }
                />
              </label>
            </div>
            <label>
              Etapa
              <select
                name="stage"
                defaultValue={(existing as Opportunity)?.stage}
              >
                {[
                  "Nueva",
                  "En seguimiento",
                  "Propuesta",
                  "Ganada",
                  "Perdida",
                ].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label>
              Comentarios
              <textarea
                name="comments"
                defaultValue={(existing as Opportunity)?.comments}
              />
            </label>
          </>
        )}
        {kind === "cases" && (
          <>
            <div className="two-columns">
              <label>
                Tipo
                <select name="type" defaultValue={(existing as Case)?.type}>
                  {[
                    "Máquina",
                    "Servicio técnico",
                    "Despacho",
                    "Stock",
                    "Producto",
                    "Facturación",
                    "Otro",
                  ].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label>
                Prioridad
                <select
                  name="priority"
                  defaultValue={(existing as Case)?.priority}
                >
                  {["Media", "Alta", "Crítica", "Baja"].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              Descripción
              <textarea
                name="description"
                required
                defaultValue={(existing as Case)?.description}
              />
            </label>
            <label>
              Responsable
              <input
                name="responsible"
                required
                defaultValue={
                  (existing as Case)?.responsible ?? "Servicio al cliente"
                }
              />
            </label>
            <label>
              Estado
              <select name="status" defaultValue={(existing as Case)?.status}>
                {["Abierto", "En proceso", "Resuelto", "Cerrado"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label>
              Comentarios
              <textarea
                name="comments"
                defaultValue={(existing as Case)?.comments}
              />
            </label>
            {selectedCustomer && (
              <Photos customerId={selectedCustomer} entityId={id} />
            )}
          </>
        )}
        {kind === "visits" && (
          <>
            <div className="two-columns">
              <label>
                Fecha
                <input
                  type="date"
                  name="date"
                  required
                  defaultValue={(existing as Visit)?.date ?? day()}
                />
              </label>
              <label>
                Hora
                <input
                  type="time"
                  name="time"
                  required
                  defaultValue={(existing as Visit)?.time ?? "09:00"}
                />
              </label>
            </div>
            <label>
              Notas de preparación
              <textarea
                name="notes"
                defaultValue={(existing as Visit)?.notes}
              />
            </label>
          </>
        )}
        {kind === "tasks" && (
          <>
            <label>
              Tarea
              <input
                name="title"
                required
                defaultValue={(existing as Task)?.title}
              />
            </label>
            <label>
              Fecha
              <input
                name="due"
                type="date"
                required
                defaultValue={(existing as Task)?.due ?? day()}
              />
            </label>
          </>
        )}
        <div className="actions spaced">
          <SecondaryButton type="button" onClick={onClose}>
            Cerrar y conservar
          </SecondaryButton>
          <SecondaryButton
            type="button"
            onClick={async () => {
              await clearDraft();
              onClose();
            }}
          >
            Descartar borrador
          </SecondaryButton>
          <PrimaryButton disabled={busy || !saved}>
            {busy ? "Guardando…" : "Guardar"}
          </PrimaryButton>
        </div>
      </form>
    </ConfirmDialog>
  );
}
