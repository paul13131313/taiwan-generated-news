import type {
  TaiwanNewsData,
  HeadlineArticle,
  MetricCard,
  EntryCard,
  ColumnBox,
  CaseStudyBox,
  SourceLink,
} from "./types";

// ===== CSS (extracted from taiwan-news-final.html, with spacing improvements) =====

const CSS = `
:root {
  --accent: #ff4200;
  --black: #060606;
  --gray: #888888;
  --gray-light: #b0b0b0;
  --bg: #f6f6f6;
  --white: #ffffff;
  --line: #eaeaea;
  --line-dark: #d0d0d0;
  --jp: 'Noto Sans JP', sans-serif;
  --serif: 'Noto Serif TC', serif;
  --en: 'Lato', sans-serif;
  --mono: 'Montserrat', sans-serif;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  background: #e2e2e2; color: var(--black); font-family: var(--jp);
  font-size: 16px; line-height: 1.80; letter-spacing: 0.03em;
  -webkit-font-smoothing: antialiased;
}
.newspaper { max-width: 680px; margin: 0 auto; background: var(--white); box-shadow: 0 2px 40px rgba(0,0,0,0.08); }
.accent-bar { height: 3px; background: var(--accent); }
.masthead { padding: 32px 28px 0; text-align: center; }
.masthead-title { font-family: var(--serif); font-weight: 900; font-size: 2rem; letter-spacing: 0.18em; margin-right: -0.18em; color: var(--black); }
.masthead-sub { margin-top: 6px; font-family: var(--mono); font-size: 0.6rem; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: var(--accent); }
.masthead-info { display: flex; justify-content: center; align-items: center; gap: 8px; margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--line); font-family: var(--en); font-size: 0.7rem; color: var(--gray); letter-spacing: 0.03em; }
.masthead-info .dot { width: 3px; height: 3px; border-radius: 50%; background: var(--line-dark); }
.data-row { display: flex; margin: 0 28px; padding: 10px 0; border-bottom: 1px solid var(--line); }
.data-item { flex: 1; text-align: center; border-right: 1px solid var(--line); padding: 0 8px; }
.data-item:last-child { border-right: none; }
.data-item .d-label { font-family: var(--mono); font-size: 0.52rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--gray-light); }
.data-item .d-val { font-family: var(--en); font-size: 0.88rem; font-weight: 900; color: var(--black); }
.data-item .d-delta { font-family: var(--en); font-size: 0.55rem; font-weight: 700; }
.d-delta.up { color: #16a34a; }
.d-delta.dn { color: var(--accent); }
.d-delta.flat { color: var(--gray-light); }
.content { padding: 0 28px; }
.sec { display: flex; align-items: center; gap: 10px; margin: 48px 0 20px; }
.sec .sec-en { font-family: var(--mono); font-size: 0.58rem; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; color: var(--accent); }
.sec .sec-jp { font-size: 0.82rem; font-weight: 700; }
.sec::after { content: ''; flex: 1; height: 1px; background: var(--line); }
.hero { margin-top: 28px; }
.hero-img { position: relative; width: 100%; border-radius: 4px; overflow: hidden; margin-bottom: 18px; }
.hero-img img { width: 100%; aspect-ratio: 16 / 9; object-fit: cover; display: block; }
.hero-img .hero-fallback { width: 100%; aspect-ratio: 16 / 9; background: linear-gradient(135deg, #1a0a00, #2d1500, #060606); display: flex; align-items: center; justify-content: center; }
.hero-img .hero-fallback span { font-family: var(--serif); font-size: 2rem; color: rgba(255,66,0,0.3); letter-spacing: 0.3em; }
.ai-credit { position: absolute; bottom: 4px; right: 6px; color: rgba(255,255,255,0.7); font-family: 'Courier New', monospace; font-size: 0.5rem; line-height: 1; pointer-events: none; }
.hero .tag { font-family: var(--mono); font-size: 0.58rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--accent); }
.hero h1 { font-size: 1.55rem; font-weight: 900; line-height: 1.5; margin-top: 6px; letter-spacing: 0.01em; }
.hero .lead { font-size: 0.9rem; line-height: 1.9; color: #333; margin-top: 12px; }
.hero .meta { font-family: var(--en); font-size: 0.68rem; color: var(--gray-light); margin-top: 10px; }
.source-ref { display: block; font-size: 0.72rem; color: var(--gray); margin-top: 8px; }
.source-ref a { color: var(--gray); text-decoration: none; transition: color 0.2s; }
.source-ref a:hover { color: var(--accent); }
.rule { border: none; border-top: 1px solid var(--line); margin: 32px 0; }
.headlines .hl { padding: 14px 0; border-bottom: 1px solid var(--line); display: flex; gap: 14px; }
.hl .n { font-family: var(--mono); font-size: 0.7rem; font-weight: 800; color: var(--line-dark); margin-top: 3px; flex-shrink: 0; width: 22px; }
.hl .hl-tag { font-family: var(--mono); font-size: 0.5rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--accent); opacity: 0.7; }
.hl h3 { font-size: 0.9rem; font-weight: 700; line-height: 1.55; margin-top: 1px; }
.hl .hl-excerpt { font-size: 0.78rem; line-height: 1.7; color: #666; margin-top: 3px; }
.hl-grid { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1px solid var(--line); }
.hl-grid .hl-col { padding: 16px 0; }
.hl-grid .hl-col:first-child { padding-right: 20px; border-right: 1px solid var(--line); }
.hl-grid .hl-col:last-child { padding-left: 20px; }
.hl-col .hl-tag { font-family: var(--mono); font-size: 0.5rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--accent); opacity: 0.7; }
.hl-col h3 { font-size: 0.88rem; font-weight: 700; line-height: 1.5; margin-top: 3px; }
.hl-col p { font-size: 0.76rem; line-height: 1.7; color: #666; margin-top: 4px; }
.col-box { margin: 28px 0; padding: 20px 22px; background: var(--bg); border-left: 3px solid var(--accent); border-radius: 0 6px 6px 0; }
.col-box .col-label { font-family: var(--mono); font-size: 0.55rem; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; color: var(--accent); }
.col-box h4 { font-size: 0.9rem; font-weight: 700; margin-top: 4px; line-height: 1.5; }
.col-box p { font-size: 0.8rem; line-height: 1.75; color: #555; margin-top: 6px; }
.num-highlight { display: flex; margin: 20px 0; border: 1px solid var(--line); border-radius: 6px; overflow: hidden; }
.num-card { flex: 1; padding: 18px 16px; text-align: center; border-right: 1px solid var(--line); }
.num-card:last-child { border-right: none; }
.num-card .nc-val { font-family: var(--mono); font-size: 1.5rem; font-weight: 900; color: var(--black); line-height: 1; }
.num-card .nc-unit { font-size: 0.7rem; color: #555; margin-top: 6px; line-height: 1.4; font-weight: 500; }
.we-comm { margin: 48px -28px 0; padding: 28px 28px; background: var(--bg); border-top: 1px solid var(--line); }
.we-comm-inline { margin: 32px 0; padding: 22px 24px; background: var(--bg); border-radius: 6px; border: 1px solid var(--line); }
.we-comm .we-tag, .we-comm-inline .we-tag { font-family: var(--mono); font-size: 0.58rem; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; color: var(--gray); opacity: 0.7; }
.we-comm h3, .we-comm-inline h3 { font-size: 1rem; font-weight: 700; line-height: 1.55; margin-top: 6px; }
.we-comm p, .we-comm-inline p { font-size: 0.8rem; line-height: 1.8; color: #555; margin-top: 8px; }
.we-comm .cta, .we-comm-inline .cta { display: inline-flex; align-items: center; gap: 5px; margin-top: 14px; font-family: var(--mono); font-size: 0.68rem; font-weight: 700; color: var(--accent); text-decoration: none; }
.we-comm .cta:hover, .we-comm-inline .cta:hover { opacity: 0.7; }
.we-comm .cta::after, .we-comm-inline .cta::after { content: ' →'; }
.footer { padding: 24px 28px; border-top: 1px solid var(--line); text-align: center; }
.footer .f-brand { font-family: var(--mono); font-size: 0.65rem; font-weight: 700; letter-spacing: 0.08em; color: var(--gray); }
.footer .f-brand span { color: var(--accent); }
.footer .f-desc { font-size: 0.68rem; color: var(--gray-light); margin-top: 4px; }
.footer .f-links { margin-top: 8px; display: flex; justify-content: center; gap: 14px; }
.footer .f-links a { font-size: 0.65rem; color: var(--gray); text-decoration: none; }
.footer .f-links a:hover { color: var(--accent); }
.footer .f-copy { margin-top: 10px; font-family: var(--en); font-size: 0.58rem; color: var(--line-dark); }
.source-link { display: inline-block; font-family: var(--en); font-size: 0.62rem; color: var(--gray); text-decoration: none; margin-top: 4px; transition: color 0.2s; }
.source-link:hover { color: var(--accent); }
.source-link::before { content: '📎 '; font-size: 0.55rem; }
.hl .source-link { margin-top: 2px; }
.case-study { margin: 28px 0; padding: 20px; background: #fff8f6; border: 1px solid #ffe0d6; border-left: 4px solid var(--accent); border-radius: 0 6px 6px 0; }
.case-study .cs-label { font-family: var(--mono); font-size: 0.55rem; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; color: var(--accent); }
.case-study h4 { font-size: 0.9rem; font-weight: 700; margin-top: 4px; line-height: 1.5; }
.case-study p { font-size: 0.8rem; line-height: 1.75; color: #555; margin-top: 6px; }
.case-study .cs-source { font-size: 0.72rem; color: var(--gray); margin-top: 8px; }
.case-study .cs-source a { color: var(--gray); text-decoration: none; }
.case-study .cs-source a:hover { color: var(--accent); }
.entry-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin: 18px 0; }
.entry-card { padding: 16px; background: var(--bg); border-radius: 6px; border: 1px solid var(--line); }
.entry-card .ec-badge { font-family: var(--mono); font-size: 0.5rem; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; padding: 2px 8px; border-radius: 3px; display: inline-block; }
.ec-badge.success { background: #e8f5e9; color: #2e7d32; }
.ec-badge.struggle { background: #fff3e0; color: #e65100; }
.entry-card .ec-brand { font-size: 0.95rem; font-weight: 900; margin-top: 6px; line-height: 1.3; }
.entry-card .ec-detail { font-size: 0.76rem; line-height: 1.7; color: #555; margin-top: 4px; }
.entry-card .ec-num { font-family: var(--mono); font-size: 1.2rem; font-weight: 900; color: var(--black); margin-top: 8px; }
.entry-card .ec-num-label { font-size: 0.62rem; color: var(--gray); }
.entry-card .source-link { font-size: 0.58rem; }
@media (max-width: 600px) {
  body { background: var(--white); }
  .newspaper { box-shadow: none; }
  .masthead { padding: 24px 20px 0; }
  .masthead-title { font-size: 1.65rem; }
  .content { padding: 0 20px; }
  .data-row { margin: 0 20px; }
  .hero h1 { font-size: 1.3rem; }
  .hl-grid { grid-template-columns: 1fr; }
  .hl-grid .hl-col:first-child { border-right: none; padding-right: 0; border-bottom: 1px solid var(--line); }
  .hl-grid .hl-col:last-child { padding-left: 0; }
  .num-highlight { flex-direction: column; }
  .num-card { border-right: none; border-bottom: 1px solid var(--line); }
  .num-card:last-child { border-bottom: none; }
  .we-comm { margin: 48px -20px 0; padding: 24px 20px; }
  .entry-cards { grid-template-columns: 1fr; }
}
@keyframes fi { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
.hero, .sec, .headlines, .hl-grid, .col-box, .num-highlight, .we-comm, .we-comm-inline, .case-study, .entry-cards { animation: fi 0.5s ease both; }
.hero { animation-delay: 0.05s; }
`;

