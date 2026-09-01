import { asc, eq } from 'drizzle-orm';

import { compareForList, deriveOrder, type DerivedOrder } from '../domain/orders.ts';
import type { EventType } from '../domain/stages.ts';
import { db } from './index.ts';
import { orderEvents } from './schema.ts';

export type OrderCard = {
  id: string;
  title: string;
  detail: string | null;
  brief: string | null;
  totalPieces: number;
  customerName: string;
  lineChatUrl: string | null;
  derived: DerivedOrder;
  /** ①きょう と ④きろく は、この記録を数え直して作ります。 */
  events: { type: EventType; occurredAt: Date }[];
};

const toCard = (row: {
  id: string;
  title: string;
  detail: string | null;
  brief: string | null;
  totalPieces: number;
  customer: { name: string; lineChatUrl: string | null };
  events: { type: string; occurredAt: Date }[];
}): OrderCard => ({
  id: row.id,
  title: row.title,
  detail: row.detail,
  brief: row.brief,
  totalPieces: row.totalPieces,
  customerName: row.customer.name,
  lineChatUrl: row.customer.lineChatUrl,
  derived: deriveOrder({ totalPieces: row.totalPieces }, row.events as { type: EventType; occurredAt: Date }[]),
  events: row.events as { type: EventType; occurredAt: Date }[],
});

export async function listOrders(): Promise<OrderCard[]> {
  const client = await db;
  const rows = await client.query.orders.findMany({
    with: { customer: true, events: { orderBy: asc(orderEvents.occurredAt) } },
  });
  // 並べ替えは domain/orders.ts が決めます。SQL の ORDER BY では書けません
  // （いまの段階が、記録を数えないと分からないため）。
  return rows.map(toCard).sort(compareForList);
}

export async function findOrder(id: string): Promise<OrderCard | null> {
  const client = await db;
  const row = await client.query.orders.findFirst({
    where: (orders, { eq: equals }) => equals(orders.id, id),
    with: { customer: true, events: { orderBy: asc(orderEvents.occurredAt) } },
  });
  return row ? toCard(row) : null;
}

/** 押し間違いを1回分だけ戻せる時間。これを過ぎたら記録として残します。 */
export const UNDO_WINDOW_MS = 10 * 60 * 1000;

/** 直前の押下が、まだ戻せる時間内かどうか。 */
export async function undoableBatch(orderId: string): Promise<string | null> {
  const client = await db;
  const [latest] = await client
    .select()
    .from(orderEvents)
    .where(eq(orderEvents.orderId, orderId))
    .orderBy(asc(orderEvents.occurredAt))
    .then((rows) => rows.slice(-1));

  if (!latest) return null;
  if (Date.now() - latest.occurredAt.getTime() > UNDO_WINDOW_MS) return null;
  return latest.batchId;
}
