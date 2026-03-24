# InternTracker — Product Requirements Document

**Version:** 1.0
**Date:** March 23, 2026
**Author:** Dizzpy (Anuja Rathnayaka)
**Status:** MVP — Personal Use + 4 Friends

---

## 1. Product overview

### 1.1 What is this?

InternTracker is a job application tracker built specifically for SE/CS students going through multi-round tech interview pipelines. Unlike generic trackers (Huntr, Teal), this models the full interview lifecycle per company — OA rounds, phone screens, technical interviews, system design, HR rounds — not just a single "interviewing" bucket.

### 1.2 Why build this?

Existing tools treat applications as: Saved → Applied → Interviewing → Offer. But SE/CS interviews have 3-7 stages per company, each with different prep, different contacts, and different timelines. No tool models this properly. Additionally, nothing serves the Sri Lankan/South Asian job market with LKR salary support and local job board integrations.

### 1.3 Target users (MVP)

- Primary: Dizzpy (the builder, actively applying for Flutter/SE internships)
- Secondary: 4 university friends, all final-year SE students at NSBM Green University
- All 5 users are in Sri Lanka, applying to local companies

### 1.4 Success criteria

- All 5 users actively tracking applications within 1 week of launch
- Replaces the existing Notion tracker completely
- Each user has logged at least 5 applications with pipeline stages within 2 weeks

---

## 2. Tech stack

### 2.1 Core stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| Framework | Next.js 15 (App Router) | SSR, API routes, familiar from Macks project |
| Language | TypeScript | Type safety, Prisma integration |
| ORM | Prisma | No raw SQL, type-safe queries, auto-migrations |
| Database | Supabase PostgreSQL | Hosted Postgres, free tier, Prisma-compatible |
| Hosting | Vercel (free tier) | Zero-config Next.js deployment |
| Styling | Tailwind CSS 4 | Utility-first, matches Orchestra design tokens |
| Font | General Sans (Fontshare) | Self-hosted variable woff2 |
| Icons | Lucide React | Thin-stroke, consistent with Orchestra aesthetic |
| Drag & Drop | @dnd-kit/core | Kanban board drag-and-drop |
| Charts | Recharts | Analytics dashboard visualizations |
| Date handling | date-fns | Lightweight date formatting/calculations |

### 2.2 Why Prisma + Supabase (not raw SQL)

Prisma provides a schema file (`schema.prisma`) that feels like TypeScript. You define models, Prisma generates migrations and fully typed client. Supabase is just the hosted PostgreSQL — you never open the Supabase dashboard for DB management. When going SaaS later, swap env-based auth for Supabase Auth or NextAuth — the DB layer stays identical.

### 2.3 Auth strategy (MVP)

Simple env-based password protection. No full auth system.

```
AUTH_PASSWORD=your-shared-password-here
```

**Flow:**
1. User visits the app → middleware checks for `auth-token` cookie
2. If no cookie → redirect to `/login` page
3. User enters the shared password (from `AUTH_PASSWORD` env var)
4. If correct → set `auth-token` cookie (httpOnly, 30-day expiry), redirect to `/`
5. After login → user picks or creates a profile (just a display name)
6. Profile ID stored in `profile-id` cookie, all data scoped to this profile
7. Each user sees only their own applications

**SaaS migration path:** Replace the password check middleware with NextAuth or Supabase Auth. Migrate profiles to user accounts. Zero data schema changes needed.

---

## 3. Design system

### 3.1 Theme — Orchestra-inspired

The UI follows the Orchestra (getorchestra.com) design language: near-black backgrounds, warm gray surfaces, minimal accent color, no shadows, no gradients. Elevation is communicated through background color shifts only.

### 3.2 Color tokens

#### Dark theme (default)

```css
:root {
  /* Backgrounds */
  --bg: #0A0A0A;                    /* Page background, main canvas */
  --surface: #141414;               /* Sidebar, cards, elevated panels */
  --surface-elevated: #1C1C1C;      /* Modals, dropdowns, popovers, inputs */
  --surface-hover: #262626;         /* Hover states on list items, rows */

  /* Borders */
  --border: #2A2A2A;                /* Card borders, dividers, input outlines */
  --border-hover: #3A3A3A;          /* Input focus, hover border */

  /* Text */
  --text-primary: #FFFFFF;          /* Headings, primary labels, active nav */
  --text-secondary: #A1A1A1;        /* Body text, descriptions */
  --text-muted: #6B6B6B;            /* Placeholders, hints, disabled text */

  /* Accent */
  --accent: #6C5CE7;                /* Primary CTA buttons (used sparingly) */
  --accent-hover: #5A4BD6;          /* CTA hover */

  /* Semantic */
  --success: #22C55E;               /* Passed, accepted, active */
  --warning: #EAB308;               /* Pending, upcoming deadline */
  --danger: #EF4444;                /* Rejected, failed, expired */
  --info: #3B82F6;                  /* Links, current/active stage */
}
```

#### Light theme

```css
[data-theme="light"] {
  --bg: #FFFFFF;
  --surface: #F7F7F7;
  --surface-elevated: #EFEFEF;
  --surface-hover: #E8E8E8;
  --border: #E5E5E5;
  --border-hover: #D4D4D4;
  --text-primary: #0A0A0A;
  --text-secondary: #525252;
  --text-muted: #9C9C9C;
  /* Accent and semantic colors remain the same */
}
```

