# Traqit — Software Requirements Specification

|              |                                                                                                               |
| ------------ | ------------------------------------------------------------------------------------------------------------- |
| **Version**  | 1.0                                                                                                           |
| **Date**     | 2026-10-07                                                                                                    |
| **Status**   | Baseline. Describes the product as built on `fix/storie-issues`, plus the approved new requirements marked 🆕 |
| **Owner**    | dizzpy                                                                                                        |
| **Replaces** | `traqit-srs.md` (lost; never committed). Story citations have been repointed to this document                 |

---

## 1. Introduction

### 1.1 Purpose

This document specifies what Traqit must do and how well it must do it. Developers use it to build features, and QA uses it to decide whether a build is correct. When this document and the code disagree, raise it. Either the code has a bug or this document needs a revision.

### 1.2 Product scope

Traqit is a web app that helps students and interns track job and internship applications. Each application has its own interview pipeline, contacts, documents and activity history. Traqit flags applications that have gone quiet, and it emails reminders before scheduled interviews.

**In scope:** the signed-in tracker app, the founder admin dashboard, the public marketing site and pricing, and the planned roadmap (§7, listed but not specified in detail).

**Out of scope:** CV Studio (AI CV generation, CV library, AI points). It exists only on the unmerged `feat/cv-studio/frontend` branch and will get its own specification if it is merged.

### 1.3 Intended audience

| Reader        | Uses this document to…                                      |
| ------------- | ----------------------------------------------------------- |
| Developers    | Know exactly what to build and which constraints apply      |
| QA            | Derive test cases. Every FR has testable "shall" statements |
| Product owner | Approve scope and track what is built vs planned            |

### 1.4 Definitions

| Term                    | Meaning                                                                                                           |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Application**         | One job or internship the user is tracking (company + position). The central record in Traqit                     |
| **Status**              | Where an application stands overall: Saved, Applied, In Progress, Offer, Accepted, Rejected, Ghosted, Withdrawn   |
| **Pipeline**            | The ordered list of interview stages for one application                                                          |
| **Stage**               | One step in a pipeline (e.g. "Technical", "HR"), with its own status and optional scheduled date                  |
| **Pipeline template**   | A saved, reusable list of stage names that can be applied to an application                                       |
| **Source**              | Where the user found or applied for the job (e.g. LinkedIn, Referral). Shown as "Applied via"                     |
| **Job type**            | The kind of role (e.g. Intern, Trainee SE)                                                                        |
| **Ghosting**            | A company going silent after an application. Traqit flags it after the user's _ghost threshold_ (default 14 days) |
| **Soft delete / Trash** | Deleted items are hidden but kept for 30 days and can be restored, then purged permanently                        |
| **Outreach template**   | A reusable email message with placeholders, opened as a Gmail draft                                               |
| **Lead time**           | How many hours before a scheduled stage the reminder email is sent (1, 3, 24 or 48)                               |
| **Admin**               | A user whose email is on the admin allowlist                                                                      |

### 1.5 References

| Document                                                                   | Contents                                         |
| -------------------------------------------------------------------------- | ------------------------------------------------ |
| `docs/stories/dev/*.md`                                                    | Dev stories. Story _x.y_ implements FR-_x.y_     |
| `docs/stories/qa/*.md`                                                     | QA test stories, one per dev story               |
| `docs/design-system.md`                                                    | Violet Haze design tokens and component rules    |
| `docs/api-conventions.md`                                                  | API response/error shapes (partly stale; see §8) |
| `docs/current-state.md`, `docs/DATABASE_REPORT.md`, `docs/AUDIT_REPORT.md` | Code-level state, database and security audits   |
| `prisma/schema.prisma`                                                     | Source of truth for the data model               |

### 1.6 Conventions

- **FR IDs match story IDs.** FR-2.6 is implemented by story 2.6. FR groups 15 and 16 are not used because those stories are security and tooling work, which is covered in §4.
- **"Shall"** marks a mandatory, testable requirement. **"Should"** marks a recommendation.
- Status markers: ✅ built · 🆕 approved but **not built yet** (dev story written, not started).

---

## 2. Overall description

### 2.1 Product perspective

Traqit is a standalone web application. It replaces the spreadsheet or Notion board students typically use, with features built for job hunting: per-company pipelines, ghost detection and interview reminders. It has no mobile app and no browser extension today (an extension is on the roadmap, §7).

### 2.2 User classes

