import { language } from "@storyling/content";
import { previewIntervals, type LangCode, type ReviewGrade, type Sentence } from "@storyling/core";
import { highlight, isUserStory, lookupIn, PUNCT, shuffle, textOf, useLearner, useStories, useWordInfo, type AnyStory, type StoredWord } from "@storyling/learner";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { playSentenceAny, playWordAny, stopAll } from "../../../src/audio";
import { READ_FONT, useTheme } from "../../../src/theme";
import { Button, Icon } from "../../../src/ui";

const TITLES: Record<string, string> = { review: "Flashcards", match: "Match words", order: "Build the sentence", listen: "Listening", test: "Level test" };
const ROUNDS = 5;

interface PoolWord {
  lemma: string;
  display: string;
  meaning: string;
  story: AnyStory;
  sentence: number;
}

export default function Game() {
  const { lang, mode } = useLocalSearchParams<{ lang: LangCode; mode: string }>();
  const t = useTheme();
  const router = useRouter();
  useEffect(() => () => stopAll(), []);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6 }}>
        <Pressable onPress={() => router.back()} hitSlop={8} accessibilityLabel="Back" style={{ padding: 6 }}><Icon name="chevron-back" size={24} /></Pressable>
        <Text style={{ color: t.ink, fontSize: 20, fontWeight: "800" }}>{TITLES[mode] ?? "Practice"}</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }}>
        {mode === "review" && <Review lang={lang} />}
        {mode === "match" && <Match lang={lang} />}
        {mode === "order" && <Order lang={lang} />}
        {mode === "listen" && <Listen lang={lang} />}
        {mode === "test" && <LevelTest lang={lang} />}
      </ScrollView>
    </SafeAreaView>
  );
}

/** Build once per key; a game must not reshuffle when the learner's data changes mid-game. */
function useFrozen<T>(build: () => T, key: string): T {
  const ref = useRef<{ key: string; value: T } | null>(null);
  if (!ref.current || ref.current.key !== key) ref.current = { key, value: build() };
  return ref.current.value;
}

function Card({ children }: { children: ReactNode }) {
  const t = useTheme();
  return <View style={{ backgroundColor: t.surface, borderColor: t.line, borderWidth: 1, borderRadius: 22, padding: 18, gap: 14 }}>{children}</View>;
}

function Choice({ label, state, onPress, disabled, lang }: { label: string; state?: "ok" | "no"; onPress: () => void; disabled?: boolean; lang?: string }) {
  const t = useTheme();
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button"
      style={{ borderWidth: 2, borderRadius: 14, padding: 13, borderColor: state === "ok" ? t.primary : state === "no" ? t.danger : t.line, backgroundColor: state === "ok" ? t.primarySoft : state === "no" ? t.dangerSoft : t.surface }}>
      <Text style={{ color: t.ink, fontWeight: "600", fontSize: 15, fontFamily: lang ? READ_FONT : undefined }}>{label}</Text>
    </Pressable>
  );
}

function Done({ score, total, onAgain, note }: { score: number; total: number; onAgain: () => void; note?: string }) {
  const t = useTheme();
  const pct = Math.round((score / Math.max(1, total)) * 100);
  return (
    <Card>
      <View style={{ alignSelf: "center", width: 120, height: 120, borderRadius: 60, borderWidth: 10, borderColor: pct >= 50 ? t.primary : t.newWord, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: t.ink, fontSize: 28, fontWeight: "800" }}>{pct}%</Text>
      </View>
      <Text style={{ color: t.ink, fontSize: 22, fontWeight: "800", textAlign: "center" }}>{pct >= 80 ? "Great job!" : pct >= 50 ? "Good work!" : "Keep practicing!"}</Text>
      <Text style={{ color: t.muted, textAlign: "center" }}>{score} of {total} correct.{note ? ` ${note}` : ""}</Text>
      <Button kind="primary" label="Play again" onPress={onAgain} />
    </Card>
  );
}

