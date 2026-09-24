import type { OrderItem, Product, User, Customer } from "../types/index.ts";
export const money = (value: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
export const day = (offset = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const shortDate = (value: string) =>
  new Date(
    value.length === 10 ? value + "T12:00:00" : value,
  ).toLocaleDateString("es-CL", { day: "numeric", month: "short" });
export const uid = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;
export const totals = (items: OrderItem[]) => {
  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const tax = Math.round(subtotal * 0.19);
  return { subtotal, tax, total: subtotal + tax };
};
export const stockIssues = (items: OrderItem[], products: Product[]) =>
  items.filter(
    (i) =>
      !Number.isInteger(i.quantity) ||
      i.quantity < 1 ||
      i.quantity > (products.find((p) => p.id === i.productId)?.stock ?? 0),
  );
export const assigned = (user: User, customers: Customer[]) =>
  customers.filter((c) => user.assignedCustomers.includes(c.id));
export const maySendReminder = (status: string) => status === "OPEN";
