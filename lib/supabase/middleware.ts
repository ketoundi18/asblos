import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const STAFF_PUBLIC = ["/connexion"];
const PARENT_PUBLIC = [
  "/espace-parents/connexion",
  "/espace-parents/inscription",
];

/** Routes sans session (webhooks, sonde santé, tunnel Sentry, debug dev). */
const PUBLIC_API_PREFIXES = [
  "/api/webhooks/mollie",
  "/api/health",
  ...(process.env.NODE_ENV === "development" ? ["/api/debug/sentry-test"] : []),
];

const SENTRY_TUNNEL_PREFIX = "/monitoring/sentry-tunnel";

function isSentryTunnelRoute(pathname: string) {
  return (
    pathname === SENTRY_TUNNEL_PREFIX ||
    pathname.startsWith(`${SENTRY_TUNNEL_PREFIX}/`)
  );
}

function isAuthCallback(pathname: string) {
  return pathname.startsWith("/auth/");
}

function isPublicApiRoute(pathname: string) {
  return PUBLIC_API_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function isPublicRoute(pathname: string) {
  return (
    STAFF_PUBLIC.includes(pathname) ||
    PARENT_PUBLIC.includes(pathname) ||
    isAuthCallback(pathname) ||
    isSentryTunnelRoute(pathname) ||
    isPublicApiRoute(pathname)
  );
}

function isParentRoute(pathname: string) {
  return pathname.startsWith("/espace-parents");
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
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

  const pathname = request.nextUrl.pathname;
  const publicRoute = isPublicRoute(pathname);
  const parentRoute = isParentRoute(pathname);

  if (!user && !publicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = parentRoute
      ? "/espace-parents/connexion"
      : "/connexion";
    return NextResponse.redirect(url);
  }

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", user.id)
      .single<{ role: string; is_active: boolean }>();

    if (profile && profile.is_active === false) {
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = parentRoute
        ? "/espace-parents/connexion"
        : "/connexion";
      url.searchParams.set("error", "inactive");
      return NextResponse.redirect(url);
    }

    const role = profile?.role;
    const isParent = role === "PARENT";

    if (isParent) {
      if (
        pathname === "/connexion" ||
        (!parentRoute &&
          !isAuthCallback(pathname) &&
          !isSentryTunnelRoute(pathname))
      ) {
        const url = request.nextUrl.clone();
        url.pathname = "/espace-parents";
        return NextResponse.redirect(url);
      }
      if (PARENT_PUBLIC.includes(pathname)) {
        const url = request.nextUrl.clone();
        url.pathname = "/espace-parents";
        return NextResponse.redirect(url);
      }
    } else if (profile && parentRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }

    if (pathname === "/connexion") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
