import assert from 'node:assert/strict';
import { test } from 'node:test';

import { deriveOrder, type OrderEvent } from './orders.ts';
import { buildQuests, buildToday, type TodaySource } from './today.ts';

const at = (day: number) => new Date(Date.UTC(2025, 9, day));
const ev = (type: OrderEvent['type'], day: number): OrderEvent => ({ type, occurredAt: at(day) });

const order = (
  id: string,
  customerName: string,
  title: string,
  totalPieces: number,
  events: OrderEvent[],
): TodaySource => ({ id, customerName, title, derived: deriveOrder({ totalPieces }, events) });

test('大きく出るのは常に1件だけ', () => {
  const today = buildToday([
    order('a', 'ゆきさん', '七五三のリボン', 1, [ev('inquiry', 5)]),
    order('b', 'みなこさん', 'おそろいリボン', 8, [ev('making', 3)]),
    order('c', 'あやのさん', '入学式用リボン', 1, [ev('completed', 2)]),
  ]);
  assert.equal(today.primary?.headline, 'ゆきさんに返信する');
  assert.equal(today.secondary.length, 2);
});

test('返信が先、そのあと制作、最後に発送', () => {
  const today = buildToday([
    order('c', 'あやのさん', '入学式用リボン', 1, [ev('completed', 2)]),
    order('b', 'みなこさん', 'おそろいリボン', 8, [ev('making', 3)]),
    order('a', 'ゆきさん', '七五三のリボン', 1, [ev('inquiry', 5)]),
  ]);
  assert.deepEqual(
    [today.primary, ...today.secondary].map((i) => i?.tone),
    ['waiting', 'mine', 'done'],
  );
});

test('たまっていても、そのあとは2件までしか出さない', () => {
  const many = Array.from({ length: 9 }, (_, i) =>
    order(`o${i}`, `客${i}さん`, 'リボン', 1, [ev('inquiry', i + 1)]),
  );
  const today = buildToday(many);
  assert.equal(today.secondary.length, 2);
});

test('お届けまで終わったものは、きょうの画面に出ない', () => {
  const today = buildToday([
    order('a', 'けいこさん', 'ヘッドドレス', 1, [ev('delivered', 1)]),
    order('b', 'あきさん', 'リボン', 1, [ev('shipped', 1)]),
  ]);
  assert.equal(today.primary, null);
  assert.equal(today.count, 0);
});

test('注文が1件も無くても、きちんと成り立つ', () => {
  const today = buildToday([]);
  assert.equal(today.primary, null);
  assert.deepEqual(today.secondary, []);
  assert.equal(today.count, 0);
});

test('何もしていない日でも、クエストは1つ埋まっている', () => {
  const quests = buildQuests([]);
  assert.equal(quests[0].done, true);
  assert.equal(quests.filter((q) => q.done).length, 1);
});

test('リボンを仕上げた日は、そのクエストが埋まる', () => {
  const quests = buildQuests(['piece_done']);
  assert.equal(quests.find((q) => q.label === 'リボンを1つ仕上げる')?.done, true);
});
