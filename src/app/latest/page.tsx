import { redirect } from "next/navigation";
import { getLatestDate } from "@/lib/redis";

export const dynamic = "force-dynamic";

export default async function LatestPage() {
  const latestDate = await getLatestDate();

  if (latestDate) {
    redirect(`/issues/${latestDate}`);
  }

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      fontFamily: "'Noto Sans JP', sans-serif",
      background: "#f6f6f6",
      color: "#060606",
    }}>
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 900 }}>台灣生成新聞</h1>
        <p style={{ marginTop: "12px", color: "#888", fontSize: "0.9rem" }}>
          まだ号が発行されていません。
        </p>
      </div>
    </div>
  );
}
