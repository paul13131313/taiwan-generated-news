import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "台灣生成新聞 | We TAIWAN",
  description: "台湾現地メディアの報道をAIが日本語で要約。台湾ビジネス・日本企業進出情報を毎日お届け。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
