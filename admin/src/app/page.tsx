import { redirect } from 'next/navigation';

export default function Home() {
  // ①きょう はまだ作っていないので、いまは注文の一覧から始まります。
  redirect('/orders');
}
