import assert from 'node:assert/strict';
import { test } from 'node:test';

import { compareForList, deriveOrder, eventsForPress, type OrderEvent } from './orders.ts';
import { NEXT_ACTION, STAGE_TONE } from './stages.ts';

const at = (day: number) => new Date(Date.UTC(2025, 9, day));
const ev = (type: OrderEvent['type'], day: number): OrderEvent => ({ type, occurredAt: at(day) });

test('記録が無い注文は、お問い合わせから始まる', () => {
  const d = deriveOrder({ totalPieces: 1 }, []);
  assert.equal(d.stage, 'inquiry');
  assert.equal(d.piecesDone, 0);
});

test('いちばん先の段階が「いま」になる（記録の順番には左右されない）', () => {
  const d = deriveOrder({ totalPieces: 8 }, [ev('making', 8), ev('inquiry', 2), ev('meeting', 5)]);
  assert.equal(d.stage, 'making');
  assert.deepEqual(d.reachedAt.inquiry, at(2));
  assert.deepEqual(d.reachedAt.meeting, at(5));
});

test('進み具合は「1個できた」を数えて出す（注文には数を持たせない）', () => {
  const d = deriveOrder({ totalPieces: 8 }, [
    ev('making', 8),
    ...Array.from({ length: 5 }, (_, i) => ev('piece_done', 9 + i)),
  ]);
  assert.equal(d.piecesDone, 5);
  assert.equal(d.totalPieces, 8);
  assert.equal(d.progress, 0.625);
});

test('最後の1個を押すと、そのまま完成に入る（完成させる操作を別に押させない）', () => {
  const before = deriveOrder({ totalPieces: 3 }, [ev('making', 8), ev('piece_done', 9), ev('piece_done', 10)]);
  assert.deepEqual(eventsForPress(before, 'piece_done'), ['piece_done', 'completed']);
});

test('途中の1個では完成にしない', () => {
  const before = deriveOrder({ totalPieces: 3 }, [ev('making', 8), ev('piece_done', 9)]);
  assert.deepEqual(eventsForPress(before, 'piece_done'), ['piece_done']);
});

test('打ち合わせのまま「1個できた」を押しても、制作中に入って進む', () => {
  const before = deriveOrder({ totalPieces: 5 }, [ev('inquiry', 2), ev('meeting', 5)]);
  assert.deepEqual(eventsForPress(before, 'piece_done'), ['making', 'piece_done']);
});

test('1個だけの注文は、1回押せば完成になる', () => {
  const before = deriveOrder({ totalPieces: 1 }, [ev('making', 8)]);
  assert.deepEqual(eventsForPress(before, 'piece_done'), ['piece_done', 'completed']);
});

test('押しすぎても、数は注文の個数を超えない', () => {
  const d = deriveOrder({ totalPieces: 2 }, [ev('piece_done', 9), ev('piece_done', 10), ev('piece_done', 11)]);
  assert.equal(d.piecesDone, 2);
  assert.equal(d.progress, 1);
});

test('どの段階にも、押せる一手がちょうど1つある（お届け完了を除く）', () => {
  for (const [stage, action] of Object.entries(NEXT_ACTION)) {
    if (stage === 'delivered') assert.equal(action, null);
    else assert.ok(action, `${stage} に次の一手がありません`);
  }
});

test('色は3色と、終わったもの用の1つしか使わない', () => {
  const tones = new Set(Object.values(STAGE_TONE));
  assert.deepEqual([...tones].sort(), ['closed', 'done', 'mine', 'waiting']);
});

test('段階の早いものが上、お届け完了は下', () => {
  const order = (stage: 'inquiry' | 'making' | 'delivered', day: number) => ({
    derived: deriveOrder({ totalPieces: 1 }, [ev(stage, day)]),
  });
  const sorted = [order('delivered', 1), order('making', 2), order('inquiry', 3)]
    .sort(compareForList)
    .map((o) => o.derived.stage);
  assert.deepEqual(sorted, ['inquiry', 'making', 'delivered']);
});

test('放置されたものは下に埋もれない（同じ段階なら古いほうが上）', () => {
  const old = { derived: deriveOrder({ totalPieces: 1 }, [ev('inquiry', 1)]) };
  const fresh = { derived: deriveOrder({ totalPieces: 1 }, [ev('inquiry', 20)]) };
  assert.deepEqual(
    [fresh, old].sort(compareForList).map((o) => o.derived.reachedAt.inquiry),
    [at(1), at(20)],
  );
});
