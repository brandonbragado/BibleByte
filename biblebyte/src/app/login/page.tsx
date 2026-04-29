import { LandingFlow } from "@/components/marketing/landing-flow";

type Props = {
  searchParams: Promise<{ next?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const nextPath = params.next ?? "/home";

  return <LandingFlow nextPath={nextPath} />;
}