| Class       | Description                                                                     | Access                                            |
| ----------- | ------------------------------------------------------------------------------- | ------------------------------------------------- |
| **Visitor** | Not signed in                                                                   | Marketing site, pricing, legal pages, login       |
| **User**    | Signed-in student or intern, usually technical, job hunting under time pressure | Their own data only, across the whole `/app` area |
| **Admin**   | The founder, identified by email allowlist                                      | Everything a user has, plus the admin dashboard   |

All users are on the **Free** plan. Pro and Max are shown on the pricing page but cannot be bought (FR-18.2).

### 2.3 Operating environment

| Layer                 | Technology                                                                            |
| --------------------- | ------------------------------------------------------------------------------------- |
| Frontend + API        | Next.js 16 (App Router, route handlers), React 19, TypeScript, Tailwind v4, shadcn/ui |
| Database              | PostgreSQL on Supabase, accessed through Prisma 7                                     |
| Auth                  | Supabase Auth (magic link, GitHub OAuth)                                              |
| File storage          | Supabase Storage, private `documents` bucket                                          |
| Cache / rate limiting | Upstash Redis                                                                         |
| Email                 | SMTP via Nodemailer (Gmail with an app password today)                                |
| Scheduled jobs        | Supabase `pg_cron` + `pg_net`                                                         |
| Hosting               | Vercel (assumed; see A-1)                                                             |

### 2.4 Design and implementation constraints

- **C-1:** Authorization is enforced in the API layer. Every query is scoped to the signed-in user's profile. Database RLS is deny-all with no policies, as a backstop only.
- **C-2:** The browser never talks to the database or Storage directly. All data access goes through Traqit's own API routes.
- **C-3:** Schema changes on the shared dev database are applied as targeted SQL files in `prisma/sql/`, not `prisma db push` (see §8, G-3).
- **C-4:** UI follows the Violet Haze design system: calm, minimal, warm, with 150ms transitions and helpful empty states.
- **C-5:** The scheduler must run at least every 15 minutes, so the 1-hour reminder lead time is honored. Vercel's free cron tier (daily only) is therefore not used.

### 2.5 Assumptions and dependencies

| ID  | Assumption                                                                                        | Confirm with product owner |
| --- | ------------------------------------------------------------------------------------------------- | -------------------------- |
| A-1 | Production is hosted on Vercel, with Supabase for database, auth and storage                      | Yes, not yet confirmed     |
| A-2 | Desktop-first. Every page shall also be usable on a mobile browser (≥ 360px wide)                 | Yes, not yet confirmed     |
| A-3 | A user's timezone is detected from their browser, not chosen in Settings (FR-3.5)                 | Yes, not yet confirmed     |
| A-4 | Gmail SMTP's 500 emails/day limit covers current volume. Switching provider is an env change only | No                         |
| A-5 | Users use a current evergreen browser (latest 2 versions of Chrome, Edge, Firefox, Safari)        | No                         |

---

## 3. Functional requirements

### FR-1 Sign-in and access control

| ID     | Requirement                                                                                                                                                                                                                                                                                                                | Status |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| FR-1.1 | The system shall let a visitor sign in with an emailed magic link, or with GitHub OAuth. After sign-in, the user shall land on `/app/applications`, or on onboarding if not yet onboarded (FR-14.1). A signed-in user visiting `/login` shall be redirected to `/app/applications`.                                        | ✅     |
| FR-1.2 | Any `/app/*` page requested without a session shall redirect to `/login`. Any `/api/*` call without a session shall return HTTP 401 JSON, except `/api/cron/*`, which is secret-protected (NFR-SEC-6). The verified user id shall be forwarded to handlers, and any client-supplied copy of that header shall be stripped. | ✅     |
| FR-1.3 | The admin dashboard shall be available only to emails on the admin allowlist (built-in list plus the `ADMIN_EMAILS` env var). Anyone else shall get a 404, so the page's existence is not revealed.                                                                                                                        | ✅     |
| FR-1.4 | The post-login `next` redirect shall accept only same-site relative paths. Anything else shall fall back to `/app/applications`.                                                                                                                                                                                           | ✅     |

### FR-2 Applications

