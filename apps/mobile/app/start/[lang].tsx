import { language } from "@storyling/content";
import type { LangCode } from "@storyling/core";
import { placementResult, placementWords, useLearner, type Level, type PlacementWord } from "@storyling/learner";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../src/theme";
import { Button, Icon } from "../../src/ui";

const OPTIONS: { level: Level; title: string; text: string }[] = [
  { level: 0, title: "Just starting", text: "I know a few words and can read the script." },
  { level: 1, title: "Some basics", text: "Simple sentences are OK. Around A1." },
  { level: 2, title: "Intermediate", text: "Beginner stories feel easy." },
];

/** Onboarding step 2: how much the learner knows, which seeds their known words. */
export default function StartLanguage() {
  const { lang } = useLocalSearchParams<{ lang: LangCode }>();
  const t = useTheme();
  const router = useRouter();
  const learner = useLearner(lang);
  const meta = language(lang);
  const [level, setLevel] = useState<Level>(1);
  const [testing, setTesting] = useState(false);
  const sample = useMemo<PlacementWord[]>(() => (testing ? placementWords(lang) : []), [testing, lang]);
  const [ticked, setTicked] = useState<Set<string>>(() => new Set());

  function go() {
    if (!learner.started) learner.start(level);
    learner.select();
    router.replace(`/${lang}`);
  }

  if (testing) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
          <Pressable onPress={() => setTesting(false)} accessibilityRole="button" accessibilityLabel="Back" style={{ paddingVertical: 6 }}><Icon name="chevron-back" size={24} /></Pressable>
          <Text style={{ color: t.ink, fontSize: 28, fontWeight: "800" }}>Which {meta.name} words do you know?</Text>
          <Text style={{ color: t.muted, fontSize: 15.5 }}>Tap every word whose meaning you know. Skip the ones you are not sure about.</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {sample.map((w) => {
              const on = ticked.has(w.lemma);
              return (
                <Pressable key={w.lemma} accessibilityRole="button" accessibilityState={{ selected: on }}
                  onPress={() => setTicked((x) => { const n = new Set(x); if (n.has(w.lemma)) n.delete(w.lemma); else n.add(w.lemma); return n; })}
                  style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: 99, borderWidth: 1.5, borderColor: on ? t.primary : t.line, backgroundColor: on ? t.primarySoft : t.surface }}>
                  <Text style={{ color: t.ink, fontSize: 19 }}>{w.display}</Text>
                </Pressable>
              );
            })}
          </View>
          <View style={{ marginTop: 8 }}>
            <Button kind="primary" label={ticked.size ? `Done, I know ${ticked.size}` : "I know none of these"} onPress={() => {
              const r = placementResult(lang, sample, ticked);
              learner.start(r.level, r.known);
              learner.select();
              router.replace(`/${lang}`);
            }} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Back" style={{ paddingVertical: 6 }}>
          <Icon name="chevron-back" size={24} />
        </Pressable>
        {learner.started ? (
          <>
            <Text style={{ color: t.ink, fontSize: 28, fontWeight: "800" }}>Welcome back to {meta.name}</Text>
            <Text style={{ color: t.muted, fontSize: 15.5 }}>Your words and progress are saved on this phone.</Text>
          </>
        ) : (
          <>
            <Text style={{ color: t.ink, fontSize: 28, fontWeight: "800" }}>How much {meta.name} do you know?</Text>
            <Text style={{ color: t.muted, fontSize: 15.5 }}>This sets which words count as known at the start. Reading updates it from there.</Text>
            {OPTIONS.map((o) => {
              const on = o.level === level;
              return (
                <Pressable key={o.level} onPress={() => setLevel(o.level)} accessibilityRole="radio" accessibilityState={{ checked: on }}
                  style={{ borderWidth: 1.5, borderColor: on ? t.primary : t.line, backgroundColor: on ? t.primarySoft : t.surface, borderRadius: 16, padding: 16 }}>
                  <Text style={{ color: t.ink, fontWeight: "800", fontSize: 16 }}>{o.title}</Text>
                  <Text style={{ color: t.muted, marginTop: 2 }}>{o.text}</Text>
                </Pressable>
              );
            })}
          </>
        )}
        {!learner.started && (
          <Pressable onPress={() => setTesting(true)} accessibilityRole="button"
            style={{ borderWidth: 1.5, borderStyle: "dashed", borderColor: t.primary, backgroundColor: t.primarySoft, borderRadius: 16, padding: 16 }}>
            <Text style={{ color: t.ink, fontWeight: "800" }}>Not sure? Take the 1-minute word test</Text>
            <Text style={{ color: t.muted, marginTop: 2 }}>Tick the words you know. We use your answers to pick stories that fit you.</Text>
          </Pressable>
        )}
        <View style={{ marginTop: 8 }}>
          <Button kind="primary" label={learner.started ? "Continue reading" : "Start reading"} onPress={go} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
