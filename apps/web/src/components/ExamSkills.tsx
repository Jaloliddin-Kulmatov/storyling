"use client";

import type { LangCode } from "@storyling/core";
import { useEffect, useRef, useState } from "react";
import { callAi, useAiEnabled } from "@/lib/ai";
import { useLearner } from "@/lib/learner";

type Kind = "writing" | "speaking";
interface Task { level: string; kind: Kind; title: string; task: string; words?: number; minutes: number }

/** Goethe/telc-style productive tasks, written for Storyling (not official exam tasks). */
const DE_TASKS: Task[] = [
  { level: "A1", kind: "writing", title: "Eine Nachricht schreiben", words: 30, minutes: 15, task: "Sie möchten am Samstag mit Ihrer Freundin Anna ins Kino gehen. Schreiben Sie Anna eine kurze Nachricht.\n• Wann gehen Sie?\n• Welchen Film möchten Sie sehen?\n• Wo treffen Sie sich?" },
  { level: "A1", kind: "speaking", title: "Sich vorstellen", minutes: 2, task: "Stellen Sie sich vor: Name, Alter, Land, Wohnort, Sprachen, Beruf, Hobby." },
  { level: "A2", kind: "writing", title: "Eine Einladung absagen", words: 40, minutes: 20, task: "Ihr Freund Tom hat Sie zu seiner Geburtstagsparty eingeladen. Sie können nicht kommen. Schreiben Sie Tom eine E-Mail.\n• Bedanken Sie sich für die Einladung.\n• Sagen Sie, warum Sie nicht kommen können.\n• Machen Sie einen Vorschlag für ein anderes Treffen." },
  { level: "A2", kind: "speaking", title: "Über den Alltag sprechen", minutes: 2, task: "Erzählen Sie über Ihren Alltag: Was machen Sie am Wochenende? Was essen Sie gern? Wie wohnen Sie?" },
  { level: "B1", kind: "writing", title: "Meinung im Forum", words: 80, minutes: 25, task: "Im Online-Forum einer Zeitschrift lesen Sie: „Kinder sollten kein eigenes Handy haben, bevor sie 14 Jahre alt sind.“\nSchreiben Sie Ihre Meinung (ca. 80 Wörter)." },
  { level: "B1", kind: "speaking", title: "Ein Thema präsentieren", minutes: 3, task: "Präsentieren Sie das Thema „Online lernen“:\n• Ihre persönlichen Erfahrungen\n• die Situation in Ihrem Heimatland\n• Vor- und Nachteile\n• Ihre Meinung" },
  { level: "B2", kind: "writing", title: "Forumsbeitrag", words: 150, minutes: 30, task: "Ihre Firma überlegt, das Homeoffice wieder abzuschaffen. Schreiben Sie einen Beitrag für das Firmenforum (ca. 150 Wörter): Nennen Sie Vor- und Nachteile, berichten Sie von eigenen Erfahrungen und machen Sie einen Vorschlag." },
  { level: "B2", kind: "speaking", title: "Diskutieren", minutes: 3, task: "Sollten Autos in den Innenstädten verboten werden? Nehmen Sie Stellung, begründen Sie Ihre Meinung und gehen Sie auf mögliche Gegenargumente ein." },
  { level: "C1", kind: "writing", title: "Erörterung", words: 200, minutes: 40, task: "Soziale Medien – eine Gefahr für die Demokratie? Schreiben Sie eine Erörterung (ca. 200 Wörter) mit Einleitung, Argumenten für und gegen diese These und einem begründeten Schluss." },
  { level: "C1", kind: "speaking", title: "Vortrag", minutes: 4, task: "Halten Sie einen kurzen Vortrag zum Thema „Sollte die Arbeitswoche vier Tage haben?“. Stellen Sie verschiedene Positionen dar und ziehen Sie eine Schlussfolgerung." },
];

const TASKS: Partial<Record<LangCode, Task[]>> = { de: DE_TASKS };
export const hasSkillTasks = (lang: LangCode) => !!TASKS[lang];

interface Grade { scores: { name: string; score: number; max: number; note: string }[]; total: number; passed: boolean; corrected: string; fixes: { wrong: string; right: string; why: string }[]; comment: string }

interface Recognition { lang: string; continuous: boolean; interimResults: boolean; start(): void; stop(): void; onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null; onend: (() => void) | null; onerror: ((e: { error: string }) => void) | null }
const Rec = () => (typeof window === "undefined" ? undefined : ((window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition }).SpeechRecognition ?? (window as unknown as { webkitSpeechRecognition?: new () => Recognition }).webkitSpeechRecognition));

