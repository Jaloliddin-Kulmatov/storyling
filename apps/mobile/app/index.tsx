import { languages, storiesFor } from "@storyling/content";
import { Link } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { READ_FONT, useTheme } from "../src/theme";

export default function PickLanguage() {
  const t = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.brand}>
          <View style={[styles.mark, { backgroundColor: t.primary }]}>
            <Text style={styles.markText}>S</Text>
          </View>
          <Text style={[styles.brandText, { color: t.ink }]}>Storyling</Text>
        </View>
        <Text style={[styles.h1, { color: t.ink }]} accessibilityRole="header">
          Which language do you want to read?
        </Text>
        <Text style={[styles.lead, { color: t.muted }]}>Explanations are in English. Add more languages later.</Text>
        <View style={styles.grid}>
          {languages.map((l) => (
            <Link key={l.code} href={`/${l.code}`} asChild>
              <Pressable
                style={[styles.card, { backgroundColor: t.surface, borderColor: t.line }]}
                accessibilityLabel={`${l.name}, ${storiesFor(l.code).length} stories`}
              >
                <Text style={[styles.native, { color: t.ink }]}>{l.native}</Text>
                <Text style={[styles.name, { color: t.muted }]}>{l.name}</Text>
              </Pressable>
            </Link>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 20, paddingBottom: 40, gap: 12 },
  brand: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  mark: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  markText: { color: "#fff", fontSize: 18, fontFamily: READ_FONT },
  brandText: { fontSize: 18, fontWeight: "800" },
  h1: { fontSize: 28, fontWeight: "800", letterSpacing: -0.6, lineHeight: 32 },
  lead: { fontSize: 15, marginBottom: 8 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  card: { width: "48%", flexGrow: 1, minHeight: 72, borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, justifyContent: "center" },
  native: { fontSize: 21, fontFamily: READ_FONT },
  name: { fontSize: 12.5, marginTop: 2 },
});