| ID     | Requirement                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Status |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| FR-2.1 | The user shall be able to create, view, edit and delete applications. **Company name is the only required field** (max 100 characters). Optional fields: position, company URL, job post URL, job type, work mode (On-site / Remote / Hybrid / No data), applied via (source), salary min/max and currency (LKR, USD, EUR, GBP, AUD; default from Settings), location, status, applied date, first response date, deadline, notes, and a pipeline template to apply on create. Edits shall show immediately and roll back with an error toast if saving fails. Deleting shall move the application to Trash and show a 5-second Undo toast. | ✅     |
| FR-2.2 | The user shall be able to switch between a **list** view and a **board** view. The board has columns Applied, In Progress, Offer, Accepted, Rejected, Ghosted. Dragging a card to another column shall change and save its status. The last-used view shall be remembered.                                                                                                                                                                                                                                                                                                                                                                  | ✅     |
| FR-2.3 | The list shall support search by company or position, sort by column (repeat clicks toggle direction), filter by status, and show/hide columns. Column visibility shall persist. Lists shall be paginated (max 100 per request).                                                                                                                                                                                                                                                                                                                                                                                                            | ✅     |
| FR-2.4 | The user shall be able to multi-select rows and move them all to Trash in one action, with confirmation.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | ✅     |
| FR-2.5 | Every status change shall add an entry (old → new status) to the application's Activity timeline, shown in chronological order. Adding contacts, documents and stages, and editing stages, shall also be logged.                                                                                                                                                                                                                                                                                                                                                                                                                            | ✅     |
| FR-2.6 | Salary shall have three distinct states: a range, **Non-paid**, or blank (undisclosed). Choosing Non-paid shall clear and disable the range inputs. The table shall show "Non-paid" as a label, never as a blank cell. Saving Non-paid together with a range shall be rejected.                                                                                                                                                                                                                                                                                                                                                             | ✅     |

### FR-3 Pipeline stages

| ID     | Requirement                                                                                                                                                                                                                                                                                                                                                                                   | Status |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| FR-3.1 | The user shall be able to add stages (quick-add presets: Call, Phone Screen, Assessment, Technical, System Design, HR, CEO, Behavioral, Offer; or a custom name), delete them, and drag to reorder. Order shall persist after reload. A stage that is still saving shall not be editable or reorderable.                                                                                      | ✅     |
| FR-3.2 | Clicking a stage's status shall cycle Upcoming → Done → Passed → Failed → Skipped → Upcoming, and the change shall persist. Marking a stage Failed shall set the application's status to Rejected and log it.                                                                                                                                                                                 | ✅     |
| FR-3.3 | The user shall be able to set or clear a stage's scheduled date. Dated stages shall appear on the Calendar (FR-7), and undated stages shall not.                                                                                                                                                                                                                                              | ✅     |
| FR-3.4 | The user shall be able to apply a saved pipeline template to an application. This **replaces** all existing stages. If the application already has stages, the system shall ask for confirmation first, naming the template and the number of stages that will be lost.                                                                                                                       | ✅     |
| FR-3.5 | 🆕 A stage's schedule shall include a **time of day** as well as a date, entered and displayed in the user's local timezone. The timezone is detected from the browser and saved on the profile so emails can use it (A-3). Existing date-only stages shall keep working and display as all-day. Reminder timing (FR-12.5), the Calendar (FR-7) and emails shall use the exact date and time. | 🆕     |

### FR-4 Contacts

| ID     | Requirement                                                                                                                                                                                                                                                             | Status |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| FR-4.1 | The user shall be able to add and delete contacts on an application. A **Person** contact has a name and role (both required), plus optional email, phone, LinkedIn URL, linked stage and notes.                                                                        | ✅     |
| FR-4.2 | A contact shall be either **Person** or **Company**. Company contacts have a name, optional general email, phone, and website/careers URL. Role and LinkedIn are not required. Company contacts shall show a building icon so they look different from Person contacts. | ✅     |
| FR-4.3 | The user shall be able to edit a contact in place, using the same form as Add. Cancel shall discard changes. Switching a contact to Person without a role shall be rejected.                                                                                            | ✅     |

### FR-5 Documents

| ID     | Requirement                                                                                                                                                                                                                                                                                                                                                                                                                      | Status |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| FR-5.1 | The user shall be able to attach a document as a **link**, with a label, URL and type (CV, Cover letter, Portfolio, Other), and delete it.                                                                                                                                                                                                                                                                                       | ✅     |
| FR-5.2 | The user shall be able to **upload a file** instead of a link. Allowed: PDF, DOCX, PNG, JPG, max 10 MB, checked in the browser and on the server. A rejected or failed upload shall show a clear message and shall create no record. Files shall be stored privately. Opening one shall go through an ownership check, then a download link that expires in 60 seconds. Deleting the document shall also delete the stored file. | ✅     |
| FR-5.3 | The user shall be able to edit a document in place: its label and type, the URL of a link document, and replace the file of an uploaded document. The new file shall be stored before the old one is removed, so a failed replace leaves the original intact.                                                                                                                                                                    | ✅     |

