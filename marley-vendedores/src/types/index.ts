export type Role = "SELLER" | "KAM" | "COMMERCIAL_EXECUTIVE" | "SUPERVISOR";
export type Channel = "Horeca" | "OCS" | "Conveniencia" | "Panaderías";
export type SyncStatus =
  "DRAFT" | "PENDING" | "SYNCING" | "SYNCED" | "NEEDS_REVIEW" | "FAILED";
export interface User {
  id: string;
  name: string;
  role: Role;
  territory: string;
  assignedCustomers: string[];
  permissions: string[];
}
export interface Contact {
  name: string;
  phone: string;
  email: string;
}
export interface Customer {
  id: string;
  name: string;
  channel: Channel;
  contact: Contact;
  address: string;
  lastPurchase: string;
  replenishment: string;
  frequency: number;
  monthlySales: number;
  risk?: string;
  products: string[];
  note: string;
  indicators: { label: string; value: string }[];
}
export interface Product {
  id: string;
  name: string;
  unit: string;
  price: number;
  stock: number;
  usual: number;
  color: string;
}
export interface BaseEntity {
  id: string;
  customerId: string;
  syncStatus: SyncStatus;
}
export interface OrderItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}
export interface Order extends BaseEntity {
  items: OrderItem[];
  createdAt: string;
  address: string;
  total: number;
  status: string;
  serverId?: string;
}
export interface Visit extends BaseEntity {
  date: string;
  time: string;
  status: "Programada" | "En curso" | "Realizada" | "Cancelada";
  startedAt?: string;
  result?: string;
  notes: string;
  products?: string;
  opportunities?: string;
  problems?: string;
  competition?: string;
  nextVisit?: string;
  cancelReason?: string;
}
export type AlertType =
  | "REPLENISHMENT"
  | "CUSTOMER_RISK"
  | "NO_PURCHASE"
  | "SALES_DROP"
  | "SERVICE_CASE"
  | "VISIT"
  | "OPPORTUNITY";
export interface Alert extends BaseEntity {
  type: AlertType;
  title: string;
  description: string;
  category: "Atención" | "Reposición" | "Seguimiento";
  status: "OPEN" | "SENT_BY_SELLER" | "SENT_BY_CRM_AUTOMATION" | "SNOOZED";
  createdAt: string;
  deadline: string;
  snoozedUntil?: string;
  productId?: string;
  quantity?: number;
}
export interface Opportunity extends BaseEntity {
  name: string;
  product: string;
  value: number;
  stage: "Nueva" | "En seguimiento" | "Propuesta" | "Ganada" | "Perdida";
  expectedDate: string;
  comments: string;
}
export interface Case extends BaseEntity {
  type: string;
  priority: string;
  description: string;
  responsible: string;
  status: "Abierto" | "En proceso" | "Resuelto" | "Cerrado";
  comments: string;
}
export interface Task extends BaseEntity {
  title: string;
  due: string;
  done: boolean;
}
export interface Activity {
  id: string;
  customerId: string;
  type: string;
  comment: string;
  createdAt: string;
}
export interface Notification {
  id: string;
  title: string;
  type: string;
  route: string;
  read: boolean;
  createdAt: string;
}
export interface Replenishment {
  customerId: string;
  productId: string;
  lastPurchase: string;
  frequency: number;
  estimatedDate: string;
  usualQuantity: number;
}
export interface SalesMetric {
  sales: number;
  goal: number;
  orders: number;
  activeCustomers: number;
  recoveredCustomers: number;
}
export type EntityType =
  | "orders"
  | "visits"
  | "opportunities"
  | "cases"
  | "tasks"
  | "alerts"
  | "activities"
  | "photos";
export interface SyncItem {
  id: string;
  entityType: EntityType;
  entityId: string;
  operation: "CREATE" | "UPDATE" | "UPLOAD";
  payload: unknown;
  createdAt: string;
  status: SyncStatus;
  retryCount: number;
  userId: string;
  error?: string;
  nextRetryAt?: number;
}
export interface Photo {
  id: string;
  userId: string;
  customerId: string;
  entityId: string;
  name: string;
  blob: Blob;
  status: "LOCAL" | "PENDING" | "UPLOADING" | "UPLOADED" | "FAILED";
}
export interface OrderDraft {
  customerId: string;
  quantities: Record<string, number>;
  step: number;
}
export interface FormDraft {
  id: string;
  values: Record<string, string>;
}
export interface AppData {
  customers: Customer[];
  products: Product[];
  orders: Order[];
  visits: Visit[];
  alerts: Alert[];
  opportunities: Opportunity[];
  cases: Case[];
  tasks: Task[];
  activities: Activity[];
  notifications: Notification[];
  queue: SyncItem[];
  draft?: OrderDraft;
  orderDrafts?: Record<string, OrderDraft>;
  formDrafts?: Record<string, FormDraft>;
  metrics: SalesMetric;
}
