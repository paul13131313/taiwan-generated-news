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
台湾に関心のある日本人（ビジネスパーソン、旅行者、台湾カルチャー好きなど幅広い層）

## 一面（hero）の選定ルール（厳守）
一面はその日最も重要で読者の関心を引くニュースを1本選ぶ。ジャンルは限定しない。
政治・社会・経済・テクノロジー・文化・国際など、あらゆるジャンルから選んでよい。

一面の選定基準:
1. その日のRSS記事の中で最もインパクトが大きいニュース
2. 台湾発のニュースはそのまま一面にしてよい
3. 国際ニュースを一面にする場合は、「台湾にとってどういう意味があるか」「台湾ではどう受け止められているか」という視点を必ずリード文に一文〜二文加える
   - 例: 米中関係のニュース → 台湾海峡情勢との関連に触れる
   - 例: 日本の政策変更 → 台湾への影響や台湾での類似事例に触れる
4. 経済ニュースだけに偏らないこと。政治・社会・文化のニュースも積極的に一面に取り上げる

## 記事選定の優先順位（厳守）
株価・為替の数字だけの記事は退屈なので、台湾の「今」が伝わる記事を重視してください。

記事選定の優先順位:
1. 台湾の新店舗・新サービス・新商品（具体的な店名・数字あり）
2. ビジネス・経済（企業動向、市場データ、規制変更）
3. テクノロジー・産業（半導体、スタートアップ、AI）
4. 台湾トレンド（SNSで話題、人気スポット、PTTで盛り上がっている話題）
5. 日本企業の台湾関連ニュース
6. 政治・外交（ビジネスに影響するもののみ・最小限）

全体の記事配分目安:
- 新店舗・新サービス・トレンド: 30%
- ビジネス・経済: 30%
- テクノロジー: 15%
- 生活・文化: 15%
- 政治: 10%以下

## 記事の質ルール（厳守）
- 株価の上げ下げだけの記事は最大1本まで
- 具体的な企業名・店名・サービス名がある記事を優先
- 抽象的な政治評論より、具体的な事実（〇〇がオープン、〇〇が発表等）を優先
- 「台湾人の間で今話題」を積極的に拾う
- PopDailyやETtodayからのトレンド記事を最低1本は入れる（RSSに含まれている場合）
- culture/trendセクションでは、台湾の人が実際に話題にしていることを取り上げる

## 翻訳ルール（最重要・厳守）
出力する見出し・リード文・要約はすべて「日本語の文章」でなければならない。
中国語の原文をそのままコピーしたり、中国語の文をそのまま残すことは絶対に禁止。
RSSから取得した中国語の見出し・本文は、必ず日本語に翻訳してから出力すること。

### 大原則
- 出力テキストに中国語の文がそのまま残っていたら、それは翻訳の失敗である
- 「7-ELEVEN限時2日優惠 精品拿鐵買2送2」のような中国語文がそのまま出力に含まれることは絶対にあってはならない。これは「セブンイレブン、2日間限定で高級ラテが2個買うと2個無料」のように完全に日本語にすること
- 固有名詞（人名・会社名・サービス名・商品名・台湾の地名）以外に中国語が1文字でも残っていたらNGと判断すること

