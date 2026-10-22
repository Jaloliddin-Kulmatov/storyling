import { Ionicons } from "@expo/vector-icons";
import { language } from "@storyling/content";
import type { LangCode, Token } from "@storyling/core";
import { isUserStory, lookupIn, PUNCT, shuffle, textOf, useLearner, useRankedStories, useSettings, useStory, type AnyStory } from "@storyling/learner";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppState, Linking, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { hasStoryAudio, playSentenceAny, playWordAny, stopAll } from "../../../src/audio";
import { READ_FONT, reading, useTheme } from "../../../src/theme";
import { Button, Cover, Icon, LevelPill, topicLabel } from "../../../src/ui";

const RATES = [0.75, 1, 1.25];
const READING_TOPICS = new Set(["history", "people", "nature", "science", "culture"]);

interface Picked {
  lemma: string;
  surface: string;
  sentence: number;
}

export default function ReaderScreen() {
  const { lang, id } = useLocalSearchParams<{ lang: LangCode; id: string }>();
  const story = useStory(lang, id);
  const t = useTheme();
  const router = useRouter();
  if (!story) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg, padding: 24, gap: 12 }}>
        <Text style={{ color: t.ink, fontSize: 22, fontWeight: "800" }}>Story not found</Text>
        <Button label="Back" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }
  return <StoryReader key={story.id} story={story} />;
}

