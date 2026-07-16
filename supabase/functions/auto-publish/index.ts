import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  "https://atbiednsiybijfkvairg.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0YmllZG5zaXliaWpma3ZhaXJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM0Nzg0MCwiZXhwIjoyMDk1OTIzODQwfQ._Vc8VnN-2OP8a3kbkxUIZ3GABkyN_RSFjjlDyRv7Rgw"
);

// ── Scheduler config ─────────────────────────────────────────
const BATCH_LIMIT = 50;      // max posts fetched per run
const CONCURRENCY = 5;       // posts processed in parallel per batch
const MAX_RUN_MS  = 120_000; // stop starting new batches after 120 s
const GRAPH_VERSION = Deno.env.get("META_GRAPH_VERSION") || "v23.0";
// ─────────────────────────────────────────────────────────────

type PublishResult = {
  platform: string;
  status: "published" | "failed" | "skipped";
  message: string;
  id?: string;
};

function detectMediaType(mediaUrl: string): "video" | "image" {
  return /\.(mp4|mov|webm|avi)(\?|$)/i.test(mediaUrl) ? "video" : "image";
}

async function readJson(response: Response) {
  const text = await response.text();
  try { return text ? JSON.parse(text) : {}; }
  catch { return { raw: text }; }
}

async function requireOk(response: Response, label: string) {
  const payload = await readJson(response);
  if (!response.ok) {
    const detail =
      payload?.error?.message ||
      payload?.error ||
      payload?.message ||
      payload?.raw ||
      response.statusText;
    throw new Error(`${label}: ${detail}`);
  }
  return payload;
}

// Fails if the platform responded 200 with no actual media id — that shape
// means it *looked* successful but nothing was really published.
async function requirePublishedId(response: Response, label: string) {
  const payload = await requireOk(response, label);
  const id = payload?.id as string | undefined;
  if (!id) {
    throw new Error(`${label}: platform returned success with no media ID (${JSON.stringify(payload)}).`);
  }
  return id;
}

