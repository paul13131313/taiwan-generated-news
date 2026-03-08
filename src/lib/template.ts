import type {
  TaiwanNewsData,
  GlossaryItem,
  Article,
  BuzzItem,
} from "./types";

// ===== CSS — 台湾トレンド新聞風（バラエティあるレイアウト） =====

const CSS = `
:root {
  --accent: #e85d3a;
  --accent-light: #fff4f1;
  --black: #1a1a1a;
  --gray: #666666;
  --gray-light: #999999;
  --bg: #fafafa;
  --white: #ffffff;
  --line: #e0e0e0;
  --jp: 'Noto Sans JP', sans-serif;
  --en: 'Inter', 'Lato', sans-serif;
  --mono: 'Montserrat', sans-serif;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  background: #f0f0f0; color: var(--black); font-family: var(--jp);
  font-size: 17px; line-height: 1.9; letter-spacing: 0.02em;
  -webkit-font-smoothing: antialiased;
}
.newspaper { max-width: 680px; margin: 0 auto; background: var(--white); }

/* ===== Header ===== */
.header { padding: 44px 28px 20px; text-align: center; }
.header-title { font-size: 2.4rem; font-weight: 900; letter-spacing: 0.14em; color: var(--black); line-height: 1.3; }
.header-sub { margin-top: 6px; font-family: var(--mono); font-size: 0.7rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: var(--accent); }
.header-issue { display: flex; justify-content: center; gap: 16px; margin-top: 18px; font-size: 0.75rem; color: var(--gray); }
.header-market { display: flex; justify-content: center; gap: 40px; margin-top: 14px; }
.header-market .market-card { text-align: center; }
.header-market .market-label { font-family: var(--mono); font-size: 0.55rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--gray-light); }
.header-market .market-value { font-family: var(--mono); font-size: 0.85rem; font-weight: 700; color: var(--gray); margin-top: 3px; letter-spacing: 0.02em; }

/* Content */
.content { padding: 0 28px; }

/* ===== Section Header ===== */
.sec-header { margin: 48px 0 16px; padding-bottom: 10px; border-bottom: 2px solid var(--black); }
.sec-header .sec-en { font-family: var(--mono); font-size: 0.6rem; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: var(--accent); }
.sec-header .sec-jp { font-size: 1.1rem; font-weight: 900; margin-top: 2px; }

/* ===== Hero — 今日のトレンド（大サイズ・新聞トップ風） ===== */
.hero { margin-top: 24px; }
.hero-img { width: 100%; overflow: hidden; margin-bottom: 20px; position: relative; }
.hero-img img { width: 100%; aspect-ratio: 16 / 9; object-fit: cover; display: block; }
.hero-img .hero-fallback { width: 100%; aspect-ratio: 16 / 9; background: linear-gradient(135deg, #ff9a76, #e85d3a); display: flex; align-items: center; justify-content: center; }
.hero-img .hero-fallback span { font-size: 2rem; color: rgba(255,255,255,0.5); letter-spacing: 0.3em; }
.ai-credit { position: absolute; bottom: 4px; right: 6px; color: rgba(255,255,255,0.7); font-family: 'Courier New', monospace; font-size: 0.5rem; line-height: 1; pointer-events: none; }
.hero h2 { font-size: 1.6rem; font-weight: 900; line-height: 1.45; letter-spacing: -0.01em; border-bottom: 3px double var(--black); padding-bottom: 10px; }
.hero .lead { font-size: 1.05rem; line-height: 1.85; color: #222; margin-top: 12px; font-weight: 700; }
.hero .body { font-size: 0.95rem; line-height: 2; color: #333; margin-top: 10px; }
.hero .hero-meta { display: flex; align-items: center; gap: 12px; margin-top: 14px; padding-top: 10px; border-top: 1px solid var(--line); font-size: 0.75rem; color: var(--gray-light); }
.hero .hero-meta .meta-cat { font-family: var(--mono); font-size: 0.6rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: var(--accent); background: var(--accent-light); padding: 2px 8px; border-radius: 2px; }

/* ===== 2段組グリッド（カフェ＆グルメ / ビューティー＆ブランド） ===== */
.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 0; margin-top: 0; align-items: stretch; }
.two-col .col { padding: 0; display: flex; flex-direction: column; }
.two-col .col:first-child { padding-right: 20px; border-right: 1px solid var(--line); }
.two-col .col:last-child { padding-left: 20px; }
.two-col .col .col-article:last-child { flex: 1; border-bottom: none; }
.two-col .col-header { padding-bottom: 8px; border-bottom: 2px solid var(--black); margin-bottom: 12px; }
.two-col .col-header .sec-en { font-family: var(--mono); font-size: 0.55rem; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; color: var(--accent); }
.two-col .col-header .sec-jp { font-size: 0.95rem; font-weight: 900; margin-top: 1px; }

/* 2段組内の記事（コンパクト） */
.col-article { padding: 12px 0; border-bottom: 1px solid var(--line); }
.col-article:last-child { border-bottom: none; }
.col-article h3 { font-size: 0.95rem; font-weight: 800; line-height: 1.45; }
.col-article .body { font-size: 0.85rem; line-height: 1.75; color: #444; margin-top: 6px; }

/* ===== SNSバズ — タイル風（囲い線なし） ===== */
.buzz-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; margin-top: 8px; }
.buzz-card { padding: 14px 16px; }
.buzz-card:nth-child(odd) { border-right: 1px solid var(--line); }
.buzz-card:nth-child(1), .buzz-card:nth-child(2) { border-bottom: 1px solid var(--line); }
.buzz-card h4 { font-size: 0.88rem; font-weight: 700; line-height: 1.45; color: var(--black); }
.buzz-card h4::before { content: '#'; color: var(--accent); font-family: var(--mono); font-weight: 900; margin-right: 3px; }
.buzz-card p { font-size: 0.78rem; line-height: 1.65; color: #555; margin-top: 4px; }

/* ===== 台湾人が見ている日本 — 引用風デザイン ===== */
.japan-article { padding: 20px 24px; margin-top: 12px; background: #f8f6f4; border-left: 4px solid var(--accent); border-radius: 0 8px 8px 0; }
.japan-article h3 { font-size: 1.05rem; font-weight: 800; line-height: 1.5; }
.japan-article .body { font-size: 0.92rem; line-height: 1.85; color: #444; margin-top: 8px; }

/* ===== 通常記事（フル幅） ===== */
.article { padding: 20px 0; border-bottom: 1px solid var(--line); }
.article:last-child { border-bottom: none; }
.article h3 { font-size: 1.15rem; font-weight: 800; line-height: 1.5; }
.article .body { font-size: 0.95rem; line-height: 1.9; color: #333; margin-top: 8px; }

/* ===== Source Link — via 媒体名 ===== */
.source-via { margin-top: 8px; font-size: 0.72rem; color: var(--gray-light); }
.hero-meta .source-via { margin-top: 0; display: inline; }
.source-via a { color: var(--gray); text-decoration: none; font-weight: 500; }
.source-via a:hover { color: var(--accent); text-decoration: underline; }

/* ===== Glossary ===== */
.glossary-box { margin: 10px 0 4px; padding: 10px 14px; background: var(--accent-light); border-radius: 6px; }
.glossary-box .gl-label { font-family: var(--mono); font-size: 0.55rem; font-weight: 800; letter-spacing: 0.1em; color: var(--accent); margin-bottom: 4px; }
.glossary-box .gl-label::before { content: '📖 '; font-size: 0.65rem; }
.glossary-box dl { margin: 0; }
.glossary-box dt { font-size: 0.78rem; font-weight: 700; color: var(--black); margin-top: 3px; display: inline; }
.glossary-box dt .gl-reading { font-weight: 500; color: var(--gray); font-size: 0.74rem; }
.glossary-box dd { font-size: 0.76rem; color: #555; margin-left: 0; display: inline; }
.glossary-box dd::after { content: ''; display: block; margin-bottom: 2px; }

/* Divider */
.divider { border: none; border-top: 1px solid var(--line); margin: 36px 0; }
.divider-bold { border: none; border-top: 2px solid var(--black); margin: 40px 0; }

/* Disclaimer */
.disclaimer { margin: 40px 0 0; padding: 14px 18px; background: var(--bg); border-radius: 6px; font-size: 0.72rem; line-height: 1.7; color: var(--gray-light); }

/* CTA */
.cta-box { margin: 28px 0; padding: 20px; background: var(--bg); border-radius: 6px; border: 1px solid var(--line); }
.cta-box .cta-tag { font-family: var(--mono); font-size: 0.55rem; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: var(--gray-light); }
.cta-box h3 { font-size: 0.95rem; font-weight: 700; margin-top: 4px; }
.cta-box p { font-size: 0.85rem; line-height: 1.8; color: #555; margin-top: 4px; }
.cta-box a { display: inline-flex; align-items: center; gap: 4px; margin-top: 10px; font-family: var(--mono); font-size: 0.72rem; font-weight: 700; color: var(--accent); text-decoration: none; }
.cta-box a::after { content: ' →'; }

/* Footer */
.footer { padding: 20px 28px; border-top: 3px double var(--black); text-align: center; }
.footer .f-brand { font-family: var(--mono); font-size: 0.65rem; font-weight: 700; letter-spacing: 0.08em; color: var(--gray); }
.footer .f-brand span { color: var(--accent); }
.footer .f-desc { font-size: 0.7rem; color: var(--gray-light); margin-top: 4px; }
.footer .f-links { margin-top: 8px; display: flex; justify-content: center; gap: 14px; }
.footer .f-links a { font-size: 0.65rem; color: var(--gray); text-decoration: none; }
.footer .f-copy { margin-top: 10px; font-family: var(--en); font-size: 0.58rem; color: var(--gray-light); }

/* Responsive */
@media (max-width: 600px) {
  body { background: var(--white); font-size: 16px; }
  .newspaper { box-shadow: none; }
  .header { padding: 28px 20px 24px; }
  .header-title { font-size: 1.8rem; }
  .content { padding: 0 20px; }
  .hero h2 { font-size: 1.3rem; }
  .two-col { grid-template-columns: 1fr; }
  .two-col .col:first-child { padding-right: 0; border-right: none; padding-bottom: 16px; border-bottom: 1px solid var(--line); }
  .two-col .col:last-child { padding-left: 0; padding-top: 16px; }
  .buzz-grid { grid-template-columns: 1fr; }
  .buzz-card:nth-child(odd) { border-right: none; }
  .buzz-card { border-bottom: 1px solid var(--line); }
  .buzz-card:last-child { border-bottom: none; }
}

/* Animation */
@keyframes fi { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
.hero, .sec-header, .article, .col-article, .buzz-card, .japan-article, .glossary-box { animation: fi 0.4s ease both; }
`;

