/**
 * ログインを入れる前に、うっかり公開してしまうことを防ぐための止め金です。
 *
 * この画面にはお客様のお名前と、聞き取った内容が入ります。
 * 認証がまだ無い状態で本番に出ると、URLを知っている人が全部読めます。
 * ログイン（フェーズAの残り）が入るまで、本番では起動しないようにしておきます。
 *
 * ログインを実装したら、この関数は消してください。
 */
export function assertNotDeployedWithoutAuth() {
  if (process.env.NODE_ENV !== 'production') return;
  if (process.env.ALLOW_UNAUTHENTICATED === 'i-understand') return;

  throw new Error(
    'ログインがまだ実装されていません。' +
      'この画面にはお客様の情報が入るため、認証を入れるまで本番では動かしません。',
  );
}