// ── Process a single scheduled post ───────────────────────────
// `post.platform_results` may already contain entries from a PREVIOUS attempt
// at this same post (e.g. a stale "publishing" row that got reclaimed after a
// timeout). Platforms that already show "published" there must be skipped —
// otherwise a retry re-posts to every platform again, including the ones that
// already succeeded, which is one of the two ways duplicate posts happen.
async function processPost(post: any): Promise<{ id: string; status: string }> {
  const priorResults: PublishResult[] = Array.isArray(post.platform_results) ? post.platform_results : [];
  const alreadyPublished = new Set(
    priorResults.filter((r) => r.status === "published").map((r) => r.platform)
  );
  // Workspace-scheduled posts must always publish through the workspace's
  // own connected accounts, never the personal accounts of whoever happened
  // to schedule/approve it — resolve by workspace_id when present, exactly
  // like the immediate-publish route and the Vercel-cron scheduler do.
  const accountQuery = supabase
    .from("social_accounts")
    .select("*")
    .eq("status", "connected")
    .in("platform", post.platforms);

  const { data: accounts } = post.workspace_id
    ? await accountQuery.eq("workspace_id", post.workspace_id)
    : await accountQuery.eq("user_id", post.user_id).is("workspace_id", null);

  const results: PublishResult[] = [];
  const mediaUrl = post.media_urls?.[0] || "";
  const mediaType = mediaUrl ? detectMediaType(mediaUrl) : "image";

  for (const platform of post.platforms as string[]) {
    if (alreadyPublished.has(platform)) {
      // Carry the earlier success forward instead of publishing again.
      results.push(priorResults.find((r) => r.platform === platform)!);
      continue;
    }

    const account = (accounts || []).find((a: any) => a.platform === platform);

    if (!account) {
      results.push({ platform, status: "failed", message: "No connected account found." });
      continue;
    }

    try {
      let id: string | undefined;
      if (platform === "bluesky")   id = await publishToBluesky(post, account);
      else if (platform === "linkedin") id = await publishToLinkedIn(post, account);
      else if (platform === "youtube")  id = await publishToYouTube(post, account);
      else if (platform === "instagram") id = await publishToInstagram(post, account, mediaUrl, mediaType);
      else if (platform === "facebook")  id = await publishToFacebook(post, account, mediaUrl, mediaType);
      else if (platform === "threads")   id = await publishToThreads(post, account, mediaUrl, mediaType);
      else {
        results.push({ platform, status: "failed", message: `No publisher implemented for platform "${platform}".` });
        continue;
      }
      results.push({ platform, status: "published", message: "Published successfully.", id });
    } catch (e) {
      console.error(`Failed post ${post.id} on ${platform}:`, String(e));
      results.push({ platform, status: "failed", message: e instanceof Error ? e.message : String(e) });
    }
  }

  // Special case: YouTube "make public" can report failure on our end even
  // though the video is already live — double check before we call it failed.
  const youtubeResultIdx = results.findIndex(r => r.platform === "youtube" && r.status === "failed");
  if (youtubeResultIdx !== -1 && post.youtube_video_id) {
    const youtubeAccount = (accounts || []).find((a: any) => a.platform === "youtube");
    try {
      const checkRes = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=status&id=${post.youtube_video_id}`,
        { headers: { Authorization: `Bearer ${youtubeAccount?.access_token}` } }
      );
      const checkData = await checkRes.json();
      const privacy = checkData?.items?.[0]?.status?.privacyStatus;
      if (privacy === "public") {
        results[youtubeResultIdx] = { platform: "youtube", status: "published", message: "Already public." };
      }
    } catch { /* ignore check error, leave as failed */ }
  }

  const anyFailed = results.some(r => r.status === "failed");
  const anyPublished = results.some(r => r.status === "published");
  // Only "published" if every requested platform actually succeeded.
  // Mixed outcomes are marked "failed" so the platform_results detail
  // (which lists exactly which platforms succeeded/failed) doesn't get
  // hidden behind a falsely-green status.
  const finalStatus = anyFailed ? (anyPublished ? "failed" : "failed") : "published";

  const { error: scheduledPostsError } = await supabase
    .from("scheduled_posts")
    .update({ status: finalStatus, platform_results: results })
    .eq("id", post.id);

  if (scheduledPostsError) {
    console.error("[auto-publish] Failed to update scheduled_posts", { postId: post.id, error: scheduledPostsError.message });
  }

  // This scheduled post was created from a Team Workspace draft
  // (Schedule button on /drafts/workspace/[id]) — mirror the outcome
  // onto workspace_drafts.status too, otherwise the draft sits stuck on
  // "scheduled" forever and never shows up under Published in the Team
  // Schedule tab even after it actually posts. Always attempted regardless
  // of the scheduled_posts update outcome above, so one failure can't
  // block the other.
  if (post.workspace_draft_id) {
    const firstFailure = results.find(r => r.status === "failed");
    const { error: draftError } = await supabase
      .from("workspace_drafts")
      .update({
        status: finalStatus,
        rejection_reason: finalStatus === "failed" ? (firstFailure?.message || "Publishing failed.") : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", post.workspace_draft_id);

    if (draftError) {
      console.error("[auto-publish] Failed to sync workspace_drafts status", { draftId: post.workspace_draft_id, error: draftError.message });
    }
  }

  return { id: post.id, status: finalStatus };
}

const POLLINATIONS_TEXT_URL = "https://text.pollinations.ai/";
const POLLINATIONS_IMAGE_URL = "https://image.pollinations.ai/prompt/";

function getNextPostTime(postTimeStr: string): Date {
  const [h, m, s] = postTimeStr.split(":").map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(h, m, s || 0, 0);

  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }
  return target;
}

async function verifyToken(logId: string, userId: string, token: string): Promise<boolean> {
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const tokenPayload = logId + userId + serviceRoleKey;
  const encoder = new TextEncoder();
  const data = encoder.encode(tokenPayload);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const expectedToken = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  return token === expectedToken;
}

function renderHtmlResponse(message: string, success: boolean): Response {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>PostSync Approval Panel</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          background-color: #f6f7f1;
          color: #1f2528;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          margin: 0;
          padding: 20px;
          box-sizing: border-box;
        }
        .card {
          background-color: white;
          border: 1px solid rgba(31, 37, 40, 0.1);
          border-radius: 24px;
          padding: 40px;
          text-align: center;
          max-width: 480px;
          width: 100%;
          box-shadow: 0 12px 40px rgba(31, 37, 40, 0.05);
        }
        .icon {
          font-size: 48px;
          margin-bottom: 20px;
        }
        h1 {
          font-size: 20px;
          font-weight: 800;
          margin: 0 0 10px 0;
          letter-spacing: -0.02em;
        }
        p {
          font-size: 14px;
          color: #5a656c;
          line-height: 1.5;
          margin: 0 0 24px 0;
          font-weight: 500;
        }
        .btn {
          display: inline-block;
          background-color: #2f7867;
          color: white;
          text-decoration: none;
          padding: 12px 24px;
          font-size: 13px;
          font-weight: 700;
          border-radius: 12px;
          transition: background-color 150ms;
        }
        .btn:hover {
          background-color: #255f52;
        }
        .error-icon {
          color: #e11d48;
        }
        .success-icon {
          color: #10b981;
        }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="icon ${success ? "success-icon" : "error-icon"}">
          ${success ? "✓" : "⚠"}
        </div>
        <h1>${success ? "Action Completed" : "Action Failed"}</h1>
        <p>${message}</p>
        <a href="http://localhost:3000/automation" class="btn">Back to Automation</a>
      </div>
    </body>
    </html>
  `;
  const headers = new Headers();
  headers.set("content-type", "text/html; charset=utf-8");
  return new Response(html, {
    status: 200,
    headers,
  });
}

async function handleExternalApproval(logId: string, action: string, token: string): Promise<Response> {
  try {
    const { data: log, error: logErr } = await supabase
      .from("automation_logs")
      .select("*")
      .eq("id", logId)
      .single();

    if (logErr || !log) {
      return renderHtmlResponse("Log entry not found.", false);
    }

    if (log.status !== "pending") {
      return renderHtmlResponse(`This draft has already been processed (Status: ${log.status}).`, false);
    }

    const isValid = await verifyToken(logId, log.user_id, token);
    if (!isValid) {
      return renderHtmlResponse("Security token validation failed. Access denied.", false);
    }

    if (action === "reject") {
      await supabase
        .from("automation_logs")
        .update({ status: "rejected" })
        .eq("id", logId);
      return renderHtmlResponse("Success! This trend draft has been discarded.", true);
    }

    const { data: settings } = await supabase
      .from("automation_settings")
      .select("*")
      .eq("user_id", log.user_id)
      .single();

    if (action === "publish") {
      // 1. Create a scheduled post row set to publish now
      const { data: post, error: postErr } = await supabase
        .from("scheduled_posts")
        .insert({
          user_id: log.user_id,
          title: log.trend_title,
          description: log.caption,
          media_urls: log.media_url ? [log.media_url] : [],
          platforms: settings?.platforms || [],
          scheduled_time: new Date().toISOString(),
          status: "pending",
        })
        .select()
        .single();

      if (postErr) throw postErr;

      // 2. Publish it immediately using the Edge Function's standard pipeline!
      const pubRes = await processPost(post);
      
      if (pubRes.status === "failed") {
        throw new Error("Publishing failed.");
      }

      // 3. Mark log as published
      await supabase
        .from("automation_logs")
        .update({ 
          status: "published",
          scheduled_post_id: post.id 
        })
        .eq("id", logId);

      return renderHtmlResponse("Success! Your post has been published live to your social channels.", true);
    }

    if (action === "schedule") {
      const postTime = settings?.post_time || "09:00:00";
      const targetTime = getNextPostTime(postTime);

      const { data: post, error: postErr } = await supabase
        .from("scheduled_posts")
        .insert({
          user_id: log.user_id,
          title: log.trend_title,
          description: log.caption,
          media_urls: log.media_url ? [log.media_url] : [],
          platforms: settings?.platforms || [],
          scheduled_time: targetTime.toISOString(),
          status: "pending",
        })
        .select()
        .single();

      if (postErr) throw postErr;

      await supabase
        .from("automation_logs")
        .update({
          status: "approved",
          scheduled_post_id: post.id,
        })
        .eq("id", logId);

      return renderHtmlResponse(`Success! Your post has been approved and scheduled.`, true);
    }

    return renderHtmlResponse("Unsupported action.", false);
  } catch (err: any) {
    return renderHtmlResponse(`Failed to process action: ${err.message || err}`, false);
  }
}

async function runAutomationTrigger(origin: string) {
  const { data: allSettings, error: allErr } = await supabase
    .from("automation_settings")
    .select("*")
    .eq("is_enabled", true);

  if (allErr || !allSettings) return;

  for (const settings of allSettings) {
    const targetTime = getNextPostTime(settings.post_time);
    const diffMs = targetTime.getTime() - Date.now();
    const diffMins = Math.floor(diffMs / 60000);

    // Trigger if we are 10 minutes before posting time (accepts 8-12m buffer)
    if (diffMins >= 8 && diffMins <= 12) {
      try {
        const { data: dbUser } = await supabase.auth.admin.getUserById(settings.user_id);
        const email = dbUser?.user?.email || "";
        await runAutomationForUser(settings.user_id, settings, email, origin);
      } catch (e) {
        console.error(`Automation trigger failed for user ${settings.user_id}:`, e);
      }
    }
  }
}

async function runAutomationForUser(userId: string, settings: any, userEmail: string, origin: string) {
  const { mode, platforms, categories, keywords, approval_email, post_time } = settings;

  if (!platforms || platforms.length === 0) {
    throw new Error("No target platforms configured for automation.");
  }

  // 1. Fetch News / Trend Topic
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

  if (!trendTitle) {
    trendTitle = "AI Agents Transform Office Productivity";
    trendExplanation = "Businesses are deploying autonomous AI agents to automate workflows, boosting operational efficiency by 40%.";
  }

  const systemPrompt = `You are a viral social media strategist and content copywriter. Generate a comprehensive, detailed, and high-performing social media post caption about the following trend.

Trend: "${trendTitle}"
Description: "${trendExplanation}"

Requirements:
- Keep the caption brief, engaging, and professional. The entire text must fit within a 2-3 sentence paragraph (max 280 characters).
- Do NOT include any reasoning, planning, or character counting calculations in your response. 
- Do NOT say "Let's count using approximate" or output any breakdown of characters or words.
- Format structure: Start with an attention-grabbing hook, provide brief context, and end with a strong CTA and 2-3 hashtags.
- Use emojis naturally.

Return ONLY the plain, final social media caption itself. No wrapper quotes, no markdown headers, and absolutely no additional commentary.`;

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

  // 3. Scrape Web Image or Generate Image
  let imageBuffer: ArrayBuffer | null = null;
  let contentType = "image/jpeg";

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

  // 4. Upload Visual to Supabase Storage
  let publicMediaUrl = "";

  if (imageBuffer) {
    const fileExt = contentType.includes("png") ? "png" : "jpeg";
    const storagePath = `${userId}/auto-${Date.now()}.${fileExt}`;

    const { data: storageData, error: storageError } = await supabase.storage
      .from("media-library")
      .upload(storagePath, new Uint8Array(imageBuffer), {
        cacheControl: "3600",
        contentType: contentType,
        upsert: false,
      });

    if (!storageError && storageData) {
      const { data: { publicUrl } } = supabase.storage
        .from("media-library")
        .getPublicUrl(storageData.path);

      publicMediaUrl = publicUrl;

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

  // 5. Execute Mode Actions
  if (mode === "automatic") {
    const targetTime = getNextPostTime(post_time);

    const { data: post, error: postErr } = await supabase
      .from("scheduled_posts")
      .insert({
        user_id: userId,
        title: trendTitle,
        description: caption,
        media_urls: publicMediaUrl ? [publicMediaUrl] : [],
        platforms: platforms || [],
        scheduled_time: targetTime.toISOString(),
        status: "pending",
      })
      .select()
      .single();

    if (postErr) throw postErr;

    await supabase
      .from("automation_logs")
      .insert({
        user_id: userId,
        trend_title: trendTitle,
        caption: caption,
        media_url: publicMediaUrl,
        mode: "automatic",
        status: "approved",
        scheduled_post_id: post.id,
      });

  } else {
    const { data: logEntry, error: logErr } = await supabase
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

    if (logErr) throw logErr;

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey) {
      try {
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
        const tokenPayload = logEntry.id + userId + serviceRoleKey;
        const encoder = new TextEncoder();
        const data = encoder.encode(tokenPayload);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const token = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

        const scheduleUrl = `${origin}/functions/v1/auto-publish?logId=${logEntry.id}&action=schedule&token=${token}`;
        const publishUrl = `${origin}/functions/v1/auto-publish?logId=${logEntry.id}&action=publish&token=${token}`;
        const rejectUrl = `${origin}/functions/v1/auto-publish?logId=${logEntry.id}&action=reject&token=${token}`;

        let formattedLocalTime = post_time.slice(0, 5);
        try {
          const [h, m] = post_time.split(":").map(Number);
          const tDate = new Date();
          tDate.setUTCHours(h, m, 0, 0);
          const formatter = new Intl.DateTimeFormat("en-US", {
            timeStyle: "short",
            timeZone: settings.timezone || "UTC",
          });
          formattedLocalTime = formatter.format(tDate);
        } catch (e) {
          console.error("Failed to format local time:", e);
        }

        const emailHtml = `
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f6f7f1; padding: 24px 0;">
            <tr>
              <td align="center">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; background-color: #ffffff; border: 1px solid #e1e3de; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(31,37,40,0.03);">
                  <tr>
                    <td style="padding: 32px;">
                      <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td>
                            <p style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #2f7867; margin: 0 0 6px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">PostSync Engine</p>
                            <h2 style="font-size: 22px; font-weight: 900; color: #1f2528; margin: 0 0 20px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; letter-spacing: -0.5px;">New Trend Draft Generated</h2>
                          </td>
                        </tr>
                      </table>

                      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fcfdfb; border: 1px solid #eef0eb; border-radius: 12px; margin-bottom: 24px;">
                        <tr>
                          <td style="padding: 20px;">
                            <h4 style="font-size: 14px; font-weight: 800; color: #1f2528; margin: 0 0 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">Topic: ${trendTitle}</h4>
                            <p style="font-size: 13px; color: #2b3338; line-height: 1.6; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; white-space: pre-wrap;">${caption}</p>
                          </td>
                        </tr>
                      </table>

                      ${publicMediaUrl ? `
                      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
                        <tr>
                          <td>
                            <img src="${publicMediaUrl}" alt="Trend Visual" width="100%" style="width: 100%; max-width: 100%; height: auto; display: block; border-radius: 12px; border: 1px solid #eaeaea;" />
                          </td>
                        </tr>
                      </table>
                      ` : ""}

                      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
                        <tr>
                          <td>
                            <p style="font-size: 13px; color: #5a656c; line-height: 1.6; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                              This post was generated exactly 10 minutes before your target posting time (${formattedLocalTime}). Please review the options below to approve or discard it:
                            </p>
                          </td>
                        </tr>
                      </table>

                      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 20px;">
                        <tr>
                          <td>
                            <a href="${scheduleUrl}" style="display: inline-block; background-color: #2f7867; color: #ffffff; font-size: 13px; font-weight: 750; padding: 12px 20px; text-decoration: none; border-radius: 10px; margin-right: 8px; margin-bottom: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; text-align: center;">Approve & Schedule</a>
                            <a href="${publishUrl}" style="display: inline-block; background-color: #f3f6f1; color: #2f7867; font-size: 13px; font-weight: 750; padding: 12px 20px; text-decoration: none; border-radius: 10px; border: 1px solid rgba(47, 120, 103, 0.15); margin-right: 8px; margin-bottom: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; text-align: center;">Publish Now</a>
                            <a href="${rejectUrl}" style="display: inline-block; background-color: #ffffff; color: #e11d48; font-size: 13px; font-weight: 750; padding: 12px 20px; text-decoration: none; border-radius: 10px; border: 1px solid #fecdd3; margin-bottom: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; text-align: center;">Reject</a>
                          </td>
                        </tr>
                      </table>

                      <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td style="border-top: 1px solid #eef0eb; padding-top: 24px; text-align: center;">
                            <p style="font-size: 11px; color: #a1a59b; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; font-weight: 600; letter-spacing: 0.5px;">PostSync &middot; Autonomous Campaigns</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        `;

        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "PostSync <onboarding@resend.dev>",
            to: [approval_email || userEmail],
            subject: `Approval Required: ${trendTitle.slice(0, 45)}`,
            html: emailHtml,
          }),
        });
      } catch (e) {
        console.error("Resend email failed:", e);
      }
    }
  }
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const action = url.searchParams.get("action");
  const logId = url.searchParams.get("logId");
  const token = url.searchParams.get("token");

  // Route 1: Handle approval callback
  if (action && logId && token) {
    return await handleExternalApproval(logId, action, token);
  }

  // Route 2: Run scheduled publisher tick + automation trigger checks
  const startTime = Date.now();
  const results: { id: string; status: string }[] = [];

  try {
    // Run automation trigger checks for all active users
    const origin = url.origin;
    await runAutomationTrigger(origin);

    // Atomically claim and process scheduled posts (original logic)
    const { data: duePosts, error } = await supabase.rpc("claim_due_scheduled_posts", {
      p_batch_size: BATCH_LIMIT,
    });

    if (error) {
      console.error("DB error:", error.message);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    if (duePosts && duePosts.length > 0) {
      console.log(`Found ${duePosts.length} due posts`);
      for (let i = 0; i < duePosts.length; i += CONCURRENCY) {
        if (Date.now() - startTime > MAX_RUN_MS) {
          console.warn(`Timeout guard hit after ${results.length} posts — stopping early`);
          break;
        }

        const batch = duePosts.slice(i, i + CONCURRENCY);
        const settled = await Promise.allSettled(batch.map((post) => processPost(post)));

        for (const outcome of settled) {
          if (outcome.status === "fulfilled") {
            results.push(outcome.value);
          } else {
            console.error("processPost rejected:", outcome.reason);
          }
        }
      }
    }

    const duration = Date.now() - startTime;
    console.log(`Done: ${results.length} posts in ${duration}ms`);

    return new Response(
      JSON.stringify({ ok: true, processed: results, total: results.length, duration_ms: duration }),
      { status: 200 }
    );

  } catch (e) {
    console.error("Fatal error:", String(e));
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});

