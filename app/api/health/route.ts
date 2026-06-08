import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const payload: {
    ok: boolean;
    service: string;
    ts: number;
    supabase?: "ok" | "error";
  } = {
    ok: true,
    service: "asblos",
    ts: Date.now(),
  };

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("profiles").select("id").limit(1);
    payload.supabase = error ? "error" : "ok";
    if (error) {
      payload.ok = false;
    }
  } catch {
    payload.supabase = "error";
    payload.ok = false;
  }

  return NextResponse.json(payload, { status: payload.ok ? 200 : 503 });
}
