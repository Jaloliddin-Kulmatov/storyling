import { NextResponse } from "next/server";
import { currentUser } from "@/server/auth";
import { dbEnabled } from "@/server/db";
import { isAdminEmail } from "@/server/stories";

export async function GET() {
  if (!dbEnabled()) return NextResponse.json({ enabled: false, user: null });
  try {
    const user = await currentUser();
    return NextResponse.json({ enabled: true, user: user && { ...user, admin: isAdminEmail(user.email) } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ enabled: false, user: null });
  }
}
