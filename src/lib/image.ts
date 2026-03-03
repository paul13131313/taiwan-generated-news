import Replicate from "replicate";
import { put } from "@vercel/blob";

function createReplicate() {
  const auth = process.env.REPLICATE_API_TOKEN;
  if (!auth) return null as unknown as Replicate;
  return new Replicate({ auth });
}

const replicate = createReplicate();

const FALLBACK_IMAGE_URL = ""; // Will use CSS gradient fallback in template

export async function generateHeroImage(prompt: string): Promise<string | null> {
  try {
    const stylePrefix =
      "photojournalistic, editorial style, cinematic lighting, no text overlay, ";
    const fullPrompt = stylePrefix + prompt;

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

    // Upload to Vercel Blob
    const dateStr = new Date().toISOString().split("T")[0];
    const blob = await put(`hero-${dateStr}.webp`, imageBlob, {
      access: "public",
      contentType: "image/webp",
    });

    return blob.url;
  } catch (e) {
    console.error("Hero image generation failed:", e);
    return null;
  }
}
