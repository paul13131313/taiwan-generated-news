import { notFound } from "next/navigation";
import { getIssueByDate } from "@/lib/redis";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ date: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { date } = await params;
  return {
    title: `台灣生成新聞 — ${date}`,
    description: `${date}の台湾ニュースをAIが日本語で要約。`,
  };
}

export default async function IssuePage({ params }: Props) {
  const { date } = await params;

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    notFound();
  }

  const html = await getIssueByDate(date);
  if (!html) {
    notFound();
  }

  // Return the stored HTML as a full page
  return (
    <div
      dangerouslySetInnerHTML={{ __html: html }}
      suppressHydrationWarning
    />
  );
}