function StoryReader({ story }: { story: AnyStory }) {
  const lang = story.lang;
  const meta = language(lang);
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const learner = useLearner(lang);
  const [settings, setSettings] = useSettings();
  const [picked, setPicked] = useState<Picked | null>(null);
  const [shown, setShown] = useState<Set<number>>(() => new Set());
  const [playing, setPlaying] = useState<number | null>(null);
  const [cursor, setCursor] = useState(0);
  const [showText, setShowText] = useState(false);
  const tapped = useRef(new Set<string>());
  const run = useRef(0);
  const scroll = useRef<ScrollView>(null);
  const offsets = useRef<number[]>([]);
  const size = reading.phone.size * settings.fontScale;

  useEffect(() => () => stopAll(), []);

  // Count reading time while the app is in the foreground.
  const { addTime } = learner;
  useEffect(() => {
    const timer = setInterval(() => {
      if (AppState.currentState === "active") addTime(15);
    }, 15000);
    return () => clearInterval(timer);
  }, [addTime]);

  async function playFrom(from: number) {
    const mine = ++run.current;
    for (let i = from; i < story.sentences.length; i++) {
      setPlaying(i);
      setCursor(i);
      const y = offsets.current[i];
      if (y !== undefined) scroll.current?.scrollTo({ y: Math.max(0, y - 120), animated: true });
      const ok = await playSentenceAny(story.id, lang, i, textOf(story, story.sentences[i]!), settings.rate);
      if (mine !== run.current) return;
      if (!ok) break;
    }
    setPlaying(null);
  }
  function stop() {
    run.current++;
    stopAll();
    setPlaying(null);
  }
  function pick(tk: Token, sentence: number) {
    if (!tk.lemma) return;
    setPicked({ lemma: tk.lemma, surface: tk.surface, sentence });
    tapped.current.add(tk.lemma);
    playWordAny(lang, tk.lemma, tk.surface);
  }

  const saved = learner.favorites.includes(story.id);
  const words = story.sentences.reduce((n, x) => n + x.tokens.filter((tk) => tk.lemma).length, 0);

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: t.surface }}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, borderBottomWidth: 1, borderColor: t.line, gap: 4 }}>
        <Pressable onPress={() => router.back()} hitSlop={8} accessibilityRole="button" accessibilityLabel="Back" style={{ padding: 6 }}>
          <Icon name="chevron-back" size={24} />
        </Pressable>
        <Text style={{ flex: 1, color: t.ink, fontFamily: READ_FONT, fontSize: 16 }} numberOfLines={1}>{story.title}</Text>
        <Pressable onPress={() => setShowText((v) => !v)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Text settings" style={{ padding: 6 }}>
          <Icon name="text" />
        </Pressable>
        <Pressable onPress={() => learner.toggleFavorite(story.id)} hitSlop={8} accessibilityRole="button" accessibilityLabel={saved ? "Remove from saved" : "Save story"} style={{ padding: 6 }}>
          <Icon name={saved ? "bookmark" : "bookmark-outline"} color={saved ? t.primary : t.ink} />
        </Pressable>
      </View>

      {showText && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, padding: 12, borderBottomWidth: 1, borderColor: t.line, backgroundColor: t.bg }}>
          <Toggle label="A−" on={false} onPress={() => setSettings({ fontScale: Math.max(0.85, +(settings.fontScale - 0.1).toFixed(2)) })} />
          <Toggle label="A+" on={false} onPress={() => setSettings({ fontScale: Math.min(1.4, +(settings.fontScale + 0.1).toFixed(2)) })} />
          <Toggle label="Translation" on={settings.showTranslations} onPress={() => setSettings({ showTranslations: !settings.showTranslations })} />
          <Toggle label="Highlights" on={settings.highlightNew} onPress={() => setSettings({ highlightNew: !settings.highlightNew })} />
        </View>
      )}

      <ScrollView ref={scroll} contentContainerStyle={{ paddingBottom: 240 }}>
        <Cover story={story} style={{ height: 200 }} />
        <View style={{ padding: 20 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <LevelPill level={story.level} />
            <Text style={{ color: t.muted, fontSize: 12.5 }}>{topicLabel(story)} · {words} words · {story.minutes} min</Text>
          </View>
          <Text style={{ color: t.ink, fontFamily: READ_FONT, fontSize: 30, marginTop: 8 }}>{story.title}</Text>
          {!!story.titleEnglish && <Text style={{ color: t.muted, marginTop: 2 }}>{story.titleEnglish}</Text>}

          <View style={{ marginTop: 16 }}>
            {story.sentences.map((s, i) => (
              <View key={i} onLayout={(e) => (offsets.current[i] = e.nativeEvent.layout.y + 260)}
                style={{ borderRadius: 10, paddingHorizontal: 6, marginHorizontal: -6, marginBottom: 6, backgroundColor: playing === i ? t.primarySoft : "transparent" }}>
                <Text style={{ color: t.ink, fontFamily: READ_FONT, fontSize: size, lineHeight: size * reading.phone.lineHeight }}>
                  {s.tokens.map((tk, j) => {
                    const space = !meta.noSpace && j > 0 && !PUNCT.test(tk.surface) ? " " : "";
                    if (!tk.lemma) return <Text key={j}>{space}{tk.surface}</Text>;
                    const lemma = tk.lemma;
                    const ws = tk.isName ? "known" : learner.wordState(lemma);
                    const state = ws === "learning" && learner.word(lemma)?.saved !== "learning" ? "new" : ws;
                    const sel = picked?.lemma === lemma && picked.sentence === i;
                    const look = !settings.highlightNew ? null
                      : state === "new" ? { backgroundColor: t.newWordSoft, textDecorationLine: "underline" as const, textDecorationColor: t.newWord }
                        : state === "learning" ? { backgroundColor: t.learningSoft } : null;
                    return (
                      <Text key={j}>
                        {space}
                        <Text onPress={() => pick(tk, i)} accessibilityRole="button" style={[look, sel && { color: t.primary, fontWeight: "700" }]}>{tk.surface}</Text>
                      </Text>
                    );
                  })}
                  {"  "}
                  <Ionicons name="volume-medium-outline" size={size * 0.8} color={t.muted} onPress={() => (playing === i ? stop() : playFrom(i))} accessibilityLabel={`Play sentence ${i + 1}`} />
                  {!!s.translation && !settings.showTranslations && (
                    <Text>{"  "}<Ionicons name="language-outline" size={size * 0.8} color={shown.has(i) ? t.primary : t.muted}
                      onPress={() => setShown((x) => { const n = new Set(x); if (n.has(i)) n.delete(i); else n.add(i); return n; })} accessibilityLabel={`Translate sentence ${i + 1}`} /></Text>
                  )}
                </Text>
                {!!s.translation && (settings.showTranslations || shown.has(i)) && (
                  <Text style={{ color: t.muted, fontSize: 14.5, borderLeftWidth: 3, borderColor: t.primarySoft, paddingLeft: 8, marginBottom: 4 }}>{s.translation}</Text>
                )}
              </View>
            ))}
          </View>

          <Finish story={story} tapped={tapped.current} />
          <WatchMore story={story} />
        </View>
      </ScrollView>

      {picked && <WordSheet story={story} picked={picked} onClose={() => setPicked(null)} bottom={insets.bottom + 76} />}

      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: t.surface, borderTopWidth: 1, borderColor: t.line, paddingHorizontal: 14, paddingTop: 10, paddingBottom: insets.bottom + 10, flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Pressable onPress={() => playFrom(Math.max(0, (playing ?? cursor) - 1))} accessibilityLabel="Previous sentence" hitSlop={8}><Icon name="play-skip-back" /></Pressable>
        <Pressable onPress={() => (playing !== null ? stop() : playFrom(cursor >= story.sentences.length - 1 && cursor > 0 ? 0 : cursor))} accessibilityLabel={playing !== null ? "Pause" : "Play"}
          style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: t.primary, alignItems: "center", justifyContent: "center" }}>
          <Icon name={playing !== null ? "pause" : "play"} color="#fff" size={22} />
        </Pressable>
        <Pressable onPress={() => playFrom(Math.min(story.sentences.length - 1, (playing ?? cursor) + 1))} accessibilityLabel="Next sentence" hitSlop={8}><Icon name="play-skip-forward" /></Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ color: t.muted, fontSize: 11.5 }}>Sentence {(playing ?? cursor) + 1} of {story.sentences.length} · {hasStoryAudio(story.id) ? "Recorded" : "Device voice"}</Text>
          <View style={{ height: 4, borderRadius: 99, backgroundColor: t.surface2, marginTop: 5, overflow: "hidden" }}>
            <View style={{ height: 4, width: `${(((playing ?? cursor) + 1) / story.sentences.length) * 100}%`, backgroundColor: t.primary }} />
          </View>
        </View>
        <Pressable onPress={() => setSettings({ rate: RATES[(RATES.indexOf(settings.rate) + 1) % RATES.length] ?? 1 })} accessibilityLabel="Change speed"
          style={{ borderWidth: 1, borderColor: t.line, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 5 }}>
          <Text style={{ color: t.ink, fontWeight: "700", fontSize: 13 }}>{settings.rate}×</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function Toggle({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: on }}
      style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 99, borderWidth: 1, borderColor: on ? t.ink : t.line, backgroundColor: on ? t.ink : t.surface }}>
      <Text style={{ color: on ? t.bg : t.ink, fontWeight: "600" }}>{label}</Text>
    </Pressable>
  );
}

