import { NextResponse } from "next/server";
import { billingDb, verifyStripe } from "@/server/billing";

interface Sub { customer: string; status: string; current_period_end?: number; items?: { data?: { current_period_end?: number }[] } }

/** Stripe webhook: keeps users.pro_until in step with the subscription. */
export async function POST(req: Request) {
  const payload = await req.text();
  if (!verifyStripe(payload, req.headers.get("stripe-signature"))) return NextResponse.json({ error: "Bad signature" }, { status: 400 });
  const event = JSON.parse(payload) as { type: string; data: { object: Record<string, unknown> } };
  const sql = await billingDb();
  const o = event.data.object;
  if (event.type === "checkout.session.completed" && typeof o.client_reference_id === "string" && typeof o.customer === "string") {
    // Pro until the subscription update below sets the exact period end.
    await sql`UPDATE users SET stripe_customer = ${o.customer}, pro_until = now() + interval '35 days' WHERE id = ${o.client_reference_id}::uuid`;
  }
  if (event.type.startsWith("customer.subscription.")) {
    const s = o as unknown as Sub;
    const end = s.current_period_end ?? s.items?.data?.[0]?.current_period_end;
    const active = ["active", "trialing", "past_due"].includes(s.status) && event.type !== "customer.subscription.deleted";
    if (active && end) await sql`UPDATE users SET pro_until = to_timestamp(${end}) WHERE stripe_customer = ${s.customer}`;
    else if (!active) await sql`UPDATE users SET pro_until = now() WHERE stripe_customer = ${s.customer}`;
  }
  return NextResponse.json({ received: true });
}
