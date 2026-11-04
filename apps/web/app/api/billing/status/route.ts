import { accountRoute } from "@/server/account-route";
import { billingEnabled, FREE, isPro } from "@/server/billing";

/** { enabled, pro, limits }: what the client uses to show plans and soft limits. */
export const GET = accountRoute(async (user) => ({
  enabled: billingEnabled(),
  pro: user ? await isPro(user.id) : !billingEnabled(),
  limits: FREE,
}), { auth: false });
