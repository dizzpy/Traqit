# Prisma Schema - InternTracker

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url = env("DATABASE_URL")
}

// Profile
model Profile {
  id String @id @default(cuid())
  name String @unique
  createdAt DateTime @default(now())
  applications Application[]
  sources Source[]
  jobTypes JobType[]
  pipelineTemplates PipelineTemplate[]
  emailTemplates EmailTemplate[]
}

// Application
model Application {
  id String @id @default(cuid())
  profileId String
  profile Profile @relation(fields: [profileId], references: [id], onDelete: Cascade)
  companyName String
  companyUrl String?
  position String
  jobPostUrl String?
  jobType String
  workMode String
  appliedVia String
  salaryMin Float?
  salaryMax Float?
  currency String @default("LKR")
  location String?
  status ApplicationStatus @default(SAVED)
  appliedDate DateTime?
  firstResponseDate DateTime?
  deadline DateTime?
  notes String?
  stages PipelineStage[]
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

// Pipeline Stage
model PipelineStage {
  id String @id @default(cuid())
  applicationId String
  application Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  name String
  order Int
  status StageStatus @default(UPCOMING)
  scheduledDate DateTime?
  completedDate DateTime?
  notify Boolean @default(false)
  notifyAt DateTime?
  notes String?
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

// Email Template
model EmailTemplate {
  id String @id @default(cuid())
  profileId String
  profile Profile @relation(fields: [profileId], references: [id], onDelete: Cascade)
  name String
  subject String
  body String
  createdAt DateTime @default(now())

  @@unique([profileId, name])
}

// Other models: Contact, Document, Activity, Source, JobType, PipelineTemplate
// (Full schema available in PRD)
```

**Important**: All queries must be scoped by `profileId`.
```

