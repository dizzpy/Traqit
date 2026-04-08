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
}
