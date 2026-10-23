import { NextResponse } from "next/server";
import { currentUser } from "@/server/auth";
import { dbEnabled } from "@/server/db";

export async function GET() {
  if (!dbEnabled()) return NextResponse.json({ enabled: false, user: null });
  try {
    return NextResponse.json({ enabled: true, user: await currentUser() });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ enabled: false, user: null });
  }
}
