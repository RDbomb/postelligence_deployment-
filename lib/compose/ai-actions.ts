// Postelligence — Compose AI menu configuration
//
// Purely declarative: every action is data (label + how to build a request
// body), not a branch in a switch statement. Adding a new tone, platform,
// or language later is a one-line addition here — CreateClient.tsx just
// renders whatever groups/items exist.
//
// All requests are built for the EXISTING /api/ai/generate endpoint (the
// same one AI Studio uses) — no new AI provider, no duplicated prompts.

export type AIApplyMode = "replace" | "append";

export interface AIActionRequestBody {
  mode: "rewrite" | "hashtags" | "cta";
  existingContent?: string;
  topic?: string;
  platform?: string;
  tone?: string;
  count?: number;
}

export interface AIMenuItem {
  id: string;
  label: string;
  /** "replace" swaps the whole Post Text; "append" adds to the end (hashtags/CTA). */
  applyMode: AIApplyMode;
  /** Shown while the request is in flight, e.g. "Optimizing for LinkedIn...". */
  loadingMessage: string;
  buildRequest: (caption: string) => AIActionRequestBody;
}

export interface AIMenuGroup {
  id: string;
  label: string;
  items: AIMenuItem[];
}

// Most actions are "rewrite the whole post with this tone" — a single
// factory covers all of them so no two call sites duplicate the request shape.
function rewriteItem(id: string, label: string, tone: string, loadingMessage: string, platform?: string): AIMenuItem {
  return {
    id,
    label,
    applyMode: "replace",
    loadingMessage,
    buildRequest: (caption: string) => ({
      mode: "rewrite",
      existingContent: caption,
      tone,
      ...(platform ? { platform } : {}),
    }),
  };
}

const TONES = ["Professional", "Friendly", "Casual", "Educational", "Inspirational", "Confident", "Motivational"];
const LANGUAGES = ["Hindi", "Marathi", "Spanish", "French", "German", "Japanese"];

export const AI_MENU_GROUPS: AIMenuGroup[] = [
  {
    id: "improve",
    label: "Improve Writing",
    items: [
      rewriteItem("improve-caption", "Improve Caption", "clearer and better structured, same meaning, minimal changes", "Improving your caption..."),
      rewriteItem("make-engaging", "Make More Engaging", "more engaging and attention-grabbing, same meaning preserved", "Making it more engaging..."),
      rewriteItem("fix-grammar", "Fix Grammar", "grammatically correct with fixed spelling and punctuation only — do not change the writing style otherwise", "Fixing grammar..."),
      rewriteItem("rewrite-hook", "Rewrite Opening Hook", "rewritten with a stronger, scroll-stopping opening line in the first sentence, with the rest of the message kept intact", "Rewriting your opening hook..."),
      rewriteItem("expand-post", "Expand Post", "expanded into a richer, more detailed version with more context, without inventing any new facts", "Expanding your post..."),
      rewriteItem("condense-post", "Condense Post", "condensed and shortened as much as possible while preserving every important piece of information", "Condensing your post..."),
    ],
  },
  {
    id: "platform",
    label: "Optimize for Platform",
    items: [
      rewriteItem("opt-instagram", "Instagram", "more conversational and visual, Instagram-native phrasing", "Optimizing for Instagram...", "Instagram"),
      rewriteItem("opt-facebook", "Facebook", "friendly and community-focused", "Optimizing for Facebook...", "Facebook"),
      rewriteItem("opt-linkedin", "LinkedIn", "professional, structured, thought-leadership style", "Optimizing for LinkedIn...", "LinkedIn"),
      rewriteItem("opt-threads", "Threads", "short and conversational", "Optimizing for Threads...", "Threads"),
      rewriteItem("opt-bluesky", "Bluesky", "very concise, comfortably within Bluesky's 300-character limit", "Optimizing for Bluesky...", "Bluesky"),
      rewriteItem("opt-youtube", "YouTube", "formatted as a clear, well-structured YouTube description with a clear call to action", "Optimizing for YouTube...", "YouTube"),
    ],
  },
  {
    id: "tone",
    label: "Change Tone",
    items: TONES.map((tone) =>
      rewriteItem(`tone-${tone.toLowerCase()}`, tone, `rewritten in a ${tone.toLowerCase()} tone, same meaning preserved`, `Rewriting in a ${tone.toLowerCase()} tone...`)
    ),
  },
  {
    id: "enhance",
    label: "Enhance Post",
    items: [
      {
        id: "gen-hashtags",
        label: "Generate Hashtags",
        applyMode: "append",
        loadingMessage: "Generating hashtags...",
        buildRequest: (caption) => ({ mode: "hashtags", topic: caption, count: 9 }),
      },
      {
        id: "gen-cta",
        label: "Generate Call-to-Action",
        applyMode: "append",
        loadingMessage: "Generating a call-to-action...",
        buildRequest: (caption) => ({ mode: "cta", topic: caption, count: 3 }),
      },
      rewriteItem("add-emojis", "Add Emojis", "with a few tasteful, contextually appropriate emojis added — avoid emoji spam, and match whether the original is professional or casual", "Adding emojis..."),
      rewriteItem("improve-readability", "Improve Readability", "reformatted into shorter, easy-to-read paragraphs with better line breaks, same wording and meaning", "Improving readability..."),
    ],
  },
  {
    id: "language",
    label: "Translate",
    items: LANGUAGES.map((lang) =>
      rewriteItem(
        `lang-${lang.toLowerCase()}`,
        lang,
        `fully translated into ${lang} — translate every sentence, do not leave any part of it in the original language — while preserving the original meaning, tone, formatting, hashtags, and emojis`,
        `Translating to ${lang}...`
      )
    ),
  },
];