// ===== Escape HTML =====

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ===== Render Functions =====

function renderSourceRef(source?: SourceLink): string {
  if (!source || !source.name) return "";
  if (source.url) {
    return `<span class="source-ref">出典: <a href="${esc(source.url)}" target="_blank" rel="noopener">${esc(source.name)}</a></span>`;
  }
  return `<span class="source-ref">出典: ${esc(source.name)}</span>`;
}

function renderSourceLink(source?: SourceLink): string {
  if (!source || !source.url) return "";
  return `<a href="${esc(source.url)}" target="_blank" rel="noopener" class="source-link">${esc(source.name)}</a>`;
}

function renderDataItem(label: string, value: string, delta: string, direction: string): string {
  return `
    <div class="data-item">
      <div class="d-label">${esc(label)}</div>
      <div class="d-val">${esc(value)}</div>
      <div class="d-delta ${direction}">${esc(delta)}</div>
    </div>`;
}

function renderHlCol(article: HeadlineArticle): string {
  return `
    <div class="hl-col">
      <span class="hl-tag">${esc(article.category)}</span>
      <h3>${esc(article.headline)}</h3>
      ${article.excerpt ? `<p>${esc(article.excerpt)}</p>` : ""}
      ${renderSourceRef(article.source)}
    </div>`;
}

