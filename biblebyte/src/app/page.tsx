import { LandingHero } from "@/components/marketing/landing-hero";

export default function LandingPage() {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(79,111,82,0.12)_0%,_transparent_55%),radial-gradient(ellipse_at_bottom,_rgba(201,168,78,0.08)_0%,_transparent_50%)]" />
      <LandingHero />
    </div>
  );
}
