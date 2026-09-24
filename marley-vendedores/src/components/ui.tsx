import {
  useEffect,
  useRef,
  type ReactNode,
  type ButtonHTMLAttributes,
} from "react";
import {
  ArrowUpRight,
  Check,
  ChevronRight,
  Coffee,
  Search,
  X,
  Plus,
  Minus,
} from "lucide-react";
import type { Alert, Customer, Order, Product, Visit } from "../types";
import { money, shortDate } from "../utils/domain";
export const PrimaryButton = (
  props: ButtonHTMLAttributes<HTMLButtonElement>,
) => (
  <button {...props} className={`button primary ${props.className ?? ""}`} />
);
export const SecondaryButton = (
  props: ButtonHTMLAttributes<HTMLButtonElement>,
) => (
  <button {...props} className={`button secondary ${props.className ?? ""}`} />
);
export function StatusChip({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return (
    <span className={`chip ${tone}`}>
      <span className="dot" />
      {children}
    </span>
  );
}
export function EmptyState({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty">
      <Coffee size={30} />
      <h3>{title}</h3>
      <p>{description}</p>
      {children}
    </div>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow ?? "TU ESPACIO COMERCIAL"}</div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      <div className="actions">{children}</div>
    </div>
  );
}
export function MetricCard({
  label,
  value,
  detail,
  icon,
  accent = false,
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  icon?: ReactNode;
  accent?: boolean;
}) {
  return (
    <div className={`metric-card ${accent ? "accent" : ""}`}>
      <div className="row">
        <span>{label}</span>
        {icon}
      </div>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}
export function SearchBar({
  value,
  onChange,
  placeholder = "Buscar cliente…",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="search">
      <Search size={18} />
      <input
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
export function FilterSheet({ children }: { children: ReactNode }) {
  return <div className="filters">{children}</div>;
}
export function CustomerCard({ customer: c }: { customer: Customer }) {
  return (
    <article className="card customer-card">
      <div className="row">
        <span className="initials">
          {c.name
            .split(" ")
            .slice(0, 2)
            .map((n) => n[0])
            .join("")}
        </span>
        <StatusChip tone={c.risk ? "danger" : "success"}>
          {c.risk ? "En riesgo" : "Activo"}
        </StatusChip>
      </div>
      <h3>{c.name}</h3>
      <p>
        {c.channel} <span className="divider">/</span> Santiago
      </p>
      <div className="customer-stats">
        <div>
          <small>Última compra</small>
          <b>{shortDate(c.lastPurchase)}</b>
        </div>
        <div>
          <small>Reposición estimada</small>
          <b>{shortDate(c.replenishment)}</b>
        </div>
      </div>
      <div className="row card-foot">
        <span>
          <small>Venta mensual</small>
          <b>{money(c.monthlySales)}</b>
        </span>
        <a className="text-link" href={`#/clientes/${c.id}`}>
          Ver cliente <ArrowUpRight size={16} />
        </a>
      </div>
    </article>
  );
}
export function VisitCard({
  visit: v,
  customer: c,
}: {
  visit: Visit;
  customer?: Customer;
}) {
  return (
    <a className="visit-row" href={`#/agenda/${v.id}`}>
      <div className="visit-time">
        {v.time}
        <small>{shortDate(v.date)}</small>
      </div>
      <div className="grow">
        <h3>{c?.name}</h3>
        <p>
          {c?.channel} · {c?.address}
        </p>
      </div>
      <StatusChip
        tone={
          v.status === "Realizada"
            ? "success"
            : v.status === "En curso"
              ? "info"
              : "neutral"
        }
      >
        {v.status}
      </StatusChip>
      <ChevronRight size={18} />
    </a>
  );
}
export function AlertCard({
  alert: a,
  customer,
  children,
}: {
  alert: Alert;
  customer?: Customer;
  children?: ReactNode;
}) {
  return (
    <article
      className={`card alert-card ${a.category === "Atención" ? "risk" : "replenishment"}`}
    >
      <div className="row">
        <StatusChip tone={a.category === "Atención" ? "danger" : "warning"}>
          {a.category}
        </StatusChip>
        <small>{shortDate(a.createdAt)}</small>
      </div>
      <h3>{customer?.name}</h3>
      <strong>{a.title}</strong>
      <p>{a.description}</p>
      {a.status === "SENT_BY_CRM_AUTOMATION" && (
        <p className="success-text">
          <Check size={16} /> Recordatorio enviado automáticamente
        </p>
      )}
      {a.status === "SENT_BY_SELLER" && (
        <p className="success-text">Recordatorio gestionado por el vendedor</p>
      )}
      {a.status === "SNOOZED" && (
        <p>Pospuesta hasta {a.snoozedUntil && shortDate(a.snoozedUntil)}</p>
      )}
      <div className="actions">{children}</div>
    </article>
  );
}
const syncLabels: Record<string, string> = {
  DRAFT: "Borrador",
  PENDING: "Pendiente de envío",
  SYNCING: "Sincronizando",
  SYNCED: "Actualizado · demo",
  NEEDS_REVIEW: "Requiere revisión",
  FAILED: "Requiere atención",
};
export function OrderCard({
  order: o,
  customer,
}: {
  order: Order;
  customer?: Customer;
}) {
  return (
    <a className="order-row card" href={`#/pedidos/${o.id}`}>
      <div className="order-icon">
        <Coffee size={22} />
      </div>
      <div className="grow">
        <h3>{customer?.name}</h3>
        <p>
          {o.serverId ?? o.id.slice(0, 12)} · {shortDate(o.createdAt)} ·{" "}
          {o.items.reduce((s, i) => s + i.quantity, 0)} unidades
        </p>
      </div>
      <div className="align-right">
        <b>{money(o.total)}</b>
        <div>
          <StatusChip
            tone={
              o.syncStatus === "NEEDS_REVIEW"
                ? "danger"
                : o.syncStatus === "PENDING"
                  ? "warning"
                  : "info"
            }
          >
            {o.syncStatus === "SYNCED" ? o.status : syncLabels[o.syncStatus]}
          </StatusChip>
        </div>
      </div>
      <ChevronRight size={18} />
    </a>
  );
}
export function ProductQuantity({
  product: p,
  quantity,
  onChange,
}: {
  product: Product;
  quantity: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="product-row">
      <div className="coffee-pack" style={{ borderBottomColor: p.color }}>
        <Coffee size={23} />
        <small>MARLEY</small>
      </div>
      <div className="grow">
        <h3>{p.name}</h3>
        <p>{p.unit}</p>
        <small>
          Última cantidad: {p.usual} · Disponible: {p.stock}
        </small>
        <b className="product-price">{money(p.price)} neto</b>
      </div>
      <div className="quantity">
        <button
          type="button"
          aria-label={`Quitar ${p.name}`}
          onClick={() => onChange(Math.max(0, quantity - 1))}
        >
          <Minus size={16} />
        </button>
        <input
          aria-label={`Cantidad ${p.name}`}
          type="number"
          min="0"
          max="9999"
          value={quantity}
          onChange={(e) =>
            onChange(
              Math.max(
                0,
                Math.min(9999, Math.floor(Number(e.target.value) || 0)),
              ),
            )
          }
        />
        <button
          type="button"
          aria-label={`Agregar ${p.name}`}
          onClick={() => onChange(Math.min(9999, quantity + 1))}
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}
export function ConfirmDialog({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className="row modal-head">
        <h2>{title}</h2>
        <button aria-label="Cerrar" className="icon-button" onClick={onClose}>
          <X />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export const Toast = ({ message }: { message: string }) =>
  message ? (
    <div className="toast" role="status">
      <Check size={18} />
      {message}
    </div>
  ) : null;
