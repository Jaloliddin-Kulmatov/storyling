import { NextResponse } from "next/server";
import { mailEnabled } from "@/server/mail";

/** Which sign-in extras are configured: Google (client id is public) and password reset by email. */
export function GET() {
  return NextResponse.json({ google: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || null, reset: mailEnabled() });
}
