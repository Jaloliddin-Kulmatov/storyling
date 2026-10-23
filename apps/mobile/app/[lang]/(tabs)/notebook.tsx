import type { LangCode } from "@storyling/core";
import { displayState } from "@storyling/core";
import { isUserStory, useLearner, useRankedStories, useWordInfo, type Ranked } from "@storyling/learner";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { playWordAny } from "../../../src/audio";
import { READ_FONT, useTheme } from "../../../src/theme";
import { Button, Chip, Cover, Empty, Icon, LevelPill, Tabs, topicLabel, Tx } from "../../../src/ui";

type Tab = "words" | "saved" | "texts";
type Filter = "learning" | "known" | "ignored";

/** Notebook: saved words, bookmarked stories and the learner's own texts. */
export default function Notebook() {
  const { lang } = useLocalSearchParams<{ lang: LangCode }>();
  const t = useTheme();
  const router = useRouter();
  const learner = useLearner(lang);
  const ranked = useRankedStories(lang);
  const { meaningOf, contextOf } = useWordInfo(lang);
  const [tab, setTab] = useState<Tab>("words");
  const [filter, setFilter] = useState<Filter>("learning");
  const [q, setQ] = useState("");

  const counts = {
    learning: learner.allWords.filter((w) => w.saved === "learning").length,
    known: learner.knownCount,
    ignored: learner.allWords.filter((w) => w.saved === "ignored").length,
  };
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return learner.allWords
      .filter((w) => (filter === "learning" ? w.saved === "learning" : filter === "ignored" ? w.saved === "ignored" : displayState(w) === "known"))
      .filter((w) => !s || w.lemma.toLowerCase().includes(s) || meaningOf(w)?.meaning.toLowerCase().includes(s))
      .sort((a, b) => a.lemma.localeCompare(b.lemma));
  }, [learner.allWords, filter, q, meaningOf]);
  const saved = learner.favorites.map((id) => ranked.find((r) => r.story.id === id)).filter((r): r is Ranked => !!r);
  const texts = ranked.filter((r) => isUserStory(r.story));

  const head = (
    <View style={{ paddingHorizontal: 18 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
        <Text style={{ color: t.ink, fontSize: 30, fontWeight: "800" }}>Notebook</Text>
                  <Pressable onPress={() => router.push(`/${lang}/dictionary`)} accessibilityRole="button" style={{ flexDirection: "row", alignItems: "center", gap: 6, padding: 8 }}>
            <Icon name="search" size={18} color={t.primary} /><Text style={{ color: t.primary, fontWeight: "700" }}>Dictionary</Text>
          </Pressable>
        
      </View>
      <Tabs<Tab> value={tab} onChange={setTab} items={[
        { key: "words", label: "Words", count: counts.learning },
        { key: "saved", label: "Saved", count: saved.length },
        { key: "texts", label: "My texts", count: texts.length },
      ]} />
      {tab === "words" && (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 10 }}>
            {(["learning", "known", "ignored"] as Filter[]).map((f) => (
              <Chip key={f} on={filter === f} onPress={() => setFilter(f)} label={`${f === "learning" ? "To learn" : f === "known" ? "Known" : "Ignored"} · ${counts[f]}`} />
            ))}
          </ScrollView>
          <TextInput value={q} onChangeText={setQ} placeholder="Search words" placeholderTextColor={t.muted}
            style={{ borderWidth: 1, borderColor: t.line, backgroundColor: t.surface, borderRadius: 12, padding: 10, color: t.ink, marginBottom: 10 }} />
        </>
      )}
    </View>
  );

  if (tab !== "words") {
    const rows = tab === "saved" ? saved : texts;
    return (
      <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: t.bg }}>
        <FlatList
          data={rows}
          keyExtractor={(r) => r.story.id}
          ListHeaderComponent={head}
          ListEmptyComponent={
            <View style={{ paddingHorizontal: 18 }}>
              <Empty text={tab === "saved" ? "Press the bookmark on any story to keep it here." : "Your own texts will appear here."} />
            </View>
          }
          renderItem={({ item }) => (
                          <Pressable onPress={() => router.push(`/${lang}/read/${item.story.id}`)} style={{ flexDirection: "row", gap: 12, paddingHorizontal: 18, paddingVertical: 8, alignItems: "center" }}>
                <Cover story={item.story} style={{ width: 80, height: 60, borderRadius: 12 }} />
                <View style={{ flex: 1, gap: 3 }}>
                  <LevelPill level={item.story.level} />
                  <Text style={{ color: t.ink, fontFamily: READ_FONT, fontSize: 17 }} numberOfLines={1}>{item.story.title}</Text>
                  <Text style={{ color: t.muted, fontSize: 12.5 }}>{topicLabel(item.story)} · {item.story.minutes} min</Text>
                </View>
              </Pressable>
            
          )}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: t.bg }}>
      <FlatList
        data={list}
        keyExtractor={(w) => w.lemma}
        ListHeaderComponent={head}
        ListEmptyComponent={
          <View style={{ paddingHorizontal: 18 }}>
            <Empty text={filter === "learning" ? "Tap a word while reading and press Review to add it here." : "No words here yet."} />
          </View>
        }
        contentContainerStyle={{ paddingBottom: 30 }}
        renderItem={({ item: w }) => {
          const e = meaningOf(w);
          const ctx = contextOf(w);
          return (
            <View style={{ marginHorizontal: 18, marginBottom: 10, backgroundColor: t.surface, borderColor: t.line, borderWidth: 1, borderRadius: 16, padding: 14, gap: 5 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={{ color: t.ink, fontFamily: READ_FONT, fontSize: 22 }}>{e?.display ?? w.lemma}</Text>
                <Pressable onPress={() => playWordAny(lang, w.lemma, e?.display ?? w.lemma)} hitSlop={8} accessibilityLabel="Hear the word"><Icon name="volume-high" /></Pressable>
              </View>
              {!!e?.reading && <Text style={{ color: t.muted }}>{e.reading}</Text>}
              <Text style={{ color: t.ink, fontWeight: "600" }}>{e?.meaning ? <Tx>{e.meaning}</Tx> : "No meaning saved"}{e?.pos ? <Text style={{ color: t.muted, fontWeight: "400" }}>  · {e.pos}</Text> : null}</Text>
              {ctx && <Text style={{ color: t.inkSoft, fontFamily: READ_FONT, borderLeftWidth: 3, borderColor: t.learningSoft, paddingLeft: 8 }}>{ctx.text}</Text>}
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                <Text style={{ color: t.muted, fontSize: 12 }}>Seen {w.encounters}×</Text>
                {filter === "learning"
                  ? <Button label="I know it" onPress={() => learner.setWord(w.lemma, "known")} />
                  : <Button label="Learn again" onPress={() => learner.setWord(w.lemma, "learning")} />}
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}
