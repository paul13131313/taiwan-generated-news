import type { MarketData, WeatherData } from "./types";

// ===== TWD/JPY Exchange Rate =====

async function fetchTwdJpy(): Promise<MarketData> {
  try {
    const res = await fetch(
      "https://open.er-api.com/v6/latest/TWD",
      { next: { revalidate: 0 } }
    );
    const data = await res.json();
    const jpy = data.rates?.JPY;
    if (!jpy) throw new Error("No JPY rate found");

    return {
      value: jpy.toFixed(2),
      delta: "",
      direction: "flat",
    };
  } catch (e) {
    console.error("TWD/JPY fetch error:", e);
    return { value: "4.80", delta: "", direction: "flat" };
  }
}

// ===== TAIEX Stock Index =====

async function fetchTaiex(): Promise<MarketData> {
  try {
    const res = await fetch(
      "https://stooq.com/q/l/?s=^twii&f=sd2t2ohlcv&h&e=csv",
      { next: { revalidate: 0 } }
    );
    const text = await res.text();
    const lines = text.trim().split("\n");
    if (lines.length < 2) throw new Error("No TAIEX data");

    const values = lines[1].split(",");
    const close = parseFloat(values[6]);
    const open = parseFloat(values[3]);

    if (isNaN(close)) throw new Error("Invalid TAIEX close price");

    const diff = close - open;
    const direction: MarketData["direction"] =
      diff > 0 ? "up" : diff < 0 ? "dn" : "flat";
    const symbol = diff > 0 ? "▲" : diff < 0 ? "▼" : "—";

    return {
      value: close.toLocaleString("en-US", { maximumFractionDigits: 0 }),
      delta: `${symbol} ${Math.abs(diff).toFixed(0)}`,
      direction,
    };
  } catch (e) {
    console.error("TAIEX fetch error:", e);
    return { value: "22,000", delta: "", direction: "flat" };
  }
}

// ===== Weather (Open-Meteo API) =====

async function fetchCityWeather(
  lat: number,
  lon: number
): Promise<WeatherData> {
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=Asia/Taipei`,
      { next: { revalidate: 0 } }
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
