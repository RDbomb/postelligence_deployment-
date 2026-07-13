import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createHash } from "crypto";

// Uses Hugging Face's current Inference Providers router (zero cost on free tier)
// The old "api-inference.huggingface.co/models/..." endpoint is legacy and
// no longer reliably serves GPU diffusion models like SDXL - it now throws
// connection-level errors for most users instead of a clean HTTP error.
// FLUX.1-schnell is fast, free-tier friendly, and actively served via hf-inference.
const HF_API_URL =
  "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell";

interface ImageGenerateRequest {
  prompt: string;
  style?: string; // "photorealistic" | "illustration" | "minimalist" | "3d" | "watercolor"
  aspectRatio?: "square" | "portrait" | "landscape"; // 1:1, 9:16, 16:9
}

const STYLE_MODIFIERS: Record<string, string> = {
  photorealistic: "photorealistic, 8k, professional photography, sharp focus, detailed",
  illustration: "digital illustration, vector art style, vibrant colors, flat design",
  minimalist: "minimalist design, clean lines, simple shapes, modern aesthetic, white background",
  "3d": "3d render, octane render, volumetric lighting, cinematic, high quality",
  watercolor: "watercolor painting, soft edges, artistic, beautiful color wash",
  cinematic: "cinematic photography, movie poster style, dramatic lighting, epic composition",
};

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: ImageGenerateRequest = await req.json();
    const { prompt, style = "photorealistic", aspectRatio = "square" } = body;

    if (!prompt || prompt.trim().length < 3) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const hfToken = process.env.HUGGINGFACE_API_TOKEN;
    if (!hfToken) {
      return NextResponse.json({ error: "Hugging Face API token not configured" }, { status: 500 });
    }

    const styleModifier = STYLE_MODIFIERS[style] || STYLE_MODIFIERS.photorealistic;
    const randomSeed = Math.floor(Math.random() * 10000000);
    // Suffixing random seed variations to prompt makes inputs unique for Hugging Face CDN caching bypass
    const fullPrompt = `${prompt}, ${styleModifier}, social media content, high quality, variation ${randomSeed}`;

    // Dimensions based on aspect ratio
    const dimensions =
      aspectRatio === "portrait"
        ? { width: 768, height: 1024 }
        : aspectRatio === "landscape"
        ? { width: 1024, height: 576 }
        : { width: 1024, height: 1024 }; // square

    const hfRes = await fetch(HF_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${hfToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: fullPrompt,
        parameters: {
          ...dimensions,
          num_inference_steps: 4, // FLUX.1-schnell is distilled for ~4 steps
          seed: randomSeed,
        },
      }),
    });

    if (!hfRes.ok) {
      const errText = await hfRes.text().catch(() => "Unknown error");
      // If model is loading (503), return a friendly error
      if (hfRes.status === 503) {
        return NextResponse.json(
          { error: "Image model is warming up. Please try again in 20-30 seconds." },
          { status: 503 }
        );
      }
      console.error("HuggingFace API error:", errText);
      return NextResponse.json(
        { error: "Image generation failed. Please try again." },
        { status: hfRes.status }
      );
    }

    // HF returns raw image bytes
    const imageBuffer = await hfRes.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString("base64");
    const dataUrl = `data:image/png;base64,${base64Image}`;

    // --- Auto-save to Media Library ---
    // Same storage bucket + dedup pattern as manual uploads in /api/media-library,
    // so AI-generated images show up in the Library tab without an extra step.
    let libraryItem = null;
    let saveError: string | null = null;

    try {
      const fileBytes = Buffer.from(imageBuffer);
      const hash = createHash("sha256").update(fileBytes).digest("hex");
      const fileName = `ai-generated-${Date.now()}.png`;
      const storagePath = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.png`;

      const { data: storageData, error: storageError } = await supabase.storage
        .from("media-library")
        .upload(storagePath, fileBytes, {
          cacheControl: "3600",
          contentType: "image/png",
          upsert: false,
        });

      if (storageError) {
        saveError = storageError.message;
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from("media-library")
          .getPublicUrl(storageData.path);

        const { data: mediaItem, error: dbError } = await supabase
          .from("media_library")
          .insert({
            user_id: user.id,
            file_name: fileName,
            file_url: publicUrl,
            file_type: "image",
            file_size: fileBytes.byteLength,
            content_hash: hash,
          })
          .select()
          .single();

        if (dbError) {
          // Roll back the uploaded file if the DB insert failed
          await supabase.storage.from("media-library").remove([storageData.path]);
          saveError = dbError.message;
        } else {
          libraryItem = mediaItem;
        }
      }
    } catch (saveErr) {
      console.error("Auto-save to library error:", saveErr);
      saveError = saveErr instanceof Error ? saveErr.message : "Failed to save to library";
    }

    // Image generation itself succeeded even if the library save didn't,
    // so we still return the image - just flag the save outcome separately.
    return NextResponse.json({
      imageUrl: dataUrl,
      prompt: fullPrompt,
      savedToLibrary: !!libraryItem,
      libraryItem,
      ...(saveError ? { libraryError: saveError } : {}),
    });
  } catch (err) {
    console.error("Image generate error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      { error: `Image generation failed: ${message}` },
      { status: 500 }
    );
  }
}