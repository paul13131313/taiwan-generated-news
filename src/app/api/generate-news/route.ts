import { NextResponse } from "next/server";
import { fetchAllFeeds } from "@/lib/rss";
import { generateNewspaper } from "@/lib/translate";
import { generateHeroImage } from "@/lib/image";
import { generateNewsHTML } from "@/lib/template";
import { storeIssue, incrementIssueCounter, issueExists, getTaiwanToday } from "@/lib/redis";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    // Auth check
    const authHeader = request.headers.get("authorization");
    const cronSecret = request.headers.get("x-cron-secret");
    const isAuthorized =
      authHeader === `Bearer ${process.env.ADMIN_PASSWORD}` ||
      cronSecret === process.env.CRON_SECRET;

    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = getTaiwanToday();
    console.log(`[generate] Taiwan date: ${today}`);

    // Check for duplicate generation
    const forceParam = new URL(request.url).searchParams.get("force");
    if (!forceParam && await issueExists(today)) {
      console.log(`[generate] Issue already exists for ${today}, skipping`);
      return NextResponse.json({
        message: "Issue already exists for today",
        date: today,
        skipped: true,
      });
    }

    // Step 1: Fetch RSS articles
    const articles = await fetchAllFeeds();

    if (articles.length === 0) {
      return NextResponse.json(
        { error: "No articles fetched from RSS feeds" },
        { status: 500 }
      );
    }

    // Step 2: Increment issue counter
    const issueNumber = await incrementIssueCounter();

    // Step 3: Call Claude API for content generation
    const newsData = await generateNewspaper(articles, issueNumber);

    // Step 4: Generate hero image
    const heroImageUrl = await generateHeroImage(newsData.imagePrompt);
    if (heroImageUrl) {
      newsData.heroImageUrl = heroImageUrl;
    }

    // Step 5: Generate HTML
    const html = generateNewsHTML(newsData);

    // Step 6: Store in Redis
    await storeIssue(today, html);

    return NextResponse.json({
      success: true,
      date: today,
      issueNumber: newsData.issueNumber,
      articlesCount: articles.length,
      heroImage: !!heroImageUrl,
      htmlSize: html.length,
    });
  } catch (e) {
    console.error("Generate news error:", e);
    return NextResponse.json(
      { error: String(e) },
      { status: 500 }
    );
  }
}
