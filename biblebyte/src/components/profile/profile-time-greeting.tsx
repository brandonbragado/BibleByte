"use client";

type Props = {
  firstName: string;
};

/** Local wall-clock greeting so “morning / afternoon / evening” matches the device. */
export function ProfileTimeGreeting({ firstName }: Props) {
  const h = new Date().getHours();
  const bucket = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  return (
    <span className="text-foreground">
      {bucket}, {firstName}
    </span>
  );
}
