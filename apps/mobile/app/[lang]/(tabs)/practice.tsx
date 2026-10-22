import type { LangCode } from "@storyling/core";
import { useLearner } from "@storyling/learner";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../src/theme";
import { Icon, type IconName } from "../../../src/ui";

const GAMES: { mode: string; title: string; text: string; icon: IconName }[] = [
  { mode: "review", title: "Flashcards", text: "Review saved words when they are due.", icon: "albums" },
  { mode: "match", title: "Match words", text: "Pair each word with its meaning.", icon: "git-compare" },
  { mode: "order", title: "Build the sentence", text: "Put a story sentence back in order.", icon: "reorder-four" },
  { mode: "listen", title: "Listening", text: "Hear a sentence and pick what was said.", icon: "headset" },
  { mode: "test", title: "Level test", text: "10 questions on one level's words.", icon: "ribbon" },
];

/** Practice hub: the five games, with due count and best scores. */
export default function Practice() {
  const { lang } = useLocalSearchParams<{ lang: LangCode }>();
  const t = useTheme();
  const router = useRouter();
  const learner = useLearner(lang);
  const due = learner.dueWords().length;
  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={{ padding: 18, gap: 12 }}>
        <Text style={{ color: t.muted, fontSize: 11.5, fontWeight: "700", letterSpacing: 0.8 }}>{learner.learningCount} WORDS TO LEARN</Text>
        <Text style={{ color: t.ink, fontSize: 30, fontWeight: "800", marginBottom: 4 }}>Practice</Text>
        {GAMES.map((g) => {
          const best = learner.games[g.mode];
          return (
                          <Pressable key={g.mode} onPress={() => router.push(`/${lang}/game/${g.mode}`)} accessibilityRole="button" style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: t.surface, borderColor: t.line, borderWidth: 1, borderRadius: 20, padding: 16, opacity: pressed ? 0.85 : 1 })}>
                <View style={{ width: 48, height: 48, borderRadius: 15, backgroundColor: t.primarySoft, alignItems: "center", justifyContent: "center" }}>
                  <Icon name={g.icon} color={t.primary} size={24} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ color: t.ink, fontWeight: "800", fontSize: 17 }}>{g.title}</Text>
                  <Text style={{ color: t.muted, fontSize: 13 }}>{g.text}</Text>
                  <Text style={{ color: g.mode === "review" && due ? t.learning : t.muted, fontSize: 12.5, fontWeight: g.mode === "review" && due ? "700" : "400" }}>
                    {g.mode === "review" ? (due ? `${due} due now` : "Nothing due") : best ? `Best ${best.best}% · played ${best.played}×` : "Not played yet"}
                  </Text>
                </View>
                <Icon name="chevron-forward" color={t.muted} />
              </Pressable>
            
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
