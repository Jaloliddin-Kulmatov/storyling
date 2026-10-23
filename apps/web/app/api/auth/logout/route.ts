import { endSession } from "@/server/auth";
import { accountRoute } from "@/server/account-route";

export const POST = accountRoute(async () => {
  await endSession();
  return { ok: true };
}, { auth: false });