// ── Bluesky ────────────────────────────────────────────────────
async function publishToBluesky(post: any, account: any): Promise<string | undefined> {
  const meta = account.metadata || {};
  const handle = meta.handle || account.account_name;
  const appPassword = meta.appPassword;
  if (!handle || !appPassword) throw new Error("Bluesky credentials missing");

  const sessionRes = await fetch("https://bsky.social/xrpc/com.atproto.server.createSession", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: handle, password: appPassword }),
  });
  if (!sessionRes.ok) throw new Error("Bluesky login failed");
  const session = await sessionRes.json();

  const pdsHost = meta.pdsHost || "bsky.social";
  const pdsUrl = `https://${pdsHost}`;
  // Bluesky has no separate title field — using [title, description].join() here
  // meant a post with no visible title input still posted the internal fallback
  // title (e.g. "Untitled Post") as literal text above the real caption. Post the
  // description alone, only falling back to title if description is somehow empty.
  const text = (post.description || post.title || "").trim().slice(0, 300);

  const record: any = {
    text,
    createdAt: new Date().toISOString(),
    $type: "app.bsky.feed.post",
  };

  // Bluesky posts support up to 4 images per post — upload every image
  // (not just the first) and attach them all as one embed.
  const mediaUrls: string[] = Array.isArray(post.media_urls) ? post.media_urls.filter(Boolean) : [];
  const isFirstVideo = mediaUrls[0] && /\.(mp4|mov|webm|avi)(\?|$)/i.test(mediaUrls[0]);

  if (mediaUrls.length > 0 && !isFirstVideo) {
    const imageUrls = mediaUrls.filter((url) => !/\.(mp4|mov|webm|avi)(\?|$)/i.test(url)).slice(0, 4);
    const blobs = await Promise.all(imageUrls.map(async (mediaUrl) => {
      try {
        const imgRes = await fetch(mediaUrl);
        if (!imgRes.ok) return null;
        const imgBuffer = await imgRes.arrayBuffer();
        const contentType = imgRes.headers.get("content-type") || "image/jpeg";
        const blobRes = await fetch(`${pdsUrl}/xrpc/com.atproto.repo.uploadBlob`, {
          method: "POST",
          headers: { Authorization: `Bearer ${session.accessJwt}`, "Content-Type": contentType },
          body: imgBuffer,
        });
        if (!blobRes.ok) return null;
        const blobData = await blobRes.json();
        return blobData.blob || null;
      } catch {
        return null;
      }
    }));
    const images = blobs
      .filter((b) => Boolean(b))
      .map((blob) => ({ image: blob, alt: post.title || "PostSync image" }));
    if (images.length > 0) {
      record.embed = { $type: "app.bsky.embed.images", images };
    }
  }

  const postRes = await fetch("https://bsky.social/xrpc/com.atproto.repo.createRecord", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.accessJwt}` },
    body: JSON.stringify({ repo: session.did, collection: "app.bsky.feed.post", record }),
  });
  if (!postRes.ok) throw new Error("Bluesky post failed");
  const payload = await postRes.json().catch(() => ({}));
  return payload?.uri;
}

// ── LinkedIn ───────────────────────────────────────────────────
async function publishToLinkedIn(post: any, account: any): Promise<string | undefined> {
  const token = account.access_token;
  if (!token) throw new Error("LinkedIn token missing");

  const text = [post.title, post.description].filter(Boolean).join("\n\n");
  const author = `urn:li:person:${account.account_id}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "LinkedIn-Version": "202605",
    "X-Restli-Protocol-Version": "2.0.0",
  };

  const postBody: any = {
    author,
    lifecycleState: "PUBLISHED",
    visibility: "PUBLIC",
    commentary: text,
    distribution: {
      feedDistribution: "MAIN_FEED",
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
  };

  if (post.linkedin_media_urn) {
    const isVideo = post.linkedin_media_urn.includes(":video:");
    postBody.content = isVideo
      ? { media: { id: post.linkedin_media_urn, title: post.title || "PostSync video" } }
      : { media: { id: post.linkedin_media_urn } };
  } else if (post.media_urls && post.media_urls[0]) {
    const allUrls: string[] = post.media_urls.filter(Boolean);
    const imageUrls = allUrls.filter((url) => !/\.(mp4|mov|webm|avi)(\?|$)/i.test(url));
    const isFirstVideo = /\.(mp4|mov|webm|avi)(\?|$)/i.test(allUrls[0]);

    async function uploadOneImage(mediaUrl: string): Promise<string | null> {
      try {
        const initRes = await fetch("https://api.linkedin.com/rest/images?action=initializeUpload", {
          method: "POST",
          headers,
          body: JSON.stringify({ initializeUploadRequest: { owner: author } }),
        });
        if (!initRes.ok) return null;
        const initData = await initRes.json();
        const uploadUrl = initData?.value?.uploadUrl;
        const imageUrn = initData?.value?.image;
        if (!uploadUrl || !imageUrn) return null;
        const imgRes = await fetch(mediaUrl);
        if (!imgRes.ok) return null;
        const imgBuffer = await imgRes.arrayBuffer();
        const contentType = imgRes.headers.get("content-type") || "image/jpeg";
        await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": contentType }, body: imgBuffer });
        return imageUrn;
      } catch {
        return null;
      }
    }

    if (!isFirstVideo && imageUrls.length > 1) {
      // LinkedIn's Posts API accepts multiple images via content.multiImage —
      // uploading each one is what was missing, so only the first image ever
      // made it into a scheduled post.
      const imageUrns = (await Promise.all(imageUrls.map(uploadOneImage))).filter((id): id is string => Boolean(id));
      if (imageUrns.length > 0) {
        postBody.content = { multiImage: { images: imageUrns.map((id) => ({ id })) } };
      }
    } else if (!isFirstVideo) {
      const imageUrn = await uploadOneImage(allUrls[0]);
      if (imageUrn) postBody.content = { media: { id: imageUrn } };
    }
  }

  const res = await fetch("https://api.linkedin.com/rest/posts", {
    method: "POST",
    headers,
    body: JSON.stringify(postBody),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "unknown");
    throw new Error(`LinkedIn post failed ${res.status}: ${errText}`);
  }
  // LinkedIn returns the post URN in the x-restli-id / x-linkedin-id header, not the body
  return res.headers.get("x-restli-id") || res.headers.get("x-linkedin-id") || undefined;
}