### 3.3 Typography

**Font:** General Sans (from Fontshare by Indian Type Foundry)
**Source:** `https://api.fontshare.com/v2/css?f[]=general-sans@200,300,400,500,600,700&display=swap`
**Or self-host:** Download variable woff2 from fontshare.com/fonts/general-sans

| Role | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| Page title | 24-28px | 600 | 1.2 | "Applications", "Analytics" |
| Section heading | 18-20px | 500 | 1.3 | Card headers, modal titles |
| Label / nav | 14px | 500 | 1.4 | Sidebar items, buttons, table headers |
| Body | 14px | 400 | 1.5 | Descriptions, form inputs, table cells |
| Caption | 12px | 400 | 1.4 | Timestamps, badges, helper text |

### 3.4 Spacing scale

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Inline gaps, badge padding |
| sm | 8px | Between related elements |
| md | 12px | Card internal padding, form gaps |
| lg | 16px | Section spacing |
| xl | 24px | Between major sections |
| 2xl | 32px | Page-level padding |

### 3.5 Border radius

| Element | Radius |
|---------|--------|
| Buttons | 6px |
| Inputs | 8px |
| Cards | 12px |
| Modals | 16px |
| Avatars / pills | 50% or 9999px |

### 3.6 Component rules

- **No shadows anywhere.** Elevation = bg color shift only
- **No gradients.** Flat fills only
- **Borders:** 1px solid var(--border). Not 0.5px
- **Transitions:** 150ms ease for all hover/focus states
- **Icons:** Lucide React, 18-20px, stroke-width 1.5, color inherits text
- **Inputs:** height 40px, bg: surface-elevated, border: border, radius 8px, placeholder: text-muted, focus: border-hover
- **Primary buttons:** bg: white, text: black (dark mode) OR bg: surface, border: border, text: white (outline style)
- **CTA buttons:** bg: accent (#6C5CE7), text: white, no border, radius 8px. Used sparingly
- **Sidebar:** width 220px, bg: surface, right border. Active item: surface-hover bg + text-primary. Inactive: text-secondary
- **Cards:** bg: surface or bg, border: border, radius 12px, padding 16-20px
- **Tooltips:** bg: accent, text: white, radius 12px

### 3.7 Tailwind config mapping

```js
// tailwind.config.ts
module.exports = {
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-elevated': 'var(--surface-elevated)',
        'surface-hover': 'var(--surface-hover)',
        border: 'var(--border)',
        'border-hover': 'var(--border-hover)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        accent: 'var(--accent)',
        'accent-hover': 'var(--accent-hover)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',
        info: 'var(--info)',
      },
      fontFamily: {
        sans: ['General Sans', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        btn: '6px',
        input: '8px',
        card: '12px',
        modal: '16px',
      },
    },
  },
}
```

---

## 4. Database schema (Prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── PROFILES ───────────────────────────────────────────
// Simple profile system (not full auth). Each user picks a name.
model Profile {
  id           String        @id @default(cuid())
  name         String        @unique
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  applications Application[]
  customSources Source[]
  customTypes   JobType[]
  pipelineTemplates PipelineTemplate[]
}

// ─── APPLICATIONS ───────────────────────────────────────
model Application {
  id            String          @id @default(cuid())
  profileId     String
  profile       Profile         @relation(fields: [profileId], references: [id], onDelete: Cascade)

  // Company info
  companyName   String
  companyUrl    String?         // Company website or LinkedIn URL
  position      String
  jobPostUrl    String?         // Original job listing URL

  // Classification
  jobType       String          // "Intern", "Trainee SE", "Junior Dev", or custom
  workMode      String          // "on-site", "remote", "hybrid", "no-data"
  appliedVia    String          // "RoosterJob", "LinkedIn", "Direct Mail", etc.

  // Compensation
  salaryMin     Float?
  salaryMax     Float?
  currency      String          @default("LKR")
  location      String?

  // Status
  status        ApplicationStatus @default(SAVED)

  // Dates
  appliedDate   DateTime?       // Null if status is SAVED (not yet applied)
  firstResponseDate DateTime?   // When you first heard back
  deadline      DateTime?       // For SAVED applications — when posting expires

  // Notes
  notes         String?         // General notes for this application

  // Relations
  stages        PipelineStage[]
  contacts      Contact[]
  documents     Document[]
  activityLog   Activity[]

  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  @@index([profileId])
  @@index([profileId, status])
  @@index([profileId, appliedDate])
}

enum ApplicationStatus {
  SAVED       // Wishlist — not yet applied
  APPLIED     // Application submitted
  IN_PROGRESS // At least one interview stage active
  OFFER       // Received offer
  ACCEPTED    // Accepted the offer
  REJECTED    // Got rejected at any stage
  GHOSTED     // No response after threshold (default 14 days)
  WITHDRAWN   // You withdrew your application
}

// ─── PIPELINE STAGES ────────────────────────────────────
// Each application has its own ordered pipeline of interview stages
model PipelineStage {
  id            String        @id @default(cuid())
  applicationId String
  application   Application   @relation(fields: [applicationId], references: [id], onDelete: Cascade)

  name          String        // "OA", "Phone Screen", "Technical Round 1", etc.
  order         Int           // 1, 2, 3... determines display order
  status        StageStatus   @default(UPCOMING)
  scheduledDate DateTime?     // When this stage is scheduled
  completedDate DateTime?     // When this stage was completed
  notes         String?       // "2 LC mediums", "Asked about Flutter", etc.

  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  @@index([applicationId])
  @@unique([applicationId, order])
}

enum StageStatus {
  UPCOMING
  COMPLETED
  PASSED
  FAILED
  SKIPPED
}

// ─── CONTACTS ───────────────────────────────────────────
model Contact {
  id            String      @id @default(cuid())
  applicationId String
  application   Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)

  name          String
  role          String      // "Recruiter", "Hiring Manager", "Interviewer", "HR"
  email         String?
  phone         String?
  linkedinUrl   String?
  stageName     String?     // Which pipeline stage they were involved in
  notes         String?

  createdAt     DateTime    @default(now())

  @@index([applicationId])
}

