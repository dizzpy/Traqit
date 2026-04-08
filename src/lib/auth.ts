import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { seedProfile } from "./seed";

export async function getProfile() {
  const cookieStore = await cookies();
  const profileId = cookieStore.get("profile-id")?.value;
  if (!profileId) return null;
  return prisma.profile.findUnique({ where: { id: profileId } });
}

export async function getOrCreateProfile(name: string) {
  const existing = await prisma.profile.findUnique({ where: { name } });
  if (existing) return existing;
  const profile = await prisma.profile.create({ data: { name } });
  await seedProfile(profile.id);
  return profile;
}
