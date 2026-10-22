import { languages, storiesFor } from "@storyling/content";
import { useCurrentLanguage, useLearner } from "@storyling/learner";
import { Redirect, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { READ_FONT, useTheme } from "../src/theme";
import { Logo } from "../src/ui";

/** First screen: continue where the learner left off, or choose a language. */
export default function PickLanguage() {
  const t = useTheme();
  const router = useRouter();
  const current = useCurrentLanguage();
  const learner = useLearner(current ?? "en");
  if (current && learner.started) return <Redirect href={`/${current}`} />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={s.page}>
        <View style={s.brand}>
          <Logo />
          <Text style={[s.brandText, { color: t.ink }]}>Storyling</Text>
        </View>
        <Text style={[s.h1, { color: t.ink }]} accessibilityRole="header">Learn a language by reading stories</Text>
        <Text style={[s.lead, { color: t.muted }]}>Tap any word for its meaning. Listen, save words, and practice. Explanations are in English.</Text>
        <Text style={[s.label, { color: t.muted }]}>CHOOSE A LANGUAGE</Text>
        <View style={s.grid}>
          {languages.map((l) => (
                          <Pressable key={l.code} onPress={() => router.push(`/start/${l.code}`)} style={[s.card, { backgroundColor: t.surface, borderColor: t.line }]} accessibilityLabel={`${l.name}, ${storiesFor(l.code).length} stories`}>
                <Text style={[s.native, { color: t.ink }]}>{l.native}</Text>
                <Text style={[s.name, { color: t.muted }]}>{l.name} · {storiesFor(l.code).length} stories</Text>
              </Pressable>
            
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  page: { padding: 20, paddingBottom: 40, gap: 12 },
  brand: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  brandText: { fontSize: 20, fontWeight: "800" },
  h1: { fontSize: 30, fontWeight: "800", letterSpacing: -0.6, lineHeight: 34 },
  lead: { fontSize: 15.5, lineHeight: 22, marginBottom: 6 },
  label: { fontSize: 11.5, fontWeight: "700", letterSpacing: 0.8, marginTop: 8 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  card: { width: "48%", flexGrow: 1, minHeight: 76, borderWidth: 1.5, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 12, justifyContent: "center" },
  native: { fontSize: 22, fontFamily: READ_FONT },
  name: { fontSize: 12.5, marginTop: 3 },
});