function renderHeadline(article: HeadlineArticle, index: number): string {
  const num = String(index).padStart(2, "0");
  return `
    <div class="hl">
      <span class="n">${num}</span>
      <div class="hl-body">
        <span class="hl-tag">${esc(article.category)}</span>
        <h3>${esc(article.headline)}</h3>
        ${article.excerpt ? `<p class="hl-excerpt">${esc(article.excerpt)}</p>` : ""}
        ${renderSourceRef(article.source)}
      </div>
    </div>`;
}

function renderColumnBox(box: ColumnBox): string {
  return `
    <div class="col-box">
      <div class="col-label">${esc(box.label)}</div>
      <h4>${esc(box.title)}</h4>
      <p>${esc(box.body)}</p>
      ${renderSourceRef(box.source)}
    </div>`;
}

function renderNumHighlight(metrics: MetricCard[]): string {
  const cards = metrics
    .map(
      (m) => `
      <div class="num-card">
        <div class="nc-val">${esc(m.value)}</div>
        <div class="nc-unit">${esc(m.unit)}</div>
      </div>`
    )
    .join("");
  return `<div class="num-highlight">${cards}</div>`;
}

function renderEntryCards(cards: EntryCard[]): string {
  const items = cards
    .map(
      (c) => `
      <div class="entry-card">
        <span class="ec-badge ${c.type}">${c.type === "success" ? "Success" : "Struggle"}</span>
        <div class="ec-brand">${esc(c.brand)}</div>
        <div class="ec-detail">${esc(c.detail)}</div>
        <div class="ec-num">${esc(c.number)}<span class="ec-num-label"> ${esc(c.numberLabel)}</span></div>
        ${renderSourceRef(c.source)}
      </div>`
    )
    .join("");
  return `<div class="entry-cards">${items}</div>`;
}

