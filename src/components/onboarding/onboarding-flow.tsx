"use client";

import { useState } from "react";
import { ArrowRight, ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { updateProfile } from "@/hooks/use-profile";
import { createApplication } from "@/hooks/use-applications";
import { useSources } from "@/hooks/use-presets";
import { appPath } from "@/lib/urls";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/common/logo";

interface TemplateOption {
  id: string;
  name: string;
  stages: string[];
}

interface OnboardingFlowProps {
  initialName: string;
  initialEmailName: string | null;
  initialTemplateId: string | null;
  templates: TemplateOption[];
}

const STEPS = [
  { n: 1, label: "Welcome" },
  { n: 2, label: "Your details" },
  { n: 3, label: "Pick a template" },
  { n: 4, label: "First job" },
  { n: 5, label: "Done" },
] as const;

type StepState = "completed" | "current" | "upcoming";

export function OnboardingFlow({
  initialName,
  initialEmailName,
  initialTemplateId,
  templates,
}: OnboardingFlowProps) {
  // Resume at the first incomplete step on refresh (derived from saved fields).
  const initialStep = initialEmailName ? (initialTemplateId ? 4 : 3) : 1;
  const [step, setStep] = useState(initialStep);

  const [name, setName] = useState(initialName ?? "");
  const [emailName, setEmailName] = useState(initialEmailName ?? initialName ?? "");
  const [templateId, setTemplateId] = useState<string | null>(initialTemplateId);

  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [appliedVia, setAppliedVia] = useState("");

  const [saving, setSaving] = useState(false);
  const { sources } = useSources();

  function go(next: number) {
    setStep(next);
  }

  function stateFor(n: number): StepState {
    if (step === 5) return "completed";
    if (n < step) return "completed";
    if (n === step) return "current";
    return "upcoming";
  }

  // ── Step actions ──────────────────────────────────────────────────────────

  async function saveDetails() {
    if (!name.trim()) {
      toast.error("A display name is required.");
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ name: name.trim(), emailName: emailName.trim() || null });
      go(3);
    } catch {
      toast.error("Couldn't save your details. Try again.");
    } finally {
      setSaving(false);
    }
  }

  async function saveTemplate() {
    setSaving(true);
    try {
      await updateProfile({ defaultPipelineTemplateId: templateId });
      go(4);
    } catch {
      toast.error("Couldn't save your pick. Try again.");
    } finally {
      setSaving(false);
    }
  }

  async function addFirstJob() {
    if (!company.trim()) {
      toast.error("Add a company name, or skip this step.");
      return;
    }
    setSaving(true);
    try {
      await createApplication({
        companyName: company.trim(),
        position: position.trim(),
        appliedVia,
        status: "APPLIED",
        appliedDate: new Date().toISOString(),
        ...(templateId ? { templateId } : {}),
      });
      go(5);
    } catch {
      toast.error("Couldn't add the application. Try again.");
    } finally {
      setSaving(false);
    }
  }

  async function finish() {
    setSaving(true);
    try {
      await updateProfile({ onboardedAt: new Date().toISOString() });
      // Full navigation so the gated (main) layout re-reads the fresh profile.
      window.location.assign(appPath("/applications"));
    } catch {
      toast.error("Couldn't finish setup. Try again.");
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* ── Left: step tracker (desktop) ─────────────────────────────────── */}
      <aside className="hidden md:flex w-70 shrink-0 flex-col border-r border-border px-7 py-8">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent">
            <Logo size={15} className="text-white" />
          </div>
          <span className="text-sm font-semibold text-text-primary" style={{ fontFamily: "var(--font-family-display)" }}>
            Traqit
          </span>
        </div>

        <nav className="mt-10 flex flex-col">
          {STEPS.map((s, i) => {
            const state = stateFor(s.n);
            const clickable = s.n < step && step !== 5;
            return (
              <button
                key={s.n}
                type="button"
                disabled={!clickable}
                onClick={() => clickable && go(s.n)}
                className={cn(
                  "flex items-start gap-3 text-left",
                  clickable ? "cursor-pointer" : "cursor-default"
                )}
              >
                <span className="flex flex-col items-center">
                  <StepDot state={state} />
                  {i < STEPS.length - 1 && <span className="my-1 h-7 w-[1.5px] bg-border" />}
                </span>
                <span
                  className={cn(
                    "pt-1 text-[13px] font-medium transition-colors duration-150",
                    state === "completed" && "text-text-secondary",
                    state === "current" && "text-text-primary",
                    state === "upcoming" && "text-text-muted"
                  )}
                >
                  {s.label}
                </span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ── Right: active step content ───────────────────────────────────── */}
      <main className="relative flex flex-1 flex-col items-center justify-center px-6 py-12">
        {/* Mobile step dots */}
        <div className="absolute top-6 left-1/2 flex -translate-x-1/2 items-center gap-2 md:hidden">
          {STEPS.map((s) => {
            const state = stateFor(s.n);
            return (
              <span
                key={s.n}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-150",
                  state === "current" ? "w-5 bg-accent" : "w-1.5",
                  state === "completed" && "bg-accent",
                  state === "upcoming" && "bg-border"
                )}
              />
            );
          })}
        </div>

        <style>{`
          @keyframes traqit-step-rise {
            from { opacity: 0; transform: translateY(8px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>

        <div
          key={step}
          className="w-full max-w-[480px]"
          style={{ animation: "traqit-step-rise 400ms cubic-bezier(0.22, 1, 0.36, 1) both" }}
        >
          {step > 1 && step < 5 && (
            <button
              type="button"
              onClick={() => go(step - 1)}
              className="group mb-6 inline-flex items-center gap-1.5 text-xs font-medium text-text-muted transition-colors duration-150 hover:text-text-secondary"
            >
              <ArrowLeft className="size-3.5 transition-transform duration-150 group-hover:-translate-x-[2px]" />
              Back
            </button>
          )}

          {step === 1 && <WelcomeStep onContinue={() => go(2)} />}

          {step === 2 && (
            <DetailsStep
              name={name}
              emailName={emailName}
              onName={setName}
              onEmailName={setEmailName}
              saving={saving}
              onContinue={saveDetails}
            />
          )}

          {step === 3 && (
            <TemplateStep
              templates={templates}
              selected={templateId}
              onSelect={setTemplateId}
              saving={saving}
              onContinue={saveTemplate}
              onSkip={() => go(4)}
            />
          )}

          {step === 4 && (
            <FirstJobStep
              company={company}
              position={position}
              appliedVia={appliedVia}
              sources={sources}
              onCompany={setCompany}
              onPosition={setPosition}
              onAppliedVia={setAppliedVia}
              saving={saving}
              onAdd={addFirstJob}
              onSkip={() => go(5)}
            />
          )}

          {step === 5 && <DoneStep saving={saving} onFinish={finish} />}
        </div>
      </main>
    </div>
  );
}

function StepDot({ state }: { state: StepState }) {
  if (state === "completed") {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent">
        <Check className="size-3 text-white" strokeWidth={2.5} />
      </span>
    );
  }
  if (state === "current") {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-accent">
        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
      </span>
    );
  }
  return <span className="h-5 w-5 rounded-full border border-border" />;
}

// ── Step content blocks ──────────────────────────────────────────────────────

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="text-[28px] leading-tight font-semibold text-text-primary" style={{ fontFamily: "var(--font-family-display)" }}>
      {children}
    </h1>
  );
}

function Sub({ children }: { children: React.ReactNode }) {
  return <p className="mt-2 text-sm leading-relaxed text-text-secondary">{children}</p>;
}

function ContinueButton({
  label = "Continue",
  onClick,
  disabled,
}: {
  label?: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button className="h-11" onClick={onClick} disabled={disabled}>
      {label}
      <ArrowRight className="size-4 transition-transform duration-150 group-hover:translate-x-[3px]" />
    </Button>
  );
}

function SkipLink({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group inline-flex items-center gap-1 text-[13px] font-medium text-text-muted transition-colors duration-150 hover:text-text-secondary disabled:opacity-50"
    >
      Skip for now
      <ArrowRight className="size-3.5 transition-transform duration-150 group-hover:translate-x-[2px]" />
    </button>
  );
}

function WelcomeStep({ onContinue }: { onContinue: () => void }) {
  return (
    <div>
      <Heading>Welcome to Traqit 👋</Heading>
      <Sub>
        Let&apos;s set up your job hunt in under a minute. Track applications, build custom
        interview pipelines, and never lose a posting again.
      </Sub>
      <div className="mt-8">
        <ContinueButton label="Let's get started" onClick={onContinue} />
      </div>
    </div>
  );
}

function DetailsStep({
  name,
  emailName,
  onName,
  onEmailName,
  saving,
  onContinue,
}: {
  name: string;
  emailName: string;
  onName: (v: string) => void;
  onEmailName: (v: string) => void;
  saving: boolean;
  onContinue: () => void;
}) {
  return (
    <div>
      <Heading>Tell us about you</Heading>
      <Sub>This personalises your workspace and email templates.</Sub>
      <div className="mt-7 flex flex-col gap-4">
        <Input
          label="Display name"
          value={name}
          onChange={(e) => onName(e.target.value)}
          placeholder="Your name"
          autoFocus
        />
        <Input
          label="Your full name (used in email templates)"
          value={emailName}
          onChange={(e) => onEmailName(e.target.value)}
          placeholder="e.g. Anuja Rathnayaka"
        />
      </div>
      <div className="mt-8">
        <ContinueButton onClick={onContinue} disabled={saving || !name.trim()} />
      </div>
    </div>
  );
}

function TemplateStep({
  templates,
  selected,
  onSelect,
  saving,
  onContinue,
  onSkip,
}: {
  templates: TemplateOption[];
  selected: string | null;
  onSelect: (id: string) => void;
  saving: boolean;
  onContinue: () => void;
  onSkip: () => void;
}) {
  return (
    <div>
      <Heading>How do your interviews usually go?</Heading>
      <Sub>Pick a starting pipeline. You can customise every job later.</Sub>

      <div className="mt-6 flex flex-col gap-2.5">
        {templates.map((t) => {
          const active = selected === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelect(t.id)}
              aria-pressed={active}
              className={cn(
                "w-full rounded-card border p-3.5 text-left transition-colors duration-150",
                active
                  ? "border-accent bg-accent-soft"
                  : "border-border bg-surface hover:border-border-hover hover:bg-surface-hover"
              )}
            >
              <span className="text-sm font-medium text-text-primary">{t.name}</span>
              <span className="mt-2 flex flex-wrap gap-1.5">
                {t.stages.map((stage, i) => (
                  <span
                    key={`${stage}-${i}`}
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-medium",
                      active ? "bg-surface text-text-secondary" : "bg-surface-elevated text-text-muted"
                    )}
                  >
                    {stage}
                  </span>
                ))}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex items-center gap-5">
        <ContinueButton onClick={onContinue} disabled={saving || !selected} />
        <SkipLink onClick={onSkip} disabled={saving} />
      </div>
    </div>
  );
}

function FirstJobStep({
  company,
  position,
  appliedVia,
  sources,
  onCompany,
  onPosition,
  onAppliedVia,
  saving,
  onAdd,
  onSkip,
}: {
  company: string;
  position: string;
  appliedVia: string;
  sources: string[];
  onCompany: (v: string) => void;
  onPosition: (v: string) => void;
  onAppliedVia: (v: string) => void;
  saving: boolean;
  onAdd: () => void;
  onSkip: () => void;
}) {
  return (
    <div>
      <Heading>Add your first application</Heading>
      <Sub>Or skip — you can add jobs anytime from the dashboard.</Sub>

      <div className="mt-7 flex flex-col gap-4">
        <Input
          label="Company"
          value={company}
          onChange={(e) => onCompany(e.target.value)}
          placeholder="e.g. Sysco LABS"
          autoFocus
        />
        <Input
          label="Position"
          value={position}
          onChange={(e) => onPosition(e.target.value)}
          placeholder="e.g. Software Engineering Intern"
        />
        <Select
          label="Applied via"
          value={appliedVia}
          onChange={(e) => onAppliedVia(e.target.value)}
          options={[{ value: "", label: "Not sure yet" }, ...sources.map((s) => ({ value: s, label: s }))]}
        />
      </div>

      <div className="mt-8 flex items-center gap-5">
        <ContinueButton label="Add it" onClick={onAdd} disabled={saving || !company.trim()} />
        <SkipLink onClick={onSkip} disabled={saving} />
      </div>
    </div>
  );
}

function DoneStep({ saving, onFinish }: { saving: boolean; onFinish: () => void }) {
  return (
    <div>
      <Heading>You&apos;re all set 🎉</Heading>
      <Sub>Your workspace is ready. Let&apos;s go.</Sub>
      <div className="mt-8">
        <ContinueButton label="Go to dashboard" onClick={onFinish} disabled={saving} />
      </div>
    </div>
  );
}
