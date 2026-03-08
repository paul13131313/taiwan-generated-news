// ヘッダー表示用: TAIEX株価指数 + 台北の天気

interface HeaderInfo {
  taiex?: string;
  weather?: string;
}

async function fetchTaiex(): Promise<string | undefined> {
  try {
    const url = "https://query1.finance.yahoo.com/v8/finance/chart/%5ETWII?interval=1d&range=2d";
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return undefined;

    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta) return undefined;

    const price = meta.regularMarketPrice;
    const prevClose = meta.chartPreviousClose || meta.previousClose;
    if (!price || !prevClose) return `${Number(price).toLocaleString()}`;

    const diff = price - prevClose;
    const pct = ((diff / prevClose) * 100).toFixed(1);
    const arrow = diff >= 0 ? "▲" : "▼";
    const sign = diff >= 0 ? "+" : "";

    return `${Number(price).toLocaleString()} ${arrow}${sign}${pct}%`;
  } catch {
    console.warn("[stock] Failed to fetch TAIEX");
    return undefined;
  }
}

async function fetchTaipeiWeather(): Promise<string | undefined> {
  try {
    // Open-Meteo API（無料・キー不要）— 台北 (25.033, 121.565)
    const url =
      "https://api.open-meteo.com/v1/forecast?latitude=25.033&longitude=121.565&current=temperature_2m,weather_code&timezone=Asia/Taipei";
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return undefined;

    const data = await res.json();
    const current = data?.current;
    if (!current) return undefined;

    const temp = Math.round(current.temperature_2m);
    const icon = weatherCodeToEmoji(current.weather_code);

    return `${icon} ${temp}°C`;
  } catch {
    console.warn("[stock] Failed to fetch Taipei weather");
    return undefined;
  }
}

function weatherCodeToEmoji(code: number): string {
  if (code === 0) return "☀";
  if (code <= 3) return "⛅";
  if (code <= 49) return "☁";
  if (code <= 69) return "🌧";
  if (code <= 79) return "🌨";
  if (code <= 99) return "⛈";
  return "🌤";
}

export async function fetchHeaderInfo(): Promise<HeaderInfo> {
  const [taiex, weather] = await Promise.allSettled([
    fetchTaiex(),
    fetchTaipeiWeather(),
  ]);

  return {
    taiex: taiex.status === "fulfilled" ? taiex.value : undefined,
    weather: weather.status === "fulfilled" ? weather.value : undefined,
  };
}
