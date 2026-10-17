import { color, radius, reading } from "@storyling/ui-tokens";
import { Platform, useColorScheme } from "react-native";

/** Serif for reading text. System fonts for now; bundle Newsreader / Noto Serif with expo-font later. */
export const READ_FONT = Platform.select({ ios: "Georgia", default: "serif" });

/** Colors for the current system theme, from the shared tokens. */
export function useTheme() {
  const scheme = useColorScheme();
  return scheme === "dark" ? color.dark : color.light;
}

export type Theme = ReturnType<typeof useTheme>;
export { radius, reading };
