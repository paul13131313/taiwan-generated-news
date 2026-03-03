import { put } from "@vercel/blob";

const BRIGHTNESS_THRESHOLD = 50;
const MAX_RETRIES = 3;

/**
 * Rough brightness check by sampling raw bytes.
 */
function checkImageBrightness(imageBuffer: ArrayBuffer): number {
  const bytes = new Uint8Array(imageBuffer);
  let sum = 0;
  const sampleSize = Math.min(bytes.length, 100_000);
  const step = Math.max(1, Math.floor(bytes.length / sampleSize));
  let count = 0;
  for (let i = 0; i < bytes.length; i += step) {
    sum += bytes[i];
    count++;
  }
  return count > 0 ? sum / count : 128;
}

/**
 * Call Together AI API to generate image with FLUX.1-schnell.
 * Returns base64-encoded image data.
 */
async function callTogetherFlux(prompt: string): Promise<Buffer> {
  const token = process.env.TOGETHER_API_KEY;
  if (!token) throw new Error("TOGETHER_API_KEY is not set");

  console.log(`[image] Together AI token exists: ${token.slice(0, 8)}...`);
  console.log(`[image] Prompt: ${prompt.slice(0, 100)}...`);

  const response = await fetch("https://api.together.xyz/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "black-forest-labs/FLUX.1-schnell",
      prompt,
      width: 1344,
      height: 768,
      n: 1,
      response_format: "b64_json",
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Together AI failed (${response.status}): ${errorBody}`);
  }

  const result = await response.json();
  const b64 = result.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error("Together AI returned no image data");
  }

  console.log(`[image] Got base64 image (${b64.length} chars)`);
  return Buffer.from(b64, "base64");
}

// --- Replicate API (コメントアウト: 決済不通のため Together AI に切り替え) ---
// async function callReplicateFlux(prompt: string): Promise<string> {
//   const token = process.env.REPLICATE_API_TOKEN;
//   if (!token) throw new Error("REPLICATE_API_TOKEN is not set");
//   const createRes = await fetch(
//     "https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions",
//     {
//       method: "POST",
//       headers: {
//         Authorization: `Bearer ${token}`,
//         "Content-Type": "application/json",
//         Prefer: "wait",
//       },
//       body: JSON.stringify({
//         input: { prompt, num_outputs: 1, aspect_ratio: "16:9", output_format: "webp", output_quality: 80 },
//       }),
//     }
//   );
//   if (!createRes.ok) throw new Error(`Replicate create failed (${createRes.status})`);
//   let prediction = await createRes.json();
//   if (prediction.status !== "succeeded" && prediction.status !== "failed") {
//     const startTime = Date.now();
//     while (Date.now() - startTime < POLL_TIMEOUT) {
//       await new Promise((r) => setTimeout(r, POLL_INTERVAL));
//       const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       if (!pollRes.ok) throw new Error(`Replicate poll failed (${pollRes.status})`);
//       prediction = await pollRes.json();
//       if (prediction.status === "succeeded" || prediction.status === "failed") break;
//     }
//   }
//   if (prediction.status !== "succeeded") throw new Error(`Replicate failed: ${prediction.status}`);
//   const output = prediction.output;
//   if (!output || !Array.isArray(output) || output.length === 0) throw new Error("No output");
//   return output[0];
// }

export async function generateHeroImage(prompt: string): Promise<string | null> {
  const stylePrefix =
    "photojournalistic, editorial style, bright, well-lit, high contrast, vivid colors, no text overlay, ";
  const negativePrompt =
    "dark, night, shadow, silhouette, low light, dim, underexposed, black background";

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const fullPrompt = `${stylePrefix}${prompt}. --no ${negativePrompt}`;
      console.log(`[image] Attempt ${attempt}/${MAX_RETRIES}`);

      // Call Together AI API (base64レスポンス)
      const imageBuffer = await callTogetherFlux(fullPrompt);
      const uint8 = new Uint8Array(imageBuffer);
      console.log(`[image] Generated: ${uint8.byteLength} bytes`);

      // Check brightness
      const brightness = checkImageBrightness(uint8.buffer as ArrayBuffer);
      console.log(`[image] Brightness: ${brightness.toFixed(1)}`);

      if (brightness < BRIGHTNESS_THRESHOLD && attempt < MAX_RETRIES) {
        console.log(`[image] Too dark (${brightness.toFixed(1)} < ${BRIGHTNESS_THRESHOLD}), retrying...`);
        continue;
      }

      // Upload to Vercel Blob
      const dateStr = new Date().toISOString().split("T")[0];
      console.log(`[image] Uploading to Vercel Blob...`);
      const blob = await put(
        `hero-${dateStr}-${attempt}.png`,
        new Blob([uint8], { type: "image/png" }),
        { access: "public", contentType: "image/png" }
      );

      console.log(`[image] Upload complete: ${blob.url}`);
      return blob.url;
    } catch (e) {
      console.error(`[image] Attempt ${attempt} failed:`, e);
      if (attempt === MAX_RETRIES) {
        console.error(`[image] All ${MAX_RETRIES} attempts failed, returning null`);
        return null;
      }
    }
  }

  return null;
}