/** Words with meanings: saved words first, then stories near the learner's level (or one level). */
function usePool(lang: LangCode, level?: string) {
  const stories = useStories(lang);
  const learner = useLearner(lang);
  return useMemo(() => {
    const out = new Map<string, PoolWord>();
    const levels = language(lang).levels;
    const reach = (learner.level ?? 0) + 1;
    const near = stories.filter((s) => isUserStory(s) || levels.indexOf(s.level) <= reach);
    const source = level ? stories.filter((s) => s.level === level) : near.length ? near : stories;
    const add = (story: AnyStory, lemma: string, sentence: number) => {
      if (out.has(lemma)) return;
      const e = lookupIn(story, lemma);
      if (e && e.pos !== "name") out.set(lemma, { lemma, display: e.display, meaning: e.meaning, story, sentence });
    };
    if (!level) {
      for (const w of learner.allWords.filter((w) => w.saved === "learning")) {
        const st = stories.find((s) => s.id === w.source?.storyId) ?? stories.find((s) => s.sentences.some((x) => x.tokens.some((tk) => tk.lemma === w.lemma)));
        if (st) add(st, w.lemma, w.source?.sentence ?? st.sentences.findIndex((x) => x.tokens.some((tk) => tk.lemma === w.lemma)));
      }
    }
    for (const st of source) st.sentences.forEach((x, i) => x.tokens.forEach((tk) => tk.lemma && !tk.isName && add(st, tk.lemma, i)));
    return [...out.values()];
  }, [stories, learner.allWords, learner.level, level, lang]);
}

/** Sentences with 4–10 words: from stories the learner has read first. */
function useSentences(lang: LangCode) {
  const stories = useStories(lang);
  const learner = useLearner(lang);
  return useMemo(() => {
    const pick = (list: AnyStory[]) =>
      list.flatMap((story) => story.sentences.map((s, i) => ({ story, s, i })).filter(({ s }) => {
        const n = s.tokens.filter((tk) => tk.lemma).length;
        return n >= 4 && n <= 10;
      }));
    const read = pick(stories.filter((s) => learner.finished.includes(s.id)));
    const lv = language(lang).levels[Math.min(learner.level ?? 0, language(lang).levels.length - 1)];
    return read.length >= 5 ? read : [...read, ...pick(stories.filter((s) => s.level === lv))];
  }, [stories, learner.finished, learner.level, lang]);
}

// ── Flashcards ──
const GRADES: { g: ReviewGrade; label: string; kind: "danger" | "default" | "primary" }[] = [
  { g: "again", label: "Again", kind: "danger" },
  { g: "hard", label: "Hard", kind: "default" },
  { g: "good", label: "Good", kind: "primary" },
  { g: "easy", label: "Easy", kind: "default" },
];
const interval = (ms: number) => {
  const d = ms / 864e5;
  return d < 1 / 24 ? `${Math.max(1, Math.round(ms / 6e4))}m` : d < 1 ? `${Math.round(d * 24)}h` : d < 30 ? `${Math.round(d)}d` : `${Math.round(d / 30)}mo`;
};