/** Writing and speaking tasks for the exam page, graded by AI against Goethe/telc criteria. */
export function ExamSkills({ lang }: { lang: LangCode }) {
  const tasks = TASKS[lang] ?? [];
  const [open, setOpen] = useState<Task | null>(null);
  const learner = useLearner(lang);
  if (!tasks.length) return null;
  if (open) return <TaskRun lang={lang} task={open} onExit={() => setOpen(null)} />;
  return (
    <section style={{ marginTop: 28 }} aria-label="Writing and speaking">
      <h2 style={{ fontSize: 20, marginBottom: 4 }}>Schreiben und Sprechen</h2>
      <p className="muted small" style={{ marginTop: 0 }}>Write or speak your answer and get a score on the four exam criteria, with corrections. Graded by AI, so treat the score as a guide.</p>
      <div className="game-grid">
        {tasks.map((t) => {
          const best = learner.games[`${t.kind}-${t.level}`];
          return (
            <button key={`${t.level}-${t.kind}`} className={`game-card ${t.kind === "writing" ? "t2" : "t3"}`} style={{ textAlign: "left" }} onClick={() => setOpen(t)}>
              <span className="spread"><span className="lvl">{t.level}</span><span className="small muted">{t.kind === "writing" ? `${t.words} words` : `${t.minutes} min`}</span></span>
              <span className="t">{t.kind === "writing" ? "✍️ Schreiben" : "🎙️ Sprechen"}</span>
              <span className="muted small">{t.title}</span>
              <span className="small gm">{best ? `Best ${best.best}%` : "Not taken yet"}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function TaskRun({ lang, task, onExit }: { lang: LangCode; task: Task; onExit: () => void }) {
  const ai = useAiEnabled();
  const learner = useLearner(lang);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [grade, setGrade] = useState<Grade | null>(null);
  const [listening, setListening] = useState(false);
  const [secs, setSecs] = useState(0);
  const rec = useRef<Recognition | null>(null);
  const base = useRef("");
  const canListen = !!Rec();
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  useEffect(() => {
    if (!listening) return;
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [listening]);
  useEffect(() => () => rec.current?.stop(), []);

  const listen = () => {
    if (listening) { rec.current?.stop(); return; }
    const R = Rec();
    if (!R) return;
    const r = new R();
    r.lang = lang === "de" ? "de-DE" : lang;
    r.continuous = true;
    r.interimResults = true;
    base.current = text ? `${text.trim()} ` : "";
    r.onresult = (e) => {
      let finals = "";
      let interim = "";
      for (let i = 0; i < e.results.length; i++) {
        const res = e.results[i]!;
        if (res.isFinal) finals += res[0].transcript + " ";
        else interim += res[0].transcript;
      }
      setText((base.current + finals + interim).replace(/\s+/g, " "));
    };
    r.onerror = (e) => { setError(e.error === "not-allowed" ? "Allow the microphone to record your answer." : `Speech recognition stopped (${e.error}).`); setListening(false); };
    r.onend = () => setListening(false);
    rec.current = r;
    setError(null);
    setSecs(0);
    r.start();
    setListening(true);
  };

  const submit = async () => {
    rec.current?.stop();
    setBusy(true);
    setError(null);
    try {
      const g = await callAi<Grade>("grade", { lang, level: task.level, kind: task.kind, task: task.task, answer: text });
      setGrade(g);
      learner.recordGame(`${task.kind}-${task.level}`, g.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Grading failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="exam-task">
      <button className="btn ghost sm" onClick={onExit}>← All tasks</button>
      <div className="eyebrow" style={{ marginTop: 10 }}>{task.level} · {task.kind === "writing" ? "Schreiben" : "Sprechen"} · about {task.minutes} min</div>
      <h2 style={{ margin: "4px 0 10px" }}>{task.title}</h2>
      <div className="task-box" lang={lang}>{task.task}</div>

      {!grade ? (
        <>
          {task.kind === "speaking" && (
            <div className="speak-row">
              {canListen ? (
                <button className={`btn ${listening ? "danger" : "primary"}`} onClick={listen}>{listening ? `■ Stop (${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")})` : text ? "🎙️ Continue speaking" : "🎙️ Start speaking"}</button>
              ) : (
                <span className="muted small">Your browser can't turn speech into text. Use Chrome or Edge, or type what you would say.</span>
              )}
              {listening && <span className="rec-dot" aria-hidden="true" />}
            </div>
          )}
          <textarea className="textarea" rows={task.kind === "writing" ? 9 : 6} lang={lang} value={text} onChange={(e) => setText(e.target.value)}
            placeholder={task.kind === "writing" ? "Schreiben Sie hier…" : "Your spoken answer appears here. You can fix mistakes in the transcript."} />
          <div className="spread">
            <span className="small muted">{words} words{task.words ? ` · aim for about ${task.words}` : ""}</span>
            <button className="btn primary" disabled={!ai || busy || words < 5} onClick={submit}>{busy ? "Grading…" : "Get my score"}</button>
          </div>
          {!ai && <p className="muted small">Grading needs AI to be turned on for this site.</p>}
        </>
      ) : (
        <div className="grade-card flash">
          <div className="spread">
            <b style={{ fontSize: 20 }}>{grade.passed ? "Passed ✓" : "Not yet"}</b>
            <div className="score-ring anim" style={{ ["--p" as string]: grade.total / 100 }}><b>{grade.total}%</b></div>
          </div>
          <div className="crit">
            {grade.scores.map((s) => (
              <div key={s.name} className="crit-row">
                <span className="spread"><b>{s.name}</b><span>{s.score}/{s.max}</span></span>
                <div className="g-progress"><span style={{ width: `${(s.score / s.max) * 100}%` }} /></div>
                <span className="small muted">{s.note}</span>
              </div>
            ))}
          </div>
          {grade.comment && <p style={{ margin: 0 }}>{grade.comment}</p>}
          {grade.fixes.length > 0 && (
            <div className="table">
              {grade.fixes.map((f, i) => (
                <div className="trow" key={i}><span><s className="muted" lang={lang}>{f.wrong}</s> → <b lang={lang}>{f.right}</b><span className="small muted" style={{ display: "block" }}>{f.why}</span></span></div>
              ))}
            </div>
          )}
          {grade.corrected && <details><summary>Corrected version</summary><p lang={lang} style={{ whiteSpace: "pre-wrap" }}>{grade.corrected}</p></details>}
          <div className="row">
            <button className="btn" onClick={() => { setGrade(null); }}>Improve my answer</button>
            <button className="btn primary" onClick={() => { setGrade(null); setText(""); }}>Try again</button>
          </div>
        </div>
      )}
      {error && <p className="small" role="alert" style={{ color: "var(--danger)" }}>{error} {/Pro|Sign in/.test(error) && <a href="/pricing">See plans</a>}</p>}
    </section>
  );
}
