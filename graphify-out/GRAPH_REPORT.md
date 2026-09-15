# Graph Report - Traqit  (2026-09-15)

## Corpus Check
- 267 files · ~146,132 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1471 nodes · 3531 edges · 163 communities (76 shown, 87 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 57 edges (avg confidence: 0.69)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `40e7b3f1`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- generate/page.tsx
- getProfile
- admin-overview.ts
- scripts
- templates/page.tsx
- applications/page.tsx
- cn
- bucket.ts
- mock-store.ts
- compilerOptions
- google.ts
- auth.ts
- settings/page.tsx
- utils.ts
- application-detail.tsx
- calendar/page.tsx
- invalidateAppData
- generate/route.ts
- sidebar.tsx
- pipeline-builder.tsx
- button.tsx
- components.json
- how-it-works.tsx
- shortcuts-dialog.tsx
- blur-fade.tsx
- types/index.ts
- profile/page.tsx
- tagBadgeClass
- add-application-modal.tsx
- cv-editor.tsx
- features.tsx
- onboarding-flow.tsx
- constants.ts
- use-generated-cv.ts
- cv-about-you-form.tsx
- validate-resolved-cv.ts
- trash/page.tsx
- magic-card.tsx
- pricing.tsx
- types.ts
- date-fns
- marketing-shell.tsx
- render-template.ts
- dependencies
- Database Report
- cv/[id]/route.ts
- library/page.tsx
- storage/page.tsx
- laser-flow.tsx
- Dashboard Preview Screenshot (Applications List)
- input.tsx
- proxy.ts
- date-picker.tsx
- ai/index.ts
- AI Points System
- ai-check.ts
- mock-tailor.ts
- Free/Pro/Max Plan Definitions Table
- .mcp.json
- app/layout.tsx
- landing.tsx
- GeneralSans Font Family
- @prisma/client
- CvAiProvider
- prisma/seed.ts
- Sprint 0/1 Priority (Design System, App Shell, Applications List, Pipeline Builder)
- Solid Bar Heading Layout Pattern
- AiPointLedger Prisma Model
- withPoints() Spend/Refund Wrapper
- AI_ACTIONS Operation Cost Registry (cv.generate=5, cv.extract=8, cv.summary=2)
- login/layout.tsx
- analytics/layout.tsx
- applications/layout.tsx
- calendar/layout.tsx
- cv/layout.tsx
- profile/layout.tsx
- saved/layout.tsx
- settings/layout.tsx
- templates/layout.tsx
- (onboarding)/layout.tsx
- RLS Deny-All Security Model (Audit View)
- @base-ui/react
- class-variance-authority
- Violet Haze Design Tokens (Reference)
- clsx
- Generated CV — Jordan Alvarez, Software Engineering Intern
- PipelineStage Intentionally Has No Unique(applicationId, order)
- @dnd-kit/sortable
- @dnd-kit/utilities
- dotenv
- driver.js
- eslint.config.mjs
- @google/genai
- @hugeicons/core-free-icons
- @hugeicons/react
- mammoth
- motion
- next
- next.config.ts
- next-themes
- partial-json
- pg
- prisma
- @prisma/adapter-pg
- react-day-picker
- react-icons
- recharts
- shadcn
- @supabase/ssr
- @supabase/supabase-js
- swr
- tailwind-merge
- three
- tw-animate-css
- @types/pg
- @upstash/ratelimit
- @upstash/redis
- zod
- postcss.config.mjs
- GeneralSans Webfont Install Guide
- GeneralSans Fontshare EULA
- Satoshi Webfont Install Guide
- Satoshi Fontshare EULA
- Hardcoded Admin Allowlist
- CSRF Reliance on SameSite Cookie
- Lint Failures (particles.tsx refs, stale eslint-disable)
- Missing Security Headers / CSP
- Next.js 16.2.1 Known CVEs (Middleware/Proxy Bypass)
- Open Redirect in Auth Callback
- Rate Limiting Fails Open on Missing Config
- Stored XSS in Admin Members Page
- CLAUDE.md — InternTracker Project Guidance
- InternTracker Project Identity
- Campus Events API Project Entry in CV
- StudyBuddy Project Entry in CV
- Connection Architecture (Prisma Pooler vs Direct URL)
- Indexing Strategy (profileId/applicationId-rooted composite indexes)
- pg_cron purge-trash-daily Retention Job
- Schema-Management Workflow (db push vs prisma migrate)
- API Response Format ({ data } / { error })
- Zod Validation Convention
- CV Studio — Credits, Plans & Pricing
- No Rollover of Unused Points
- Order of Operations in generate (rate limit → spend → analyze → tailor → persist)
- Dark-Default Color Palette + Semantic Status Colors
- Violet Haze Design System Doc
- File Icon (public/file.svg)
- Globe Icon (SVG)
- Next.js Logo
- Vercel Logo
- Window Icon
- Next.js create-next-app README
- App Icon (Favicon)
- Traqit Logo

## God Nodes (most connected - your core abstractions)
1. `cn()` - 183 edges
2. `getProfile()` - 110 edges
3. `apiError()` - 107 edges
4. `prisma` - 51 edges
5. `invalidate()` - 37 edges
6. `Button()` - 35 edges
7. `Application` - 25 edges
8. `cached()` - 21 edges
9. `invalidateAppData()` - 21 edges
10. `cacheKey` - 20 edges

## Surprising Connections (you probably didn't know these)
- `Traqit Project Entry (job application tracker) in CV` --semantically_similar_to--> `Database Report`  [INFERRED] [semantically similar]
  cv_se_intern.html → DATABASE_REPORT.md
- `Profile Model (Prisma Schema Doc)` --conceptually_related_to--> `Database Report`  [AMBIGUOUS]
  docs/prisma-schema.md → DATABASE_REPORT.md
- `Traqit Project Entry (job application tracker) in CV` --semantically_similar_to--> `All Queries Must Be Scoped by profileId`  [INFERRED] [semantically similar]
  cv_se_intern.html → docs/prisma-schema.md
- `Auth via auth-token Cookie + profileId` --conceptually_related_to--> `Production Readiness & Security Audit Report`  [AMBIGUOUS]
  docs/api-conventions.md → AUDIT_REPORT.md
- `Every Mutation Creates an Activity Log Entry` --conceptually_related_to--> `Database Report`  [INFERRED]
  docs/api-conventions.md → DATABASE_REPORT.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Plan/Subscription Billing Tier System** — database_report_plan_enum, database_report_subscription_table, docs_cv_credits_and_plans_plans_table, audit_report_subscription_feature [INFERRED 0.85]
- **Violet Haze Typography Font System** — docs_design_system_typography, assets_generalsans_fonts_web_readme_generalsans_font, assets_generalsans_license_ffl_fontshare_eula, assets_satoshi_fonts_web_readme_satoshi_font, assets_satoshi_license_ffl_fontshare_eula [INFERRED 0.85]
- **CV Studio Feature Group** — cv_template_preview_doc, cv_se_intern_doc, docs_cv_credits_and_plans_doc [INFERRED 0.75]

## Communities (163 total, 87 thin omitted)

### Community 0 - "generate/page.tsx"
Cohesion: 0.07
Nodes (52): check(), ledgerCount(), main(), makeProfile(), stamp, userIds, CvGeneratePage(), GENERATE_COST (+44 more)

### Community 1 - "getProfile"
Cohesion: 0.12
Nodes (35): GET(), GET(), DELETE(), createSchema, GET(), POST(), DELETE(), createSchema (+27 more)

### Community 2 - "admin-overview.ts"
Cohesion: 0.06
Nodes (36): GET(), POST(), AdminDashboardPage(), dynamic, AnalyticsCharts, AnalyticsPage(), AdminDashboard(), fmtDate() (+28 more)

### Community 3 - "scripts"
Cohesion: 0.05
Nodes (39): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node (+31 more)

### Community 4 - "templates/page.tsx"
Cohesion: 0.11
Nodes (32): EditableDraft(), EditableDraftProps, EditorProps, SortableCardProps, TemplateEditorModal(), TemplatesPage(), DraftEmailModal(), EmailPreview() (+24 more)

### Community 5 - "applications/page.tsx"
Cohesion: 0.09
Nodes (35): ApplicationRow(), ApplicationsPageInner(), COLUMNS, currentStageLabel(), FILTER_STATUSES, formatSalary(), hasUpcomingInterview(), KanbanBoard (+27 more)

### Community 6 - "cn"
Cohesion: 0.07
Nodes (29): AnimatedShinyText(), AnimatedShinyTextProps, BorderBeam(), BorderBeamProps, DialogDescription(), DialogFooter(), DialogOverlay(), DropdownMenuCheckboxItem() (+21 more)

### Community 7 - "bucket.ts"
Cohesion: 0.13
Nodes (29): bodySchema, POST(), projectSchema, skillSchema, DELETE(), PATCH(), patchSchema, createSchema (+21 more)

### Community 8 - "mock-store.ts"
Cohesion: 0.07
Nodes (35): fetcher(), useCvBucket(), mockCuid(), MOCK_BUCKET, MOCK_GENERATED_CVS, MOCK_UPLOAD_DRAFT_POOL, project(), PROJECTS (+27 more)

### Community 9 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 10 - "google.ts"
Cohesion: 0.13
Nodes (21): ANTHROPIC_MODELS, MODELS, wrap(), GOOGLE_MODELS, MODELS, THINKING_LEVELS, wrap(), ANALYZE_JD_SYSTEM (+13 more)

### Community 11 - "auth.ts"
Cohesion: 0.17
Nodes (19): GET(), createSchema, GET(), include, listSelect, GET(), GET(), GET() (+11 more)

### Community 12 - "settings/page.tsx"
Cohesion: 0.11
Nodes (25): getHash(), getServerHash(), NavItem(), SectionId, SECTIONS, SettingRow(), SettingsPage(), subscribeHash() (+17 more)

### Community 13 - "utils.ts"
Cohesion: 0.17
Nodes (8): schema, GET(), metadata, OnboardingPage(), prisma, purgeExpiredTrash(), TRASH_RETENTION_DAYS, trashCutoff()

### Community 14 - "application-detail.tsx"
Cohesion: 0.13
Nodes (17): AddDocumentForm(), ApplicationDetail(), DOC_TYPES, formatSalary(), STATUS_OPTIONS, WORKMODE_OPTIONS, fetcher(), useApplication() (+9 more)

### Community 15 - "calendar/page.tsx"
Cohesion: 0.17
Nodes (15): buildEvents(), CalendarPage(), CalEvent, chipClass(), WEEKDAYS, OptionPicker(), OptionPickerProps, PickerOption (+7 more)

### Community 16 - "invalidateAppData"
Cohesion: 0.12
Nodes (18): POST(), schema, DELETE(), GET(), getApp(), include, PATCH(), updateSchema (+10 more)

### Community 17 - "generate/route.ts"
Cohesion: 0.16
Nodes (16): maxDuration, POST(), runtime, toCvUpload(), bodySchema, dynamic, hashJd(), maxDuration (+8 more)

### Community 18 - "sidebar.tsx"
Cohesion: 0.15
Nodes (12): ThemeSelector(), MainLayout(), Logo(), KeyboardShortcuts(), NAV_ITEMS, NavItem, Sidebar(), ThemeToggle() (+4 more)

### Community 19 - "pipeline-builder.tsx"
Cohesion: 0.13
Nodes (18): PipelineBuilderProps, StageCard(), StageCardProps, STATUS_CYCLE, STATUS_DOT, STATUS_LABEL_COLORS, PipelineStages(), PipelineStagesProps (+10 more)

### Community 20 - "button.tsx"
Cohesion: 0.13
Nodes (14): NotFound(), CvAddToTrackerDialog(), CvAddToTrackerDialogProps, CvUploadDialogProps, Draft, STAGES, SUBTITLE, HeaderProps (+6 more)

### Community 21 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 22 - "how-it-works.tsx"
Cohesion: 0.14
Nodes (12): ActivityFeedCard(), AddApplicationCard(), DEMO_JOBS, EASE, NOTIFICATIONS, PipelineCard(), STAGES, STATS (+4 more)

### Community 23 - "shortcuts-dialog.tsx"
Cohesion: 0.28
Nodes (6): ShortcutsDialog(), Kbd(), ROUTE_SHORTCUTS, SHORTCUT_GROUPS, ShortcutGroup, ShortcutItem

### Community 24 - "blur-fade.tsx"
Cohesion: 0.15
Nodes (11): FAQ(), FAQItem(), FAQS, FounderMemo(), STATS, BlurFade(), BlurFadeProps, getFilter() (+3 more)

### Community 25 - "types/index.ts"
Cohesion: 0.10
Nodes (26): RowProps, SavedJobCardProps, COLORS, AddApplicationPanelProps, ApplicationDetailProps, DraftEmailModalProps, ApplicationCard(), ApplicationCardProps (+18 more)

### Community 26 - "profile/page.tsx"
Cohesion: 0.14
Nodes (12): initials(), ProfilePage(), REMINDER_LEAD_OPTIONS, AddApplicationPanel(), PipelineBuilder(), useTemplates(), fetcher(), PROFILE_SWR_CONFIG (+4 more)

### Community 27 - "tagBadgeClass"
Cohesion: 0.10
Nodes (24): SortableTemplateCard(), ViewBody(), CvProjectsPanel(), CvProjectsPanelProps, IconAction(), ProjectCard(), CvStreamingPreview(), SkeletonLine() (+16 more)

### Community 28 - "add-application-modal.tsx"
Cohesion: 0.17
Nodes (10): CvCoverLetterPanel(), CvCoverLetterPanelProps, mockCoverLetter(), Sheet(), SheetContent(), SheetDescription(), SheetFooter(), SheetHeader() (+2 more)

### Community 29 - "cv-editor.tsx"
Cohesion: 0.15
Nodes (21): CvEditor(), CvEditorProps, CvEditPatch, CvPreviewFrame(), CvPreviewFrameProps, IMPORTANT: srcDoc is computed once per mount. Inline edits deliberately do, CvStreamingPreviewProps, AtsBadge() (+13 more)

### Community 30 - "features.tsx"
Cohesion: 0.17
Nodes (12): CARD, COMPANIES, Features(), GHOST_APPS, GhostCard(), highlight(), OutreachCard(), PIPELINE_STAGES (+4 more)

### Community 31 - "onboarding-flow.tsx"
Cohesion: 0.12
Nodes (7): OnboardingFlowProps, STEPS, StepState, TemplateOption, TemplateStep(), Select, SelectProps

### Community 32 - "constants.ts"
Cohesion: 0.14
Nodes (17): BadgeProps, StatusBadge(), MODES, PillToggle(), PillToggleProps, CONTACT_ROLES, CURRENCIES, DEFAULT_PIPELINE_TEMPLATES (+9 more)

### Community 33 - "use-generated-cv.ts"
Cohesion: 0.60
Nodes (4): CvDetailPage(), fetcher(), useCvLibrary(), useGeneratedCv()

### Community 34 - "cv-about-you-form.tsx"
Cohesion: 0.12
Nodes (22): CvStoragePage(), AiCostHint(), AiPointsMeter(), CvAboutYouForm(), CvAboutYouFormProps, CvPhotoField(), GenerateButton(), ProfileFields (+14 more)

### Community 35 - "validate-resolved-cv.ts"
Cohesion: 0.53
Nodes (5): clampHeadline(), groundedSkillNames(), numbersIn(), validateResolvedCv(), ValidationResult

### Community 36 - "trash/page.tsx"
Cohesion: 0.20
Nodes (10): daysLeft(), ForeverTarget, TrashPage(), ConfirmDialog(), fetcher(), purgeTrash(), TrashData, TrashedApplication (+2 more)

### Community 37 - "magic-card.tsx"
Cohesion: 0.36
Nodes (7): isOrbMode(), MagicCard(), MagicCardBaseProps, MagicCardGradientProps, MagicCardOrbProps, MagicCardProps, ResetReason

### Community 38 - "pricing.tsx"
Cohesion: 0.15
Nodes (11): Currency, Features(), FREE_FEATURES, GlareCard(), MAX_FEATURES, Price(), PRICES, PRO_FEATURES (+3 more)

### Community 39 - "types.ts"
Cohesion: 0.27
Nodes (11): CvExtraction, MasterSummaryInput, TailorInput, GeneratedRow, MAX_SELECTED_PROJECTS, selectProjects(), CvProject, CvSkill (+3 more)

### Community 41 - "marketing-shell.tsx"
Cohesion: 0.23
Nodes (5): metadata, MarketingFooter(), NAV, MarketingShell(), ScrollReset()

### Community 42 - "render-template.ts"
Cohesion: 0.28
Nodes (15): CONTACT_GLYPHS, contactIcon(), ContactKind, editableRegion(), escapeHtml(), ESCAPES, fillProjectBlock(), fillSkillGroupBlock() (+7 more)

### Community 43 - "dependencies"
Cohesion: 0.18
Nodes (11): @anthropic-ai/sdk, @dnd-kit/core, lucide-react, dependencies, @anthropic-ai/sdk, @dnd-kit/core, lucide-react, react-dom (+3 more)

### Community 44 - "Database Report"
Cohesion: 0.18
Nodes (11): Production Readiness & Security Audit Report, State Management Review (SWR + Optimistic Updates), Traqit Project Entry (job application tracker) in CV, Database Report, Every Mutation Creates an Activity Log Entry, Auth via auth-token Cookie + profileId, API Conventions, Application Model (Prisma Schema Doc) (+3 more)

### Community 45 - "cv/[id]/route.ts"
Cohesion: 0.14
Nodes (16): DELETE(), GET(), PATCH(), patchSchema, NOTE: `validateResolvedCv` is deliberately NOT re-run here. It guards, resolvedCvSchema, GET(), GET() (+8 more)

### Community 46 - "library/page.tsx"
Cohesion: 0.16
Nodes (15): CvLibraryPage(), STATUS_BADGE, STATUS_LABEL, wasEdited(), CvEmptyState(), CvEmptyStateProps, CvSkillsPanel(), CvSkillsPanelProps (+7 more)

### Community 47 - "storage/page.tsx"
Cohesion: 0.13
Nodes (14): UploadDraft, CvProjectDialog(), CvProjectDialogProps, CvProjectFormValues, FooterAction(), Mode, CvUploadDialog(), CvUploadProgress() (+6 more)

### Community 48 - "laser-flow.tsx"
Cohesion: 0.24
Nodes (8): BorderBeam(), BorderBeamProps, HeroPreview(), hexToRGB(), LaserFlow(), LaserFlowProps, SizeState, Uniforms

### Community 49 - "Dashboard Preview Screenshot (Applications List)"
Cohesion: 0.27
Nodes (10): Dashboard Preview Screenshot (Applications List), Add Application Primary Action Button, Applications Dense List Table (Company, Position, Type, Work mode, Current stage, Status, Via, Applied, Salary, Location), List/Board View Toggle Control, Search Company Bar and Columns Configuration Control, Sidebar Navigation Panel (Applications, Saved jobs, Calendar, Analytics, Email templates, Settings), Color-Coded Status Badges (Applied, In Progress, Ghosted, Rejected, Offer), Status Filter Tabs (All, Applied, In Progress, Offer, Accepted, Rejected, Ghosted) (+2 more)

### Community 50 - "input.tsx"
Cohesion: 0.27
Nodes (7): ERROR_MESSAGES, LoginPage(), resolveError(), SUPABASE_ERROR_MESSAGES, Input, InputProps, createClient()

### Community 54 - "proxy.ts"
Cohesion: 0.33
Nodes (8): IMPORTANT: getUser() revalidates the token with Supabase. Do not replace, updateSession(), clientIp(), config, isPublic(), proxy(), PUBLIC_PATHS, WRITE_METHODS

### Community 56 - "date-picker.tsx"
Cohesion: 0.23
Nodes (9): react, react, EditableCell(), EditableCellProps, Calendar(), CalendarDayButton(), DatePicker(), DatePickerProps (+1 more)

### Community 57 - "ai/index.ts"
Cohesion: 0.27
Nodes (11): anthropicProvider, googleProvider, analyzeJd(), assertConfigured(), extractCv(), providersInOrder(), tailorStream(), withFailover() (+3 more)

### Community 58 - "AI Points System"
Cohesion: 0.29
Nodes (7): Subscription / Plan Tier Feature (Audit View), Subscription Table (1:1 with Profile), AI Points System, Daily Reset Window (Not Monthly) for Points, Profile.dailyAiPointsOverride Per-Customer Exception, What Shipped (AI Points Implementation Status), UTC (Not Local Midnight) as the Reset Boundary

### Community 59 - "ai-check.ts"
Cohesion: 0.43
Nodes (6): bare(), checkAnthropic(), checkGoogle(), CLAUDE, GEMINI, main()

### Community 60 - "mock-tailor.ts"
Cohesion: 0.43
Nodes (6): analyzeJd(), CANNED_COMPANIES, extractKeywords(), lowerFirst(), STOPWORDS, tailorCv()

### Community 61 - "Free/Pro/Max Plan Definitions Table"
Cohesion: 0.33
Nodes (6): Plan Enum (FREE, PRO, MAX), Why Plan Limits Live in Code, Not Env, Config (Code) vs Per-User State (Database) Split, Margin Check Across Plans, Decisions Still Open (pricing, billing provider, annual plans), Free/Pro/Max Plan Definitions Table

### Community 62 - ".mcp.json"
Cohesion: 0.47
Nodes (5): npx, magicui, reactbits, shadcn, @magicuidesign/mcp

### Community 63 - "app/layout.tsx"
Cohesion: 0.47
Nodes (4): metadata, RootLayout(), generalSans, satoshi

### Community 64 - "landing.tsx"
Cohesion: 0.18
Nodes (10): metadata, HeroCTA(), HowItWorks(), Landing(), Pricing(), Circle, hexToRgb(), MousePosition (+2 more)

### Community 65 - "GeneralSans Font Family"
Cohesion: 0.50
Nodes (5): GeneralSans Font Family, Fontshare Free Font EULA (Indian Type Foundry), Satoshi Font Family, Fontshare Free Font EULA (Indian Type Foundry) — Satoshi Copy, Typography: Satoshi (Display) + General Sans (Body/UI)

### Community 66 - "@prisma/client"
Cohesion: 0.40
Nodes (4): @prisma/client, main(), prisma, @prisma/client

### Community 69 - "Sprint 0/1 Priority (Design System, App Shell, Applications List, Pipeline Builder)"
Cohesion: 0.67
Nodes (3): Build Strategy: Static UI + Mock Data First, Sprint 0/1 Priority (Design System, App Shell, Applications List, Pipeline Builder), Use shadcn/ui Exclusively

### Community 70 - "Solid Bar Heading Layout Pattern"
Cohesion: 0.67
Nodes (3): ::before Bullets to Avoid ATS Reading Sidebar <ul> as Body Content, Solid Bar Heading Layout Pattern, Tech Stack Rendered as Plain Inline Text (not pills) to Match Source Design

### Community 71 - "AiPointLedger Prisma Model"
Cohesion: 0.67
Nodes (3): AiPointLedger Prisma Model, Why a Ledger Beats a Counter Column, Prisma Schema Doc

### Community 72 - "withPoints() Spend/Refund Wrapper"
Cohesion: 0.67
Nodes (3): Concurrency Fix: Single-Statement Advisory-Lock Spend (avoids TOCTOU race), Refund on Generation Failure — Non-Negotiable, withPoints() Spend/Refund Wrapper

### Community 73 - "AI_ACTIONS Operation Cost Registry (cv.generate=5, cv.extract=8, cv.summary=2)"
Cohesion: 0.67
Nodes (3): Measured API Cost Basis (2026-07-29), Why Credits Rather Than Counting Generations, AI_ACTIONS Operation Cost Registry (cv.generate=5, cv.extract=8, cv.summary=2)

## Ambiguous Edges - Review These
- `Production Readiness & Security Audit Report` → `Auth via auth-token Cookie + profileId`  [AMBIGUOUS]
  docs/api-conventions.md · relation: conceptually_related_to
- `Database Report` → `Profile Model (Prisma Schema Doc)`  [AMBIGUOUS]
  docs/prisma-schema.md · relation: conceptually_related_to
- `PipelineStage Intentionally Has No Unique(applicationId, order)` → `PipelineStage Model (Prisma Schema Doc)`  [AMBIGUOUS]
  docs/prisma-schema.md · relation: conceptually_related_to

## Knowledge Gaps
- **389 isolated node(s):** `@magicuidesign/mcp`, `$schema`, `style`, `rsc`, `tsx` (+384 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **87 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Production Readiness & Security Audit Report` and `Auth via auth-token Cookie + profileId`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Database Report` and `Profile Model (Prisma Schema Doc)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `PipelineStage Intentionally Has No Unique(applicationId, order)` and `PipelineStage Model (Prisma Schema Doc)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `cn()` connect `cn` to `generate/page.tsx`, `templates/page.tsx`, `applications/page.tsx`, `settings/page.tsx`, `utils.ts`, `application-detail.tsx`, `calendar/page.tsx`, `sidebar.tsx`, `pipeline-builder.tsx`, `button.tsx`, `how-it-works.tsx`, `shortcuts-dialog.tsx`, `blur-fade.tsx`, `types/index.ts`, `profile/page.tsx`, `tagBadgeClass`, `add-application-modal.tsx`, `cv-editor.tsx`, `features.tsx`, `onboarding-flow.tsx`, `constants.ts`, `cv-about-you-form.tsx`, `trash/page.tsx`, `magic-card.tsx`, `pricing.tsx`, `library/page.tsx`, `storage/page.tsx`, `laser-flow.tsx`, `input.tsx`, `date-picker.tsx`, `app/layout.tsx`, `landing.tsx`?**
  _High betweenness centrality (0.200) - this node is a cross-community bridge._
- **Why does `react` connect `date-picker.tsx` to `dependencies`?**
  _High betweenness centrality (0.136) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `scripts`, `date-fns`, `date-picker.tsx`, `@prisma/client`, `@base-ui/react`, `class-variance-authority`, `clsx`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `dotenv`, `driver.js`, `@google/genai`, `@hugeicons/core-free-icons`, `@hugeicons/react`, `mammoth`, `motion`, `next`, `next-themes`, `partial-json`, `pg`, `prisma`, `@prisma/adapter-pg`, `react-day-picker`, `react-icons`, `recharts`, `shadcn`, `@supabase/ssr`, `@supabase/supabase-js`, `swr`, `tailwind-merge`, `three`, `tw-animate-css`, `@types/pg`, `@upstash/ratelimit`, `@upstash/redis`, `zod`?**
  _High betweenness centrality (0.134) - this node is a cross-community bridge._
- **What connects `@magicuidesign/mcp`, `$schema`, `style` to the rest of the system?**
  _389 weakly-connected nodes found - possible documentation gaps or missing edges._