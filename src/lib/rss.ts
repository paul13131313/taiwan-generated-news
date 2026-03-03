import Parser from "rss-parser";
import type { RSSArticle } from "./types";

const parser = new Parser({
  timeout: 15000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (compatible; TaiwanGeneratedNews/1.0; +https://github.com/paul13131313/taiwan-generated-news)",
    Accept: "application/rss+xml, application/xml, text/xml, */*",
  },
});

interface FeedSource {
  name: string;
  url: string;
  category: string;
  lang: "zh" | "en" | "ja";
  filter?: (title: string) => boolean;
}

const TAIWAN_FEEDS: FeedSource[] = [
  // 中央社（個別フィード）
  {
    name: "中央社（経済）",
    url: "https://www.cna.com.tw/rss/afe.xml",
    category: "経済",
    lang: "zh",
  },
  {
    name: "中央社（両岸）",
    url: "https://www.cna.com.tw/rss/acn.xml",
    category: "政治",
    lang: "zh",
  },
  // フォーカス台湾（日本語）
  {
    name: "フォーカス台湾",
    url: "https://japan.focustaiwan.tw/rss",
    category: "総合",
    lang: "ja",
  },
  // 日本メディア
  {
    name: "NHK",
    url: "https://www.nhk.or.jp/rss/news/cat0.xml",
    category: "国際",
    lang: "ja",
  },
  {
    name: "日経アジア",
    url: "https://asia.nikkei.com/rss",
    category: "経済",
    lang: "en",
    filter: (title) => /taiwan|taipei|tsmc|foxconn/i.test(title),
  },
  {
    name: "JETRO",
    url: "https://www.jetro.go.jp/biznews/rss/asia.xml",
    category: "ビジネス",
    lang: "ja",
    filter: (title) => /台湾|Taiwan/i.test(title),
  },
  // 台湾メディア
  {
    name: "自由時報（経済）",
    url: "https://news.ltn.com.tw/rss/business.xml",
    category: "経済",
    lang: "zh",
  },
  {
    name: "自由時報（政治）",
    url: "https://news.ltn.com.tw/rss/politics.xml",
    category: "政治",
    lang: "zh",
  },
  {
    name: "聯合新聞網（経済）",
    url: "https://udn.com/rssfeed/news/2/6644",
    category: "経済",
    lang: "zh",
  },
  {
    name: "The News Lens",
    url: "https://www.thenewslens.com/rss",
    category: "総合",
    lang: "zh",
  },
  {
    name: "Taipei Times",
    url: "https://www.taipeitimes.com/xml/index.rss",
    category: "政治",
    lang: "en",
  },
  // テクノロジー
  {
    name: "INSIDE",
    url: "https://www.inside.com.tw/feed",
    category: "テクノロジー",
    lang: "zh",
  },
];

const MAX_PER_SOURCE = 3;

export async function fetchAllFeeds(): Promise<RSSArticle[]> {
  const results = await Promise.allSettled(
    TAIWAN_FEEDS.map((feed) => fetchFeed(feed))
  );

  // 各ソースごとに記事を収集（最大MAX_PER_SOURCE本ずつ）
  const articlesBySource: Map<string, RSSArticle[]> = new Map();
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const feed = TAIWAN_FEEDS[i];
    if (result.status === "fulfilled") {
      successCount++;
      const limited = result.value.slice(0, MAX_PER_SOURCE);
      console.log(`[rss] ✅ ${feed.name}: ${result.value.length} articles (using ${limited.length})`);
      articlesBySource.set(feed.name, limited);
    } else {
      failCount++;
      console.warn(`[rss] ❌ ${feed.name} (${feed.url}): ${result.reason}`);
    }
  }

  console.log(
    `[rss] Total: ${successCount}/${TAIWAN_FEEDS.length} feeds succeeded`
  );

  // 均等にラウンドロビンで選択
  const articles: RSSArticle[] = [];
  const sources = Array.from(articlesBySource.values());
  const maxRounds = MAX_PER_SOURCE;

  for (let round = 0; round < maxRounds; round++) {
    for (const sourceArticles of sources) {
      if (round < sourceArticles.length) {
        articles.push(sourceArticles[round]);
      }
    }
  }

  console.log(`[rss] Round-robin selected: ${articles.length} articles from ${sources.length} sources`);

  if (articles.length === 0) {
    console.error("[rss] No articles fetched from any feed");
    return [];
  }

  // Deduplicate by title similarity
  const seen = new Set<string>();
  const unique = articles.filter((a) => {
    const key = a.title.slice(0, 30);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Take top 30
  const final = unique.slice(0, 30);
  console.log(`[rss] After dedup: ${unique.length} → returning top ${final.length}`);
  return final;
}

async function fetchFeed(feedSource: FeedSource): Promise<RSSArticle[]> {
  try {
    const feed = await parser.parseURL(feedSource.url);

    let items = (feed.items || []).slice(0, 10);

    // ソース固有のフィルタ（Taiwan関連のみ等）
    if (feedSource.filter) {
      items = items.filter((item) => feedSource.filter!(item.title || ""));
    }

    return items.map((item) => ({
      title: cleanText(item.title || ""),
      summary: cleanText(item.contentSnippet || item.content || "").slice(
        0,
        300
      ),
      source: feedSource.name,
      category: feedSource.category,
      url: item.link || "",
      publishedAt: item.isoDate || item.pubDate || new Date().toISOString(),
    }));
  } catch (e) {
    throw new Error(
      `${feedSource.name}: ${e instanceof Error ? e.message : String(e)}`
    );
  }
}

function cleanText(text: string): string {
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
