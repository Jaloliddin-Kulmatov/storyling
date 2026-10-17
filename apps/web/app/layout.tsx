import { cssVars } from "@storyling/ui-tokens";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

// Color variables come from the shared tokens package, so web and app stay in sync.
const THEME = `:root{${cssVars("light")}}@media (prefers-color-scheme: dark){:root{${cssVars("dark")}color-scheme:dark}}`;

export const metadata: Metadata = {
  title: { default: "Storyling", template: "%s · Storyling" },
  description: "Read stories you can almost understand, in 10 languages.",
};

const FONTS =
  "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800" +
  "&family=Newsreader:opsz,wght@6..72,400;6..72,500" +
  "&family=Noto+Serif+KR:wght@400;600&family=Noto+Serif+JP:wght@400&family=Noto+Serif+SC:wght@400" +
  "&family=JetBrains+Mono:wght@500&display=swap";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href={FONTS} />
        <style dangerouslySetInnerHTML={{ __html: THEME }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
