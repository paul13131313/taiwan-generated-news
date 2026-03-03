import Parser from "rss-parser";
import type { RSSArticle } from "./types";

const parser = new Parser({
  timeout: 10000,
  headers: {
    "User-Agent": "TaiwanGeneratedNews/1.0 (news aggregator)",
    Accept: "application/rss+xml, application/xml, text/xml",
  },
});

interface FeedSource {
  name: string;
  url: string;
  category: string;
  lang: "zh" | "en" | "ja";
}

const TAIWAN_FEEDS: FeedSource[] = [
  // 中央通訊社（フォーカス台湾 日本語版）
  {
    name: "フォーカス台湾",
    url: "https://japan.focustaiwan.tw/rss",
    category: "総合",
    lang: "ja",
  },
  // 中央通訊社（中国語）
  {
    name: "中央社",
    url: "https://www.cna.com.tw/rss/aall.xml",
    category: "総合",
    lang: "zh",
  },
  // 自由時報
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
    name: "自由時報（国際）",
    url: "https://news.ltn.com.tw/rss/world.xml",
    category: "国際",
    lang: "zh",
  },
  // 聯合新聞網
  {
    name: "聯合新聞網",
    url: "https://udn.com/rssfeed/news/2/6644?ch=news",
    category: "経済",
    lang: "zh",
  },
  // Taipei Times (English)
  {
    name: "Taipei Times",
    url: "https://www.taipeitimes.com/xml/index.rss",
    category: "政治",
    lang: "en",
  },
  // INSIDE Taiwan (テクノロジー)
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
  for (const result of results) {
    if (result.status === "fulfilled") {
      articles.push(...result.value);
    } else {
      console.warn("RSS fetch failed:", result.reason);
    }
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

  return unique.slice(0, 30);
}

async function fetchFeed(feedSource: FeedSource): Promise<RSSArticle[]> {
  const feed = await parser.parseURL(feedSource.url);

  return (feed.items || []).slice(0, 10).map((item) => ({
    title: cleanText(item.title || ""),
    summary: cleanText(item.contentSnippet || item.content || "").slice(0, 300),
    source: feedSource.name,
    category: feedSource.category,
    url: item.link || "",
    publishedAt: item.isoDate || item.pubDate || new Date().toISOString(),
  }));
}

function cleanText(text: string): string {
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
