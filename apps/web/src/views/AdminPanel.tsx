"use client";

import { languages, stories as catalog } from "@storyling/content";
import type { LangCode } from "@storyling/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthForm } from "@/components/AuthForm";
import { useAccount } from "@/lib/account";
import { AdminStories } from "@/views/AdminStories";

type Tab = "overview" | "users" | "stories" | "content" | "site";
const TABS: [Tab, string][] = [["overview", "Overview"], ["users", "Users"], ["stories", "Review stories"], ["content", "All stories"], ["site", "Site controls"]];

interface Day { day: string; n: number }
interface Overview {
  users: { total: number; new7: number; new30: number; pro: number; remind: number };
  active: { today: number; week: number; month: number };
  signups: Day[];
  activeDays: Day[];
  usage: { kind: string; n: number }[];
  topStories: { id: string; title: string; views: number }[];
  languages: { code: string; name: string; stories: number; noAudio: number; published: number; waiting: number; views: number }[];
  services: { name: string; on: boolean }[];
  billing: boolean;
}
interface User { id: string; email: string; name: string; created_at: string; pro_until: string | null; points: number; last_active: string | null; admin: boolean }
interface Settings { announcement: string; hiddenLangs: string[]; hiddenStories: string[]; dailyOff: boolean }

async function api<T>(url: string, method = "GET", body?: unknown): Promise<T> {
  const res = await fetch(url, { method, ...(body ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}) });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
  return data;
}

const shortDate = (d: string | null) => (d ? new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "Never");

export function AdminPanel({ lang }: { lang: LangCode }) {
  const account = useAccount();
  const [tab, setTab] = useState<Tab>("overview");

  if (!account.loaded) return <p className="muted">Loading…</p>;
  if (!account.user)
    return (
      <div className="card" style={{ maxWidth: 420, margin: "40px auto" }}>
        <h2 style={{ marginTop: 0 }}>Sign in to the admin panel</h2>
        <AuthForm start="login" />
      </div>
    );
  if (!account.user.admin) return <div className="empty" style={{ marginTop: 40 }}><p className="muted" style={{ margin: 0 }}>This page is for admins.</p></div>;

  return (
    <>
      <div className="page-head"><div><div className="eyebrow">Admin</div><h1>Admin panel</h1></div></div>
      <div className="tabs" role="tablist">
        {TABS.map(([t, label]) => <button key={t} role="tab" aria-selected={tab === t} aria-pressed={tab === t} onClick={() => setTab(t)}>{label}</button>)}
      </div>
      {tab === "overview" && <OverviewTab />}
      {tab === "users" && <UsersTab />}
      {tab === "stories" && <AdminStories lang={lang} />}
      {tab === "content" && <ContentTab lang={lang} />}
      {tab === "site" && <SiteTab />}
    </>
  );
}

function Stat({ label, value, note }: { label: string; value: number; note?: string }) {
  return <div className="card ap-stat"><span className="muted small">{label}</span><b>{value.toLocaleString()}</b>{note && <span className="muted small">{note}</span>}</div>;
}

/** Thirty days as thin bars; hover or tap a bar for its day. */
function Bars({ title, days }: { title: string; days: Day[] }) {
  const max = Math.max(1, ...days.map((d) => d.n));
  const total = days.reduce((n, d) => n + d.n, 0);
  const [hover, setHover] = useState<Day | null>(null);
  return (
    <section className="card ap-chart">
      <div className="spread"><h3>{title}</h3><span className="muted small">{hover ? `${shortDate(hover.day)}: ${hover.n}` : `Last 30 days · peak ${max}`}</span></div>
      <div className="ap-bars" role="img" aria-label={`${title}: ${total} over 30 days`} onMouseLeave={() => setHover(null)}>
        {days.map((d) => (
          <button key={d.day} aria-label={`${shortDate(d.day)}: ${d.n}`} onMouseEnter={() => setHover(d)} onFocus={() => setHover(d)} onClick={() => setHover(d)}>
            <i style={{ height: `${d.n ? Math.max(4, (d.n / max) * 100) : 0}%` }} />
          </button>
        ))}
      </div>
    </section>
  );
}

