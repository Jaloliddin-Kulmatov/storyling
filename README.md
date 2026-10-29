# Storyling

**Live:** [storyling.vercel.app](https://storyling.vercel.app) · **Code:** [github.com/Jaloliddin-Kulmatov/storyling](https://github.com/Jaloliddin-Kulmatov/storyling)

Learn languages by reading stories you can almost understand. Web, iOS and Android from one TypeScript codebase.

- Product and architecture plan: [Storyling Blueprint](https://claude.ai/artifact/PhNRPxmNfHUJvbwCgvfag4)
- Screens for web and app: [Storyling Design](https://claude.ai/artifact/CH7GK3ocsQ8aHUXFK9KAHa)

## Setup

1. Install **Node.js 22 LTS** from <https://nodejs.org> (macOS installer).
2. Install dependencies (Corepack ships with Node and fetches the pinned pnpm version):

   ```bash
   corepack pnpm install
   ```

3. Run the tests and start the web app:

   ```bash
   corepack pnpm test
   corepack pnpm --filter @storyling/web dev
   ```

   Then open <http://localhost:3000>.

4. Run the phone app (Expo, iOS and Android):

   ```bash
   cd apps/mobile && npx expo run:ios
   ```

   This builds the app into the iOS Simulator (needs Xcode, opened once to finish setup). For a quick look in a browser instead, run `corepack pnpm --filter @storyling/mobile web`.

   The app has Home, a reader with tap-to-translate and audio, Notebook, Watch, Practice games and Me. Progress is stored on the phone.

## Layout

```
apps/
  web/            Next.js web app (deploys to Vercel)
  mobile/         Expo app for iOS and Android: tabs for Home, Notebook, Watch, Practice and Me
packages/
  core/           learning engine: word model, coverage/fit, placement, FSRS review, recommender
  content/        stories, dictionary, grammar, videos and audio timings for 10 languages
  learner/        learner state (known words, review cards) shared by web and mobile
  ui-tokens/      colors, fonts and sizes shared by web and app
prototype/        the first single-file version, kept for reference
docs/             the Blueprint and the first competitor analysis
```

## How the engine works

- Every word has a probability that the learner knows it (`packages/core/src/wordModel.ts`). Reading past a word raises it; tapping it lowers it.
- A story's **coverage** is the average of those probabilities over its words. 95–98% is "just right".
- When a word that's due for review appears in a story and the learner reads past it without tapping, that counts as a review (`session.ts`).
- Flashcards are scheduled with FSRS (`scheduler.ts`, via `ts-fsrs`).

## Languages

English, Spanish, French, German, Chinese, Japanese, Korean, Turkish, Portuguese and Russian: 326 stories, each with translations, a dictionary entry for every word, a cover photo and recorded audio. German has 97 stories from A1 to C1 and grammar lessons; Turkish has 41 stories and grammar lessons.

## Web app features

- **Home**: For you (stories ranked by how much you already know), a Daily list that changes every day, levels, topics, search, reading counts.
- **Reader**: tap any word for its meaning, level, audio and examples; underlines by level; translations; recorded audio with sentence highlighting and 0.75–1.25× speed; dictation; AI grammar help; a quick check at the end.
- **Notebook**: saved words with due dates, sort and search, saved stories, reading history, your own texts, word packs by topic.
- **Practice**: flashcards (FSRS), match, level test, listening, dictation, build the sentence, grammar lessons and timed mock exams with a history of your papers. Keyboard shortcuts in every game.
- **Watch**: videos for learners by level, with a transcript you can paste and translate.
- **Dictionary**: every word with examples from the stories and special-letter keys.
- **Me**: progress chart, streak, account, leaderboard and settings (theme, text size, translation language).
- **Translations**: meanings and sentences in 18 languages (AI, cached and shared).
- **Accounts**: email sign-in, sync between devices and a day, week and month leaderboard.

Without an account, progress is saved in the browser (localStorage) or on the phone (SQLite).

## Audio

Story and word audio is generated with [Piper](https://github.com/OHF-Voice/piper1-gpl) using open voices (see the Credits page). The Korean, Japanese and Turkish voices are licensed for non-commercial use only and must be replaced before Storyling charges money. Your own texts use the most natural voice installed in the browser.

## Deploy to Vercel

1. Push this folder to a GitHub repository.
2. On vercel.com: **Add New → Project**, import the repository.
3. Set **Root Directory** to `apps/web`. Vercel reads `apps/web/vercel.json` for the install and build commands.
4. Optional: under **Environment Variables**, add `GROQ_API_KEY` (from console.groq.com) to turn on the AI features. You can also set `GROQ_MODEL` (default `llama-3.3-70b-versatile`), or use `ANTHROPIC_API_KEY` instead of Groq. `AI_DAILY_LIMIT` sets how many AI requests each visitor gets per day (default 40). Without a key the site works fully, and the AI buttons are hidden.
5. Optional: `DATABASE_URL` (a Neon Postgres connection string) turns on accounts, sync, the leaderboard, reading counts and the shared translation cache. Tables are created on first use. `AUTH_SECRET` is optional.
6. Click **Deploy**.

The phone app reads translations from the deployed site: set `EXPO_PUBLIC_API_URL=https://storyling.vercel.app` in `apps/mobile/.env`.

With Groq, AI calls use `GROQ_MODEL`. With an Anthropic key they use `claude-opus-5-5` with server-side fallback turned on.
