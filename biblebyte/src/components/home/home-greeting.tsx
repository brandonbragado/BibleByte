"use client";

function greetingForHour(h: number): string {
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

type Props = { firstName: string };

/**
 * Client-only time-of-day greeting so streamed HTML is not tied to the server's clock
 * at render time. suppressHydrationWarning tolerates rare server/client hour differences.
 */
export function HomeGreeting({ firstName }: Props) {
  const label = greetingForHour(new Date().getHours());

  return (
    <h1
      className="font-display text-4xl font-semibold tracking-tight"
      suppressHydrationWarning
    >
      {label}, {firstName}
    </h1>
  );
}