// ─── DOCUMENTS ──────────────────────────────────────────
// Links to CV versions, cover letters, portfolios (URLs only, no file uploads in MVP)
model Document {
  id            String      @id @default(cuid())
  applicationId String
  application   Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)

  name          String      // "Mobile Dev CV v3", "Cover Letter", "Portfolio"
  url           String      // Link to Google Drive, GitHub, etc.
  type          String      // "cv", "cover-letter", "portfolio", "other"

  createdAt     DateTime    @default(now())

  @@index([applicationId])
}

// ─── ACTIVITY LOG ───────────────────────────────────────
// Auto-generated timeline of all events
model Activity {
  id            String      @id @default(cuid())
  applicationId String
  application   Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)

  type          String      // "status_change", "stage_update", "note_added", "contact_added"
  description   String      // Human-readable: "Status changed from Applied to In Progress"
  metadata      Json?       // Extra structured data (old/new values, etc.)

  createdAt     DateTime    @default(now())

  @@index([applicationId])
  @@index([applicationId, createdAt])
}

// ─── REUSABLE PRESETS ───────────────────────────────────
// User-specific custom values for dropdowns
model Source {
  id        String   @id @default(cuid())
  profileId String
  profile   Profile  @relation(fields: [profileId], references: [id], onDelete: Cascade)
  name      String   // "RoosterJob", "Company HR Page", etc.
  usageCount Int     @default(0)  // For sorting most-used to top

  @@unique([profileId, name])
}

model JobType {
  id        String   @id @default(cuid())
  profileId String
  profile   Profile  @relation(fields: [profileId], references: [id], onDelete: Cascade)
  name      String   // "Flutter Intern", "Trainee SE", etc.
  usageCount Int     @default(0)

  @@unique([profileId, name])
}

