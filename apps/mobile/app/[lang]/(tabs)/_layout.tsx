import { Ionicons } from "@expo/vector-icons";
import type { LangCode } from "@storyling/core";
import { useLearner } from "@storyling/learner";
import { Tabs, useLocalSearchParams } from "expo-router";
import { useTheme } from "../../../src/theme";

type Glyph = keyof typeof Ionicons.glyphMap;
const icon = (name: Glyph, active: Glyph) =>
  ({ color, focused }: { color: string; focused: boolean }) => <Ionicons name={focused ? active : name} size={24} color={color} />;

/** Bottom tabs, like other reading apps: Home, Notebook, Watch, Practice, Me. */
export default function TabsLayout() {
  const { lang } = useLocalSearchParams<{ lang: LangCode }>();
  const learner = useLearner(lang);
  const t = useTheme();
  const due = learner.dueWords().length;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.primary,
        tabBarInactiveTintColor: t.muted,
        tabBarStyle: { backgroundColor: t.surface, borderTopColor: t.line },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: icon("home-outline", "home") }} />
      <Tabs.Screen name="notebook" options={{ title: "Notebook", tabBarIcon: icon("book-outline", "book") }} />
      <Tabs.Screen name="watch" options={{ title: "Watch", tabBarIcon: icon("play-circle-outline", "play-circle") }} />
      <Tabs.Screen name="practice" options={{ title: "Practice", tabBarIcon: icon("grid-outline", "grid"), tabBarBadge: due > 0 ? due : undefined }} />
      <Tabs.Screen name="me" options={{ title: "Me", tabBarIcon: icon("person-outline", "person") }} />
    </Tabs>
  );
}
