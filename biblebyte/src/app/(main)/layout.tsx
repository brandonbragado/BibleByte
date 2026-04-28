import { BottomNav } from "@/components/layout/bottom-nav";

export default function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="relative min-h-dvh bg-background pb-32 pt-8">
        <div className="pointer-events-none fixed inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_at_top,_rgba(79,111,82,0.08)_0%,_transparent_60%)]" />
        <div className="relative z-10 mx-auto max-w-lg px-4 md:max-w-3xl md:px-8">
          {children}
        </div>
      </div>
      <BottomNav />
    </>
  );
}
