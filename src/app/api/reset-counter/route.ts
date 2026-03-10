import { NextResponse } from "next/server";
import { resetIssueCounter, getIssueCounter } from "@/lib/redis";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request): boolean {
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${process.env.ADMIN_PASSWORD}`;
}

// GET: Get current counter value (admin only)
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const current = await getIssueCounter();
    return NextResponse.json({ currentValue: current });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// POST: Reset issue counter (admin only)
export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const startFrom = typeof body.startFrom === "number" ? body.startFrom : 0;

    await resetIssueCounter(startFrom);
    const current = await getIssueCounter();

    return NextResponse.json({
      success: true,
      message: `Counter reset to ${current}. Next issue will be No. ${String(current + 1).padStart(3, "0")}`,
      currentValue: current,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
