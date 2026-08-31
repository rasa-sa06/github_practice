/**
 * 提案書で依頼者と合意済みの6段階と、その色。
 *
 * 色は3つしか使いません（設計ルール「色は3色」）。
 * 赤・警告色は定義していません。増やせないよう、ここが唯一の定義です。
 */

export const STAGES = [
  'inquiry',
  'meeting',
  'making',
  'completed',
  'shipped',
  'delivered',
] as const;

export type Stage = (typeof STAGES)[number];

export const STAGE_LABEL: Record<Stage, string> = {
  inquiry: 'お問い合わせ',
  meeting: '打ち合わせ',
  making: '制作中',
  completed: '完成',
  shipped: '発送',
  delivered: 'お届け完了',
};

/**
 * ピンク＝相手の番（お客様とのやりとりが要る段階）
 * 琥珀＝自分の作業中
 * 緑＝完了
 * それに加えて、お届け完了だけは薄いグレー。終わったものは下へ下がり、色も引きます。
 */
export type Tone = 'waiting' | 'mine' | 'done' | 'closed';

export const STAGE_TONE: Record<Stage, Tone> = {
  inquiry: 'waiting',
  meeting: 'waiting',
  making: 'mine',
  completed: 'done',
  shipped: 'done',
  delivered: 'closed',
};

export const stageIndex = (stage: Stage): number => STAGES.indexOf(stage);

/** 「1個できた」は段階ではなく、段階の中で積み上がる記録です。 */
export const EVENT_TYPES = [...STAGES, 'piece_done'] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const isStage = (type: EventType): type is Stage =>
  (STAGES as readonly string[]).includes(type);

/**
 * その段階でとれる「次の一手」。常にちょうど1つです（設計ルール「一手だけ」）。
 * お届け完了だけは null＝もう押すものがありません。
 *
 * どれも数値入力や日付選択を伴いません（設計ルール「押すだけで進む」）。
 */
export const NEXT_ACTION: Record<Stage, { label: string; appends: EventType } | null> = {
  inquiry: { label: '打ち合わせをはじめる', appends: 'meeting' },
  meeting: { label: '制作をはじめる', appends: 'making' },
  making: { label: '1個できた', appends: 'piece_done' },
  completed: { label: '発送した', appends: 'shipped' },
  shipped: { label: 'お届け完了にする', appends: 'delivered' },
  delivered: null,
};
