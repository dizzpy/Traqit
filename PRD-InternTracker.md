# InternTracker — Product Requirements Document

**Version:** 2.0 — UI-first build plan
**Author:** Dizzpy (Anuja Rathnayaka)
**Date:** May 30, 2026
**Status:** MVP — personal use + 4 friends, designed for SaaS
**Progress (2026-05-31):** ✅ Sprints 0 & 1 complete; Sprint 3 complete; Sprint 4 nearly complete — Applications list + board + add/save + pipeline builder + the full detail panel (Pipeline / Contacts / Documents / Activity) are wired to live Supabase data with optimistic updates. Remaining: Calendar / Email-templates / Saved pages (Sprint 2), save-as-template, reminders (Sprint 5), final polish (Sprint 6). See §6 for the per-item breakdown.

---

## Contents

1. [Product overview](#1-product-overview)
2. [What changed from the Notion version](#2-what-changed-from-the-notion-version)
3. [Design system (build this first)](#3-design-system-build-this-first)
4. [Screens & UX](#4-screens--ux-the-heart-of-the-build)
5. [Tech stack](#5-tech-stack)
6. [Build plan — sprints](#6-build-plan--sprints)
7. [Database schema](#7-database-schema-prisma)
8. [Email reminders](#8-email-reminders)
9. [API surface](#9-api-surface)
10. [Security & performance](#10-security--performance-mvp)
11. [SaaS path](#11-saas-path-later)

---

## 1. Product overview

### 1.1 What it is

InternTracker is a job-application tracker built for software-engineering students moving through multi-round tech interview pipelines. The defining feature: **every application has its own custom pipeline.** One company might run `apply → phone screen → assessment → technical → HR → CEO → offer`, while another runs only `apply → call → technical → offer`. Generic trackers and Notion force every row through one fixed status list; InternTracker lets each job carry its own sequence of stages, built like blocks.

### 1.2 Why it exists

The current workflow lives in Notion. It works for storing rows but breaks on three things:

1. The Status field is a single shared dropdown — every job is forced into the same fixed stage list and it becomes cluttered
2. No clean way to save a job posting to apply to later
3. No way to attach the specific CV sent to each company, or to fire off a templated outreach email quickly

InternTracker solves these directly while keeping the dense, scannable table feel of the Notion view.

### 1.3 Target users

- **Primary:** the builder (Dizzpy), actively applying for Flutter / SE internships in Sri Lanka
- **Secondary:** four final-year SE friends at NSBM, all applying to local companies
- All users are in Sri Lanka — LKR-first salary handling, local job boards (RoosterJob, etc.)

### 1.4 Success criteria

- All 5 users tracking applications within a week of launch, fully replacing Notion
- Each user builds at least one custom pipeline and saves at least one job-for-later within two weeks
- The app feels calm and pleasant enough that users open it voluntarily during a stressful job hunt

---

## 2. What changed from the Notion version

| Notion pain point                            | InternTracker solution                                                                              |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| One fixed Status dropdown shared by all jobs | Per-application pipeline: each job owns an ordered list of stage blocks, built and reordered freely |
| Can't model different interview flows        | Stage palette + drag-to-arrange builder; pick a template or build from scratch                      |
| No way to save a posting for later           | Save-job flow: paste a URL + minimal details, sits in a Saved page until you apply                  |
| Can't tell which CV went to which company    | Documents per application — attach the exact CV/cover-letter link sent                              |
| Manual, repetitive outreach emails           | Email templates with placeholders → one click opens a pre-filled Gmail draft                        |
| Calendar, chart, table crammed together      | Separate dedicated pages: Applications, Calendar, Analytics, Saved, Templates                       |
| No reminders for upcoming interviews         | Dated stage blocks notify by email and appear on the Calendar                                       |

---

## 3. Design system (build this first)

> **Build the UI first, throughout.** Every key screen ships as a static, themed, clickable prototype with mock data before touching the database.

### 3.1 Design principles — "cute, minimal, calm"

- **Calm over loud.** Job hunting is stressful. Status colors are soft and muted, never alarming. "Rejected" is a gentle muted red, "Ghosted" is simply dimmed — the UI never shouts.
- **Minimal but warm.** Generous whitespace, soft rounded corners (10–12px), one friendly accent (violet). Flat — no heavy shadows, no gradients. Elevation comes from subtle surface color shifts.
- **Dense where it counts.** The main list stays information-rich like the Notion table — all columns visible — because scanning matters. Calm doesn't mean empty.
- **Gentle motion.** Soft 150ms transitions, a tiny rise-in on panels. Nothing flashy.
- **Kind empty states.** "Nothing saved yet — add a posting when you spot one" instead of a blank table.

### 3.2 Theme — Violet haze (dark default)

A soft-purple dark theme. Premium but quiet. Light theme ships too; accent stays the same.

```css
/* ── Dark (default) ─────────────────────────────── */
--bg: #0b0a0e; /* page background */
--surface: #131116; /* cards, sidebar */
--surface-elevated: #1b1a1f; /* inputs, modals, popovers */
--surface-hover: #221f28; /* row / item hover */
--border: #29272f; /* dividers, outlines */
--border-hover: #3a3742; /* focus / hover border */

--text-primary: #f6f5fa; /* headings */
--text-secondary: #8b8792; /* body */
--text-muted: #6e6b7a; /* placeholders, hints */

--accent: #8b5cf6; /* primary actions, brand */
--accent-hover: #7c3aed;
--accent-soft: #25203b; /* tinted chip background */
--accent-soft-fg: #a78bfa;
```

**Soft semantic colors** (deliberately muted — these are the calm part):

```css
/* status badge combos: text on background */
--applied: #8b8792 on #1b1a1f /* neutral grey */ --progress: #a78bfa on #25203b
  /* soft violet */ --offer: #4ade80 on #14271b /* gentle green */
  --rejected: #f87171 on #2d1414 /* muted red, never harsh */ --ghosted: #6e6b7a
  on transparent /* dimmed, 0.6 opacity */ --saved: #6e6b7a on transparent
  /* dashed border */;
```

**Light theme:** `bg #FFFFFF`, `surface #F7F6FA`, `surface-elevated #EFEEF4`, `border #E4E2EA`, `text-primary #1B1A1F`, `text-secondary #565263`, `text-muted #9C99A6`. Accent and semantic colors unchanged.

### 3.3 Typography

Two Fontshare families. **No bold-700 anywhere** — heaviest weight used is 600, which keeps it soft.

| Role               | Font             | Size / weight | Usage                                   |
| ------------------ | ---------------- | ------------- | --------------------------------------- |
| Display / headings | Satoshi 600      | 18–24px       | Page titles, brand                      |
| Body / UI          | General Sans 500 | 13–14px       | Everything else — labels, rows, buttons |
| Caption            | General Sans 500 | 11–12px       | Timestamps, badges, hints               |

> Load via Fontshare CDN for prototyping; self-host woff2 via `next/font` in production to avoid layout shift.

```ts
// next/font setup
import localFont from "next/font/local";

export const satoshi = localFont({
  src: "../public/fonts/Satoshi-Variable.woff2",
  variable: "--font-display",
  weight: "300 900",
});

export const generalSans = localFont({
  src: "../public/fonts/GeneralSans-Variable.woff2",
  variable: "--font-sans",
  weight: "300 700",
});
```

### 3.4 Spacing, radius, motion

| Token | Value | Usage                      |
| ----- | ----- | -------------------------- |
| xs    | 4px   | Badge padding, inline gaps |
| sm    | 8px   | Between related elements   |
| md    | 12px  | Card padding, form gaps    |
| lg    | 16px  | Section spacing            |
| xl    | 24px  | Between major sections     |
| 2xl   | 32px  | Page-level padding         |

| Element          | Radius |
| ---------------- | ------ |
| Inputs / buttons | 9–10px |
| Cards            | 12px   |
| Modals / sheets  | 16px   |
| Pills / chips    | 999px  |

- **Borders:** 1px solid `var(--border)`. Flat — no shadows except a barely-there one on floating popovers.
- **Transitions:** 150ms ease on hover/focus; panels rise-in ~250ms cubic-bezier(0.22, 1, 0.36, 1).
- **Icons:** single thin-stroke set (Lucide or Hugeicons), ~16–18px, stroke 1.5, color inherits text.

### 3.5 Component library — shadcn/ui, themed

**Yes — use shadcn/ui**, customized to the Violet haze palette. You own the component code (it lives in your repo, not a `node_modules` dependency), it's built on Radix so accessibility and keyboard handling are solved, and it themes entirely through CSS variables — exactly how the palette above is structured.

#### How to wire the theme

1. Init shadcn with the CSS-variables option, base color Neutral, so it generates a token layer instead of hard-coded colors.
2. Map shadcn's semantic tokens to Violet haze:

```ts
// tailwind.config.ts (v4 @theme equivalent in globals.css)
// shadcn token → your token
--primary          → var(--accent)
--primary-foreground → #fff
--background       → var(--bg)
--card             → var(--surface)
--popover          → var(--surface-elevated)
--muted            → var(--surface-hover)
--border           → var(--border)
--ring             → var(--accent)
--radius           → 0.6rem
```

3. Set font tokens to Satoshi (display) and General Sans (sans). Drop shadcn's default Inter.
4. Pull components as needed and lightly restyle: softer radii, muted semantic colors, no harsh focus rings (use `box-shadow: 0 0 0 3px rgba(139,92,246,0.2)` instead).

#### Components used per screen

| shadcn component                     | Used for                                                 |
| ------------------------------------ | -------------------------------------------------------- |
| `button`, `input`, `label`           | Forms, login, add-application                            |
| `dialog`                             | Add-application modal, save-job modal                    |
| `sheet` (slide-over)                 | Application detail panel + pipeline builder              |
| `tabs`                               | Detail panel: Pipeline / Contacts / Documents / Activity |
| `dropdown-menu`, `select`, `popover` | Status dropdowns, filters, stage palette                 |
| `badge`                              | Status pills, work-mode chips, stage status              |
| `calendar`                           | Calendar page, date pickers on stages                    |
| `table`                              | Main applications list view                              |
| `sonner`                             | Toast notifications (bottom-right, soft)                 |

> `@dnd-kit/core` handles drag-and-drop for the pipeline builder and board view — shadcn has no native DnD.

---

## 4. Screens & UX (the heart of the build)

> Screens are listed in build order. Each is built first as a **static themed screen with mock data**, then wired to real data in later sprints.

### 4.1 App shell

A fixed left sidebar (~220px wide, collapses to icons on mobile) with:

- Brand mark + "InternTracker" at the top
- Nav: Applications, Saved jobs, Calendar, Analytics, Email templates, Settings
- Profile chip at the bottom

A main content area to the right with a per-page header (title + primary actions).

### 4.2 Applications — main screen

The home screen. Keeps the dense, all-columns-visible feel of the Notion table.

**Header:** "Applications" + live count, a "Save job" button, and a violet "+ Add" button.

**View chips** below the header: `List` (default) and `Board`. These switch the render mode of the same data and persist via `?view=` URL param.

#### List view (default)

A table with columns matching the current Notion tracker:

`Company` · `Position` · `Type` · `Work mode` · `Current stage` · `Status` · `Applied via` · `Applied date` · `Salary` · `Location`

- **The "Current stage" cell is a button.** Clicking it (or the row) opens the application detail slide-over with the pipeline builder focused.
- Soft status pills, relative dates ("5 days ago") with absolute on hover, sortable headers
- Filter bar: status (multi-select), work mode (pill), source (multi-select), date range
- Ghosted rows: gently dimmed (0.6 opacity)
- Rows with an interview in next 48h: subtle violet left-border
- Empty state: "No applications yet — add your first one"

#### Board view

Kanban columns by high-level status:

`Saved` → `Applied` → `In progress` → `Offer` → `Accepted` → `Rejected` → `Ghosted`

- Drag cards between columns to change status (`@dnd-kit`)
- Column headers show counts: "Applied (5)"
- Cards show: company, position, work-mode badge, current stage name, days since last activity, pulsing dot if interview in next 48h
- Saved column: dashed border, muted cards; deadline badge "3 days left" → "Expired"

### 4.3 Application detail + pipeline builder (slide-over)

Opens from the right as a full-height sheet when a row or current-stage cell is clicked. This is the **second most important screen**.

Tabs: **Pipeline** · Contacts · Documents · Activity

#### The pipeline builder

A vertical sequence of stage blocks assembled manually by the user.

```
┌─ Stage palette ──────────────────────────────────────┐
│  [+ Call]  [+ Phone screen]  [+ Assessment]           │
│  [+ Technical]  [+ HR]  [+ CEO]  [+ Offer]  [Custom] │
└──────────────────────────────────────────────────────┘

  ● Applied                               Done  · Mar 13
  │
  ● Phone screen                          Done  · Mar 23
  │
  ◉ Technical interview          Scheduled  · Mar 25, 10:30 AM  🔔
  │
  ○ HR interview                          Upcoming  · set date
  │
  + drag a stage here, or tap one above
```

**Each block has:**

- Name (preset or custom)
- Status: Upcoming / Scheduled / Done / Passed / Failed
- Optional date + time
- Optional notes
- 🔔 Remind me bell (triggers email reminder when on)
- Drag handle to reorder

**Per-job independence:** Company A can have 6 stages, Company B can have 3 — stored per application, fully independent.

**Templates:** "Apply a template" pre-fills a common sequence. "Save as template" stores the current pipeline for reuse.

> Dates feed two systems: any block with a date shows on the Calendar page; any block with the bell on triggers an email reminder.

#### Other tabs

- **Contacts:** name, role (Recruiter / Hiring Manager / Interviewer / HR / Other), email, phone, LinkedIn — click to `mailto:` / `tel:` / open.
- **Documents:** CV and cover-letter links sent to this company. Name + URL + type (CV / Cover letter / Portfolio / Other). MVP = links only; file uploads in v2.
- **Activity:** auto-generated chronological timeline of all events on this application.

### 4.4 Save job (modal)

Deliberately minimal — capture a posting in seconds.

**Fields:**

- Job posting URL _(required)_
- Company _(optional)_
- Position _(optional)_
- Note _(optional, one line)_
- Deadline _(optional — shows countdown badge)_

Status is set to `SAVED`, no applied date. "Mark as applied" promotes it into a full application.

**Deadline badge logic:**

- Future: "X days left" (muted)
- Within 48h: amber "2 days left"
- Passed: red "Expired"

### 4.5 Add application (modal)

The full create form.

| Field             | Type                       | Required | Default |
| ----------------- | -------------------------- | -------- | ------- |
| Company name      | text                       | yes      | —       |
| Company URL       | url                        | no       | —       |
| Position          | text                       | yes      | —       |
| Job post URL      | url                        | no       | —       |
| Job type          | searchable-select + custom | yes      | —       |
| Work mode         | pill toggle                | yes      | no-data |
| Applied via       | searchable-select + custom | yes      | —       |
| Salary min / max  | number                     | no       | —       |
| Currency          | select                     | no       | LKR     |
| Location          | text                       | no       | —       |
| Applied date      | date                       | no       | today   |
| Pipeline template | select                     | no       | —       |
| Notes             | textarea                   | no       | —       |

On save: card appears in the right place, activity entry auto-created.

### 4.6 Calendar (separate page)

A month grid showing:

- Every dated pipeline stage (interviews, calls, assessments) across all applications
- Saved-job deadlines

Click an event to jump to that application's detail. Soft event chips colored by stage type. Replaces the current Notion calendar.

### 4.7 Analytics (separate page)

Soft, readable charts themed to the violet/muted palette (Recharts).

**Stat cards (top row):** total applications, response rate, interview rate, offer rate, avg days to first response. Each clickable → filtered list.

**Charts:**

- Status donut (like the current Notion chart, but styled)
- Application funnel: applied → response → interview → offer
- Source effectiveness: horizontal bar, response rate by source
- Applications over time: line chart by week/month

### 4.8 Email templates (separate page)

Manage reusable outreach templates and fire them off pre-filled.

**Template fields:** name, subject, body — all supporting `{placeholders}`:
`{company}`, `{position}`, `{contact}`, `{myName}`, `{jobUrl}`

#### The draft-in-Gmail flow

1. From an application (or templates page), pick a template
2. Placeholders are filled automatically from that application's data
3. Click **"Draft in Gmail"** → opens Gmail compose in a new tab, pre-filled

```
https://mail.google.com/mail/?view=cm&fs=1
  &to={email}
  &su={URL-encoded subject}
  &body={URL-encoded body}
```

> No Gmail API or OAuth needed. Placeholders are substituted first, then the URL is encoded. The user reviews and hits send — nothing is sent automatically.

### 4.9 Settings (separate page)

- **Profile:** edit display name
- **Pipeline templates:** view / create / edit / delete
- **Custom presets:** sources, job types
- **Preferences:** ghost threshold (default 14 days), default currency, default template
- **Theme:** dark / light toggle
- **Data:** export all as JSON

---

## 5. Tech stack

| Layer           | Choice                   | Note                               |
| --------------- | ------------------------ | ---------------------------------- |
| Framework       | Next.js 15 (App Router)  | SSR + API routes                   |
| Language        | TypeScript               | End-to-end type safety             |
| Styling         | Tailwind CSS 4           | CSS-first `@theme` tokens          |
| Components      | shadcn/ui + Radix        | Owned in-repo, themed to palette   |
| Drag & drop     | @dnd-kit/core            | Pipeline builder + board           |
| Fonts           | Satoshi + General Sans   | Fontshare; self-host via next/font |
| Icons           | Lucide / Hugeicons       | Thin-stroke, 1.5                   |
| ORM             | Prisma                   | Type-safe, auto-migrations         |
| Database        | Supabase PostgreSQL      | Hosted Postgres, free tier         |
| Charts          | Recharts                 | Analytics, themed                  |
| Dates           | date-fns                 | Lightweight formatting             |
| Toasts          | sonner                   | Soft notifications                 |
| Email reminders | Vercel Cron + Gmail SMTP | Daily check; SMTP already set up   |
| Hosting         | Vercel                   | Zero-config Next.js deploy         |

### 5.1 Auth (MVP)

Env-based shared password. Middleware checks an `auth-token` cookie; unauthenticated requests redirect to `/login`. After login the user picks/creates a profile (display name); profile id sits in a cookie and scopes all data.

```
AUTH_PASSWORD=your-shared-password-here
```

Migration path to NextAuth / Supabase Auth later needs **no schema changes** — profiles simply become users.

---

## 6. Build plan — sprints

> **Strategy: build every key screen as a static, themed, clickable prototype with mock data before touching the database.** See and feel the whole app early; get friends reacting to real screens fast. Backend wires in behind already-built UI.

### Sprint 0 — Foundation & design system (UI only) ✅ DONE

_Goal: the theme exists and renders. Nothing functional yet, but it looks right._

- [x] Init Next.js 15 + TypeScript + Tailwind 4. Add Satoshi + General Sans via `next/font`
- [x] Write `globals.css` with the full Violet haze token set (dark + light)
- [x] Init shadcn/ui, map tokens to the palette, set radius + fonts. Restyle base components (button, input, badge, dialog, sheet, tabs, dropdown, select, popover, calendar, table, sonner) — plus custom `date-picker` + `checkbox`
- [x] Build app shell: collapsible sidebar + header + page frames for all routes
- [x] Build login screen + post-login transition screen

### Sprint 1 — Core screens, static (UI only) ✅ DONE

_Goal: the two most important screens look and feel finished, with mock data._

- [x] **Applications list view** — full table, all columns, soft status pills, status filter, search, view chips, column show/hide, inline editing, row select/drag/delete
- [x] **Application detail slide-over** with tabs (Pipeline / Contacts / Documents / Activity) + editable property rows + edit/delete actions
- [x] **Pipeline builder:** stage palette, vertical sequence with rail, block states, dates. _The signature screen._ (bell/reminder affordance deferred to Sprint 5 — no schema yet)
- [x] Add-application panel + save-job modal

### Sprint 2 — Remaining screens, static (UI only) — 🟡 PARTIAL

_Goal: every screen in the app exists visually._

- [x] Board view (drag between columns via @dnd-kit) — now live data
- [ ] Calendar page (month grid) — _stub_
- [x] Analytics page (stat cards + charts via Recharts) — live data
- [ ] Email templates page + Gmail draft preview — _stub_
- [ ] Saved jobs page _(stub)_ · [x] Settings page · [x] theme toggle
- [x] Polish empty states + transitions (ongoing)

> **Milestone:** Share the clickable prototype with the 4 friends for feedback before any backend work.

### Sprint 3 — Database & core CRUD (backend) ✅ DONE

_Goal: real data flows behind the already-built screens._

- [x] Prisma schema → Supabase, seed default presets + templates (`db push`)
- [x] Auth: login API route, middleware, cookie, profile create/seed on login
- [x] Applications API (list/create/update/delete) wired to list + board + add/save modals, with **optimistic** updates
- [x] Activity logging on every mutation

### Sprint 4 — Pipeline, save-for-later, detail (backend) — 🟡 MOSTLY DONE

_Goal: the signature feature is real._

- [x] Pipeline stages API: add / reorder / edit / delete; template apply _(save-as-template still pending)_
- [x] Wire the builder to real data (order persists via a 2-pass reorder endpoint, statuses, dates)
- [x] Save-job flow end to end; deadlines + countdown
- [x] Contacts + documents (links) in detail panel — add/remove wired; Activity tab auto-logs

### Sprint 5 — Calendar, analytics, email, reminders (backend)

_Goal: supporting pages go live; reminders fire._

- [ ] Calendar reads real dated stages + deadlines
- [ ] Analytics aggregation API behind the charts
- [ ] Email templates CRUD + working Gmail-draft URL builder
- [ ] **Email reminders:** Vercel Cron → daily API route → Gmail SMTP

### Sprint 6 — Polish & ship

- [ ] Mobile responsiveness (sidebar collapse, slide-over full-width on phone)
- [ ] Loading skeletons, optimistic drag updates, error states, toasts
- [ ] JSON export
- [ ] Deploy to Vercel, onboard the 4 friends

### 6.1 Priority summary

| Priority             | What                                                                | Sprints    |
| -------------------- | ------------------------------------------------------------------- | ---------- |
| **P0 — must, first** | Design system + Applications list + pipeline builder (UI then data) | 0, 1, 3, 4 |
| **P1 — core**        | Save-for-later, detail tabs, add/save modals, board                 | 1, 2, 4    |
| **P2 — supporting**  | Calendar, analytics, email templates + drafts                       | 2, 5       |
| **P3 — nice**        | Email reminders, JSON export, mobile polish                         | 5, 6       |
| **v2 — later**       | CV file uploads, browser clipper, full auth, billing                | post-MVP   |

---

## 7. Database schema (Prisma)

> Two additions vs. the original spec: `notify` + `notifyAt` on `PipelineStage` for reminders, and the new `EmailTemplate` model.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── PROFILE ────────────────────────────────────────────
model Profile {
  id        String   @id @default(cuid())
  name      String   @unique
  createdAt DateTime @default(now())

  applications      Application[]
  sources           Source[]
  jobTypes          JobType[]
  pipelineTemplates PipelineTemplate[]
  emailTemplates    EmailTemplate[]
}

// ─── APPLICATION ────────────────────────────────────────
model Application {
  id          String            @id @default(cuid())
  profileId   String
  profile     Profile           @relation(fields: [profileId], references: [id], onDelete: Cascade)

  companyName String
  companyUrl  String?
  position    String
  jobPostUrl  String?
  jobType     String
  workMode    String            // on-site | remote | hybrid | no-data
  appliedVia  String
  salaryMin   Float?
  salaryMax   Float?
  currency    String            @default("LKR")
  location    String?
  status      ApplicationStatus @default(SAVED)
  appliedDate DateTime?
  firstResponseDate DateTime?
  deadline    DateTime?         // for SAVED postings
  notes       String?

  stages   PipelineStage[]
  contacts Contact[]
  documents Document[]
  activity Activity[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([profileId, status])
  @@index([profileId, appliedDate])
}

enum ApplicationStatus {
  SAVED
  APPLIED
  IN_PROGRESS
  OFFER
  ACCEPTED
  REJECTED
  GHOSTED
  WITHDRAWN
}

// ─── PIPELINE STAGE ─────────────────────────────────────
model PipelineStage {
  id            String      @id @default(cuid())
  applicationId String
  application   Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)

  name          String        // "Technical", "HR", "CEO", or custom
  order         Int           // position in the sequence
  status        StageStatus   @default(UPCOMING)
  scheduledDate DateTime?
  completedDate DateTime?
  notify        Boolean       @default(false)   // reminder on/off
  notifyAt      DateTime?                        // when to send reminder
  notes         String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([applicationId, order])
  @@index([applicationId])
}

enum StageStatus {
  UPCOMING
  SCHEDULED
  COMPLETED
  PASSED
  FAILED
  SKIPPED
}

// ─── EMAIL TEMPLATE (NEW) ───────────────────────────────
model EmailTemplate {
  id        String  @id @default(cuid())
  profileId String
  profile   Profile @relation(fields: [profileId], references: [id], onDelete: Cascade)

  name      String    // "SE intern outreach"
  subject   String    // supports {placeholders}
  body      String    // supports {placeholders}

  createdAt DateTime @default(now())

  @@unique([profileId, name])
}

// ─── CONTACTS ───────────────────────────────────────────
model Contact {
  id            String      @id @default(cuid())
  applicationId String
  application   Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)

  name        String
  role        String    // Recruiter | Hiring Manager | Interviewer | HR | Other
  email       String?
  phone       String?
  linkedinUrl String?
  stageName   String?
  notes       String?

  createdAt DateTime @default(now())
}

// ─── DOCUMENTS ──────────────────────────────────────────
model Document {
  id            String      @id @default(cuid())
  applicationId String
  application   Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)

  name String   // "Mobile Dev CV v3"
  url  String   // Google Drive / GitHub link
  type String   // cv | cover-letter | portfolio | other

  createdAt DateTime @default(now())
}

// ─── ACTIVITY ───────────────────────────────────────────
model Activity {
  id            String      @id @default(cuid())
  applicationId String
  application   Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)

  type        String   // status_change | stage_update | note_added | contact_added
  description String   // "Status changed from Applied to In Progress"
  metadata    Json?

  createdAt DateTime @default(now())

  @@index([applicationId, createdAt])
}

// ─── PRESETS ────────────────────────────────────────────
model Source {
  id         String  @id @default(cuid())
  profileId  String
  profile    Profile @relation(fields: [profileId], references: [id], onDelete: Cascade)
  name       String
  usageCount Int     @default(0)
  @@unique([profileId, name])
}

model JobType {
  id         String  @id @default(cuid())
  profileId  String
  profile    Profile @relation(fields: [profileId], references: [id], onDelete: Cascade)
  name       String
  usageCount Int     @default(0)
  @@unique([profileId, name])
}

model PipelineTemplate {
  id        String  @id @default(cuid())
  profileId String
  profile   Profile @relation(fields: [profileId], references: [id], onDelete: Cascade)
  name      String
  stages    Json    // ["Call", "Technical", "HR", "Offer"]
  isDefault Boolean @default(false)
  createdAt DateTime @default(now())
  @@unique([profileId, name])
}
```

### 7.1 Seed data

**Sources:** RoosterJob, LinkedIn, Direct Mail, BambooHR, Company Website, Referral, Indeed

**Job types:** Intern, Trainee SE, Junior Dev, SE Intern, App Dev, Fullstack

**Pipeline templates:**

- "SL company" → `["Call", "Technical", "Offer"]`
- "Standard tech" → `["OA", "Phone Screen", "Technical", "HR", "Offer"]`
- "FAANG-style" → `["OA", "Phone Screen", "Technical 1", "Technical 2", "System Design", "Behavioral", "Offer"]`

---

## 8. Email reminders

The one piece needing backend beyond CRUD. A stage block with the bell on stores `notify = true` and a `notifyAt` time. A Vercel Cron job runs once a day:

```json
// vercel.json
{
  "crons": [{ "path": "/api/cron/reminders", "schedule": "0 7 * * *" }]
}
```

```ts
// /api/cron/reminders
// 1. verify CRON_SECRET header
// 2. find PipelineStages where notify = true
//    and scheduledDate is between now and now + 24h
//    and not already notified
// 3. for each stage, send via nodemailer + Gmail SMTP:
//    subject: "Interview reminder — {companyName} {stageName} at {time}"
// 4. mark as notified (metadata flag) to prevent double-send
```

> A daily 7am check covering next-day events is enough for this scale. No queuing library needed.

---

## 9. API surface

**Conventions:**

- All routes under `/api/`
- Success: `{ data: ... }` · Error: `{ error: { message, code } }`
- HTTP: 200 / 201 / 400 / 401 / 404 / 500
- Profile id from `auth-token` cookie via `getProfile()` helper
- All mutations auto-write an `Activity` entry
- Input validation with Zod

```
GET  POST              /api/applications                list (with filters) / create
GET  PATCH  DELETE     /api/applications/:id            single
GET  POST              /api/applications/:id/stages     list / add stage
PATCH DELETE           /api/applications/:id/stages/:sid   edit / remove
POST                   /api/applications/:id/stages/reorder  persist drag order
GET  POST              /api/applications/:id/contacts
GET  POST              /api/applications/:id/documents
GET                    /api/applications/:id/activity

GET                    /api/analytics                   aggregated stats
GET                    /api/calendar                    dated stages + deadlines

GET  POST              /api/templates/email             email templates CRUD
GET  POST  DELETE      /api/templates/pipeline          pipeline templates CRUD

GET  POST              /api/presets/sources
GET  POST              /api/presets/job-types

POST                   /api/auth/login
GET                    /api/cron/reminders              (cron only, secret header)
```

---

## 10. Security & performance (MVP)

### Security

- `AUTH_PASSWORD` never sent to client; timing-safe comparison (`crypto.timingSafeEqual`)
- `auth-token` cookie: `httpOnly`, `secure` (production), `sameSite: lax`, 30-day max-age
- Every query scoped by `profileId` — no cross-profile data leakage possible
- Cron route guarded by `CRON_SECRET` header
- Zod validation on all inputs; Prisma parameterized queries (no SQL injection); React auto-escaping

### Performance

- Indexes on `(profileId, status)` and stage ordering
- Fetch only needed fields with Prisma `select`
- Analytics aggregated server-side, not fetch-all-then-compute
- Optimistic drag updates (revert on failure)
- Debounced filter inputs (300ms)
- Skeleton loaders for initial load; lazy-loaded charts (`dynamic` import)

---

## 11. SaaS path (later)

The schema is already multi-tenant by `profileId`. To go SaaS:

1. **Auth:** swap env-password middleware for NextAuth or Supabase Auth (Google, GitHub, email)
2. **Users:** rename `Profile` → `User`, add `email` + provider fields
3. **Billing:** Stripe integration for premium tiers
4. **Browser clipper:** Chrome extension that saves postings from LinkedIn / RoosterJob directly
5. **CV uploads:** Supabase Storage instead of links
6. **Public data:** per-company interview-experience sharing
7. **More notifications:** email reminders for deadlines, weekly digest

**Schema changes needed: minimal.** MVP is already designed for multi-user isolation.

---

_End of PRD v2.0 — build the UI first, make it calm, ship to friends._
