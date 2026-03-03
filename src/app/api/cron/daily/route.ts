import { NextResponse } from "next/server";

export const maxDuration = 120;

export async function GET(request: Request) {
  // Verify Vercel Cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

    if (!genRes.ok) {
      return NextResponse.json(
        { error: "Generation failed", detail: genResult },
        { status: 500 }
      );
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