function OverviewTab() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => void api<Overview>("/api/admin/overview").then(setData, (e: Error) => setError(e.message)), []);
  if (error) return <p className="adm-warn" role="alert">{error}</p>;
  if (!data) return <p className="muted">Loading…</p>;
  const { users: u, active: a } = data;
  const missing = data.services.filter((s) => !s.on);
  return (
    <>
      <div className="ap-stats">
        <Stat label="Accounts" value={u.total} note={`${u.new7} new this week`} />
        <Stat label="Active today" value={a.today} />
        <Stat label="Active this week" value={a.week} note={`${a.month} this month`} />
        <Stat label="Pro accounts" value={u.pro} note={data.billing ? undefined : "Payments are off"} />
        <Stat label="Waiting for review" value={data.languages.reduce((n, l) => n + l.waiting, 0)} />
        <Stat label="Reminder emails on" value={u.remind} />
      </div>
      <p className="muted small">Accounts and activity count signed-in people only. Visitors without an account aren't counted here.</p>
      <div className="ap-two">
        <Bars title="New accounts per day" days={data.signups} />
        <Bars title="Active people per day" days={data.activeDays} />
      </div>
      <section className="card ap-block">
        <h3>Languages</h3>
        <div className="ap-scroll">
          <table className="ap-table">
            <thead><tr><th>Language</th><th>Built-in stories</th><th>Published daily</th><th>Waiting</th><th>Reads</th><th>Without audio</th></tr></thead>
            <tbody>{data.languages.map((l) => <tr key={l.code}><td>{l.name}</td><td>{l.stories}</td><td>{l.published}</td><td>{l.waiting}</td><td>{l.views.toLocaleString()}</td><td>{l.noAudio}</td></tr>)}</tbody>
          </table>
        </div>
      </section>
      <div className="ap-two">
        <section className="card ap-block">
          <h3>Most read stories</h3>
          {data.topStories.length ? <ol className="ap-list">{data.topStories.map((s) => <li key={s.id}><span>{s.title}</span><b>{s.views.toLocaleString()}</b></li>)}</ol> : <p className="muted small">No reads yet.</p>}
        </section>
        <section className="card ap-block">
          <h3>Services</h3>
          <ul className="ap-list">{data.services.map((s) => <li key={s.name}><span>{s.name}</span><b className={s.on ? "ap-on" : "ap-off"}>{s.on ? "✓ On" : "○ Off"}</b></li>)}</ul>
          {missing.length > 0 && <p className="muted small">Turn these on by adding their keys in Vercel.</p>}
          {data.usage.length > 0 && <><h3 style={{ marginTop: 16 }}>Limited features, last 30 days</h3><ul className="ap-list">{data.usage.map((x) => <li key={x.kind}><span>{x.kind}</span><b>{x.n.toLocaleString()}</b></li>)}</ul></>}
        </section>
      </div>
    </>
  );
}

