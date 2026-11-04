import { accountRoute } from "@/server/account-route";
import { billingEnabled, FREE, isPro } from "@/server/billing";

/** { enabled, pro, limits }: what the client uses to show plans and soft limits. */
export const GET = accountRoute(async (user) => ({
  enabled: billingEnabled(),
  pro: user ? await isPro(user.id) : !billingEnabled(),
  limits: FREE,
  // Which billing periods have a Stripe price set up.
  periods: (["monthly", "halfyear", "yearly"] as const).filter((k) => !!process.env[{ monthly: "STRIPE_PRICE_MONTHLY", halfyear: "STRIPE_PRICE_HALFYEAR", yearly: "STRIPE_PRICE_YEARLY" }[k]]),
}), { auth: false });
