/** Backend boundary. These DTOs are independent of either application's UI. */
export interface Principal {
  id: string;
  role: 'SELLER' | 'KAM' | 'COMMERCIAL_EXECUTIVE' | 'SUPERVISOR';
  territory: string;
  assignedCustomerIds: string[];
  permissions: string[];
}
export interface MutationEnvelope {
  id: string;
  entityType: string;
  entityId: string;
  operation: 'CREATE' | 'UPDATE' | 'UPLOAD';
  payload: unknown;
  createdAt: string;
  userId: string;
  expectedVersion?: string;
}
export interface MutationReceipt {
  status: 'SYNCED' | 'NEEDS_REVIEW';
  serverId?: string;
  version?: string;
  message?: string;
  conflicts?: { field: string; requested: unknown; current: unknown }[];
}
export interface IdentityPort { session(): Promise<Principal>; renew(): Promise<Principal>; logout(): Promise<void> }
export interface CrmPort { execute(principal: Principal, mutation: MutationEnvelope): Promise<MutationReceipt> }
export interface ErpPort { reserveOrder(principal: Principal, mutation: MutationEnvelope): Promise<MutationReceipt> }
export interface NotificationPort { sendOnce(eventId: string, recipientId: string, template: string): Promise<void> }
export interface FilePort { upload(principal: Principal, customerId: string, file: Blob, idempotencyKey: string): Promise<{id: string}> }
export interface ReplenishmentPort { claimReminder(alertId: string, actor: 'SELLER' | 'CRM_AUTOMATION', idempotencyKey: string): Promise<'SENT_BY_SELLER' | 'SENT_BY_CRM_AUTOMATION'> }
