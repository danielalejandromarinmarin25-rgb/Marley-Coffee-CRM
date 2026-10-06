import { useState } from "react";
import { Plus, ArrowRight, CheckCircle2, ShoppingBag } from "lucide-react";
import { useStore } from "../../store/AppStore";
import {
  EmptyState,
  OrderCard,
  PageHeading,
  PrimaryButton,
  SecondaryButton,
  ProductQuantity,
  ConfirmDialog,
  StatusChip,
} from "../../components/ui";
import { money, totals, uid } from "../../utils/domain";
import { OrderService } from "../../services";
import { MockAdapter } from "../../services/adapters";
import type { Order, OrderDraft } from "../../types";
export function Orders() {
  const { data } = useStore();
  const drafts = Object.values(
    data.orderDrafts ?? (data.draft ? { current: data.draft } : {}),
  );
  return (
    <>
      <PageHeading
        title="Pedidos"
        description="Del café habitual a la próxima entrega."
      >
        <a className="button primary" href="#/pedidos/nuevo">
          <Plus size={18} />
          Crear pedido
        </a>
      </PageHeading>
      {drafts.map((draft) => (
        <div className="notice info" key={draft.customerId}>
          <ShoppingBag size={20} />
          <div className="grow">
            <b>Pedido en borrador</b>
            <p>
              {data.customers.find((c) => c.id === draft.customerId)?.name ??
                "Cliente por seleccionar"}{" "}
              · Guardado en este dispositivo
            </p>
          </div>
          <a
            className="button secondary"
            href={`#/pedidos/nuevo?cliente=${draft.customerId}`}
          >
            Continuar
          </a>
        </div>
      ))}
      <div className="stack">
        {data.orders.map((o) => (
          <OrderCard
            key={o.id}
            order={o}
            customer={data.customers.find((c) => c.id === o.customerId)}
          />
        ))}
        {!data.orders.length && (
          <EmptyState title="Aún no hay pedidos registrados" />
        )}
      </div>
    </>
  );
}
export function OrderDetail({ id }: { id: string }) {
  const { data } = useStore();
  const order = data.orders.find((o) => o.id === id);
  if (!order) return <EmptyState title="Pedido no disponible" />;
  return (
    <>
      <a href="#/pedidos" className="back-link">
        ← Volver a pedidos
      </a>
      <PageHeading
        title={order.serverId ?? order.id.slice(0, 12)}
        description={
          data.customers.find((c) => c.id === order.customerId)?.name
        }
      >
        <StatusChip
          tone={order.syncStatus === "NEEDS_REVIEW" ? "danger" : "info"}
        >
          {order.status}
        </StatusChip>
      </PageHeading>
      {order.syncStatus === "NEEDS_REVIEW" && (
        <div className="notice danger">
          <div className="grow">
            <b>Debemos actualizar tu pedido</b>
            <p>
              El stock cambió. Revisa las cantidades antes de aprobar su envío.
            </p>
          </div>
          <a className="button primary" href={`#/pedidos/revisar/${order.id}`}>
            Revisar pedido
          </a>
        </div>
      )}
      <section className="card">
        <OrderSummary order={order} />
      </section>
    </>
  );
}
function OrderSummary({ order }: { order: Pick<Order, "items" | "address"> }) {
  const { data } = useStore();
  const t = totals(order.items);
  return (
    <>
      {order.items.map((i) => (
        <div className="detail-row" key={i.productId}>
          <span>
            <b>{data.products.find((p) => p.id === i.productId)?.name}</b>
            <small>
              {i.quantity} × {money(i.unitPrice)}
            </small>
          </span>
          <b>{money(i.quantity * i.unitPrice)}</b>
        </div>
      ))}
      <div className="summary-totals">
        <div>
          <span>Subtotal neto</span>
          <b>{money(t.subtotal)}</b>
        </div>
        <div>
          <span>IVA (19%)</span>
          <b>{money(t.tax)}</b>
        </div>
        <div className="total">
          <span>Total</span>
          <b>{money(t.total)}</b>
        </div>
      </div>
      <h3>Dirección de despacho</h3>
      <p>{order.address}</p>
    </>
  );
}
export function OrderWizard({
  customerId,
  reviewId,
}: {
  customerId?: string;
  reviewId?: string;
}) {
  const { data, update, save, online, notify } = useStore();
  const review = data.orders.find((o) => o.id === reviewId);
  const [draft, setDraft] = useState<OrderDraft>(() =>
    review
      ? {
          customerId: review.customerId,
          quantities: Object.fromEntries(
            review.items.map((i) => [i.productId, i.quantity]),
          ),
          step: 1,
        }
      : ((customerId
          ? (data.orderDrafts?.[customerId] ??
            (data.draft?.customerId === customerId ? data.draft : undefined))
          : data.draft) ?? {
          customerId: customerId ?? "",
          quantities: {},
          step: customerId ? 1 : 0,
        }),
  );
  const [catalog, setCatalog] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState<Order>();
  const [changeCustomer, setChangeCustomer] = useState(false);
  const customer = data.customers.find((c) => c.id === draft.customerId);
  const items = data.products
    .filter((p) => (draft.quantities[p.id] ?? 0) > 0)
    .map((p) => ({
      productId: p.id,
      quantity: draft.quantities[p.id],
      unitPrice: p.price,
    }));
  const issues = OrderService.validate({ items }, data.products);
  async function change(next: OrderDraft) {
    setDraft(next);
    try {
      await update((d) => ({
        ...d,
        draft: next,
        orderDrafts: {
          ...d.orderDrafts,
          ...(next.customerId ? { [next.customerId]: next } : {}),
        },
      }));
    } catch {
      setError("No se pudo guardar el borrador. Reintenta antes de salir.");
    }
  }
  async function confirm() {
    if (!customer || !items.length) return;
    setBusy(true);
    setError("");
    try {
      const products = online
        ? await new MockAdapter(() => data).getProducts()
        : data.products;
      if (online && OrderService.validate({ items }, products).length) {
        setError(
          "Debemos actualizar tu pedido. Revisa el stock y aprueba las cantidades.",
        );
        await change({ ...draft, step: 1 });
        return;
      }
      const order: Order = {
        id: review?.id ?? uid("TMP"),
        customerId: customer.id,
        items,
        address: customer.address,
        total: totals(items).total,
        createdAt: new Date().toISOString(),
        status: "Pendiente de envío",
        syncStatus: "PENDING",
      };
      if (review)
        await update((d) => ({
          ...d,
          queue: d.queue.filter(
            (q) => !(q.entityId === review.id && q.status === "NEEDS_REVIEW"),
          ),
        }));
      await save(
        "orders",
        order,
        `Pedido registrado por ${money(order.total)}`,
      );
      await update((d) => {
        const orderDrafts = { ...d.orderDrafts };
        delete orderDrafts[customer.id];
        return { ...d, draft: undefined, orderDrafts };
      });
      setConfirmed(order);
    } finally {
      setBusy(false);
    }
  }
  if (confirmed)
    return (
      <div className="confirmation card">
        <CheckCircle2 size={58} />
        <div className="eyebrow">UN PASO MÁS, JUNTOS</div>
        <h1>{online ? "Pedido registrado" : "Pedido guardado sin conexión"}</h1>
        <p>
          {customer?.name} · {money(confirmed.total)}
        </p>
        <StatusChip tone={online ? "success" : "warning"}>
          {online ? "Procesando en la demostración" : "Pendiente de envío"}
        </StatusChip>
        <p>Referencia local: {confirmed.id.slice(0, 12)}</p>
        <a className="button primary" href={`#/pedidos/${confirmed.id}`}>
          Ver pedido
        </a>
        <a className="text-link" href="#/pedidos">
          Volver a pedidos
        </a>
      </div>
    );
  return (
    <>
      <a href="#/pedidos" className="back-link">
        ← Volver a pedidos · borrador guardado
      </a>
      <PageHeading
        title={review ? "Revisar pedido" : "Crear pedido"}
        description={
          customer
            ? `Estás trabajando con ${customer.name}`
            : "Selecciona el cliente para comenzar."
        }
      />
      <div className="steps">
        {["Cliente", "Productos", "Resumen", "Confirmación"].map((s, i) => (
          <div
            key={s}
            className={
              i === draft.step ? "current" : i < draft.step ? "done" : ""
            }
          >
            <span>{i + 1}</span>
            {s}
          </div>
        ))}
      </div>
      {error && (
        <div role="alert" className="notice danger">
          {error}
        </div>
      )}
      {customer && draft.step > 0 && (
        <div className="customer-context">
          <b>{customer.name}</b>
          <span>{customer.channel}</span>
          <button onClick={() => setChangeCustomer(true)}>
            Cambiar cliente
          </button>
        </div>
      )}
      {draft.step === 0 && (
        <section className="card narrow">
          <h2>¿Para quién es este pedido?</h2>
          <label>
            Cliente
            <select
              value={draft.customerId}
              onChange={(e) =>
                void change({ ...draft, customerId: e.target.value })
              }
            >
              <option value="">Selecciona un cliente</option>
              {data.customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <PrimaryButton
            disabled={!customer}
            onClick={() => void change({ ...draft, step: 1 })}
          >
            Elegir productos <ArrowRight size={17} />
          </PrimaryButton>
        </section>
      )}
      {draft.step === 1 && (
        <section className="card">
          <div className="row">
            <div>
              <h2>{catalog ? "Catálogo completo" : "Productos frecuentes"}</h2>
              <p className="muted">
                Precios netos de demostración. No editables.
              </p>
            </div>
            <SecondaryButton onClick={() => setCatalog(!catalog)}>
              {catalog ? "Ver habituales" : "Ver catálogo completo"}
            </SecondaryButton>
          </div>
          {data.products
            .filter(
              (p) =>
                catalog ||
                customer?.products.includes(p.id) ||
                (draft.quantities[p.id] ?? 0) > 0,
            )
            .map((p) => (
              <div key={p.id}>
                <ProductQuantity
                  product={p}
                  quantity={draft.quantities[p.id] ?? 0}
                  onChange={(quantity) =>
                    void change({
                      ...draft,
                      quantities: { ...draft.quantities, [p.id]: quantity },
                    })
                  }
                />
                {issues.some((i) => i.productId === p.id) && (
                  <div className="notice warning">
                    <div className="grow">
                      <b>Stock insuficiente</b>
                      <p>
                        Solicitaste: {draft.quantities[p.id]}. Disponible:{" "}
                        {p.stock}.
                      </p>
                    </div>
                    <SecondaryButton
                      onClick={() =>
                        void change({
                          ...draft,
                          quantities: { ...draft.quantities, [p.id]: p.stock },
                        })
                      }
                    >
                      Agregar cantidad disponible
                    </SecondaryButton>
                    <SecondaryButton
                      onClick={() =>
                        void change({
                          ...draft,
                          quantities: { ...draft.quantities, [p.id]: 0 },
                        })
                      }
                    >
                      Quitar producto
                    </SecondaryButton>
                  </div>
                )}
              </div>
            ))}
          <div className="row spaced">
            <div>
              <small>Total con IVA</small>
              <h2>{money(totals(items).total)}</h2>
            </div>
            <PrimaryButton
              disabled={!items.length || (online && issues.length > 0)}
              onClick={() => void change({ ...draft, step: 2 })}
            >
              Revisar pedido <ArrowRight size={17} />
            </PrimaryButton>
          </div>
          {!online && (
            <p className="notice warning">
              La disponibilidad se verificará al recuperar conexión. Si cambia,
              te pediremos revisar el pedido.
            </p>
          )}
        </section>
      )}
      {draft.step === 2 && customer && (
        <section className="card narrow">
          <h2>Revisa antes de confirmar</h2>
          <OrderSummary order={{ items, address: customer.address }} />
          <div className="actions">
            <SecondaryButton onClick={() => void change({ ...draft, step: 1 })}>
              Volver a productos
            </SecondaryButton>
            <PrimaryButton
              disabled={busy || !items.length}
              onClick={() => void confirm()}
            >
              {busy
                ? "Verificando…"
                : online
                  ? "Confirmar pedido"
                  : "Guardar pendiente de envío"}
            </PrimaryButton>
          </div>
        </section>
      )}
      {changeCustomer && (
        <ConfirmDialog
          title="Tienes un pedido en curso"
          onClose={() => setChangeCustomer(false)}
        >
          <p>
            Los productos pertenecen a {customer?.name}. Guarda este pedido como
            borrador y vuelve a la cartera, o descarta sus productos para elegir
            otro cliente.
          </p>
          <div className="stack">
            <PrimaryButton
              onClick={async () => {
                await change(draft);
                location.hash = "/clientes";
              }}
            >
              Guardar y cambiar cliente
            </PrimaryButton>
            <SecondaryButton
              onClick={async () => {
                await update(d => {
                  const orderDrafts = {...d.orderDrafts};
                  delete orderDrafts[draft.customerId];
                  return {...d, orderDrafts, draft: undefined};
                });
                await change({ customerId: "", quantities: {}, step: 0 });
                setChangeCustomer(false);
                notify("Productos descartados. Selecciona otro cliente.");
              }}
            >
              Descartar cambios
            </SecondaryButton>
            <SecondaryButton onClick={() => setChangeCustomer(false)}>
              Seguir aquí
            </SecondaryButton>
          </div>
        </ConfirmDialog>
      )}
    </>
  );
}