### FR-6 Saved jobs

| ID     | Requirement                                                                                                                                                            | Status |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| FR-6.1 | Applications with status Saved shall be listed on a dedicated Saved page. "Promote to Applied" shall set the status to Applied and remove the job from the Saved list. | ✅     |

### FR-7 Calendar

| ID     | Requirement                                                                                                                                                                                         | Status |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| FR-7.1 | The Calendar shall show every scheduled stage on its day in a month grid.                                                                                                                           | ✅     |
| FR-7.2 | The Calendar shall offer a list (agenda) view of the same events. The Calendar is **read-only**: no creating or editing events from it, and no external calendar sync (sync is on the roadmap, §7). | ✅     |

### FR-8 Ghost detection

| ID     | Requirement                                                                                                                                                                                                                                                                                                                                                                                                                                | Status |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| FR-8.1 | An application that is Applied, has no first response date, and was applied ≥ _ghost threshold_ days ago shall show an "*N*d silent" badge with an explanatory tooltip. Changing the threshold in Settings (1–365 days, default 14) shall recalculate the badges. Setting the status to **Ghosted** is always a separate, manual action. The system shall never change the status automatically.                                           | ✅     |
| FR-8.2 | A scheduled check (every 15 minutes) shall email each user who has notifications on, listing their applications that newly meet the FR-8.1 rule. Each user gets one email per run, listing every affected application. An application shall be emailed about only once per occurrence. Changing its applied date starts a new occurrence. A failed send shall be retried on the next run. Users with notifications off shall get no email. | ✅     |

### FR-9 Presets

| ID     | Requirement                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Status |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| FR-9.1 | The user shall be able to add and delete their own **Sources** and **Job types** (a rename API exists, but there is no rename button in the UI yet; see G-9). New values appear in dropdowns immediately. Duplicate names (per user) shall be rejected with a clear error. Defaults are seeded for new users (sources such as LinkedIn, Referral, Indeed; job types such as Intern, Trainee SE, Junior Dev). Dropdowns shall order sources by how often they are used. | ✅     |
| FR-9.2 | The user shall be able to create, edit and delete **pipeline templates** (a name plus an ordered stage list), and mark one as the default pre-selected in the Add form. Editing a template shall not change applications it was already applied to. New users get three templates: "SL company", "Standard tech", "FAANG-style".                                                                                                                                       | ✅     |

### FR-10 Outreach email templates

| ID      | Requirement                                                                                                                                                                                                                                                                                                                        | Status |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| FR-10.1 | The user shall be able to create, edit, categorize (Outreach, Follow-up, Cold, Networking, General), drag-reorder and delete outreach templates. Template names are unique per user. Deleted templates go to Trash.                                                                                                                | ✅     |
| FR-10.2 | Using a template on an application shall substitute `{company}`, `{position}`, `{contact}`, `{myName}` and `{jobUrl}` with that application's data. Unknown placeholders are left as typed. "Send" shall open a pre-filled Gmail compose window in a new tab. **Traqit never sends the email itself**; the user sends it in Gmail. | ✅     |

### FR-11 Trash

| ID      | Requirement                                                                                                                                                                                                                                                                                                           | Status |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| FR-11.1 | Deleted applications and outreach templates shall appear in Trash, and shall be restorable for 30 days. After 30 days they shall be permanently deleted, both by a daily database job (03:00 UTC) and by a cleanup that runs whenever Trash is opened. The user shall also be able to permanently delete items early. | ✅     |

### FR-12 Settings and notifications

