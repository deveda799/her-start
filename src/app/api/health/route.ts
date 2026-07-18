import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    provider: process.env.DATA_PROVIDER ?? "supabase",
    environment: process.env.NODE_ENV ?? "development",
  });
}
