import { LoginEntrance } from "@/components/auth/login-entrance";

type Props = {
  searchParams: Promise<{ next?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const nextPath = params.next ?? "/home";

  return <LoginEntrance nextPath={nextPath} />;
}
