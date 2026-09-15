# Graph Report - .  (2026-08-03)

## Corpus Check
- 276 files · ~143,004 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1451 nodes · 3465 edges · 169 communities (81 shown, 88 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 57 edges (avg confidence: 0.69)
- Token cost: 321,711 input · 0 output

## Community Hubs (Navigation)
- AI Points Ledger System
- Application Sub-Resource Routes
- Admin Dashboard
- Dev Dependencies (package.json)
- Email Templates Editor
- Applications List Page
- Dropdown Menu & Table UI
- CV Bucket Storage API
- CV Mock Data Store
- TypeScript Config
- CV AI Provider Prompts
- Applications & Profile API
- Settings Page & Presets
- Seed Data & Onboarding
- Application Detail View
- Calendar Page
- Application Stages API
- CV Bucket Upload API
- Keyboard Shortcuts & Theme
- Pipeline Builder
- CV Upload/Summary Dialogs
- shadcn Components Config
- Marketing How-It-Works Section
- Saved Jobs Page
- Marketing FAQ Section
- Kanban Board View
- Profile Page
- CV Projects Panel
- CV Cover Letter Panel
- CV Preview & Template Picker
- Marketing Features Section
- Onboarding Flow
- Status Badges & Constants
- CV Library Page
- CV Generate & Tailor
- CV Generate API
- Trash Page
- Analytics Charts & Types
- Marketing Pricing Section
- CV Generation Types
- Tag Options Store
- Marketing Layout & Footer
- CV Template Renderer
- Runtime Dependencies (package.json)
- Cross-Doc Audit & API Notes
- CV Item API & Mocks
- CV Empty & Skills Panels
- CV Project Dialog
- Marketing Hero Visual Effects
- Dashboard Preview Screenshot
- Login Page
- Analytics Page
- CV Upload Progress
- Pipeline Template Modal
- Auth Middleware & Proxy
- CV Templates API
- Error & Not-Found Pages
- CV AI Provider Failover
- Subscription & AI Points Docs
- AI Provider Check Script
- CV Mock Tailor
- Plan Tier Docs (Free/Pro/Max)
- MCP Server Config
- Root Layout & Fonts
- Particles Background Effect
- Font Assets & Licenses
- RLS Policy Script
- CV AI Provider Interface
- Prisma Seed Script
- Build Strategy Guidance
- CV Template ATS Layout Notes
- AI Point Ledger Model
- Points Concurrency & Refund
- AI Cost Basis & Registry
- Login Layout
- Analytics Layout
- Applications Layout
- Calendar Layout
- CV Section Layout
- Profile Layout
- Saved Layout
- Settings Layout
- Templates Layout
- Onboarding Layout
- Ripple Effect Component
- RLS Deny-All Cross-Doc Link
- Dependency: base-ui/react
- Dependency: class-variance-authority
- Violet Haze Cross-Doc Link
- Dependency: clsx
- Generated CV to Template Link
- PipelineStage Schema Discrepancy
- Dependency: dnd-kit/core
- Dependency: dnd-kit/sortable
- Dependency: dnd-kit/utilities
- Dependency: dotenv
- Dependency: driver.js
- ESLint Config
- Dependency: google/genai
- Dependency: hugeicons-core
- Dependency: hugeicons-react
- Dependency: mammoth
- Dependency: motion
- Dependency: next
- Next.js Config
- Dependency: next-themes
- Dependency: partial-json
- Dependency: pg
- Dependency: prisma
- Dependency: prisma-adapter-pg
- Dependency: react-day-picker
- Dependency: react-icons
- Dependency: recharts
- Dependency: shadcn CLI
- Dependency: supabase-ssr
- Dependency: supabase-js
- Dependency: swr
- Dependency: tailwind-merge
- Dependency: three.js
- Dependency: tw-animate-css
- Dependency: types-pg
- Dependency: upstash-ratelimit
- Dependency: upstash-redis
- Dependency: zod
- PostCSS Config
- GeneralSans Webfont Guide
- GeneralSans License
- Satoshi Webfont Guide
- Satoshi License
- Admin Allowlist Finding
- CSRF Risk Finding
- Lint Failures Finding
- Missing CSP Finding
- Next.js CVE Finding
- Open Redirect Finding
- Rate Limit Fail-Open Finding
- Stored XSS Finding
- CLAUDE.md Guidance
- InternTracker Project Identity
- Campus Events CV Entry
- StudyBuddy CV Entry
- DB Connection Architecture
- DB Indexing Strategy
- Trash Purge Cron Job
- Schema Migration Workflow
- API Response Format Convention
- Zod Validation Convention
- CV Credits & Plans Doc
- No Rollover Policy
- Generate Operation Order
- Dark Color Palette
- Violet Haze Design Doc
- File Icon Asset
- Globe Icon Asset
- Next.js Logo Asset
- Vercel Logo Asset
- Window Icon Asset
- create-next-app README
- App Favicon Asset
- Traqit Brand Logo

## God Nodes (most connected - your core abstractions)
1. `cn()` - 182 edges
2. `getProfile()` - 110 edges
3. `apiError()` - 107 edges
4. `prisma` - 50 edges
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

## Communities (169 total, 88 thin omitted)

### Community 0 - "AI Points Ledger System"
Cohesion: 0.07
Nodes (50): check(), ledgerCount(), main(), makeProfile(), stamp, userIds, CvStoragePage(), AiCostHint() (+42 more)

### Community 1 - "Application Sub-Resource Routes"
Cohesion: 0.11
Nodes (36): GET(), GET(), DELETE(), createSchema, GET(), POST(), DELETE(), createSchema (+28 more)

### Community 2 - "Admin Dashboard"
Cohesion: 0.07
Nodes (32): GET(), POST(), AdminDashboardPage(), dynamic, AdminDashboard(), fmtDate(), fmtDateTime(), AdminMembersTable() (+24 more)

### Community 3 - "Dev Dependencies (package.json)"
Cohesion: 0.05
Nodes (39): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node (+31 more)

### Community 4 - "Email Templates Editor"
Cohesion: 0.12
Nodes (30): EditableDraft(), EditableDraftProps, EditorProps, SortableCardProps, TemplateEditorModal(), TemplatesPage(), DraftEmailModal(), DraftEmailModalProps (+22 more)

### Community 5 - "Applications List Page"
Cohesion: 0.10
Nodes (29): ApplicationRow(), ApplicationsPageInner(), COLUMNS, currentStageLabel(), FILTER_STATUSES, formatSalary(), hasUpcomingInterview(), KanbanBoard (+21 more)

### Community 6 - "Dropdown Menu & Table UI"
Cohesion: 0.09
Nodes (24): AnimatedShinyText(), AnimatedShinyTextProps, BorderBeam(), BorderBeamProps, DropdownMenuCheckboxItem(), DropdownMenuContent(), DropdownMenuItem(), DropdownMenuLabel() (+16 more)

### Community 7 - "CV Bucket Storage API"
Cohesion: 0.15
Nodes (24): bodySchema, POST(), projectSchema, skillSchema, DELETE(), PATCH(), patchSchema, createSchema (+16 more)

### Community 8 - "CV Mock Data Store"
Cohesion: 0.10
Nodes (20): fetcher(), useCvBucket(), mockCuid(), MOCK_BUCKET, MOCK_GENERATED_CVS, MOCK_UPLOAD_DRAFT_POOL, project(), PROJECTS (+12 more)

### Community 9 - "TypeScript Config"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 10 - "CV AI Provider Prompts"
Cohesion: 0.14
Nodes (21): ANTHROPIC_MODELS, MODELS, wrap(), GOOGLE_MODELS, MODELS, THINKING_LEVELS, wrap(), ANALYZE_JD_SYSTEM (+13 more)

### Community 11 - "Applications & Profile API"
Cohesion: 0.19
Nodes (18): GET(), createSchema, GET(), include, listSelect, GET(), GET(), GET() (+10 more)

### Community 12 - "Settings Page & Presets"
Cohesion: 0.14
Nodes (21): getHash(), getServerHash(), NavItem(), SectionId, SECTIONS, SettingRow(), SettingsPage(), subscribeHash() (+13 more)

### Community 13 - "Seed Data & Onboarding"
Cohesion: 0.14
Nodes (15): GET(), GET(), metadata, OnboardingPage(), toGeneratedCv(), prisma, daysAgo(), daysFromNow() (+7 more)

### Community 14 - "Application Detail View"
Cohesion: 0.13
Nodes (17): AddDocumentForm(), DOC_TYPES, STATUS_OPTIONS, WORKMODE_OPTIONS, Tabs(), TabsContent(), TabsList(), tabsListVariants (+9 more)

### Community 15 - "Calendar Page"
Cohesion: 0.12
Nodes (19): react, react, buildEvents(), CalendarPage(), CalEvent, chipClass(), WEEKDAYS, EditableCell() (+11 more)

### Community 16 - "Application Stages API"
Cohesion: 0.12
Nodes (18): POST(), schema, DELETE(), GET(), getApp(), include, PATCH(), updateSchema (+10 more)

### Community 17 - "CV Bucket Upload API"
Cohesion: 0.15
Nodes (18): bodySchema, maxDuration, POST(), runtime, maxDuration, POST(), runtime, toCvUpload() (+10 more)

### Community 18 - "Keyboard Shortcuts & Theme"
Cohesion: 0.12
Nodes (14): ThemeSelector(), MainLayout(), KeyboardShortcuts(), ShortcutsDialog(), Sidebar(), ThemeToggle(), currentTheme(), Theme (+6 more)

### Community 19 - "Pipeline Builder"
Cohesion: 0.13
Nodes (18): PipelineBuilderProps, StageCard(), StageCardProps, STATUS_CYCLE, STATUS_DOT, STATUS_LABEL_COLORS, PipelineStages(), PipelineStagesProps (+10 more)

### Community 20 - "CV Upload/Summary Dialogs"
Cohesion: 0.13
Nodes (15): CvAddToTrackerDialog(), CvAddToTrackerDialogProps, EXAMPLES, ModeOption(), SummaryMode, CvUploadDialog(), CvUploadDialogProps, Draft (+7 more)

### Community 21 - "shadcn Components Config"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 22 - "Marketing How-It-Works Section"
Cohesion: 0.11
Nodes (15): ActivityFeedCard(), AddApplicationCard(), DEMO_JOBS, EASE, NOTIFICATIONS, PipelineCard(), STAGES, STATS (+7 more)

### Community 23 - "Saved Jobs Page"
Cohesion: 0.17
Nodes (15): SavedJobCard(), SavedPage(), SortKey, ShortcutsSettings(), AiPointsMeter(), SaveJobModal(), SaveJobModalProps, NAV_ITEMS (+7 more)

### Community 24 - "Marketing FAQ Section"
Cohesion: 0.13
Nodes (14): metadata, FAQ(), FAQItem(), FAQS, Features(), FounderMemo(), HeroCTA(), HowItWorks() (+6 more)

### Community 25 - "Kanban Board View"
Cohesion: 0.17
Nodes (16): RowProps, SavedJobCardProps, AddApplicationPanelProps, ApplicationDetailProps, ApplicationCard(), ApplicationCardProps, KanbanBoardProps, KanbanColumn() (+8 more)

### Community 26 - "Profile Page"
Cohesion: 0.14
Nodes (11): initials(), ProfilePage(), REMINDER_LEAD_OPTIONS, Switch(), SwitchProps, fetcher(), PROFILE_SWR_CONFIG, ProfileAccount (+3 more)

### Community 27 - "CV Projects Panel"
Cohesion: 0.14
Nodes (15): SortableTemplateCard(), OptionPicker(), OptionPickerProps, PickerOption, ViewBody(), CvProjectsPanel(), CvProjectsPanelProps, IconAction() (+7 more)

### Community 28 - "CV Cover Letter Panel"
Cohesion: 0.15
Nodes (12): CvCoverLetterPanel(), CvCoverLetterPanelProps, mockCoverLetter(), Sheet(), SheetContent(), SheetDescription(), SheetFooter(), SheetHeader() (+4 more)

### Community 29 - "CV Preview & Template Picker"
Cohesion: 0.18
Nodes (16): CvEditorProps, CvEditPatch, CvPreviewFrame(), CvPreviewFrameProps, PAPER_TOKENS, paperTokenStyle(), IMPORTANT: srcDoc is computed once per mount. Inline edits deliberately do, CvStreamingPreviewProps (+8 more)

### Community 30 - "Marketing Features Section"
Cohesion: 0.13
Nodes (18): CARD, COMPANIES, GHOST_APPS, GhostCard(), highlight(), OutreachCard(), PIPELINE_STAGES, PipelineCard() (+10 more)

### Community 31 - "Onboarding Flow"
Cohesion: 0.11
Nodes (8): OnboardingFlow(), OnboardingFlowProps, STEPS, StepState, TemplateOption, TemplateStep(), Select, SelectProps

### Community 32 - "Status Badges & Constants"
Cohesion: 0.15
Nodes (16): BadgeProps, StatusBadge(), MODES, PillToggle(), PillToggleProps, CONTACT_ROLES, DEFAULT_PIPELINE_TEMPLATES, DOCUMENT_TYPES (+8 more)

### Community 33 - "CV Library Page"
Cohesion: 0.18
Nodes (13): CvDetailPage(), CvLibraryPage(), STATUS_BADGE, STATUS_LABEL, CvEditor(), fetcher(), useCvTemplates(), fetcher() (+5 more)

### Community 34 - "CV Generate & Tailor"
Cohesion: 0.22
Nodes (12): CvGeneratePage(), UploadDraft, CvEmptyState(), CvTailorButton(), CvTailorButtonProps, useCvGeneration(), CvTailorPayload, getCvTailorPayloadServerSnapshot() (+4 more)

### Community 35 - "CV Generate API"
Cohesion: 0.20
Nodes (12): bodySchema, dynamic, hashJd(), maxDuration, POST(), runtime, selectProjects(), resolveCvTemplate() (+4 more)

### Community 36 - "Trash Page"
Cohesion: 0.20
Nodes (10): daysLeft(), ForeverTarget, TrashPage(), ConfirmDialog(), fetcher(), purgeTrash(), TrashData, TrashedApplication (+2 more)

### Community 37 - "Analytics Charts & Types"
Cohesion: 0.18
Nodes (9): COLORS, MOCK_APPLICATIONS, MOCK_PIPELINE_TEMPLATES, Activity, AnalyticsData, JobType, PipelineTemplate, Profile (+1 more)

### Community 38 - "Marketing Pricing Section"
Cohesion: 0.15
Nodes (11): Currency, Features(), FREE_FEATURES, GlareCard(), MAX_FEATURES, Price(), PRICES, PRO_FEATURES (+3 more)

### Community 39 - "CV Generation Types"
Cohesion: 0.30
Nodes (10): CvGenerationState, CvExtraction, MasterSummaryInput, TailorInput, MAX_SELECTED_PROJECTS, CvProject, CvSkill, CvStreamEvent (+2 more)

### Community 40 - "Tag Options Store"
Cohesion: 0.21
Nodes (12): DEFAULT_SOURCES, emit(), listeners, mk(), setSourceOptions(), setTypeOptions(), sourceOptions, subscribe() (+4 more)

### Community 41 - "Marketing Layout & Footer"
Cohesion: 0.23
Nodes (5): metadata, MarketingFooter(), NAV, MarketingShell(), ScrollReset()

### Community 42 - "CV Template Renderer"
Cohesion: 0.41
Nodes (11): editableRegion(), escapeHtml(), ESCAPES, fillProjectBlock(), fillSkillGroupBlock(), renderContact(), renderContactRows(), renderHighlights() (+3 more)

### Community 43 - "Runtime Dependencies (package.json)"
Cohesion: 0.18
Nodes (11): @anthropic-ai/sdk, date-fns, lucide-react, dependencies, @anthropic-ai/sdk, date-fns, lucide-react, react-dom (+3 more)

### Community 44 - "Cross-Doc Audit & API Notes"
Cohesion: 0.18
Nodes (11): Production Readiness & Security Audit Report, State Management Review (SWR + Optimistic Updates), Traqit Project Entry (job application tracker) in CV, Database Report, Every Mutation Creates an Activity Log Entry, Auth via auth-token Cookie + profileId, API Conventions, Application Model (Prisma Schema Doc) (+3 more)

### Community 45 - "CV Item API & Mocks"
Cohesion: 0.33
Nodes (9): DELETE(), GET(), PATCH(), patchSchema, mockDelay(), sleep(), deleteGeneratedCv(), getGeneratedCv() (+1 more)

### Community 46 - "CV Empty & Skills Panels"
Cohesion: 0.29
Nodes (8): CvEmptyStateProps, CvSkillsPanelProps, Card(), CardContent(), CardDescription(), CardFooter(), CardHeader(), CardTitle()

### Community 47 - "CV Project Dialog"
Cohesion: 0.20
Nodes (5): CvProjectDialogProps, FooterAction(), Mode, Textarea, TextareaProps

### Community 48 - "Marketing Hero Visual Effects"
Cohesion: 0.24
Nodes (8): BorderBeam(), BorderBeamProps, HeroPreview(), hexToRGB(), LaserFlow(), LaserFlowProps, SizeState, Uniforms

### Community 49 - "Dashboard Preview Screenshot"
Cohesion: 0.27
Nodes (10): Dashboard Preview Screenshot (Applications List), Add Application Primary Action Button, Applications Dense List Table (Company, Position, Type, Work mode, Current stage, Status, Via, Applied, Salary, Location), List/Board View Toggle Control, Search Company Bar and Columns Configuration Control, Sidebar Navigation Panel (Applications, Saved jobs, Calendar, Analytics, Email templates, Settings), Color-Coded Status Badges (Applied, In Progress, Ghosted, Rejected, Offer), Status Filter Tabs (All, Applied, In Progress, Offer, Accepted, Rejected, Ghosted) (+2 more)

### Community 50 - "Login Page"
Cohesion: 0.27
Nodes (7): ERROR_MESSAGES, LoginPage(), resolveError(), SUPABASE_ERROR_MESSAGES, Input, InputProps, createClient()

### Community 51 - "Analytics Page"
Cohesion: 0.29
Nodes (6): AnalyticsCharts, AnalyticsPage(), Header(), HeaderProps, fetcher(), useAnalytics()

### Community 52 - "CV Upload Progress"
Cohesion: 0.24
Nodes (7): UploadDraft, CvProjectDialog(), CvProjectFormValues, CvUploadProgress(), STAGES, SUBTITLE, UploadPhase

### Community 53 - "Pipeline Template Modal"
Cohesion: 0.27
Nodes (6): PipelineTemplateModal(), Checkbox(), CheckboxProps, ConfirmDialogProps, Modal(), ModalProps

### Community 54 - "Auth Middleware & Proxy"
Cohesion: 0.33
Nodes (8): IMPORTANT: getUser() revalidates the token with Supabase. Do not replace, updateSession(), clientIp(), config, isPublic(), proxy(), PUBLIC_PATHS, WRITE_METHODS

### Community 55 - "CV Templates API"
Cohesion: 0.36
Nodes (6): GET(), PATCH(), patchSchema, listCvTemplates(), TemplateRow, toCvTemplate()

### Community 56 - "Error & Not-Found Pages"
Cohesion: 0.42
Nodes (4): NotFound(), Button(), buttonVariants, Calendar()

### Community 57 - "CV AI Provider Failover"
Cohesion: 0.36
Nodes (8): anthropicProvider, googleProvider, analyzeJd(), assertConfigured(), providersInOrder(), tailorStream(), withFailover(), CvAiProviderName

### Community 58 - "Subscription & AI Points Docs"
Cohesion: 0.29
Nodes (7): Subscription / Plan Tier Feature (Audit View), Subscription Table (1:1 with Profile), AI Points System, Daily Reset Window (Not Monthly) for Points, Profile.dailyAiPointsOverride Per-Customer Exception, What Shipped (AI Points Implementation Status), UTC (Not Local Midnight) as the Reset Boundary

### Community 59 - "AI Provider Check Script"
Cohesion: 0.43
Nodes (6): bare(), checkAnthropic(), checkGoogle(), CLAUDE, GEMINI, main()

### Community 60 - "CV Mock Tailor"
Cohesion: 0.43
Nodes (6): analyzeJd(), CANNED_COMPANIES, extractKeywords(), lowerFirst(), STOPWORDS, tailorCv()

### Community 61 - "Plan Tier Docs (Free/Pro/Max)"
Cohesion: 0.33
Nodes (6): Plan Enum (FREE, PRO, MAX), Why Plan Limits Live in Code, Not Env, Config (Code) vs Per-User State (Database) Split, Margin Check Across Plans, Decisions Still Open (pricing, billing provider, annual plans), Free/Pro/Max Plan Definitions Table

### Community 62 - "MCP Server Config"
Cohesion: 0.47
Nodes (5): npx, magicui, reactbits, shadcn, @magicuidesign/mcp

### Community 63 - "Root Layout & Fonts"
Cohesion: 0.47
Nodes (4): metadata, RootLayout(), generalSans, satoshi

### Community 64 - "Particles Background Effect"
Cohesion: 0.47
Nodes (5): Circle, hexToRgb(), MousePosition, Particles(), ParticlesProps

### Community 65 - "Font Assets & Licenses"
Cohesion: 0.50
Nodes (5): GeneralSans Font Family, Fontshare Free Font EULA (Indian Type Foundry), Satoshi Font Family, Fontshare Free Font EULA (Indian Type Foundry) — Satoshi Copy, Typography: Satoshi (Display) + General Sans (Body/UI)

### Community 66 - "RLS Policy Script"
Cohesion: 0.40
Nodes (4): @prisma/client, main(), prisma, @prisma/client

### Community 69 - "Build Strategy Guidance"
Cohesion: 0.67
Nodes (3): Build Strategy: Static UI + Mock Data First, Sprint 0/1 Priority (Design System, App Shell, Applications List, Pipeline Builder), Use shadcn/ui Exclusively

### Community 70 - "CV Template ATS Layout Notes"
Cohesion: 0.67
Nodes (3): ::before Bullets to Avoid ATS Reading Sidebar <ul> as Body Content, Solid Bar Heading Layout Pattern, Tech Stack Rendered as Plain Inline Text (not pills) to Match Source Design

### Community 71 - "AI Point Ledger Model"
Cohesion: 0.67
Nodes (3): AiPointLedger Prisma Model, Why a Ledger Beats a Counter Column, Prisma Schema Doc

### Community 72 - "Points Concurrency & Refund"
Cohesion: 0.67
Nodes (3): Concurrency Fix: Single-Statement Advisory-Lock Spend (avoids TOCTOU race), Refund on Generation Failure — Non-Negotiable, withPoints() Spend/Refund Wrapper

### Community 73 - "AI Cost Basis & Registry"
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
- **382 isolated node(s):** `@magicuidesign/mcp`, `$schema`, `style`, `rsc`, `tsx` (+377 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **88 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Production Readiness & Security Audit Report` and `Auth via auth-token Cookie + profileId`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Database Report` and `Profile Model (Prisma Schema Doc)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `PipelineStage Intentionally Has No Unique(applicationId, order)` and `PipelineStage Model (Prisma Schema Doc)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `cn()` connect `Dropdown Menu & Table UI` to `AI Points Ledger System`, `Application Sub-Resource Routes`, `Admin Dashboard`, `Email Templates Editor`, `Applications List Page`, `Settings Page & Presets`, `Application Detail View`, `Calendar Page`, `Keyboard Shortcuts & Theme`, `Pipeline Builder`, `CV Upload/Summary Dialogs`, `Marketing How-It-Works Section`, `Saved Jobs Page`, `Marketing FAQ Section`, `Kanban Board View`, `Profile Page`, `CV Projects Panel`, `CV Cover Letter Panel`, `CV Preview & Template Picker`, `Marketing Features Section`, `Onboarding Flow`, `Status Badges & Constants`, `CV Generate & Tailor`, `Trash Page`, `Marketing Pricing Section`, `CV Empty & Skills Panels`, `CV Project Dialog`, `Marketing Hero Visual Effects`, `Login Page`, `Pipeline Template Modal`, `Error & Not-Found Pages`, `Root Layout & Fonts`, `Particles Background Effect`, `Ripple Effect Component`?**
  _High betweenness centrality (0.190) - this node is a cross-community bridge._
- **Why does `react` connect `Calendar Page` to `Runtime Dependencies (package.json)`?**
  _High betweenness centrality (0.135) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Runtime Dependencies (package.json)` to `Dev Dependencies (package.json)`, `Calendar Page`, `RLS Policy Script`, `Dependency: base-ui/react`, `Dependency: class-variance-authority`, `Dependency: clsx`, `Dependency: dnd-kit/core`, `Dependency: dnd-kit/sortable`, `Dependency: dnd-kit/utilities`, `Dependency: dotenv`, `Dependency: driver.js`, `Dependency: google/genai`, `Dependency: hugeicons-core`, `Dependency: hugeicons-react`, `Dependency: mammoth`, `Dependency: motion`, `Dependency: next`, `Dependency: next-themes`, `Dependency: partial-json`, `Dependency: pg`, `Dependency: prisma`, `Dependency: prisma-adapter-pg`, `Dependency: react-day-picker`, `Dependency: react-icons`, `Dependency: recharts`, `Dependency: shadcn CLI`, `Dependency: supabase-ssr`, `Dependency: supabase-js`, `Dependency: swr`, `Dependency: tailwind-merge`, `Dependency: three.js`, `Dependency: tw-animate-css`, `Dependency: types-pg`, `Dependency: upstash-ratelimit`, `Dependency: upstash-redis`, `Dependency: zod`?**
  _High betweenness centrality (0.133) - this node is a cross-community bridge._
- **What connects `@magicuidesign/mcp`, `$schema`, `style` to the rest of the system?**
  _382 weakly-connected nodes found - possible documentation gaps or missing edges._