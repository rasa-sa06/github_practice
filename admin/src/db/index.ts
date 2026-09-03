/**
 * データベースへの接続。
 *
 * 開発中は PGlite（アプリに同梱される PostgreSQL）を使い、admin/.data/ に置きます。
 * アカウント登録も、PostgreSQL のインストールも要りません。
 *
 * 本番は DATABASE_URL を見て Neon につなぎます。
 * どちらも PostgreSQL なので、スキーマも書くコードも同じです。
 *
 * 本番のテーブル作成は npm run db:migrate です。開発用だけ、起動時にここで作ります。
 *
 * 置き場所（Vercel／Cloudflare など）は、このファイルの中だけの話に閉じてあります。
 * 呼ぶ側はどちらでも同じコードのままです。
 */

import * as schema from './schema.ts';

async function connect() {
  const url = process.env.DATABASE_URL;

  if (url) {
    const { drizzle } = await import('drizzle-orm/neon-http');
    const { neon } = await import('@neondatabase/serverless');
    return drizzle(neon(url), { schema });
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('本番では DATABASE_URL が必要です。開発用のDBは本番で使えません。');
  }

  return connectDev();
}

/**
 * 開発用のDB。
 *
 * この関数の中身は、すべて動かすときに読み込みます（トップレベルで import しません）。
 * PGlite も node:path も、本番では使えない場所があるためです。
 * 本番のコードに開発用のDBが混ざらないようにしておくと、
 * 置き場所を変えたくなったときに、ここが理由で詰まりません。
 */
async function connectDev() {
  const { default: path } = await import('node:path');
  const { drizzle } = await import('drizzle-orm/pglite');
  const { PGlite } = await import('@electric-sql/pglite');
  const { migrate } = await import('drizzle-orm/pglite/migrator');
  const { seedIfEmpty } = await import('./seed.ts');

  // admin/ から実行される前提です。
  const client = drizzle(new PGlite(path.join(process.cwd(), '.data')), { schema });

  // 開発用のDBは1つのプロセスからしか書けないので、テーブル作成と見本データの投入も
  // ここで済ませます。別コマンドで同じDBを開くと、お互いの書き込みが見えません。
  await migrate(client, { migrationsFolder: path.join(process.cwd(), 'src', 'db', 'migrations') });

  // 始めたばかりの状態（注文が1件も無い画面）を確かめたいときは PUTIERU_SEED=off。
  // 何もない日にこそ、この画面はいちばん多く開かれます。
  if (process.env.PUTIERU_SEED !== 'off') await seedIfEmpty(client);
  return client;
}

declare global {
  // eslint-disable-next-line no-var
  var __putieruDb: Promise<Awaited<ReturnType<typeof connect>>> | undefined;
}

// 開発中は毎回の再読み込みで接続が増えないよう、1つを使い回します。
export const db = (globalThis.__putieruDb ??= connect());
