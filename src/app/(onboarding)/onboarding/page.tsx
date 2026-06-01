import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getProfile } from "@/lib/auth";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";

export const metadata = { title: "Welcome to Traqit" };

/**
 * Guided first-run setup. Gated server-side: signed-out users go to /login,
 * already-onboarded users skip straight to the dashboard. Templates are
 * pre-seeded per profile, so we just hand them to the client flow for step 3.
 */
export default async function OnboardingPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.onboardedAt) redirect("/applications");

  const templates = await prisma.pipelineTemplate.findMany({
    where: { profileId: profile.id },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    select: { id: true, name: true, stages: true },
  });

  return (
    <OnboardingFlow
      initialName={profile.name}
      initialEmailName={profile.emailName}
      initialTemplateId={profile.defaultPipelineTemplateId}
      templates={templates.map((t) => ({
        id: t.id,
        name: t.name,
        stages: (t.stages as string[]) ?? [],
      }))}
    />
  );
}
