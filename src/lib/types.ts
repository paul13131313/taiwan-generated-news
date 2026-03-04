// ===== RSS =====
export interface RSSArticle {
  title: string;
  summary: string;
  source: string;
  category: string;
  url: string;
  publishedAt: string;
}

// ===== Market / Weather =====
export interface MarketData {
  value: string;
  delta: string;
  direction: "up" | "dn" | "flat";
}

export interface WeatherData {
  temp: number;
  condition: string;
}

// ===== Glossary =====
export interface GlossaryItem {
  term: string;
  reading?: string;
  explanation: string;
}

// ===== Newspaper Data Structure =====
export interface SourceLink {
  name: string;
  url: string;
}

export interface HeadlineArticle {
  category: string;
  headline: string;
  excerpt?: string;
  source: SourceLink;
}

export interface HeroArticle {
  category: string;
  headline: string;
  lead: string;
  source: SourceLink;
  glossary?: GlossaryItem[];
}

export interface MetricCard {
  value: string;
  unit: string;
}

export interface EntryCard {
  type: "success" | "struggle";
  brand: string;
  detail: string;
  number: string;
  numberLabel: string;
  source: SourceLink;
}

export interface ColumnBox {
  label: string;
  title: string;
  body: string;
  source?: SourceLink;
}

export interface CaseStudyBox {
  label: string;
  title: string;
  body: string;
  source: SourceLink;
}

export interface TaiwanNewsData {
  date: string;
  issueNumber: string;
  weather: {
    taipei: WeatherData;
    kaohsiung: WeatherData;
  };
  stockData: {
    twdJpy: MarketData;
    taiex: MarketData;
  };
  hero: HeroArticle;
  headlines: HeadlineArticle[];
  trivia: ColumnBox;
  business: {
    metrics: MetricCard[];
    articles: HeadlineArticle[];
    bizWord: ColumnBox;
    glossary?: GlossaryItem[];
  };
  japanEntry: {
    metrics: MetricCard[];
    cards: EntryCard[];
    articles: HeadlineArticle[];
    caseStudy: CaseStudyBox;
    trendWatch: ColumnBox;
    isStock?: boolean; // ストック記事（過去事例）を使用中かどうか
    glossary?: GlossaryItem[];
  };
  culture: {
    featured: HeadlineArticle[];
    articles: HeadlineArticle[];
    glossary?: GlossaryItem[];
  };
  lifeInTaiwan: {
    articles: HeadlineArticle[];
    lifeTip: ColumnBox;
    glossary?: GlossaryItem[];
  };
  taiwanPhrase?: {
    phrase: string;
    pronunciation: string;
    meaning: string;
  };
  imagePrompt: string;
  heroImageUrl?: string;
}
