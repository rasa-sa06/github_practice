import Link from 'next/link';

import { TabBar } from '../components/TabBar.tsx';
import { listOrders } from '../db/queries.ts';
import { buildQuests, buildToday } from '../domain/today.ts';
import { assertNotDeployedWithoutAuth } from '../lib/guard.ts';
import { todaysEventTypes } from '../lib/today-events.ts';

export const dynamic = 'force-dynamic';

export default async function TodayPage() {
  assertNotDeployedWithoutAuth();

  const orders = await listOrders();
  const today = buildToday(orders);
  const quests = buildQuests(todaysEventTypes(orders));

  return (
    <div className="app">
      <header className="app-bar">
        <span className="mark">きょう</span>
      </header>

      <main className="screen">
        <div className="greet">
          <h2>おかえりなさい</h2>
          {/*
            何日ぶりでも同じ書き出しです。空いていた日数は数えません
            （設計ルール「再開できる」「責めない」）。
          */}
          <p>
            {today.count > 0
              ? `きょうやることは ${today.count}つです。上から順にどうぞ。`
              : 'きょう手をつけるものはありません。'}
          </p>
        </div>

        {today.primary ? (
          <div className="primary">
            <span className="label">まずはこれから</span>
            <h3>{today.primary.headline}</h3>
            <p className="detail">{today.primary.detail}</p>
            <Link className="act" href={`/orders/${today.primary.orderId}`}>
              ひらく
            </Link>
          </div>
        ) : (
          /*
            何もない日にこそ、この画面はいちばん多く開かれます。始めたばかりなら
            なおさらです。何も無いことを空白のままにせず、責めないひとことを置きます。
          */
          <div className="primary calm">
            <span className="label">きょうは</span>
            <h3>ゆっくりで大丈夫です</h3>
            <p className="detail">
              新しいご相談が届いたら、ここに出ます。それまでは何もしなくて構いません。
            </p>
          </div>
        )}

        {today.secondary.length > 0 ? (
          <>
            <span className="quiet-head">そのあとで</span>
            <div className="quiet">
              {today.secondary.map((item) => (
                <Link key={item.orderId} href={`/orders/${item.orderId}`} className="row">
                  <span className="who">{item.headline}</span>
                  <span className="what">{item.detail}</span>
                </Link>
              ))}
            </div>
          </>
        ) : null}

        <section className="card">
          <h3>きょうのクエスト</h3>
          <ul className="quest">
            {quests.map((quest) => (
              <li key={quest.label} className={quest.done ? 'got' : ''}>
                <span className="tick">{quest.done ? '✓' : ''}</span>
                <span>{quest.label}</span>
              </li>
            ))}
          </ul>
          <p className="note">ふだんの仕事を進めるだけで、ひとりでに埋まります。</p>
        </section>
      </main>

      <TabBar current="/" />
    </div>
  );
}