function Review({ lang }: { lang: LangCode }) {
  const t = useTheme();
  const learner = useLearner(lang);
  const router = useRouter();
  const { meaningOf, contextOf } = useWordInfo(lang);
  const [queue, setQueue] = useState<string[]>(() => learner.dueWords().map((w) => w.lemma));
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(0);
  const word: StoredWord | undefined = queue[0] ? learner.word(queue[0]) : undefined;

  if (!word) {
    return (
      <Card>
        <Text style={{ color: t.ink, fontSize: 20, fontWeight: "800" }}>{done ? `Done! ${done} ${done === 1 ? "card" : "cards"} reviewed.` : "Nothing to review right now"}</Text>
        <Text style={{ color: t.muted }}>{learner.learningCount ? "Saved words come back when they are due. Reading stories that use them also counts." : "Tap a word while reading and press Review to save it."}</Text>
        <Button kind="primary" label="Read a story" onPress={() => router.replace(`/${lang}`)} />
      </Card>
    );
  }
  const meaning = meaningOf(word);
  const ctx = contextOf(word);
  const parts = ctx ? highlight(ctx.text, ctx.surface) : null;
  const intervals = word.card ? previewIntervals(word.card) : undefined;
  return (
    <Card>
      <Text style={{ color: t.muted, fontSize: 12.5 }}>{queue.length} left · seen {word.encounters}× in stories</Text>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 }}>
        <Text style={{ color: t.ink, fontFamily: READ_FONT, fontSize: 40 }}>{meaning?.display ?? word.lemma}</Text>
        <Pressable onPress={() => playWordAny(lang, word.lemma, meaning?.display ?? word.lemma)} accessibilityLabel="Hear the word" hitSlop={8}><Icon name="volume-high" /></Pressable>
      </View>
      {ctx && (
        <Text style={{ color: t.ink, fontFamily: READ_FONT, fontSize: 18, textAlign: "center", lineHeight: 28 }}>
          {parts ? <>{parts[0]}<Text style={{ backgroundColor: t.learningSoft }}>{parts[1]}</Text>{parts[2]}</> : ctx.text}
        </Text>
      )}
      {!flipped ? (
        <Button kind="primary" label="Show meaning" onPress={() => setFlipped(true)} />
      ) : (
        <>
          <View style={{ alignItems: "center", gap: 2 }}>
            {!!meaning?.reading && <Text style={{ color: t.muted }}>{meaning.reading}</Text>}
            <Text style={{ color: t.ink, fontSize: 22, fontWeight: "800" }}>{meaning?.meaning ?? "—"}</Text>
            {!!ctx?.translation && <Text style={{ color: t.muted, textAlign: "center", marginTop: 6 }}>{ctx.translation}</Text>}
          </View>
          <View style={{ flexDirection: "row", gap: 6 }}>
            {GRADES.map(({ g, label, kind }) => (
              <View key={g} style={{ flex: 1 }}>
                <Button kind={kind} label={intervals ? `${label}\n${interval(intervals[g])}` : label} onPress={() => {
                  learner.grade(word.lemma, g);
                  setFlipped(false);
                  setDone((n) => n + 1);
                  setQueue((q) => (g === "again" ? [...q.slice(1), q[0]!] : q.slice(1)));
                }} />
              </View>
            ))}
          </View>
        </>
      )}
    </Card>
  );
}

