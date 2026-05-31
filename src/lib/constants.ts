import type { ApplicationStatus, StageStatus, WorkMode } from "@/types";

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  SAVED: "Saved",
  APPLIED: "Applied",
  IN_PROGRESS: "In Progress",
  OFFER: "Offer",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  GHOSTED: "Ghosted",
  WITHDRAWN: "Withdrawn",
};

export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  SAVED: "text-text-muted border-border",
  APPLIED: "text-info",
  IN_PROGRESS: "text-warning",
  OFFER: "text-success",
  ACCEPTED: "text-success",
  REJECTED: "text-danger",
  GHOSTED: "text-text-muted",
  WITHDRAWN: "text-text-muted",
};

export const STATUS_BG: Record<ApplicationStatus, string> = {
  SAVED: "bg-[var(--status-saved-bg)] text-[var(--status-saved-fg)] border border-dashed border-border",
  APPLIED: "bg-[var(--status-applied-bg)] text-[var(--status-applied-fg)]",
  IN_PROGRESS: "bg-[var(--status-progress-bg)] text-[var(--status-progress-fg)]",
  OFFER: "bg-[var(--status-offer-bg)] text-[var(--status-offer-fg)]",
  ACCEPTED: "bg-[var(--status-accepted-bg)] text-[var(--status-accepted-fg)]",
  REJECTED: "bg-[var(--status-rejected-bg)] text-[var(--status-rejected-fg)]",
  GHOSTED: "text-[var(--status-ghosted-fg)] opacity-60",
  WITHDRAWN: "bg-[var(--status-applied-bg)] text-[var(--status-applied-fg)]",
};

export const STAGE_STATUS_LABELS: Record<StageStatus, string> = {
  UPCOMING: "Upcoming",
  COMPLETED: "Done",
  PASSED: "Passed",
  FAILED: "Failed",
  SKIPPED: "Skipped",
};

export const STAGE_STATUS_COLORS: Record<StageStatus, string> = {
  UPCOMING: "text-text-muted",
  COMPLETED: "text-info",
  PASSED: "text-success",
  FAILED: "text-danger",
  SKIPPED: "text-text-muted",
};

export const WORK_MODE_LABELS: Record<WorkMode, string> = {
  "on-site": "On-site",
  remote: "Remote",
  hybrid: "Hybrid",
  "no-data": "No data",
};

export const WORK_MODE_COLORS: Record<WorkMode, string> = {
  "on-site": "bg-info/10 text-info",
  remote: "bg-success/10 text-success",
  hybrid: "bg-warning/10 text-warning",
  "no-data": "bg-surface-elevated text-text-muted",
};

export const CURRENCIES = ["LKR", "USD", "EUR", "GBP", "AUD"];

export const DEFAULT_SOURCES = [
  "RoosterJob",
  "LinkedIn",
  "Direct Mail",
  "BambooHR",
  "Company Website",
  "Referral",
  "Indeed",
  "GitHub Jobs",
];

export const DEFAULT_JOB_TYPES = [
  "Intern",
  "Trainee SE",
  "Junior Dev",
  "Mid-level Dev",
  "SE Intern",
];

export const DEFAULT_PIPELINE_TEMPLATES = [
  { name: "SL company", stages: ["Interview", "Offer"] },
  { name: "Standard tech", stages: ["OA", "Phone Screen", "Technical", "HR", "Offer"] },
  {
    name: "FAANG-style",
    stages: [
      "OA",
      "Phone Screen",
      "Technical 1",
      "Technical 2",
      "System Design",
      "Behavioral",
      "Team Match",
      "Offer",
    ],
  },
];

export const STAGE_PRESETS = [
  "Call",
  "Phone Screen",
  "Assessment",
  "Technical",
  "System Design",
  "HR",
  "CEO",
  "Behavioral",
  "Offer",
];

export const CONTACT_ROLES = [
  "Recruiter",
  "Hiring Manager",
  "Interviewer",
  "HR",
  "Other",
];

export const DOCUMENT_TYPES = ["cv", "cover-letter", "portfolio", "other"];

export const KANBAN_COLUMNS: ApplicationStatus[] = [
  "APPLIED",
  "IN_PROGRESS",
  "OFFER",
  "ACCEPTED",
  "REJECTED",
  "GHOSTED",
];

export const GHOST_THRESHOLD_DAYS = 14;
