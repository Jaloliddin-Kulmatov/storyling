import { coverCredits } from "@storyling/content";
import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/ui";

export const metadata: Metadata = { title: "Photo credits" };

const LICENSE_URL: Record<string, string> = {
  "CC BY 2.0": "https://creativecommons.org/licenses/by/2.0/",
  "CC BY 2.5": "https://creativecommons.org/licenses/by/2.5/",
  "CC BY 3.0": "https://creativecommons.org/licenses/by/3.0/",
  "CC BY 4.0": "https://creativecommons.org/licenses/by/4.0/",
  "CC BY-SA 2.0": "https://creativecommons.org/licenses/by-sa/2.0/",
  "CC BY-SA 2.5": "https://creativecommons.org/licenses/by-sa/2.5/",
  "CC BY-SA 3.0": "https://creativecommons.org/licenses/by-sa/3.0/",
  "CC BY-SA 4.0": "https://creativecommons.org/licenses/by-sa/4.0/",
  CC0: "https://creativecommons.org/publicdomain/zero/1.0/",
};

/** Attribution for every cover photo, as their licenses require. */
export default function CreditsPage() {
  const items = Object.entries(coverCredits).sort((a, b) => a[1].file.localeCompare(b[1].file));
  return (
    <main className="landing" style={{ maxWidth: 820, margin: "0 auto", padding: "24px 16px 60px" }}>
      <Link href="/" className="logo"><Logo />Storyling</Link>
      <h1 style={{ margin: "26px 0 8px" }}>Photo credits</h1>
      <p className="muted">
        Story cover photos come from Wikimedia Commons. They are used under the licenses below; images were resized and cropped.
      </p>
      <h2 style={{ fontSize: 20, margin: "26px 0 6px" }}>Voices</h2>
      <p className="muted">
        Story audio is generated with <a href="https://github.com/OHF-Voice/piper1-gpl" rel="noopener noreferrer" target="_blank">Piper</a> using
        open voices: Thorsten (German, CC0), davefx and Ald (Spanish), Siwis (French, CC BY 4.0), MLS French (CC BY 4.0), Serena (Italian, CC BY 4.0),
        Faber and Jeff (Portuguese, CC0), Denis and Dmitri (Russian, CC0), Chaowen (Chinese, CC0), and Joe and Kristin (English, CC0 and public domain).
      </p>
      <h1 style={{ margin: "26px 0 8px", fontSize: 24 }}>Photos</h1>
      <ul className="credit-list" style={{ listStyle: "none", padding: 0 }}>
        {items.map(([slug, c]) => (
          <li key={slug}>
            <img src={`/covers/${slug}.jpg`} alt="" loading="lazy" />
            <span className="small">
              <a href={c.page} rel="noopener noreferrer" target="_blank">{c.file}</a> by {c.author},{" "}
              {LICENSE_URL[c.license] ? <a href={LICENSE_URL[c.license]} rel="noopener noreferrer" target="_blank">{c.license}</a> : c.license}
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}
