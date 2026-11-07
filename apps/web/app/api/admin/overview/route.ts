import { audio, languages, stories } from "@storyling/content";
import { accountRoute } from "@/server/account-route";
import { requireAdmin } from "@/server/admin";
import { aiEnabled } from "@/server/ai";
import { billingDb, billingEnabled } from "@/server/billing";
import { mailEnabled } from "@/server/mail";

/** Numbers for the admin panel. Service checks say only whether a key is set, never what it is. */
export const GET = accountRoute(async (user) => {
  requireAdmin(user);
  const sql = await billingDb();
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS remind boolean NOT NULL DEFAULT false`;
  const [[u], [a], signups, active, usage, queue, views] = (await Promise.all([
    sql`SELECT COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE created_at > now() - interval '7 days')::int AS new7,
      COUNT(*) FILTER (WHERE created_at > now() - interval '30 days')::int AS new30,
      COUNT(*) FILTER (WHERE pro_until > now())::int AS pro,
      COUNT(*) FILTER (WHERE remind)::int AS remind FROM users`,
    sql`SELECT COUNT(DISTINCT user_id) FILTER (WHERE day = current_date)::int AS today,
      COUNT(DISTINCT user_id) FILTER (WHERE day > current_date - 7)::int AS week,
      COUNT(DISTINCT user_id) FILTER (WHERE day > current_date - 30)::int AS month FROM points`,
    sql`SELECT to_char(created_at, 'YYYY-MM-DD') AS day, COUNT(*)::int AS n FROM users WHERE created_at > now() - interval '30 days' GROUP BY 1`,
    sql`SELECT to_char(day, 'YYYY-MM-DD') AS day, COUNT(DISTINCT user_id)::int AS n FROM points WHERE day > current_date - 30 GROUP BY 1`,
    sql`SELECT kind, SUM(n)::int AS n FROM usage WHERE day > current_date - 30 GROUP BY kind ORDER BY 2 DESC`,
    sql`SELECT lang, status, COUNT(*)::int AS n FROM daily_stories GROUP BY lang, status`,
    sql`SELECT story_id, views FROM story_views ORDER BY views DESC`,
  ])) as unknown as [
    [Record<string, number>], [Record<string, number>], { day: string; n: number }[], { day: string; n: number }[],
    { kind: string; n: number }[], { lang: string; status: string; n: number }[], { story_id: string; views: number }[],
  ];
  const titles = new Map(stories.map((s) => [s.id, s.titleEnglish || s.title]));
  const count = (lang: string, status: string) => queue.find((q) => q.lang === lang && q.status === status)?.n ?? 0;
  const days = Array.from({ length: 30 }, (_, i) => new Date(Date.now() - (29 - i) * 864e5).toISOString().slice(0, 10));
  const series = (rows: { day: string; n: number }[]) => days.map((day) => ({ day, n: rows.find((r) => r.day === day)?.n ?? 0 }));
  return {
    users: u,
    active: a,
    signups: series(signups),
    activeDays: series(active),
    usage,
    topStories: views.slice(0, 10).map((v) => ({ id: v.story_id, title: titles.get(v.story_id) ?? v.story_id, views: v.views })),
    languages: languages.map((l) => {
      const own = stories.filter((s) => s.lang === l.code);
      return {
        code: l.code, name: l.name, stories: own.length,
        noAudio: own.filter((s) => !audio.stories[s.id]).length,
        published: count(l.code, "published"), waiting: count(l.code, "pending"),
        views: views.filter((v) => v.story_id.startsWith(`${l.code}-`)).reduce((n, v) => n + v.views, 0),
      };
    }),
    services: [
      { name: "Database", on: true },
      { name: "AI writing", on: aiEnabled() },
      { name: "Email", on: mailEnabled() },
      { name: "Payments (Stripe)", on: billingEnabled() },
      { name: "Photo search (Pexels)", on: !!process.env.PEXELS_API_KEY },
      { name: "Cron password", on: !!process.env.CRON_SECRET },
    ],
    billing: billingEnabled(),
  };
});
