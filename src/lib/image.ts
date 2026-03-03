import { put } from "@vercel/blob";

const BRIGHTNESS_THRESHOLD = 50;
const MAX_RETRIES = 3;
const POLL_INTERVAL = 2000; // 2 seconds
const POLL_TIMEOUT = 60000; // 60 seconds max

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
 * Call Replicate API via fetch (no SDK dependency).
 * Creates a prediction, polls until complete, returns output URL.
 */
async function callReplicateFlux(prompt: string): Promise<string> {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) throw new Error("REPLICATE_API_TOKEN is not set");

  console.log(`[image] Replicate token exists: ${token.slice(0, 8)}...`);
  console.log(`[image] Prompt: ${prompt.slice(0, 100)}...`);

  // Step 1: Create prediction
  const createRes = await fetch(
    "https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Prefer: "wait",
      },
      body: JSON.stringify({
        input: {
          prompt,
          num_outputs: 1,
          aspect_ratio: "16:9",
          output_format: "webp",
          output_quality: 80,
        },
      }),
    }
  );

  if (!createRes.ok) {
    const errorBody = await createRes.text();
    throw new Error(`Replicate create failed (${createRes.status}): ${errorBody}`);
  }

  let prediction = await createRes.json();
  console.log(`[image] Prediction created: id=${prediction.id}, status=${prediction.status}`);

  // Step 2: Poll if not already completed (Prefer: wait should handle most cases)
  if (prediction.status !== "succeeded" && prediction.status !== "failed") {
    const startTime = Date.now();
    while (Date.now() - startTime < POLL_TIMEOUT) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL));

      const pollRes = await fetch(
        `https://api.replicate.com/v1/predictions/${prediction.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!pollRes.ok) {
        throw new Error(`Replicate poll failed (${pollRes.status})`);
      }

      prediction = await pollRes.json();
      console.log(`[image] Poll: status=${prediction.status}`);

      if (prediction.status === "succeeded" || prediction.status === "failed") {
        break;
      }
    }
  }

  if (prediction.status !== "succeeded") {
    throw new Error(`Replicate prediction failed: ${prediction.status} — ${prediction.error || "unknown"}`);
  }

  const output = prediction.output;
  if (!output || !Array.isArray(output) || output.length === 0) {
    throw new Error("Replicate returned no output images");
  }

  console.log(`[image] Got image URL: ${output[0].slice(0, 80)}...`);
  return output[0];
}

export async function generateHeroImage(prompt: string): Promise<string | null> {
  const stylePrefix =
    "photojournalistic, editorial style, bright, well-lit, high contrast, vivid colors, no text overlay, ";
  const negativePrompt =
    "dark, night, shadow, silhouette, low light, dim, underexposed, black background";

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const fullPrompt = `${stylePrefix}${prompt}. --no ${negativePrompt}`;
      console.log(`[image] Attempt ${attempt}/${MAX_RETRIES}`);

      // Call Replicate API
      const imageUrl = await callReplicateFlux(fullPrompt);

      // Download image
      console.log(`[image] Downloading image...`);
      const imageRes = await fetch(imageUrl);
      if (!imageRes.ok) throw new Error(`Image download failed: ${imageRes.status}`);
      const imageBuffer = await imageRes.arrayBuffer();
      console.log(`[image] Downloaded: ${imageBuffer.byteLength} bytes`);

      // Check brightness
      const brightness = checkImageBrightness(imageBuffer);
      console.log(`[image] Brightness: ${brightness.toFixed(1)}`);

      if (brightness < BRIGHTNESS_THRESHOLD && attempt < MAX_RETRIES) {
        console.log(`[image] Too dark (${brightness.toFixed(1)} < ${BRIGHTNESS_THRESHOLD}), retrying...`);
        continue;
      }

      // Upload to Vercel Blob
      const dateStr = new Date().toISOString().split("T")[0];
      console.log(`[image] Uploading to Vercel Blob...`);
      const blob = await put(
        `hero-${dateStr}-${attempt}.webp`,
        new Blob([imageBuffer], { type: "image/webp" }),
        { access: "public", contentType: "image/webp" }
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