// ===== Utilities =====

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderGlossary(items?: GlossaryItem[]): string {
  if (!items || items.length === 0) return "";
  const entries = items
    .map((g) => {
      const reading = g.reading
        ? ` <span class="gl-reading">（${esc(g.reading)}）</span>`
        : "";
      return `<dt>${esc(g.term)}${reading} …</dt> <dd>${esc(g.explanation)}</dd>`;
    })
    .join("");
  return `
    <div class="glossary-box">
      <div class="gl-label">用語解説</div>
      <dl>${entries}</dl>
    </div>`;
}

function renderViaLink(url?: string, name?: string): string {
  if (!url) return "";
  const label = name || "Source";
  return `<div class="source-via">via <a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a></div>`;
}

function renderSectionHeader(en: string, jp: string): string {
  return `<div class="sec-header"><span class="sec-en">${esc(en)}</span><div class="sec-jp">${esc(jp)}</div></div>`;
}

// フル幅記事（通常サイズ）
function renderArticle(article: Article): string {
  return `
    <div class="article">
      <h3>${esc(article.title)}</h3>
      <div class="body">${esc(article.body)}</div>
      ${renderViaLink(article.sourceUrl, article.sourceName)}
      ${renderGlossary(article.glossary)}
    </div>`;
}

// 2段組み内の記事（コンパクト）
function renderColArticle(article: Article): string {
  return `
    <div class="col-article">
      <h3>${esc(article.title)}</h3>
      <div class="body">${esc(article.body)}</div>
      ${renderViaLink(article.sourceUrl, article.sourceName)}
      ${renderGlossary(article.glossary)}
    </div>`;
}