function WordSheet({ story, picked, onClose, bottom }: { story: AnyStory; picked: Picked; onClose: () => void; bottom: number }) {
  const t = useTheme();
  const lang = story.lang;
  const learner = useLearner(lang);
  const entry = lookupIn(story, picked.lemma);
  const w = learner.word(picked.lemma);
  const ws = learner.wordState(picked.lemma);
  const state = ws === "learning" && w?.saved !== "learning" ? "new" : ws;
  const seen = Math.min(10, w?.encounters ?? 0);
  const sentence = story.sentences[picked.sentence];
  const btn = (label: string, on: boolean, color: string, onPress: () => void) => (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: on }}
      style={{ flex: 1, minHeight: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: on ? color : t.line, backgroundColor: on ? color : t.surface2 }}>
      <Text style={{ color: on ? "#fff" : t.ink, fontWeight: "700" }}>{label}</Text>
    </Pressable>
  );
  return (
    <View style={{ position: "absolute", left: 10, right: 10, bottom, backgroundColor: t.surface, borderRadius: 22, borderWidth: 1, borderColor: t.line, padding: 16, gap: 10,
      shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 18, shadowOffset: { width: 0, height: 6 }, elevation: 10 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ color: t.muted, fontSize: 11.5, fontWeight: "700", letterSpacing: 0.8 }}>{(entry?.pos ?? "word").toUpperCase()}</Text>
        <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Close"><Icon name="close" /></Pressable>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Text style={{ color: t.ink, fontFamily: READ_FONT, fontSize: 30 }}>{entry?.display ?? picked.lemma}</Text>
        <Pressable onPress={() => playWordAny(lang, picked.lemma, picked.surface)} accessibilityLabel="Hear the word"
          style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: t.line, alignItems: "center", justifyContent: "center" }}>
          <Icon name="volume-high" size={18} />
        </Pressable>
      </View>
      {!!entry?.reading && <Text style={{ color: t.muted }}>{entry.reading}</Text>}
      <Text style={{ color: t.ink, fontSize: 18, fontWeight: "600" }}>{entry?.meaning ?? "No meaning in the dictionary yet."}</Text>
      {picked.surface !== (entry?.display ?? picked.lemma) && <Text style={{ color: t.muted, fontSize: 13 }}>In the text: {picked.surface}</Text>}
      <View style={{ flexDirection: "row", gap: 3 }}>
        {Array.from({ length: 10 }, (_, i) => <View key={i} style={{ flex: 1, height: 5, borderRadius: 9, backgroundColor: i < seen ? t.newWord : t.surface2 }} />)}
      </View>
      <Text style={{ color: t.muted, fontSize: 12 }}>Seen {w?.encounters ?? 0}× in stories</Text>
      <View style={{ flexDirection: "row", gap: 6 }}>
        {btn("Review", state === "learning", t.learning, () => learner.setWord(picked.lemma, state === "learning" ? undefined : "learning", { storyId: story.id, sentence: picked.sentence }))}
        {btn("Known", state === "known", t.primary, () => learner.setWord(picked.lemma, "known"))}
        {btn("Ignore", state === "ignored", t.muted, () => learner.setWord(picked.lemma, state === "ignored" ? undefined : "ignored"))}
      </View>
      {!!sentence?.translation && <Text style={{ color: t.inkSoft, backgroundColor: t.surface2, borderRadius: 10, padding: 10 }}>{sentence.translation}</Text>}
    </View>
  );
}