| ID      | Requirement                                                                                                                                                                                                                                                                                                                                                                                                                                   | Status |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| FR-12.1 | All account settings shall live on one page, `/app/settings`: account (avatar, name, email, sign-in provider, join date), preferences (default currency, ghost threshold, default template), email and reminders, presets, help (FR-14.2), and a danger zone. The old `/app/profile` URL shall redirect to Settings. The sidebar shall show a single Settings entry.                                                                          | ✅     |
| FR-12.2 | "Export" shall download a JSON file of the user's profile, applications, stages, contacts, documents (metadata and links) and activity. There shall be no row cap.                                                                                                                                                                                                                                                                            | ✅     |
| FR-12.3 | "Delete all applications" shall move every application to Trash (restorable for 30 days), after a confirmation that says so.                                                                                                                                                                                                                                                                                                                  | ✅     |
| FR-12.4 | "Delete account" shall, after confirmation, permanently delete the profile and all its data, and also the auth user when the service-role key is configured.                                                                                                                                                                                                                                                                                  | ✅     |
| FR-12.5 | When notifications are on, the scheduled check (every 15 minutes) shall email a reminder for each upcoming stage once it falls within the user's lead time (1, 3, 24 or 48 hours; default 24). Each stage shall be reminded about at most once. Rescheduling the stage allows a new reminder. Stages on Rejected or Withdrawn applications, and stages not marked Upcoming, shall be skipped. A failed send shall be retried on the next run. | ✅     |
| FR-12.6 | A single Settings toggle, "Email me about interviews and quiet applications" (default **off**), shall control both reminder emails (FR-12.5) and ghost alerts (FR-8.2). The user shall also be able to set the name used for the `{myName}` placeholder.                                                                                                                                                                                      | ✅     |

### FR-13 Admin dashboard

| ID      | Requirement                                                                                                                                                                                                                                          | Status |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| FR-13.1 | The admin dashboard shall show growth (total users, new today / 7 days / 30 days, active in the last 7 days, never returned after sign-up), per-company application, response and ghost counts, and a sortable members table with per-user activity. | ✅     |

### FR-14 Onboarding and help

| ID      | Requirement                                                                                                                                                                                                                                                                                                                                                                                                                                       | Status |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| FR-14.1 | A new user's first visit shall start a 5-step wizard: Welcome → Your details → Pick a template → First job → Done. Refreshing resumes at the first unfinished step. Finishing shall mark the user as onboarded, and the wizard shall not appear again.                                                                                                                                                                                            | ✅     |
| FR-14.2 | A guided tour shall highlight the key parts of the Applications page on first use. It can be replayed from Settings; if there are no applications yet, the user is told to add one first. Keyboard shortcuts: `a` Applications, `s` Saved, `c` Calendar, `g` Analytics, `t` Email templates, `,` Settings, `n` New application, `b` Save job, `/` Focus search, `d` Toggle theme, `Mod+B` Toggle sidebar. A shortcuts dialog shall list them all. | ✅     |
| FR-14.3 | A brand-new account shall be seeded so it is never a blank page: default sources, job types and pipeline templates (FR-9), starter outreach templates (FR-10), and a few **example applications** across different statuses, with stages, a contact and activity. Example applications are seeded only if the account has none, and can be deleted like any other application.                                                                    | ✅     |

### FR-17 Analytics

| ID      | Requirement                                                                                                                                                                                                                                                                                                                                                                                                                                   | Status |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| FR-17.1 | The Analytics page shall show, calculated over the user's non-Saved applications: **response rate** (not Applied/Ghosted ÷ total), **interview rate** (In Progress + Offer + Accepted ÷ total), **offer rate** (Offer + Accepted ÷ total), average days from applied to first response, a breakdown by status, applications per week for the last 12 weeks, and response rate per source (only sources with ≥ 2 applications, highest first). | ✅     |

### FR-18 Marketing site and pricing

| ID      | Requirement                                                                                                                                                                                                                                                                                                                                                                                                                             | Status |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| FR-18.1 | Visitors shall see a landing page (hero, features, how it works, founder memo, FAQ, pricing, footer) and Privacy, Terms and Cookies pages. All are viewable without signing in.                                                                                                                                                                                                                                                         | ✅     |
| FR-18.2 | The pricing section shall show three plans: **Free** ($0 / Rs. 0), **Pro** ($0.99 / Rs. 324) and **Max** ($1.99 / Rs. 652), with a USD/LKR switch. Only Free shall be selectable; it leads to sign-up. Pro and Max shall be visibly disabled and labelled "Coming soon".                                                                                                                                                                | ✅     |
| FR-18.3 | 🆕 Pricing and FAQ copy shall match what the app actually does: (a) email reminders, JSON export and a custom ghost threshold shall be listed under **Free**, not Pro, because every user has them; (b) the FAQ shall say ghosting is **flagged** after the user's threshold (default 14 days), not that the application is "automatically marked" as ghosted. Pro and Max shall keep listing only features that do not exist yet (§7). | 🆕     |

---

## 4. Non-functional requirements

### 4.1 Security

