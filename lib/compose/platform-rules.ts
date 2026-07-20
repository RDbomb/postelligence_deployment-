// Centralized platform metadata for the Compose page.
//
// This is the single source of truth for anything platform-specific in
// Compose: character limits, title limits, feed capabilities, "See more"
// truncation points, and the short educational notes shown to the user.
// Every Compose component reads from here instead of hardcoding platform
// rules inline, so the rules can't drift between the counter, the
// capability panel, and the preview.
//
// Only platforms that are actually selectable in Compose today
// (see PLATFORM_CONFIG in lib/types.ts — twitter/pinterest/reddit are not
// yet `available`) have entries here.

export type ComposePlatformId =
  | "instagram"
  | "facebook"
  | "linkedin"
  | "youtube"
  | "threads"
  | "bluesky"
  | "discord"
  | "telegram";

export type CapabilityStatus = "supported" | "partial" | "unsupported";

export interface PlatformCapability {
  label: string;
  status: CapabilityStatus;
  note?: string;
}

export interface PlatformComposeRule {
  id: ComposePlatformId;
  name: string;
  // Max characters for the main post text/caption. This is what platforms
  // actually enforce on publish.
  captionLimit: number;
  // Where this platform's feed view truncates the caption behind a
  // "See more" tap. `null` means this platform doesn't collapse text in a
  // way worth surfacing (e.g. YouTube's description panel isn't clipped
  // the same way a feed post is).
  feedTruncateAt: number | null;
  // One-line, always-true educational note about how this platform
  // transforms or handles the post (link behavior, character ceiling, etc).
  transformationNote: string;
  // What this platform can actually carry in a single post.
  capabilities: PlatformCapability[];
  // Suffix shown next to a field label to explain why it appeared,
  // e.g. "Location (Instagram)".
  fieldTag: string;
}

export const PLATFORM_COMPOSE_RULES: Record<ComposePlatformId, PlatformComposeRule> = {
  instagram: {
    id: "instagram",
    name: "Instagram",
    captionLimit: 2200,
    feedTruncateAt: 125,
    transformationNote: "Caption links are not clickable.",
    fieldTag: "Instagram",
    capabilities: [
      { label: "Caption", status: "supported" },
      { label: "Images", status: "supported" },
      { label: "Video", status: "supported" },
      { label: "Carousel", status: "supported" },
      { label: "Location", status: "supported" },
      { label: "Clickable caption links", status: "unsupported", note: "Put links in bio instead." },
    ],
  },
  facebook: {
    id: "facebook",
    name: "Facebook",
    captionLimit: 63206,
    feedTruncateAt: 125,
    transformationNote: "Link preview supported.",
    fieldTag: "Facebook",
    capabilities: [
      { label: "Text", status: "supported" },
      { label: "Images", status: "supported" },
      { label: "Video", status: "supported" },
      { label: "Link Preview", status: "supported" },
    ],
  },
  linkedin: {
    id: "linkedin",
    name: "LinkedIn",
    captionLimit: 3000,
    feedTruncateAt: 220,
    transformationNote: "Rich link preview supported.",
    fieldTag: "LinkedIn",
    capabilities: [
      { label: "Text", status: "supported" },
      { label: "Images", status: "supported" },
      { label: "Video", status: "supported" },
      { label: "Link Preview", status: "supported" },
      { label: "Articles", status: "unsupported", note: "Standard feed posts only — Articles have their own format and aren't supported yet." },
    ],
  },
  threads: {
    id: "threads",
    name: "Threads",
    captionLimit: 500,
    feedTruncateAt: null,
    transformationNote: "Links are included inline.",
    fieldTag: "Threads",
    capabilities: [
      { label: "Text", status: "supported" },
      { label: "Images", status: "supported" },
      { label: "Video", status: "supported" },
    ],
  },
  bluesky: {
    id: "bluesky",
    name: "Bluesky",
    captionLimit: 300,
    feedTruncateAt: null,
    transformationNote: "Character limit is 300 — the tightest of any connected platform.",
    fieldTag: "Bluesky",
    capabilities: [
      { label: "Text", status: "supported" },
      { label: "Images", status: "supported" },
      { label: "Video", status: "supported" },
    ],
  },
  discord: {
    id: "discord",
    name: "Discord",
    captionLimit: 2000,
    feedTruncateAt: null,
    transformationNote: "Messages support Markdown and inline embeds.",
    fieldTag: "Discord",
    capabilities: [
      { label: "Text", status: "supported" },
      { label: "Embeds", status: "supported" },
      { label: "Images", status: "supported" },
    ],
  },
  telegram: {
    id: "telegram",
    name: "Telegram",
    captionLimit: 4096,
    feedTruncateAt: null,
    transformationNote: "Rich HTML/Markdown formatting and caption links are supported.",
    fieldTag: "Telegram",
    capabilities: [
      { label: "Text", status: "supported" },
      { label: "Photos", status: "supported" },
      { label: "Videos", status: "supported" },
    ],
  },
  youtube: {
    id: "youtube",
    name: "YouTube",
    captionLimit: 5000,
    feedTruncateAt: null,
    transformationNote: "Description supports up to 5000 characters; only the video title shows in search results.",
    fieldTag: "YouTube",
    capabilities: [
      { label: "Video Upload", status: "supported" },
      { label: "Video Title", status: "supported" },
      { label: "Description", status: "supported" },
    ],
  },
};

