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

type FeedTier = "core" | "sub" | "ref";

interface FeedSource {
  name: string;
  url: string;
  category: string;
  tier: FeedTier;
}

// === コア（全記事取得、AIが選別）===
// === サブ（カルチャー系のみフィルタ）===
// === 参考（消費財・ブランド系のみ）===
const TAIWAN_FEEDS: FeedSource[] = [
  // コア
  {
    name: "PopDaily",
    url: "https://www.popdaily.com.tw/rss",
    category: "トレンド",
    tier: "core",
  },
  {
    name: "niusnews",
    url: "https://www.niusnews.com/rss",
    category: "トレンド",
    tier: "core",
  },
  {
    name: "Shopping Design",
    url: "https://www.shoppingdesign.com.tw/rss",
    category: "デザイン",
    tier: "core",
  },
  // サブ
  {
    name: "VidaOrange",
    url: "https://buzzorange.com/vidaorange/feed",
    category: "ライフスタイル",
    tier: "sub",
  },
  {
    name: "Inside",
    url: "https://www.inside.com.tw/feed",
    category: "テクノロジー",
    tier: "sub",
  },
  {
    name: "TechOrange",
    url: "https://buzzorange.com/techorange/feed",
    category: "テクノロジー",
    tier: "sub",
  },
  // 参考
  {
    name: "Business Next",
    url: "https://www.bnext.com.tw/rss",
    category: "ビジネス",
    tier: "ref",
  },
  {
    name: "The News Lens",
    url: "https://feeds.feedburner.com/TheNewsLens",
    category: "総合",
    tier: "ref",
  },
];

const HOURS_24 = 24 * 60 * 60 * 1000;

// カルチャー系キーワード（サブ・参考ソースのフィルタリング用）
const CULTURE_KEYWORDS = [
  // カフェ・グルメ
  "咖啡", "café", "cafe", "甜點", "美食", "餐廳", "飲料", "茶", "小吃", "夜市",
  "烘焙", "brunch", "甜品", "手搖", "珍珠奶茶",
  // コスメ・ビューティー
  "美妝", "保養", "化妝", "彩妝", "護膚", "面膜", "唇膏", "粉底",
  "beauty", "cosmetic", "skincare",
  // ファッション・ブランド
  "時尚", "穿搭", "品牌", "設計師", "服飾", "潮流", "聯名",
  "fashion", "brand", "design",
  // デザイン・インテリア
  "設計", "空間", "室內", "家居", "選物", "文創",
  "interior", "lifestyle",
  // SNSトレンド・バズ
  "IG", "Instagram", "Threads", "Dcard", "PTT", "爆紅", "瘋傳", "話題",
  "trending", "viral", "社群",
  // エンタメ・カルチャー
  "電影", "音樂", "展覽", "藝術", "演唱會", "偶像", "韓劇", "日劇", "動漫",
  "movie", "music", "art", "culture",
  // 旅行・スポット
  "旅遊", "景點", "打卡", "秘境", "民宿", "飯店",
  "travel", "hotel",
  // 新商品・新サービス（消費者向け）
  "新品", "上市", "開幕", "新店", "限定", "聯名", "快閃",
  "launch", "new",
];

// 除外キーワード（政治・マクロ経済・軍事・外交・法改正）
const EXCLUDE_KEYWORDS = [
  "選舉", "立法院", "總統", "國防", "軍事", "外交", "兩岸",
  "中共", "解放軍", "飛彈", "台海", "法案", "修法", "黨團",
  "GDP", "央行", "利率", "通膨", "inflation",
  "military", "defense", "missile", "election", "parliament",
];

function matchesCultureFilter(title: string, summary: string): boolean {
  const text = (title + " " + summary).toLowerCase();
  // 除外キーワードに該当したら除外
  if (EXCLUDE_KEYWORDS.some((kw) => text.includes(kw.toLowerCase()))) {
    return false;
  }
  // カルチャーキーワードに該当するか
  return CULTURE_KEYWORDS.some((kw) => text.includes(kw.toLowerCase()));
}

export async function fetchAllFeeds(): Promise<RSSArticle[]> {
  const results = await Promise.allSettled(
    TAIWAN_FEEDS.map((feed) => fetchFeed(feed))
  );

  const allArticles: RSSArticle[] = [];
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const feed = TAIWAN_FEEDS[i];
    if (result.status === "fulfilled") {
      successCount++;
      let articles = result.value;

      // サブ・参考ソースはカルチャーフィルタ適用
      if (feed.tier === "sub" || feed.tier === "ref") {
        const before = articles.length;
        articles = articles.filter((a) =>
          matchesCultureFilter(a.title, a.summary)
        );
        console.log(
          `[rss] ✅ ${feed.name} (${feed.tier}): ${before} → ${articles.length} after culture filter`
        );
      } else {
        console.log(
          `[rss] ✅ ${feed.name} (core): ${articles.length} articles`
        );
      }

      allArticles.push(...articles);
    } else {
      failCount++;
      console.warn(
        `[rss] ❌ ${feed.name} (${feed.url}): ${result.reason}`
      );
    }
  }

  console.log(
    `[rss] Total: ${successCount}/${TAIWAN_FEEDS.length} feeds succeeded, ${failCount} failed`
  );

  if (successCount < 2) {
    console.error(
      `[rss] Only ${successCount} feeds succeeded (minimum 2 required)`
    );
  }

  // Deduplicate by title similarity
  const seen = new Set<string>();
  const unique = allArticles.filter((a) => {
    const key = a.title.slice(0, 30);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Take top 40 articles (more input for AI selection)
  const final = unique.slice(0, 40);
  console.log(
    `[rss] After dedup: ${unique.length} → returning top ${final.length}`
  );
  return final;
}

async function fetchFeed(feedSource: FeedSource): Promise<RSSArticle[]> {
  try {
    const feed = await parser.parseURL(feedSource.url);
    const now = Date.now();

    let items = (feed.items || []).slice(0, 20);

    // 直近24時間以内の記事のみ
    items = items.filter((item) => {
      const pubDate = item.isoDate || item.pubDate;
      if (!pubDate) return true;
      const diff = now - new Date(pubDate).getTime();
      return diff < HOURS_24;
    });

    return items.map((item) => ({
      title: cleanText(item.title || ""),
      summary: cleanText(
        item.contentSnippet || item.content || ""
      ).slice(0, 400),
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
