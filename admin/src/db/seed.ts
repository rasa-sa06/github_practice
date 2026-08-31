/**
 * 開発用の見本データ。デモに出てくる架空のお客様をそのまま入れています。
 * 実在の方ではありません。本番では使いません。
 *
 * 開発用のDB(PGlite)は1つのプロセスからしか書けないので、
 * 別のコマンドではなく、開発サーバーの起動時に中身が空なら入れます。
 * 入れ直したいときは `npm run db:reset` でDBごと消してから起動してください。
 */

import type { PgliteDatabase } from 'drizzle-orm/pglite';

import type { EventType } from '../domain/stages.ts';
import * as schema from './schema.ts';
import { customers, orderEvents, orders } from './schema.ts';

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

type Sample = {
  name: string;
  title: string;
  detail: string;
  totalPieces: number;
  brief?: string;
  events: [EventType, number][];
};

const SAMPLES: Sample[] = [
  {
    name: 'ゆきさん',
    title: '七五三のリボン',
    detail: '赤×金',
    totalPieces: 1,
    brief: '・七五三は11月上旬\n・着物が赤なので、金を差し色に\n・髪は多めとのこと',
    events: [['inquiry', 1]],
  },
  {
    name: 'さおりさん',
    title: '推し活カラーのリボン',
    detail: '紫×白 2個',
    totalPieces: 2,
    brief: '・急ぎではないとのこと\n・紫は濃いめが好み\n・2個とも同じデザインで',
    events: [
      ['inquiry', 6],
      ['meeting', 3],
    ],
  },
  {
    name: 'みなこさん',
    title: '発表会用おそろいリボン',
    detail: '8個／水色',
    totalPieces: 8,
    brief:
      '・発表会は11月18日、その週の頭までに届けば大丈夫\n・衣装が水色なので、あわせた色で\n・お子さん8人ぶん、髪の量はばらばら',
    events: [
      ['inquiry', 29],
      ['meeting', 26],
      ['making', 20],
      ['piece_done', 12],
      ['piece_done', 9],
      ['piece_done', 5],
      ['piece_done', 3],
      ['piece_done', 1],
    ],
  },
  {
    name: 'あやのさん',
    title: '入学式用リボン',
    detail: 'white',
    totalPieces: 1,
    brief: '・宛先はひかえてあります\n・白、光沢は控えめに',
    events: [
      ['inquiry', 40],
      ['meeting', 37],
      ['making', 30],
      ['piece_done', 22],
      ['completed', 22],
    ],
  },
  {
    name: 'けいこさん',
    title: 'ロリータ用ヘッドドレス',
    detail: '黒×生成り',
    totalPieces: 1,
    events: [
      ['inquiry', 70],
      ['meeting', 66],
      ['making', 60],
      ['piece_done', 50],
      ['completed', 50],
      ['shipped', 48],
      ['delivered', 46],
    ],
  },
];

export async function seedIfEmpty(client: PgliteDatabase<typeof schema>) {
  const existing = await client.query.orders.findFirst();
  if (existing) return;

  for (const sample of SAMPLES) {
    const [customer] = await client
      .insert(customers)
      .values({ name: sample.name, lineChatUrl: 'https://line.me/R/' })
      .returning();

    const [order] = await client
      .insert(orders)
      .values({
        customerId: customer.id,
        title: sample.title,
        detail: sample.detail,
        totalPieces: sample.totalPieces,
        brief: sample.brief,
      })
      .returning();

    await client.insert(orderEvents).values(
      sample.events.map(([type, ago]) => ({
        orderId: order.id,
        type,
        occurredAt: daysAgo(ago),
        batchId: crypto.randomUUID(),
      })),
    );
  }

  console.log(`見本データを入れました（注文 ${SAMPLES.length}件・すべて架空です）。`);
}