// ── YouTube ────────────────────────────────────────────────────
async function getValidYouTubeToken(account: any, userId: string): Promise<string> {
  const clientId = Deno.env.get("YOUTUBE_CLIENT_ID");
  const clientSecret = Deno.env.get("YOUTUBE_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    throw new Error("YOUTUBE_CLIENT_ID or YOUTUBE_CLIENT_SECRET not set in Supabase secrets.");
  }

  if (!account.refresh_token) {
    throw new Error("No YouTube refresh token stored. Reconnect your YouTube account.");
  }

  // Always refresh — access tokens expire in 1 hour
  const refreshRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: account.refresh_token,
      grant_type: "refresh_token",
    }),
  });

  if (!refreshRes.ok) {
    const err = await refreshRes.text();
    throw new Error(`YouTube token refresh failed (${refreshRes.status}): ${err}`);
  }

  const tokens = await refreshRes.json();
  const newAccessToken = tokens.access_token;

  if (!newAccessToken) {
    throw new Error(`YouTube token refresh returned no access_token: ${JSON.stringify(tokens)}`);
  }

  // Save refreshed token back to the exact account row we used — not just
  // "this user's youtube row", since a workspace account and this same
  // person's personal account can both exist for the platform. Matching by
  // id (falling back to the old user_id+platform behavior only if id is
  // somehow missing) keeps the refresh from bleeding onto the wrong row.
  const updateQuery = supabase
    .from("social_accounts")
    .update({
      access_token: newAccessToken,
      token_expires_at: tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
        : null,
    });

  if (account.id) {
    await updateQuery.eq("id", account.id);
  } else {
    await updateQuery
      .eq("user_id", userId)
      .eq("platform", "youtube")
      .is("workspace_id", null);
  }

  return newAccessToken;
}

