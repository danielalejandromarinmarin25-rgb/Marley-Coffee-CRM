import type { SyncItem } from '../types/index.ts';
export const SyncService = {
  eligible: (queue: SyncItem[], now = Date.now()) => queue.filter(item => item.status === 'PENDING' || (item.status === 'FAILED' && now >= (item.nextRetryAt ?? 0))),
  nextRetry: (retryCount: number, now = Date.now()) => now + Math.min(300_000, 5_000 * 2 ** retryCount),
};
