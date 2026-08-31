import { relations } from 'drizzle-orm';
import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { EVENT_TYPES, type EventType } from '../domain/stages.ts';

const id = () => uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID());
const now = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();

export const customers = pgTable('customers', {
  id: id(),
  /** 画面に出る呼び方。「ゆきさん」など。本名を入れる必要はありません。 */
  name: text('name').notNull(),
  /** LINEのトーク画面を直接ひらくためのURL。無ければボタンを出しません。 */
  lineChatUrl: text('line_chat_url'),
  /** フェーズE（LINEでの自動受信）で使います。それまでは空のままです。 */
  lineUserId: text('line_user_id').unique(),
  createdAt: now(),
});

export const orders = pgTable('orders', {
  id: id(),
  customerId: uuid('customer_id')
    .notNull()
    .references(() => customers.id, { onDelete: 'cascade' }),
  /** 「発表会用おそろいリボン」 */
  title: text('title').notNull(),
  /** 「8個／水色」 */
  detail: text('detail'),
  /** 作る個数。1個の注文は 1。 */
  totalPieces: integer('total_pieces').notNull().default(1),
  /**
   * 「お聞きしていること」。納期・色・数量など、お客様から聞いた内容。
   * ここに1回書けば、以降どの画面からも見られます（設計ルール「入力は一度」）。
   */
  brief: text('brief'),
  createdAt: now(),

  // ステータスと進み具合の列はありません。order_events から数え直して出します。
  // 理由は src/domain/orders.ts の先頭に書いています。
});

/**
 * 「やったこと」の記録。足すだけで、書き換えません。
 *
 * ②注文のステータス、注文詳細の「5/8個」、①きょうの並び、④きろくの数字とバッジは、
 * すべてこの1つのテーブルを数え直して作ります。
 * だから④のために新しく入力してもらうものがありません。
 */
export const orderEvents = pgTable('order_events', {
  id: id(),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  type: text('type', { enum: EVENT_TYPES as unknown as [EventType, ...EventType[]] }).notNull(),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
  /**
   * ボタン1回で足された記録に共通してつく印。
   * 1回の押下で複数の記録が付くこと（8個目で「完成」にも入る等）があるため、
   * 押し間違いを1回分だけまとめて戻せるようにしています。
   */
  batchId: uuid('batch_id').notNull(),
});

export const customersRelations = relations(customers, ({ many }) => ({
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, { fields: [orders.customerId], references: [customers.id] }),
  events: many(orderEvents),
}));

export const orderEventsRelations = relations(orderEvents, ({ one }) => ({
  order: one(orders, { fields: [orderEvents.orderId], references: [orders.id] }),
}));
