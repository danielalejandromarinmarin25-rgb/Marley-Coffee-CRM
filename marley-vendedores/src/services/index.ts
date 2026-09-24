import type { AppData, Order, Product, Customer, User } from "../types";
import { assigned, stockIssues, totals } from "../utils/domain";
export const CustomerService = {
  list: (data: AppData, user: User) => assigned(user, data.customers),
};
export const OrderService = {
  validate: (order: Pick<Order, "items">, products: Product[]) =>
    stockIssues(order.items, products),
  totals,
};
export const VisitService = {
  forCustomer: (data: AppData, customer: Customer) =>
    data.visits.filter((v) => v.customerId === customer.id),
};
export const AlertService = {
  forCustomer: (data: AppData, id: string) =>
    data.alerts.filter((a) => a.customerId === id),
  canSend: (status: string) => status === "OPEN",
};
export const NotificationService = {
  unread: (data: AppData) => data.notifications.filter((n) => !n.read).length,
};
export { StorageService } from "../repositories/storage";
export { AuthService, SalesforceAdapter } from "./adapters";
