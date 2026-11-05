"use client";

import { sentenceText } from "@storyling/content";
import type { LangCode } from "@storyling/core";
import type { PublishedStory } from "@storyling/learner";
import { useCallback, useEffect, useState } from "react";
import { AuthForm } from "@/components/AuthForm";
import { useAccount } from "@/lib/account";

type Status = "pending" | "published" | "rejected";
interface Row {
  id: string;
  status: Status;
  story: PublishedStory;
  warnings: string[];
  created_at: string;
}
interface List {
  stories: Row[];
  waiting: number;
  levels: string[];
  topics: Record<string, string>;
}

async function api<T>(method: string, body?: unknown, query = ""): Promise<T> {
  const res = await fetch(`/api/admin/stories${query}`, { method, ...(body ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}) });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data.error ?? "Request failed.");
  return data;
}

/** The daily stories queue: read what the AI wrote, fix it, then publish or reject. */
export function AdminStories({ lang }: { lang: LangCode }) {
  const account = useAccount();
  const [tab, setTab] = useState<Status>("pending");
  const [list, setList] = useState<List | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState("A2");
  const [topic, setTopic] = useState("daily");
  const [writing, setWriting] = useState(false);
  const allowed = !!account.user?.admin;

  const load = useCallback(() => {
    if (allowed) api<List>("GET", undefined, `?status=${tab}`).then(setList, (e: Error) => setError(e.message));
  }, [allowed, tab]);
  useEffect(load, [load]);

  if (!account.loaded) return <p className="muted">Loading…</p>;
  if (!account.user)
    return (
      <div className="card" style={{ maxWidth: 420, margin: "40px auto" }}>
        <h2 style={{ marginTop: 0 }}>Sign in to review stories</h2>
        <AuthForm start="login" />
      </div>
    );
  if (!allowed) return <div className="empty" style={{ marginTop: 40 }}><p className="muted" style={{ margin: 0 }}>This page is for admins.</p></div>;

  async function write() {
    setWriting(true);
    setError(null);
    try {
      await api("POST", { lang, level, topic });
      if (tab === "pending") load();
      else setTab("pending");
    } catch (e) {
      setError((e as Error).message);
    }
    setWriting(false);
  }

  const TABS: [Status, string][] = [["pending", `Waiting${list ? ` (${list.waiting})` : ""}`], ["published", "Published"], ["rejected", "Rejected"]];
  return (
    <>
      <div className="page-head"><div><div className="eyebrow">Admin</div><h1>Review stories</h1></div></div>
      <p className="muted">New stories arrive here every morning. Learners only see the ones you publish.</p>

      <div className="spread adm-bar">
        <div className="seg" role="group" aria-label="Status">
          {TABS.map(([s, label]) => <button key={s} aria-pressed={tab === s} onClick={() => setTab(s)}>{label}</button>)}
        </div>
        {list && (
          <div className="row">
            <select className="input adm-sel" aria-label="Level" value={level} onChange={(e) => setLevel(e.target.value)}>{list.levels.map((l) => <option key={l}>{l}</option>)}</select>
            <select className="input adm-sel" aria-label="Topic" value={topic} onChange={(e) => setTopic(e.target.value)}>{Object.entries(list.topics).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            <button className="btn sm" disabled={writing} onClick={() => void write()}>{writing ? "Writing…" : "Write one now"}</button>
          </div>
        )}
      </div>

      {error && <p className="adm-warn" role="alert">{error}</p>}
      {!list ? <p className="muted">Loading…</p> : list.stories.length === 0 ? (
        <div className="empty"><p className="muted" style={{ margin: 0 }}>{tab === "pending" ? "Nothing to review right now." : "Nothing here yet."}</p></div>
      ) : list.stories.map((r) => <StoryReview key={r.id} row={r} levels={list.levels} topics={list.topics} onDone={load} />)}
    </>
  );
}

function StoryReview({ row, levels, topics, onDone }: { row: Row; levels: string[]; topics: Record<string, string>; onDone: () => void }) {
  const [story, setStory] = useState(row.story);
  const [warnings, setWarnings] = useState(row.warnings);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const draftOf = (s: PublishedStory) => ({
    title: s.title, titleEnglish: s.titleEnglish, level: s.level, topic: s.topic,
    sentences: s.sentences.map((x, from) => ({ from, text: sentenceText(s.lang, x), tr: x.translation ?? "" })),
    meanings: Object.fromEntries(Object.entries(s.dict).map(([k, v]) => [k, v[1]])),
  });
  const [draft, setDraft] = useState(() => draftOf(row.story));
  const patch = (p: Partial<typeof draft>) => setDraft((d) => ({ ...d, ...p }));
  const line = (i: number, p: Partial<(typeof draft.sentences)[number]>) => patch({ sentences: draft.sentences.map((s, j) => (j === i ? { ...s, ...p } : s)) });

  async function save(status?: Status) {
    setBusy(true);
    setError(null);
    try {
      const out = await api<{ story: PublishedStory; warnings: string[] }>("PATCH", { id: row.id, ...(editing ? { edit: draft } : {}), ...(status ? { status } : {}) });
      setStory(out.story);
      setWarnings(out.warnings);
      setDraft(draftOf(out.story));
      setEditing(false);
      if (status) onDone();
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  }

  return (
    <article className="card adm-story">
      {editing ? (
        <div className="adm-grid">
          <label className="field"><span>Title</span><input className="input" lang={story.lang} value={draft.title} maxLength={120} onChange={(e) => patch({ title: e.target.value })} /></label>
          <label className="field"><span>English title</span><input className="input" value={draft.titleEnglish} maxLength={120} onChange={(e) => patch({ titleEnglish: e.target.value })} /></label>
          <label className="field"><span>Level</span><select className="input" value={draft.level} onChange={(e) => patch({ level: e.target.value })}>{levels.map((l) => <option key={l}>{l}</option>)}</select></label>
          <label className="field"><span>Topic</span><select className="input" value={draft.topic} onChange={(e) => patch({ topic: e.target.value })}>{Object.entries(topics).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
        </div>
      ) : (
        <>
          <div className="row"><span className="pill">{story.level}</span><span className="muted small">{topics[story.topic] ?? story.topic} · {story.minutes} min · {new Date(row.created_at).toLocaleDateString("en", { month: "short", day: "numeric" })}</span></div>
          <h2 lang={story.lang}>{story.title}</h2>
          <p className="muted" style={{ marginTop: 0 }}>{story.titleEnglish}</p>
        </>
      )}

      {warnings.length > 0 && <ul className="adm-warn">{warnings.map((w) => <li key={w}>{w}</li>)}</ul>}

      <ol className="adm-lines">
        {editing
          ? draft.sentences.map((s, i) => (
              <li key={i}>
                <textarea className="textarea" rows={2} lang={story.lang} aria-label={`Sentence ${i + 1}`} value={s.text} onChange={(e) => line(i, { text: e.target.value })} />
                <textarea className="textarea" rows={2} aria-label={`Translation ${i + 1}`} value={s.tr} onChange={(e) => line(i, { tr: e.target.value })} />
              </li>
            ))
          : story.sentences.map((s, i) => (
              <li key={i}><span lang={story.lang}>{sentenceText(story.lang, s)}</span><small className="muted">{s.translation}</small></li>
            ))}
      </ol>
      {editing && <p className="muted small">Empty a sentence to remove it. Changed sentences get new word meanings when you save.</p>}

      <details className="adm-words">
        <summary>Word meanings ({Object.keys(story.dict).length})</summary>
        <dl>
          {Object.entries(story.dict).map(([lemma, e]) => (
            <div key={lemma}>
              <dt lang={story.lang}>{lemma} <small className="muted">{e[0]}</small></dt>
              <dd>{editing ? <input className="input" aria-label={`Meaning of ${lemma}`} value={draft.meanings[lemma] ?? ""} maxLength={200} onChange={(ev) => patch({ meanings: { ...draft.meanings, [lemma]: ev.target.value } })} /> : e[1]}</dd>
            </div>
          ))}
        </dl>
      </details>

      {error && <p className="adm-warn" role="alert">{error}</p>}
      <div className="row adm-actions">
        {row.status !== "published" && <button className="btn primary" disabled={busy} onClick={() => void save("published")}>{editing ? "Save and publish" : "Publish"}</button>}
        {editing ? (
          <>
            <button className="btn" disabled={busy} onClick={() => void save()}>{busy ? "Saving…" : "Save"}</button>
            <button className="btn ghost" disabled={busy} onClick={() => { setDraft(draftOf(story)); setEditing(false); }}>Cancel</button>
          </>
        ) : (
          <button className="btn" disabled={busy} onClick={() => setEditing(true)}>Edit</button>
        )}
        {row.status === "published" && <button className="btn ghost" disabled={busy} onClick={() => void save("pending")}>Unpublish</button>}
        {row.status === "pending" && <button className="btn ghost" disabled={busy} onClick={() => void save("rejected")}>Reject</button>}
        {row.status === "rejected" && <button className="btn ghost" disabled={busy} onClick={() => void save("pending")}>Move to waiting</button>}
      </div>
    </article>
  );
}