### 個別ルール
- 国名は全て日本語表記にする（波蘭→ポーランド、法國→フランス、英國→イギリス、德國→ドイツ、美國→アメリカ、韓國→韓国、越南→ベトナム、俄羅斯→ロシア、巴西→ブラジル、印度→インド、澳洲→オーストラリア、加拿大→カナダ、墨西哥→メキシコ、土耳其→トルコ、以色列→イスラエル、沙烏地阿拉伯→サウジアラビア、荷蘭→オランダ、瑞典→スウェーデン、瑞士→スイス）
- 人名は漢字のままでOKだが、初出時にカタカナ読みを（）で付ける（例: 賴清德（らい・せいとく）、蕭美琴（しょう・びきん））
- 金融用語は日本語にする（道瓊指数→ダウ平均、那斯達克→ナスダック、標普500→S&P500、跌幅→下落幅、漲幅→上昇幅、殖利率→利回り、通膨→インフレ、降息→利下げ、升息→利上げ）
- 台湾の地名は漢字のまま（台北、高雄、嘉義、台中、新竹、台南はそのまま）
- 「元」は「台湾ドル」と明記（例: 74,900台湾ドル）
- 中国語の慣用表現を自然な日本語に変える（限時→期間限定、優惠→割引/セール、精品→高級/プレミアム、拿鐵→ラテ、買2送2→2個買うと2個無料、買一送一→1個買うと1個無料、上架→リリース、評估→評価、方案→計画、措施→措置、營收→売上高、虧損→赤字、獲利→黒字、產能→生産能力、良率→歩留まり、晶片→チップ、晶圓代工→ファウンドリ、首映→封切り、票房→興行収入）
- 【最終チェック】全出力テキストを1文ずつ確認し、中国語の文や未翻訳の語句が残っていないか検証すること。固有名詞として残した中国語はglossaryで補足する

## 台湾固有名詞の用語解説ルール（厳守・全記事共通）
記事本文中には括弧注を入れず、そのまま記載する。
代わりに、各記事オブジェクトにglossary配列を含め、その記事に登場する台湾の固有名詞で日本人読者が知らない可能性が高いものを解説する。

### glossary配置の厳格ルール（最重要）
glossaryは「その用語が実際に登場する記事」のglossary配列に入れること。これは絶対に守ること。
- ある用語がheadlines[2]の記事に登場したなら、headlines[2].glossaryに入れる
- business.articles[0]に登場したなら、business.articles[0].glossaryに入れる
- 他のセクションや他の記事のglossaryに入れてはならない
- 用語解説はUI上で各記事の直下に表示される。間違った記事に紐づけると、読者が「この記事にない用語の解説がなぜここに？」と混乱する
- glossaryを生成する際は、必ずその記事の本文（headline, excerpt, lead, body）を再確認し、本文中に登場する用語だけを含めること

glossaryの各アイテムのフォーマット:
{ "term": "用語", "reading": "カタカナ読み", "explanation": "簡潔な説明" }

解説の例:
- { "term": "行政院", "explanation": "台湾の内閣に相当する最高行政機関" }
- { "term": "経済部", "explanation": "日本の経済産業省に相当" }
- { "term": "郭智輝", "reading": "グオ・ジーフイ", "explanation": "現経済部長" }
- { "term": "楠梓", "reading": "ナンズー", "explanation": "高雄市北部の区。半導体工場が集積" }
- { "term": "悠遊カード", "reading": "ヨウヨウカード", "explanation": "台湾版Suica" }

解説の基準:
- 日本人が知らなそうなもの全般を対象とする
- 台北、台湾、TSMCなど日本でも広く知られているものには不要
- 人名には読み方（reading）を必ず付ける
- 地名・機関名には「日本でいう○○」のような対比があると分かりやすい
- 1記事あたり3〜6語程度が目安。多すぎると読みにくい
- 同じ号の中で既に解説済みの語は省略してよい
- readingは人名・地名など読み方が分からないものに付ける。不要な場合は省略可

## カテゴリ分類ルール（厳守）
各記事を以下のカテゴリに正確に分類してください:
- POLITICS: 政治、外交、軍事、安全保障、国際関係、国際機関（SCO、NATO、ASEAN等）
- ECONOMY: 経済、金融、株価、為替、貿易、企業業績
- TECH: テクノロジー、IT、半導体、AI、スタートアップ
- TREND: 今話題の店・サービス・SNSバズ・PTT人気トピック・新店オープン・流行
- CULTURE: 芸術、音楽、映画、祭り、伝統文化、観光イベント（政治・経済・軍事は絶対にCULTUREにしない）
- LIFE: 生活、天気、交通、食、旅行、教育

