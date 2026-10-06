/** Backend boundary. These DTOs are independent of either application's UI. */
/** Perfiles de acceso (Fase 1). Coincide con el enum public.perfil de backend/supabase/migrations. */
export type Perfil = 'gerencia' | 'vendedor' | 'kam' | 'cliente_admin' | 'cliente_integrante' | 'partner';
/** Lo que devuelve public.mi_sesion(): la identidad y los permisos los decide el servidor. */
export interface Principal {
  id: string;
  perfil: Perfil;
  organizationId: string;
  permissions: string[];
}
// Los puertos siguientes son del diseño previo a la Fase 1 y se revisan en la Fase 3
// (flujo de reposición: solo el cliente confirma; ya no aplica la regla de 24 horas).
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
