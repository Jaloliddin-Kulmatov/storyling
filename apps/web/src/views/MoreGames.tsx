"use client";

import { language } from "@storyling/content";
import type { LangCode } from "@storyling/core";
import { useEffect, useMemo, useRef, useState } from "react";
import { recognizer, type Recognition } from "@/components/StoryTools";
import { Icon } from "@/components/ui";
import { playWord } from "@/lib/audio";
import { useLearner } from "@/lib/learner";
import { Tr } from "@/lib/translate";
import { shuffle } from "@/lib/words";
import { Combo, Confetti, Done, Progress, TooFew, useChoiceKeys, useCombo, useFrozen, usePool, type PoolWord } from "./Practice";

/** Words with different meanings, so every question has exactly one right answer. */
function distinct(pool: PoolWord[]) {
  const seen = new Set<string>();
  return pool.filter((p) => (seen.has(p.meaning) ? false : (seen.add(p.meaning), true)));
}

// ── Speed round: as many words as you can in 60 seconds ──
const SECONDS = 60;

export function SpeedRound({ lang }: { lang: LangCode }) {
  useChoiceKeys();
  const pool = distinct(usePool(lang));
  const learner = useLearner(lang);
  const [combo, hit] = useCombo();
  const [game, setGame] = useState(0);
  const [started, setStarted] = useState(false);
  const [left, setLeft] = useState(SECONDS);
  const [n, setN] = useState(0);
  const [right, setRight] = useState(0);
  const [points, setPoints] = useState(0);
  const [flash, setFlash] = useState<"ok" | "no" | null>(null);
  const order = useFrozen(() => shuffle(pool.map((_, i) => i)), `speed-${game}-${pool.length > 0}`);
  const over = started && left <= 0;

  useEffect(() => {
    if (!started || over) return;
    const t = setInterval(() => setLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [started, over]);
  useEffect(() => {
    if (over) learner.recordGame("speed", Math.round((right / Math.max(1, n)) * 100));
  }, [over]); // eslint-disable-line react-hooks/exhaustive-deps

  const cur = pool[order[n % Math.max(1, order.length)] ?? 0];
  const options = useMemo(() => (cur ? shuffle([cur, ...shuffle(pool.filter((p) => p !== cur)).slice(0, 3)]) : []), [cur, pool]);
  useEffect(() => {
    if (started && !over && cur) playWord(lang, cur.lemma, cur.display);
  }, [n, started]); // eslint-disable-line react-hooks/exhaustive-deps

  if (pool.length < 4) return <TooFew need={4} />;
  const again = () => { setGame((g) => g + 1); setStarted(false); setLeft(SECONDS); setN(0); setRight(0); setPoints(0); };

  if (!started)
    return (
      <div className="flash">
        <div className="speed-clock idle"><b>{SECONDS}</b><span>seconds</span></div>
        <h2 style={{ fontSize: 22, margin: 0 }}>How many words can you get?</h2>
        <p className="muted" style={{ margin: 0 }}>Pick the meaning of each word. Answers in a row score more. Use keys 1–4 to go faster.</p>
        <button className="btn primary block" onClick={() => setStarted(true)}>Start</button>
      </div>
    );
  if (over)
    return (
      <div className="flash done-card">
        {right >= 15 && <Confetti />}
        <div className="speed-clock"><b>{points}</b><span>points</span></div>
        <h2 style={{ fontSize: 22 }}>{right >= 15 ? "Lightning fast!" : right >= 8 ? "Nice speed!" : "Keep going!"}</h2>
        <p className="muted" style={{ margin: 0 }}>{right} of {n} right in {SECONDS} seconds.{learner.games.speed ? ` Best accuracy ${learner.games.speed.best}%.` : ""}</p>
        <button className="btn primary block" onClick={again}>Play again</button>
      </div>
    );

  const pick = (p: PoolWord) => {
    const ok = p === cur;
    hit(ok);
    setFlash(ok ? "ok" : "no");
    setTimeout(() => setFlash(null), 250);
    if (ok) { setRight((r) => r + 1); setPoints((x) => x + 10 + Math.min(combo, 10) * 2); }
    else learner.setWord(cur!.lemma, "learning");
    setN((x) => x + 1);
  };

  return (
    <div className={`flash speed${flash ? ` ${flash}` : ""}`}>
      <div className="spread small muted"><span>{points} points <Combo n={combo} /></span><span className={left <= 10 ? "speed-low" : ""}>{left}s</span></div>
      <div className="g-progress"><span style={{ width: `${(left / SECONDS) * 100}%` }} /></div>
      <button className="pic-word" lang={lang} onClick={() => playWord(lang, cur!.lemma, cur!.display)}>{cur!.display} <span aria-hidden="true">{Icon.speaker}</span></button>
      <div className="choices">
        {options.map((o, i) => (
          <button key={`${n}-${o.lemma}`} className="choice" onClick={() => pick(o)}><span className="muted small">{i + 1}</span> <Tr>{o.meaning}</Tr></button>
        ))}
      </div>
    </div>
  );
}

// ── Memory: turn two cards at a time and find word–meaning pairs ──
interface MemCard { key: string; lemma: string; face: string; word: boolean }

export function Memory({ lang }: { lang: LangCode }) {
  const pool = distinct(usePool(lang));
  const learner = useLearner(lang);
  const [game, setGame] = useState(0);
  const cards = useFrozen(() => {
    const pairs = pool.slice((game * 6) % Math.max(1, pool.length - 6), (game * 6) % Math.max(1, pool.length - 6) + 6);
    return shuffle(pairs.flatMap((p): MemCard[] => [{ key: `w-${p.lemma}`, lemma: p.lemma, face: p.display, word: true }, { key: `m-${p.lemma}`, lemma: p.lemma, face: p.meaning, word: false }]));
  }, `mem-${game}-${pool.length > 0}`);
  const [open, setOpen] = useState<string[]>([]);
  const [found, setFound] = useState<Set<string>>(new Set());
  const [moves, setMoves] = useState(0);
  const busy = useRef(false);
  const pairs = cards.length / 2;
  const finished = pairs > 0 && found.size === pairs;
  const score = Math.max(0, Math.min(100, Math.round((pairs / Math.max(pairs, moves)) * 100)));

  useEffect(() => {
    if (finished) learner.recordGame("memory", score);
  }, [finished]); // eslint-disable-line react-hooks/exhaustive-deps

  if (pool.length < 6) return <TooFew need={6} />;
  if (finished) return <Done score={pairs} total={moves} note={`${moves} turns for ${pairs} pairs.`} onAgain={() => { setGame((g) => g + 1); setOpen([]); setFound(new Set()); setMoves(0); }} />;

  const flip = (c: MemCard) => {
    if (busy.current || open.includes(c.key) || found.has(c.lemma)) return;
    if (c.word) playWord(lang, c.lemma, c.face);
    const next = [...open, c.key];
    setOpen(next);
    if (next.length < 2) return;
    setMoves((m) => m + 1);
    const [a, b] = next.map((k) => cards.find((x) => x.key === k)!);
    if (a!.lemma === b!.lemma) {
      setFound((f) => new Set(f).add(a!.lemma));
      setOpen([]);
    } else {
      busy.current = true;
      setTimeout(() => { setOpen([]); busy.current = false; }, 900);
    }
  };

  return (
    <div className="memory">
      <p className="muted" style={{ margin: "0 0 12px" }}>Turn two cards. Find each word and its meaning.</p>
      <div className="mem-grid">
        {cards.map((c) => {
          const up = open.includes(c.key) || found.has(c.lemma);
          return (
            <button key={c.key} className={`mem-card${up ? " up" : ""}${found.has(c.lemma) ? " found" : ""}`} onClick={() => flip(c)} aria-label={up ? c.face : "Hidden card"}>
              <span className="mem-inner">
                <span className="mem-back" aria-hidden="true">?</span>
                <span className={`mem-front${c.word ? "" : " en"}`} lang={c.word ? lang : undefined}>{c.word ? c.face : <Tr>{c.face}</Tr>}</span>
              </span>
            </button>
          );
        })}
      </div>
      <Progress done={found.size} total={pairs} />
      <p className="small muted">{found.size}/{pairs} pairs · {moves} turns</p>
    </div>
  );
}

// ── Spell it: hear a word and build it from its letters ──
const letters = (w: string) => [...w];

export function SpellIt({ lang }: { lang: LangCode }) {
  useChoiceKeys();
  const pool = usePool(lang);
  const learner = useLearner(lang);
  const [combo, hit] = useCombo();
  const [game, setGame] = useState(0);
  const rounds = useFrozen(() => {
    const ok = (p: PoolWord) => { const n = letters(p.display.replace(/^(der|die|das) /, "")).length; return n >= (language(lang).noSpace ? 2 : 3) && n <= 10 && !/\s/.test(p.display.replace(/^(der|die|das) /, "")); };
    return pool.filter(ok).slice(0, 8);
  }, `spell-${game}-${pool.length > 0}`);
  const [n, setN] = useState(0);
  const [score, setScore] = useState(0);
  const [built, setBuilt] = useState<number[]>([]);
  const [checked, setChecked] = useState<boolean | null>(null);
  const cur = rounds[n];
  const word = cur ? cur.display.replace(/^(der|die|das) /, "") : "";
  const tiles = useFrozen(() => shuffle(letters(word).map((_, i) => i)), `spell-tiles-${game}-${n}`);

  useEffect(() => {
    if (cur) playWord(lang, cur.lemma, cur.display);
  }, [cur?.lemma]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!cur) {
    if (rounds.length) return <Done score={score} total={rounds.length} onAgain={() => { setGame((g) => g + 1); setN(0); setScore(0); setBuilt([]); setChecked(null); }} />;
    return <TooFew need={3} />;
  }
  const chars = letters(word);
  const attempt = built.map((i) => chars[i]).join("");
  const check = () => {
    const ok = attempt === word;
    setChecked(ok);
    hit(ok);
    if (ok) setScore((s) => s + 1);
    else learner.setWord(cur.lemma, "learning");
    playWord(lang, cur.lemma, cur.display);
  };
  const next = () => {
    if (n + 1 >= rounds.length) learner.recordGame("spell", Math.round((score / rounds.length) * 100));
    setN(n + 1); setBuilt([]); setChecked(null);
  };

  return (
    <div className="flash" key={n}>
      <div className="spread small muted"><span>Word {n + 1} of {rounds.length} <Combo n={combo} /></span><span>Spell what you hear</span></div>
      <Progress done={n} total={rounds.length} />
      <p style={{ margin: 0, fontSize: 18, fontWeight: 600 }}><Tr>{cur.meaning}</Tr></p>
      <button className="btn ghost sm" style={{ justifySelf: "center" }} onClick={() => playWord(lang, cur.lemma, cur.display)}>{Icon.speaker} Hear it again</button>
      <div className={`spell-slots${checked === true ? " ok" : checked === false ? " no" : ""}`} lang={lang}>
        {chars.map((_, k) => (
          <button key={k} className={`spell-slot${built[k] !== undefined ? " full" : ""}`} disabled={checked !== null || built[k] === undefined} onClick={() => setBuilt(built.slice(0, k))}>{built[k] !== undefined ? chars[built[k]!] : ""}</button>
        ))}
      </div>
      <div className="bank" lang={lang}>
        {tiles.map((i) => (
          <button key={i} className="tile sm" disabled={built.includes(i) || checked !== null} onClick={() => setBuilt([...built, i])}>{chars[i]}</button>
        ))}
      </div>
      {checked === null ? (
        <button className="btn primary block" disabled={built.length !== chars.length} onClick={check}>Check</button>
      ) : (
        <>
          <p style={{ margin: 0 }} lang={lang}><b>{checked ? "Correct!" : "Not quite."}</b> {!checked && <>It's <b>{word}</b>.</>}</p>
          <button className="btn primary block" onClick={next}>{n + 1 >= rounds.length ? "See result" : "Next"}</button>
        </>
      )}
    </div>
  );
}

// ── Say it: read a word aloud and the browser checks what it heard ──
const plain = (s: string) => s.toLowerCase().normalize("NFKC").replace(/[\p{P}\p{S}\s]+/gu, "");

export function SayIt({ lang }: { lang: LangCode }) {
  const pool = usePool(lang);
  const learner = useLearner(lang);
  const [combo, hit] = useCombo();
  const [game, setGame] = useState(0);
  const rounds = useFrozen(() => pool.slice(0, 8), `say-${game}-${pool.length > 0}`);
  const [n, setN] = useState(0);
  const [score, setScore] = useState(0);
  const [state, setState] = useState<"idle" | "listening" | "ok" | "no">("idle");
  const [heard, setHeard] = useState("");
  const [tries, setTries] = useState(0);
  const rec = useRef<Recognition | null>(null);
  const cur = rounds[n];
  const Ctor = typeof window === "undefined" ? undefined : recognizer();
  useEffect(() => () => rec.current?.stop(), []);

  if (!Ctor) return <div className="empty"><p className="muted">Your browser can't listen to speech. Try Chrome, Edge or Safari.</p></div>;
  if (!cur) {
    if (rounds.length) return <Done score={score} total={rounds.length} onAgain={() => { setGame((g) => g + 1); setN(0); setScore(0); setState("idle"); setTries(0); setHeard(""); }} />;
    return <TooFew need={3} />;
  }

  const target = plain(cur.display.replace(/^(der|die|das) /, ""));
  const listen = () => {
    rec.current?.stop();
    const r = new Ctor();
    r.lang = language(lang).tts;
    r.interimResults = false;
    r.maxAlternatives = 5;
    r.onresult = (e) => {
      const alts = Array.from(e.results[0] ?? []).map((a) => a.transcript);
      const ok = alts.some((a) => plain(a).includes(target));
      setHeard(alts[0] ?? "");
      setState(ok ? "ok" : "no");
      setTries((t) => t + 1);
      hit(ok);
      if (ok && tries < 2) setScore((s) => s + 1);
      if (!ok) learner.setWord(cur.lemma, "learning");
    };
    r.onerror = (e) => { setHeard(e.error === "not-allowed" ? "Allow the microphone to play." : "I didn't catch that. Try again."); setState("no"); };
    r.onend = () => setState((s) => (s === "listening" ? "idle" : s));
    rec.current = r;
    setState("listening");
    setHeard("");
    r.start();
  };
  const next = () => {
    if (n + 1 >= rounds.length) learner.recordGame("say", Math.round((score / rounds.length) * 100));
    setN(n + 1); setState("idle"); setTries(0); setHeard("");
  };

  return (
    <div className="flash" key={n}>
      <div className="spread small muted"><span>Word {n + 1} of {rounds.length} <Combo n={combo} /></span><span>Say it out loud</span></div>
      <Progress done={n} total={rounds.length} />
      <b className="say-word" lang={lang}>{cur.display}</b>
      <p className="muted" style={{ margin: 0 }}><Tr>{cur.meaning}</Tr></p>
      <div className="row" style={{ justifyContent: "center", gap: 10 }}>
        <button className="btn ghost sm" onClick={() => playWord(lang, cur.lemma, cur.display)}>{Icon.speaker} Listen first</button>
        <button className={`mic-btn${state === "listening" ? " on" : ""}`} onClick={listen} disabled={state === "listening"} aria-label="Speak">🎤</button>
      </div>
      <p className={`say-result ${state}`} role="status" lang={lang}>
        {state === "listening" ? "Listening…" : state === "ok" ? `✓ Great! I heard “${heard}”.` : state === "no" ? (heard && !heard.includes(".") ? `I heard “${heard}”. Try again.` : heard) : "Tap the microphone and say the word."}
      </p>
      <button className="btn primary block" disabled={state === "listening" || (state !== "ok" && tries < 2)} onClick={next}>{state === "ok" ? (n + 1 >= rounds.length ? "See result" : "Next") : "Skip"}</button>
    </div>
  );
}
