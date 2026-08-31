/** 日付は日本時間で出します。時刻は出しません。 */
const formatter = new Intl.DateTimeFormat('ja-JP', {
  timeZone: 'Asia/Tokyo',
  month: 'long',
  day: 'numeric',
});

export const japaneseDate = (date: Date) => formatter.format(date);
