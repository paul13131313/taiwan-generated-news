import Parser from "rss-parser";
import type { RSSArticle } from "./types";

const parser = new Parser({
  timeout: 15000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
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
  // === 中央通訊社（FeedBurner経由） ===
  {
    name: "中央通訊社（政治）",
    url: "https://feeds.feedburner.com/rsscna/politics",
    category: "政治",
    lang: "zh",
  },
  {
    name: "中央通訊社（国際）",
    url: "https://feeds.feedburner.com/rsscna/intworld",
    category: "国際",
    lang: "zh",
  },
  {
    name: "中央通訊社（両岸）",
    url: "https://feeds.feedburner.com/rsscna/mainland",
    category: "政治",
    lang: "zh",
  },
  {
    name: "中央通訊社（産経証券）",
    url: "https://feeds.feedburner.com/rsscna/finance",
    category: "経済",
    lang: "zh",
  },
  {
    name: "中央通訊社（科技）",
    url: "https://feeds.feedburner.com/rsscna/technology",
    category: "テクノロジー",
    lang: "zh",
  },
  // === 台湾メディア（中国語） ===
  {
    name: "自由時報",
    url: "https://news.ltn.com.tw/rss/all.xml",
    category: "総合",
    lang: "zh",
  },
  {
    name: "NewTalk",
    url: "https://newtalk.tw/rss/all",
    category: "総合",
    lang: "zh",
  },
  // === 台湾メディア（英語） ===
  {
    name: "Focus Taiwan",
    url: "https://focustaiwan.tw/rss",
    category: "総合",
    lang: "en",
  },
  {
    name: "Taipei Times",
    url: "https://www.taipeitimes.com/xml/index.rss",
    category: "政治",
    lang: "en",
  },
  {
    name: "Taiwan News",
    url: "https://www.taiwannews.com.tw/en/rss",
    category: "総合",
    lang: "en",
  },
  // === 日本メディア ===
  {
    name: "NHK",
    url: "https://www.nhk.or.jp/rss/news/cat0.xml",
    category: "国際",
    lang: "ja",
  },
  {
    name: "共同通信",
    url: "https://english.kyodonews.net/rss/all.xml",
    category: "国際",
    lang: "en",
    filter: (title) => /taiwan|taipei|tsmc|foxconn|taiex/i.test(title),
  },
  // === 台湾政府系 ===
  {
    name: "Taiwan Today",
    url: "https://api.taiwantoday.tw/en/rss.php",
    category: "政治",
    lang: "en",
  },
];

const MAX_PER_SOURCE = 3;
const HOURS_24 = 24 * 60 * 60 * 1000;

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
    `[rss] Total: ${successCount}/${TAIWAN_FEEDS.length} feeds succeeded, ${failCount} failed`
  );

  if (successCount < 3) {
    console.error(`[rss] Only ${successCount} feeds succeeded (minimum 3 required)`);
  }

  // 均等にラウンドロビンで選択
  const articles: RSSArticle[] = [];
  const sources = Array.from(articlesBySource.values());

  for (let round = 0; round < MAX_PER_SOURCE; round++) {
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
    const now = Date.now();

    let items = (feed.items || []).slice(0, 15);

    // 直近24時間以内の記事のみ
    items = items.filter((item) => {
      const pubDate = item.isoDate || item.pubDate;
      if (!pubDate) return true; // 日付不明は含める
      const diff = now - new Date(pubDate).getTime();
      return diff < HOURS_24;
    });

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
