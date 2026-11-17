/** Small animated previews for the game cards. Decorative only; they move on hover (or all the time on touch screens). */
export function GameArt({ mode }: { mode: string }) {
  switch (mode) {
    case "speed":
      return <div className="ga ga-speed"><span className="ring" /><b>⚡</b><i>60</i></div>;
    case "memory":
      return <div className="ga ga-memory">{["🍎", "?", "🍎"].map((x, i) => <span key={i} style={{ ["--d" as string]: `${i * 0.35}s` }}><em>?</em><em>{x}</em></span>)}</div>;
    case "picture":
      return <div className="ga ga-picture"><span>🐶</span><span>🚲</span><span>☕</span></div>;
    case "bingo":
      return <div className="ga ga-bingo">{Array.from({ length: 9 }, (_, i) => <span key={i} style={{ ["--d" as string]: `${[0, 4, 8].includes(i) ? [0, 4, 8].indexOf(i) * 0.4 : 9}s` }} className={[0, 4, 8].includes(i) ? "hit" : ""} />)}</div>;
    case "match":
      return <div className="ga ga-match"><span className="l">🐶</span><span className="r">dog</span></div>;
    case "gaps":
      return <div className="ga ga-gaps"><span>☕ <u>c<b>offee</b></u></span></div>;
    case "order":
      return <div className="ga ga-order"><span style={{ ["--x" as string]: "2" }}>3</span><span style={{ ["--x" as string]: "0" }}>1</span><span style={{ ["--x" as string]: "1" }}>2</span></div>;
    case "listen":
    case "dictation":
      return <div className={`ga ga-wave${mode === "dictation" ? " typing" : ""}`}>{Array.from({ length: 9 }, (_, i) => <span key={i} style={{ ["--d" as string]: `${i * 0.09}s` }} />)}{mode === "dictation" && <i>✎ ________</i>}</div>;
    case "spell":
      return <div className="ga ga-spell">{["W", "O", "R", "D"].map((c, i) => <span key={i} style={{ ["--d" as string]: `${i * 0.18}s` }}>{c}</span>)}</div>;
    case "say":
      return <div className="ga ga-say"><span className="p1" /><span className="p2" /><b>🎤</b></div>;
    default:
      return <div className="ga ga-book"><b>📘</b><span>A · B · C</span></div>;
  }
}