function renderCaseStudy(cs: CaseStudyBox): string {
  return `
    <div class="case-study">
      <div class="cs-label">Case Study — ${esc(cs.label)}</div>
      <h4>${esc(cs.title)}</h4>
      <p>${esc(cs.body)}</p>
      <div class="cs-source">出典: <a href="${esc(cs.source.url)}" target="_blank" rel="noopener">${esc(cs.source.name)}</a></div>
    </div>`;
}

function renderSection(en: string, jp: string): string {
  return `<div class="sec"><span class="sec-en">${esc(en)}</span><span class="sec-jp">${esc(jp)}</span></div>`;
}

function renderWeCtaInline(): string {
  return `
<div class="we-comm-inline">
  <div class="we-tag">PR</div>
  <h3>台湾進出・越境ビジネスのご相談</h3>
  <p>市場調査からブランド設計、クリエイティブ制作まで一貫して伴走します。</p>
  <a href="https://wewewetw.jp/" class="cta">想像以上有限公司（We TAIWAN）</a>
</div>`;
}

// ===== Main Template Generator =====

export function generateNewsHTML(data: TaiwanNewsData): string {
  const heroImage = data.heroImageUrl
    ? `<img src="${esc(data.heroImageUrl)}" alt="${esc(data.hero.headline)}">`
    : `<div class="hero-fallback"><span>台灣</span></div>`;

  // OGP image: use hero image if available
  const ogImage = data.heroImageUrl || "";

  // Headlines: limit to 4 total. First 2 → grid, rest → list
  const allHeadlines = data.headlines.slice(0, 4);
  const gridArticles = allHeadlines.slice(0, 2);
  const listArticles = allHeadlines.slice(2);

  // Limit columns and case studies to 1
  const businessArticle = data.business.articles.slice(0, 1);
  const cultureArticles = data.culture.articles.slice(0, 1);
  const lifeArticles = data.lifeInTaiwan.articles.slice(0, 1);
  const japanEntryArticles = data.japanEntry.articles.slice(0, 1);

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>台灣生成新聞 ${data.issueNumber} — ${data.date}</title>
<meta name="description" content="${esc(data.hero.headline)} — 台湾現地メディアの報道をAIが日本語で要約。">
<meta property="og:title" content="台灣生成新聞 ${data.issueNumber}">
<meta property="og:description" content="${esc(data.hero.headline)}">
<meta property="og:type" content="article">
${ogImage ? `<meta property="og:image" content="${esc(ogImage)}">` : ""}
<meta name="twitter:card" content="summary_large_image">
${ogImage ? `<meta name="twitter:image" content="${esc(ogImage)}">` : ""}
<link rel="icon" type="image/png" href="/favicon.png">
<link rel="apple-touch-icon" href="/icon-180.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&family=Montserrat:wght@600;700;800;900&family=Noto+Sans+JP:wght@400;500;700;900&family=Noto+Serif+TC:wght@700;900&display=swap" rel="stylesheet">
<style>${CSS}</style>
</head>
<body>
<div class="newspaper">

<div class="accent-bar"></div>

<header class="masthead">
  <h1 class="masthead-title">台灣生成新聞</h1>
  <div class="masthead-sub">Generated by We TAIWAN</div>
  <div class="masthead-info">
    <span>${esc(data.issueNumber)}</span><span class="dot"></span>
    <span>${esc(data.date)}</span><span class="dot"></span>
    <span>台北 ${esc(data.weather.taipei.condition)} ${data.weather.taipei.temp}°C</span>
  </div>
</header>

<div class="data-row">
  ${renderDataItem("TWD/JPY", data.stockData.twdJpy.value, data.stockData.twdJpy.delta, data.stockData.twdJpy.direction)}
  ${renderDataItem("TAIEX", data.stockData.taiex.value, data.stockData.taiex.delta, data.stockData.taiex.direction)}
  ${renderDataItem("台北", `${data.weather.taipei.temp}°`, data.weather.taipei.condition, "flat")}
  ${renderDataItem("高雄", `${data.weather.kaohsiung.temp}°`, data.weather.kaohsiung.condition, "flat")}
</div>

<main class="content">

<article class="hero">
  <div class="hero-img">
    ${heroImage}
    <span class="ai-credit">Image: AI generated</span>
  </div>
  <span class="tag">${esc(data.hero.category)}</span>
  <h1>${esc(data.hero.headline)}</h1>
  <p class="lead">${esc(data.hero.lead)}</p>
  <p class="meta">各報道を参考にAIが要約</p>
  ${renderSourceRef(data.hero.source)}
</article>

<hr class="rule">

${renderSection("Headlines", "本日の注目")}

<div class="hl-grid">
  ${gridArticles.map((a) => renderHlCol(a)).join("")}
</div>

${listArticles.length > 0 ? `<div class="headlines">
  ${listArticles.map((a, i) => renderHeadline(a, i + 3)).join("")}
</div>` : ""}

${renderColumnBox(data.trivia)}

${renderSection("Business", "台湾ビジネス")}

${businessArticle.length > 0 ? `<div class="headlines">
  ${businessArticle.map((a, i) => renderHeadline(a, i + 1)).join("")}
</div>` : ""}

${renderColumnBox(data.business.bizWord)}

${renderSection("Japan Entry", "日本企業の台湾進出")}

${renderEntryCards(data.japanEntry.cards)}

${japanEntryArticles.length > 0 ? `<div class="headlines">
  ${japanEntryArticles.map((a, i) => renderHeadline(a, i + 1)).join("")}
</div>` : ""}

${renderCaseStudy(data.japanEntry.caseStudy)}

${renderSection("Culture", "台湾カルチャー")}

<div class="hl-grid">
  ${data.culture.featured.slice(0, 2).map((a) => renderHlCol(a)).join("")}
</div>

${cultureArticles.length > 0 ? `<div class="headlines">
  ${cultureArticles.map((a, i) => renderHeadline(a, i + 1)).join("")}
</div>` : ""}

<hr class="rule">

${renderSection("Life in Taiwan", "台湾で暮らす")}

${lifeArticles.length > 0 ? `<div class="headlines">
  ${lifeArticles.map((a, i) => renderHeadline(a, i + 1)).join("")}
</div>` : ""}

${renderColumnBox(data.lifeInTaiwan.lifeTip)}

${data.taiwanPhrase ? `
<div class="col-box">
  <div class="col-label">Today's Phrase</div>
  <h4>${esc(data.taiwanPhrase.phrase)}（${esc(data.taiwanPhrase.pronunciation)}）</h4>
  <p>${esc(data.taiwanPhrase.meaning)}</p>
</div>` : ""}

<div class="col-box" style="background: #fff8f6; border-left-color: var(--gray-light);">
  <div class="col-label" style="color: var(--gray);">Disclaimer</div>
  <p style="font-size: 0.72rem;">本サイトは各報道機関の公開記事を参考に、AIが事実を要約したものです。正確性については原典をご確認ください。記事の著作権は各報道機関に帰属します。商用利用や転載はお控えください。</p>
</div>

<div class="we-comm">
  <div class="we-tag">PR</div>
  <h3>台湾進出・越境ビジネスのご相談</h3>
  <p>台湾の市場調査からブランド設計、クリエイティブ制作、実行支援まで一貫して伴走します。</p>
  <a href="https://wewewetw.jp/" class="cta">想像以上有限公司（We TAIWAN）</a>
</div>

</main>

<footer class="footer">
  <div class="f-brand"><span>台灣生成新聞</span></div>
  <p class="f-desc">台湾現地メディアの報道をAIが要約</p>
  <div class="f-links">
    <a href="/latest">最新号</a>
  </div>
  <p class="f-copy">運営: <a href="https://wewewetw.jp/" style="color: var(--gray); text-decoration: none;">想像以上有限公司</a> &nbsp;|&nbsp; 各記事の著作権は原著作者に帰属します</p>
</footer>

</div>
</body>
</html>`;
}