// ─── PIPELINE TEMPLATES ─────────────────────────────────
model PipelineTemplate {
  id        String   @id @default(cuid())
  profileId String
  profile   Profile  @relation(fields: [profileId], references: [id], onDelete: Cascade)
  name      String   // "SL Company", "Standard Tech", "FAANG-style"
  stages    Json     // Array of stage names: ["Applied", "OA", "Phone Screen", ...]
  isDefault Boolean  @default(false)

  createdAt DateTime @default(now())

  @@unique([profileId, name])
}
```

### 4.1 Default seed data

Every new profile gets these presets seeded automatically:

**Default sources:** RoosterJob, LinkedIn, Direct Mail, BambooHR, Company Website, Referral, Indeed, GitHub Jobs

**Default job types:** Intern, Trainee SE, Junior Dev, Mid-level Dev, SE Intern

**Default pipeline templates:**
- "SL company" → ["Interview", "Offer"]
- "Standard tech" → ["OA", "Phone Screen", "Technical", "HR", "Offer"]
- "FAANG-style" → ["OA", "Phone Screen", "Technical 1", "Technical 2", "System Design", "Behavioral", "Team Match", "Offer"]

---

## 5. Folder structure

```
intern-tracker/
├── .env.local                    # DATABASE_URL, AUTH_PASSWORD
├── .env.example                  # Template for env vars
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── prisma/
│   ├── schema.prisma             # Database schema (Section 4)
│   ├── migrations/               # Auto-generated by Prisma
│   └── seed.ts                   # Default presets seeder
├── public/
│   └── fonts/
│       └── GeneralSans-Variable.woff2
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Root layout: font loading, theme provider, sidebar
│   │   ├── globals.css           # CSS variables (Section 3.2), Tailwind imports
│   │   ├── login/
│   │   │   └── page.tsx          # Password login page
│   │   ├── (dashboard)/          # Route group — all authed pages share sidebar layout
│   │   │   ├── layout.tsx        # Sidebar + main content area layout
│   │   │   ├── page.tsx          # Dashboard home → redirects to /board
│   │   │   ├── board/
│   │   │   │   └── page.tsx      # Kanban board view
│   │   │   ├── list/
│   │   │   │   └── page.tsx      # Table/list view
│   │   │   ├── analytics/
│   │   │   │   └── page.tsx      # Analytics dashboard
│   │   │   ├── timeline/
│   │   │   │   └── page.tsx      # Global activity timeline
│   │   │   └── settings/
│   │   │       └── page.tsx      # Profile, templates, preferences
│   │   └── api/
│   │       ├── auth/
│   │       │   └── login/
│   │       │       └── route.ts  # POST: verify password, set cookie
│   │       ├── applications/
│   │       │   ├── route.ts      # GET (list), POST (create)
│   │       │   └── [id]/
│   │       │       ├── route.ts  # GET, PATCH, DELETE single application
│   │       │       ├── stages/
│   │       │       │   ├── route.ts      # GET, POST stages
│   │       │       │   └── [stageId]/
│   │       │       │       └── route.ts  # PATCH, DELETE single stage
│   │       │       ├── contacts/
│   │       │       │   └── route.ts      # GET, POST contacts
│   │       │       ├── documents/
│   │       │       │   └── route.ts      # GET, POST documents
│   │       │       └── activity/
│   │       │           └── route.ts      # GET activity log
│   │       ├── analytics/
│   │       │   └── route.ts      # GET aggregated analytics data
│   │       ├── presets/
│   │       │   ├── sources/
│   │       │   │   └── route.ts  # GET, POST custom sources
│   │       │   ├── job-types/
│   │       │   │   └── route.ts  # GET, POST custom job types
│   │       │   └── templates/
│   │       │       └── route.ts  # GET, POST pipeline templates
│   │       └── timeline/
│   │           └── route.ts      # GET global activity feed
│   ├── components/
│   │   ├── ui/                   # Base UI primitives
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── modal.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── tooltip.tsx
│   │   │   ├── dropdown.tsx
│   │   │   ├── pill-toggle.tsx   # Work mode selector (on-site/remote/hybrid)
│   │   │   ├── searchable-select.tsx  # Applied via, job type selectors
│   │   │   └── date-picker.tsx
│   │   ├── layout/
│   │   │   ├── sidebar.tsx       # Main navigation sidebar
│   │   │   ├── header.tsx        # Page header with title + actions
│   │   │   └── theme-toggle.tsx  # Dark/light theme switch
│   │   ├── board/
│   │   │   ├── kanban-board.tsx  # Full Kanban board container
│   │   │   ├── kanban-column.tsx # Single column (Saved, Applied, etc.)
│   │   │   └── application-card.tsx  # Draggable card in the board
│   │   ├── list/
│   │   │   ├── applications-table.tsx  # Sortable, filterable table
│   │   │   ├── table-filters.tsx       # Filter bar
│   │   │   └── table-row.tsx           # Single row with inline editing
│   │   ├── application/
│   │   │   ├── add-application-modal.tsx    # Create/edit form modal
│   │   │   ├── application-detail.tsx       # Full detail view (slide-over or page)
│   │   │   ├── pipeline-stages.tsx          # Horizontal step indicator
│   │   │   ├── stage-editor.tsx             # Edit a single stage
│   │   │   ├── contacts-list.tsx            # Contacts tab in detail
│   │   │   ├── documents-list.tsx           # Documents tab in detail
│   │   │   ├── activity-feed.tsx            # Timeline in detail view
│   │   │   └── company-link.tsx             # Company name + external link icon
│   │   └── analytics/
│   │       ├── stat-cards.tsx        # Top-level metric cards
│   │       ├── funnel-chart.tsx      # Applied → Reply → Interview → Offer
│   │       ├── source-chart.tsx      # Response rate by source
│   │       ├── timeline-chart.tsx    # Applications over time
│   │       └── status-donut.tsx      # Current status distribution
│   ├── lib/
│   │   ├── prisma.ts             # Prisma client singleton
│   │   ├── auth.ts               # Auth helpers (verify cookie, get profile)
│   │   ├── utils.ts              # General utilities (cn, formatDate, etc.)
│   │   ├── constants.ts          # Default presets, status colors, stage names
│   │   └── analytics.ts          # Analytics calculation helpers
│   ├── hooks/
│   │   ├── use-applications.ts   # SWR/fetch hook for applications
│   │   ├── use-analytics.ts      # SWR hook for analytics data
│   │   └── use-presets.ts        # SWR hook for sources/types/templates
│   ├── types/
│   │   └── index.ts              # TypeScript types (Application, Stage, etc.)
│   └── middleware.ts             # Auth middleware — check cookie on every request
```

---

## 6. Feature specifications

### 6.1 Module 1: Add application

**Route:** Modal overlay, accessible from any page via "+ Add" button in header

**Form fields:**

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| Company name | text | yes | — | Free text |
| Company URL | url | no | — | Website or LinkedIn. Shown as clickable icon |
| Position | text | yes | — | Free text |
| Job post URL | url | no | — | Original listing link |
| Job type | searchable-select | yes | — | Presets + custom "Add new" option |
| Work mode | pill-toggle | yes | "no-data" | on-site / remote / hybrid / no-data |
| Applied via | searchable-select | yes | — | Presets sorted by usage count + "Add new" |
| Salary min | number | no | — | — |
| Salary max | number | no | — | — |
| Currency | select | no | "LKR" | LKR, USD, EUR, GBP, AUD |
| Location | text | no | — | Free text |
| Applied date | date | no | today | Null if "Save for later" |
| Status | auto | — | APPLIED | Or SAVED if "Save for later" toggle is on |
| Pipeline template | select | no | — | Pick template → auto-creates stages |
| Notes | textarea | no | — | — |

**User flow:**
1. User clicks "+ Add" button (always visible in header, top right)
2. Modal opens with form
3. "Save for later" toggle at top — if ON, minimal fields required (company + position + job URL), status = SAVED, no applied date
4. If OFF (default), status = APPLIED, applied date = today
5. Optional: pick a pipeline template → stages auto-created
6. Save → card appears in correct Kanban column
7. Activity log entry auto-created: "Application created"

**Validation:**
- Company name: required, 1-100 chars
- Position: required, 1-100 chars
- Salary: min must be <= max if both provided
- URLs: basic URL format validation (starts with http/https)
- Applied via: required, must select or create

### 6.2 Module 2: Save for later (wishlist)

**Not a separate feature — it's a toggle within the Add Application modal.**

**Behavior:**
- When "Save for later" is ON:
  - Only company, position, and job post URL are required
  - Status = SAVED
  - Applied date = null
  - Optional deadline field appears (when posting expires)
- Saved cards appear in the "Saved" Kanban column (leftmost, dashed border, muted appearance)
- Saved cards with deadlines show countdown badge: "3 days left" (amber), "Expired" (red)
- Expired cards float to bottom of Saved column, not auto-deleted
- "Mark as applied" action: opens pre-filled form to complete remaining fields → status changes to APPLIED

**Deadline logic:**
- If deadline is set and is in the future: show "X days left" badge
- If deadline is within 48 hours: badge turns amber/warning
- If deadline has passed: badge turns red "Expired"
- Sort saved column: approaching deadlines first, then by creation date

### 6.3 Module 3: Interview pipeline (per application)

**This is the core differentiator.**

**Accessing:** Click any application card → detail view → Pipeline section

**Pipeline display:** Horizontal step indicator showing stages in order. Each step has:
- Stage name (text)
- Status icon (color-coded): upcoming (gray circle), completed (blue check), passed (green check), failed (red x), skipped (gray dash)
- Date (if set)

**Adding stages:**
- Click "+" between any two stages → dropdown with presets: OA, Phone Screen, Technical Round, System Design, HR Round, Take-home, Behavioral, Team Match
- Or type a custom name
- Stage gets inserted at that position, others reorder

**Editing a stage:**
- Click any stage → inline editor opens below
- Fields: status (dropdown), scheduled date, completed date, notes
- When status changes to PASSED → next stage auto-sets to UPCOMING
- When status changes to FAILED → application status auto-changes to REJECTED, with confirmation dialog: "Mark application as rejected?"

**Pipeline templates:**
- When creating application, optionally pick a template
- Templates create stages in bulk
- Users can save current application's pipeline as a new template: "Save as template" button
- 3 built-in templates (seeded, described in 4.1)

**Auto-calculations:**
- Days between each stage (shown as subtle label between steps)
- Total time from applied → current stage
- These feed into the analytics module

### 6.4 Module 4: Kanban board

**Route:** `/board` (default view)

**Columns (left to right):**
1. **Saved** — dashed border, muted cards. For wishlist items
2. **Applied** — submitted but no response yet
3. **In progress** — at least one pipeline stage active
4. **Offer** — received an offer
5. **Accepted** — accepted the offer
6. **Rejected** — rejected at any stage
7. **Ghosted** — no response after 14 days (configurable)

**Column headers:** Show count: "Applied (5)"

**Card display:**
- Company name (with external link icon if URL exists)
- Position title
- Work mode badge (colored pill)
- Current pipeline stage (if in progress): "Technical Round 1"
- Days since last activity: "5 days ago"
- Upcoming interview indicator: if interview scheduled within 48 hours, subtle pulsing dot

**Drag and drop:**
- Cards can be dragged between columns
- Dropping into "In progress" prompts: "Set up pipeline stages?" (if none exist)
- Dropping into "Rejected" prompts: "Add rejection reason?" (optional)
- Status updates reflected immediately, activity log auto-created

**Ghosted auto-detection:**
- Background check: applications in APPLIED status with no activity for 14+ days
- Show subtle inline suggestion on the card: "No response for 14 days — mark as ghosted?"
- User clicks to confirm or dismiss
- Threshold configurable in settings (default 14 days)

**Visual rules:**
- Ghosted cards: reduced opacity (0.6)
- Cards with upcoming interviews (next 48h): subtle left-border accent (info color)
- Saved cards with approaching deadlines: warning left-border

### 6.5 Module 5: Table/list view

**Route:** `/list`

**Features:**
- All applications in a sortable table
- Columns: Company (with link), Position, Type, Work Mode, Status, Applied Via, Applied Date, Current Stage, Salary, Location
- Click any column header to sort (asc/desc toggle)
- Filter bar above table:
  - Status: multi-select checkboxes
  - Work mode: pill filter
  - Applied via: multi-select
  - Date range: from/to date pickers
  - Has salary: toggle
- Quick inline editing: click any cell to edit in-place (text cells, status dropdown, date picker)
- Bulk actions: checkbox column, select multiple → "Move to..." status, "Delete selected"
- Click row to open application detail (same as clicking card in Kanban)
- Pagination: 25 per page, with page numbers

### 6.6 Module 6: Contacts

**Accessed from:** Application detail view → "Contacts" tab

**Fields per contact:**
| Field | Type | Required |
|-------|------|----------|
| Name | text | yes |
| Role | select | yes (Recruiter, Hiring Manager, Interviewer, HR, Other) |
| Email | email | no |
| Phone | tel | no |
| LinkedIn URL | url | no |
| Stage involvement | text | no ("Technical Round 1 interviewer") |
| Notes | text | no |

**Interactions:**
- Click email → opens `mailto:` link
- Click LinkedIn → opens in new tab
- Click phone → opens `tel:` link
- Contacts display as compact cards within the detail view

### 6.7 Module 7: Documents

**Accessed from:** Application detail view → "Documents" tab

**No file uploads in MVP — URLs only.**

**Fields per document:**
| Field | Type | Required |
|-------|------|----------|
| Name | text | yes ("Mobile Dev CV v3") |
| URL | url | yes (Google Drive link, GitHub, etc.) |
| Type | select | yes (CV, Cover Letter, Portfolio, Other) |

**Display:** List of document links, grouped by type. Click to open in new tab.

### 6.8 Module 8: Analytics dashboard

**Route:** `/analytics`

**Stat cards (top row):**
- Total applications (count)
- Response rate (% that moved past APPLIED)
- Interview rate (% that reached at least one interview stage)
- Offer rate (% that received offers)
- Avg days to first response

**Each stat card is clickable — filters the table view to show matching applications.**

**Charts:**

1. **Funnel chart** (vertical bar/funnel):
   - Applied → Got Response → Interview → Offer
   - Shows count and % at each level
   - Dropoff between levels highlighted

2. **Source effectiveness** (horizontal bar chart):
   - X-axis: response rate (%)
   - Y-axis: each source (RoosterJob, LinkedIn, Direct Mail, etc.)
   - Only show sources with 2+ applications
   - Color-coded: green if above average, red if below

3. **Applications over time** (line chart):
   - X-axis: weeks/months
   - Y-axis: count of applications
   - Second line: responses received

4. **Status distribution** (donut chart):
   - Current breakdown: Applied, In Progress, Offer, Rejected, Ghosted, etc.
   - Interactive: click a segment to filter

5. **Ghosted analysis** (table or bar):
   - Which sources have highest ghost rate
   - Average ghost time by source

**Data calculations (in `src/lib/analytics.ts`):**
```typescript
// Response rate = (total - APPLIED - SAVED - GHOSTED) / (total - SAVED)
// Interview rate = (IN_PROGRESS + OFFER + ACCEPTED) / (total - SAVED)
// Offer rate = (OFFER + ACCEPTED) / (total - SAVED)
// Avg days to first response = avg(firstResponseDate - appliedDate) where firstResponseDate exists
```

### 6.9 Module 9: Activity timeline

**Route:** `/timeline`

**Global chronological feed of all activity across all applications.**

**Each entry shows:**
- Timestamp (relative: "2 hours ago", absolute on hover)
- Application: company + position (clickable link to detail)
- Event description: "Status changed from Applied to In Progress", "Added OA stage", "Logged contact: John (Recruiter)"
- Event type icon (status change, stage update, note added, etc.)

**Auto-generated events:**
- Application created
- Status changed (old → new)
- Pipeline stage added/updated/completed
- Contact added
- Document added
- Note added

**Filtering:** By application, by event type, by date range

### 6.10 Module 10: Settings

**Route:** `/settings`

**Sections:**

1. **Profile:** Edit display name
2. **Pipeline templates:** View, create, edit, delete templates
3. **Custom presets:** Manage custom sources, job types
4. **Preferences:**
   - Ghost threshold (days, default 14)
   - Default currency
   - Default pipeline template for new applications
5. **Theme:** Dark/Light toggle
6. **Data:** Export all data as JSON (for backup)

---

## 7. API design

### 7.1 Conventions

- All API routes under `/api/`
- All responses return JSON
- Success: `{ data: ... }`
- Error: `{ error: { message: string, code: string } }`
- HTTP status codes: 200 (ok), 201 (created), 400 (bad request), 401 (unauthorized), 404 (not found), 500 (server error)
- All mutations (POST, PATCH, DELETE) auto-create activity log entries
- Profile ID extracted from cookie in every request via `getProfile()` helper

### 7.2 Endpoints

```
GET    /api/applications              → List all (with filters: ?status=&source=&workMode=&from=&to=&sort=&order=&page=&limit=)
POST   /api/applications              → Create new
GET    /api/applications/:id          → Get single with stages, contacts, documents
PATCH  /api/applications/:id          → Update fields
DELETE /api/applications/:id          → Soft delete (or hard delete in MVP)