## 記事の重複禁止（最重要・厳守）
同じ記事・同じトピックを複数のセクションで使うことは絶対に禁止。これは購読体験を著しく損なう最悪のミスである。
- heroで使った記事は、headlines・business・culture・lifeInTaiwanのいずれにも使ってはならない
- headlinesで使った記事は、business・culture・lifeInTaiwanに使ってはならない
- 同じ企業・同じ出来事を別の角度から取り上げるのも禁止（例: heroでTSMCの2nm量産を報じたら、businessでもTSMCの2nm記事を出すのはNG）
- 【最終チェック】JSON出力前に全セクションの記事を横断確認し、トピックの重複がないことを検証すること

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
  const now = new Date();
  const taiwanOffset = 8 * 60;
  const taiwanTime = new Date(now.getTime() + (taiwanOffset + now.getTimezoneOffset()) * 60000);
  const dateStr = formatJapaneseDate(taiwanTime);
  const dayOfWeek = ["日", "月", "火", "水", "木", "金", "土"][taiwanTime.getDay()];

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
    "source": { "name": "出典メディア名", "url": "記事URL" },
    "glossary": [
      { "term": "用語", "reading": "カタカナ読み（任意）", "explanation": "簡潔な説明" }
    ]
  },
  "headlines": [
    {
      "category": "CATEGORY",
      "headline": "見出し（日本語、20字以内）",
      "excerpt": "要約（日本語、80〜100字）",
      "source": { "name": "出典名", "url": "URL" },
      "glossary": [
        { "term": "用語", "reading": "カタカナ読み（任意）", "explanation": "簡潔な説明" }
      ]
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
        "source": { "name": "出典名", "url": "URL" },
        "glossary": [
          { "term": "用語", "reading": "カタカナ読み（任意）", "explanation": "簡潔な説明" }
        ]
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
        "source": { "name": "出典名", "url": "URL" },
        "glossary": [
          { "term": "用語", "reading": "カタカナ読み（任意）", "explanation": "簡潔な説明" }
        ]
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
        "category": "TREND",
        "headline": "見出し（話題の店・サービス・SNSバズ等）",
        "excerpt": "要約（具体的な店名・サービス名を含める）",
        "source": { "name": "出典名", "url": "URL" },
        "glossary": [
          { "term": "用語", "reading": "カタカナ読み（任意）", "explanation": "簡潔な説明" }
        ]
      }
    ],
    "articles": [
      {
        "category": "CULTURE",
        "headline": "見出し",
        "source": { "name": "出典名", "url": "URL" },
        "glossary": [
          { "term": "用語", "reading": "カタカナ読み（任意）", "explanation": "簡潔な説明" }
        ]
      }
    ]
  },
  "lifeInTaiwan": {
    "articles": [
      {
        "category": "LIFE",
        "headline": "見出し",
        "excerpt": "要約",
        "source": { "name": "出典名", "url": "URL" },
        "glossary": [
          { "term": "用語", "reading": "カタカナ読み（任意）", "explanation": "簡潔な説明" }
        ]
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
- business.metricsは3本、business.articlesは最大3本（ビジネスニュースを優先的に配置）
- japanEntry.metricsは3本、japanEntry.cardsは2本（successとstruggleを1つずつ）
- japanEntry.articlesは1本
- culture.featuredは最大2本（台湾トレンド。話題の店・サービス・SNSバズなど台湾の「今」が伝わる記事を優先）、culture.articlesは1本
- lifeInTaiwan.articlesは1本
- RSS記事にない情報は使わない（japanEntryのcardsとcaseStudyは既知の一般的事実でOK）
- 全sourceにnameとurlを含める（urlがない場合は空文字）
- imagePromptは英語40語以内
- 各記事のglossaryは、その記事に登場する台湾固有名詞の解説（1記事あたり3〜6語目安）。該当がなければ空配列[]
- 記事本文中には括弧注を入れない。固有名詞はそのまま記載し、解説は各記事のglossaryにまとめる

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
