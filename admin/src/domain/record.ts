/**
 * ④きろく（続けたくなる仕掛け）。
 *
 * 数字もバッジも、②で貯まった記録を数え直しているだけです。
 * このためだけに入力してもらうものはありません（設計ルール「作業を増やさない」）。
 *
 * 数えるのは「やったこと」だけです。「残り◯個」「未対応◯件」は出しません。
 */

import type { EventType } from './stages.ts';

export type RecordEvent = { type: EventType; occurredAt: Date };

const TOKYO = 'Asia/Tokyo';
const dayKeyFormatter = new Intl.DateTimeFormat('sv-SE', { timeZone: TOKYO });
const monthKeyFormatter = new Intl.DateTimeFormat('sv-SE', {
  timeZone: TOKYO,
  year: 'numeric',
  month: '2-digit',
});

const dayKey = (date: Date) => dayKeyFormatter.format(date);
const monthKey = (date: Date) => monthKeyFormatter.format(date);

export type Badge = { label: string; got: boolean };

export type RecordSummary = {
  monthlyPieces: number;
  monthlyDelivered: number;
  totalOrders: number;
  /** 続いている日数。減りません。理由は下のコメント。 */
  activeDays: number;
  badges: Badge[];
  thisWeek: { pieces: number; delivered: number };
  /** まだ何も記録が無い状態か。画面の出し方を変えるために使います。 */
  empty: boolean;
};

export function buildRecord(
  input: {
    events: readonly RecordEvent[];
    totalOrders: number;
    /** 5個以上の注文があるか。「はじめての団体オーダー」の判定に使います。 */
    hasGroupOrder: boolean;
  },
  now: Date,
): RecordSummary {
  const { events, totalOrders, hasGroupOrder } = input;

  const thisMonth = monthKey(now);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  let monthlyPieces = 0;
  let monthlyDelivered = 0;
  let totalPieces = 0;
  let weekPieces = 0;
  let weekDelivered = 0;
  let firstAt: Date | null = null;

  // 「続いている日数」は、記録があった日をかぞえたものです。
  //
  // 連続していないと途切れる作りにはしていません。
  // 数日あいだが空いても、この数字は減りません。
  // 止まっていた期間を途切れとして見せないためです（設計ルール「責めない」）。
  const activeDayKeys = new Set<string>();

  for (const event of events) {
    activeDayKeys.add(dayKey(event.occurredAt));
    if (firstAt === null || event.occurredAt < firstAt) firstAt = event.occurredAt;

    const inThisMonth = monthKey(event.occurredAt) === thisMonth;
    const inThisWeek = event.occurredAt >= weekAgo;

    if (event.type === 'piece_done') {
      totalPieces += 1;
      if (inThisMonth) monthlyPieces += 1;
      if (inThisWeek) weekPieces += 1;
    }
    if (event.type === 'delivered') {
      if (inThisMonth) monthlyDelivered += 1;
      if (inThisWeek) weekDelivered += 1;
    }
  }

  const activeDays = activeDayKeys.size;
  const aYear = firstAt !== null && now.getTime() - firstAt.getTime() >= 365 * 24 * 60 * 60 * 1000;

  return {
    monthlyPieces,
    monthlyDelivered,
    totalOrders,
    activeDays,
    // しきい値はデモに書かれているものをそのまま使っています。
    badges: [
      { label: 'はじめての団体オーダー', got: hasGroupOrder },
      { label: '10個つくった', got: totalPieces >= 10 },
      { label: '1週間つづいた', got: activeDays >= 7 },
      { label: '50個つくった', got: totalPieces >= 50 },
      { label: '季節をひとまわり', got: aYear },
    ],
    thisWeek: { pieces: weekPieces, delivered: weekDelivered },
    empty: events.length === 0,
  };
}

/**
 * 「5個仕上げて、2件お届けしました。」
 *
 * やっていないほうは書きません。「0件お届けしました」とは言いません。
 * 何もない週は、文そのものを出しません（設計ルール「責めない」）。
 */
export function describeWeek(week: { pieces: number; delivered: number }): string | null {
  const { pieces, delivered } = week;
  if (pieces > 0 && delivered > 0) return `${pieces}個仕上げて、${delivered}件お届けしました。`;
  if (pieces > 0) return `${pieces}個仕上げました。`;
  if (delivered > 0) return `${delivered}件お届けしました。`;
  return null;
}

/** 「はじめての団体オーダー」とみなす個数。 */
export const GROUP_ORDER_PIECES = 5;
