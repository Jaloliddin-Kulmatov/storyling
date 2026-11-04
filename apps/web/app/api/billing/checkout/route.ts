import { accountRoute, HttpError } from "@/server/account-route";
import { billingDb, billingEnabled, stripe } from "@/server/billing";

/** POST { plan: "monthly" | "yearly" } → { url } of a Stripe Checkout page. */
export const POST = accountRoute(async (user, req) => {
  if (!billingEnabled()) throw new HttpError("Paid plans are not open yet.", 503);
  const { plan } = (await req.json().catch(() => ({}))) as { plan?: string };
  const price = plan === "yearly" ? process.env.STRIPE_PRICE_YEARLY : process.env.STRIPE_PRICE_MONTHLY;
  if (!price) throw new HttpError("This plan is not available.");
  const origin = new URL(req.url).origin;
  const sql = await billingDb();
  const [row] = (await sql`SELECT stripe_customer FROM users WHERE id = ${user!.id}`) as { stripe_customer: string | null }[];
  const session = await stripe<{ url: string }>("checkout/sessions", {
    mode: "subscription",
    "line_items[0][price]": price,
    "line_items[0][quantity]": "1",
    client_reference_id: user!.id,
    ...(row?.stripe_customer ? { customer: row.stripe_customer } : { customer_email: user!.email }),
    allow_promotion_codes: "true",
    success_url: `${origin}/pricing?done=1`,
    cancel_url: `${origin}/pricing`,
  });
  return { url: session.url };
});
