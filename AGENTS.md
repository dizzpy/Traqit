# InternTracker — Agent Instructions

## Project Overview

InternTracker is a **custom pipeline job application tracker** for software engineering interns/students in Sri Lanka.  
The core innovation: **Every application has its own independent pipeline** (unlike Notion’s fixed status dropdown). Users can build, reorder, and customize stages per job.

**Core Philosophy**: Calm, minimal, warm, and dense where it matters. Job hunting is stressful — the app must feel pleasant and scannable.

**Target Users**: Dizzpy (Anuja) + 4 NSBM friends applying for Flutter / SE internships in Sri Lanka. LKR-first.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict)
- **Styling**: Tailwind CSS 4 + CSS Variables
- **UI Library**: shadcn/ui (fully owned, customized)
- **Fonts**: Satoshi (display) + General Sans (body)
- **Drag & Drop**: @dnd-kit/core
- **ORM**: Prisma + Supabase PostgreSQL
- **Charts**: Recharts
- **Dates**: date-fns
- **Toasts**: sonner
- **Icons**: Lucide / Hugeicons (thin stroke 1.5)

## Design System — Violet Haze (Dark Default)

**Core Principles**: Cute, minimal, calm. Soft muted colors. Generous whitespace. No loud elements.

**Key CSS Variables** (use these):

```css
--bg: #0b0a0e --surface: #131116 --surface-elevated: #1b1a1f
  --surface-hover: #221f28 --border: #29272f --accent: #8b5cf6
  --accent-hover: #7c3aed --text-primary: #f6f5fa --text-secondary: #8b8792
  --text-muted: #6e6b7a;
```

**Status Colors** (soft & calm):

- Applied / Neutral → grey
- Progress → soft violet
- Offer → gentle green
- Rejected → muted red
- Ghosted → dimmed (0.6 opacity)

**Typography**:

- Headings: Satoshi 600
- Body/UI: General Sans 500 (13–14px)
- Captions: General Sans 500 (11–12px)

**Components**: Use shadcn/ui only. Never create raw divs for buttons, inputs, modals, tables, etc.

**Radius & Spacing**:

- Buttons/Inputs: 9–10px
- Cards: 12px
- Modals/Sheets: 16px
- Padding scale: xs=4, sm=8, md=12, lg=16, xl=24, 2xl=32

## Project Structure (Important)

```
app/
├── (auth)/login/
├── (main)/
│   ├── applications/
│   ├── saved/
│   ├── calendar/
│   ├── analytics/
│   ├── templates/
│   └── settings/
├── api/...
components/
├── ui/              # shadcn components
├── layout/
├── applications/
├── pipeline/
├── common/
docs/
├── design-system.md
├── prisma-schema.md
└── api-conventions.md
```

## Coding Rules (Strict)

1. **Always** build UI-first with mock data before connecting real data.
2. Use TypeScript strictly (no `any`).
3. Follow shadcn/ui + Tailwind conventions.
4. All dates handled with `date-fns`.
5. Statuses and enums must match Prisma exactly.
6. Every mutation should create an `Activity` log.
7. Optimistic updates where possible (especially drag & drop).
8. All forms validated with Zod.
9. Mobile-first + responsive (sidebar collapses).
10. Never hardcode colors — use CSS variables and Tailwind config.

## Architecture Principles

- Feature-based organization
- Server Components by default
- Client components only when interactivity needed (`"use client"`)
- All data fetching scoped by `profileId`
- Pipeline stages are **per-application** and fully independent
- Saved jobs are `Application` records with `status: SAVED`

## Key Screens & Priorities

**P0 (Must be excellent)**:

- Applications List View (dense table)
- Application Detail Sheet + Pipeline Builder (the signature feature)
- Design System consistency

**Important UX Flows**:

- Pipeline Builder: palette + vertical draggable stages + date + bell
- Save Job → minimal modal → can later "Mark as Applied"
- Email templates → Gmail draft URL with placeholders

## Common Pitfalls to Avoid

- Using harsh reds for rejection
- Making the table too sparse
- Hardcoding colors instead of CSS vars
- Forgetting per-application pipeline independence
- Heavy shadows or loud animations
- Bold-700 fonts (max weight 600)

---

**When in doubt**:

- Make it calm and pleasant
- Prefer density in the main table
- Reference the PRD for exact behavior
- Ask for clarification on ambiguous requirements

You can reference other files using `@docs/design-system.md`, `@docs/prisma-schema.md`, etc.
