import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { ThemeModeSelect } from "@/components/theme-mode-select";

export default function OnboardingPage() {
  return (
    <div className="relative flex min-h-dvh flex-col bg-background px-4 py-12 md:py-16">
      <div className="absolute right-4 top-4 z-20 md:right-8 md:top-6">
        <ThemeModeSelect compact />
      </div>
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,color-mix(in_srgb,var(--gold)_10%,transparent)_0%,transparent_45%)]" />
      <div className="relative z-10 mx-auto mb-10 w-full max-w-lg px-2 text-center sm:max-w-xl md:max-w-2xl md:px-6">
        <p className="font-display text-lg text-primary sm:text-xl">BibleByte</p>
        <h1 className="mt-2 font-display text-fluid-page-title font-semibold">
          Let’s personalize your walk
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
          Five gentle questions—so your home experience feels guided, calm, and yours.
        </p>
      </div>
      <OnboardingForm />
    </div>
  );
}
