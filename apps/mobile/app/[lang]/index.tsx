import { language, languages, storiesFor } from "@storyling/content";
import { coverage, FIT_LABEL, recommend, type Fit, type LangCode } from "@storyling/core";
import { useLearner, type Level } from "@storyling/learner";
import { Link, Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { READ_FONT, useTheme, type Theme } from "../../src/theme";

const LEVELS: { level: Level; title: string; detail: (first: string) => string }[] = [
  { level: 0, title: "Just starting", detail: () => "I know a few words and can read the script." },
  { level: 1, title: "Some basics", detail: (first) => `Simple sentences are OK. Around ${first}.` },
  { level: 2, title: "Intermediate", detail: (first) => `${first} stories feel easy.` },
];

function fitColors(t: Theme, fit: Fit) {
  if (fit === "easy") return { bg: t.primarySoft, fg: t.primary };
  if (fit === "just_right") return { bg: t.primary, fg: "#fff" };
  if (fit === "stretch") return { bg: t.newWordSoft, fg: t.ink };
  return { bg: t.dangerSoft, fg: t.danger };
}

export default function Library() {
  const { lang: param } = useLocalSearchParams<{ lang: string }>();
  const t = useTheme();
  const router = useRouter();
  const valid = languages.some((l) => l.code === param);
  const lang = (valid ? param : "en") as LangCode;
  const learner = useLearner(lang);
  const meta = language(lang);

  const ranked = useMemo(() => {
    const all = storiesFor(lang);
    const candidates = all.map((s) => ({
      id: s.id,
      coverage: coverage(s, learner.pKnown),
      continuesSeries: false,
      interestMatch: 0,
      dueWordsInside: 0,
      ageDays: 0,
      recentlyAbandoned: false,
      finished: learner.finished.includes(s.id),
    }));
    const ids = [...recommend(candidates, candidates.length).map((c) => c.id), ...candidates.filter((c) => c.finished).map((c) => c.id)];
    return ids.map((id) => ({ story: all.find((s) => s.id === id)!, c: candidates.find((x) => x.id === id)! }));
  }, [lang, learner.pKnown, learner.finished]);

  if (!valid) return <Redirect href="/" />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.top}>
          <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Change language" style={[styles.pill, { borderColor: t.line, backgroundColor: t.surface }]}>
            <Text style={{ color: t.ink, fontSize: 16, fontFamily: READ_FONT }}>{meta.native}</Text>
            <Text style={{ color: t.muted, fontWeight: "600" }}> · Change</Text>
          </Pressable>
        </View>

        {!learner.started ? (
          <View style={{ gap: 12 }}>
            <Text style={[styles.h1, { color: t.ink }]} accessibilityRole="header">How much {meta.name} do you know?</Text>
            <Text style={{ color: t.muted, fontSize: 15 }}>This sets which words count as known at the start. Reading updates it from there.</Text>
            {LEVELS.map((l) => (
              <Pressable key={l.level} onPress={() => learner.start(l.level)} accessibilityRole="button" style={[styles.option, { borderColor: t.line, backgroundColor: t.surface }]}>
                <Text style={{ color: t.ink, fontWeight: "700", fontSize: 16 }}>{l.title}</Text>
                <Text style={{ color: t.muted, fontSize: 13.5 }}>{l.detail(meta.levels[0] ?? "")}</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            <Text style={{ color: t.muted, fontSize: 13, fontWeight: "700" }}>{learner.knownCount} WORDS KNOWN</Text>
            <Text style={[styles.h1, { color: t.ink }]} accessibilityRole="header">Stories for you</Text>
            {ranked.map(({ story, c }) => {
              const fc = fitColors(t, c.coverage.fit);
              return (
                <Link key={story.id} href={`/${lang}/read/${story.id}`} asChild>
                  <Pressable style={[styles.story, { borderColor: t.line, backgroundColor: t.surface }]}>
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={{ color: t.ink, fontSize: 19, fontFamily: READ_FONT }}>{story.title}</Text>
                      {!!story.titleEnglish && <Text style={{ color: t.muted, fontSize: 13 }}>{story.titleEnglish}</Text>}
                      <View style={[styles.bar, { backgroundColor: t.newWordSoft }]}>
                        <View style={{ width: `${c.coverage.percent}%`, height: "100%", backgroundColor: t.primary }} />
                      </View>
                      <Text style={{ color: t.muted, fontSize: 12.5 }}>
                        {story.level} · {story.minutes} min · {c.coverage.percent}% known{c.finished ? " · Read" : ""}
                      </Text>
                    </View>
                    <View style={[styles.fit, { backgroundColor: fc.bg }]}>
                      <Text style={{ color: fc.fg, fontSize: 12, fontWeight: "700" }}>{FIT_LABEL[c.coverage.fit]}</Text>
                    </View>
                  </Pressable>
                </Link>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 20, paddingBottom: 40, gap: 16 },
  top: { flexDirection: "row" },
  pill: { flexDirection: "row", alignItems: "center", minHeight: 44, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1 },
  h1: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  option: { borderWidth: 1.5, borderRadius: 14, padding: 16, gap: 4 },
  story: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderRadius: 16, padding: 14 },
  bar: { height: 5, borderRadius: 99, overflow: "hidden", marginTop: 4 },
  fit: { borderRadius: 99, paddingHorizontal: 9, paddingVertical: 3 },
});
