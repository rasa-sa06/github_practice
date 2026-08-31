import type { NextConfig } from 'next';

export default {
  typedRoutes: false,
  // AGENTS.md / CLAUDE.md の自動生成は切ります。この規模では説明が増えるだけです。
  agentRules: false,
  // 開発用のPostgreSQL(PGlite)はファイルを直接さわるので、バンドルさせず
  // Node からそのまま読ませます。バンドルすると fs の呼び出しが壊れます。
  serverExternalPackages: ['@electric-sql/pglite'],
} satisfies NextConfig;
