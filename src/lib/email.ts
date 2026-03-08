import { Resend } from "resend";
import type { TaiwanNewsData } from "./types";

function createResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null as unknown as Resend;
  return new Resend(key);
}

const resend = createResend();

const BASE_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export async function sendNewsletter(
  subscribers: string[],
  data: TaiwanNewsData,
  issueDate: string
): Promise<{ success: number; failed: number }> {
  const issueUrl = `${BASE_URL}/issues/${issueDate}`;
  const { html, text } = buildTeaserEmail(data, issueUrl);
  const subject = `台灣生成新聞 ${data.issueNumber} — ${data.date}｜We TAIWAN`;

  let success = 0;
  let failed = 0;

  // Send in batches of 50
  for (let i = 0; i < subscribers.length; i += 50) {
    const batch = subscribers.slice(i, i + 50);

    try {
      const fromAddress = "台灣生成新聞 <news@seiseishinbun.com>";
      const result = await resend.batch.send(
        batch.map((to) => ({
          from: fromAddress,
          to,
          subject,
          html,
          text,
        }))
      );
      console.log("[email] Resend response:", JSON.stringify(result));
      console.log("[email] Sending to:", batch.join(", "), "from:", fromAddress);
      success += batch.length;
    } catch (e) {
      console.error("Batch send failed:", e);
      failed += batch.length;
    }
  }

  return { success, failed };
}

export async function sendTestEmail(
  to: string,
  data: TaiwanNewsData,
  issueDate: string
): Promise<void> {
  const issueUrl = `${BASE_URL}/issues/${issueDate}`;
  const { html, text } = buildTeaserEmail(data, issueUrl);

  const fromAddress = "台灣生成新聞 <news@seiseishinbun.com>";
  console.log("[email] Sending to:", to, "from:", fromAddress);
  const result = await resend.emails.send({
    from: fromAddress,
    to,
    subject: `[TEST] 台灣生成新聞 ${data.issueNumber} — ${data.date}`,
    html,
    text,
  });
  console.log("[email] Resend response:", JSON.stringify(result));
}

function buildTeaserEmail(
  data: TaiwanNewsData,
  issueUrl: string
): { html: string; text: string } {
  // Build article preview list from cafeGourmet + beautyBrand
  const previewArticles = [
    ...data.cafeGourmet.articles,
    ...data.beautyBrand.articles,
  ].slice(0, 3);

  const articleList = previewArticles
    .map((a) => `<li style="margin-bottom:8px;font-size:14px;color:#333;">${esc(a.title)}</li>`)
    .join("");

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f0f0f0;font-family:'Noto Sans JP',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f0f0;padding:24px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">

<tr><td style="height:3px;background:#e85d3a;"></td></tr>

<tr><td style="padding:28px 32px 0;text-align:center;">
  <div style="font-size:22px;font-weight:900;letter-spacing:0.08em;color:#1a1a1a;">台灣生成新聞</div>
  <div style="margin-top:4px;font-family:Montserrat,sans-serif;font-size:10px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#e85d3a;">Taiwan Trend Curation</div>
  <div style="margin-top:10px;font-size:12px;color:#999;">${esc(data.issueNumber)} · ${esc(data.date)}</div>
</td></tr>

<tr><td style="padding:24px 32px;">
  <div style="font-family:Montserrat,sans-serif;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#e85d3a;">Today's Trend</div>
  <h1 style="margin:6px 0 0;font-size:20px;font-weight:900;line-height:1.5;color:#1a1a1a;">${esc(data.todayTrend.title)}</h1>
  <p style="margin-top:10px;font-size:14px;line-height:1.8;color:#333;">${esc(data.todayTrend.lead)}</p>
</td></tr>

${articleList ? `<tr><td style="padding:0 32px;">
  <div style="border-top:1px solid #eee;padding-top:16px;">
    <div style="font-family:Montserrat,sans-serif;font-size:10px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#e85d3a;margin-bottom:10px;">PICK UP</div>
    <ul style="list-style:none;padding:0;margin:0;">${articleList}</ul>
  </div>
</td></tr>` : ""}

<tr><td style="padding:24px 32px;text-align:center;">
  <a href="${esc(issueUrl)}" style="display:inline-block;padding:14px 40px;background:#1a1a1a;color:#ffffff;font-family:Montserrat,sans-serif;font-size:13px;font-weight:700;letter-spacing:0.04em;text-decoration:none;border-radius:6px;">全文を読む →</a>
</td></tr>

<tr><td style="padding:20px 32px;background:#fafafa;border-top:1px solid #eee;">
  <div style="text-align:center;">
    <div style="font-size:11px;color:#999;margin-bottom:6px;">台湾進出・越境ビジネスのご相談</div>
    <a href="https://wewewetw.jp/" style="font-family:Montserrat,sans-serif;font-size:12px;font-weight:700;color:#e85d3a;text-decoration:none;">想像以上有限公司（We TAIWAN）→</a>
  </div>
  <div style="margin-top:12px;text-align:center;font-size:10px;color:#ccc;">
    各記事の著作権は原著作者に帰属します
  </div>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;

  const text = `台灣生成新聞 ${data.issueNumber} — ${data.date}

【Today's Trend】${data.todayTrend.title}
${data.todayTrend.lead}

${previewArticles.length > 0 ? `PICK UP:
${previewArticles.map((a) => `- ${a.title}`).join("\n")}` : ""}

全文はこちら: ${issueUrl}

---
台灣生成新聞 | Taiwan Trend Curation
https://wewewetw.jp/`;

  return { html, text };
}

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
