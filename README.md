# Postelligence

A social media management dashboard that lets you write one post and publish it to multiple platforms simultaneously — LinkedIn, YouTube, Bluesky, Instagram, Facebook, Threads, and more.

Built with Next.js 14, Supabase, Tailwind CSS, and Recharts.

---

## Prerequisites

Before you begin, make sure you have the following installed:

- **Node.js v20+** — [Download here](https://nodejs.org/)
- **Yarn v1.22+** — Install with `npm install -g yarn`

---

## Getting Started

### 1. Install dependencies

```bash
yarn install
```

This project uses Yarn as its package manager. Do not use `npm install` or `pnpm install` — they generate competing lockfiles that will drift from `yarn.lock`.

---

### 2. Set up environment variables

Copy the example env file and fill in your credentials:

```bash
cp .env.example .env.local
```

Open `.env.local` and replace each placeholder value with your actual credentials. The `.env.example` file lists all required variables with descriptions. You do not need to fill in every platform — only add credentials for platforms you intend to connect.

---

### 3. Run the development server

**Standard HTTP (recommended for local dev):**

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**HTTPS (required for some OAuth callbacks like Instagram):**

```bash
yarn dev:https
```

Open [https://localhost:3000](https://localhost:3000) in your browser. SSL certificates are pre-generated in the `certificates/` folder.

---

## Database Setup

Run the Supabase migrations in order to create all required tables:

```
supabase/migrations/001_create_social_accounts.sql
supabase/migrations/002_create_media_bucket.sql
supabase/migrations/003_create_drafts_library_scheduled.sql
supabase/migrations/004_create_media_library_bucket.sql
supabase/migrations/005_add_content_hash_to_media_library.sql
supabase/migrations/005_enable_scheduler_publishing_status.sql
supabase/migrations/006_add_platform_results_to_scheduled_posts.sql
supabase/migrations/007_create_analytics_cache.sql
```

Apply them via the Supabase dashboard (SQL editor) or with the Supabase CLI:

```bash
npx supabase db push
```

---

## Supabase Edge Functions

If you modify any of the following files, redeploy the affected Edge Function:

- `supabase/functions/auto-publish/index.ts`
- `supabase/functions/auto-publish/deno.json`
- `supabase/functions/bluesky-video-upload/index.ts`

**Deploy auto-publish:**

```bash
npx supabase login
npx supabase functions deploy auto-publish --project-ref YOUR_PROJECT_REF
```

**Deploy bluesky-video-upload:**

```bash
npx supabase functions deploy bluesky-video-upload --project-ref YOUR_PROJECT_REF
```

---

## Platform Support

| Platform   | Publishing | Analytics        | Notes |
|------------|-----------|------------------|-------|
| LinkedIn   | ✅         | ⚠️ Partial        | Engagement requires `r_member_social` LinkedIn approval |
| YouTube    | ✅         | ✅ Full           | Requires Google OAuth with YouTube Data API v3 |
| Bluesky    | ✅         | ✅ Full           | Uses public API, no extra permissions needed |
| Instagram  | ✅         | ✅ Full           | Requires Meta Business/Creator account |
| Facebook   | ✅         | ⚠️ Partial        | Post analytics require Meta `pages_read_user_content` approval |
| Threads    | ✅         | ✅ Full           | Requires Meta developer app |
| Twitter/X  | 🚧 WIP     | ❌ Not yet        | Integration under development |
| Pinterest  | ❌ Planned | ❌ Not yet        | Planned for a future release |
| Reddit     | ❌ Planned | ❌ Not yet        | Awaiting developer approval |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion |
| Charts | Recharts |
| Icons | lucide-react |
| Auth & Database | Supabase (PostgreSQL + Auth) |
| File Storage | Supabase Storage |
| Edge Functions | Supabase Edge Functions (Deno) |
| Package Manager | Yarn (v1 Classic) |

---

## Project Structure

```
Postelligence/
├── app/
│   ├── page.tsx                        # Landing / login page
│   ├── auth/                           # OAuth callbacks (Google + per platform)
│   ├── dashboard/
│   │   ├── page.tsx                    # Main dashboard (server component)
│   │   ├── DashboardClient.tsx         # Interactive dashboard UI
│   │   ├── DashboardShellClient.tsx    # Sidebar + navbar shell
│   │   └── (shell)/                   # Sub-pages with shared layout
│   │       ├── analytics/             # Analytics dashboard with charts
│   │       ├── calendar/              # Scheduled post calendar
│   │       ├── drafts/                # Draft management
│   │       ├── library/               # Media library
│   │       ├── integrations/          # Platform connections
│   │       └── ai-studio/             # AI caption/hashtag tools
│   └── api/
│       ├── integrations/<platform>/   # connect / callback / disconnect per platform
│       ├── posts/publish/             # Core multi-platform publish engine
│       ├── analytics/refresh/         # Manual + background analytics cache refresh
│       ├── media/                     # LinkedIn & YouTube media pre-upload
│       ├── media-library/             # Media library CRUD
│       ├── scheduled-posts/           # Scheduled post CRUD
│       └── scheduler/run/             # Cron-triggered auto-publisher
├── components/
│   ├── ui/                            # Button, Badge, GlassPanel
│   └── email-auth-form.tsx
├── lib/
│   ├── supabase/                      # Supabase client wrappers
│   ├── integrations/                  # Per-platform OAuth + API helpers
│   ├── analytics/
│   │   ├── social-analytics.ts        # Live analytics fetcher (all platforms)
│   │   └── analytics-cache.ts         # Supabase-backed cache (stale-while-revalidate)
│   ├── scheduler/auto-publisher.ts    # Scheduled post publishing logic
│   └── types.ts                       # Shared TypeScript types
└── supabase/
    ├── migrations/                    # SQL migration files
    └── functions/                     # Deno edge functions
```

---

*Built by Siddharth Jagdale*