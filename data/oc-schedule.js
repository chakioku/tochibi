/* =============================================================
   栃木県美容専門学校 — オープンキャンパス日程 単一データソース
   -------------------------------------------------------------
   ここが日程の唯一の情報源です。サイト内のどのページも
   この配列を読んで表示します。日程を変えるときはこのファイルだけ
   を直してください（ヒーロー・日程一覧・CTA・構造化データに自動反映）。

   内容は公式サイトの「OPEN CAMPUS 2026」日程表
   （https://tochibi.ac.jp/opencampus/ の img_opcamp.png）に準拠しています。
   受付は9:30から、プログラムは10:00〜12:00頃です。

   STEP4（WordPress化）では、このファイルを
   カスタム投稿タイプ「oc_schedule」に置き換え、
   同じ形の JSON を wp_localize_script() で出力すれば
   assets/js/oc.js はそのまま使えます。

   date        … YYYY-MM-DD（曜日は自動計算するので書かない）
   type        … 体験入学 / スペシャルイベント
   title       … カード見出し（その回の体験内容）
   start / end … "HH:MM"（プログラムの開始・終了。受付は reception）
   tags        … TOPの#タグ絞り込み用
   reserveUrl  … 回ごとに予約先が違う場合のみ指定。null なら reserveUrl 既定値
   status      … open / few（残席わずか）/ full（満席）/ closed（受付終了）
   note        … カードに出す補足。空でよい
   ============================================================= */
window.TOCHIBI_OC = {
  updated: "2026-08-22",
  reserveUrl: "https://r-shingaku.com/ce/form/3522/input",
  requestUrl: "https://r-shingaku.com/ce/form/3028/input",
  contactUrl: "https://tochibi.ac.jp/contact/",
  reception: "9:30",
  venue: {
    name: "栃木県美容専門学校",
    postalCode: "321-0945",
    address: "栃木県宇都宮市宿郷2-10-11",
    tel: "028-651-5210"
  },
  events: [
    {
      date: "2026-08-23", type: "体験入学", title: "入試対策講座 ヘアカラー",
      start: "10:00", end: "12:00",
      tags: ["open-campus", "tochibi", "hair", "parent"],
      reserveUrl: null, status: "open",
      note: "ムラなく綺麗にカラークリームを塗ってみよう。AO入試をご検討の方を対象とした講座です"
    },
    {
      date: "2026-09-12", type: "体験入学", title: "ネイル・ワインディング",
      start: "10:00", end: "12:00",
      tags: ["open-campus", "tochibi", "nail", "hair"],
      reserveUrl: null, status: "open",
      note: "ハンドマッサージで潤いリラックス体験"
    },
    {
      date: "2026-10-18", type: "体験入学", title: "傷メイク",
      start: "10:00", end: "12:00",
      tags: ["open-campus", "tochibi", "makeup"],
      reserveUrl: null, status: "open",
      note: "リアルな傷をメイクでどのくらい作れるかチャレンジ"
    },
    {
      date: "2026-12-13", type: "体験入学", title: "クリスマス レジン",
      start: "10:00", end: "12:00",
      tags: ["open-campus", "tochibi", "nail"],
      reserveUrl: null, status: "open",
      note: "レジンでアクセサリーを作ってクリスマスを楽しもう"
    },
    {
      date: "2027-01-23", type: "体験入学", title: "ヘアエクステ&カット・ヘアアレンジ",
      start: "10:00", end: "12:00",
      tags: ["open-campus", "tochibi", "hair"],
      reserveUrl: null, status: "open",
      note: "ヘアエクステとカットを体験してみよう"
    },
    {
      date: "2027-03-06", type: "スペシャルイベント", title: "カトリーナメイク講座",
      start: "10:00", end: "12:00",
      tags: ["open-campus", "makeup"],
      reserveUrl: null, status: "open",
      note: "メキシコ伝統文化のカトリーナメイクに挑戦してみよう。奨学金説明会も同時開催します"
    }
  ]
};
