import Link from 'next/link';
import { notFound } from 'next/navigation';

import { advance, undoLast } from './actions.ts';
import { findOrder, undoableBatch } from '../../../db/queries.ts';
import { assertNotDeployedWithoutAuth } from '../../../lib/guard.ts';
import { japaneseDate } from '../../../lib/format.ts';
import { STAGES, STAGE_LABEL, stageIndex } from '../../../domain/stages.ts';

export const dynamic = 'force-dynamic';

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  assertNotDeployedWithoutAuth();

  const { id } = await params;
  const order = await findOrder(id);
  if (!order) notFound();

  const { derived } = order;
  const here = stageIndex(derived.stage);
  const canUndo = (await undoableBatch(id)) !== null;
  const showGauge = derived.stage === 'making' && derived.totalPieces > 1;

  return (
    <div className="app">
      <header className="app-bar">
        <Link className="back" href="/orders">
          ‹ もどる
        </Link>
        <span className="mark">注文</span>
      </header>

      <main className="screen">
        <div className="greet">
          <h2>{order.customerName}</h2>
          <p>
            {order.title}
            {order.detail ? `／${order.detail}` : ''}
          </p>
        </div>

        <section className="card">
          <h3>いまここ</h3>
          <ol className="timeline">
            {STAGES.map((stage, index) => {
              const position = index < here ? 'past' : index === here ? 'now' : 'ahead';
              const reached = derived.reachedAt[stage];
              const when =
                index === here && showGauge
                  ? `${derived.piecesDone} / ${derived.totalPieces} 個できています`
                  : reached
                    ? japaneseDate(reached)
                    : null;

              return (
                <li key={stage} className={position}>
                  <div>
                    <div className="stage-name">{STAGE_LABEL[stage]}</div>
                    {when ? <div className="stage-when">{when}</div> : null}
                  </div>
                </li>
              );
            })}
          </ol>

          {showGauge ? (
            <div
              className="gauge"
              aria-label={`制作の進み具合 ${derived.totalPieces}個中${derived.piecesDone}個`}
            >
              <span style={{ width: `${derived.progress * 100}%` }} />
            </div>
          ) : null}

          {derived.nextAction ? (
            <form
              action={async () => {
                'use server';
                await advance(order.id, derived.nextAction!.appends);
              }}
            >
              <button className="act" type="submit">
                {derived.nextAction.label}
              </button>
            </form>
          ) : (
            <p className="note">お届けまで終わりました。</p>
          )}

          {canUndo ? (
            <form
              action={async () => {
                'use server';
                await undoLast(order.id);
              }}
            >
              <button className="undo" type="submit">
                いまの操作をもどす
              </button>
            </form>
          ) : null}
        </section>

        {order.brief ? (
          <section className="card">
            <h3>お聞きしていること</h3>
            <p className="brief">{order.brief}</p>
            {order.lineChatUrl ? (
              <a className="act ghost" href={order.lineChatUrl}>
                LINEをひらく
              </a>
            ) : null}
          </section>
        ) : null}
      </main>
    </div>
  );
}
