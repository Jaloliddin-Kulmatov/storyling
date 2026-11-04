import { accountRoute, HttpError } from "@/server/account-route";
import { billingDb, billingEnabled, stripe } from "@/server/billing";

/** POST → { url } of the Stripe customer portal (change plan, cancel, invoices). */
export const POST = accountRoute(async (user, req) => {
  if (!billingEnabled()) throw new HttpError("Paid plans are not open yet.", 503);
  const sql = await billingDb();
  const [row] = (await sql`SELECT stripe_customer FROM users WHERE id = ${user!.id}`) as { stripe_customer: string | null }[];
  if (!row?.stripe_customer) throw new HttpError("No subscription found.", 404);
  const s = await stripe<{ url: string }>("billing_portal/sessions", { customer: row.stripe_customer, return_url: `${new URL(req.url).origin}/pricing` });
  return { url: s.url };
});
