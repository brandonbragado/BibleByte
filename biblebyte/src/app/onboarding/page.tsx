import { OnboardingForm } from "@/components/onboarding/onboarding-form";

export default function OnboardingPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background px-4 py-12 md:py-16">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(201,168,78,0.07)_0%,_transparent_45%)]" />
      <div className="relative z-10 mx-auto mb-10 max-w-lg text-center">
        <p className="font-display text-lg text-primary">BibleByte</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
          Let’s personalize your walk
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Five gentle questions—so your home experience feels guided, calm, and yours.
        </p>
      </div>
      <OnboardingForm />
    </div>
  );
}
