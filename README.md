# 栃木県美容専門学校 オープンキャンパス特設サイト

栃木県美容専門学校（栃美）のオープンキャンパス特設サイトです。ビルド工程のない静的 HTML/CSS/JS で構成し、Vercel でホスティングしています。

- 本番（検証）URL: https://tochibi-oc-vercel.vercel.app
- 公式サイト: https://tochibi.ac.jp/

> **注意:** 現在は検証用サイトのため、`robots.txt` で検索エンジンのクロールを停止しています。一般公開する際は `robots.txt` の `Disallow: /` を `Allow: /` に変更してください。

## ディレクトリ構成

```
.
├── index.html          # トップ（LP本体。CSS/JS をインライン内包）
├── opencampus.html     # オープンキャンパス
├── curriculum.html     # カリキュラム
├── shikaku.html        # 資格・就職
├── campuslife.html     # キャンパスライフ
├── admissions.html     # 入学案内・学費支援
├── topics.html         # トピックス
├── contact.html        # お問い合わせ
├── subpage.css         # 下層ページ共通スタイル（index.html は使用しない）
├── assets/tochibi/     # 画像アセット
├── favicon.png         # ファビコン（32x32）
├── apple-touch-icon.png
├── robots.txt
├── sitemap.xml
└── vercel.json         # cleanUrls / trailingSlash 設定
```

## ローカルで確認する

```bash
npm run dev
```

`npx serve` で `http://localhost:3000` に配信します。`serve` は拡張子なし URL を `.html` にフォールバックするため、Vercel の `cleanUrls: true` と同じ挙動（`/opencampus` → `opencampus.html`）で確認できます。

## 実装メモ

- **URL**: `vercel.json` の `cleanUrls: true` / `trailingSlash: false` により、リンクはすべて拡張子なしの絶対パス（例: `/opencampus`）で記述します。
- **アセット参照**: すべて絶対パス `/assets/tochibi/...` に統一しています。相対パスは使いません。
- **画像形式**: 写真・背景画像は WebP、ロゴとアイコンは透過 PNG。OGP 画像のみ `assets/tochibi/ogp.jpg`（1200x630）です。
- **index.html**: CSS と JS を `<style>` / `<script>` でインラインに持つ単一ファイル構成です。スタイルは `#tochibi-oc-wireframe` 配下にスコープされています。
- **下層ページ**: `subpage.css` を共有し、ヘッダー・ナビゲーションのマークアップを各ファイルに複製しています。ナビを変更する場合は 7 ファイルすべてを更新してください。

## デプロイ

`main` への push で Vercel が自動デプロイします（Vercel プロジェクト: `tochibi-oc-vercel`）。

```bash
git add -A
git commit -m "変更内容"
git push origin main
```
