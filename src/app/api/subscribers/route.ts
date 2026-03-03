import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

import {
  addSubscriber,
  removeSubscriber,
  listSubscribers,
  subscriberCount,
} from "@/lib/redis";

function isAuthorized(request: Request): boolean {
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${process.env.ADMIN_PASSWORD}`;
}

// GET: List all subscribers (admin only)
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscribers = await listSubscribers();
  const count = await subscriberCount();

  return NextResponse.json({ subscribers, count });
}

// POST: Add subscriber
export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email required" },
        { status: 400 }
      );
    }

    await addSubscriber(email.toLowerCase().trim());
    return NextResponse.json({ success: true, email });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// DELETE: Remove subscriber (admin only)
export async function DELETE(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json(
        { error: "Email required" },
        { status: 400 }
      );
    }

    await removeSubscriber(email);
    return NextResponse.json({ success: true, email });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
