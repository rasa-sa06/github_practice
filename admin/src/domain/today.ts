/**
 * ①きょう に何を出すかを決める部分。
 *
 * 出す中身はデモが指定しています。ここでやっているのは、その並べ方だけです。
 *
 * 大きく出るのは常に1件です（設計ルール「一手だけ」）。
 * 順番は「お客様を待たせているもの → 作りかけのもの → 送るもの」。
 * 同じ種類なら、待っている時間が長いものが先です。
 */

import type { DerivedOrder } from './orders.ts';
import { type Stage, STAGE_TONE, type Tone } from './stages.ts';

export type TodaySource = {
  id: string;
  customerName: string;
  title: string;
  derived: DerivedOrder;
};

export type TodayItem = {
  orderId: string;
  headline: string;
  detail: string;
  tone: Tone;
};

/** その段階で「きょうやること」として何と書くか。デモの文言に合わせています。 */
function describe(order: TodaySource): TodayItem | null {
  const { derived } = order;

  switch (derived.stage) {
    case 'inquiry':
    case 'meeting':
      return {
        orderId: order.id,
        headline: `${order.customerName}に返信する`,
        detail: `${order.title}のご相談が届いています。`,
        tone: STAGE_TONE[derived.stage],
      };
    case 'making':
      return {
        orderId: order.id,
        headline: order.title,
        detail:
          derived.totalPieces > 1
            ? `${derived.totalPieces}個のうち ${derived.piecesDone}個できています`
            : '制作中です',
        tone: STAGE_TONE.making,
      };
    case 'completed':
      return {
        orderId: order.id,
        headline: `${order.title}を発送する`,
        detail: '完成ずみ。宛先はひかえてあります',
        tone: STAGE_TONE.completed,
      };
    // 発送ずみとお届け完了は、もう手が要りません。きょうの画面には出しません。
    default:
      return null;
  }
}

/** 手をつける順。返信 → 制作 → 発送。 */
const URGENCY: Record<Stage, number> = {
  inquiry: 0,
  meeting: 0,
  making: 1,
  completed: 2,
  shipped: 99,
  delivered: 99,
};

export type Today = {
  primary: TodayItem | null;
  secondary: TodayItem[];
  /** 「きょうやることは◯つです」の◯。0のこともあります。 */
  count: number;
};

export function buildToday(orders: readonly TodaySource[]): Today {
  const items = [...orders]
    .sort((a, b) => {
      const byUrgency = URGENCY[a.derived.stage] - URGENCY[b.derived.stage];
      if (byUrgency !== 0) return byUrgency;
      // 同じ種類なら、その段階に入ったのが古いほうを先に。
      const at = a.derived.reachedAt[a.derived.stage]?.getTime() ?? 0;
      const bt = b.derived.reachedAt[b.derived.stage]?.getTime() ?? 0;
      return at - bt;
    })
    .map(describe)
    .filter((item): item is TodayItem => item !== null);

  return {
    primary: items[0] ?? null,
    // デモに合わせて、そのあとは2件までにしています。
    // 全部並べると「たまっている」ように見えます（設計ルール「責めない」）。
    secondary: items.slice(1, 3),
    count: items.length,
  };
}

export type Quest = { label: string; done: boolean };

/**
 * きょうのクエスト。
 *
 * 埋めるための操作はありません。普段の仕事の記録から数えているだけです
 * （設計ルール「作業を増やさない」）。
 *
 * 「アプリをひらく」は、この画面が出ている時点で済んでいます。
 * 何もない日でも、必ず1つは埋まっている状態から始まります。
 */
export function buildQuests(todaysEventTypes: readonly string[]): Quest[] {
  return [
    { label: 'アプリをひらく', done: true },
    {
      label: '返信をひとつ返す',
      done: todaysEventTypes.includes('meeting') || todaysEventTypes.includes('making'),
    },
    { label: 'リボンを1つ仕上げる', done: todaysEventTypes.includes('piece_done') },
  ];
}
