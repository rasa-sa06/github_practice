import type { OrderCard } from '../db/queries.ts';

const tokyoDay = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' });

/** きょう（日本時間）付いた記録の種類。クエストの判定に使います。 */
export function todaysEventTypes(orders: readonly OrderCard[]): string[] {
  const today = tokyoDay.format(new Date());
  return orders
    .flatMap((order) => order.events)
    .filter((event) => tokyoDay.format(event.occurredAt) === today)
    .map((event) => event.type);
}