async function publishToYouTube(post: any, account: any): Promise<string | undefined> {
  const videoId = post.youtube_video_id;
  if (!videoId) {
    throw new Error("No youtube_video_id on post. Delete this post and reschedule.");
  }

  const accessToken = await getValidYouTubeToken(account, post.user_id);

  const res = await fetch("https://www.googleapis.com/youtube/v3/videos?part=status", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      kind: "youtube#video",
      id: videoId,
      status: {
        privacyStatus: "public",
        selfDeclaredMadeForKids: false,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "unknown");
    throw new Error(`YouTube make-public failed (${res.status}): ${err}`);
  }
  return videoId;
}

// ── Instagram ──────────────────────────────────────────────────
async function publishToInstagram(post: any, account: any, mediaUrl: string, mediaType: "video" | "image"): Promise<string> {
  if (!mediaUrl) throw new Error("Instagram requires a public image or video URL.");
  const token = account.access_token;
  if (!token) throw new Error("Instagram token missing");

  const userId = account.account_id;
  // Instagram's caption is a single field with no separate title shown to
  // viewers — joining [title, description] posted the internal fallback
  // title (e.g. "Untitled Post") as literal caption text. Description alone,
  // falling back to title only if description is empty.
  const text = (post.description || post.title || "").trim();
  // Direct Instagram Login → graph.instagram.com; Meta/Page-linked → graph.facebook.com
  const isDirectLogin = (account.metadata as any)?.login_type === "instagram";
  const base = isDirectLogin
    ? `https://graph.instagram.com/${GRAPH_VERSION}`
    : `https://graph.facebook.com/${GRAPH_VERSION}`;

  const createParams = new URLSearchParams({ access_token: token, caption: text });

  // Carousel: 2-10 images posted together as one swipeable post. Reels/videos
  // are never carousel items, so only branch here for images.
  const allImageUrls: string[] = mediaType === "image" && Array.isArray(post.media_urls)
    ? post.media_urls.filter(Boolean)
    : [];

  if (allImageUrls.length > 1) {
    const statusParamsCarousel = new URLSearchParams({ access_token: token, fields: "status_code,status" });
    const carouselUrls = allImageUrls.slice(0, 10);
    const childIds = (await Promise.all(carouselUrls.map(async (url) => {
      const params = new URLSearchParams({ access_token: token, image_url: url, is_carousel_item: "true" });
      const res = await fetch(`${base}/${userId}/media`, { method: "POST", body: params });
      if (!res.ok) return undefined;
      const child = await res.json() as any;
      return child?.id as string | undefined;
    }))).filter((id): id is string => Boolean(id));

    if (childIds.length > 1) {
      const carouselParams = new URLSearchParams({ access_token: token, media_type: "CAROUSEL", caption: text });
      childIds.forEach((id, i) => carouselParams.set(`children[${i}]`, id));
      const container = await requireOk(
        await fetch(`${base}/${userId}/media`, { method: "POST", body: carouselParams }),
        "Instagram carousel creation failed"
      );
      for (let i = 0; i < 10; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        const statusRes = await fetch(`${base}/${container.id}?${statusParamsCarousel}`);
        const status = await statusRes.json() as any;
        if (status.status_code === "FINISHED") break;
        if (status.status_code === "ERROR") throw new Error(`Instagram media processing failed: ${status.status || "unknown"}`);
        if (i === 9) throw new Error("Instagram media did not finish processing in time.");
      }
      const publishRes = await fetch(`${base}/${userId}/media_publish`, {
        method: "POST",
        body: new URLSearchParams({ access_token: token, creation_id: container.id }),
      });
      return await requirePublishedId(publishRes, "Instagram publish failed");
    }
  }

  if (mediaType === "video") {
    createParams.set("media_type", "REELS");
    createParams.set("video_url", mediaUrl);
    createParams.set("share_to_feed", "true");
  } else {
    createParams.set("image_url", mediaUrl);
  }

  const container = await requireOk(
    await fetch(`${base}/${userId}/media`, { method: "POST", body: createParams }),
    "Instagram container creation failed"
  );

  const publishParams = new URLSearchParams({ access_token: token, creation_id: container.id });
  const statusParams = new URLSearchParams({ access_token: token, fields: "status_code,status" });

  const maxPolls = mediaType === "video" ? 30 : 10;
  const pollDelayMs = mediaType === "video" ? 5000 : 2000;
  let finished = mediaType !== "video" ? false : false;
  for (let i = 0; i < maxPolls; i++) {
    await new Promise((r) => setTimeout(r, pollDelayMs));
    const statusRes = await fetch(`${base}/${container.id}?${statusParams}`);
    const status = await statusRes.json() as any;
    if (status.status_code === "FINISHED") { finished = true; break; }
    if (status.status_code === "ERROR") throw new Error(`Instagram media processing failed: ${status.status || "unknown"}`);
  }
  if (!finished) throw new Error("Instagram media did not finish processing in time.");

  const publishRes = await fetch(`${base}/${userId}/media_publish`, { method: "POST", body: publishParams });
  return await requirePublishedId(publishRes, "Instagram publish failed");
}

