import { test } from "node:test";
import assert from "node:assert/strict";
import {
  totals,
  stockIssues,
  assigned,
  maySendReminder,
} from "../src/utils/domain.ts";
import type { Product, Customer, User } from "../src/types/index.ts";
import type { SyncItem } from "../src/types/index.ts";
import { SyncService } from "../src/services/SyncService.ts";
test('sync only retries eligible items and never auto-sends conflicts', () => {
  const queue = [{id:'a',status:'PENDING'}, {id:'b',status:'NEEDS_REVIEW'}, {id:'c',status:'FAILED',nextRetryAt:2000}, {id:'d',status:'SYNCED'}] as SyncItem[];
  assert.deepEqual(SyncService.eligible(queue,1000).map(q=>q.id), ['a']);
  assert.deepEqual(SyncService.eligible(queue,2000).map(q=>q.id), ['a','c']);
  assert.equal(SyncService.nextRetry(0,0),5000);
  assert.equal(SyncService.nextRetry(20,0),300000);
});
test("IVA uses integer CLP and does not round each line", () =>
  assert.deepEqual(
    totals([{ productId: "p", quantity: 6, unitPrice: 21990 }]),
    { subtotal: 131940, tax: 25069, total: 157009 },
  ));
test("stock conflict preserves requested quantity and rejects invalid quantities", () => {
  const items = [{ productId: "p", quantity: 12, unitPrice: 29990 }];
  const products = [{ id: "p", stock: 10 } as Product];
  assert.equal(stockIssues(items, products).length, 1);
  assert.equal(items[0].quantity, 12);
  assert.equal(
    stockIssues([{ ...items[0], quantity: 10 }], products).length,
    0,
  );
  assert.equal(
    stockIssues([{ ...items[0], quantity: 1.5 }], products).length,
    1,
  );
});
test("portfolio never includes unassigned customers", () =>
  assert.deepEqual(
    assigned(
      { assignedCustomers: ["c1"] } as User,
      [{ id: "c1" }, { id: "c2" }] as Customer[],
    ).map((c) => c.id),
    ["c1"],
  ));
test("CRM automation and seller handled alerts cannot send another reminder", () => {
  assert.equal(maySendReminder("OPEN"), true);
  assert.equal(maySendReminder("SENT_BY_CRM_AUTOMATION"), false);
  assert.equal(maySendReminder("SENT_BY_SELLER"), false);
});
