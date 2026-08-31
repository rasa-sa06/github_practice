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
 */

import path from 'node:path';

import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import { PGlite } from '@electric-sql/pglite';

import * as schema from './schema.ts';
import { seedIfEmpty } from './seed.ts';

// admin/ から実行される前提です。
const DEV_DATA_DIR = path.join(process.cwd(), '.data');
const MIGRATIONS = path.join(process.cwd(), 'src', 'db', 'migrations');

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

  // 開発用のDBは1つのプロセスからしか書けないので、テーブル作成と見本データの投入も
  // ここで済ませます。別コマンドで同じDBを開くと、お互いの書き込みが見えません。
  const client = drizzlePglite(new PGlite(DEV_DATA_DIR), { schema });
  const { migrate } = await import('drizzle-orm/pglite/migrator');
  await migrate(client, { migrationsFolder: MIGRATIONS });
  await seedIfEmpty(client);
  return client;
}

declare global {
  // eslint-disable-next-line no-var
  var __putieruDb: Promise<Awaited<ReturnType<typeof connect>>> | undefined;
}

// 開発中は毎回の再読み込みで接続が増えないよう、1つを使い回します。
export const db = (globalThis.__putieruDb ??= connect());
