import { dictionary, language } from "@storyling/content";
import type { LangCode } from "@storyling/core";
import { textOf, useLearner, useStories } from "@storyling/learner";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { playWordAny } from "../../src/audio";
import { READ_FONT, useTheme } from "../../src/theme";
import { Icon, Tx } from "../../src/ui";

/** Dictionary: search every word in the language or its English meaning. */
export default function Dictionary() {
  const { lang } = useLocalSearchParams<{ lang: LangCode }>();
  const t = useTheme();
  const router = useRouter();
  const learner = useLearner(lang);
  const stories = useStories(lang);
  const all = useMemo(() => dictionary(lang), [lang]);
  const [q, setQ] = useState("");
  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return all.slice(0, 60);
    return all
      .filter((e) => e.display.toLowerCase().includes(s) || e.meaning.toLowerCase().includes(s) || e.reading?.toLowerCase().includes(s))
      .sort((a, b) => Number(!a.display.toLowerCase().startsWith(s)) - Number(!b.display.toLowerCase().startsWith(s)))
      .slice(0, 80);
  }, [all, q]);
  const example = (lemma: string) => {
    for (const st of stories) for (const s of st.sentences) if (s.tokens.some((tk) => tk.lemma === lemma)) return { story: st, text: textOf(st, s) };
    return undefined;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6 }}>
        <Pressable onPress={() => router.back()} hitSlop={8} accessibilityLabel="Back" style={{ padding: 6 }}><Icon name="chevron-back" size={24} /></Pressable>
        <Text style={{ color: t.ink, fontSize: 20, fontWeight: "800" }}>Dictionary</Text>
        <Text style={{ color: t.muted, marginLeft: "auto", paddingRight: 8 }}>{all.length} words</Text>
      </View>
      <TextInput value={q} onChangeText={setQ} autoFocus placeholder={`Search in ${language(lang).name} or English`} placeholderTextColor={t.muted}
        style={{ marginHorizontal: 16, marginBottom: 8, borderWidth: 1, borderColor: t.line, backgroundColor: t.surface, borderRadius: 12, padding: 11, color: t.ink, fontSize: 15 }} />
      <FlatList
        data={results}
        keyExtractor={(e) => e.lemma}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 30 }}
        renderItem={({ item: e }) => {
          const saved = learner.word(e.lemma)?.saved === "learning";
          const known = !saved && learner.wordState(e.lemma) === "known";
          const ex = example(e.lemma);
          return (
            <View style={{ marginHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderColor: t.line, flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ color: t.ink, fontFamily: READ_FONT, fontSize: 20 }}>{e.display} {!!e.reading && <Text style={{ color: t.muted, fontSize: 13 }}>{e.reading}</Text>}</Text>
                <Text style={{ color: t.ink }}><Tx>{e.meaning}</Tx> <Text style={{ color: t.muted }}>· {e.pos}</Text></Text>
                {ex && (
                  <Pressable onPress={() => router.push(`/${lang}/read/${ex.story.id}`)}>
                    <Text style={{ color: t.muted, fontFamily: READ_FONT }} numberOfLines={1}>{ex.text}</Text>
                  </Pressable>
                )}
              </View>
              <View style={{ alignItems: "flex-end", gap: 8 }}>
                <Pressable onPress={() => playWordAny(lang, e.lemma, e.display)} hitSlop={8} accessibilityLabel={`Hear ${e.display}`}><Icon name="volume-high" /></Pressable>
                {saved ? <Text style={{ color: t.learning, fontWeight: "700", fontSize: 12.5 }}>Saved</Text>
                  : known ? <Text style={{ color: t.primary, fontWeight: "700", fontSize: 12.5 }}>Known</Text>
                    : <Pressable onPress={() => learner.setWord(e.lemma, "learning")} accessibilityRole="button"><Text style={{ color: t.primary, fontWeight: "700" }}>+ Review</Text></Pressable>}
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}