// ── Match words ──
function Match({ lang }: { lang: LangCode }) {
  const t = useTheme();
  const pool = usePool(lang);
  const learner = useLearner(lang);
  const [round, setRound] = useState(0);
  const { pairs, right } = useFrozen(() => {
    const seen = new Set<string>();
    const pairs = shuffle(pool).filter((p) => (seen.has(p.meaning) ? false : (seen.add(p.meaning), true))).slice(0, 6);
    return { pairs, right: shuffle(pairs) };
  }, `match-${round}`);
  const [picked, setPicked] = useState<string | null>(null);
  const [solved, setSolved] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const finished = pairs.length > 0 && solved.size === pairs.length;
  const score = Math.max(0, pairs.length - mistakes);
  useEffect(() => {
    if (finished) learner.recordGame("match", Math.round((score / pairs.length) * 100));
  }, [finished]); // eslint-disable-line react-hooks/exhaustive-deps

  if (pairs.length < 3) return <Card><Text style={{ color: t.muted }}>Read a story first, then come back to play.</Text></Card>;
  if (finished) return <Done score={score} total={pairs.length} onAgain={() => { setRound((r) => r + 1); setSolved(new Set()); setMistakes(0); setPicked(null); }} />;

  const tile = (on: boolean, done: boolean, bad: boolean) => ({
    borderWidth: 2, borderRadius: 14, minHeight: 56, padding: 10, justifyContent: "center" as const,
    borderColor: bad ? t.danger : on ? t.primary : t.line, backgroundColor: bad ? t.dangerSoft : on ? t.primarySoft : t.surface, opacity: done ? 0.35 : 1,
  });
  return (
    <View style={{ gap: 12 }}>
      <Text style={{ color: t.muted }}>Tap a word, then tap its meaning.</Text>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1, gap: 8 }}>
          {pairs.map((p) => (
            <Pressable key={p.lemma} disabled={solved.has(p.lemma)} onPress={() => { setPicked(p.lemma); playWordAny(lang, p.lemma, p.display); }} style={tile(picked === p.lemma, solved.has(p.lemma), false)}>
              <Text style={{ color: t.ink, fontFamily: READ_FONT, fontSize: 18, textAlign: "center" }}>{p.display}</Text>
            </Pressable>
          ))}
        </View>
        <View style={{ flex: 1, gap: 8 }}>
          {right.map((p) => (
            <Pressable key={p.lemma} disabled={solved.has(p.lemma) || !picked} style={tile(false, solved.has(p.lemma), wrong === p.lemma)}
              onPress={() => {
                if (picked === p.lemma) { setSolved((s) => new Set(s).add(p.lemma)); setPicked(null); }
                else { setMistakes((m) => m + 1); setWrong(p.lemma); setTimeout(() => setWrong(null), 500); }
              }}>
              <Text style={{ color: t.ink, fontSize: 13.5, fontWeight: "600", textAlign: "center" }}>{p.meaning}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <Text style={{ color: t.muted, fontSize: 12.5 }}>{solved.size}/{pairs.length} matched · {mistakes} {mistakes === 1 ? "mistake" : "mistakes"}</Text>
    </View>
  );
}

// ── Build the sentence ──
function Order({ lang }: { lang: LangCode }) {
  const t = useTheme();
  const sentences = useSentences(lang);
  const learner = useLearner(lang);
  const noSpace = language(lang).noSpace;
  const [game, setGame] = useState(0);
  const rounds = useFrozen(() => shuffle(sentences).slice(0, ROUNDS), `order-${game}`);
  const [n, setN] = useState(0);
  const [score, setScore] = useState(0);
  const [built, setBuilt] = useState<number[]>([]);
  const [checked, setChecked] = useState<null | boolean>(null);
  const cur = rounds[n];
  const words = useMemo(() => (cur ? cur.s.tokens.filter((tk) => !PUNCT.test(tk.surface)) : []), [cur]);
  const tiles = useFrozen(() => shuffle(words.map((_, i) => i)), `tiles-${game}-${n}`);

  if (!cur) {
    if (rounds.length) return <Done score={score} total={rounds.length} onAgain={() => { setGame((g) => g + 1); setN(0); setScore(0); setBuilt([]); setChecked(null); }} />;
    return <Card><Text style={{ color: t.muted }}>No sentences to practice yet.</Text></Card>;
  }
  const join = (xs: string[]) => xs.join(noSpace ? "" : " ");
  const tileStyle = { borderWidth: 2, borderColor: t.line, backgroundColor: t.surface, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 };
  return (
    <Card>
      <Text style={{ color: t.muted, fontSize: 12.5 }}>Sentence {n + 1} of {rounds.length}</Text>
      {!!cur.s.translation && <Text style={{ color: t.ink, fontSize: 17, fontWeight: "700" }}>{cur.s.translation}</Text>}
      <View style={{ minHeight: 64, borderWidth: 2, borderStyle: "dashed", borderRadius: 14, padding: 8, flexDirection: "row", flexWrap: "wrap", gap: 6,
        borderColor: checked === true ? t.primary : checked === false ? t.danger : t.line, backgroundColor: checked === true ? t.primarySoft : checked === false ? t.dangerSoft : "transparent" }}>
        {built.map((i, k) => (
          <Pressable key={k} disabled={checked !== null} onPress={() => setBuilt(built.filter((_, j) => j !== k))} style={tileStyle}>
            <Text style={{ color: t.ink, fontFamily: READ_FONT, fontSize: 18 }}>{words[i]!.surface}</Text>
          </Pressable>
        ))}
        {!built.length && <Text style={{ color: t.muted, padding: 8 }}>Tap the words below in order.</Text>}
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
        {tiles.map((i) => (
          <Pressable key={i} disabled={built.includes(i) || checked !== null} onPress={() => setBuilt([...built, i])} style={[tileStyle, { opacity: built.includes(i) ? 0 : 1 }]}>
            <Text style={{ color: t.ink, fontFamily: READ_FONT, fontSize: 18 }}>{words[i]!.surface}</Text>
          </Pressable>
        ))}
      </View>
      {checked === null ? (
        <Button kind="primary" label="Check" disabled={built.length !== words.length} onPress={() => {
          const ok = join(built.map((i) => words[i]!.surface)) === join(words.map((w) => w.surface));
          setChecked(ok);
          if (ok) setScore((s) => s + 1);
          playSentenceAny(cur.story.id, lang, cur.i, textOf(cur.story, cur.s));
        }} />
      ) : (
        <>
          <Text style={{ color: t.ink }}><Text style={{ fontWeight: "800" }}>{checked ? "Correct!" : "Not quite."}</Text>{checked ? "" : ` ${textOf(cur.story, cur.s)}`}</Text>
          <Button kind="primary" label={n + 1 >= rounds.length ? "See result" : "Next"} onPress={() => {
            if (n + 1 >= rounds.length) learner.recordGame("order", Math.round((score / rounds.length) * 100));
            setN(n + 1); setBuilt([]); setChecked(null);
          }} />
        </>
      )}
    </Card>
  );
}

// ── Listening ──
function Listen({ lang }: { lang: LangCode }) {
  const t = useTheme();
  const sentences = useSentences(lang);
  const learner = useLearner(lang);
  const [game, setGame] = useState(0);
  const rounds = useFrozen(() => shuffle(sentences).slice(0, ROUNDS), `listen-${game}`);
  const [n, setN] = useState(0);
  const [score, setScore] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const cur = rounds[n];
  const options = useFrozen(() => {
    if (!cur) return [];
    const others = shuffle(sentences.filter((x) => textOf(x.story, x.s) !== textOf(cur.story, cur.s))).slice(0, 2);
    return shuffle([cur, ...others]);
  }, `listen-${game}-${n}`);
  const play = () => cur && playSentenceAny(cur.story.id, lang, cur.i, textOf(cur.story, cur.s), (learner.level ?? 0) === 0 ? 0.85 : 1);
  useEffect(() => { if (cur) play(); }, [cur]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!cur) {
    if (rounds.length) return <Done score={score} total={rounds.length} onAgain={() => { setGame((g) => g + 1); setN(0); setScore(0); setChosen(null); }} />;
    return <Card><Text style={{ color: t.muted }}>No sentences to practice yet.</Text></Card>;
  }
  return (
    <Card>
      <Text style={{ color: t.muted, fontSize: 12.5 }}>Question {n + 1} of {rounds.length} · What did you hear?</Text>
      <Pressable onPress={play} accessibilityLabel="Play the sentence again"
        style={{ alignSelf: "center", width: 80, height: 80, borderRadius: 40, backgroundColor: t.primary, alignItems: "center", justifyContent: "center" }}>
        <Icon name="volume-high" color="#fff" size={34} />
      </Pressable>
      {options.map((o, k) => {
        const isRight = o.story.id === cur.story.id && o.i === cur.i;
        return <Choice key={k} lang={lang} label={textOf(o.story, o.s)} disabled={chosen !== null}
          state={chosen !== null && isRight ? "ok" : chosen === k && !isRight ? "no" : undefined}
          onPress={() => { setChosen(k); if (isRight) setScore((s) => s + 1); }} />;
      })}
      {chosen !== null && (
        <>
          {!!cur.s.translation && <Text style={{ color: t.muted }}>{cur.s.translation}</Text>}
          <Button kind="primary" label={n + 1 >= rounds.length ? "See result" : "Next"} onPress={() => {
            if (n + 1 >= rounds.length) learner.recordGame("listen", Math.round((score / rounds.length) * 100));
            setN(n + 1); setChosen(null);
          }} />
        </>
      )}
    </Card>
  );
}

// ── Level test ──
function LevelTest({ lang }: { lang: LangCode }) {
  const t = useTheme();
  const meta = language(lang);
  const learner = useLearner(lang);
  const stories = useStories(lang);
  const [level, setLevel] = useState<string | null>(null);
  const [game, setGame] = useState(0);
  const pool = usePool(lang, level ?? undefined);
  const questions = useFrozen(() => {
    if (!level) return [];
    const meanings = [...new Set(pool.map((p) => p.meaning))];
    return shuffle(pool).slice(0, 10).map((p) => ({ p, options: shuffle([p.meaning, ...shuffle(meanings.filter((m) => m !== p.meaning)).slice(0, 3)]) }));
  }, `test-${level}-${game}`);
  const [n, setN] = useState(0);
  const [score, setScore] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);

  if (!level) {
    return (
      <Card>
        <Text style={{ color: t.ink }}>Choose a level. You get 10 questions on words from that level's stories.</Text>
        {meta.levels.map((l) => {
          const count = stories.filter((s) => s.level === l && !isUserStory(s)).length;
          const best = learner.games[`test-${l}`];
          return <Choice key={l} label={`${l} · ${count} stories${best ? ` · best ${best.best}%` : ""}`} disabled={!count} onPress={() => setLevel(l)} />;
        })}
      </Card>
    );
  }
  const q = questions[n];
  if (!q) return <Done score={score} total={questions.length} note={`Level ${level}.`} onAgain={() => { setGame((g) => g + 1); setN(0); setScore(0); setChosen(null); }} />;
  const ctx: Sentence | undefined = q.p.story.sentences[q.p.sentence];
  const ctxText = ctx ? textOf(q.p.story, ctx) : "";
  const parts = ctx ? highlight(ctxText, ctx.tokens.find((tk) => tk.lemma === q.p.lemma)?.surface ?? q.p.display) : null;
  return (
    <Card>
      <Text style={{ color: t.muted, fontSize: 12.5 }}>{level} · question {n + 1} of {questions.length} · {score} correct</Text>
      <View style={{ flexDirection: "row", gap: 3 }}>
        {questions.map((_, i) => <View key={i} style={{ flex: 1, height: 5, borderRadius: 9, backgroundColor: i < n ? t.newWord : t.surface2 }} />)}
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Text style={{ color: t.ink, fontFamily: READ_FONT, fontSize: 34 }}>{q.p.display}</Text>
        <Pressable onPress={() => playWordAny(lang, q.p.lemma, q.p.display)} hitSlop={8} accessibilityLabel="Hear the word"><Icon name="volume-high" /></Pressable>
      </View>
      {parts && <Text style={{ color: t.muted, fontFamily: READ_FONT, fontSize: 16 }}>{parts[0]}<Text style={{ color: t.ink, backgroundColor: t.learningSoft }}>{parts[1]}</Text>{parts[2]}</Text>}
      {q.options.map((o) => (
        <Choice key={o} label={o} disabled={chosen !== null}
          state={chosen !== null && o === q.p.meaning ? "ok" : chosen === o && o !== q.p.meaning ? "no" : undefined}
          onPress={() => {
            setChosen(o);
            if (o === q.p.meaning) setScore((s) => s + 1);
            else learner.setWord(q.p.lemma, "learning", { storyId: q.p.story.id, sentence: q.p.sentence });
          }} />
      ))}
      {chosen !== null && (
        <>
          <Text style={{ color: t.muted }}>{chosen === q.p.meaning ? "Correct!" : "Saved to your notebook for review."}</Text>
          <Button kind="primary" label={n + 1 >= questions.length ? "See result" : "Next"} onPress={() => {
            if (n + 1 >= questions.length) learner.recordGame(`test-${level}`, Math.round((score / questions.length) * 100));
            setN(n + 1); setChosen(null);
          }} />
        </>
      )}
    </Card>
  );
}
