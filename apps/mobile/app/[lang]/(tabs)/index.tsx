import { language } from "@storyling/content";
import type { LangCode } from "@storyling/core";
import { isUserStory, today, topicOf, TOPIC_LABEL, useLearner, useRankedStories, useSettings, type Ranked } from "@storyling/learner";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { READ_FONT, useTheme } from "../../../src/theme";
import { Chip, Cover, FitBadge, Icon, LevelPill, Logo, topicLabel } from "../../../src/ui";

/** Home: a reading feed with level tabs, topic chips, a featured story and a list. */
export default function Home() {
  const { lang } = useLocalSearchParams<{ lang: LangCode }>();
  const t = useTheme();
  const router = useRouter();
  const learner = useLearner(lang);
  const [settings] = useSettings();
  const ranked = useRankedStories(lang);
  const meta = language(lang);
  const [level, setLevel] = useState("for-you");
  const [topic, setTopic] = useState("all");
  const [query, setQuery] = useState("");

  const byLevel = useMemo(
    () =>
      level === "for-you" ? ranked.filter((r) => !isUserStory(r.story))
        : level === "mine" ? ranked.filter((r) => isUserStory(r.story))
          : ranked.filter((r) => !isUserStory(r.story) && r.story.level === level),
    [ranked, level],
  );
  const topics = ["all", ...new Set(byLevel.map((r) => topicOf(r.story)))];
  const q = query.trim().toLowerCase();
  const items = byLevel.filter(
    (r) => (topic === "all" || topicOf(r.story) === topic) && (!q || r.story.title.toLowerCase().includes(q) || r.story.titleEnglish.toLowerCase().includes(q)),
  );
  const minutes = Math.floor((learner.log[today()]?.seconds ?? 0) / 60);
  const goal = settings.dailyGoalMinutes;
  const due = learner.dueWords().length;
  const levels = [
    { key: "for-you", label: "For you" },
    ...meta.levels.map((l) => ({ key: l, label: l })),
    ...(learner.stories.length ? [{ key: "mine", label: "My texts" }] : []),
  ];
  const [featured, ...rest] = items;

  const header = (
    <View style={{ paddingHorizontal: 18 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 6 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Logo size={28} />
          <Text style={{ color: t.ink, fontWeight: "800", fontSize: 18 }}>Storyling</Text>
        </View>
                  <Pressable onPress={() => router.push("/")} accessibilityRole="button" accessibilityLabel={`Learning ${meta.name}. Change language`}
            style={{ borderWidth: 1, borderColor: t.line, backgroundColor: t.surface, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6 }}>
            <Text style={{ color: t.ink, fontFamily: READ_FONT, fontSize: 15 }}>{meta.native}</Text>
          </Pressable>
        
      </View>

      <Text style={{ color: t.ink, fontSize: 30, fontWeight: "800", letterSpacing: -0.6, marginTop: 16 }}>Read today</Text>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: t.surface, borderColor: t.line, borderWidth: 1, borderRadius: 16, padding: 12, marginTop: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: t.muted, fontSize: 12 }}>Today</Text>
          <Text style={{ color: t.ink, fontWeight: "800", fontSize: 16 }}>{minutes}/{goal} min</Text>
          <View style={{ height: 6, borderRadius: 99, backgroundColor: t.surface2, marginTop: 6, overflow: "hidden" }}>
            <View style={{ height: 6, width: `${Math.min(100, (minutes / goal) * 100)}%`, backgroundColor: t.primary }} />
          </View>
        </View>
        <View style={{ alignItems: "center", paddingHorizontal: 6 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}><Icon name="flame" size={17} color={t.newWord} /><Text style={{ color: t.ink, fontWeight: "800", fontSize: 18 }}>{learner.streak}</Text></View>
          <Text style={{ color: t.muted, fontSize: 11.5 }}>streak</Text>
        </View>
        <View style={{ alignItems: "center", paddingHorizontal: 6 }}>
          <Text style={{ color: t.ink, fontWeight: "800", fontSize: 18 }}>{learner.knownCount}</Text>
          <Text style={{ color: t.muted, fontSize: 11.5 }}>known</Text>
        </View>
      </View>
      {due > 0 && (
        <Pressable onPress={() => router.push(`/${lang}/game/review`)} accessibilityRole="button"
          style={{ marginTop: 10, backgroundColor: t.learningSoft, borderRadius: 14, padding: 12, flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Icon name="albums" color={t.learning} />
          <Text style={{ color: t.learning, fontWeight: "700", flex: 1 }}>{due} {due === 1 ? "word" : "words"} to review</Text>
          <Icon name="chevron-forward" color={t.learning} />
        </Pressable>
      )}

      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: t.surface, borderColor: t.line, borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, marginTop: 14 }}>
        <Icon name="search" size={18} color={t.muted} />
        <TextInput value={query} onChangeText={setQuery} placeholder="Search stories" placeholderTextColor={t.muted} style={{ flex: 1, paddingVertical: 10, color: t.ink, fontSize: 15 }} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12, borderBottomWidth: 1, borderColor: t.line }}>
        {levels.map((l) => {
          const on = l.key === level;
          return (
            <Pressable key={l.key} onPress={() => { setLevel(l.key); setTopic("all"); }} accessibilityRole="tab" accessibilityState={{ selected: on }}
              style={{ paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 3, borderColor: on ? t.primary : "transparent" }}>
              <Text style={{ color: on ? t.primary : t.muted, fontWeight: "800", fontSize: 15 }}>{l.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 12 }}>
        {topics.map((x) => <Chip key={x} label={x === "all" ? "All topics" : TOPIC_LABEL[x] ?? x} on={topic === x} onPress={() => setTopic(x)} />)}
      </ScrollView>

      {featured && <Featured r={featured} lang={lang} saved={learner.favorites.includes(featured.story.id)} onSave={() => learner.toggleFavorite(featured.story.id)} />}
      {!featured && <Text style={{ color: t.muted, textAlign: "center", padding: 30 }}>No stories here yet.</Text>}
    </View>
  );

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: t.bg }}>
      <FlatList
        data={rest}
        keyExtractor={(r) => r.story.id}
        ListHeaderComponent={header}
        renderItem={({ item }) => (
          <Row r={item} lang={lang} saved={learner.favorites.includes(item.story.id)} onSave={() => learner.toggleFavorite(item.story.id)} />
        )}
        contentContainerStyle={{ paddingBottom: 30 }}
        keyboardShouldPersistTaps="handled"
      />
    </SafeAreaView>
  );
}

