/**
 * Storyling design tokens. One source for the web (CSS variables) and the app (React Native theme).
 * Values match the Storyling Design canvas.
 */
export const color = {
  light: {
    bg: "#F4F7F6",
    surface: "#FFFFFF",
    surface2: "#EDF2F0",
    ink: "#10201B",
    inkSoft: "#3D4D47",
    muted: "#55665F",
    line: "#DCE5E1",
    primary: "#08785C", // fills under white text (5.4:1)
    primaryStrong: "#055C46",
    primarySoft: "#DAF2EA",
    newWord: "#A86F00", // underline for words not met yet
    newWordSoft: "#FFEFBD",
    learning: "#2B6DE0", // dotted outline for words in review
    learningSoft: "#E1EAFF",
    danger: "#C2410C",
    dangerSoft: "#FDE6DC",
  },
  dark: {
    bg: "#0C1412",
    surface: "#13201B",
    surface2: "#1A2A24",
    ink: "#E3EEEA",
    inkSoft: "#B9C8C2",
    muted: "#93A7A0",
    line: "#24372F",
    primary: "#36C89D",
    primaryStrong: "#7FD9BC",
    primarySoft: "#12382D",
    newWord: "#F3C344",
    newWordSoft: "#3B3010",
    learning: "#77A2FF",
    learningSoft: "#172644",
    danger: "#FF8A5C",
    dangerSoft: "#3A1D12",
  },
} as const;

export type ColorToken = keyof typeof color.light;

export const font = {
  ui: '"Plus Jakarta Sans", -apple-system, "Segoe UI", system-ui, sans-serif',
  read: '"Newsreader", "Noto Serif KR", "Noto Serif JP", "Noto Serif SC", Georgia, serif',
  mono: '"JetBrains Mono", ui-monospace, Menlo, monospace',
} as const;

export const radius = { sm: 8, md: 12, lg: 18, xl: 24, pill: 999 } as const;
export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40 } as const;

/** Reading text sizes by screen. Line height stays near 2 for tappable words and ruby text. */
export const reading = { phone: { size: 21, lineHeight: 2.05 }, web: { size: 23, lineHeight: 2.1 } } as const;

/** CSS custom properties for a theme, e.g. `:root { ${cssVars("light")} }`. */
export function cssVars(theme: keyof typeof color): string {
  return Object.entries(color[theme])
    .map(([k, v]) => `--${k.replace(/[A-Z0-9]/g, (m) => "-" + m.toLowerCase())}: ${v};`)
    .join(" ");
}