GET    /api/applications/:id/stages   → List stages (ordered)
POST   /api/applications/:id/stages   → Add stage (with order position)
PATCH  /api/applications/:id/stages/:stageId → Update stage
DELETE /api/applications/:id/stages/:stageId → Remove stage

GET    /api/applications/:id/contacts → List contacts
POST   /api/applications/:id/contacts → Add contact

GET    /api/applications/:id/documents → List documents
POST   /api/applications/:id/documents → Add document

GET    /api/applications/:id/activity → Get activity log for this application

GET    /api/analytics                 → Aggregated stats (funnel, source effectiveness, etc.)
GET    /api/timeline                  → Global activity feed (paginated, filterable)

GET    /api/presets/sources           → List sources (sorted by usage)
POST   /api/presets/sources           → Add custom source
GET    /api/presets/job-types         → List job types
POST   /api/presets/job-types         → Add custom job type
GET    /api/presets/templates         → List pipeline templates
POST   /api/presets/templates         → Create template
```

### 7.3 Request/response examples

**POST /api/applications**
```json
{
  "companyName": "X4 Digital Labs (Pvt) Ltd",
  "companyUrl": "https://x4digital.com",
  "position": "Junior Flutter Developer",
  "jobPostUrl": "https://roosterjob.com/job/12345",
  "jobType": "Intern",
  "workMode": "on-site",
  "appliedVia": "RoosterJob",
  "salaryMin": 40000,
  "salaryMax": 60000,
  "currency": "LKR",
  "location": "Mawanella",
  "appliedDate": "2026-03-08",
  "status": "APPLIED",
  "templateId": "cuid-of-standard-tech-template",
  "notes": "Saw on RoosterJob, looks like a good fit"
}
```

**Response: 201**
```json
{
  "data": {
    "id": "cuid...",
    "companyName": "X4 Digital Labs (Pvt) Ltd",
    "status": "APPLIED",
    "stages": [
      { "id": "...", "name": "OA", "order": 1, "status": "UPCOMING" },
      { "id": "...", "name": "Phone Screen", "order": 2, "status": "UPCOMING" },
      { "id": "...", "name": "Technical", "order": 3, "status": "UPCOMING" },
      { "id": "...", "name": "HR", "order": 4, "status": "UPCOMING" },
      { "id": "...", "name": "Offer", "order": 5, "status": "UPCOMING" }
    ],
    "contacts": [],
    "documents": [],
    "createdAt": "2026-03-23T..."
  }
}
```

---

## 8. Error handling

### 8.1 API error handling

Every API route follows this pattern:

```typescript
export async function POST(req: Request) {
  try {
    const profile = await getProfile(req);
    if (!profile) {
      return NextResponse.json(
        { error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 }
      );
    }

    const body = await req.json();
    // Validate with Zod schema
    const parsed = createApplicationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { message: 'Validation failed', code: 'VALIDATION_ERROR', details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    // Business logic...
    const application = await prisma.application.create({ ... });

    return NextResponse.json({ data: application }, { status: 201 });

  } catch (error) {
    console.error('POST /api/applications error:', error);
    return NextResponse.json(
      { error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}
```

### 8.2 Validation (Zod)

Use Zod for all input validation. Install: `zod`

```typescript
// src/lib/validations.ts
import { z } from 'zod';

export const createApplicationSchema = z.object({
  companyName: z.string().min(1).max(100),
  companyUrl: z.string().url().optional().or(z.literal('')),
  position: z.string().min(1).max(100),
  jobPostUrl: z.string().url().optional().or(z.literal('')),
  jobType: z.string().min(1),
  workMode: z.enum(['on-site', 'remote', 'hybrid', 'no-data']),
  appliedVia: z.string().min(1),
  salaryMin: z.number().positive().optional(),
  salaryMax: z.number().positive().optional(),
  currency: z.string().default('LKR'),
  location: z.string().optional(),
  appliedDate: z.string().datetime().optional(),
  status: z.enum(['SAVED', 'APPLIED']).default('APPLIED'),
  templateId: z.string().optional(),
  notes: z.string().optional(),
}).refine(
  (data) => {
    if (data.salaryMin && data.salaryMax) {
      return data.salaryMin <= data.salaryMax;
    }
    return true;
  },
  { message: 'Salary min must be less than or equal to max' }
);
```

### 8.3 Client-side error handling

- All fetch calls wrapped in try/catch
- Toast notifications for success/error using a simple toast system (no library needed, build a minimal one)
- Optimistic updates for drag-and-drop (revert on API failure)
- Form validation shown inline (red border + error message below field)
- Loading states: skeleton loaders for initial page load, spinner for form submissions

### 8.4 Error boundaries

Wrap the dashboard layout in a React Error Boundary:
```typescript
// src/components/error-boundary.tsx
// Catches render errors, shows fallback UI with "Retry" button
```

---

## 9. Security

### 9.1 Authentication

- `AUTH_PASSWORD` env var — never exposed to client
- Password compared using timing-safe comparison (`crypto.timingSafeEqual`)
- Auth token cookie: `httpOnly`, `secure` (in production), `sameSite: lax`, 30-day max-age
- Token is a random UUID generated on login, stored as-is (no JWT needed for MVP)
- Middleware checks cookie on every request except `/login` and `/api/auth/login`

### 9.2 Data isolation

- Every database query includes `WHERE profileId = ?`
- Profile ID comes from cookie (set during profile selection)
- No cross-profile data leakage possible — all queries scoped

### 9.3 Input sanitization

- All user inputs validated with Zod before DB operations
- Prisma parameterized queries (no SQL injection possible)
- URLs validated as proper format before storing
- XSS prevention: React auto-escapes output. No `dangerouslySetInnerHTML` anywhere

### 9.4 Rate limiting

- Not needed for MVP (5 users max)
- For SaaS: add rate limiting middleware using `@upstash/ratelimit`

### 9.5 Environment variables

```env
# .env.local
DATABASE_URL="postgresql://..."     # Supabase connection string
AUTH_PASSWORD="your-password-here"  # Shared access password
NODE_ENV="development"
```

---

## 10. Performance

### 10.1 Database

- Indexes defined in Prisma schema on all query-hot fields (profileId, status, appliedDate)
- Compound indexes for common filter combinations
- Use Prisma `select` to fetch only needed fields (not full relations every time)
- Analytics queries: aggregate at the API level, not fetch-all-then-compute

### 10.2 Frontend

- Use SWR or React Query for data fetching with caching
- Optimistic updates for drag-and-drop and inline edits
- Lazy load analytics charts (dynamic import)
- Debounce search/filter inputs (300ms)
- Skeleton loaders instead of spinners for page-level loading

### 10.3 Vercel-specific

- API routes run as serverless functions (cold start ~200ms)
- Static pages (login) pre-rendered at build time
- Images: none in MVP (no company logos — just text)

---

## 11. Deployment

### 11.1 Setup steps

1. Create Supabase project → get DATABASE_URL (connection pooler string)
2. Create Vercel project → link to GitHub repo
3. Add env vars in Vercel: DATABASE_URL, AUTH_PASSWORD
4. Run `npx prisma migrate deploy` (or set up in build command)
5. Run `npx prisma db seed` (seeds default presets)
6. Deploy

### 11.2 Build command

```json
// package.json
{
  "scripts": {
    "build": "prisma generate && next build",
    "postinstall": "prisma generate",
    "db:migrate": "prisma migrate deploy",
    "db:seed": "prisma db seed",
    "dev": "next dev"
  },
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

### 11.3 Vercel settings

- Framework: Next.js (auto-detected)
- Build command: `npm run build`
- Install command: `npm install`
- Node.js version: 20.x

---

## 12. Build order (sprint plan)

### Week 1: Foundation + core CRUD

**Day 1-2:**
- Init Next.js project with TypeScript, Tailwind
- Set up Prisma + connect to Supabase
- Create schema, run initial migration
- Seed default data
- Set up General Sans font
- Create globals.css with all CSS variables
- Build base UI components (button, input, modal, badge)

**Day 3-4:**
- Auth: login page + middleware + cookie handling
- Profile selection page
- Dashboard layout: sidebar + main area
- API: applications CRUD
- Add Application modal with full form

**Day 5-7:**
- Kanban board with drag-and-drop
- Application cards with proper display
- Status transitions (drag between columns)
- Activity log auto-generation

### Week 2: Pipeline + detail view

**Day 8-9:**
- Application detail view (slide-over panel or dedicated page)
- Pipeline stages: display, add, edit, reorder
- Stage status transitions with auto-calculations
- Pipeline templates

**Day 10-11:**
- Contacts CRUD in detail view
- Documents CRUD in detail view
- Company link display (external link icon)

**Day 12-14:**
- Table/list view with sorting and filtering
- Inline editing in table
- Bulk actions
- Save for later / wishlist functionality with deadlines

### Week 3: Analytics + polish

**Day 15-17:**
- Analytics API (aggregation queries)
- Stat cards
- Funnel chart, source effectiveness, timeline chart, status donut
- Clickable stats → filtered table

**Day 18-19:**
- Global activity timeline page
- Settings page (profile, templates, preferences, theme toggle)
- Ghosted auto-detection

**Day 20-21:**
- Polish: transitions, loading states, error handling
- Mobile responsiveness (sidebar collapses)
- Deploy to Vercel
- Send to 4 friends for testing

---

## 13. SaaS migration notes (for later)

When ready to convert to SaaS:

1. **Auth:** Replace env password with NextAuth or Supabase Auth (Google, GitHub, email/magic link)
2. **Profiles → Users:** Rename Profile model to User, add email field, link to auth provider
3. **Multi-tenancy:** Already scoped by profileId — just rename to userId
4. **Billing:** Add Stripe integration for premium features
5. **Browser extension:** Chrome extension that clips jobs from LinkedIn, RoosterJob, etc.
6. **Public features:** Anonymous interview experience sharing per company
7. **Email notifications:** Follow-up reminders, deadline alerts
8. **Resume management:** File uploads to Supabase Storage
9. **Domain:** Get a proper domain, set up on Vercel

**Schema changes for SaaS = minimal.** The MVP schema is already designed for multi-user isolation. The only model change is Profile → User with auth fields added.

---

## 14. Open questions / decisions for builder

These are pre-answered so the AI agent doesn't need to ask:

| Question | Decision |
|----------|----------|
| Detail view: slide-over or separate page? | Slide-over panel (right side, 60% width) for quick editing. Full page if needed later |
| Kanban: horizontal scroll or wrap? | Horizontal scroll with all columns visible. Min column width 240px |
| Table: client-side or server-side pagination? | Server-side (API supports ?page=&limit=). Default 25 per page |
| Date format | "Mar 8, 2026" for display, ISO strings for API/DB |
| Time format | Relative ("5 days ago") with absolute on hover tooltip |
| Theme default | Dark mode (matches Orchestra reference) |
| Toast position | Bottom-right, stacked |
| Empty states | Show helpful illustration + CTA. "No applications yet — add your first one!" |
| Mobile support | Responsive but not mobile-first. Sidebar collapses to hamburger |
| Keyboard shortcuts | Not in MVP |

---

*End of PRD. This document contains everything needed to build the complete MVP.*