| ID        | Requirement                                                                                                                                                                                                                                                             |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NFR-SEC-1 | Every API route shall verify the session and scope every read and write to the caller's profile. Child records (stages, contacts, documents) are reached only through an application the caller owns. A user shall never be able to read or change another user's data. |
| NFR-SEC-2 | Every response shall include a Content-Security-Policy and standard security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, etc.).                                                                                                                  |
| NFR-SEC-3 | API calls shall be rate-limited per user (or per IP when signed out): 100 requests/60s for reads, 30/60s for writes. Over the limit, the API returns 429 with a `Retry-After` header.                                                                                   |
| NFR-SEC-4 | All database tables shall have RLS enabled with no policies, so the public anon key cannot read or write data.                                                                                                                                                          |
| NFR-SEC-5 | The service-role key, SMTP credentials and cron secret shall be used only on the server and never sent to the browser.                                                                                                                                                  |
| NFR-SEC-6 | `/api/cron/*` routes shall require `Authorization: Bearer <CRON_SECRET>`, compared in constant time, and shall refuse all calls when the secret is unset.                                                                                                               |
| NFR-SEC-7 | Uploaded files shall be stored in a private bucket and served only through short-lived signed URLs after an ownership check (FR-5.2).                                                                                                                                   |
| NFR-SEC-8 | All user-supplied text placed in emails or the admin dashboard shall be escaped (no HTML injection).                                                                                                                                                                    |

### 4.2 Performance

| ID         | Requirement                                                                                                                             |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| NFR-PERF-1 | Edits shall appear in the UI immediately (optimistic updates), without waiting for the server.                                          |
| NFR-PERF-2 | List endpoints shall be paginated (≤ 100 rows per request). The profile lookup on each request shall be cached in Redis.                |
| NFR-PERF-3 | Should: typical API responses complete in under 500ms, and pages become interactive in under 2.5s on a mid-range laptop over broadband. |

### 4.3 Reliability

| ID        | Requirement                                                                                                                                   |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| NFR-REL-1 | If Redis is down or not configured, the app shall keep working, with caching and rate limiting skipped.                                       |
| NFR-REL-2 | Trash retention shall hold even if the scheduled job is missing, because opening Trash also cleans up (FR-11.1).                              |
| NFR-REL-3 | Notification emails shall never be sent twice for the same event, even if two checks overlap. A failed send shall be retried on the next run. |
| NFR-REL-4 | When SMTP is not configured, the notification routes shall return 503, so a misconfigured deployment shows up in the cron run history.        |
| NFR-REL-5 | A failed upload or replace shall never leave a document record without its file, or a stored file without a record.                           |

### 4.4 Usability

| ID        | Requirement                                                                                                                                          |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| NFR-USE-1 | The UI shall follow the Violet Haze design system (`docs/design-system.md`) in both dark (default) and light themes, with 150ms transitions.         |
| NFR-USE-2 | Every list shall have a helpful empty state that tells the user what to do next.                                                                     |
| NFR-USE-3 | Destructive actions shall need confirmation or offer Undo. Errors shall be shown as plain-language toasts or inline messages, never raw error codes. |
| NFR-USE-4 | All core flows shall be usable with the keyboard alone (FR-14.2), and controls shall have accessible labels.                                         |
| NFR-USE-5 | Pages shall work from 360px wide upward, with no horizontal page scroll (A-2).                                                                       |

### 4.5 Privacy and data handling

| ID         | Requirement                                                                                                                            |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| NFR-PRIV-1 | Users shall be able to export all their data (FR-12.2) and permanently delete their account (FR-12.4).                                 |
| NFR-PRIV-2 | Traqit shall not sell or share user data, and shall not add third-party analytics or tracking without updating the Privacy page first. |
| NFR-PRIV-3 | Emails shall go only to the account's own email address. Every notification email shall say how to turn notifications off.             |

### 4.6 Maintainability

| ID          | Requirement                                                                                                                                                                                     |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NFR-MAINT-1 | `lint`, `typecheck` and `build` shall pass with zero errors. A pre-commit hook shall lint and format staged files, and a pre-push hook shall typecheck.                                         |
| NFR-MAINT-2 | CI (GitHub Actions) shall run lint, typecheck and build on every pull request and every push to `main`. Merging to `main` should require CI to pass (branch protection; manual GitHub setting). |
| NFR-MAINT-3 | Every schema change shall come with a SQL file in `prisma/sql/` that can be run on each environment (C-3).                                                                                      |
| NFR-MAINT-4 | API errors shall use the shared `{ error: { message, code } }` shape with a correct HTTP status.                                                                                                |

---

## 5. External interfaces

### 5.1 User interface

