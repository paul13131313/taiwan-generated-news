import type { MarketData, WeatherData } from "./types";

// ===== TWD/JPY Exchange Rate (with fallback) =====

async function fetchTwdJpy(): Promise<MarketData> {
  // Source 1: open.er-api.com
  try {
    console.log("[stock] Fetching TWD/JPY from open.er-api.com...");
    const res = await fetch("https://open.er-api.com/v6/latest/TWD", {
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json();
    const jpy = data.rates?.JPY;
    if (!jpy || isNaN(jpy)) throw new Error("No JPY rate found");
    console.log(`[stock] TWD/JPY: ${jpy.toFixed(2)} (open.er-api)`);
    return { value: jpy.toFixed(2), delta: "", direction: "flat" };
  } catch (e) {
    console.error("[stock] TWD/JPY source 1 failed:", e);
  }

  // Source 2: exchangerate.host
  try {
    console.log("[stock] Fetching TWD/JPY from api.exchangerate.host...");
    const res = await fetch(
      "https://api.exchangerate.host/latest?base=TWD&symbols=JPY",
      { signal: AbortSignal.timeout(10000) }
    );
    const data = await res.json();
    const jpy = data.rates?.JPY;
    if (!jpy || isNaN(jpy)) throw new Error("No JPY rate");
    console.log(`[stock] TWD/JPY: ${jpy.toFixed(2)} (exchangerate.host)`);
    return { value: jpy.toFixed(2), delta: "", direction: "flat" };
  } catch (e) {
    console.error("[stock] TWD/JPY source 2 failed:", e);
  }

  console.error("[stock] All TWD/JPY sources failed, returning '-'");
  return { value: "-", delta: "", direction: "flat" };
}

// ===== TAIEX Stock Index (with multiple fallbacks) =====

async function fetchTaiex(): Promise<MarketData> {
  // Source 1: Yahoo Finance v8 chart API
  try {
    console.log("[stock] Fetching TAIEX from Yahoo Finance...");
    const res = await fetch(
      "https://query1.finance.yahoo.com/v8/finance/chart/%5ETWII?interval=1d&range=1d",
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; TaiwanGeneratedNews/1.0)",
        },
        signal: AbortSignal.timeout(10000),
      }
    );
    if (!res.ok) throw new Error(`Yahoo HTTP ${res.status}`);
    const data = await res.json();
    const result = data?.chart?.result?.[0];
    const meta = result?.meta;
    const close = meta?.regularMarketPrice;
    const prevClose = meta?.chartPreviousClose || meta?.previousClose;

    if (!close || isNaN(close)) throw new Error("Invalid Yahoo TAIEX data");

    const diff = prevClose ? close - prevClose : 0;
    const direction: MarketData["direction"] =
      diff > 0 ? "up" : diff < 0 ? "dn" : "flat";
    const symbol = diff > 0 ? "▲" : diff < 0 ? "▼" : "—";

    const value = close.toLocaleString("en-US", { maximumFractionDigits: 0 });
    const delta = prevClose
      ? `${symbol} ${Math.abs(diff).toFixed(0)}`
      : "";

    console.log(`[stock] TAIEX: ${value} ${delta} (Yahoo Finance)`);
    return { value, delta, direction };
  } catch (e) {
    console.error("[stock] TAIEX Yahoo failed:", e);
  }

  // Source 2: Stooq CSV
  try {
    console.log("[stock] Fetching TAIEX from Stooq...");
    const res = await fetch(
      "https://stooq.com/q/l/?s=^twii&f=sd2t2ohlcv&h&e=csv",
      { signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) throw new Error(`Stooq HTTP ${res.status}`);
    const text = await res.text();
    const lines = text.trim().split("\n");
    if (lines.length < 2) throw new Error("No Stooq TAIEX data");

    const values = lines[1].split(",");
    const close = parseFloat(values[6]);
    const open = parseFloat(values[3]);

    if (isNaN(close)) throw new Error("Invalid Stooq close price");

    const diff = close - open;
    const direction: MarketData["direction"] =
      diff > 0 ? "up" : diff < 0 ? "dn" : "flat";
    const symbol = diff > 0 ? "▲" : diff < 0 ? "▼" : "—";

    const value = close.toLocaleString("en-US", { maximumFractionDigits: 0 });
    console.log(`[stock] TAIEX: ${value} (Stooq)`);
    return {
      value,
      delta: `${symbol} ${Math.abs(diff).toFixed(0)}`,
      direction,
    };
  } catch (e) {
    console.error("[stock] TAIEX Stooq failed:", e);
  }

  // Source 3: Google Finance scraping
  try {
    console.log("[stock] Fetching TAIEX from Google Finance...");
    const res = await fetch("https://www.google.com/finance/quote/TWII:TPE", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`Google Finance HTTP ${res.status}`);
    const html = await res.text();
    // Look for the price in data-last-price attribute
    const priceMatch = html.match(/data-last-price="([\d.]+)"/);
    if (!priceMatch) throw new Error("Could not extract TAIEX from Google Finance");

    const close = parseFloat(priceMatch[1]);
    if (isNaN(close)) throw new Error("Invalid Google Finance price");

    const value = close.toLocaleString("en-US", { maximumFractionDigits: 0 });
    console.log(`[stock] TAIEX: ${value} (Google Finance)`);
    return { value, delta: "", direction: "flat" };
  } catch (e) {
    console.error("[stock] TAIEX Google Finance failed:", e);
  }

  console.error("[stock] All TAIEX sources failed, returning '-'");
  return { value: "-", delta: "", direction: "flat" };
}

// ===== Weather (Open-Meteo API) =====

async function fetchCityWeather(
  lat: number,
  lon: number
): Promise<WeatherData> {
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=Asia/Taipei`,
      { signal: AbortSignal.timeout(10000) }
    );
    const data = await res.json();
    const temp = Math.round(data.current.temperature_2m);
    const code = data.current.weather_code;

    return { temp, condition: weatherCodeToText(code) };
  } catch (e) {
    console.error("Weather fetch error:", e);
    return { temp: 25, condition: "晴" };
  }
}

function weatherCodeToText(code: number): string {
  if (code === 0) return "快晴";
  if (code <= 3) return "晴";
  if (code <= 49) return "曇";
  if (code <= 69) return "雨";
  if (code <= 79) return "雪";
  if (code <= 99) return "雷雨";
  return "晴";
}

// ===== Combined Fetch =====

export async function fetchMarketAndWeather(): Promise<{
  twdJpy: MarketData;
  taiex: MarketData;
  taipei: WeatherData;
  kaohsiung: WeatherData;
}> {
  const [twdJpy, taiex, taipei, kaohsiung] = await Promise.all([
    fetchTwdJpy(),
    fetchTaiex(),
    fetchCityWeather(25.033, 121.5654), // Taipei
    fetchCityWeather(22.6273, 120.3014), // Kaohsiung
  ]);

  return { twdJpy, taiex, taipei, kaohsiung };
}
