'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { db } from '../../../db/index.ts';
import { orderEvents } from '../../../db/schema.ts';
import { findOrder, undoableBatch } from '../../../db/queries.ts';
import { eventsForPress } from '../../../domain/orders.ts';
import type { EventType } from '../../../domain/stages.ts';

/**
 * 一手ぶんの押下。
 *
 * 数値も日付も受け取りません。押されたという事実だけを記録します
 * （設計ルール「押すだけで進む」）。
 */
export async function advance(orderId: string, appends: EventType) {
  const order = await findOrder(orderId);
  if (!order) return;

  const types = eventsForPress(order.derived, appends);
  const batchId = crypto.randomUUID();
  const occurredAt = new Date();

  const client = await db;
  await client
    .insert(orderEvents)
    .values(types.map((type) => ({ orderId, type, occurredAt, batchId })));

  revalidatePath(`/orders/${orderId}`);
  revalidatePath('/orders');
}

/**
 * 直前の1回ぶんを取り消します。
 *
 * 記録は足すだけで書き換えない作りですが、押し間違いだけは別です。
 * スマホなので誤タップは起きますし、取り消せないと
 * 「12個つくった」がずっと間違ったまま残ります。
 * 直前の10分だけ、1回ぶんをまとめて消せるようにしています。
 */
export async function undoLast(orderId: string) {
  const batchId = await undoableBatch(orderId);
  if (!batchId) return;

  const client = await db;
  await client
    .delete(orderEvents)
    .where(and(eq(orderEvents.orderId, orderId), eq(orderEvents.batchId, batchId)));

  revalidatePath(`/orders/${orderId}`);
  revalidatePath('/orders');
}
