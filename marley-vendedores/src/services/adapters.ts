import type { AppData, Product, SyncItem, User } from "../types";
import { stockIssues } from "../utils/domain";
import type { Order } from "../types";
export interface SyncResult {
  status: "SYNCED" | "NEEDS_REVIEW";
  message?: string;
  serverId?: string;
}
export interface BackendAdapter {
  getProducts(): Promise<Product[]>;
  execute(item: SyncItem, user: User): Promise<SyncResult>;
}
// All production CRM, ERP and file operations must go through the authenticated Marley backend.
export class SalesforceAdapter implements BackendAdapter {
  constructor(private baseUrl: string) {}
  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      credentials: "include",
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
    if (response.status === 401) throw new Error("SESSION_EXPIRED");
    if (!response.ok) throw new Error("TEMPORARY");
    return response.json();
  }
  getProducts() {
    return this.request<Product[]>("/products");
  }
  execute(item: SyncItem, _user: User) {
    return this.request<SyncResult>("/sync", {
      method: "POST",
      headers: { "Idempotency-Key": item.id },
      body: JSON.stringify(item),
    });
  }
}
export class MockAdapter implements BackendAdapter {
  constructor(private read: () => AppData) {}
  async getProducts() {
    return structuredClone(this.read().products);
  }
  async execute(item: SyncItem, user: User): Promise<SyncResult> {
    const payload = item.payload as { customerId?: string };
    if (
      item.userId !== user.id ||
      (payload.customerId &&
        !user.assignedCustomers.includes(payload.customerId))
    )
      throw new Error("FORBIDDEN");
    if (
      item.entityType === "orders" &&
      stockIssues((item.payload as Order).items, await this.getProducts())
        .length
    )
      return {
        status: "NEEDS_REVIEW",
        message:
          "Debemos actualizar tu pedido. Revisa las cantidades disponibles.",
      };
    return {
      status: "SYNCED",
      serverId:
        item.entityType === "orders"
          ? `MC-${item.entityId.replace("TMP-", "").slice(0, 8).toUpperCase()}`
          : undefined,
    };
  }
}
export const AuthService = {
  current: () => sessionStorage.getItem("marley-vendedores-user"),
  login: (userId: string) =>
    sessionStorage.setItem("marley-vendedores-user", userId),
  logout: () => sessionStorage.removeItem("marley-vendedores-user"),
};
