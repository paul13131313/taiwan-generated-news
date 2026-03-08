"use client";

import { useState } from "react";

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");

  const handleSubscribe = async () => {
    if (!email || !email.includes("@")) return;
    setStatus("submitting");
    try {
      const res = await fetch("/api/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.accentBar} />

        <div style={styles.masthead}>
          <h1 style={styles.title}>台灣生成新聞</h1>
          <p style={styles.sub}>TAIWAN TREND CURATION</p>
        </div>

        <div style={styles.content}>
          <p style={styles.desc}>
            台湾カルチャーの「今」と「歴史」を毎朝AIがキュレーション。<br />
            カフェ、コスメ、SNSバズから文化史コラムまで。<br />
            日本人のための台湾トレンド新聞。
          </p>

          <div style={styles.features}>
            <div style={styles.feature}>
              <span style={styles.featureIcon}>☕</span>
              <span>カフェ＆グルメ — 話題の新店・トレンドフード</span>
            </div>
            <div style={styles.feature}>
              <span style={styles.featureIcon}>💄</span>
              <span>ビューティー＆ブランド — 台湾発コスメ・デザイナー</span>
            </div>
            <div style={styles.feature}>
              <span style={styles.featureIcon}>📱</span>
              <span>SNSバズ — 台湾のSNSで今バズっていること</span>
            </div>
            <div style={styles.feature}>
              <span style={styles.featureIcon}>🇯🇵</span>
              <span>台湾人が見ている日本 — 逆視点コラム</span>
            </div>
            <div style={styles.feature}>
              <span style={styles.featureIcon}>🏛️</span>
              <span>台湾文化史 — 世界を動かした台湾カルチャーの解説</span>
            </div>
            <div style={styles.feature}>
              <span style={styles.featureIcon}>📧</span>
              <span>毎朝7時にメールでお届け</span>
            </div>
          </div>

          {status === "done" ? (
            <div style={styles.doneBox}>
              <p style={styles.doneText}>登録ありがとうございます！</p>
              <p style={styles.doneSub}>次号から配信されます。</p>
            </div>
          ) : (
            <div style={styles.subscribeBox}>
              <input
                type="email"
                placeholder="メールアドレスを入力"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubscribe()}
                style={styles.input}
              />
              <button
                onClick={handleSubscribe}
                disabled={status === "submitting"}
                style={styles.btn}
              >
                {status === "submitting" ? "登録中..." : "無料で購読する"}
              </button>
              {status === "error" && (
                <p style={styles.errorText}>登録に失敗しました。もう一度お試しください。</p>
              )}
            </div>
          )}

          <a href="/latest" style={styles.previewLink}>
            最新号を読む →
          </a>
        </div>

        <div style={styles.footer}>
          <p style={styles.footerBrand}>台灣生成新聞</p>
          <p style={styles.footerDesc}>
            運営:{" "}
            <a href="https://wewewetw.jp/" style={styles.footerLink}>
              想像以上有限公司（We TAIWAN）
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f0f0f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Noto Sans JP', system-ui, sans-serif",
    padding: "24px 16px",
  },
  container: {
    maxWidth: 520,
    width: "100%",
    background: "#fff",
    borderRadius: 12,
    boxShadow: "0 4px 40px rgba(0,0,0,0.06)",
    overflow: "hidden",
  },
  accentBar: { height: 3, background: "#e85d3a" },
  masthead: { padding: "40px 28px 0", textAlign: "center" as const },
  title: {
    fontWeight: 900,
    fontSize: "1.8rem",
    letterSpacing: "0.08em",
    color: "#1a1a1a",
  },
  sub: {
    marginTop: 6,
    fontFamily: "Montserrat, sans-serif",
    fontSize: "0.6rem",
    fontWeight: 600,
    letterSpacing: "0.12em",
    color: "#e85d3a",
  },
  content: { padding: "28px 28px 20px" },
  desc: {
    fontSize: "0.92rem",
    lineHeight: 2,
    color: "#333",
    textAlign: "center" as const,
  },
  features: {
    margin: "28px 0",
    display: "flex",
    flexDirection: "column" as const,
    gap: 10,
  },
  feature: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    fontSize: "0.88rem",
    color: "#333",
    padding: "10px 14px",
    background: "#fff4f1",
    borderRadius: 8,
  },
  featureIcon: { fontSize: "1.2rem", flexShrink: 0 },
  subscribeBox: { marginTop: 24, textAlign: "center" as const },
  input: {
    width: "100%",
    padding: "14px 16px",
    border: "1px solid #ddd",
    borderRadius: 8,
    fontSize: "0.92rem",
    outline: "none",
    marginBottom: 10,
  },
  btn: {
    width: "100%",
    padding: "14px 24px",
    background: "#1a1a1a",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: "0.92rem",
    fontWeight: 700,
    cursor: "pointer",
  },
  errorText: { color: "#e85d3a", fontSize: "0.82rem", marginTop: 8 },
  doneBox: {
    marginTop: 24,
    padding: 20,
    background: "#f0fff0",
    borderRadius: 8,
    textAlign: "center" as const,
  },
  doneText: { fontWeight: 700, color: "#2e7d32" },
  doneSub: { fontSize: "0.85rem", color: "#555", marginTop: 4 },
  previewLink: {
    display: "block",
    marginTop: 20,
    textAlign: "center" as const,
    fontFamily: "Montserrat, sans-serif",
    fontSize: "0.78rem",
    fontWeight: 700,
    color: "#e85d3a",
    textDecoration: "none",
  },
  footer: {
    padding: "20px 28px",
    borderTop: "1px solid #eee",
    textAlign: "center" as const,
  },
  footerBrand: {
    fontFamily: "Montserrat, sans-serif",
    fontSize: "0.65rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
    color: "#999",
  },
  footerDesc: { fontSize: "0.65rem", color: "#bbb", marginTop: 4 },
  footerLink: { color: "#bbb", textDecoration: "none" },
};
