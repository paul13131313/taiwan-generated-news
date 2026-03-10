import { NextResponse } from "next/server";
import { removeSubscriber } from "@/lib/redis";

export const dynamic = "force-dynamic";

// GET: Unsubscribe via email link (no auth required)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email || !email.includes("@")) {
    return new Response(unsubscribePageHtml("無効なリンクです。"), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  try {
    await removeSubscriber(email.toLowerCase().trim());
    return new Response(
      unsubscribePageHtml(`${email} の配信を解除しました。`),
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  } catch (e) {
    return new Response(
      unsubscribePageHtml("エラーが発生しました。しばらくしてから再度お試しください。"),
      { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
}

function unsubscribePageHtml(message: string): string {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>配信解除 — 台灣生成新聞</title>
  <style>
    body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center; background:#f0f0f0; font-family:'Noto Sans JP',sans-serif; }
    .card { background:#fff; border-radius:12px; padding:48px 40px; max-width:400px; text-align:center; box-shadow:0 2px 12px rgba(0,0,0,0.08); }
    .title { font-size:18px; font-weight:900; color:#1a1a1a; letter-spacing:0.05em; }
    .message { margin-top:16px; font-size:14px; color:#666; line-height:1.8; }
    .back { display:inline-block; margin-top:24px; font-size:13px; color:#e85d3a; text-decoration:none; font-weight:700; }
  </style>
</head>
<body>
  <div class="card">
    <div class="title">台灣生成新聞</div>
    <div class="message">${message}</div>
    <a class="back" href="/">トップページへ →</a>
  </div>
</body>
</html>`;
}
