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
}

const TAIWAN_FEEDS: FeedSource[] = [
  // 確実に動くフィード（優先度高）
  {
    name: "中央社",
    url: "https://www.cna.com.tw/rss/aall.xml",
    category: "総合",
    lang: "zh",
  },
  {
    name: "フォーカス台湾",
    url: "https://japan.focustaiwan.tw/rss",
    category: "総合",
    lang: "ja",
  },
  {
    name: "NHK",
    url: "https://www.nhk.or.jp/rss/news/cat0.xml",
    category: "国際",
    lang: "ja",
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

export async function fetchAllFeeds(): Promise<RSSArticle[]> {
  const results = await Promise.allSettled(
    TAIWAN_FEEDS.map((feed) => fetchFeed(feed))
  );

  const articles: RSSArticle[] = [];
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const feed = TAIWAN_FEEDS[i];
    if (result.status === "fulfilled") {
      successCount++;
      console.log(`[rss] ✅ ${feed.name}: ${result.value.length} articles`);
      articles.push(...result.value);
    } else {
      failCount++;
      console.warn(`[rss] ❌ ${feed.name} (${feed.url}): ${result.reason}`);
    }
  }

  console.log(
    `[rss] Total: ${successCount}/${TAIWAN_FEEDS.length} feeds succeeded, ${articles.length} raw articles`
  );

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

  // Sort by date (newest first) and take top 30
  unique.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  const final = unique.slice(0, 30);
  console.log(`[rss] After dedup: ${unique.length} → returning top ${final.length}`);
  return final;
}

async function fetchFeed(feedSource: FeedSource): Promise<RSSArticle[]> {
  try {
    const feed = await parser.parseURL(feedSource.url);

    return (feed.items || []).slice(0, 10).map((item) => ({
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
    // Re-throw with feed name for better logging
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
