import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(request: Request) {
  console.log("[cron] Request received");

  // Verify Vercel Cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.log("[cron] CRON_SECRET not set, skipping auth");
  } else if (authHeader !== "Bearer " + cronSecret) {
    console.log("[cron] Unauthorized. Header:", authHeader?.substring(0, 20));
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("[cron] Auth passed");

  const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000";

  try {
    // Step 1: Generate news
    const genRes = await fetch(`${baseUrl}/api/generate-news`, {
      method: "POST",
      headers: {
        "x-cron-secret": process.env.CRON_SECRET!,
        "Content-Type": "application/json",
      },
    });

    const genResult = await genRes.json();
    console.log("[cron] Generation result:", JSON.stringify(genResult));

    if (!genRes.ok) {
      return NextResponse.json(
        { error: "Generation failed", detail: genResult },
        { status: 500 }
      );
    }

    // 生成がスキップされた場合はメール配信しない
    if (genResult.skipped) {
      console.log("[cron] Generation skipped (already exists), not sending newsletter");
      return NextResponse.json({
        success: true,
        generation: genResult,
        newsletter: { skipped: true, reason: "No new issue generated" },
      });
    }

    // Step 2: Send newsletter
    const sendRes = await fetch(`${baseUrl}/api/send-newsletter`, {
      method: "POST",
      headers: {
        "x-cron-secret": process.env.CRON_SECRET!,
        "Content-Type": "application/json",
      },
    });

    const sendResult = await sendRes.json();

    return NextResponse.json({
      success: true,
      generation: genResult,
      newsletter: sendResult,
    });
  } catch (e) {
    console.error("Daily cron error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
