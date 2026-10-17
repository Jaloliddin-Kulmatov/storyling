import { NextResponse } from "next/server";
import { aiEnabled } from "@/server/ai";

export const dynamic = "force-dynamic";

/** Lets the app show or hide AI buttons. */
export function GET() {
  return NextResponse.json({ enabled: aiEnabled() });
}