interface Question {
  lemma: string;
  word: string;
  sentence: number;
  options: string[];
  answer: string;
}

function makeQuiz(story: AnyStory, tapped: Set<string>, isNew: (l: string) => boolean): Question[] {
  const seen = new Set<string>();
  const items: { lemma: string; surface: string; sentence: number; meaning: string }[] = [];
  story.sentences.forEach((s, i) =>
    s.tokens.forEach((tk) => {
      if (!tk.lemma || tk.isName || seen.has(tk.lemma)) return;
      const m = lookupIn(story, tk.lemma)?.meaning;
      if (!m) return;
      seen.add(tk.lemma);
      items.push({ lemma: tk.lemma, surface: tk.surface, sentence: i, meaning: m });
    }),
  );
  const meanings = [...new Set(items.map((i) => i.meaning))];
  if (meanings.length < 4) return [];
  const rank = (l: string) => (tapped.has(l) ? 0 : isNew(l) ? 1 : 2);
  return shuffle(items).sort((a, b) => rank(a.lemma) - rank(b.lemma)).slice(0, 3).map((it) => ({
    lemma: it.lemma,
    word: it.surface,
    sentence: it.sentence,
    answer: it.meaning,
    options: shuffle([it.meaning, ...shuffle(meanings.filter((m) => m !== it.meaning)).slice(0, 3)]),
  }));
}

