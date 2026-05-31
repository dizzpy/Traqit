import { prisma } from "./prisma";

export async function seedProfile(profileId: string) {
  const sources = [
    "RoosterJob", "LinkedIn", "Direct Mail", "BambooHR",
    "Company Website", "Referral", "Indeed", "GitHub Jobs",
  ];
  for (const name of sources) {
    await prisma.source.upsert({
      where: { profileId_name: { profileId, name } },
      update: {},
      create: { profileId, name },
    });
  }

  const jobTypes = ["Intern", "Trainee SE", "Junior Dev", "Mid-level Dev", "SE Intern"];
  for (const name of jobTypes) {
    await prisma.jobType.upsert({
      where: { profileId_name: { profileId, name } },
      update: {},
      create: { profileId, name },
    });
  }

  const templates = [
    { name: "SL company",    stages: ["Interview", "Offer"],                                                                                          isDefault: true },
    { name: "Standard tech", stages: ["OA", "Phone Screen", "Technical", "HR", "Offer"],                                                              isDefault: false },
    { name: "FAANG-style",   stages: ["OA", "Phone Screen", "Technical 1", "Technical 2", "System Design", "Behavioral", "Team Match", "Offer"],      isDefault: false },
  ];
  for (const t of templates) {
    await prisma.pipelineTemplate.upsert({
      where: { profileId_name: { profileId, name: t.name } },
      update: {},
      create: { profileId, name: t.name, stages: t.stages, isDefault: t.isDefault },
    });
  }

  for (let i = 0; i < EMAIL_TEMPLATE_SEEDS.length; i++) {
    const t = EMAIL_TEMPLATE_SEEDS[i];
    await prisma.emailTemplate.upsert({
      where: { profileId_name: { profileId, name: t.name } },
      update: { subject: t.subject, body: t.body, category: t.category },
      create: { profileId, name: t.name, subject: t.subject, body: t.body, category: t.category, order: i },
    });
  }

  await seedSampleApplications(profileId);
}

const DAY = 86_400_000;
const daysAgo = (n: number) => new Date(Date.now() - n * DAY);
const daysFromNow = (n: number) => new Date(Date.now() + n * DAY);

/**
 * Seeds a small set of realistic example applications so a brand-new account
 * isn't a blank page. Covers a spread of statuses (saved → offer → rejected →
 * ghosted) with stages, a contact and activity. Safe to call repeatedly — it
 * no-ops once the profile already has any applications, and users can delete
 * these individually or via Profile → Danger zone → "Wipe all data".
 */
