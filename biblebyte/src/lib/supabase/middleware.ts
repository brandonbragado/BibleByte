import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  const isAuthPage = path === "/login";
  const isCallback = path.startsWith("/auth/callback");
  const isLanding = path === "/";
  const isOnboarding = path.startsWith("/onboarding");
  const isMainApp =
    path.startsWith("/home") ||
    path.startsWith("/bible") ||
    path.startsWith("/journal") ||
    path.startsWith("/profile") ||
    path.startsWith("/settings");

  if (isCallback) {
    return supabaseResponse;
  }

  if (!user) {
    if (isMainApp || isOnboarding) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", path);
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  let onboardingDone = false;
  try {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .maybeSingle();
    onboardingDone = profile?.onboarding_completed === true;
  } catch {
    onboardingDone = false;
  }

  if (!onboardingDone && isMainApp) {
    const url = request.nextUrl.clone();
    url.pathname = "/onboarding";
    return NextResponse.redirect(url);
  }

  if (onboardingDone && isOnboarding) {
    const url = request.nextUrl.clone();
    url.pathname = "/home";
    return NextResponse.redirect(url);
  }

  if ((isLanding || isAuthPage) && user) {
    const url = request.nextUrl.clone();
    url.pathname = onboardingDone ? "/home" : "/onboarding";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
