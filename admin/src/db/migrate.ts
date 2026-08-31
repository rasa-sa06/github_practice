/**
 * テーブルを作る／更新する。
 *
 *   npm run db:migrate
 *
 * スキーマを変えたら、先に `npx drizzle-kit generate` でSQLを作ってから実行します。
 */

import path from 'node:path';

import { migrate as migratePglite } from 'drizzle-orm/pglite/migrator';

import { db } from './index.ts';

const MIGRATIONS = path.join(process.cwd(), 'src', 'db', 'migrations');
const client = await db;

if (process.env.DATABASE_URL) {
  const { migrate } = await import('drizzle-orm/neon-http/migrator');
  await migrate(client as never, { migrationsFolder: MIGRATIONS });
} else {
  await migratePglite(client as never, { migrationsFolder: MIGRATIONS });
}

console.log('テーブルを最新にしました。');
process.exit(0);
