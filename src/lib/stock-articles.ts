import type { EntryCard } from "./types";

export interface StockArticle {
  company: string;
  year: number;
  category: "SUCCESS" | "STRUGGLE";
  number: string;
  numberLabel: string;
  summary: string;
  source: string;
}

export const stockArticles: StockArticle[] = [
  {
    company: "ドン・キホーテ",
    year: 2021,
    category: "SUCCESS",
    number: "6",
    numberLabel: "台湾店舗数",
    summary: "台北・西門町に海外1号店を出店。深夜営業と日本商品の品揃えで若者に人気。現在台湾内に複数店舗展開中。",
    source: "日経アジア",
  },
  {
    company: "ニトリ",
    year: 2019,
    category: "SUCCESS",
    number: "50+",
    numberLabel: "台湾店舗数",
    summary: "台湾市場に本格参入。手頃な価格の家具・インテリアで急速に店舗数を拡大し、IKEAの対抗馬に。",
    source: "東洋経済",
  },
  {
    company: "スシロー",
    year: 2018,
    category: "SUCCESS",
    number: "2時間",
    numberLabel: "オープン時の待ち時間",
    summary: "台北に1号店オープン。回転寿司ブームを牽引し、台湾全土に展開。",
    source: "中央通訊社",
  },
  {
    company: "三越伊勢丹",
    year: 1991,
    category: "SUCCESS",
    number: "13",
    numberLabel: "新光三越の店舗数",
    summary: "台北の新光三越として合弁展開。台湾最大の百貨店チェーンに成長。日本式接客が高評価。",
    source: "日本経済新聞",
  },
  {
    company: "モスバーガー",
    year: 1991,
    category: "SUCCESS",
    number: "300+",
    numberLabel: "台湾店舗数",
    summary: "台湾進出から30年以上。台湾限定メニュー「米バーガー」が人気。",
    source: "フォーカス台湾",
  },
  {
    company: "ユニクロ",
    year: 2010,
    category: "SUCCESS",
    number: "1万人",
    numberLabel: "初日来店数",
    summary: "台北・明曜百貨に1号店。現在70店舗以上を台湾で展開。",
    source: "自由時報",
  },
  {
    company: "無印良品",
    year: 2004,
    category: "SUCCESS",
    number: "50+",
    numberLabel: "台湾店舗数",
    summary: "シンプルなデザインが台湾の若い世代に支持。ブランド認知度は日本並み。",
    source: "商業周刊",
  },
  {
    company: "セブンイレブン",
    year: 1979,
    category: "SUCCESS",
    number: "6,900+",
    numberLabel: "台湾店舗数",
    summary: "統一企業との提携で台湾最大のコンビニチェーンに。世界有数の店舗密度。",
    source: "台湾Today",
  },
  {
    company: "ダイソー",
    year: 2001,
    category: "SUCCESS",
    number: "80+",
    numberLabel: "大創百貨の店舗数",
    summary: "均一価格ショップの先駆けとして全土に展開。",
    source: "工商時報",
  },
  {
    company: "CoCo壱番屋",
    year: 1998,
    category: "SUCCESS",
    number: "40+",
    numberLabel: "台湾店舗数",
    summary: "台湾でカレー文化を定着させた立役者。台湾人の定番外食に。",
    source: "聯合新聞網",
  },
  {
    company: "藤田観光",
    year: 2023,
    category: "SUCCESS",
    number: "2023",
    numberLabel: "台北開業年",
    summary: "ホテルグレイスリー台北を開業。訪台日本人と日本好き台湾人をターゲットに。",
    source: "観光経済新聞",
  },
  {
    company: "ワークマン",
    year: 2024,
    category: "SUCCESS",
    number: "1号店",
    numberLabel: "台北出店計画",
    summary: "作業着からカジュアルウェアへの転換モデルで台湾市場に挑戦。",
    source: "日経MJ",
  },
];

/**
 * 日付ベースのシード値で決定論的にストック記事を2件選択。
 * 同じ日は同じ記事、翌日は別の記事を返す。
 */
export function pickStockArticles(count: number = 2): EntryCard[] {
  const now = new Date();
  const taiwanOffset = 8 * 60;
  const today = new Date(now.getTime() + (taiwanOffset + now.getTimezoneOffset()) * 60000);
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();

  // シンプルなハッシュで開始インデックスを決定
  const startIndex = seed % stockArticles.length;
  const picked: StockArticle[] = [];

  for (let i = 0; i < count; i++) {
    const idx = (startIndex + i * 5) % stockArticles.length; // 5つ飛ばしで多様性確保
    picked.push(stockArticles[idx]);
  }

  return picked.map((a) => ({
    type: a.category === "SUCCESS" ? "success" as const : "struggle" as const,
    brand: a.company,
    detail: a.summary,
    number: a.number,
    numberLabel: a.numberLabel,
    source: { name: a.source, url: "" },
  }));
}