export async function seedSampleApplications(profileId: string) {
  const existing = await prisma.application.count({ where: { profileId } });
  if (existing > 0) return;

  // In progress — assessment done, technical coming up.
  await prisma.application.create({
    data: {
      profileId,
      companyName: "Sysco LABS",
      companyUrl: "https://syscolabs.lk",
      position: "Software Engineering Intern",
      jobPostUrl: "https://syscolabs.lk/careers",
      jobType: "SE Intern",
      workMode: "hybrid",
      appliedVia: "Company Website",
      salaryMin: 40000,
      salaryMax: 55000,
      currency: "LKR",
      location: "Colombo 03",
      status: "IN_PROGRESS",
      appliedDate: daysAgo(24),
      firstResponseDate: daysAgo(17),
      notes: "Sample entry — delete it whenever you like. Referral from a friend.",
      stages: {
        create: [
          { name: "Assessment", order: 1, status: "COMPLETED", scheduledDate: daysAgo(20), completedDate: daysAgo(20), notes: "HackerRank — 2 problems, 90 min" },
          { name: "Technical", order: 2, status: "UPCOMING", scheduledDate: daysFromNow(3), notes: "Zoom — brush up DSA + basic system design" },
          { name: "HR", order: 3, status: "UPCOMING" },
        ],
      },
      contacts: {
        create: [
          { name: "Chamara Perera", role: "Recruiter", email: "chamara@example.lk", linkedinUrl: "https://linkedin.com/in/example", notes: "Reached out on LinkedIn first" },
        ],
      },
      activityLog: {
        create: [
          { type: "created", description: "Application created" },
          { type: "status_change", description: "Status changed from Applied to In Progress", metadata: { from: "APPLIED", to: "IN_PROGRESS" } },
        ],
      },
    },
  });

  // Fresh application — waiting to hear back.
  await prisma.application.create({
    data: {
      profileId,
      companyName: "WSO2",
      companyUrl: "https://wso2.com",
      position: "Flutter Developer Intern",
      jobPostUrl: "https://wso2.com/careers",
      jobType: "Intern",
      workMode: "remote",
      appliedVia: "LinkedIn",
      salaryMin: 50000,
      salaryMax: 70000,
      currency: "LKR",
      location: "Colombo",
      status: "APPLIED",
      appliedDate: daysAgo(6),
      notes: "Sample entry — delete it whenever you like.",
      stages: { create: [{ name: "Online Assessment", order: 1, status: "UPCOMING" }] },
      activityLog: { create: [{ type: "created", description: "Application created" }] },
    },
  });

  // Offer in hand.
  await prisma.application.create({
    data: {
      profileId,
      companyName: "IFS",
      companyUrl: "https://ifs.com",
      position: "Software Engineering Intern",
      jobType: "SE Intern",
      workMode: "on-site",
      appliedVia: "Referral",
      salaryMin: 60000,
      salaryMax: 75000,
      currency: "LKR",
      location: "Colombo 02",
      status: "OFFER",
      appliedDate: daysAgo(40),
      firstResponseDate: daysAgo(33),
      notes: "Sample entry — delete it whenever you like.",
      stages: {
        create: [
          { name: "Phone Screen", order: 1, status: "PASSED", scheduledDate: daysAgo(30), completedDate: daysAgo(30) },
          { name: "Technical", order: 2, status: "PASSED", scheduledDate: daysAgo(20), completedDate: daysAgo(20) },
          { name: "Offer", order: 3, status: "COMPLETED", completedDate: daysAgo(5) },
        ],
      },
      activityLog: { create: [{ type: "created", description: "Application created" }] },
    },
  });

  // Saved for later — not applied yet.
  await prisma.application.create({
    data: {
      profileId,
      companyName: "Dialog Axiata",
      companyUrl: "https://dialog.lk",
      position: "Mobile App Developer Intern",
      jobPostUrl: "https://dialog.lk/careers",
      jobType: "Intern",
      workMode: "on-site",
      appliedVia: "BambooHR",
      currency: "LKR",
      location: "Colombo 02",
      status: "SAVED",
      deadline: daysFromNow(10),
      notes: "Sample saved job — delete it whenever you like. Deadline coming up.",
      activityLog: { create: [{ type: "created", description: "Saved job" }] },
    },
  });

  // Didn't work out.
  await prisma.application.create({
    data: {
      profileId,
      companyName: "Virtusa",
      companyUrl: "https://virtusa.com",
      position: "Associate Software Engineer",
      jobType: "Junior Dev",
      workMode: "hybrid",
      appliedVia: "RoosterJob",
      currency: "LKR",
      location: "Colombo",
      status: "REJECTED",
      appliedDate: daysAgo(35),
      firstResponseDate: daysAgo(28),
      notes: "Sample entry — delete it whenever you like.",
      stages: {
        create: [
          { name: "Phone Screen", order: 1, status: "COMPLETED", completedDate: daysAgo(26) },
          { name: "Technical", order: 2, status: "FAILED", completedDate: daysAgo(18), notes: "Stumbled on the DP question" },
        ],
      },
      activityLog: { create: [{ type: "created", description: "Application created" }] },
    },
  });

  // No response — ghosted.
  await prisma.application.create({
    data: {
      profileId,
      companyName: "Hsenid Mobile",
      companyUrl: "https://hsenidmobile.com",
      position: "Flutter Intern",
      jobType: "SE Intern",
      workMode: "on-site",
      appliedVia: "Direct Mail",
      currency: "LKR",
      location: "Colombo 05",
      status: "GHOSTED",
      appliedDate: daysAgo(30),
      notes: "Sample entry — delete it whenever you like. No reply after applying.",
      activityLog: { create: [{ type: "created", description: "Application created" }] },
    },
  });
}

export const EMAIL_TEMPLATE_SEEDS = [
  {
    name: "SE intern outreach",
    category: "Outreach",
    subject: "Application for {position} at {company}",
    body: "Hi {contact},\n\nI'm {myName}, a final-year software engineering student, and I'd like to apply for the {position} role at {company}.\n\nI work mainly with Flutter and have built and shipped a few mobile apps end to end. I'd love the chance to bring that to your team and learn from real production work.\n\nI've attached my CV. The role posting I'm referring to is here: {jobUrl}\n\nThank you for your time — I'd be glad to share more or hop on a quick call.\n\nBest regards,\n{myName}",
  },
  {
    name: "Follow-up",
    category: "Follow-up",
    subject: "Following up — {position} at {company}",
    body: "Hi {contact},\n\nJust following up on my application for the {position} role at {company} from last week. I'm still very interested and wanted to check whether there's any update on the process.\n\nHappy to share anything else that would help. Thanks again for your time.\n\nBest,\n{myName}",
  },
  {
    name: "Cold / referral intro",
    category: "Cold",
    subject: "Flutter intern interested in {company}",
    body: "Hi {contact},\n\nI'm {myName}, a software engineering undergrad who's been following {company}'s work. I'm looking for an internship where I can contribute as a mobile/Flutter developer, and I'd love to know if your team has anything open.\n\nI've attached my CV in case it's useful. Even a pointer to the right person would mean a lot.\n\nThanks so much,\n{myName}",
  },
];
