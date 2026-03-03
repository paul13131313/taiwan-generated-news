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
  };
  japanEntry: {
    metrics: MetricCard[];
    cards: EntryCard[];
    articles: HeadlineArticle[];
    caseStudy: CaseStudyBox;
    trendWatch: ColumnBox;
  };
  culture: {
    featured: HeadlineArticle[];
    articles: HeadlineArticle[];
  };
  lifeInTaiwan: {
    articles: HeadlineArticle[];
    lifeTip: ColumnBox;
  };
  taiwanPhrase?: {
    phrase: string;
    pronunciation: string;
    meaning: string;
  };
  imagePrompt: string;
  heroImageUrl?: string;
}