function Finish({ story, tapped }: { story: AnyStory; tapped: Set<string> }) {
  const t = useTheme();
  const lang = story.lang;
  const learner = useLearner(lang);
  const ranked = useRankedStories(lang);
  const router = useRouter();
  const [quiz, setQuiz] = useState<Question[] | null>(null);
  const [step, setStep] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [right, setRight] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const next = useMemo(() => ranked.find((r) => !r.read && r.story.id !== story.id && !isUserStory(r.story)), [ranked, story.id]);

  function finish(score?: { right: number; total: number }) {
    const r = learner.finishStory(story, tapped);
    if (score) learner.recordQuiz(score.right, score.total);
    const parts = ["Story finished"];
    if (r.newlyKnown) parts.push(`${r.newlyKnown} new ${r.newlyKnown === 1 ? "word" : "words"} known`);
    if (r.reviewedInStory) parts.push(`${r.reviewedInStory} reviewed`);
    setResult(parts.join(" · "));
  }

  const box = { marginTop: 26, paddingTop: 18, borderTopWidth: 1, borderColor: t.line, gap: 12 } as const;

  if (result) {
    return (
      <View style={box}>
        <Text style={{ color: t.ink, fontSize: 22, fontWeight: "800" }}>Well done!</Text>
        <Text style={{ color: t.muted }}>{result}</Text>
        {next && <Button kind="primary" label={`Next: ${next.story.title}`} onPress={() => router.replace(`/${lang}/read/${next.story.id}`)} />}
        <Button label="Practice words" onPress={() => router.push(`/${lang}/practice`)} />
      </View>
    );
  }
  if (!quiz) {
    return (
      <View style={box}>
        <Text style={{ color: t.ink, fontWeight: "800", fontSize: 16 }}>Finished reading?</Text>
        <Text style={{ color: t.muted }}>A quick check helps the words stick.</Text>
        <Button kind="primary" label="Quick check" onPress={() => {
          const q = makeQuiz(story, tapped, (l) => learner.wordState(l) === "new");
          if (q.length) setQuiz(q); else finish();
        }} />
        <Button label="Mark as read" onPress={() => finish()} />
      </View>
    );
  }
  const q = quiz[step]!;
  const answered = chosen !== null;
  return (
    <View style={[box, { backgroundColor: t.surface2, borderRadius: 18, padding: 16, borderTopWidth: 0 }]}>
      <Text style={{ color: t.muted, fontSize: 12.5 }}>Question {step + 1} of {quiz.length} · What does it mean?</Text>
      <Text style={{ color: t.ink, fontFamily: READ_FONT, fontSize: 28 }}>{q.word}</Text>
      {q.options.map((o) => {
        const ok = answered && o === q.answer;
        const no = answered && o === chosen && o !== q.answer;
        return (
          <Pressable key={o} disabled={answered} accessibilityRole="button"
            onPress={() => {
              setChosen(o);
              if (o === q.answer) setRight((n) => n + 1);
              else learner.setWord(q.lemma, "learning", { storyId: story.id, sentence: q.sentence });
            }}
            style={{ borderWidth: 2, borderRadius: 12, padding: 12, borderColor: ok ? t.primary : no ? t.danger : t.line, backgroundColor: ok ? t.primarySoft : no ? t.dangerSoft : t.surface }}>
            <Text style={{ color: t.ink, fontWeight: "600" }}>{o}</Text>
          </Pressable>
        );
      })}
      {answered && (
        <>
          <Text style={{ color: t.ink }}>{chosen === q.answer ? "Correct!" : "Not quite. Saved for review."}</Text>
          <Button kind="primary" label={step + 1 < quiz.length ? "Next" : "Finish"} onPress={() => {
            if (step + 1 < quiz.length) { setStep(step + 1); setChosen(null); }
            else finish({ right, total: quiz.length });
          }} />
        </>
      )}
    </View>
  );
}

function WatchMore({ story }: { story: AnyStory }) {
  const t = useTheme();
  const router = useRouter();
  const meta = language(story.lang);
  const topic = isUserStory(story) ? "mine" : story.topic;
  const query = READING_TOPICS.has(topic) ? `${story.title} ${meta.native}` : `${meta.name} ${topicLabel(story)} vocabulary for learners`;
  return (
    <View style={{ marginTop: 18, backgroundColor: t.surface2, borderRadius: 16, padding: 14, gap: 8 }}>
      <Text style={{ color: t.muted, fontSize: 11.5, fontWeight: "700", letterSpacing: 0.8 }}>WATCH AND LISTEN</Text>
      <Text style={{ color: t.ink }}>Hear real speakers talk about this topic.</Text>
      <Button icon="logo-youtube" label={`Videos about ${story.titleEnglish || story.title}`} onPress={() => Linking.openURL(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`)} />
              <Pressable onPress={() => router.push(`/${story.lang}/watch`)} accessibilityRole="link"><Text style={{ color: t.primary, fontWeight: "700", textAlign: "center", padding: 6 }}>{meta.name} videos for learners</Text></Pressable>
      
    </View>
  );
}
