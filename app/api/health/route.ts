import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { ok: true, service: "asblos", ts: Date.now() },
    { status: 200 }
  );
}