// ── Facebook ───────────────────────────────────────────────────
async function publishToFacebook(post: any, account: any, mediaUrl: string, mediaType: "video" | "image"): Promise<string | undefined> {
  const token = account.access_token;
  if (!token) throw new Error("Facebook token missing");

  // Facebook posts/photos/videos have no separate title field — description
  // alone, falling back to title only if description is empty, so the
  // internal fallback title never leaks into the actual post text.
  const text = (post.description || post.title || "").trim();
  const base = `https://graph.facebook.com/${GRAPH_VERSION}/${account.account_id}`;

  if (mediaUrl && mediaType === "video") {
    const params = new URLSearchParams({ access_token: token, file_url: mediaUrl });
    if (text) params.set("description", text);
    const payload = await requireOk(
      await fetch(`${base}/videos`, { method: "POST", body: params }),
      "Facebook publish failed"
    );
    return payload?.id;
  }

  // Multiple images: upload each unpublished, then attach them all to one /feed post.
  const allImageUrls: string[] = mediaType === "image" && Array.isArray(post.media_urls)
    ? post.media_urls.filter(Boolean)
    : [];
  if (allImageUrls.length > 1) {
    const photoIds = (await Promise.all(allImageUrls.map(async (url) => {
      const params = new URLSearchParams({ access_token: token, url, published: "false" });
      const res = await fetch(`${base}/photos`, { method: "POST", body: params });
      if (!res.ok) return undefined;
      const child = await res.json() as any;
      return child?.id as string | undefined;
    }))).filter((id): id is string => Boolean(id));

    if (photoIds.length > 1) {
      const feedParams = new URLSearchParams({ access_token: token });
      if (text) feedParams.set("message", text);
      photoIds.forEach((id, i) => feedParams.set(`attached_media[${i}]`, JSON.stringify({ media_fbid: id })));
      const payload = await requireOk(
        await fetch(`${base}/feed`, { method: "POST", body: feedParams }),
        "Facebook publish failed"
      );
      return payload?.id;
    }
  }

  if (mediaUrl && mediaType === "image") {
    const params = new URLSearchParams({ access_token: token, url: mediaUrl });
    if (text) params.set("caption", text);
    const payload = await requireOk(
      await fetch(`${base}/photos`, { method: "POST", body: params }),
      "Facebook publish failed"
    );
    return payload?.id;
  }

  const params = new URLSearchParams({ access_token: token, message: text });
  const payload = await requireOk(
    await fetch(`${base}/feed`, { method: "POST", body: params }),
    "Facebook publish failed"
  );
  return payload?.id;
}

