import Anthropic from "@anthropic-ai/sdk";
import type { RSSArticle, MarketData, WeatherData, TaiwanNewsData } from "./types";
import { pickStockArticles } from "./stock-articles";

function createClient() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null as unknown as Anthropic;
  return new Anthropic({ apiKey: key });
}

const client = createClient();

const SYSTEM_PROMPT = `あなたは「台灣生成新聞」の紙面編集AIです。
台湾現地メディアの報道記事を日本語に翻訳・要約し、新聞紙面を構成してください。

## 読者ターゲット
台湾に関心のある日本人ビジネスパーソン（特に台湾進出を検討する企業担当者）

## 翻訳ルール（厳守）
記事を日本語に翻訳する際、以下のルールを厳守してください:
- 国名は全て日本語表記にする（波蘭→ポーランド、法國→フランス、英國→イギリス、德國→ドイツ、美國→アメリカ、日本→日本、韓國→韓国、越南→ベトナム、俄羅斯→ロシア、巴西→ブラジル、印度→インド、澳洲→オーストラリア、加拿大→カナダ、墨西哥→メキシコ、土耳其→トルコ、以色列→イスラエル、沙烏地阿拉伯→サウジアラビア、荷蘭→オランダ、瑞典→スウェーデン、瑞士→スイス）
- 人名は漢字のままでOKだが、初出時にカタカナ読みを（）で付ける（例: 賴清德（らい・せいとく）、蕭美琴（しょう・びきん））
- 金融用語は日本語にする（道瓊指数→ダウ平均、那斯達克→ナスダック、標普500→S&P500、跌幅→下落幅、漲幅→上昇幅、殖利率→利回り、通膨→インフレ、降息→利下げ、升息→利上げ）
- 台湾の地名は漢字のまま（台北、高雄、嘉義、台中、新竹、台南はそのまま）
- 「元」は「台湾ドル」と明記（例: 74,900台湾ドル）
- 中国語の慣用表現を自然な日本語に変える

## カテゴリ分類ルール（厳守）
各記事を以下のカテゴリに正確に分類してください:
- POLITICS: 政治、外交、軍事、安全保障、国際関係、国際機関（SCO、NATO、ASEAN等）
- ECONOMY: 経済、金融、株価、為替、貿易、企業業績
- TECH: テクノロジー、IT、半導体、AI、スタートアップ
- CULTURE: 芸術、音楽、映画、祭り、伝統文化、観光イベント（政治・経済・軍事は絶対にCULTUREにしない）
- LIFE: 生活、天気、交通、食、旅行、教育

## 記事の重複禁止（厳守）
各記事は1つのセクションにのみ使用してください。同じ記事や同じトピックを複数のセクションで使い回さないでください。

## 文体ルール
- 硬質な新聞文体。漢語・熟語を多用
- 体言止めを活用し、簡潔に
- 「〇〇によると」形式で出典を明記
- 数字は算用数字（例: 68店舗、2.5%増）

## 制約
- RSS記事に含まれる事実のみ使用。捏造厳禁
- 各記事に必ずsource（出典名とURL）を付与
- 画像生成プロンプトは英語で、写真報道風のスタイル指示を含める
- JSONのみ出力。マークダウンのコードブロックは使わない`;

