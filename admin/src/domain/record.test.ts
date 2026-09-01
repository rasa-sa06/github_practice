import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildRecord, describeWeek, type RecordEvent } from './record.ts';

const now = new Date('2025-10-20T03:00:00Z'); // 日本時間 10月20日 昼
const daysBefore = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000);
const ev = (type: RecordEvent['type'], ago: number): RecordEvent => ({
  type,
  occurredAt: daysBefore(ago),
});

const build = (events: RecordEvent[], extra: { totalOrders?: number; hasGroupOrder?: boolean } = {}) =>
  buildRecord(
    { events, totalOrders: extra.totalOrders ?? 0, hasGroupOrder: extra.hasGroupOrder ?? false },
    now,
  );

test('今月つくったリボンは、今月の「1個できた」だけを数える', () => {
  const summary = build([ev('piece_done', 2), ev('piece_done', 5), ev('piece_done', 40)]);
  assert.equal(summary.monthlyPieces, 2);
});

test('間があいても、続いている日数は減らない', () => {
  // 3日ぶん記録があり、あいだが1か月あいている
  const summary = build([ev('piece_done', 60), ev('piece_done', 2), ev('piece_done', 1)]);
  assert.equal(summary.activeDays, 3);
});

test('同じ日に何度やっても、続いている日数は1日ぶん', () => {
  const summary = build([ev('piece_done', 1), ev('piece_done', 1), ev('meeting', 1)]);
  assert.equal(summary.activeDays, 1);
});

test('バッジは、やったことが届いたときだけ付く', () => {
  const summary = build(Array.from({ length: 10 }, (_, i) => ev('piece_done', i + 1)));
  const got = Object.fromEntries(summary.badges.map((b) => [b.label, b.got]));
  assert.equal(got['10個つくった'], true);
  assert.equal(got['50個つくった'], false);
  assert.equal(got['1週間つづいた'], true);
});

test('記録が何も無くても、こわれない', () => {
  const summary = build([]);
  assert.equal(summary.empty, true);
  assert.equal(summary.monthlyPieces, 0);
  assert.equal(summary.activeDays, 0);
  assert.equal(summary.badges.every((b) => !b.got), true);
});

test('今週なにもしていない週は、무理に文を作らない', () => {
  assert.equal(describeWeek({ pieces: 0, delivered: 0 }), null);
});

test('やったぶんだけを書く。0のほうは書かない', () => {
  assert.equal(describeWeek({ pieces: 5, delivered: 2 }), '5個仕上げて、2件お届けしました。');
  assert.equal(describeWeek({ pieces: 3, delivered: 0 }), '3個仕上げました。');
  assert.equal(describeWeek({ pieces: 0, delivered: 2 }), '2件お届けしました。');
});
