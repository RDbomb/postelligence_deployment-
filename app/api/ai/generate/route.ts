import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent";

export type AIGenerateMode =
  | "caption"
  | "hashtags"
  | "hooks"
  | "cta"
  | "content-ideas"
  | "content-calendar"
  | "rewrite"
  | "repurpose"
  | "trends-list"
  | "trends-post";

interface AIGenerateRequest {
  mode: AIGenerateMode;
  topic?: string;
  platform?: string;
  tone?: string;
  existingContent?: string;
  targetPlatforms?: string[];
  count?: number;
}

function buildPrompt(req: AIGenerateRequest): string {
  const { mode, topic, platform, tone, existingContent, targetPlatforms, count } = req;
  const toneStr = tone ? `Tone: ${tone}.` : "";
  const platformStr = platform ? `Platform: ${platform}.` : "";
  const countStr = count ? count : 5;

  switch (mode) {
    case "caption":
      return `You are a world-class social media copywriter. Generate ${countStr} engaging social media captions for the following topic.
Topic: "${topic}"
${platformStr} ${toneStr}
Requirements:
- Each caption should be unique with a different angle
- Include relevant emojis naturally
- Make them authentic, not salesy
- Vary the length (some short, some medium)
- Each caption on a new line, numbered 1. 2. 3. etc.
Return ONLY the captions, no extra explanation.`;

    case "hashtags":
      return `You are a social media hashtag strategist. Generate ${countStr} high-performing hashtags for:
Topic: "${topic}"
${platformStr} ${toneStr}
Requirements:
- Mix of popular (1M+ posts), medium (100K-1M), and niche (<100K) hashtags
- Relevant and specific to the topic
- No banned or spammy hashtags
- Format each hashtag with # prefix
- Group them: Popular | Medium | Niche (3 groups)
Return ONLY the hashtag groups, no extra explanation.`;

    case "hooks":
      return `You are a viral content strategist. Generate ${countStr} scroll-stopping social media hooks for:
Topic: "${topic}"
${platformStr} ${toneStr}
Hook types to include: question hook, bold statement, curiosity gap, data/statistic, story opener, controversy.
Requirements:
- Each hook must make someone stop scrolling
- Under 20 words each
- Numbered list
Return ONLY the hooks, no extra explanation.`;

case "cta":
  return `You are an elite direct-response marketing copywriter.

Generate ${countStr} high-converting social media CTAs for:

Topic: "${topic}"

${platformStr}
${toneStr}

Requirements:
- Maximum 8-12 words each
- Action-oriented
- Natural and human sounding
- Avoid generic phrases
- Mix different CTA types:
  * Follow
  * Save
  * Comment
  * Share
  * Download
  * Sign Up
  * Free Trial
  * Visit Website
- Create curiosity, urgency, or value
- Suitable for social media posts
- Each CTA should feel different

Examples:
✓ Save this post for your next content sprint.
✓ Ready to grow faster? Start your free trial.
✓ Follow for weekly social media strategies.
✓ Comment "AI" and we'll send the guide.

Return ONLY a numbered list.`;

    case "content-ideas":
      return `You are a content strategist. Generate ${countStr} creative content ideas for:
Topic/Niche: "${topic}"
${platformStr} ${toneStr}
For each idea provide:
- Title (bold)
- Format (e.g., carousel, reel, static post, story)
- Brief description (1-2 sentences)
- Why it will perform well

Return a numbered list. Be specific and actionable.`;

    case "content-calendar":
      return `You are a social media manager. Create a 7-day content calendar for:
Niche/Brand: "${topic}"
${targetPlatforms ? `Platforms: ${targetPlatforms.join(", ")}.` : ""} ${toneStr}

For each day provide:
**Day X - [Day Name]**
- Post Type: (e.g., educational, promotional, engagement, behind-the-scenes)
- Platform: 
- Content Idea: (specific topic)
- Caption Hook: (opening line)
- Best Posting Time: (suggested)

Make it realistic, varied, and aligned with the niche. Return the full 7-day calendar.`;

    case "rewrite":
      return `You are a social media copywriter. Rewrite the following content to make it more engaging.
Original content: "${existingContent}"
${platformStr} ${toneStr}
Requirements:
- Preserve the core message
- Make it more compelling and authentic  
- Improve clarity and flow
- Add emojis if appropriate
- ${count ? `Provide ${count} different rewrites` : "Provide 3 different rewrites"}

Return numbered rewrites, no extra explanation.`;

    case "repurpose":
      return `You are a content repurposing expert. Take this content and repurpose it for multiple platforms.
Original content: "${existingContent}"
${targetPlatforms ? `Target platforms: ${targetPlatforms.join(", ")}.` : "Target all major platforms."} ${toneStr}

For each platform provide:
**[Platform Name]**
- Format recommendation
- Adapted content (platform-optimized)
- Platform-specific tips

Make each version feel native to that platform.`;

    case "trends-list":
      return `You are a social media trend forecasting analyst. Generate a list of 5 current, highly viral social media trends across tech, business, marketing, lifestyle, and design.
For each trend, provide:
1. Title: A short, catchy title of the trend (under 5 words).
2. Explanation: A brief 1-sentence description of what it is and why it's trending.
3. Category: e.g. Tech, Marketing, Business, Design, or Lifestyle.
4. Image Prompt: A detailed, creative prompt for an AI image generator to create a matching high-quality visual representation of this trend.
5. Caption Prompt: A specific prompt instruction to generate a good caption for this trend.

Return ONLY a valid JSON array of objects with the keys: "title", "explanation", "category", "imagePrompt", "captionPrompt". Do NOT wrap it in any Markdown formatting (no backticks), return ONLY the raw JSON string.`;

    case "trends-post":
      return `You are a viral social media strategist. Generate a single high-performing post caption about the following trend.
Trend: "${topic}"
Description: "${existingContent}"
Requirements:
- Make it highly engaging and authentic
- Hook the reader in the first sentence
- Add relevant emojis naturally
- End with a strong call-to-action
- Add 3-5 relevant hashtags at the bottom
Return ONLY the caption, no extra explanation.`;

    default:
      return `Generate social media content for: "${topic}". ${platformStr} ${toneStr}`;
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: AIGenerateRequest = await req.json();
    const { mode } = body;

    if (!mode) {
      return NextResponse.json({ error: "mode is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
    }

    const prompt = buildPrompt(body);

    const geminiRes = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.85,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        ],
      }),
    });

    if (!geminiRes.ok) {
      const errData = await geminiRes.json().catch(() => ({}));
      console.error("Gemini API error:", errData);
      return NextResponse.json(
        { error: errData?.error?.message || "Gemini API request failed" },
        { status: geminiRes.status }
      );
    }

    const data = await geminiRes.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return NextResponse.json({ error: "No content generated" }, { status: 500 });
    }

    if (mode === "trends-list") {
      try {
        const jsonStr = text.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(jsonStr);
        return NextResponse.json({ result: parsed, mode });
      } catch (err) {
        console.error("JSON parse error for trends-list:", err, text);
        return NextResponse.json({ error: "Failed to parse trends data", rawText: text, mode }, { status: 500 });
      }
    }

    return NextResponse.json({ result: text, mode });
  } catch (err) {
    console.error("AI generate error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}