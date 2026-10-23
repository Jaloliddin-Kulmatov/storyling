import { Ionicons } from "@expo/vector-icons";
import { coverOf } from "@storyling/content";
import { FIT_LABEL, type Coverage } from "@storyling/core";
import { isUserStory, TOPIC_LABEL, topicOf, useTranslated, type AnyStory } from "@storyling/learner";
import type { ReactNode } from "react";
import { Image, Pressable, StyleSheet, Text, View, type StyleProp, type TextProps, type ViewStyle } from "react-native";
import { coverAssets } from "./coverAssets";
import { READ_FONT, useTheme, type Theme } from "./theme";

export type IconName = keyof typeof Ionicons.glyphMap;

export function Icon({ name, size = 20, color }: { name: IconName; size?: number; color?: string }) {
  const t = useTheme();
  return <Ionicons name={name} size={size} color={color ?? t.ink} />;
}

/** Storyling mark: an open book on a green tile. */
export function Logo({ size = 30 }: { size?: number }) {
  const t = useTheme();
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.28, backgroundColor: t.primary, alignItems: "center", justifyContent: "center" }}>
      <Ionicons name="book" size={size * 0.58} color="#fff" />
    </View>
  );
}

const TOPIC_TINT: Record<string, string> = {
  food: "#ffe7c7", daily: "#dff1ff", work: "#e6e6fb", weather: "#d9ecf2", animals: "#fbe3ea", travel: "#fff1c9", city: "#dcf3e8",
  home: "#f1e7dc", history: "#f5ead6", people: "#f8e2dd", nature: "#e1f1df", science: "#dde9f5", culture: "#fbe1e6", mine: "#ebe7f5",
};
const TOPIC_ICON: Record<string, IconName> = {
  food: "restaurant", daily: "sunny", work: "briefcase", weather: "rainy", animals: "paw", travel: "airplane", city: "business",
  home: "home", history: "library", people: "person", nature: "leaf", science: "flask", culture: "color-palette", mine: "document-text",
};

/** Story cover: the photo, or a tinted topic icon for texts without one. */
export function Cover({ story, style, children }: { story: AnyStory; style?: StyleProp<ViewStyle>; children?: ReactNode }) {
  const topic = topicOf(story);
  const slug = isUserStory(story) ? undefined : coverOf(story.id)?.replace(/^\/covers\/|\.jpg$/g, "");
  const asset = slug ? coverAssets[slug] : undefined;
  return (
    <View style={[{ overflow: "hidden", backgroundColor: TOPIC_TINT[topic] ?? "#eee", alignItems: "center", justifyContent: "center" }, style]}>
      {asset !== undefined ? (
        <Image source={asset} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <Ionicons name={TOPIC_ICON[topic] ?? "book"} size={34} color="#00000055" />
      )}
      {children}
    </View>
  );
}

export function LevelPill({ level, onImage }: { level: string; onImage?: boolean }) {
  const t = useTheme();
  return (
    <View style={[{ backgroundColor: t.primary, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 1.5, alignSelf: "flex-start" }, onImage && { position: "absolute", top: 10, left: 10 }]}>
      <Text style={{ color: "#fff", fontWeight: "800", fontSize: 11.5 }}>{level}</Text>
    </View>
  );
}

export function FitBadge({ coverage }: { coverage: Coverage }) {
  const t = useTheme();
  const tone =
    coverage.fit === "too_hard" ? { bg: t.dangerSoft, fg: t.danger } : coverage.fit === "stretch" ? { bg: t.newWordSoft, fg: t.newWord } : { bg: t.primarySoft, fg: t.primary };
  return (
    <View style={{ backgroundColor: tone.bg, borderRadius: 99, paddingHorizontal: 9, paddingVertical: 3, alignSelf: "flex-start" }}>
      <Text style={{ color: tone.fg, fontSize: 11.5, fontWeight: "700" }}>{FIT_LABEL[coverage.fit]} · {coverage.percent}%</Text>
    </View>
  );
}

export function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      style={{ paddingHorizontal: 13, paddingVertical: 7, borderRadius: 99, borderWidth: 1, borderColor: on ? t.ink : t.line, backgroundColor: on ? t.ink : t.surface }}
    >
      <Text style={{ color: on ? t.bg : t.ink, fontWeight: "600", fontSize: 13.5 }}>{label}</Text>
    </Pressable>
  );
}

export function Button({ label, onPress, kind = "default", icon, disabled }: { label: string; onPress: () => void; kind?: "default" | "primary" | "ghost" | "danger"; icon?: IconName; disabled?: boolean }) {
  const t = useTheme();
  const bg = kind === "primary" ? t.primary : kind === "danger" ? t.danger : kind === "ghost" ? "transparent" : t.surface2;
  const fg = kind === "primary" || kind === "danger" ? "#fff" : t.ink;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [styles.btn, { backgroundColor: bg, opacity: disabled ? 0.45 : pressed ? 0.8 : 1 }]}
    >
      {icon && <Ionicons name={icon} size={17} color={fg} />}
      <Text style={{ color: fg, fontWeight: "700", fontSize: 15 }}>{label}</Text>
    </Pressable>
  );
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginTop: 22, marginBottom: 10 }}>
      <Text style={{ color: t.ink, fontSize: 18, fontWeight: "800" }}>{children}</Text>
      {right}
    </View>
  );
}

export function Tabs<T extends string>({ items, value, onChange }: { items: { key: T; label: string; count?: number }[]; value: T; onChange: (k: T) => void }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: "row", borderBottomWidth: 1, borderColor: t.line, marginBottom: 12 }}>
      {items.map((it) => {
        const on = it.key === value;
        return (
          <Pressable key={it.key} onPress={() => onChange(it.key)} accessibilityRole="tab" accessibilityState={{ selected: on }}
            style={{ paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 3, borderColor: on ? t.primary : "transparent", marginBottom: -1 }}>
            <Text style={{ color: on ? t.primary : t.muted, fontWeight: "800", fontSize: 15 }}>
              {it.label}{it.count !== undefined ? <Text style={{ fontSize: 11.5, fontWeight: "600" }}> {it.count}</Text> : null}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Empty({ text, action }: { text: string; action?: ReactNode }) {
  const t = useTheme();
  return (
    <View style={[styles.card(t), { alignItems: "center", gap: 12, paddingVertical: 28 }]}>
      <Text style={{ color: t.muted, textAlign: "center" }}>{text}</Text>
      {action}
    </View>
  );
}

export const topicLabel = (s: AnyStory) => TOPIC_LABEL[topicOf(s)] ?? topicOf(s);

export const styles = {
  ...StyleSheet.create({
    btn: { minHeight: 46, borderRadius: 14, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
    h1: { fontSize: 30, fontWeight: "800", letterSpacing: -0.6 },
    eyebrow: { fontSize: 11.5, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase" },
    readTitle: { fontFamily: READ_FONT },
  }),
  card: (t: Theme): ViewStyle => ({ backgroundColor: t.surface, borderColor: t.line, borderWidth: 1, borderRadius: 18, padding: 16 }),
};

/** A <Text> of English content (a meaning or a sentence translation) shown in the learner's chosen language. */
export function Tx({ children, ...rest }: Omit<TextProps, "children"> & { children?: string }) {
  const t = useTranslated([children]);
  return <Text {...rest}>{t.texts[0]}</Text>;
}
