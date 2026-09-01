import { TabBar } from '../../components/TabBar.tsx';
import { listOrders } from '../../db/queries.ts';
import { buildRecord, describeWeek, GROUP_ORDER_PIECES } from '../../domain/record.ts';
import { assertNotDeployedWithoutAuth } from '../../lib/guard.ts';

export const dynamic = 'force-dynamic';

export default async function RecordPage() {
  assertNotDeployedWithoutAuth();

  const orders = await listOrders();
  const summary = buildRecord(
    {
      events: orders.flatMap((order) => order.events),
      totalOrders: orders.length,
      hasGroupOrder: orders.some((order) => order.totalPieces >= GROUP_ORDER_PIECES),
    },
    new Date(),
  );

  const week = describeWeek(summary.thisWeek);

  return (
    <div className="app">
      <header className="app-bar">
        <span className="mark">きろく</span>
      </header>

      <main className="screen">
        <div className="greet">
          <h2>きろく</h2>
          <p>{summary.empty ? 'ここに積み上がっていきます。' : 'これまで積み上げてきたもの。'}</p>
        </div>

        <div className={summary.empty ? 'tally fresh' : 'tally'}>
          <div>
            <b>{summary.monthlyPieces}</b>
            <span>今月つくったリボン</span>
          </div>
          <div>
            <b>{summary.monthlyDelivered}</b>
            <span>今月お届けした注文</span>
          </div>
          <div>
            <b>{summary.totalOrders}</b>
            <span>これまでの注文</span>
          </div>
          <div>
            <b>{summary.activeDays}</b>
            <span>続いている日数</span>
          </div>
        </div>

        <section className="card">
          <h3>あつめたもの</h3>
          <div className="badges">
            {summary.badges.map((badge) => (
              <span key={badge.label} className={badge.got ? 'badge' : 'badge locked'}>
                {badge.label}
              </span>
            ))}
          </div>
          {/* 薄いものは「まだ」であって、遅れているという意味ではありません。 */}
          <p className="note">薄いものはこれからです。急ぐ必要はありません。</p>
        </section>

        {week ? (
          <section className="card">
            <h3>今週</h3>
            <p className="brief">{week}</p>
          </section>
        ) : null}
      </main>

      <TabBar current="/record" />
    </div>
  );
}