// SNSバズ カード
function renderBuzzCard(item: BuzzItem): string {
  return `
    <div class="buzz-card">
      <h4>${esc(item.title)}</h4>
      <p>${esc(item.description)}</p>
      ${renderViaLink(item.sourceUrl, item.sourceName)}
    </div>`;
}

// 台湾人が見ている日本 — 引用風
function renderJapanArticle(article: Article): string {
  return `
    <div class="japan-article">
      <h3>${esc(article.title)}</h3>
      <div class="body">${esc(article.body)}</div>
      ${renderViaLink(article.sourceUrl, article.sourceName)}
      ${renderGlossary(article.glossary)}
    </div>`;
}

// ===== Main Template Generator =====

export function generateNewsHTML(data: TaiwanNewsData): string {
  const heroImage = data.heroImageUrl
    ? `<img src="${esc(data.heroImageUrl)}" alt="${esc(data.todayTrend.title)}">`
    : `<div class="hero-fallback"><span>台灣</span></div>`;

  const ogImage = data.heroImageUrl || "";

  // ヘッダーのTAIEX・天気をカード型で表示
  const headerInfo = data.headerInfo;
  const hasMarketInfo = headerInfo?.taiex || headerInfo?.weather;
  const taiexCard = headerInfo?.taiex
    ? `<div class="market-card"><div class="market-label">TAIEX</div><div class="market-value">${esc(headerInfo.taiex)}</div></div>`
    : "";
  const weatherCard = headerInfo?.weather
    ? `<div class="market-card"><div class="market-label">台北</div><div class="market-value">${esc(headerInfo.weather)}</div></div>`
    : "";

  // 空コーナーは非表示
  const hasCafe = data.cafeGourmet.articles.length > 0;
  const hasBeauty = data.beautyBrand.articles.length > 0;
  const hasBuzz = data.snsBuzz.items.length > 0;
  const hasJapan = data.taiwanLooksAtJapan.articles.length > 0;

  // カフェ＆ビューティーを2段組で並べる（両方ある場合）
  const hasTwoCol = hasCafe && hasBeauty;

  const twoColSection = hasTwoCol ? `
<hr class="divider-bold">
<div class="two-col">
  <div class="col">
    <div class="col-header"><span class="sec-en">Cafe &amp; Gourmet</span><div class="sec-jp">カフェ＆グルメ</div></div>
    ${data.cafeGourmet.articles.map((a) => renderColArticle(a)).join("")}
  </div>
  <div class="col">
    <div class="col-header"><span class="sec-en">Beauty &amp; Brand</span><div class="sec-jp">ビューティー＆ブランド</div></div>
    ${data.beautyBrand.articles.map((a) => renderColArticle(a)).join("")}
  </div>
</div>` : "";

  // 片方だけの場合はフル幅で表示
  const cafeOnlySection = !hasTwoCol && hasCafe ? `
<hr class="divider-bold">
${renderSectionHeader("Cafe & Gourmet", "カフェ＆グルメ")}
${data.cafeGourmet.articles.map((a) => renderArticle(a)).join("")}` : "";

  const beautyOnlySection = !hasTwoCol && hasBeauty ? `
<hr class="divider-bold">
${renderSectionHeader("Beauty & Brand", "ビューティー＆ブランド")}
${data.beautyBrand.articles.map((a) => renderArticle(a)).join("")}` : "";

  const buzzSection = hasBuzz ? `
<hr class="divider-bold">
${renderSectionHeader("SNS Buzz", "SNSバズ")}
<div class="buzz-grid">
${data.snsBuzz.items.map((item) => renderBuzzCard(item)).join("")}
</div>
${renderGlossary(data.snsBuzz.glossary)}` : "";

  const japanSection = hasJapan ? `
<hr class="divider">
${renderSectionHeader("Taiwan Looks at Japan", "台湾人が見ている日本")}
${data.taiwanLooksAtJapan.articles.map((a) => renderJapanArticle(a)).join("")}` : "";

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>台灣生成新聞 ${data.issueNumber} — ${data.date}</title>
<meta name="description" content="${esc(data.todayTrend.title)} — 台湾トレンドを日本人向けにキュレーション。">
<meta property="og:title" content="台灣生成新聞 ${data.issueNumber}">
<meta property="og:description" content="${esc(data.todayTrend.title)}">
<meta property="og:type" content="article">
${ogImage ? `<meta property="og:image" content="${esc(ogImage)}">` : ""}
<meta name="twitter:card" content="summary_large_image">
${ogImage ? `<meta name="twitter:image" content="${esc(ogImage)}">` : ""}
<link rel="icon" type="image/png" href="/favicon.png">
<link rel="apple-touch-icon" href="/icon-180.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&family=Montserrat:wght@600;700;800;900&family=Noto+Sans+JP:wght@400;500;700;800;900&display=swap" rel="stylesheet">
<style>${CSS}</style>
</head>
<body>
<div class="newspaper">

<header class="header">
  <h1 class="header-title">台灣生成新聞</h1>
  <div class="header-sub">Taiwan Trend Curation</div>
  <div class="header-issue">
    <span>${esc(data.issueNumber)}</span>
    <span>${esc(data.date)}</span>
  </div>
  ${hasMarketInfo ? `<div class="header-market">${taiexCard}${weatherCard}</div>` : ""}
</header>

<main class="content">

<!-- ① 今日のトレンド（大サイズ・新聞トップ風） -->
${renderSectionHeader("Today's Trend", "今日のトレンド")}

<article class="hero">
  <div class="hero-img">
    ${heroImage}
    <span class="ai-credit">Image: AI generated</span>
  </div>
  <h2>${esc(data.todayTrend.title)}</h2>
  <div class="lead">${esc(data.todayTrend.lead)}</div>
  <div class="body">${esc(data.todayTrend.body)}</div>
  <div class="hero-meta">
    <span class="meta-cat">TOP STORY</span>
    ${renderViaLink(data.todayTrend.sourceUrl, data.todayTrend.sourceName)}
  </div>
  ${renderGlossary(data.todayTrend.glossary)}
</article>

<!-- ②③ カフェ＆グルメ / ビューティー＆ブランド（2段組） -->
${twoColSection}
${cafeOnlySection}
${beautyOnlySection}

<!-- ④ SNSバズ（グリッドカード） -->
${buzzSection}

<!-- ⑤ 台湾人が見ている日本（引用風） -->
${japanSection}

<div class="disclaimer">
  本サイトは各報道機関・メディアの公開記事を参考に、AIがキュレーション・要約したものです。正確性については原典をご確認ください。記事の著作権は各報道機関に帰属します。
</div>

<div class="cta-box">
  <div class="cta-tag">PR</div>
  <h3>台湾進出・越境ビジネスのご相談</h3>
  <p>台湾の市場調査からブランド設計、クリエイティブ制作、実行支援まで一貫して伴走します。</p>
  <a href="https://wewewetw.jp/">想像以上有限公司（We TAIWAN）</a>
</div>

</main>

<footer class="footer">
  <div class="f-brand"><span>台灣生成新聞</span></div>
  <p class="f-desc">台湾トレンドをAIがキュレーション</p>
  <div class="f-links">
    <a href="/latest">最新号</a>
  </div>
  <p class="f-copy">運営: <a href="https://wewewetw.jp/" style="color: var(--gray-light); text-decoration: none;">想像以上有限公司</a> &nbsp;|&nbsp; 各記事の著作権は原著作者に帰属します</p>
</footer>

</div>
</body>
</html>`;
}
