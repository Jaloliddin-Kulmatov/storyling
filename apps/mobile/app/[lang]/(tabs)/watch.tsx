import { CHANNELS, fetchVideos, language, savedVideos, type Band, type Video } from "@storyling/content";
import type { LangCode } from "@storyling/core";
import { useLearner } from "@storyling/learner";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Image, Linking, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { VideoPlayer } from "../../../src/VideoPlayer";
import { useTheme } from "../../../src/theme";
import { Chip, Icon, Tabs } from "../../../src/ui";

const BAND_LABEL: Record<Band, string> = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" };

function ago(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 864e5);
  if (days < 1) return "today";
  if (days < 7) return `${days}d ago`;
  if (days < 60) return `${Math.floor(days / 7)} wk ago`;
  return `${Math.floor(days / 30)} mo ago`;
}

/** Watch: latest videos from learner-friendly YouTube channels, played in the app. */
export default function Watch() {
  const { lang } = useLocalSearchParams<{ lang: LangCode }>();
  const t = useTheme();
  const learner = useLearner(lang);
  const meta = language(lang);
  const [videos, setVideos] = useState<Video[]>(() => savedVideos[lang] ?? []);
  useEffect(() => {
    let alive = true;
    fetchVideos(lang).then((v) => alive && v.length && setVideos(v)).catch(() => {});
    return () => { alive = false; };
  }, [lang]);

  const bands = (["beginner", "intermediate", "advanced"] as Band[]).filter((b) => videos.some((v) => v.band === b));
  const [band, setBand] = useState<Band | "all">((learner.level ?? 0) <= 1 ? "beginner" : "all");
  const [channel, setChannel] = useState("all");
  const list = useMemo(
    () => videos.filter((v) => (band === "all" || v.band === band) && (channel === "all" || v.channelId === channel)),
    [videos, band, channel],
  );
  const [playing, setPlaying] = useState<Video | null>(null);
  const current = playing ?? list[0] ?? null;
  const channels = CHANNELS[lang];

  const head = (
    <View>
      <View style={{ paddingHorizontal: 18 }}>
        <Text style={{ color: t.muted, fontSize: 11.5, fontWeight: "700", letterSpacing: 0.8, marginTop: 6 }}>{meta.name.toUpperCase()} · {videos.length} VIDEOS</Text>
        <Text style={{ color: t.ink, fontSize: 30, fontWeight: "800" }}>Watch</Text>
        <Tabs<Band | "all">
          value={band}
          onChange={(b) => { setBand(b); setPlaying(null); }}
          items={[{ key: "all", label: "All" }, ...bands.map((b) => ({ key: b, label: BAND_LABEL[b], count: videos.filter((v) => v.band === b).length }))]}
        />
        {channels.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 12 }}>
            <Chip label="All channels" on={channel === "all"} onPress={() => { setChannel("all"); setPlaying(null); }} />
            {channels.map((c) => <Chip key={c.id} label={c.name} on={channel === c.id} onPress={() => { setChannel(c.id); setPlaying(null); }} />)}
          </ScrollView>
        )}
      </View>
      {current && (
        <View style={{ backgroundColor: t.surface, borderColor: t.line, borderTopWidth: 1, borderBottomWidth: 1, marginBottom: 12 }}>
          <View style={{ aspectRatio: 16 / 9, backgroundColor: "#000" }}>
            <VideoPlayer key={current.id} url={`https://www.youtube-nocookie.com/embed/${current.id}?playsinline=1&rel=0&cc_load_policy=1&cc_lang_pref=${lang}`} />
          </View>
          <View style={{ padding: 14, gap: 4 }}>
            <Text style={{ color: t.muted, fontSize: 12 }}>{BAND_LABEL[current.band]} · {current.channel} · {ago(current.published)}</Text>
            <Text style={{ color: t.ink, fontWeight: "700", fontSize: 16 }}>{current.title}</Text>
            <Text style={{ color: t.muted, fontSize: 12.5 }}>Tip: turn on subtitles (CC) and slow the video down in the player settings.</Text>
            <Pressable onPress={() => Linking.openURL(`https://www.youtube.com/watch?v=${current.id}`)} accessibilityRole="link">
              <Text style={{ color: t.primary, fontWeight: "700", marginTop: 4 }}>Open in YouTube</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: t.bg }}>
      <FlatList
        data={list}
        keyExtractor={(v) => v.id}
        ListHeaderComponent={head}
        contentContainerStyle={{ paddingBottom: 30 }}
        renderItem={({ item: v }) => (
          <Pressable onPress={() => setPlaying(v)} accessibilityRole="button"
            style={{ flexDirection: "row", gap: 12, paddingHorizontal: 18, paddingVertical: 8, backgroundColor: current?.id === v.id ? t.primarySoft : "transparent" }}>
            <View style={{ width: 132, aspectRatio: 16 / 9, borderRadius: 10, overflow: "hidden", backgroundColor: t.surface2 }}>
              <Image source={{ uri: `https://i.ytimg.com/vi/${v.id}/mqdefault.jpg` }} style={{ width: "100%", height: "100%" }} />
              <View style={{ position: "absolute", right: 5, bottom: 5, backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 99, padding: 4 }}>
                <Icon name="play" size={12} color="#fff" />
              </View>
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={{ color: t.ink, fontWeight: "700", fontSize: 14 }} numberOfLines={3}>{v.title}</Text>
              <Text style={{ color: t.muted, fontSize: 12 }}>{v.channel} · {ago(v.published)}</Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={{ color: t.muted, textAlign: "center", padding: 24 }}>No videos here right now.</Text>}
      />
    </SafeAreaView>
  );
}
