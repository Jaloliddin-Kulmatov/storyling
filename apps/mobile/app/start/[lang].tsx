import { language } from "@storyling/content";
import type { LangCode } from "@storyling/core";
import { useLearner, type Level } from "@storyling/learner";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
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

  function go() {
    if (!learner.started) learner.start(level);
    learner.select();
    router.replace(`/${lang}`);
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
        <View style={{ marginTop: 8 }}>
          <Button kind="primary" label={learner.started ? "Continue reading" : "Start reading"} onPress={go} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
