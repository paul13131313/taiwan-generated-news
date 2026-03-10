import { Redis } from "@upstash/redis";

// 台湾時間（UTC+8）の今日の日付を返す
export function getTaiwanToday(): string {
  const now = new Date();
  const taiwanOffset = 8 * 60; // UTC+8 in minutes
  const taiwanTime = new Date(now.getTime() + (taiwanOffset + now.getTimezoneOffset()) * 60000);
  const y = taiwanTime.getFullYear();
  const m = String(taiwanTime.getMonth() + 1).padStart(2, "0");
  const d = String(taiwanTime.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function createRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

const redis = createRedis();

function requireRedis(): Redis {
  if (!redis) throw new Error("Redis is not configured (UPSTASH_REDIS_REST_URL / TOKEN missing)");
  return redis;
}

export function isRedisAvailable(): boolean {
  return redis !== null;
}

// ===== Issue Storage =====

const ISSUE_TTL = 90 * 24 * 60 * 60; // 90 days

export async function storeIssue(date: string, html: string): Promise<void> {
  const r = requireRedis();
  await r.set(`we-news:${date}`, html, { ex: ISSUE_TTL });
  await r.set("we-news:latest-date", date);
}

export async function getIssueByDate(date: string): Promise<string | null> {
  return requireRedis().get<string>(`we-news:${date}`);
}

export async function getLatestDate(): Promise<string | null> {
  if (!redis) return null;
  return redis.get<string>("we-news:latest-date");
}

export async function issueExists(date: string): Promise<boolean> {
  return (await requireRedis().exists(`we-news:${date}`)) === 1;
}

// ===== Issue Counter =====

export async function incrementIssueCounter(): Promise<number> {
  return requireRedis().incr("we-news:issue-counter");
}

export async function getIssueCounter(): Promise<number> {
  const val = await requireRedis().get<number>("we-news:issue-counter");
  return val ?? 0;
}

export async function resetIssueCounter(startFrom: number = 0): Promise<void> {
  await requireRedis().set("we-news:issue-counter", startFrom);
}

// ===== Delivery Status =====

export interface DeliveryStatus {
  date: string;
  issueNumber: string;
  sentAt: string;
  success: number;
  failed: number;
  totalSubscribers: number;
}

export async function saveDeliveryStatus(status: DeliveryStatus): Promise<void> {
  await requireRedis().set("we-news:last-send", JSON.stringify(status));
}

export async function getDeliveryStatus(): Promise<DeliveryStatus | null> {
  const val = await requireRedis().get<string>("we-news:last-send");
  if (!val) return null;
  return typeof val === "string" ? JSON.parse(val) : val as unknown as DeliveryStatus;
}

// ===== Subscribers =====

export async function addSubscriber(email: string): Promise<void> {
  const r = requireRedis();
  await r.sadd("subscribers:list", email);
  await r.set(`subscriber:${email}`, JSON.stringify({
    email,
    createdAt: new Date().toISOString(),
  }));
}

export async function removeSubscriber(email: string): Promise<void> {
  const r = requireRedis();
  await r.srem("subscribers:list", email);
  await r.del(`subscriber:${email}`);
}

export async function listSubscribers(): Promise<string[]> {
  if (!redis) return [];
  const members = await redis.smembers("subscribers:list");
  return members as string[];
}

export async function subscriberCount(): Promise<number> {
  if (!redis) return 0;
  return redis.scard("subscribers:list");
}

// ===== Past Issues List =====

export async function listIssues(): Promise<string[]> {
  if (!redis) return [];
  const keys = await redis.keys("we-news:2*");
  return keys
    .map((k) => k.replace("we-news:", ""))
    .sort()
    .reverse();
}

export default redis;
