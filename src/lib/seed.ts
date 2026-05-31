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
