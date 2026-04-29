import { BottomNav } from "@/components/layout/bottom-nav";
import { MainTabContentTransition } from "@/components/layout/main-tab-content-transition";
import { appShellContentClass } from "@/lib/ui/app-shell";

export default function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="relative min-h-dvh bg-background pb-28 pt-6 sm:pb-32 sm:pt-8 lg:pb-36 lg:pt-10">
        <div className="pointer-events-none fixed inset-x-0 top-0 h-32 bg-[radial-gradient(ellipse_at_top,color-mix(in_srgb,var(--primary)_12%,transparent)_0%,transparent_60%)] sm:h-40 lg:h-48" />
        <div className={appShellContentClass}>
          <MainTabContentTransition>{children}</MainTabContentTransition>
        </div>
      </div>
      <BottomNav />
    </>
  );
}
