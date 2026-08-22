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
      return {
        raw: e,
        d: d,
        md: (d.getMonth() + 1) + "/" + d.getDate(),
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
          "date-full": next.md + "（" + next.wd + "）",
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

  /* ---------- 起動 ---------- */
  function boot() {
    var root = document.getElementById("tochibi-oc-wireframe") || document.body;
    fillSlots(root);
    renderList(root);
    renderJsonLd();
    initFilter(root);
    initStickyCta(root);
    initFaq(root);
    root.setAttribute("data-oc-ready", "true");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
