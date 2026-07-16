import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createBaseClient } from "@supabase/supabase-js";
import { createHash } from "crypto";

export const maxDuration = 60; // Allow execution to take up to 60 seconds

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

  // 1. Check Global Scheduler Tick (Supabase pg_cron or Vercel cron hitting without a user session / specific user query)
  if (isServiceRole && !req.headers.get("X-User-Id") && !req.nextUrl.searchParams.get("user_id")) {
    const baseClient = createBaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    // Fetch all active automation configurations
    const { data: allSettings, error: allErr } = await baseClient
      .from("automation_settings")
      .select("*")
      .eq("is_enabled", true);

    if (allErr) {
      return NextResponse.json({ error: `Failed to fetch active settings: ${allErr.message}` }, { status: 500 });
    }

    const results = [];
    for (const settings of (allSettings || [])) {
      const targetTime = getNextPostTime(settings.post_time);
      const diffMs = targetTime.getTime() - Date.now();
      const diffMins = Math.floor(diffMs / 60000);

      // Trigger if we are 10 minutes before posting time (accepts 8-12m buffer)
      if (diffMins >= 8 && diffMins <= 12) {
        try {
          // Fetch user's registered email to fallback on
          const { data: { user: dbUser } } = await baseClient.auth.admin.getUserById(settings.user_id);
          const email = dbUser?.email || "";
          
          const runRes = await runAutomationForUser(baseClient, settings.user_id, settings, email, req.nextUrl.origin, false);
          results.push({ user_id: settings.user_id, success: true, response: runRes });
        } catch (e: any) {
          results.push({ user_id: settings.user_id, success: false, error: e.message || String(e) });
        }
      }
    }

    return NextResponse.json({ message: "Global automation cron completed", results });
  }

  // 2. Resolve Single User Context (Test run or targeted bypass calls)
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
    const { data: settings, error: settingsError } = await supabase
      .from("automation_settings")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (settingsError) throw settingsError;
    if (!settings) {
      return NextResponse.json({ error: "Automation settings not configured." }, { status: 400 });
    }

    // Time Check for single manual trigger runs (bypass if manual test)
    if (!isManualTest) {
      const targetTime = getNextPostTime(settings.post_time);
      const diffMs = targetTime.getTime() - Date.now();
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 8 || diffMins > 12) {
        return NextResponse.json({
          message: `Not the scheduled run time (runs 10 minutes before posting). Current diff: ${diffMins} minutes.`,
        });
      }
    }

    const res = await runAutomationForUser(supabase, userId, settings, user.email || "", req.nextUrl.origin, isManualTest);
    return NextResponse.json(res);

  } catch (err: any) {
    console.error("Automation Single User Error:", err);
    return NextResponse.json({ error: err.message || "Failed during automation processing." }, { status: 500 });
  }
}

