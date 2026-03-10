import { NextResponse } from "next/server";
import { getLatestDate, getIssueCounter, subscriberCount, getDeliveryStatus } from "@/lib/redis";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request): boolean {
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${process.env.ADMIN_PASSWORD}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [latestDate, counter, subCount, delivery] = await Promise.all([
      getLatestDate(),
      getIssueCounter(),
      subscriberCount(),
      getDeliveryStatus(),
    ]);

    const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000";

    return NextResponse.json({
      latestDate,
      latestIssueUrl: latestDate ? `${baseUrl}/issues/${latestDate}` : null,
      topPageUrl: baseUrl,
      currentCounter: counter,
      nextIssueNumber: `No. ${String(counter + 1).padStart(3, "0")}`,
      subscriberCount: subCount,
      lastDelivery: delivery,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
