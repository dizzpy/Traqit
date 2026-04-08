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
  SAVED: "bg-surface-elevated text-text-muted",
  APPLIED: "bg-info/10 text-info",
  IN_PROGRESS: "bg-warning/10 text-warning",
  OFFER: "bg-success/10 text-success",
  ACCEPTED: "bg-success/20 text-success",
  REJECTED: "bg-danger/10 text-danger",
  GHOSTED: "bg-surface-elevated text-text-muted",
  WITHDRAWN: "bg-surface-elevated text-text-muted",
};

export const STAGE_STATUS_LABELS: Record<StageStatus, string> = {
  UPCOMING: "Upcoming",
  COMPLETED: "Completed",
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
  "OA",
  "Phone Screen",
  "Technical Round",
  "System Design",
  "HR Round",
  "Take-home",
  "Behavioral",
  "Team Match",
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
  "SAVED",
  "APPLIED",
  "IN_PROGRESS",
  "OFFER",
  "ACCEPTED",
  "REJECTED",
  "GHOSTED",
];

export const GHOST_THRESHOLD_DAYS = 14;
