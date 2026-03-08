import Anthropic from "@anthropic-ai/sdk";
import type { RSSArticle, TaiwanNewsData } from "./types";

function createClient() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null as unknown as Anthropic;
  return new Anthropic({ apiKey: key });
}

const client = createClient();

const SYSTEM_PROMPT = `あなたは「台湾トレンドメディア」の編集者です。
台湾のカルチャー・ライフスタイル・消費トレンドに精通しており、
それを日本人読者に向けて紹介する記事を書きます。

## あなたの姿勢
- ニュース記者ではなく、カルチャーマガジンの編集者
- 「面白い」「行きたい」「欲しい」と思わせる記事を書く
- 堅い政治・経済ニュースは扱わない
- 台湾のリアルな空気感を伝える

## 記事の書き方
- 導入は読者の興味を引くフックから入る（数字、問いかけ、意外な事実）
- 「なぜ今これが話題なのか」の文脈を必ず入れる
- 台湾現地の雰囲気が伝わる描写を入れる
- 日本人読者にとっての「だから何？」に答える（行ける、買える、試せる等）

## 翻訳ルール（最重要・厳守）
- 台湾メディアのソースを参照する際、中国語の一般用語は全て日本語に翻訳する
- 固有名詞（人名・会社名・サービス名・商品名・店名）は中国語のままでよい
- 一般用語が中国語のまま残っていないか最終チェックを行うこと
- 国名は全て日本語表記にする（美國→アメリカ、韓國→韓国 等）
- 人名は漢字のままでOKだが、初出時にカタカナ読みを（）で付ける
- 「元」は「台湾ドル」と明記
- 中国語の慣用表現を自然な日本語に変える

## 用語解説ルール
- 各記事の直下に用語解説（glossary）を設ける
- 台湾の固有名詞で日本人が知らない可能性が高いものに、読み方＋簡潔な説明をつける
- 人名には読み方（カタカナ）を必ず付ける
- 台北、台湾、TSMCなど広く知られているものには不要
- 1記事あたり3〜6語程度が目安

## 制約
- RSS記事に含まれる事実のみ使用。捏造厳禁
- JSONのみ出力。マークダウンのコードブロックは使わない
- 画像生成プロンプトは英語で、台湾カルチャーの雰囲気が伝わるスタイル指示を含める`;

export async function generateNewspaper(
  articles: RSSArticle[],
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
        `${i + 1}. [${a.category}/${a.source}] ${a.title} — ${a.summary} — URL: ${a.url}`
    )
    .join("\n");

  const userPrompt = `以下の台湾メディアRSS記事から、カルチャーマガジンの紙面を構成してください。

## 今日の情報
- 日付: ${dateStr}（${dayOfWeek}）
- 号数: No. ${String(issueNumber).padStart(3, "0")}

## RSS記事一覧
${articleList}

## 出力JSON構造

{
  "todayTrend": {
    "title": "キャッチーなタイトル（日本語）",
    "lead": "リード文（2〜3文、読者の興味を引くフックから入る）",
    "body": "本文（400〜600字。なぜ今話題なのかの文脈、台湾現地の雰囲気が伝わる描写、日本人にとっての意味を含める）",
    "glossary": [
      { "term": "用語", "reading": "カタカナ読み（任意）", "explanation": "簡潔な説明" }
    ]
  },
  "cafeGourmet": {
    "articles": [
      {
        "title": "タイトル（日本語）",
        "body": "本文（200〜400字。話題の新店、トレンドドリンク、台湾ローカルフード等）",
        "glossary": [
          { "term": "用語", "reading": "カタカナ読み（任意）", "explanation": "簡潔な説明" }
        ]
      }
    ]
  },
  "beautyBrand": {
    "articles": [
      {
        "title": "タイトル（日本語）",
        "body": "本文（200〜400字。台湾発コスメ、ファッション、デザインプロダクト等）",
        "glossary": [
          { "term": "用語", "reading": "カタカナ読み（任意）", "explanation": "簡潔な説明" }
        ]
      }
    ]
  },
  "snsBuzz": {
    "items": [
      {
        "title": "見出し（日本語）",
        "description": "解説（50〜100字。台湾SNSで今バズっていること）"
      }
    ],
    "glossary": [
      { "term": "用語", "reading": "カタカナ読み（任意）", "explanation": "簡潔な説明" }
    ]
  },
  "taiwanLooksAtJapan": {
    "title": "タイトル（日本語）",
    "body": "本文（200〜400字。台湾メディアが取り上げた日本関連の記事を台湾人の目線で紹介）",
    "glossary": [
      { "term": "用語", "reading": "カタカナ読み（任意）", "explanation": "簡潔な説明" }
    ]
  },
  "imagePrompt": "Hero image prompt in English, 40 words max. Vibrant, well-lit, Taiwan lifestyle/culture scene. Describe a concrete visual based on the todayTrend article (e.g., trendy cafe interior, night market scene, cosmetics display). No text overlay."
}

## 各コーナーの記事数
- todayTrend: 1本（その日最も面白いトレンド）
- cafeGourmet.articles: 1〜2本
- beautyBrand.articles: 1〜2本
- snsBuzz.items: 2〜3本
- taiwanLooksAtJapan: 1本
- 同じ記事・同じトピックを複数のコーナーで使うことは禁止

## todayTrend 選定基準
- 日本人が知らないが、知ったら興味を持ちそうなもの
- 台湾カルチャーの「今」が伝わるもの
- ビジュアルが想像できるもの（場所、商品、食べ物など）

## cafeGourmet テーマ例
- 話題の新店、行列店
- トレンドドリンク、スイーツ
- 台湾ローカルフード事情
- 日本未上陸の台湾グルメ

## beautyBrand テーマ例
- 台湾発コスメブランドの新商品
- 台湾デザイナー、クリエイター
- 台湾ブランドの海外進出
- コラボレーション

## snsBuzz 対象
- 台湾のThreads、Instagram、Dcard、PTT、Xで今バズっていること
- バイラル動画、ミーム、話題の投稿、ハッシュタグトレンド

## taiwanLooksAtJapan テーマ例
- 台湾人に人気の日本旅行先
- 台湾で話題の日本の商品・コンテンツ
- 日本文化に対する台湾人の反応
- 台湾人が意外に思う日本の習慣

## 重要
- RSS記事にない情報は使わない
- glossaryは該当がなければ空配列[]
- 記事本文中には括弧注を入れない。固有名詞はそのまま記載し、解説はglossaryにまとめる`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 6000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  const parsed = parseGeneratedJson(text);

  return {
    date: `${dateStr}（${dayOfWeek}）`,
    issueNumber: `No. ${String(issueNumber).padStart(3, "0")}`,
    ...parsed,
  };
}

function parseGeneratedJson(text: string): Omit<TaiwanNewsData, "date" | "issueNumber"> {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  }

  try {
    return JSON.parse(cleaned);
  } catch {
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
