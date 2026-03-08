import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://taiwan-generated-news.vercel.app"),
  title: "台灣生成新聞 — 台湾トレンドキュレーション",
  description: "台湾のカフェ、コスメ、SNSバズ、カルチャー。現地メディアのトレンドをAIが毎朝キュレーション。面白い・行きたい・欲しいが見つかるメディア。",
  openGraph: {
    title: "台灣生成新聞 — 台湾トレンドキュレーション",
    description: "台湾のカフェ、コスメ、SNSバズ、カルチャー。現地メディアのトレンドをAIが毎朝キュレーション。",
    type: "website",
    images: [{ url: "/ogp.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/ogp.png"],
  },
  icons: {
    icon: "/favicon.png",
    apple: "/icon-180.png",
  },
  manifest: "/manifest.json",
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
