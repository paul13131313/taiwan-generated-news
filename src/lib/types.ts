// ===== RSS =====
export interface RSSArticle {
  title: string;
  summary: string;
  source: string;
  category: string;
  url: string;
  publishedAt: string;
}

// ===== Glossary =====
export interface GlossaryItem {
  term: string;
  reading?: string;
  explanation: string;
}

// ===== Article (共通) =====
export interface Article {
  title: string;
  body: string;
  sourceUrl?: string;
  sourceName?: string;
  glossary?: GlossaryItem[];
}

// ===== SNS Buzz Item =====
export interface BuzzItem {
  title: string;
  description: string;
  sourceUrl?: string;
  sourceName?: string;
}

// ===== Newspaper Data Structure =====
export interface TaiwanNewsData {
  date: string;
  issueNumber: string;

  // ヘッダー表示用（TAIEX・天気）
  headerInfo?: {
    taiex?: string;
    weather?: string;
  };

  // ① 今日のトレンド（トップ）
  todayTrend: {
    title: string;
    lead: string;
    body: string;
    sourceUrl?: string;
    sourceName?: string;
    glossary?: GlossaryItem[];
  };

  // ② 台湾カフェ＆グルメ
  cafeGourmet: {
    articles: Article[];
  };

  // ③ 台湾ビューティー＆ブランド
  beautyBrand: {
    articles: Article[];
  };

  // ④ 台湾SNSバズ
  snsBuzz: {
    items: BuzzItem[];
    glossary?: GlossaryItem[];
  };

  // ⑤ 台湾人が見ている日本（1-2本）
  taiwanLooksAtJapan: {
    articles: Article[];
  };

  // ⑥ 台湾文化史（RSS非依存、AI知識ベース）
  taiwanCultureHistory?: {
    articles: Article[];
  };

  // ヒーロー画像用プロンプト（FLUX生成）
  imagePrompt: string;
  heroImageUrl?: string;
}