function SaveButton({ saved, onSave }: { saved: boolean; onSave: () => void }) {
  const t = useTheme();
  return (
    <Pressable onPress={onSave} hitSlop={10} accessibilityRole="button" accessibilityLabel={saved ? "Remove from saved" : "Save story"}>
      <Icon name={saved ? "bookmark" : "bookmark-outline"} color={saved ? t.primary : t.muted} />
    </Pressable>
  );
}

function Featured({ r, lang, saved, onSave }: { r: Ranked; lang: LangCode; saved: boolean; onSave: () => void }) {
  const t = useTheme();
  const router = useRouter();
  const s = r.story;
  return (
          <Pressable onPress={() => router.push(`/${lang}/read/${s.id}`)} accessibilityRole="button" style={{ backgroundColor: t.surface, borderColor: t.line, borderWidth: 1, borderRadius: 22, overflow: "hidden", marginBottom: 14 }}>
        <Cover story={s} style={{ height: 200 }}>
          <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: 16, backgroundColor: "rgba(0,0,0,0.45)" }}>
            <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
              <LevelPill level={s.level} />
              <Text style={{ color: "#fff", fontSize: 12.5, fontWeight: "600" }}>{topicLabel(s)} · {s.minutes} min{r.read ? " · Read" : ""}</Text>
            </View>
            <Text style={{ color: "#fff", fontFamily: READ_FONT, fontSize: 28, marginTop: 6 }} numberOfLines={2}>{s.title}</Text>
            {!!s.titleEnglish && <Text style={{ color: "#ffffffdd", fontSize: 14 }}>{s.titleEnglish}</Text>}
          </View>
        </Cover>
        <View style={{ padding: 14, gap: 10 }}>
          <Text style={{ color: t.inkSoft, fontFamily: READ_FONT, fontSize: 16.5 }} numberOfLines={2}>
            {s.sentences.slice(0, 2).map((x) => x.tokens.map((tk) => tk.surface).join(language(lang).noSpace ? "" : " ")).join(" ").replace(/ ([.,!?:;。、！？])/g, "$1")}
          </Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <FitBadge coverage={r.coverage} />
            <SaveButton saved={saved} onSave={onSave} />
          </View>
        </View>
      </Pressable>
    
  );
}

function Row({ r, lang, saved, onSave }: { r: Ranked; lang: LangCode; saved: boolean; onSave: () => void }) {
  const t = useTheme();
  const router = useRouter();
  const s = r.story;
  return (
          <Pressable onPress={() => router.push(`/${lang}/read/${s.id}`)} accessibilityRole="button" style={{ flexDirection: "row", gap: 12, paddingHorizontal: 18, paddingVertical: 10, alignItems: "center" }}>
        <Cover story={s} style={{ width: 96, height: 74, borderRadius: 14 }}>
          {r.read && (
            <View style={{ position: "absolute", right: 5, bottom: 5, backgroundColor: t.primary, borderRadius: 99, width: 20, height: 20, alignItems: "center", justifyContent: "center" }}>
              <Icon name="checkmark" size={13} color="#fff" />
            </View>
          )}
        </Cover>
        <View style={{ flex: 1, gap: 3 }}>
          <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
            <LevelPill level={s.level} />
            <Text style={{ color: t.muted, fontSize: 12 }}>{topicLabel(s)} · {s.minutes} min</Text>
          </View>
          <Text style={{ color: r.read ? t.muted : t.ink, fontFamily: READ_FONT, fontSize: 18 }} numberOfLines={1}>{s.title}</Text>
          {!!s.titleEnglish && <Text style={{ color: t.muted, fontSize: 12.5 }} numberOfLines={1}>{s.titleEnglish}</Text>}
          <FitBadge coverage={r.coverage} />
        </View>
        <SaveButton saved={saved} onSave={onSave} />
      </Pressable>
    
  );
}