// core automation script
async function runAutomationForUser(supabase: any, userId: string, settings: any, userEmail: string, origin: string, isTest = false) {
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

  // Fallback
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

  // Fallback Image
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
    // Automatic Mode: Insert directly into scheduled_posts
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

    const { data: logEntry } = await supabase
      .from("automation_logs")
      .insert({
        user_id: userId,
        trend_title: trendTitle,
        caption: caption,
        media_url: publicMediaUrl,
        mode: "automatic",
        status: "approved",
        scheduled_post_id: post.id,
      })
      .select()
      .single();

    return {
      success: true,
      mode: "automatic",
      log: logEntry,
      scheduledPost: post,
    };

  } else {
    // Manual Approval Mode: Save draft to database as pending
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

    // Send Resend Email Notification
    const resendApiKey = process.env.RESEND_API_KEY;
    let emailSent = false;
    let emailError = null;

    if (resendApiKey) {
      try {
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const token = createHash("sha256")
          .update(logEntry.id + userId + serviceRoleKey)
          .digest("hex");

        const scheduleUrl = `${origin}/api/automation/external-approve?logId=${logEntry.id}&action=schedule&token=${token}`;
        const publishUrl = `${origin}/api/automation/external-approve?logId=${logEntry.id}&action=publish&token=${token}`;
        const rejectUrl = `${origin}/api/automation/external-approve?logId=${logEntry.id}&action=reject&token=${token}`;

        const emailHtml = `
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f6f7f1; padding: 24px 0;">
            <tr>
              <td align="center">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; background-color: #ffffff; border: 1px solid #e1e3de; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(31,37,40,0.03);">
                  <tr>
                    <td style="padding: 32px;">
                      <!-- Header -->
                      <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td>
                            <p style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #2f7867; margin: 0 0 6px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">PostSync Engine</p>
                            <h2 style="font-size: 22px; font-weight: 900; color: #1f2528; margin: 0 0 20px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; letter-spacing: -0.5px;">New Trend Draft Generated</h2>
                          </td>
                        </tr>
                      </table>

                      <!-- Trend Information & Caption -->
                      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fcfdfb; border: 1px solid #eef0eb; border-radius: 12px; margin-bottom: 24px;">
                        <tr>
                          <td style="padding: 20px;">
                            <h4 style="font-size: 14px; font-weight: 800; color: #1f2528; margin: 0 0 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">Topic: ${trendTitle}</h4>
                            <p style="font-size: 13px; color: #2b3338; line-height: 1.6; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; white-space: pre-wrap;">${caption}</p>
                          </td>
                        </tr>
                      </table>

                      <!-- Media Attachment -->
                      ${publicMediaUrl ? `
                      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
                        <tr>
                          <td>
                            <img src="${publicMediaUrl}" alt="Trend Visual" width="100%" style="width: 100%; max-width: 100%; height: auto; display: block; border-radius: 12px; border: 1px solid #eaeaea;" />
                          </td>
                        </tr>
                      </table>
                      ` : ""}

                      <!-- Directions Text -->
                      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
                        <tr>
                          <td>
                            <p style="font-size: 13px; color: #5a656c; line-height: 1.6; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                              This post was generated exactly 10 minutes before your target posting time (${post_time.slice(0, 5)}). Please review the options below to approve or discard it:
                            </p>
                          </td>
                        </tr>
                      </table>

                      <!-- CTA Actions -->
                      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 20px;">
                        <tr>
                          <td>
                            <a href="${scheduleUrl}" style="display: inline-block; background-color: #2f7867; color: #ffffff; font-size: 13px; font-weight: 750; padding: 12px 20px; text-decoration: none; border-radius: 10px; margin-right: 8px; margin-bottom: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; text-align: center;">Approve & Schedule</a>
                            <a href="${publishUrl}" style="display: inline-block; background-color: #f3f6f1; color: #2f7867; font-size: 13px; font-weight: 750; padding: 12px 20px; text-decoration: none; border-radius: 10px; border: 1px solid rgba(47, 120, 103, 0.15); margin-right: 8px; margin-bottom: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; text-align: center;">Publish Now</a>
                            <a href="${rejectUrl}" style="display: inline-block; background-color: #ffffff; color: #e11d48; font-size: 13px; font-weight: 750; padding: 12px 20px; text-decoration: none; border-radius: 10px; border: 1px solid #fecdd3; margin-bottom: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; text-align: center;">Reject</a>
                          </td>
                        </tr>
                      </table>

                      <!-- Divider & Footer -->
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

        const emailRes = await fetch("https://api.resend.com/emails", {
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

        const emailData = await emailRes.json();
        if (emailRes.ok) {
          emailSent = true;
        } else {
          emailError = emailData.message || "Failed to deliver email through Resend API";
        }
      } catch (e: any) {
        console.error("Resend email post failed:", e);
        emailError = e.message || String(e);
      }
    } else {
      emailError = "Resend API key is missing. Add RESEND_API_KEY to your environment variables.";
    }

    return {
      success: true,
      mode: "manual",
      log: logEntry,
      emailSent,
      emailError,
    };
  }
}
