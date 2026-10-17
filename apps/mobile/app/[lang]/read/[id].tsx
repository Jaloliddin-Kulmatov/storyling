import { language, lookup, stories } from "@storyling/content";
import { coverage, FIT_LABEL } from "@storyling/core";
import { useLearner } from "@storyling/learner";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { hasStoryAudio, playSentence, playWord, stopAudio } from "../../../src/audio";
import { READ_FONT, reading, useTheme } from "../../../src/theme";

const PUNCT = /^[\p{P}\p{S}]+$/u;
const ENCOUNTER_GOAL = 10;

export default function ReaderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const story = stories.find((s) => s.id === id);
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const learner = useLearner(story?.lang ?? "en");

  const [selected, setSelected] = useState<{ si: number; ti: number } | null>(null);
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const [toast, setToast] = useState<string | null>(null);
  const tapped = useRef(new Set<string>());
  const runRef = useRef(0);

  useEffect(() => () => stopAudio(), []);

  if (!story) return <Redirect href="/" />;
  if (!learner.started) return <Redirect href={`/${story.lang}`} />;

  const lang = story.lang;
  const meta = language(lang);
  const cov = coverage(story, learner.pKnown);
  const token = selected ? story.sentences[selected.si]?.tokens[selected.ti] : undefined;
  const entry = token?.lemma ? lookup(lang, token.lemma) : undefined;
  const userWord = token?.lemma ? learner.word(token.lemma) : undefined;

  async function playFrom(index: number) {
    const run = ++runRef.current;
    setPlaying(true);
    for (let i = index; i < story!.sentences.length; i++) {
      if (run !== runRef.current) return;
      setCurrent(i);
      if (!(await playSentence(story!.id, i, rate))) break;
    }
    if (run === runRef.current) setPlaying(false);
  }

  function pause() {
    runRef.current++;
    stopAudio();
    setPlaying(false);
  }

  function finish() {
    pause();
    const r = learner.finishStory(story!, tapped.current);
    setToast(`${r.newlyKnown} word${r.newlyKnown === 1 ? "" : "s"} moved to known${r.reviewedInStory ? ` · ${r.reviewedInStory} reviewed while reading` : ""}`);
    setTimeout(() => router.back(), 1400);
  }

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: t.surface }}>
      <View style={[styles.header, { borderColor: t.line }]}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Back" style={styles.icon}>
          <Text style={{ color: t.ink, fontSize: 22 }}>‹</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ color: t.ink, fontSize: 16, fontFamily: READ_FONT }} numberOfLines={1}>{story.title}</Text>
          <Text style={{ color: t.muted, fontSize: 11.5 }}>{meta.name} · {FIT_LABEL[cov.fit]} · {cov.percent}% known</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 260 }}>
        {story.sentences.map((sentence, si) => (
          <Text
            key={si}
            style={[
              styles.sentence,
              { color: t.ink, fontFamily: READ_FONT, fontSize: reading.phone.size, lineHeight: reading.phone.size * reading.phone.lineHeight },
              playing && current === si && { backgroundColor: t.primarySoft },
            ]}
          >
            {sentence.tokens.map((tk, ti) => {
              const space = ti > 0 && !meta.noSpace && !PUNCT.test(tk.surface) ? " " : "";
              if (!tk.lemma) return <Text key={ti}>{tk.surface}</Text>;
              const lemma = tk.lemma;
              const state = learner.wordState(lemma);
              const isSel = selected?.si === si && selected.ti === ti;
              const look =
                state === "new"
                  ? { backgroundColor: t.newWordSoft, textDecorationLine: "underline" as const, textDecorationColor: t.newWord }
                  : state === "learning"
                    ? { backgroundColor: t.learningSoft }
                    : null;
              return (
                <Text key={ti}>
                  {space}
                  <Text
                    onPress={() => {
                      setSelected({ si, ti });
                      tapped.current.add(lemma);
                    }}
                    accessibilityRole="button"
                    style={[look, isSel && { color: t.primary, fontWeight: "600" }]}
                  >
                    {tk.surface}
                  </Text>
                </Text>
              );
            })}
          </Text>
        ))}
        <Pressable onPress={finish} accessibilityRole="button" style={[styles.primary, { backgroundColor: t.primary, marginTop: 24 }]}>
          <Text style={styles.primaryText}>Finish story</Text>
        </Pressable>
      </ScrollView>

      {hasStoryAudio(story.id) && !entry && (
        <View style={[styles.player, { backgroundColor: t.surface, borderColor: t.line, paddingBottom: insets.bottom + 10 }]}>
          <Pressable accessibilityLabel="Previous sentence" onPress={() => { const i = Math.max(0, current - 1); setCurrent(i); if (playing) void playFrom(i); }} style={[styles.round, { borderColor: t.line }]}>
            <Text style={{ color: t.ink }}>⏮</Text>
          </Pressable>
          <Pressable accessibilityLabel={playing ? "Pause" : "Play"} onPress={() => (playing ? pause() : void playFrom(current))} style={[styles.play, { backgroundColor: t.primary }]}>
            <Text style={{ color: "#fff", fontSize: 18 }}>{playing ? "❚❚" : "▶"}</Text>
          </Pressable>
          <Pressable accessibilityLabel="Next sentence" onPress={() => { const i = Math.min(story.sentences.length - 1, current + 1); setCurrent(i); if (playing) void playFrom(i); }} style={[styles.round, { borderColor: t.line }]}>
            <Text style={{ color: t.ink }}>⏭</Text>
          </Pressable>
          <Text style={{ flex: 1, color: t.muted, fontSize: 12 }}>{current + 1} / {story.sentences.length} · Computer voice</Text>
          <Pressable accessibilityLabel={`Speed ${rate === 1 ? "1" : "0.75"} times. Tap to change`} onPress={() => setRate((r) => (r === 1 ? 0.75 : 1))} style={[styles.round, { borderColor: t.line, width: 56 }]}>
            <Text style={{ color: t.ink, fontWeight: "700" }}>{rate}×</Text>
          </Pressable>
        </View>
      )}

      {entry && token?.lemma && (
        <View style={[styles.sheet, { backgroundColor: t.surface, paddingBottom: insets.bottom + 18 }]}>
          <View style={[styles.grab, { backgroundColor: t.line }]} />
          <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: t.ink, fontSize: 32, fontFamily: READ_FONT }}>{entry.display}</Text>
              <Text style={{ color: t.muted, fontSize: 12 }}>
                {entry.reading ? `${entry.reading} · ` : ""}{entry.pos}{token.surface !== entry.display ? ` · in text: ${token.surface}` : ""}
              </Text>
            </View>
            <Pressable accessibilityLabel="Hear the word" onPress={() => playWord(lang, entry.lemma)} style={[styles.play, { backgroundColor: t.primary }]}>
              <Text style={{ color: "#fff", fontSize: 16 }}>▶</Text>
            </Pressable>
            <Pressable accessibilityLabel="Close" onPress={() => setSelected(null)} style={[styles.round, { borderColor: t.line }]}>
              <Text style={{ color: t.ink }}>✕</Text>
            </Pressable>
          </View>
          <Text style={{ color: t.ink, fontSize: 18, fontWeight: "700" }}>{entry.meaning}</Text>
          <View style={{ gap: 5 }}>
            <Text style={{ color: t.muted, fontSize: 12 }}>Met in stories: {Math.min(userWord?.encounters ?? 0, ENCOUNTER_GOAL)} of about {ENCOUNTER_GOAL}</Text>
            <View style={{ flexDirection: "row", gap: 3 }}>
              {Array.from({ length: ENCOUNTER_GOAL }, (_, i) => (
                <View key={i} style={{ flex: 1, height: 6, borderRadius: 9, backgroundColor: i < (userWord?.encounters ?? 0) ? t.newWord : t.surface2 }} />
              ))}
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {(["learning", "known", "ignored"] as const).map((choice) => {
              const on = learner.wordState(token.lemma!) === choice;
              return (
                <Pressable
                  key={choice}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  onPress={() => learner.setWord(token.lemma!, on ? undefined : choice)}
                  style={[styles.choice, { borderColor: on ? t.learning : t.line, backgroundColor: on ? t.learning : t.surface2 }]}
                >
                  <Text style={{ color: on ? "#fff" : t.ink, fontWeight: "700" }}>
                    {choice === "learning" ? "Review" : choice === "known" ? "Known" : "Ignore"}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {!!story.sentences[selected!.si]?.translation && (
            <Text style={{ color: t.inkSoft, fontSize: 14, backgroundColor: t.surface2, borderRadius: 12, padding: 12, overflow: "hidden" }}>
              {story.sentences[selected!.si]!.translation}
            </Text>
          )}
        </View>
      )}

      {toast && (
        <View style={[styles.toast, { backgroundColor: t.ink, bottom: insets.bottom + 90 }]} accessibilityLiveRegion="polite">
          <Text style={{ color: t.bg }}>{toast}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 8, paddingVertical: 6, borderBottomWidth: 1 },
  icon: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  sentence: { marginBottom: 10, borderRadius: 8 },
  primary: { minHeight: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  primaryText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  player: { position: "absolute", left: 0, right: 0, bottom: 0, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingTop: 10, borderTopWidth: 1 },
  round: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  play: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  sheet: { position: "absolute", left: 0, right: 0, bottom: 0, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 20, paddingTop: 10, gap: 12, shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 20, elevation: 16 },
  grab: { width: 40, height: 5, borderRadius: 99, alignSelf: "center", marginBottom: 4 },
  choice: { flex: 1, minHeight: 48, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  toast: { position: "absolute", alignSelf: "center", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 11 },
});
