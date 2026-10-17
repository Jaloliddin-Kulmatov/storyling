# Storyling

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

4. Run the phone app (install the Expo Go app on your phone first, or Xcode for the iOS Simulator):

   ```bash
   cd apps/mobile && npx expo install --fix && npx expo start
   ```

   `expo install --fix` aligns the Expo package versions with the installed SDK.

## Layout

```
apps/
  web/            Next.js web app (deploys to Vercel)
  mobile/         Expo app for iOS and Android: same screens, bottom-sheet word lookup, bundled audio
packages/
  core/           learning engine: word model, coverage/fit, placement, FSRS review, recommender
  content/        seed stories, dictionary and recorded audio timings for 10 languages
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

## Status

Progress is stored on the device: localStorage on web, SQLite on the phone (`packages/learner`). Accounts and syncing come in Phase 1.

The seed audio was recorded with macOS voices and is labeled "Computer voice" in the player.

## Web app features

- **Today**: daily goal, streak, words due, the best next story and more picks at your level.
- **Library**: every story ranked by how much of it you already know; filter by level and topic, search, sort.
- **Reader**: tap any word for meaning, reading (pinyin/kana/romanization), audio and how often you've seen it; save for review, mark known or ignore; translations on/off; text size; recorded audio (or the browser voice) with sentence highlighting, prev/next and 0.75–1.25× speed; a quick check at the end; finishing a story updates every word in it and counts as review for due words.
- **Words**: spaced-repetition flashcards (FSRS) with the sentence you met the word in, and a word list.
- **Dictionary**: search every word in German/English etc., hear it, save it.
- **Progress**: 14-day chart, streak, stories read, quiz accuracy.
- **Add text**: paste any text and read it with the same tools.
- **AI (optional)**: explain a sentence or ask about it, import with full meanings and translations, and "Story for me", a new story at your level that uses the words you are learning.

Progress is saved in the browser (localStorage), so no account is needed. Settings has CSV export and reset.

## Deploy to Vercel

1. Push this folder to a GitHub repository.
2. On vercel.com: **Add New → Project**, import the repository.
3. Set **Root Directory** to `apps/web`. Vercel reads `apps/web/vercel.json` for the install and build commands.
4. Optional: under **Environment Variables**, add `GROQ_API_KEY` (from console.groq.com) to turn on the AI features. You can also set `GROQ_MODEL` (default `llama-3.3-70b-versatile`), or use `ANTHROPIC_API_KEY` instead of Groq. `AI_DAILY_LIMIT` sets how many AI requests each visitor gets per day (default 40). Without a key the site works fully, and the AI buttons are hidden.
5. Click **Deploy**.

With Groq, AI calls use `GROQ_MODEL`. With an Anthropic key they use `claude-opus-5-5` with server-side fallback turned on.
