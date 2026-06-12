import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { sanitizeRedirectPath } from "@/lib/auth/safe-redirect";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = sanitizeRedirectPath(searchParams.get("next"), "/");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  const channel = searchParams.get("next")?.includes("channel=parent")
    ? "parent"
    : "staff";
  const fallback =
    channel === "parent"
      ? "/espace-parents/mot-de-passe-oublie?error=lien-expire"
      : "/connexion/mot-de-passe-oublie?error=lien-expire";
  redirect(fallback);
}
