"use client";

import { useEffect, useState } from "react";
import { useAccount } from "@/lib/account";

export type Period = "monthly" | "halfyear" | "yearly";
export interface Plan { enabled: boolean; pro: boolean; limits: { storiesPerDay: number; gradesPerDay: number }; periods: Period[] }
const OPEN: Plan = { enabled: false, pro: true, limits: { storiesPerDay: 3, gradesPerDay: 1 }, periods: ["monthly", "halfyear", "yearly"] };

let cache: { key: string; p: Promise<Plan> } | null = null;

/** The learner's plan. While paid plans are off (no Stripe keys) everyone is treated as Pro. */
export function usePlan(): Plan {
  const a = useAccount();
  const [plan, setPlan] = useState<Plan>(OPEN);
  useEffect(() => {
    if (!a.loaded || !a.enabled) return;
    const key = a.user?.id ?? "guest";
    if (cache?.key !== key) cache = { key, p: fetch("/api/billing/status").then((r) => r.json() as Promise<Plan>).catch(() => OPEN) };
    let alive = true;
    cache.p.then((p) => alive && setPlan({ ...OPEN, ...p }));
    return () => { alive = false; };
  }, [a.loaded, a.enabled, a.user?.id]);
  return plan;
}