// ── Threads ────────────────────────────────────────────────────
async function publishToThreads(post: any, account: any, mediaUrl: string, mediaType: "video" | "image"): Promise<string> {
  const token = account.access_token;
  if (!token) throw new Error("Threads token missing");

  const userId = account.account_id;
  // Threads has no separate title field — description alone, falling back
  // to title only if description is empty, so the internal fallback title
  // never leaks into the actual post text.
  const text = (post.description || post.title || "").trim();

  // Threads API does NOT use version prefixes
  const statusParams = new URLSearchParams({ access_token: token, fields: "status,error_message" });

  // Threads carousel: 2-20 images posted together as one swipeable post.
  const allImageUrls: string[] = mediaType === "image" && Array.isArray(post.media_urls)
    ? post.media_urls.filter(Boolean)
    : [];
  if (allImageUrls.length > 1) {
    const carouselUrls = allImageUrls.slice(0, 20);
    const childIds = (await Promise.all(carouselUrls.map(async (url) => {
      const params = new URLSearchParams({
        access_token: token,
        is_carousel_item: "true",
        media_type: "IMAGE",
        image_url: url,
      });
      const res = await fetch(`https://graph.threads.net/${userId}/threads`, { method: "POST", body: params });
      if (!res.ok) return undefined;
      const child = await res.json() as any;
      return child?.id as string | undefined;
    }))).filter((id): id is string => Boolean(id));

    if (childIds.length > 1) {
      const carouselParams = new URLSearchParams({
        access_token: token,
        media_type: "CAROUSEL",
        children: childIds.join(","),
        text,
      });
      const container = await requireOk(
        await fetch(`https://graph.threads.net/${userId}/threads`, { method: "POST", body: carouselParams }),
        "Threads carousel creation failed"
      );
      for (let i = 0; i < 10; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        const statusRes = await fetch(`https://graph.threads.net/${container.id}?${statusParams}`);
        const status = await statusRes.json() as any;
        if (status.status === "FINISHED") break;
        if (status.status === "ERROR") throw new Error(`Threads media processing failed: ${status.error_message || "unknown"}`);
        if (i === 9) throw new Error("Threads media did not finish processing in time.");
      }
      const publishRes = await fetch(`https://graph.threads.net/${userId}/threads_publish`, {
        method: "POST",
        body: new URLSearchParams({ access_token: token, creation_id: container.id }),
      });
      return await requirePublishedId(publishRes, "Threads publish failed");
    }
  }

  const createParams = new URLSearchParams({ access_token: token, text });
  if (mediaUrl) {
    createParams.set("media_type", mediaType === "video" ? "VIDEO" : "IMAGE");
    createParams.set(mediaType === "video" ? "video_url" : "image_url", mediaUrl);
  } else {
    createParams.set("media_type", "TEXT");
  }

  const container = await requireOk(
    await fetch(`https://graph.threads.net/${userId}/threads`, { method: "POST", body: createParams }),
    "Threads container creation failed"
  );

  const publishParams = new URLSearchParams({ access_token: token, creation_id: container.id });

  const maxPolls = mediaType === "video" ? 30 : 10;
  const pollDelayMs = mediaType === "video" ? 5000 : 2000;
  let mediaFinished = !mediaUrl; // pure text posts have no container to wait on
  for (let i = 0; i < maxPolls && !mediaFinished; i++) {
    await new Promise((r) => setTimeout(r, pollDelayMs));
    try {
      const statusRes = await fetch(`https://graph.threads.net/${container.id}?${statusParams}`);
      const status = await statusRes.json() as any;
      if (status.status === "FINISHED") { mediaFinished = true; break; }
      if (status.status === "ERROR") throw new Error(`Threads media processing failed: ${status.error_message || "unknown"}`);
    } catch (e) {
      if (e instanceof Error && e.message.startsWith("Threads media processing failed")) throw e;
      // transient fetch error — keep polling
    }
  }
  if (!mediaFinished) throw new Error("Threads media did not finish processing in time.");

  const publishRes = await fetch(`https://graph.threads.net/${userId}/threads_publish`, {
    method: "POST", body: publishParams,
  });
  return await requirePublishedId(publishRes, "Threads publish failed");
}