export const YOUTUBE_TITLE_LIMIT = 100;
export const YOUTUBE_TITLE_RECOMMENDED = 70;

export function getCaptionStatusColor(length: number, limit: number): "green" | "yellow" | "red" {
  if (length > limit) return "red";
  if (length >= limit * 0.9) return "yellow";
  return "green";
}

export function getTitleStatusColor(length: number): "green" | "yellow" | "red" {
  if (length > YOUTUBE_TITLE_LIMIT) return "red";
  if (length > YOUTUBE_TITLE_RECOMMENDED) return "yellow";
  return "green";
}

export const STATUS_COLOR_CLASSES: Record<"green" | "yellow" | "red", string> = {
  green: "text-[#2f7867]",
  yellow: "text-amber-500",
  red: "text-rose-500",
};

export const STATUS_BG_CLASSES: Record<"green" | "yellow" | "red", string> = {
  green: "bg-[#eaf7ef] border-[#2f7867]/20 text-[#2f7867]",
  yellow: "bg-amber-50 border-amber-200 text-amber-700",
  red: "bg-rose-50 border-rose-200 text-rose-600",
};

export type PlatformPublishReadiness = {
  platform: ComposePlatformId;
  state: "ready" | "warning" | "error";
  reasons: string[];
};

// One function, called from the platform selector cards, the capability
// panel, and the publish modal, so "is this platform actually ready to
// publish" is computed exactly once.
export function getPlatformReadiness(
  id: ComposePlatformId,
  opts: {
    captionLength: number;
    hasTitle: boolean;
    titleLength: number;
    hasMedia: boolean;
    hasVideo: boolean;
  }
): PlatformPublishReadiness {
  const rule = PLATFORM_COMPOSE_RULES[id];
  const reasons: string[] = [];
  let state: "ready" | "warning" | "error" = "ready";

  const captionColor = getCaptionStatusColor(opts.captionLength, rule.captionLimit);
  if (captionColor === "red") {
    reasons.push(`Too long for ${rule.name} (${opts.captionLength}/${rule.captionLimit})`);
    state = "error";
  } else if (captionColor === "yellow") {
    reasons.push(`Near the ${rule.name} character limit`);
    if (state === "ready") state = "warning";
  }

  if (id === "youtube") {
    if (!opts.hasVideo) {
      reasons.push("Missing video");
      state = "error";
    }
    if (opts.hasTitle) {
      const titleColor = getTitleStatusColor(opts.titleLength);
      if (titleColor === "red") {
        reasons.push(`Title too long (${opts.titleLength}/${YOUTUBE_TITLE_LIMIT})`);
        state = "error";
      } else if (titleColor === "yellow" && state !== "error") {
        state = "warning";
      }
    }
  }

  if ((id === "instagram") && !opts.hasMedia) {
    reasons.push("Missing media");
    state = "error";
  }

  return { platform: id, state, reasons };
}

// Live, non-blocking recommendations shown per selected platform while
// typing. These never prevent publishing — purely educational.
export function getPlatformRecommendations(
  id: ComposePlatformId,
  captionLength: number
): string[] {
  const rule = PLATFORM_COMPOSE_RULES[id];
  const tips: string[] = [];

  if (rule.feedTruncateAt && captionLength > rule.feedTruncateAt) {
    tips.push(`Your hook appears after the feed preview cutoff (~${rule.feedTruncateAt} characters) — the opening line is what people actually see first.`);
  }

  if (id === "linkedin") {
    tips.push(`No title required for feed posts. Focus on a strong opening sentence — only the first ~${rule.feedTruncateAt} characters show before "See more".`);
  }

  if (id === "threads" && captionLength >= rule.captionLimit * 0.85 && captionLength <= rule.captionLimit) {
    tips.push("You're close to the character limit.");
  }

  if (id === "facebook" && captionLength > 400) {
    tips.push("Long posts may be collapsed behind \"See more\" in the feed.");
  }

  return tips;
}