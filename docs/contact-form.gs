/**
 * 栃木県美容専門学校 オープンキャンパス特設サイト
 * お問い合わせフォーム 受信スクリプト（Google Apps Script）
 *
 * 役割
 *   1. 送信内容をスプレッドシートに1行ずつ記録する
 *   2. 学校の担当者宛に通知メールを送る
 *   3. 送信者宛に受付内容の控えを自動返信する
 *
 * 設置手順は docs/contact-form-setup.md をご覧ください。
 */

/* ============================================================
   設定：ここだけ書き換えてください
   ============================================================ */

// 通知メールの宛先。複数指定する場合はカンマ区切り。
var NOTIFY_TO = 'info@tochibi.ac.jp';

// 自動返信の差出人として表示される名前
var SENDER_NAME = '栃木県美容専門学校';

// 記録先スプレッドシートのシート名
var SHEET_NAME = 'お問い合わせ';

// このフォームからの送信のみ受け付けるオリジン（末尾のスラッシュなし）
// 本番ドメインが決まったら追加してください。
var ALLOWED_ORIGINS = [
  'https://tochibi-oc-vercel.vercel.app'
];

/* ============================================================
   ここから下は原則そのままで動きます
   ============================================================ */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    // --- 入力チェック（クライアント側をすり抜けた場合の保険） ---
    var name = trim_(data.name);
    var kana = trim_(data.kana);
    var email = trim_(data.email);
    var body = trim_(data.body);
    var gender = trim_(data.gender) || '未回答';
    var page = trim_(data.page);

    if (!name || !kana || !email || !body) {
      return json_({ ok: false, error: 'required' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json_({ ok: false, error: 'email' });
    }
    if (name.length > 100 || kana.length > 100 || email.length > 200 || body.length > 5000) {
      return json_({ ok: false, error: 'toolong' });
    }
    // 送信元ページのチェック（想定外のサイトからの流用を防ぐ）
    if (page && !matchOrigin_(page)) {
      return json_({ ok: false, error: 'origin' });
    }

    var now = new Date();
    var stamp = Utilities.formatDate(now, 'Asia/Tokyo', 'yyyy/MM/dd HH:mm:ss');

    // --- 1. スプレッドシートに記録 ---
    var sheet = getSheet_();
    sheet.appendRow([stamp, name, kana, gender, email, body, page, '未対応']);

    // --- 2. 担当者へ通知 ---
    var adminBody =
      'オープンキャンパス特設サイトのお問い合わせフォームから送信がありました。\n\n' +
      '受信日時：' + stamp + '\n' +
      '氏名：' + name + '\n' +
      'フリガナ：' + kana + '\n' +
      '性別：' + gender + '\n' +
      'メールアドレス：' + email + '\n' +
      '\n--- お問い合わせ内容 ---\n' + body + '\n\n' +
      '送信元ページ：' + page + '\n\n' +
      '記録シート：' + sheet.getParent().getUrl() + '\n';

    MailApp.sendEmail({
      to: NOTIFY_TO,
      subject: '【お問い合わせ】' + name + ' 様',
      body: adminBody,
      replyTo: email,
      name: SENDER_NAME
    });

    // --- 3. 送信者へ自動返信 ---
    var userBody =
      name + ' 様\n\n' +
      'このたびは栃木県美容専門学校へお問い合わせいただき、ありがとうございます。\n' +
      '以下の内容で受け付けいたしました。担当者より順次ご連絡いたします。\n\n' +
      '----------------------------------------\n' +
      '氏名：' + name + '\n' +
      'フリガナ：' + kana + '\n' +
      '性別：' + gender + '\n' +
      'メールアドレス：' + email + '\n' +
      'お問い合わせ内容：\n' + body + '\n' +
      '----------------------------------------\n\n' +
      '※ このメールは自動送信です。ご返信いただいてもお答えできません。\n' +
      '※ 数日たっても返信がない場合は、お手数ですがお電話（028-651-5210）にてお問い合わせください。\n\n' +
      '栃木県美容専門学校\n' +
      '〒321-0945 栃木県宇都宮市宿郷2-10-11\n' +
      'TEL 028-651-5210\n' +
      'https://tochibi.ac.jp/\n';

    MailApp.sendEmail({
      to: email,
      subject: '【栃木県美容専門学校】お問い合わせを受け付けました',
      body: userBody,
      name: SENDER_NAME
    });

    return json_({ ok: true });

  } catch (err) {
    // 失敗しても内容を失わないよう、実行ログに残す
    console.error(err);
    return json_({ ok: false, error: 'server' });
  }
}

function doGet() {
  return json_({ ok: false, error: 'GET is not supported' });
}

/* ---------- 補助 ---------- */

function trim_(v) {
  return (v === null || v === undefined) ? '' : String(v).trim();
}

function matchOrigin_(url) {
  for (var i = 0; i < ALLOWED_ORIGINS.length; i++) {
    if (url.indexOf(ALLOWED_ORIGINS[i]) === 0) return true;
  }
  return false;
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      '受信日時', '氏名', 'フリガナ', '性別', 'メールアドレス',
      'お問い合わせ内容', '送信元ページ', '対応状況'
    ]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, 8).setFontWeight('bold');
    sheet.setColumnWidth(1, 150);
    sheet.setColumnWidth(6, 420);
  }
  return sheet;
}

/**
 * 動作確認用。エディタでこの関数を実行すると、
 * ダミーデータで1件記録し、メールが届くか確認できます。
 */
function testRun() {
  var res = doPost({
    postData: {
      contents: JSON.stringify({
        name: 'テスト 太郎',
        kana: 'テスト タロウ',
        gender: '回答しない',
        email: Session.getActiveUser().getEmail(),
        body: 'これはテスト送信です。',
        page: ALLOWED_ORIGINS[0] + '/contact'
      })
    }
  });
  Logger.log(res.getContent());
}
