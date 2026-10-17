import { languages, storiesFor } from "@storyling/content";
import Link from "next/link";
import { ContinueButton } from "@/views/ContinueButton";

export default function Landing() {
  return (
    <div className="landing">
      <header>
        <Link href="/" className="logo"><span className="mark">S</span>Storyling</Link>
        <ContinueButton />
      </header>

      <section className="hero">
        <div>
          <div className="eyebrow" style={{ color: "var(--primary)" }}>Graded reading for 10 languages</div>
          <h1 style={{ marginTop: 12 }}>
            Read stories you can <em>almost</em> understand.
          </h1>
          <p>
            Storyling learns the words you know and suggests stories where nearly every word is familiar. Tap any word for its meaning,
            listen along, take a quick quiz, and your new words come back for review.
          </p>
          <div className="row">
            <Link className="btn primary" href="/start" style={{ minHeight: 50, padding: "0 22px", fontSize: 16.5 }}>Start reading free</Link>
            <a className="btn" href="#how" style={{ minHeight: 50 }}>How it works</a>
          </div>
          <p className="muted small" style={{ margin: "16px 0 0" }}>No account needed · works on phone and desktop</p>
        </div>
        <div className="demo" aria-label="Example of the reader">
          <div className="spread small muted"><span>한국어 · 비 오는 날</span><span className="pill fit-just_right">Just right · 96%</span></div>
          <p lang="ko" className="hl" style={{ fontFamily: "var(--f-read)", fontSize: 25, lineHeight: 2.05, margin: "14px 0 0" }}>
            준호는 <span className="w learning">우산</span>이 없었어요. 그래서 버스 <span className="w new">정류장</span>까지 뛰어갔어요.
          </p>
          <div className="box" style={{ marginTop: 12 }}>
            <b style={{ fontFamily: "var(--f-read)", fontSize: 20 }}>정류장</b> <span className="muted small">noun</span>
            <div>stop (bus) · met 2 of about 10 times</div>
          </div>
        </div>
      </section>

      <div className="lang-strip">
        {languages.map((l) => <span key={l.code} lang={l.code}>{l.native}</span>)}
      </div>

      <section id="how" className="features">
        <div className="card"><h3>Stories at your level</h3><p className="muted">Every story shows how many of its words you know. Pick the ones marked “Just right”.</p></div>
        <div className="card"><h3>Tap any word</h3><p className="muted">See the meaning, hear it, and save it for review. Chinese shows pinyin.</p></div>
        <div className="card"><h3>Listen along</h3><p className="muted">Recorded audio for every story, with the sentence highlighted. Slow it down to 0.75×.</p></div>
        <div className="card"><h3>Reading counts as review</h3><p className="muted">Meet a saved word in a story and understand it, and that counts as a review.</p></div>
        <div className="card"><h3>Quizzes and flashcards</h3><p className="muted">A quick check after each story, and spaced-repetition review with the sentence you found the word in.</p></div>
        <div className="card"><h3>Your own texts</h3><p className="muted">Paste any text, or ask AI to write a story with your words. Same tools, same tracking.</p></div>
      </section>

      <section className="card" style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 22, marginBottom: 10 }}>Start with any language</h2>
        <div className="langs">
          {languages.map((l) => (
            <Link key={l.code} href={`/start?lang=${l.code}`} className="lang-opt">
              <span className="nat" lang={l.code}>{l.native}</span>
              <b>{l.name}</b>
              <span className="muted small">{storiesFor(l.code).length} stories</span>
            </Link>
          ))}
        </div>
      </section>

      <footer className="foot">Storyling · Your progress is saved in your browser · Audio is a computer voice and labeled as one</footer>
    </div>
  );
}
