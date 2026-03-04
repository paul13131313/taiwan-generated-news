import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://taiwan-generated-news.vercel.app"),
  title: "台灣生成新聞 | We TAIWAN",
  description: "台湾現地メディアの報道をAIが日本語で要約。台湾ビジネス・日本企業進出情報を毎日お届け。",
  openGraph: {
    title: "台灣生成新聞 | We TAIWAN",
    description: "台湾現地メディアの報道をAIが日本語で要約。台湾ビジネス・日本企業進出情報を毎日お届け。",
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