Main areas: sidebar navigation (Applications, Saved jobs, Calendar, Analytics, Email templates, Trash, Settings), the applications list/board, and a slide-over detail panel with Pipeline, Contacts, Documents and Activity tabs.

### 5.2 Software interfaces

| System                     | Used for                           | Failure behavior                                                      |
| -------------------------- | ---------------------------------- | --------------------------------------------------------------------- |
| Supabase Auth              | Magic link, GitHub OAuth, sessions | Sign-in unavailable                                                   |
| Supabase Postgres (Prisma) | All app data                       | App unavailable                                                       |
| Supabase Storage           | Uploaded documents                 | Upload/download fails with a clear message; link documents unaffected |
| Upstash Redis              | Cache and rate limiting            | Skipped, app keeps working (NFR-REL-1)                                |
| SMTP server                | Notification emails                | Route returns 503; sends retried next run                             |
| Gmail compose URL          | Outreach drafts (FR-10.2)          | Not an API; just opens a browser tab                                  |

### 5.3 Scheduled jobs

| Job                   | Schedule         | Action                                                                                                                                                        |
| --------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `purge-trash-daily`   | 03:00 UTC daily  | Permanently delete Trash items older than 30 days                                                                                                             |
| `email-notifications` | Every 15 minutes | POST to `/api/cron/reminder-check` and `/api/cron/ghost-check`, with the app URL and secret read from Supabase Vault (`prisma/sql/pg_cron_notifications.sql`) |

### 5.4 Configuration (environment variables)

