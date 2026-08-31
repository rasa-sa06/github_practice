/**
 * 注文の「いまの状態」を、記録（イベント）から計算して出す部分。
 *
 * 注文の行に「進捗 5/8」や「ステータス」を持たせて上書きしていく作り方をしていません。
 * 持っているのは「やったこと」を1行ずつ足しただけの記録で、
 * 画面に出るものは全部ここで数え直して作ります。
 *
 * そうしている理由は2つあります。
 *
 * 1. ④きろく（今月つくった数・続いている日数・バッジ）が、あとから何も足さずに出せます。
 *    上書き方式だと「いつ何個できたか」が残らず、その時点で作り直しになります。
 * 2. ゲーム要素のための入力が、構造上できません（設計ルール「作業を増やさない」）。
 *    数えるものが「やったこと」しかないので、「できていないこと」は数えようがありません。
 */

import {
  type EventType,
  type Stage,
  NEXT_ACTION,
  STAGES,
  stageIndex,
} from './stages.ts';

export type OrderEvent = {
  type: EventType;
  occurredAt: Date;
};

export type OrderInput = {
  totalPieces: number;
};

export type DerivedOrder = {
  /** いまどの段階にいるか。記録された段階のうち、いちばん先のもの。 */
  stage: Stage;
  /** 各段階にいつ入ったか。まだの段階は入っていません。 */
  reachedAt: Partial<Record<Stage, Date>>;
  piecesDone: number;
  totalPieces: number;
  /** 0〜1。ゲージの幅に使います。 */
  progress: number;
  /** お届け完了かどうか。終わったものは一覧の下へ下がります。 */
  finished: boolean;
  /** 次の一手。null ならもう押すものがありません。 */
  nextAction: { label: string; appends: EventType } | null;
  lastEventAt: Date | null;
};

export function deriveOrder(order: OrderInput, events: readonly OrderEvent[]): DerivedOrder {
  const reachedAt: Partial<Record<Stage, Date>> = {};
  let piecesDone = 0;
  let lastEventAt: Date | null = null;

  for (const event of events) {
    if (lastEventAt === null || event.occurredAt > lastEventAt) lastEventAt = event.occurredAt;

    if (event.type === 'piece_done') {
      piecesDone += 1;
      continue;
    }
    // 同じ段階が2回記録されていたら、最初に入った日を採ります。
    const existing = reachedAt[event.type];
    if (existing === undefined || event.occurredAt < existing) {
      reachedAt[event.type] = event.occurredAt;
    }
  }

  // 記録がまったく無い注文は「お問い合わせ」から始まったものとして扱います。
  // 空の状態を持たないので、画面が「まだ何もありません」を出す必要がありません。
  let stage: Stage = 'inquiry';
  for (const candidate of STAGES) {
    if (reachedAt[candidate] !== undefined) stage = candidate;
  }

  const totalPieces = Math.max(1, order.totalPieces);
  const capped = Math.min(piecesDone, totalPieces);

  return {
    stage,
    reachedAt,
    piecesDone: capped,
    totalPieces,
    progress: capped / totalPieces,
    finished: stage === 'delivered',
    nextAction: NEXT_ACTION[stage],
    lastEventAt,
  };
}

/**
 * ボタン1回で足す記録を組み立てます。
 *
 * 1回押しただけで複数の記録が付くことがあります。設計ルール「押すだけで進む」のためです。
 * 例：8個目の「1個できた」を押したら、そのまま「完成」にも入ります。
 *     完成させたことを別途もう一度押させません。
 */
export function eventsForPress(
  current: DerivedOrder,
  appends: EventType,
): EventType[] {
  if (appends !== 'piece_done') return [appends];

  const next: EventType[] = [];
  // 打ち合わせの途中で作り始めた場合も、押した時点で「制作中」に入れます。
  if (stageIndex(current.stage) < stageIndex('making')) next.push('making');
  next.push('piece_done');
  if (current.piecesDone + 1 >= current.totalPieces) next.push('completed');
  return next;
}

/**
 * 一覧の並び順。
 *
 * 段階の早いものが上、お届け完了は下です（設計ルール「進行中が上、終わったものは下」）。
 * 同じ段階なら、待っている時間が長いものを上にします。
 *
 * 経過日数は表示しません。放置されているものは「◯日経過」と書く代わりに、
 * 上にあり続けることで分かるようにしています（設計ルール「責めない」）。
 * 新しい順に並べると、逆に古いものが下に埋もれます。
 */
export function compareForList(
  a: { derived: DerivedOrder },
  b: { derived: DerivedOrder },
): number {
  const byStage = stageIndex(a.derived.stage) - stageIndex(b.derived.stage);
  if (byStage !== 0) return byStage;

  const at = a.derived.reachedAt[a.derived.stage]?.getTime() ?? 0;
  const bt = b.derived.reachedAt[b.derived.stage]?.getTime() ?? 0;
  return at - bt;
}
