import { language } from "@storyling/content";
import type { LangCode } from "@storyling/core";
import { today, TRANSLATE_TARGETS, useLearner, useSettings, useStories } from "@storyling/learner";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../src/theme";
import { Button, Chip, Icon, SectionTitle, type IconName } from "../../../src/ui";

/** Me: progress (stats and a 14-day chart) and settings. */
export default function Me() {
  const { lang } = useLocalSearchParams<{ lang: LangCode }>();
  const t = useTheme();
  const router = useRouter();
  const learner = useLearner(lang);
  const [settings, set] = useSettings();
  const stories = useStories(lang);
  const meta = language(lang);
  const [armed, setArmed] = useState(false);

  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const key = today(d);
    return { key, label: d.toLocaleDateString("en", { weekday: "narrow" }), minutes: Math.round((learner.log[key]?.seconds ?? 0) / 60) };
  });
  const max = Math.max(settings.dailyGoalMinutes, ...days.map((d) => d.minutes));
  const accuracy = learner.quiz.total ? Math.round((learner.quiz.right / learner.quiz.total) * 100) : null;
  const total = Math.round(Object.values(learner.log).reduce((n, d) => n + d.seconds, 0) / 60);

  const stat = (icon: IconName, value: string, label: string) => (
    <View style={{ width: "48%", flexGrow: 1, backgroundColor: t.surface, borderColor: t.line, borderWidth: 1, borderRadius: 16, padding: 14, gap: 4 }}>
      <Icon name={icon} color={t.primary} size={20} />
      <Text style={{ color: t.ink, fontSize: 22, fontWeight: "800" }}>{value}</Text>
      <Text style={{ color: t.muted, fontSize: 12.5 }}>{label}</Text>
    </View>
  );
  const row = (label: string, value: boolean, onChange: (v: boolean) => void) => (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8 }}>
      <Text style={{ color: t.ink, fontSize: 15 }}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: t.primary }} />
    </View>
  );

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }}>
        <Text style={{ color: t.muted, fontSize: 11.5, fontWeight: "700", letterSpacing: 0.8 }}>LEARNING {meta.name.toUpperCase()}</Text>
        <Text style={{ color: t.ink, fontSize: 30, fontWeight: "800", marginBottom: 12 }}>Me</Text>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {stat("flame", `${learner.streak} ${learner.streak === 1 ? "day" : "days"}`, "streak")}
          {stat("checkmark-circle", String(learner.knownCount), "words known")}
          {stat("book", `${learner.finished.length}/${stories.length}`, "stories read")}
          {stat("ribbon", accuracy === null ? "—" : `${accuracy}%`, "quick-check accuracy")}
        </View>

        <SectionTitle>Minutes per day</SectionTitle>
        <View style={{ backgroundColor: t.surface, borderColor: t.line, borderWidth: 1, borderRadius: 18, padding: 14 }}>
          <View style={{ flexDirection: "row", alignItems: "flex-end", height: 120, gap: 5 }}>
            {days.map((d, i) => (
              <View key={d.key} style={{ flex: 1, height: `${Math.max(3, (d.minutes / max) * 100)}%`, backgroundColor: i === 13 ? t.primaryStrong : t.primary, borderRadius: 5, opacity: d.minutes ? 1 : 0.35 }} />
            ))}
          </View>
          <View style={{ flexDirection: "row", gap: 5, marginTop: 6 }}>
            {days.map((d) => <Text key={d.key} style={{ flex: 1, textAlign: "center", color: t.muted, fontSize: 10.5 }}>{d.label}</Text>)}
          </View>
          <Text style={{ color: t.muted, fontSize: 12.5, marginTop: 8 }}>{total} {total === 1 ? "minute" : "minutes"} in total · {learner.learningCount} {learner.learningCount === 1 ? "word" : "words"} saved</Text>
        </View>

        <SectionTitle>Settings</SectionTitle>
        <View style={{ backgroundColor: t.surface, borderColor: t.line, borderWidth: 1, borderRadius: 18, padding: 14, gap: 6 }}>
          <Text style={{ color: t.ink, fontSize: 15 }}>Daily goal</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {[5, 10, 15, 20, 30].map((m) => <Chip key={m} label={`${m} min`} on={settings.dailyGoalMinutes === m} onPress={() => set({ dailyGoalMinutes: m })} />)}
          </View>
          <Text style={{ color: t.ink, fontSize: 15, marginTop: 8 }}>Text size</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {[0.9, 1, 1.15, 1.3].map((s) => <Chip key={s} label={s === 1 ? "Normal" : s < 1 ? "Small" : s < 1.2 ? "Large" : "Larger"} on={Math.abs(settings.fontScale - s) < 0.03} onPress={() => set({ fontScale: s })} />)}
          </View>
          <Text style={{ color: t.ink, fontSize: 15, marginTop: 8 }}>Translations and meanings in</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {TRANSLATE_TARGETS.map((x) => <Chip key={x.code} label={x.name} on={settings.translateTo === x.code} onPress={() => set({ translateTo: x.code })} />)}
          </View>
          {row("Highlight new and review words", settings.highlightNew, (v) => set({ highlightNew: v }))}
          {row("Show all translations", settings.showTranslations, (v) => set({ showTranslations: v }))}
        </View>

        <View style={{ gap: 10, marginTop: 18 }}>
          <Button icon="language" label="Change language" onPress={() => router.push("/")} />
          <Button icon="search" label="Dictionary" onPress={() => router.push(`/${lang}/dictionary`)} />
          <Button kind={armed ? "danger" : "ghost"} label={armed ? "Tap again to erase everything" : `Reset ${meta.name} progress`} onPress={() => {
            if (!armed) return setArmed(true);
            learner.reset();
            router.replace("/");
          }} />
        </View>
        <Pressable style={{ marginTop: 16 }}>
          <Text style={{ color: t.muted, fontSize: 12, textAlign: "center" }}>Progress is saved on this phone. Cover photos: Wikimedia Commons (see storyling credits page).</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
