/* =============================================================
   栃木県美容専門学校 — OC日程レンダラー / UI
   data/oc-schedule.js を唯一の情報源として、ページ内の
   日付・時間・CTA・日程一覧・構造化データを組み立てます。

   HTML側は data 属性で「差し込み口」を宣言するだけです。
     data-oc="date-md"    → 8/23
     data-oc="date-full"  → 8/23（日）
     data-oc="date-long"  → 2026年8月23日（日）
     data-oc="title"      → オープンキャンパス
     data-oc="time"       → 10:00〜12:00
     data-oc="status"     → 予約受付中 など
     data-oc-tpl="{date} のOCを予約する"  → 文字列テンプレート
     data-oc-href="reserve" | "request" | "contact"
     data-oc-list         → 日程カードの描画先
     data-oc-count        → 今後の開催回数
   ============================================================= */
(function () {
  "use strict";

  var WD = ["日", "月", "火", "水", "木", "金", "土"];
  var STATUS = {
    open:   { label: "予約受付中",   cls: "is-open",   bookable: true  },
    few:    { label: "残席わずか",   cls: "is-few",    bookable: true  },
    full:   { label: "満員御礼",     cls: "is-full",   bookable: false },
    closed: { label: "受付終了",     cls: "is-closed", bookable: false }
  };

  var data = window.TOCHIBI_OC;
  if (!data || !Array.isArray(data.events)) return;

  var today = new Date();
  today.setHours(0, 0, 0, 0);

  var events = data.events
    .map(function (e) {
      var d = new Date(e.date + "T00:00:00");
      /* 年をまたぐ回（例: 9月時点で見る翌年1/23）は「2027年」を添えて誤解を防ぐ。
         同じ年の回には付けない。 */
      var crossYear = d.getFullYear() !== today.getFullYear();
      return {
        raw: e,
        d: d,
        md: (d.getMonth() + 1) + "/" + d.getDate(),
        yr: d.getFullYear(),
        crossYear: crossYear,
        wd: WD[d.getDay()],
        iso: e.date,
        status: STATUS[e.status] || STATUS.open
      };
    })
    .sort(function (a, b) { return a.d - b.d; });

  var upcoming = events.filter(function (e) { return e.d >= today; });
  var next = upcoming[0] || null;

  /* ---------- 1. 差し込み口を埋める ---------- */
  function fillSlots(root) {
    var values = next
      ? {
          "date-md":   next.md,
          "date-full": (next.crossYear ? next.yr + "年" : "") +
                       next.md + "（" + next.wd + "）",
          "date-long": next.d.getFullYear() + "年" + (next.d.getMonth() + 1) + "月" +
                       next.d.getDate() + "日（" + next.wd + "）",
          "title":     next.raw.title,
          "type":      next.raw.type,
          "time":      next.raw.start + "〜" + next.raw.end,
          "note":      next.raw.note || "",
          "status":    next.status.label
        }
      : {
          "date-md": "", "date-full": "", "date-long": "",
          "title": "オープンキャンパス", "type": "", "time": "",
          "note": "", "status": "次回日程は準備中です"
        };

    root.querySelectorAll("[data-oc]").forEach(function (el) {
      var key = el.getAttribute("data-oc");
      if (key in values) el.textContent = values[key];
    });

    root.querySelectorAll("[data-oc-tpl]").forEach(function (el) {
      var tpl = el.getAttribute("data-oc-tpl");
      el.textContent = next
        ? tpl.replace("{date}", next.md).replace("{time}", next.raw.start + "〜" + next.raw.end)
        : "オープンキャンパスを予約する";
    });

    var hrefs = {
      reserve: (next && next.raw.reserveUrl) || data.reserveUrl,
      request: data.requestUrl,
      contact: data.contactUrl
    };
    root.querySelectorAll("[data-oc-href]").forEach(function (el) {
      var key = el.getAttribute("data-oc-href");
      if (hrefs[key]) el.setAttribute("href", hrefs[key]);
    });

    root.querySelectorAll("[data-oc-count]").forEach(function (el) {
      el.textContent = String(upcoming.length);
    });

    /* 次回が無い場合は予約ボタンを無効化して事故を防ぐ */
    if (!next) {
      root.querySelectorAll('[data-oc-href="reserve"]').forEach(function (el) {
        el.setAttribute("aria-disabled", "true");
        el.classList.add("is-disabled");
      });
    }
  }

  /* ---------- 2. 日程一覧を描画 ---------- */
  function renderList(root) {
    var host = root.querySelector("[data-oc-list]");
    if (!host) return;

    if (!upcoming.length) {
      host.innerHTML =
        '<p class="oc-empty">次回の開催日程は準備中です。決まりしだいこちらでお知らせします。</p>';
      return;
    }

    host.innerHTML = upcoming.map(function (e, i) {
      var st = e.status;
      var url = (e.raw.reserveUrl || data.reserveUrl);
      var tags = (e.raw.tags || []).concat(["all"]).join(" ");
      var btn = st.bookable
        ? '<span class="oc-card-btn">予約する<span aria-hidden="true">→</span></span>'
        : '<span class="oc-card-btn is-off">' + st.label + "</span>";
      var el = st.bookable ? "a" : "div";
      var href = st.bookable ? ' href="' + url + '"' : "";

      return (
        "<" + el + ' class="oc-card ' + st.cls + (i === 0 ? " is-next" : "") + '"' + href +
          ' data-tags="' + tags + '">' +
          (i === 0 ? '<span class="oc-next-flag">NEXT</span>' : "") +
          '<div class="oc-card-date">' +
            (e.crossYear ? '<span class="oc-yr">' + e.yr + "年</span>" : "") +
            '<b>' + e.md + "</b>" +
            '<span class="oc-wd">（' + e.wd + "）</span>" +
          "</div>" +
          '<div class="oc-card-body">' +
            '<span class="oc-card-type">' + e.raw.type + "</span>" +
            "<h3>" + e.raw.title + "</h3>" +
            '<p class="oc-card-time"><svg class="ico" aria-hidden="true"><use href="#i-clock"></use></svg>' +
              e.raw.start + "〜" + e.raw.end + "</p>" +
            (e.raw.note ? "<p class=\"oc-card-note\">" + e.raw.note + "</p>" : "") +
          "</div>" +
          '<div class="oc-card-foot">' +
            '<span class="oc-status ' + st.cls + '">' + st.label + "</span>" +
            btn +
          "</div>" +
        "</" + el + ">"
      );
    }).join("");
  }

  /* ---------- 3. Event 構造化データ ---------- */
  /* NOTE: 静的サイトのためJSで生成しています。
     STEP4のWordPress化では head 内にサーバー側で出力してください。 */
  function renderJsonLd() {
    if (!upcoming.length) return;
    var v = data.venue || {};
    var payload = upcoming.map(function (e) {
      return {
        "@context": "https://schema.org",
        "@type": "Event",
        name: v.name + " " + e.raw.type + "「" + e.raw.title + "」",
        startDate: e.iso + "T" + e.raw.start + ":00+09:00",
        endDate: e.iso + "T" + e.raw.end + ":00+09:00",
        eventStatus: "https://schema.org/EventScheduled",
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        description: e.raw.note || "栃木県美容専門学校のオープンキャンパスです。",
        isAccessibleForFree: true,
        location: {
          "@type": "Place",
          name: v.name,
          address: {
            "@type": "PostalAddress",
            postalCode: v.postalCode,
            addressRegion: "栃木県",
            addressLocality: "宇都宮市",
            streetAddress: v.address,
            addressCountry: "JP"
          }
        },
        organizer: { "@type": "EducationalOrganization", name: v.name, url: "https://tochibi.ac.jp/" },
        offers: {
          "@type": "Offer",
          price: "0", priceCurrency: "JPY",
          availability: e.status.bookable
            ? "https://schema.org/InStock"
            : "https://schema.org/SoldOut",
          url: e.raw.reserveUrl || data.reserveUrl,
          validFrom: data.updated + "T00:00:00+09:00"
        }
      };
    });

    var tag = document.createElement("script");
    tag.type = "application/ld+json";
    tag.textContent = JSON.stringify(payload);
    document.head.appendChild(tag);
  }

  /* ---------- 4. キーワード絞り込み ---------- */
  function initFilter(root) {
    var buttons = [].slice.call(root.querySelectorAll(".keyword .tag[data-filter]"));
    if (!buttons.length) return;
    var status = root.querySelector(".filter-status");
    var labels = {
      all: "すべてのおすすめコンテンツを表示しています。",
      "open-campus": "オープンキャンパス関連のコンテンツを表示しています。",
      tochibi: "栃美の特徴がわかるコンテンツを表示しています。",
      hair: "ヘア体験・カリキュラムに関するコンテンツを表示しています。",
      makeup: "メイク体験にもつながるコンテンツを表示しています。",
      nail: "ネイル体験にもつながるコンテンツを表示しています。",
      parent: "保護者相談に関するコンテンツを表示しています。",
      tuition: "学費支援・入学相談に関するコンテンツを表示しています。"
    };

    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        var filter = button.dataset.filter;
        buttons.forEach(function (b) { b.classList.toggle("is-active", b === button); });

        var targets = [].slice.call(root.querySelectorAll("[data-filter-grid] [data-tags]"));
        targets.forEach(function (card) {
          var tags = (card.dataset.tags || "").split(/\s+/);
          card.classList.toggle("is-hidden", filter !== "all" && tags.indexOf(filter) === -1);
        });

        if (status) status.textContent = labels[filter] || labels.all;
        if (matchMedia("(max-width: 860px)").matches) {
          var grid = root.querySelector("[data-filter-grid]");
          if (grid && grid.scrollIntoView) grid.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });
  }

  /* ---------- 5. スマホ固定フッターCTA ---------- */
  function initStickyCta(root) {
    var bar = root.querySelector("[data-sticky-cta]");
    if (!bar) return;
    var hero = root.querySelector(".hero");
    if (!hero || !("IntersectionObserver" in window)) {
      bar.classList.add("is-shown");
      return;
    }
    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        bar.classList.toggle("is-shown", !entry.isIntersecting);
      });
    }, { rootMargin: "-40% 0px 0px 0px" }).observe(hero);
  }

  /* ---------- 6. FAQ アコーディオン ---------- */
  /* <details>/<summary> を使うのでJSは開閉の排他制御のみ。
     JSが落ちても全項目が読める状態を保ちます。 */
  function initFaq(root) {
    var items = [].slice.call(root.querySelectorAll("[data-faq] details"));
    items.forEach(function (d) {
      d.addEventListener("toggle", function () {
        if (!d.open) return;
        items.forEach(function (other) { if (other !== d) other.open = false; });
      });
    });
  }

  /* ---------- 7. SPメニューの開閉補助 ---------- */
  /* 開閉自体はCSS（チェックボックス）で完結しています。
     ただしCSSだけだとメニュー内のリンクを押しても開いたままになるため、
     リンク押下時とEscキーで閉じる処理だけをJSで補います。
     JSが落ちても開閉そのものは動きます。 */
  function initMenu(root) {
    var check = root.querySelector(".menu-check");
    var menu = root.querySelector(".side-menu");
    if (!check || !menu) return;

    menu.addEventListener("click", function (e) {
      if (e.target && e.target.closest && e.target.closest("a")) check.checked = false;
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && check.checked) {
        check.checked = false;
        check.focus();
      }
    });
  }

  /* ---------- 8. 外部CTAクリックの計測 ---------- */
  /* 予約・資料請求・PDFは外部サイトへ遷移するため、遷移前に dataLayer へ
     cta_click を積む。GTMが未設置でも window.dataLayer に溜まるだけで、
     エラーにはならない。GTM側で「カスタムイベント: cta_click」を
     トリガーにGA4イベントを作成してください。 */
  function initTracking(root) {
    window.dataLayer = window.dataLayer || [];
    root.addEventListener("click", function (ev) {
      var a = ev.target && ev.target.closest && ev.target.closest("a[href]");
      if (!a) return;
      var href = a.getAttribute("href") || "";
      if (href.indexOf("http") !== 0) return;

      var type = a.getAttribute("data-oc-href");
      if (!type) {
        if (href.indexOf("/form/3522/") > -1) type = "reserve";
        else if (href.indexOf("/form/3028/") > -1) type = "request";
        else if (href.slice(-4).toLowerCase() === ".pdf") type = "pdf";
        else type = "outbound";
      }
      window.dataLayer.push({
        event: "cta_click",
        cta_type: type,
        cta_label: (a.textContent || "").replace(/\s+/g, " ").trim().slice(0, 60),
        cta_url: href
      });
    }, true);
  }

  /* ---------- 9. トピックスのカテゴリ絞り込み ---------- */
  /* 記事は静的に書き出してあるため、JSが落ちても全件読める状態を保ちます。 */
  function initTopics(root) {
    var tabs = [].slice.call(root.querySelectorAll("[data-topic-filter]"));
    var list = root.querySelector("[data-topic-list]");
    if (!tabs.length || !list) return;
    var status = root.querySelector(".topic-status");
    var rows = [].slice.call(list.querySelectorAll("[data-topic-cat]"));

    var empty = document.createElement("p");
    empty.className = "topic-empty";
    empty.hidden = true;
    empty.textContent = "このカテゴリのお知らせは、この一覧にはまだありません。公式サイトでご確認ください。";
    list.appendChild(empty);

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        var key = tab.getAttribute("data-topic-filter");
        tabs.forEach(function (t) { t.classList.toggle("is-active", t === tab); });

        var shown = 0;
        rows.forEach(function (row) {
          var hit = key === "all" || row.getAttribute("data-topic-cat") === key;
          row.classList.toggle("is-hidden", !hit);
          if (hit) shown++;
        });
        empty.hidden = shown > 0;

        if (status) {
          status.textContent = key === "all"
            ? "すべてのお知らせを表示しています。"
            : "「" + tab.textContent + "」のお知らせを" + shown + "件表示しています。";
        }
      });
    });
  }

  /* ---------- 10. お問い合わせフォーム ---------- */
  /* 送信先は Google Apps Script のウェブアプリです。
     デプロイして得た /exec のURLを下の GAS_ENDPOINT に貼り付けてください。
     手順は docs/contact-form-setup.md に記載しています。 */
  var GAS_ENDPOINT = "";

  function initContactForm(root) {
    var form = root.querySelector("[data-contact-form]");
    if (!form) return;

    var confirmBox = root.querySelector("[data-form-confirm]");
    var doneBox = root.querySelector("[data-form-done]");
    var reviewList = root.querySelector("[data-form-review]");
    var summary = root.querySelector("[data-form-error]");
    var sendError = root.querySelector("[data-form-send-error]");
    var sendBtn = root.querySelector("[data-form-send]");
    var backBtn = root.querySelector("[data-form-back]");
    var openedAt = Date.now();

    var FIELDS = [
      { name: "name",  label: "氏名",           empty: "氏名をご記入ください。" },
      { name: "kana",  label: "フリガナ",       empty: "フリガナをご記入ください。",
        test: function (v) { return /^[ァ-ヶー\u3000\s]+$/.test(v); },
        bad: "フリガナは全角カタカナでご記入ください。" },
      { name: "email", label: "メールアドレス", empty: "メールアドレスをご記入ください。",
        test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); },
        bad: "メールアドレスの形式をご確認ください。" },
      { name: "body",  label: "お問い合わせ内容", empty: "お問い合わせ内容をご記入ください。" }
    ];

    function fieldEl(name) { return form.elements[name]; }
    function errEl(name) { return root.querySelector("#cf-" + name + "-err"); }

    function setError(name, msg) {
      var el = fieldEl(name), e = errEl(name);
      if (el && el.setAttribute) el.setAttribute("aria-invalid", msg ? "true" : "false");
      if (!e) return;
      e.textContent = msg || "";
      e.hidden = !msg;
    }

    function validate() {
      var bad = [];
      FIELDS.forEach(function (f) {
        var v = (fieldEl(f.name).value || "").trim();
        if (!v) { setError(f.name, f.empty); bad.push(f); return; }
        if (f.test && !f.test(v)) { setError(f.name, f.bad); bad.push(f); return; }
        setError(f.name, "");
      });
      var agree = fieldEl("agree");
      var agreeErr = root.querySelector("#cf-agree-err");
      if (!agree.checked) {
        agreeErr.textContent = "プライバシーポリシーへの同意が必要です。";
        agreeErr.hidden = false;
        bad.push({ name: "agree" });
      } else {
        agreeErr.hidden = true;
      }
      return bad;
    }

    function collect() {
      var g = form.querySelector('input[name="gender"]:checked');
      return {
        name:   fieldEl("name").value.trim(),
        kana:   fieldEl("kana").value.trim(),
        gender: g ? g.value : "未回答",
        email:  fieldEl("email").value.trim(),
        body:   fieldEl("body").value.trim(),
        page:   location.href,
        trap:   fieldEl("address2").value,
        elapsed: Date.now() - openedAt
      };
    }

    /* --- 入力 → 確認 --- */
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var bad = validate();
      if (bad.length) {
        summary.textContent = "ご記入いただけていない項目が" + bad.length + "件あります。内容をご確認ください。";
        summary.hidden = false;
        var first = fieldEl(bad[0].name);
        if (first && first.focus) first.focus();
        return;
      }
      summary.hidden = true;

      var d = collect();
      reviewList.innerHTML = "";
      [["氏名", d.name], ["フリガナ", d.kana], ["性別", d.gender],
       ["メールアドレス", d.email], ["お問い合わせ内容", d.body]].forEach(function (pair) {
        var wrap = document.createElement("div");
        var dt = document.createElement("dt"); dt.textContent = pair[0];
        var dd = document.createElement("dd"); dd.textContent = pair[1];
        wrap.appendChild(dt); wrap.appendChild(dd);
        reviewList.appendChild(wrap);
      });

      form.hidden = true;
      confirmBox.hidden = false;
      sendError.hidden = true;
      confirmBox.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    /* --- 確認 → 入力に戻る --- */
    backBtn.addEventListener("click", function () {
      confirmBox.hidden = true;
      form.hidden = false;
      form.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    /* --- 送信 --- */
    sendBtn.addEventListener("click", function () {
      var d = collect();

      /* スパム対策: 隠しフィールドに入力がある、または開いてから3秒未満は送らない */
      if (d.trap || d.elapsed < 3000) {
        sendError.textContent = "送信できませんでした。お手数ですが、お電話（028-651-5210）でお問い合わせください。";
        sendError.hidden = false;
        return;
      }

      if (!GAS_ENDPOINT) {
        sendError.textContent = "フォームの送信先が未設定です。管理者にお問い合わせください。";
        sendError.hidden = false;
        return;
      }

      sendBtn.disabled = true;
      backBtn.disabled = true;
      sendBtn.textContent = "送信しています…";
      sendError.hidden = true;

      /* Content-Type を text/plain にして CORS のプリフライトを避けます */
      fetch(GAS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          name: d.name, kana: d.kana, gender: d.gender,
          email: d.email, body: d.body, page: d.page
        })
      })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (!res || res.ok !== true) throw new Error((res && res.error) || "unknown");
          confirmBox.hidden = true;
          doneBox.hidden = false;
          doneBox.focus();
          doneBox.scrollIntoView({ behavior: "smooth", block: "start" });
          window.dataLayer = window.dataLayer || [];
          window.dataLayer.push({ event: "cta_click", cta_type: "contact_form", cta_label: "お問い合わせ送信" });
        })
        .catch(function () {
          sendBtn.disabled = false;
          backBtn.disabled = false;
          sendBtn.textContent = "この内容で送信する";
          sendError.textContent = "送信に失敗しました。通信環境をご確認のうえ、もう一度お試しください。解決しない場合は、お電話（028-651-5210）でお問い合わせください。";
          sendError.hidden = false;
        });
    });

    /* 入力し直したらその項目のエラーを消す */
    FIELDS.forEach(function (f) {
      fieldEl(f.name).addEventListener("input", function () { setError(f.name, ""); });
    });
    fieldEl("agree").addEventListener("change", function () {
      root.querySelector("#cf-agree-err").hidden = true;
    });
  }

  /* ---------- 起動 ---------- */
  function boot() {
    var root = document.getElementById("tochibi-oc-wireframe") || document.body;
    fillSlots(root);
    renderList(root);
    renderJsonLd();
    initFilter(root);
    initStickyCta(root);
    initFaq(root);
    initMenu(root);
    initTracking(root);
    initTopics(root);
    initContactForm(root);
    root.setAttribute("data-oc-ready", "true");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