function UsersTab() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<User[] | null>(null);
  const [more, setMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback((offset = 0) => {
    api<{ users: User[]; more: boolean }>(`/api/admin/users?q=${encodeURIComponent(q)}&offset=${offset}`).then(
      (r) => { setRows((old) => (offset ? [...(old ?? []), ...r.users] : r.users)); setMore(r.more); },
      (e: Error) => setError(e.message),
    );
  }, [q]);
  useEffect(() => {
    const t = setTimeout(() => load(), 250);
    return () => clearTimeout(t);
  }, [load]);

  async function pro(u: User, days: number) {
    setError(null);
    try {
      const r = await api<{ pro_until: string | null }>("/api/admin/users", "PATCH", { id: u.id, days });
      setRows((old) => old?.map((x) => (x.id === u.id ? { ...x, pro_until: r.pro_until } : x)) ?? null);
    } catch (e) { setError((e as Error).message); }
  }
  async function remove(u: User) {
    if (!window.confirm(`Delete ${u.email}? Their progress, points and saved words go too. This can't be undone.`)) return;
    setError(null);
    try {
      await api("/api/admin/users", "DELETE", { id: u.id });
      setRows((old) => old?.filter((x) => x.id !== u.id) ?? null);
    } catch (e) { setError((e as Error).message); }
  }

  return (
    <>
      <input className="input ap-search" type="search" placeholder="Search by name or email" aria-label="Search accounts" value={q} onChange={(e) => setQ(e.target.value)} />
      {error && <p className="adm-warn" role="alert">{error}</p>}
      {!rows ? <p className="muted">Loading…</p> : rows.length === 0 ? <div className="empty"><p className="muted" style={{ margin: 0 }}>No accounts found.</p></div> : (
        <div className="card ap-scroll">
          <table className="ap-table">
            <thead><tr><th>Person</th><th>Joined</th><th>Last active</th><th>Points</th><th>Pro until</th><th>Actions</th></tr></thead>
            <tbody>
              {rows.map((u) => {
                const isPro = !!u.pro_until && new Date(u.pro_until).getTime() > Date.now();
                return (
                  <tr key={u.id}>
                    <td><b>{u.name}</b>{u.admin && <span className="pill" style={{ marginLeft: 6 }}>Admin</span>}<br /><span className="muted small">{u.email}</span></td>
                    <td>{shortDate(u.created_at)}</td>
                    <td>{shortDate(u.last_active)}</td>
                    <td>{u.points.toLocaleString()}</td>
                    <td>{isPro ? shortDate(u.pro_until) : "Free"}</td>
                    <td><div className="row ap-acts">
                      <button className="btn sm" onClick={() => void pro(u, 30)}>Give 30 days Pro</button>
                      {isPro && <button className="btn ghost sm" onClick={() => void pro(u, 0)}>Remove Pro</button>}
                      {!u.admin && <button className="btn ghost sm ap-danger" onClick={() => void remove(u)}>Delete</button>}
                    </div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {more && <button className="btn sm" style={{ marginTop: 12 }} onClick={() => load(rows?.length ?? 0)}>Show more</button>}
    </>
  );
}

function useSettingsApi() {
  const [s, setS] = useState<Settings | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => void api<Settings>("/api/admin/settings").then(setS, (e: Error) => setError(e.message)), []);
  const save = useCallback(async (patch: Partial<Settings>) => {
    setError(null);
    try { setS(await api<Settings>("/api/admin/settings", "PUT", patch)); return true; }
    catch (e) { setError((e as Error).message); return false; }
  }, []);
  return { s, error, setError, save };
}

function ContentTab({ lang: start }: { lang: LangCode }) {
  const { s, error, save } = useSettingsApi();
  const [lang, setLang] = useState<LangCode>(start);
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return catalog.filter((x) => x.lang === lang && (!needle || `${x.title} ${x.titleEnglish}`.toLowerCase().includes(needle)));
  }, [lang, q]);
  if (!s) return error ? <p className="adm-warn" role="alert">{error}</p> : <p className="muted">Loading…</p>;
  const toggle = (id: string) => void save({ hiddenStories: s.hiddenStories.includes(id) ? s.hiddenStories.filter((x) => x !== id) : [...s.hiddenStories, id] });
  return (
    <>
      <p className="muted">Hide a built-in story to take it out of every list. To change daily stories, use Review stories.</p>
      <div className="row adm-bar">
        <select className="input adm-sel" aria-label="Language" value={lang} onChange={(e) => setLang(e.target.value as LangCode)}>{languages.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}</select>
        <input className="input ap-search" style={{ margin: 0 }} type="search" placeholder="Search titles" aria-label="Search titles" value={q} onChange={(e) => setQ(e.target.value)} />
        <span className="muted small">{list.length} stories</span>
      </div>
      {error && <p className="adm-warn" role="alert">{error}</p>}
      <div className="card ap-scroll">
        <table className="ap-table">
          <thead><tr><th>Story</th><th>Level</th><th>Topic</th><th>Shown</th></tr></thead>
          <tbody>
            {list.map((x) => {
              const hidden = s.hiddenStories.includes(x.id);
              return (
                <tr key={x.id} className={hidden ? "ap-hidden" : undefined}>
                  <td><b>{x.titleEnglish || x.title}</b>{x.titleEnglish && <><br /><span className="muted small" lang={x.lang}>{x.title}</span></>}</td>
                  <td>{x.level}</td>
                  <td>{x.topic}</td>
                  <td><button className="btn ghost sm" onClick={() => toggle(x.id)}>{hidden ? "Show" : "Hide"}</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function SiteTab() {
  const { s, error, setError, save } = useSettingsApi();
  const [note, setNote] = useState<string | null>(null);
  const [saved, setSaved] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState("");
  const text = note ?? s?.announcement ?? "";
  if (!s) return error ? <p className="adm-warn" role="alert">{error}</p> : <p className="muted">Loading…</p>;

  async function publish(value: string) {
    if (await save({ announcement: value })) { setNote(value); setSaved(value ? "Announcement is live." : "Announcement removed."); }
  }
  async function run() {
    setRunning(true); setResult(""); setError(null);
    try {
      const r = await api<{ written: string[]; errors: string[] }>("/api/admin/settings", "POST");
      setResult(r.written.length ? `Wrote ${r.written.length} stories. Find them in Review stories.` : r.errors.length ? `Nothing written: ${r.errors[0]}` : "Today's stories are already written.");
    } catch (e) { setError((e as Error).message); }
    setRunning(false);
  }

  return (
    <div className="ap-site">
      {error && <p className="adm-warn" role="alert">{error}</p>}
      <section className="card ap-block">
        <h3>Announcement</h3>
        <p className="muted small">Shown at the top of the app for everyone, within about a minute.</p>
        <textarea className="textarea" rows={2} maxLength={200} aria-label="Announcement" value={text} onChange={(e) => { setNote(e.target.value); setSaved(""); }} />
        <div className="row" style={{ marginTop: 8 }}>
          <button className="btn primary sm" onClick={() => void publish(text.trim())}>Publish</button>
          {s.announcement && <button className="btn ghost sm" onClick={() => void publish("")}>Remove</button>}
          {saved && <span className="muted small" role="status">{saved}</span>}
        </div>
      </section>
      <section className="card ap-block">
        <h3>Languages</h3>
        <p className="muted small">Untick a language to stop offering it to new learners. People already learning it keep their access.</p>
        <div className="ap-langs">
          {languages.map((l) => (
            <label key={l.code}><input type="checkbox" checked={!s.hiddenLangs.includes(l.code)} onChange={(e) => void save({ hiddenLangs: e.target.checked ? s.hiddenLangs.filter((x) => x !== l.code) : [...s.hiddenLangs, l.code] })} /> {l.name}</label>
          ))}
        </div>
      </section>
      <section className="card ap-block">
        <h3>Daily stories</h3>
        <p className="muted small">Every morning AI writes 3 German stories and 1 each for 2 other languages, in turn. They wait for your review.</p>
        <label className="ap-check"><input type="checkbox" checked={!s.dailyOff} onChange={(e) => void save({ dailyOff: !e.target.checked })} /> Write stories every morning</label>
        <div className="row" style={{ marginTop: 10 }}>
          <button className="btn sm" disabled={running} onClick={() => void run()}>{running ? "Writing…" : "Write today's stories now"}</button>
          {result && <span className="muted small" role="status">{result}</span>}
        </div>
      </section>
    </div>
  );
}
