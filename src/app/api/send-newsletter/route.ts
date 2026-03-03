import { NextResponse } from "next/server";
import { getIssueByDate, getLatestDate, listSubscribers } from "@/lib/redis";
import { sendNewsletter, sendTestEmail } from "@/lib/email";
import type { TaiwanNewsData } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = request.headers.get("x-cron-secret");
    const isAuthorized =
      authHeader === `Bearer ${process.env.ADMIN_PASSWORD}` ||
      cronSecret === process.env.CRON_SECRET;

    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const testEmail = body.testEmail as string | undefined;

    // Get today's issue
    const latestDate = await getLatestDate();
    if (!latestDate) {
      return NextResponse.json(
        { error: "No issue available to send" },
        { status: 404 }
      );
    }

    const html = await getIssueByDate(latestDate);
    if (!html) {
      return NextResponse.json(
        { error: "Issue HTML not found in Redis" },
        { status: 404 }
      );
    }

    // Extract basic data from HTML for email teaser
    const newsData = extractDataFromHTML(html);

    if (testEmail) {
      // Send test email to specified address
      await sendTestEmail(testEmail, newsData, latestDate);
      return NextResponse.json({
        success: true,
        type: "test",
        to: testEmail,
        date: latestDate,
      });
    }

    // Send to all subscribers
    const subscribers = await listSubscribers();
    if (subscribers.length === 0) {
      return NextResponse.json({
        message: "No subscribers to send to",
        date: latestDate,
      });
    }

    const result = await sendNewsletter(subscribers, newsData, latestDate);
    return NextResponse.json({
      type: "broadcast",
      date: latestDate,
      ...result,
    });
  } catch (e) {
    console.error("Send newsletter error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// Extract minimal data from stored HTML for email teaser
function extractDataFromHTML(html: string): TaiwanNewsData {
  const titleMatch = html.match(/<title>台灣生成新聞 (No\. \d+) — (.+?)<\/title>/);
  const heroHeadlineMatch = html.match(/<article class="hero">[\s\S]*?<h1>(.+?)<\/h1>/);
  const heroLeadMatch = html.match(/<p class="lead">(.+?)<\/p>/);
  const heroCategoryMatch = html.match(/<span class="tag">(.+?)<\/span>/);

  // Extract headlines
  const headlineMatches = [...html.matchAll(/<div class="hl-body">\s*<span class="hl-tag">(.+?)<\/span>\s*<h3>(.+?)<\/h3>/g)];

  return {
    date: titleMatch?.[2] || new Date().toISOString().split("T")[0],
    issueNumber: titleMatch?.[1] || "No. 001",
    weather: { taipei: { temp: 25, condition: "晴" }, kaohsiung: { temp: 27, condition: "晴" } },
    stockData: {
      twdJpy: { value: "4.80", delta: "", direction: "flat" },
      taiex: { value: "22000", delta: "", direction: "flat" },
    },
    hero: {
      category: heroCategoryMatch?.[1] || "NEWS",
      headline: heroHeadlineMatch?.[1] || "本日のニュース",
      lead: heroLeadMatch?.[1] || "",
      source: { name: "", url: "" },
    },
    headlines: headlineMatches.slice(0, 5).map((m) => ({
      category: m[1],
      headline: m[2],
      source: { name: "", url: "" },
    })),
    trivia: { label: "", title: "", body: "" },
    business: { metrics: [], articles: [], bizWord: { label: "", title: "", body: "" } },
    japanEntry: {
      metrics: [], cards: [], articles: [],
      caseStudy: { label: "", title: "", body: "", source: { name: "", url: "" } },
      trendWatch: { label: "", title: "", body: "" },
    },
    culture: { featured: [], articles: [] },
    lifeInTaiwan: { articles: [], lifeTip: { label: "", title: "", body: "" } },
    imagePrompt: "",
  };
}
