import Replicate from "replicate";
import { put } from "@vercel/blob";

function createReplicate() {
  const auth = process.env.REPLICATE_API_TOKEN;
  if (!auth) return null as unknown as Replicate;
  return new Replicate({ auth });
}

const replicate = createReplicate();

const BRIGHTNESS_THRESHOLD = 50; // 0-255 scale — reject images darker than this
const MAX_RETRIES = 3;

/**
 * Calculate average brightness of an image from its raw bytes.
 * Uses a simple sampling approach: read every 4th pixel (RGBA stride).
 */
async function checkImageBrightness(imageBuffer: ArrayBuffer): Promise<number> {
  const bytes = new Uint8Array(imageBuffer);

  // For WebP, we can't decode pixel data server-side easily.
  // Instead, sample raw byte values as a rough brightness proxy.
  // This works because brighter images have higher average byte values.
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

export async function generateHeroImage(prompt: string): Promise<string | null> {
  const stylePrefix =
    "photojournalistic, editorial style, bright, well-lit, high contrast, vivid colors, no text overlay, ";
  const negativePrompt =
    "dark, night, shadow, silhouette, low light, dim, underexposed, black background";

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const fullPrompt = `${stylePrefix}${prompt}. --no ${negativePrompt}`;

      const output = await replicate.run("black-forest-labs/flux-schnell", {
        input: {
          prompt: fullPrompt,
          num_outputs: 1,
          aspect_ratio: "16:9",
          output_format: "webp",
          output_quality: 80,
        },
      });

      // FLUX schnell returns an array of URLs
      const urls = output as string[];
      if (!urls || urls.length === 0) {
        throw new Error("No image output from Replicate");
      }

      const imageUrl = urls[0];

      // Download image from Replicate
      const imageRes = await fetch(imageUrl);
      if (!imageRes.ok) throw new Error(`Image download failed: ${imageRes.status}`);
      const imageBlob = await imageRes.blob();
      const imageBuffer = await imageBlob.arrayBuffer();

      // Check brightness
      const brightness = await checkImageBrightness(imageBuffer);
      console.log(`Hero image attempt ${attempt}: brightness=${brightness.toFixed(1)}`);

      if (brightness < BRIGHTNESS_THRESHOLD && attempt < MAX_RETRIES) {
        console.log(`Image too dark (${brightness.toFixed(1)} < ${BRIGHTNESS_THRESHOLD}), retrying...`);
        continue;
      }

      // Upload to Vercel Blob
      const dateStr = new Date().toISOString().split("T")[0];
      const blob = await put(`hero-${dateStr}-${attempt}.webp`, new Blob([imageBuffer], { type: "image/webp" }), {
        access: "public",
        contentType: "image/webp",
      });

      return blob.url;
    } catch (e) {
      console.error(`Hero image attempt ${attempt} failed:`, e);
      if (attempt === MAX_RETRIES) {
        return null;
      }
    }
  }

  return null;
}
