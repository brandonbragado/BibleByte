import { redirect } from "next/navigation";

import { LandingFlow } from "@/components/marketing/landing-flow";

type Props = {
  searchParams: Promise<{ code?: string; next?: string }>;
};

export default async function LandingPage({ searchParams }: Props) {
  const params = await searchParams;

  if (params.code?.trim()) {
    const callbackParams = new URLSearchParams({ code: params.code });
    if (params.next?.trim()) {
      callbackParams.set("next", params.next);
    }
    redirect(`/auth/callback?${callbackParams.toString()}`);
  }

  return <LandingFlow />;
}
