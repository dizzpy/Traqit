export type ApplicationStatus =
  | "SAVED"
  | "APPLIED"
  | "IN_PROGRESS"
  | "OFFER"
  | "ACCEPTED"
  | "REJECTED"
  | "GHOSTED"
  | "WITHDRAWN";

export type StageStatus =
  | "UPCOMING"
  | "COMPLETED"
  | "PASSED"
  | "FAILED"
  | "SKIPPED";

export type WorkMode = "on-site" | "remote" | "hybrid" | "no-data";

export interface PipelineStage {
  id: string;
  applicationId: string;
  name: string;
  order: number;
  status: StageStatus;
  scheduledDate: string | null;
  completedDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  applicationId: string;
  name: string;
  role: string;
  email: string | null;
  phone: string | null;
  linkedinUrl: string | null;
  stageName: string | null;
  notes: string | null;
  createdAt: string;
}

export interface Document {
  id: string;
  applicationId: string;
  name: string;
  url: string;
  type: string;
  createdAt: string;
}

export interface Activity {
  id: string;
  applicationId: string;
  type: string;
  description: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface Application {
  id: string;
  profileId: string;
  companyName: string;
  companyUrl: string | null;
  position: string;
  jobPostUrl: string | null;
  jobType: string;
  workMode: WorkMode;
  appliedVia: string;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  location: string | null;
  status: ApplicationStatus;
  appliedDate: string | null;
  firstResponseDate: string | null;
  deadline: string | null;
  notes: string | null;
  stages: PipelineStage[];
  contacts: Contact[];
  documents: Document[];
  activityLog: Activity[];
  createdAt: string;
  updatedAt: string;
}

export interface Profile {
  id: string;
  name: string;
  defaultCurrency: string;
  defaultPipelineTemplateId: string | null;
  ghostThresholdDays: number;
  createdAt: string;
  updatedAt: string;
}

export interface Source {
  id: string;
  profileId: string;
  name: string;
  usageCount: number;
}

export interface JobType {
  id: string;
  profileId: string;
  name: string;
  usageCount: number;
}

export interface PipelineTemplate {
  id: string;
  profileId: string;
  name: string;
  stages: string[];
  isDefault: boolean;
  createdAt: string;
}

export interface EmailTemplate {
  id: string;
  profileId: string;
  name: string;
  subject: string;
  body: string;
  category: string;
  order: number;
  createdAt: string;
}

export interface AnalyticsData {
  totalApplications: number;
  responseRate: number;
  interviewRate: number;
  offerRate: number;
  avgDaysToFirstResponse: number | null;
  statusBreakdown: Record<ApplicationStatus, number>;
  sourceEffectiveness: Array<{
    source: string;
    total: number;
    responseRate: number;
  }>;
  applicationsOverTime: Array<{ date: string; count: number; responses: number }>;
  funnelData: Array<{ stage: string; count: number; pct: number }>;
}
