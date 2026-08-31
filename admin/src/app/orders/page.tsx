import Link from 'next/link';

import { listOrders } from '../../db/queries.ts';
import { assertNotDeployedWithoutAuth } from '../../lib/guard.ts';
import { STAGE_LABEL, STAGE_TONE } from '../../domain/stages.ts';

export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
  assertNotDeployedWithoutAuth();
  const orders = await listOrders();

  return (
    <div className="app">
      <header className="app-bar">
        <span className="mark">注文</span>
      </header>

      <main className="screen">
        <div className="greet">
          <h2>注文</h2>
          <p>いま進行中のものが上に出ます。</p>
        </div>

        <div className="quiet">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className={`row${order.derived.finished ? ' closed' : ''}`}
            >
              <span className="who">{order.customerName}</span>
              <span className="what">
                {order.title}
                {order.detail ? `／${order.detail}` : ''}
              </span>
              <span className="meta">
                <span className={`pill ${STAGE_TONE[order.derived.stage]}`}>
                  {STAGE_LABEL[order.derived.stage]}
                </span>
                {order.derived.stage === 'making' && order.derived.totalPieces > 1
                  ? `${order.derived.piecesDone} / ${order.derived.totalPieces} 個`
                  : null}
              </span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
