import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createBaseClient } from "@supabase/supabase-js";

export const maxDuration = 60; // Allow execution to take up to 60 seconds

// Standard Pollinations text URL
const POLLINATIONS_TEXT_URL = "https://text.pollinations.ai/";
const POLLINATIONS_IMAGE_URL = "https://image.pollinations.ai/prompt/";

export async function GET(req: NextRequest) {
  return triggerAutomation(req);
}

export async function POST(req: NextRequest) {
  return triggerAutomation(req);
}

async function triggerAutomation(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  const isServiceRole = authHeader === `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`;

  let supabase = createClient();
  let user = null;

  // 1. Resolve User Context
  if (isServiceRole) {
    const targetUserId = req.headers.get("X-User-Id") || req.nextUrl.searchParams.get("user_id");
    if (targetUserId) {
      const baseClient = createBaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false, autoRefreshToken: false } }
      );
      const { data: { user: foundUser } } = await baseClient.auth.admin.getUserById(targetUserId);
      user = foundUser;
      supabase = baseClient;
    }
  } else {
    const { data: { user: authedUser } } = await supabase.auth.getUser();
    user = authedUser;
  }

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = user.id;
  const isManualTest = req.nextUrl.searchParams.get("test") === "true";

  try {
    // 2. Fetch Automation Settings
    const { data: settings, error: settingsError } = await supabase
      .from("automation_settings")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (settingsError) {
      return NextResponse.json({ error: `Settings fetch failed: ${settingsError.message}` }, { status: 500 });
    }

    if (!settings) {
      return NextResponse.json({ error: "Automation is not configured for this user." }, { status: 400 });
    }

    if (!settings.is_enabled && !isManualTest) {
      return NextResponse.json({ message: "Automation is disabled." });
    }

    const { mode, platforms, categories, keywords } = settings;

    if (!platforms || platforms.length === 0) {
      return NextResponse.json({ error: "No target platforms configured for automation." }, { status: 400 });
    }

    // 3. Fetch News / Trend Topic
    let trendTitle = "";
    let trendExplanation = "";

    try {
      let rssUrl = "";
      if (keywords && keywords.length > 0) {
        const query = keywords.join(" ");
        rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
      } else {
        const cat = (categories && categories[0]) || "WORLD";
        rssUrl = `https://news.google.com/rss/headlines/section/topic/${cat.toUpperCase()}?hl=en-US&gl=US&ceid=US:en`;
      }

      const feedRes = await fetch(rssUrl);
      if (feedRes.ok) {
        const xml = await feedRes.text();
        const itemRegex = /<item>([\s\S]*?)<\/item>/;
        const match = xml.match(itemRegex);
        if (match) {
          const content = match[1];
          const rawTitle = content.match(/<title>([\s\S]*?)<\/title>/)?.[1] || "";
          const rawDesc = content.match(/<description>([\s\S]*?)<\/description>/)?.[1] || "";

          const unescape = (str: string) => str
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&apos;/g, "'")
            .replace(/<[^>]*>/g, "");

          trendTitle = unescape(rawTitle).replace(/\s+-\s+[^-]+$/, "").trim();
          trendExplanation = unescape(rawDesc).trim();
        }
      }
    } catch (e) {
      console.error("RSS fetch failed, using fallback:", e);
    }

    // Static Fallback
    if (!trendTitle) {
      trendTitle = "AI Agents Transform Office Productivity";
      trendExplanation = "Businesses are deploying autonomous AI agents to automate workflows, boosting operational efficiency by 40%.";
    }

    // 4. Generate Caption using Pollinations AI
    const systemPrompt = `You are a viral social media strategist and content copywriter. Generate a comprehensive, detailed, and high-performing social media post caption about the following trend.

Trend: "${trendTitle}"
Description: "${trendExplanation}"

Requirements:
- CRITICAL LENGTH LIMIT: The ENTIRE caption (including text, emojis, and hashtags) MUST be strictly under 500 characters total. This is a hard limit to comply with Threads platform restrictions.
- Accuracy: Focus strictly on the factual details provided.
- Structure:
  1. Start with an attention-grabbing hook in the first sentence.
  2. Provide context of why this trend is happening.
  3. Include an engaging discussion question or call-to-interaction.
  4. End with a strong call-to-action and 2-3 hashtags.
- Formatting: Use emojis naturally to break up text.

Return ONLY the caption, no extra explanation.`;

    const captionRes = await fetch(POLLINATIONS_TEXT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: systemPrompt }],
        model: "openai",
        temperature: 0.8,
      }),
    });

    if (!captionRes.ok) {
      throw new Error("Failed to generate caption");
    }

    const caption = (await captionRes.text()).trim();

    // 5. Scrape Web Image or Generate Image
    let imageBuffer: ArrayBuffer | null = null;
    let contentType = "image/jpeg";

    // Attempt DuckDuckGo image search
    try {
      const htmlRes = await fetch(`https://duckduckgo.com/?q=${encodeURIComponent(trendTitle)}`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });
      if (htmlRes.ok) {
        const html = await htmlRes.text();
        const vqdMatch = html.match(/vqd=['"]?([^'"]+)['"]?/);
        if (vqdMatch) {
          const vqd = vqdMatch[1];
          const imagesRes = await fetch(`https://duckduckgo.com/i.js?q=${encodeURIComponent(trendTitle)}&o=json&vqd=${vqd}`, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              "Referer": "https://duckduckgo.com/"
            }
          });
          if (imagesRes.ok) {
            const json = await imagesRes.json();
            const results = json.results || [];
            if (results.length > 0) {
              const imageUrl = results[0].image;
              const dlRes = await fetch(imageUrl, {
                headers: {
                  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                }
              });
              if (dlRes.ok) {
                imageBuffer = await dlRes.arrayBuffer();
                contentType = dlRes.headers.get("content-type") || "image/jpeg";
              }
            }
          }
        }
      }
    } catch (err) {
      console.error("DDG visual search failed, falling back to AI generation:", err);
    }

    // Fallback to Pollinations AI Image Generation
    if (!imageBuffer) {
      try {
        const aiImgUrl = `${POLLINATIONS_IMAGE_URL}${encodeURIComponent(trendTitle)}?width=1024&height=1024&nologo=true`;
        const aiImgRes = await fetch(aiImgUrl);
        if (aiImgRes.ok) {
          imageBuffer = await aiImgRes.arrayBuffer();
          contentType = "image/png";
        }
      } catch (err) {
        console.error("Pollinations AI image generation failed:", err);
      }
    }

    // 6. Upload Visual to Supabase Storage bucket `media-library` and save in `media_library` table
    let publicMediaUrl = "";

    if (imageBuffer) {
      const fileExt = contentType.includes("png") ? "png" : "jpeg";
      const storagePath = `${userId}/auto-${Date.now()}.${fileExt}`;

      const { data: storageData, error: storageError } = await supabase.storage
        .from("media-library")
        .upload(storagePath, imageBuffer, {
          cacheControl: "3600",
          contentType: contentType,
          upsert: false,
        });

      if (!storageError && storageData) {
        const { data: { publicUrl } } = supabase.storage
          .from("media-library")
          .getPublicUrl(storageData.path);

        publicMediaUrl = publicUrl;

        // Insert into media_library so it is visible in the user's Library UI
        await supabase
          .from("media_library")
          .insert({
            user_id: userId,
            file_name: `auto-${Date.now()}.${fileExt}`,
            file_url: publicUrl,
            file_type: "image",
            file_size: imageBuffer.byteLength,
          });
      }
    }

    // 7. Execute publishing or insert into queue based on Mode
    if (mode === "automatic") {
      // Fully-Automatic Mode: Trigger immediate publish
      // We will make a server-to-server POST request to our publishing endpoint
      // using the service role key for authentication bypass.
      const publishUrl = `${req.nextUrl.origin}/api/posts/publish`;

      const formData = new FormData();
      formData.append("caption", caption);
      formData.append("title", trendTitle);
      formData.append("mediaUrl", publicMediaUrl);
      formData.append("mediaType", "image");
      formData.append("platforms", platforms.join(","));

      const publishRes = await fetch(publishUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          "X-User-Id": userId,
        },
        body: formData,
      });

      const publishData = await publishRes.json();

      // Log execution status
      const logStatus = publishRes.ok && publishData.ok ? "published" : "failed";

      const { data: logEntry } = await supabase
        .from("automation_logs")
        .insert({
          user_id: userId,
          trend_title: trendTitle,
          caption: caption,
          media_url: publicMediaUrl,
          mode: "automatic",
          status: logStatus,
        })
        .select()
        .single();

      return NextResponse.json({
        success: logStatus === "published",
        mode: "automatic",
        log: logEntry,
        publishResult: publishData,
      });

    } else {
      // Manual Approval Mode: Store in approval queue as 'pending'
      const { data: logEntry } = await supabase
        .from("automation_logs")
        .insert({
          user_id: userId,
          trend_title: trendTitle,
          caption: caption,
          media_url: publicMediaUrl,
          mode: "manual",
          status: "pending",
        })
        .select()
        .single();

      return NextResponse.json({
        success: true,
        mode: "manual",
        log: logEntry,
      });
    }

  } catch (err: any) {
    console.error("Automation Trigger Error:", err);
    return NextResponse.json({ error: err.message || "Failed during automation processing." }, { status: 500 });
  }
}
