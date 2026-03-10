"use client";

import { useState, useEffect, useCallback } from "react";

interface Subscriber {
  email: string;
}

interface IssueInfo {
  date: string;
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  const [subscribers, setSubscribers] = useState<string[]>([]);
  const [subCount, setSubCount] = useState(0);
  const [newEmail, setNewEmail] = useState("");

  const [issues, setIssues] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [issueCounter, setIssueCounter] = useState<number | null>(null);

  const authHeader = `Bearer ${password}`;

  const handleLogin = async () => {
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setAuthenticated(true);
        setAuthError("");
      } else {
        setAuthError("パスワードが違います");
      }
    } catch {
      setAuthError("接続エラー");
    }
  };

  const loadData = useCallback(async () => {
    try {
      const [subRes, counterRes] = await Promise.all([
        fetch("/api/subscribers", { headers: { Authorization: authHeader } }),
        fetch("/api/reset-counter", { headers: { Authorization: authHeader } }),
      ]);

      if (subRes.ok) {
        const data = await subRes.json();
        setSubscribers(data.subscribers || []);
        setSubCount(data.count || 0);
      }
      if (counterRes.ok) {
        const data = await counterRes.json();
        setIssueCounter(data.currentValue ?? 0);
      }
    } catch (e) {
      console.error("Load data error:", e);
    }
  }, [authHeader]);

  useEffect(() => {
    if (authenticated) loadData();
  }, [authenticated, loadData]);

  const addSubscriber = async () => {
    if (!newEmail) return;
    await fetch("/api/subscribers", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: authHeader },
      body: JSON.stringify({ email: newEmail }),
    });
    setNewEmail("");
    loadData();
  };

  const removeSubscriber = async (email: string) => {
    await fetch("/api/subscribers", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Authorization: authHeader },
      body: JSON.stringify({ email }),
    });
    loadData();
  };

  const resetCounter = async () => {
    if (!confirm("号数カウンターを0にリセットします。次回発行がNo.001になります。よろしいですか？")) return;
    try {
      const res = await fetch("/api/reset-counter", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: authHeader },
        body: JSON.stringify({ startFrom: 0 }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMsg(data.message);
        setIssueCounter(data.currentValue);
      } else {
        setStatusMsg(`エラー: ${data.error}`);
      }
    } catch (e) {
      setStatusMsg(`エラー: ${e}`);
    }
  };

  const generateNow = async () => {
    setGenerating(true);
    setStatusMsg("生成中...");
    try {
      const res = await fetch("/api/generate-news?force=1", {
        method: "POST",
        headers: { Authorization: authHeader },
      });
      const data = await res.json();
      setStatusMsg(res.ok ? `生成完了！ (${data.date})` : `エラー: ${data.error}`);
    } catch (e) {
      setStatusMsg(`エラー: ${e}`);
    }
    setGenerating(false);
  };

  const sendTest = async () => {
    if (!testEmail) return;
    setSending(true);
    setStatusMsg("テスト送信中...");
    try {
      const res = await fetch("/api/send-newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: authHeader },
        body: JSON.stringify({ testEmail }),
      });
      const data = await res.json();
      setStatusMsg(res.ok ? `テスト送信完了 → ${testEmail}` : `エラー: ${data.error}`);
    } catch (e) {
      setStatusMsg(`エラー: ${e}`);
    }
    setSending(false);
  };

  const sendAll = async () => {
    setSending(true);
    setStatusMsg("全員に配信中...");
    try {
      const res = await fetch("/api/send-newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: authHeader },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      setStatusMsg(
        res.ok
          ? `配信完了！ 成功: ${data.success}, 失敗: ${data.failed}`
          : `エラー: ${data.error}`
      );
    } catch (e) {
      setStatusMsg(`エラー: ${e}`);
    }
    setSending(false);
  };

  // ===== Login Screen =====
  if (!authenticated) {
    return (
      <div style={styles.loginContainer}>
        <div style={styles.loginBox}>
          <h1 style={styles.loginTitle}>台灣生成新聞</h1>
          <p style={styles.loginSub}>管理画面</p>
          <input
            type="password"
            placeholder="パスワード"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            style={styles.input}
          />
          <button onClick={handleLogin} style={styles.btnPrimary}>
            ログイン
          </button>
          {authError && <p style={styles.error}>{authError}</p>}
        </div>
      </div>
    );
  }

  // ===== Admin Dashboard =====
  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.headerTitle}>台灣生成新聞 管理画面</h1>
        <span style={styles.headerSub}>We TAIWAN</span>
      </header>

      {statusMsg && (
        <div style={styles.statusBar}>{statusMsg}</div>
      )}

      {/* Issue Counter */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>号数管理</h2>
        <div style={styles.row}>
          <span style={{ fontSize: "0.85rem", color: "#ccc" }}>
            現在のカウンター: <strong style={{ color: "#fff", fontFamily: "monospace" }}>{issueCounter ?? "..."}</strong>
            　→ 次回発行: <strong style={{ color: "#ff4200", fontFamily: "monospace" }}>No. {issueCounter !== null ? String(issueCounter + 1).padStart(3, "0") : "..."}</strong>
          </span>
          <button onClick={resetCounter} style={styles.btnDanger}>
            リセット（No.001から）
          </button>
        </div>
      </section>

      {/* Generation Controls */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>新聞生成</h2>
        <div style={styles.row}>
          <button
            onClick={generateNow}
            disabled={generating}
            style={{ ...styles.btnPrimary, opacity: generating ? 0.5 : 1 }}
          >
            {generating ? "生成中..." : "今すぐ生成"}
          </button>
          <a
            href="/latest"
            target="_blank"
            style={styles.btnSecondary}
          >
            最新号プレビュー ↗
          </a>
        </div>
      </section>

      {/* Email Controls */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>メール配信</h2>
        <div style={styles.row}>
          <input
            type="email"
            placeholder="テスト送信先メールアドレス"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            style={{ ...styles.input, flex: 1 }}
          />
          <button
            onClick={sendTest}
            disabled={sending}
            style={styles.btnSecondary}
          >
            テスト送信
          </button>
        </div>
        <button
          onClick={sendAll}
          disabled={sending}
          style={{ ...styles.btnPrimary, marginTop: 12 }}
        >
          {sending ? "配信中..." : `全読者に配信（${subCount}人）`}
        </button>
      </section>

      {/* Subscribers */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>読者一覧（{subCount}人）</h2>
        <div style={styles.row}>
          <input
            type="email"
            placeholder="新規メールアドレス"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addSubscriber()}
            style={{ ...styles.input, flex: 1 }}
          />
          <button onClick={addSubscriber} style={styles.btnSecondary}>
            追加
          </button>
        </div>
        <div style={styles.subscriberList}>
          {subscribers.map((email) => (
            <div key={email} style={styles.subscriberRow}>
              <span style={styles.subscriberEmail}>{email}</span>
              <button
                onClick={() => removeSubscriber(email)}
                style={styles.btnDanger}
              >
                削除
              </button>
            </div>
          ))}
          {subscribers.length === 0 && (
            <p style={styles.empty}>まだ読者がいません</p>
          )}
        </div>
      </section>

      {/* Preview iframe */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>最新号プレビュー</h2>
        <iframe
          src="/latest"
          style={styles.iframe}
          title="最新号プレビュー"
        />
      </section>
    </div>
  );
}

// ===== Styles =====
const styles: Record<string, React.CSSProperties> = {
  loginContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    background: "#0a0a0a",
    fontFamily: "'Noto Sans JP', system-ui, sans-serif",
  },
  loginBox: {
    textAlign: "center",
    padding: 48,
    background: "#151515",
    borderRadius: 8,
    border: "1px solid #2a2a2a",
    width: 360,
  },
  loginTitle: {
    fontFamily: "'Noto Serif TC', serif",
    fontSize: "1.5rem",
    fontWeight: 900,
    color: "#fff",
    letterSpacing: "0.15em",
  },
  loginSub: {
    fontSize: "0.75rem",
    color: "#666",
    marginTop: 6,
    marginBottom: 24,
  },
  container: {
    maxWidth: 800,
    margin: "0 auto",
    padding: "24px 20px",
    background: "#0a0a0a",
    minHeight: "100vh",
    fontFamily: "'Noto Sans JP', system-ui, sans-serif",
    color: "#e0e0e0",
  },
  header: {
    borderBottom: "1px solid #2a2a2a",
    paddingBottom: 16,
    marginBottom: 24,
    display: "flex",
    alignItems: "baseline",
    gap: 12,
  },
  headerTitle: {
    fontSize: "1.2rem",
    fontWeight: 900,
    color: "#fff",
  },
  headerSub: {
    fontSize: "0.7rem",
    fontWeight: 700,
    color: "#ff4200",
    fontFamily: "Montserrat, sans-serif",
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
  },
  statusBar: {
    padding: "10px 16px",
    background: "#1a1a2e",
    border: "1px solid #2a2a4a",
    borderRadius: 6,
    fontSize: "0.82rem",
    color: "#8888ff",
    marginBottom: 20,
  },
  section: {
    marginBottom: 32,
    padding: 20,
    background: "#151515",
    borderRadius: 8,
    border: "1px solid #2a2a2a",
  },
  sectionTitle: {
    fontSize: "0.85rem",
    fontWeight: 700,
    color: "#ff4200",
    fontFamily: "Montserrat, sans-serif",
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    marginBottom: 14,
  },
  row: {
    display: "flex",
    gap: 10,
    alignItems: "center",
  },
  input: {
    padding: "10px 14px",
    background: "#1a1a1a",
    border: "1px solid #333",
    borderRadius: 4,
    color: "#e0e0e0",
    fontSize: "0.85rem",
    outline: "none",
    width: "100%",
  },
  btnPrimary: {
    padding: "10px 24px",
    background: "#ff4200",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    fontSize: "0.82rem",
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
  },
  btnSecondary: {
    padding: "10px 20px",
    background: "transparent",
    color: "#ff4200",
    border: "1px solid #ff4200",
    borderRadius: 4,
    fontSize: "0.82rem",
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
    textDecoration: "none",
    display: "inline-block",
  },
  btnDanger: {
    padding: "4px 12px",
    background: "transparent",
    color: "#ff4444",
    border: "1px solid #ff4444",
    borderRadius: 3,
    fontSize: "0.72rem",
    cursor: "pointer",
  },
  subscriberList: {
    marginTop: 14,
    borderTop: "1px solid #2a2a2a",
  },
  subscriberRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 0",
    borderBottom: "1px solid #1a1a1a",
  },
  subscriberEmail: {
    fontSize: "0.82rem",
    color: "#ccc",
    fontFamily: "monospace",
  },
  empty: {
    padding: "16px 0",
    color: "#555",
    fontSize: "0.82rem",
    textAlign: "center" as const,
  },
  error: {
    color: "#ff4444",
    fontSize: "0.8rem",
    marginTop: 12,
  },
  iframe: {
    width: "100%",
    height: 600,
    border: "1px solid #2a2a2a",
    borderRadius: 4,
    background: "#fff",
  },
};
