import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://taiwan-generated-news.vercel.app"),
  title: "台灣生成新聞 — 台湾トレンドキュレーション",
  description: "台湾カルチャーの「今」と「歴史」をAIが毎朝キュレーション。カフェ、コスメ、SNSバズ、台湾文化史コラムまで。日本人のための台湾トレンド新聞。",
  openGraph: {
    title: "台灣生成新聞 — 台湾トレンドキュレーション",
    description: "台湾カルチャーの「今」と「歴史」をAIが毎朝キュレーション。カフェ、コスメ、SNSバズ、台湾文化史コラムまで。",
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800;900&family=Noto+Sans+JP:wght@400;500;700;900&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