| Variable                                                         | Purpose                                      | Required                                          |
| ---------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------- |
| `DATABASE_URL`, `DIRECT_URL`                                     | Postgres connections                         | Yes                                               |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`      | Supabase client                              | Yes                                               |
| `SUPABASE_SERVICE_ROLE_KEY`                                      | Storage, auth-user deletion, admin dashboard | Yes in production                                 |
| `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SITE_URL`                    | Absolute links (emails)                      | Yes                                               |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`             | Cache and rate limiting                      | Yes in production (NFR-SEC-3 is off without them) |
| `ADMIN_EMAILS`                                                   | Extra admin emails, comma-separated          | No                                                |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` | Notification emails                          | Yes for FR-8.2 and FR-12.5                        |
| `CRON_SECRET`                                                    | Protects `/api/cron/*`                       | Yes for FR-8.2 and FR-12.5                        |

---

## 6. Data requirements

### 6.1 Entities

| Entity           | Holds                                                                                                                                       | Deletion                                         |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Profile          | One per auth user: name, email, preferences (currency, ghost threshold, reminders, lead time, email name, default template), onboarded date | Deleting it removes all the user's data          |
| Subscription     | Plan tier (FREE / PRO / MAX, default FREE). Not read by any feature yet                                                                     | With profile                                     |
| Application      | The tracked job (FR-2) and the ghost-alert marker                                                                                           | Soft delete → Trash, purged after 30 days        |
| PipelineStage    | Name, order, status, scheduled date, completed date, notes, reminder-sent marker                                                            | With application                                 |
| Contact          | Person/Company details (FR-4)                                                                                                               | Hard delete; with application                    |
| Document         | Label, type, link or stored-file details (FR-5)                                                                                             | Hard delete (file removed too); with application |
| Activity         | Append-only timeline entries                                                                                                                | With application                                 |
| Source, JobType  | User's dropdown values + usage count; names unique per user                                                                                 | Hard delete                                      |
| PipelineTemplate | Name, ordered stage names, default flag                                                                                                     | Hard delete                                      |
| EmailTemplate    | Name, subject, body, category, order; names unique per user                                                                                 | Soft delete → Trash, purged after 30 days        |

### 6.2 Enumerations

- **Application status:** SAVED, APPLIED, IN_PROGRESS, OFFER, ACCEPTED, REJECTED, GHOSTED, WITHDRAWN
- **Stage status:** UPCOMING, COMPLETED (shown as "Done"), PASSED, FAILED, SKIPPED
- **Contact type:** PERSON, COMPANY
- **Document type:** cv, cover-letter, portfolio, other · **source:** link, upload

### 6.3 Retention

| Data                               | Kept for                                           |
| ---------------------------------- | -------------------------------------------------- |
| Trashed applications and templates | 30 days, then permanently deleted                  |
| Everything else                    | Until the user deletes it or deletes their account |
| Download links for uploaded files  | 60 seconds                                         |

---

## 7. Future roadmap (planned, not specified)

These features are shown on the pricing page or planned. **They are not requirements yet.** Each needs its own specification and stories before work starts.

| ID    | Feature                                                                  | Plan         |
| ----- | ------------------------------------------------------------------------ | ------------ |
| FUT-1 | Billing and plan upgrades (payment provider, checkout, plan enforcement) | Pro / Max    |
| FUT-2 | Browser extension: save any job posting in one click                     | Pro          |
| FUT-3 | Advanced analytics dashboard                                             | Pro          |
| FUT-4 | Team workspace, up to 10 members                                         | Max          |
| FUT-5 | Shared pipeline templates across a team                                  | Max          |
| FUT-6 | Mentor view: read-only board access for coaches                          | Max          |
| FUT-7 | Bulk export for reporting                                                | Max          |
| FUT-8 | Dedicated support                                                        | Max          |
| FUT-9 | Calendar sync (Google Calendar / ICS export)                             | Not assigned |

---

## 8. Known gaps and open issues

| ID  | Issue                                                                                                                                                     | Impact                                                  |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| G-1 | No automated tests. Verification is manual QA plus scripted checks run during development                                                                 | Regressions are caught late                             |
| G-2 | No migration history. Schema changes are SQL files in `prisma/sql/`, run by hand on each environment                                                      | Each environment must be updated manually before deploy |
| G-3 | The shared dev database has 6 tables from the CV Studio branch that are not in this branch's schema. Running `prisma db push` would delete them (40 rows) | Do not run `db push` until this is resolved             |
| G-4 | `JobType.usageCount` is never incremented, so job types are not really ordered by use                                                                     | Minor; dropdown order is less useful                    |
| G-5 | `docs/prisma-schema.md` and parts of `docs/api-conventions.md` are out of date (e.g. not every mutation writes to Activity)                               | Use `prisma/schema.prisma` and this SRS instead         |
| G-6 | Stage dates have no time of day, so reminders count back from midnight UTC on the stage's date (about 4:30am Sri Lanka time for a 1-hour lead time)       | Fixed by FR-3.5 🆕                                      |
| G-7 | Pricing and FAQ copy promise things the app does not do                                                                                                   | Fixed by FR-18.3 🆕                                     |
| G-8 | Branch protection on `main` is not yet enabled                                                                                                            | CI failures can still be merged                         |
| G-9 | Sources and job types can be renamed through the API (`PATCH /api/presets/sources/[id]`, `/job-types/[id]`) but not from the UI                           | Users must delete and re-add to rename                  |

---

## Appendix A — Traceability

| FR              | Dev / QA story                     | Status |
| --------------- | ---------------------------------- | ------ |
| FR-1.1 – 1.3    | 1.1 – 1.3                          | ✅     |
| FR-1.4          | 15.1                               | ✅     |
| FR-2.1 – 2.6    | 2.1 – 2.6                          | ✅     |
| FR-3.1 – 3.4    | 3.1 – 3.4                          | ✅     |
| FR-3.5          | 3.5 (not started)                  | 🆕     |
| FR-4.1 – 4.3    | 4.1 – 4.3                          | ✅     |
| FR-5.1 – 5.3    | 5.1 – 5.3                          | ✅     |
| FR-6.1          | 6.1                                | ✅     |
| FR-7.1 – 7.2    | 7.1                                | ✅     |
| FR-8.1 – 8.2    | 8.1 – 8.2                          | ✅     |
| FR-9.1 – 9.2    | 9.1 – 9.2 (+ 15.3 for usage count) | ✅     |
| FR-10.1 – 10.2  | 10.1 – 10.2                        | ✅     |
| FR-11.1         | 11.1                               | ✅     |
| FR-12.1 – 12.5  | 12.1 – 12.5                        | ✅     |
| FR-12.6         | 8.2, 12.5                          | ✅     |
| FR-13.1         | 13.1                               | ✅     |
| FR-14.1 – 14.2  | 14.1 – 14.2                        | ✅     |
| FR-14.3         | 14.3                               | ✅     |
| FR-17.1         | 17.1                               | ✅     |
| FR-18.1 – 18.2  | 18.1 – 18.2                        | ✅     |
| FR-18.3         | 18.3 (not started)                 | 🆕     |
| NFR-SEC-2       | 15.2                               | ✅     |
| NFR-MAINT-1 – 2 | 15.4, 16.1, 16.2                   | ✅     |

## Appendix B — Revision history

| Version | Date       | Change                                                                               |
| ------- | ---------- | ------------------------------------------------------------------------------------ |
| 1.0     | 2026-10-07 | First committed SRS, rebuilt from code, stories and docs after the original was lost |