export async function generateNewspaper(
  articles: RSSArticle[],
  marketData: { twdJpy: MarketData; taiex: MarketData },
  weather: { taipei: WeatherData; kaohsiung: WeatherData },
  issueNumber: number
): Promise<TaiwanNewsData> {
  const today = new Date();
  const dateStr = formatJapaneseDate(today);
  const dayOfWeek = ["日", "月", "火", "水", "木", "金", "土"][today.getDay()];

  const articleList = articles
    .map(
      (a, i) =>
        `${i + 1}. [${a.category}] ${a.title} (${a.source}) — ${a.summary} — URL: ${a.url}`
    )
    .join("\n");

  const userPrompt = `以下の台湾メディアRSS記事から新聞紙面を構成してください。

## 今日の情報
- 日付: ${dateStr}（${dayOfWeek}）
- 号数: No. ${String(issueNumber).padStart(3, "0")}
- 為替: TWD/JPY ${marketData.twdJpy.value}円 ${marketData.twdJpy.delta || ""}
- TAIEX: ${marketData.taiex.value} ${marketData.taiex.delta || ""}
- 台北天気: ${weather.taipei.condition} ${weather.taipei.temp}°C
- 高雄天気: ${weather.kaohsiung.condition} ${weather.kaohsiung.temp}°C

※重要: ヘッダーやマーケットセクションの数値はAPIから取得済みなので、記事本文中で株価・為替を言及する場合も上記の数字をそのまま使ってください（「万」表記や独自の丸め処理は禁止。例: ○ 23,605 × 2万3509）

## RSS記事一覧
${articleList}

## 出力JSON構造
{
  "hero": {
    "category": "カテゴリ（POLITICS/ECONOMY/TECH/SOCIETY等）",
    "headline": "一面見出し（日本語、25字以内）",
    "lead": "リード文（日本語、300〜400字。〇〇によると形式で出典明記）",
    "source": { "name": "出典メディア名", "url": "記事URL" }
  },
  "headlines": [
    {
      "category": "CATEGORY",
      "headline": "見出し（日本語、20字以内）",
      "excerpt": "要約（日本語、80〜100字）",
      "source": { "name": "出典名", "url": "URL" }
    }
  ],
  "trivia": {
    "label": "Taiwan Trivia",
    "title": "台湾豆知識のタイトル",
    "body": "台湾に関する興味深い豆知識（80字以内）",
    "source": { "name": "出典名", "url": "URL" }
  },
  "business": {
    "metrics": [
      { "value": "数値", "unit": "説明（10字以内）" }
    ],
    "articles": [
      {
        "category": "ECONOMY",
        "headline": "見出し",
        "excerpt": "要約",
        "source": { "name": "出典名", "url": "URL" }
      }
    ],
    "bizWord": {
      "label": "Biz Word",
      "title": "台湾ビジネス用語",
      "body": "用語の解説（80字以内）"
    }
  },
  "japanEntry": {
    "metrics": [
      { "value": "数値", "unit": "説明" }
    ],
    "cards": [
      {
        "type": "success",
        "brand": "企業名",
        "detail": "進出状況の説明（50字以内）",
        "number": "数値",
        "numberLabel": "単位",
        "source": { "name": "出典名", "url": "URL" }
      }
    ],
    "articles": [
      {
        "category": "BUSINESS",
        "headline": "見出し",
        "source": { "name": "出典名", "url": "URL" }
      }
    ],
    "caseStudy": {
      "label": "失敗に学ぶ台湾進出",
      "title": "ケースタイトル",
      "body": "失敗事例の分析（150字以内。出典明記）",
      "source": { "name": "出典名", "url": "URL" }
    },
    "trendWatch": {
      "label": "Trend Watch",
      "title": "トレンドタイトル",
      "body": "台湾ビジネストレンドの分析（100字以内）",
      "source": { "name": "出典名", "url": "URL" }
    }
  },
  "culture": {
    "featured": [
      {
        "category": "CULTURE",
        "headline": "見出し",
        "excerpt": "要約",
        "source": { "name": "出典名", "url": "URL" }
      }
    ],
    "articles": [
      {
        "category": "CULTURE",
        "headline": "見出し",
        "source": { "name": "出典名", "url": "URL" }
      }
    ]
  },
  "lifeInTaiwan": {
    "articles": [
      {
        "category": "LIFE",
        "headline": "見出し",
        "excerpt": "要約",
        "source": { "name": "出典名", "url": "URL" }
      }
    ],
    "lifeTip": {
      "label": "Life Tip",
      "title": "台湾生活のヒント",
      "body": "実用的なアドバイス（80字以内）",
      "source": { "name": "出典名", "url": "URL" }
    }
  },
  "taiwanPhrase": {
    "phrase": "台湾華語のフレーズ（繁体字）",
    "pronunciation": "カタカナ読み",
    "meaning": "ビジネスで使える場面の説明"
  },
  "imagePrompt": "Hero image prompt in English. Bright, well-lit, high contrast, vivid colors, photojournalistic editorial style, no text overlay. Describe a specific, concrete scene based on the hero article (e.g., airport terminal, city street, business meeting). Avoid abstract or dark imagery."
}

## 必須ルール
- headlinesは4本（hero記事と重複しないこと）
- business.metricsは3本、business.articlesは1本
- japanEntry.metricsは3本、japanEntry.cardsは2本（successとstruggleを1つずつ）
- japanEntry.articlesは1本
- culture.featuredは2本、culture.articlesは1本
- lifeInTaiwan.articlesは1本
- RSS記事にない情報は使わない（japanEntryのcardsとcaseStudyは既知の一般的事実でOK）
- 全sourceにnameとurlを含める（urlがない場合は空文字）
- imagePromptは英語40語以内

## japanEntry（日本企業の台湾進出）セクションの厳密ルール
あなたは日本企業の台湾市場進出ニュースの専門フィルターです。
以下の記事一覧から、厳密に以下の条件を全て満たすニュースのみを抽出してください。

【必須条件（全て満たすこと）】
1. 主語が日本企業（日本に本社がある企業）であること
2. 台湾市場への進出・出店・工場設立・合弁・提携・買収が内容であること
3. 進出先が台湾（台北・高雄・台中・新竹・台南等）であること

【除外条件（1つでも該当したら除外）】
- 台湾企業の話（例: 台湾の寝具ブランド、台湾のIT企業）
- スポーツ・エンタメ（例: WBCスポンサー、大谷翔平）
- 車や製品のランキング・レビュー
- 米国・中国・その他の国への進出
- 台湾企業が日本に進出する話（逆方向）

【出力ルール】
- 条件を全て満たすニュースがない場合: cardsは空配列[]、articlesも空配列[]を返す
- 無理にこじつけて記事を作らない。「該当なし」は恥ではない。精度が最優先
- caseStudyも台湾でのビジネス失敗事例のみ。他国（米国、中国等）の事例は絶対に使わない
- caseStudyの該当がない場合: labelに「該当なし」、titleに「本日の該当事例はありません」、bodyは空文字を返す`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 6000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  const parsed = parseGeneratedJson(text);

  // japanEntry: cardsが空の場合はストック記事で埋める
  let isStock = false;
  if (!parsed.japanEntry.cards || parsed.japanEntry.cards.length === 0) {
    console.log("[translate] japanEntry cards empty — using stock articles");
    parsed.japanEntry.cards = pickStockArticles(2);
    isStock = true;
  }
  parsed.japanEntry.isStock = isStock;

  // Merge with date/issue/market/weather info
  return {
    date: `${dateStr}（${dayOfWeek}）`,
    issueNumber: `No. ${String(issueNumber).padStart(3, "0")}`,
    weather,
    stockData: marketData,
    ...parsed,
  };
}

function parseGeneratedJson(text: string): Omit<TaiwanNewsData, "date" | "issueNumber" | "weather" | "stockData"> {
  // Remove markdown code block wrapper if present
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  }

  try {
    return JSON.parse(cleaned);
  } catch {
    // Try to extract JSON from the text
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw new Error("Failed to parse Claude response as JSON");
  }
}

function formatJapaneseDate(date: Date): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${y}年${m}月${d}日`;
}
