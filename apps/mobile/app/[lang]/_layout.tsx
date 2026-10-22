import type { LangCode } from "@storyling/core";
import { useLearner } from "@storyling/learner";
import { Redirect, Stack, useLocalSearchParams } from "expo-router";
import { useTheme } from "../../src/theme";

/** Everything under a language needs a started profile; otherwise onboarding first. */
export default function LanguageLayout() {
  const { lang } = useLocalSearchParams<{ lang: LangCode }>();
  const learner = useLearner(lang);
  const t = useTheme();
  if (!learner.started) return <Redirect href={`/start/${lang}`} />;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.bg } }} />;
}
