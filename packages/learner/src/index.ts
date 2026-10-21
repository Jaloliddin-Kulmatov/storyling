import { storiesFor, starterWords, type CatalogStory } from "@storyling/content";
import {
  applyEvent,
  displayState,
  isDue,
  narrativeReviews,
  newCard,
  newUserWord,
  readingEvents,
  review,
  type LangCode,
  type ReviewCard,
  type ReviewGrade,
  type Story,
  type UserWord,
  type WordState,
} from "@storyling/core";
import { useCallback, useSyncExternalStore } from "react";

/**
 * Learner state shared by web and mobile: known words, review cards, finished stories,
 * reading time, the learner's own texts and settings. Each platform plugs in its own
 * synchronous key-value storage (localStorage on web, expo-sqlite's kv-store on the phone).
 * The shape mirrors the `user_words` / `sessions` tables in the Blueprint, so moving to
 * SQLite + sync later is mechanical.
 */
export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export type Level = 0 | 1 | 2;

export interface StoredWord extends UserWord {
  card?: ReviewCard;
  /** Where the learner met the word when they saved it, for review cards. */
  source?: { storyId: string; sentence: number };
}

/** A text the learner added (pasted or written by AI). Same shape as a catalog story, plus its own glossary. */
export interface UserStory extends CatalogStory {
  origin: "paste" | "ai";
  /** lemma → [part of speech, English meaning, reading?] */
  dict: Record<string, [string, string] | [string, string, string]>;
  createdAt: number;
}

export interface DayLog {
  seconds: number;
  words: number;
  stories: number;
}

interface LangProfile {
  level: Level;
  words: Record<string, StoredWord>;
  finished: string[];
  stories: UserStory[];
  /** "YYYY-MM-DD" → activity that day */
  log: Record<string, DayLog>;
  quiz: { right: number; total: number };
  /** Story ids the learner bookmarked. */
  favorites: string[];
  /** Best scores in practice games, by game id. */
  games: Record<string, { played: number; best: number }>;
}

export interface Settings {
  fontScale: number; // 0.85 – 1.4
  highlightNew: boolean;
  showTranslations: boolean;
  rate: number; // audio speed
  dailyGoalMinutes: number;
}

interface Store {
  lang?: LangCode;
  profiles: Partial<Record<LangCode, LangProfile>>;
  settings: Settings;
}

const KEY = "storyling.learner.v2";
const UNSEEN_P = 0.05;
const STARTER_P = 0.97;

export const defaultSettings: Settings = {
  fontScale: 1,
  highlightNew: true,
  showTranslations: false,
  rate: 1,
  dailyGoalMinutes: 10,
};

const EMPTY: Store = { profiles: {}, settings: defaultSettings };

let storage: KeyValueStorage | null = null;
let cache: Store | null = null;
const listeners = new Set<() => void>();

/** Call once at startup, before the first render that uses the hooks. */
export function configureStorage(s: KeyValueStorage) {
  storage = s;
  cache = null;
}

function revive(store: Store): Store {
  for (const profile of Object.values(store.profiles)) {
    if (!profile) continue;
    profile.stories ??= [];
    profile.log ??= {};
    profile.quiz ??= { right: 0, total: 0 };
    profile.favorites ??= [];
    profile.games ??= {};
    for (const w of Object.values(profile.words)) {
      if (w.card) {
        w.card.due = new Date(w.card.due);
        if (w.card.last_review) w.card.last_review = new Date(w.card.last_review);
      }
    }
  }
  store.settings = { ...defaultSettings, ...store.settings };
  return store;
}

/** Earlier versions stored only profiles at the top level. */
function migrate(raw: unknown): Store {
  if (raw && typeof raw === "object" && "profiles" in raw) return raw as Store;
  return { profiles: (raw ?? {}) as Store["profiles"], settings: defaultSettings };
}

function read(): Store {
  if (cache) return cache;
  if (!storage) return EMPTY;
  try {
    const v2 = storage.getItem(KEY);
    const v1 = v2 ? null : storage.getItem("storyling.learner.v1");
    cache = revive(migrate(JSON.parse(v2 ?? v1 ?? "{}")));
  } catch {
    cache = { profiles: {}, settings: defaultSettings };
  }
  return cache;
}

function write(next: Store) {
  cache = next;
  try {
    storage?.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage full or blocked: keep working in memory for this visit.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const today = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function seedWords(lang: LangCode, level: Level): Record<string, StoredWord> {
  let lemmas = starterWords(lang);
  if (level === 0) lemmas = lemmas.slice(0, 8);
  if (level === 2) {
    const firstLevel = storiesFor(lang)[0]?.level;
    for (const s of storiesFor(lang).filter((x) => x.level === firstLevel))
      for (const sent of s.sentences) for (const t of sent.tokens) if (t.lemma) lemmas = [...lemmas, t.lemma];
  }
  return Object.fromEntries(lemmas.map((l) => [l, newUserWord(l, STARTER_P)]));
}

const noop = () => () => {};
/** False during server render and hydration, true after. Avoids flashing the wrong screen. */
export function useHydrated(): boolean {
  return useSyncExternalStore(noop, () => true, () => false);
}

/** The whole store; re-renders on any change. */
function useStore(): Store {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function useSettings() {
  const { settings } = useStore();
  const set = useCallback((patch: Partial<Settings>) => {
    const s = read();
    write({ ...s, settings: { ...s.settings, ...patch } });
  }, []);
  return [settings, set] as const;
}

/** The language the learner chose last, if any. */
export function useCurrentLanguage(): LangCode | undefined {
  return useStore().lang;
}

export interface FinishResult {
  newlyKnown: number;
  reviewedInStory: number;
}

export function streakFrom(log: Record<string, DayLog>, now = new Date()): number {
  let streak = 0;
  const d = new Date(now);
  // Today counts if active; otherwise the streak can still run through yesterday.
  if (!log[today(d)]?.seconds) d.setDate(d.getDate() - 1);
  while (log[today(d)]?.seconds) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export function useLearner(lang: LangCode) {
  const store = useStore();
  const profile = store.profiles[lang];

  const update = useCallback(
    (fn: (p: LangProfile) => LangProfile) => {
      const s = read();
      const current = s.profiles[lang];
      if (!current) return;
      write({ ...s, profiles: { ...s.profiles, [lang]: fn(current) } });
    },
    [lang],
  );

  const start = useCallback(
    (level: Level) => {
      const s = read();
      const existing = s.profiles[lang];
      write({
        ...s,
        lang,
        profiles: {
          ...s.profiles,
          [lang]: existing ?? { level, words: seedWords(lang, level), finished: [], stories: [], log: {}, quiz: { right: 0, total: 0 }, favorites: [], games: {} },
        },
      });
    },
    [lang],
  );

  /** Remember this as the current language (used by the home page redirect). */
  const select = useCallback(() => {
    const s = read();
    if (s.lang !== lang) write({ ...s, lang });
  }, [lang]);

  const pKnown = useCallback(
    (lemma: string) => {
      const w = profile?.words[lemma];
      if (!w) return UNSEEN_P;
      return w.saved === "ignored" ? 1 : w.pKnown;
    },
    [profile],
  );

  const wordState = useCallback((lemma: string): WordState => displayState(profile?.words[lemma]), [profile]);
  const word = useCallback((lemma: string) => profile?.words[lemma], [profile]);

  /** Save for review, mark known, ignore, or clear (undefined). */
  const setWord = useCallback(
    (lemma: string, choice: "learning" | "known" | "ignored" | undefined, source?: StoredWord["source"]) =>
      update((p) => {
        const w: StoredWord = p.words[lemma] ?? newUserWord(lemma, UNSEEN_P);
        let next: StoredWord;
        if (choice === "learning") next = { ...w, saved: "learning", card: w.card ?? newCard(), source: w.source ?? source };
        else if (choice === "known") next = { ...w, saved: undefined, pKnown: Math.max(w.pKnown, STARTER_P) };
        else if (choice === "ignored") next = { ...w, saved: "ignored" };
        else next = { ...w, saved: undefined };
        return { ...p, words: { ...p.words, [lemma]: next } };
      }),
    [update],
  );

  /** Record a finished story: reading events for every word, "reading counts as review", and the day log. */
  const finishStory = useCallback(
    (story: Story, tapped: ReadonlySet<string>): FinishResult => {
      const p = read().profiles[lang];
      if (!p) return { newlyKnown: 0, reviewedInStory: 0 };
      const now = new Date();
      const words = { ...p.words };
      let newlyKnown = 0;
      let count = 0;
      for (const ev of readingEvents(story, tapped, now.getTime())) {
        const before = words[ev.lemma] ?? newUserWord(ev.lemma, UNSEEN_P);
        const after = applyEvent(before, ev);
        if (displayState(before) !== "known" && displayState(after) === "known") newlyKnown++;
        words[ev.lemma] = after;
        count++;
      }
      const due = new Set(Object.values(words).filter((w) => w.card && isDue(w.card, now)).map((w) => w.lemma));
      const grades = narrativeReviews(story, due, tapped);
      for (const [lemma, grade] of grades) {
        const w = words[lemma]!;
        words[lemma] = { ...w, card: review(w.card!, grade, now) };
      }
      const day = today(now);
      const log = p.log[day] ?? { seconds: 0, words: 0, stories: 0 };
      const firstTime = !p.finished.includes(story.id);
      update(() => ({
        ...p,
        words,
        finished: firstTime ? [...p.finished, story.id] : p.finished,
        log: { ...p.log, [day]: { ...log, words: log.words + count, stories: log.stories + (firstTime ? 1 : 0) } },
      }));
      return { newlyKnown, reviewedInStory: grades.size };
    },
    [lang, update],
  );

  /** Add reading or listening time (called every few seconds while a story is open). */
  const addTime = useCallback(
    (seconds: number) =>
      update((p) => {
        const day = today();
        const log = p.log[day] ?? { seconds: 0, words: 0, stories: 0 };
        return { ...p, log: { ...p.log, [day]: { ...log, seconds: log.seconds + seconds } } };
      }),
    [update],
  );

  const recordQuiz = useCallback(
    (right: number, total: number) => update((p) => ({ ...p, quiz: { right: p.quiz.right + right, total: p.quiz.total + total } })),
    [update],
  );

  const dueWords = useCallback(
    () => Object.values(profile?.words ?? {}).filter((w) => w.saved === "learning" && w.card && isDue(w.card)),
    [profile],
  );

  const grade = useCallback(
    (lemma: string, g: ReviewGrade) =>
      update((p) => {
        const w = p.words[lemma];
        if (!w?.card) return p;
        const card = review(w.card, g);
        // A word answered "easy" with a long interval is treated as known.
        const graduated = g === "easy" && card.scheduled_days >= 21;
        return {
          ...p,
          words: { ...p.words, [lemma]: graduated ? { ...w, card, saved: undefined, pKnown: Math.max(w.pKnown, STARTER_P) } : { ...w, card } },
        };
      }),
    [update],
  );

  const toggleFavorite = useCallback(
    (id: string) =>
      update((p) => ({ ...p, favorites: p.favorites.includes(id) ? p.favorites.filter((f) => f !== id) : [id, ...p.favorites] })),
    [update],
  );

  /** Record a practice game result; keeps the best score. */
  const recordGame = useCallback(
    (game: string, score: number) =>
      update((p) => {
        const g = p.games[game] ?? { played: 0, best: 0 };
        return { ...p, games: { ...p.games, [game]: { played: g.played + 1, best: Math.max(g.best, score) } } };
      }),
    [update],
  );

  const addStory = useCallback((story: UserStory) => update((p) => ({ ...p, stories: [story, ...p.stories] })), [update]);
  const removeStory = useCallback((id: string) => update((p) => ({ ...p, stories: p.stories.filter((s) => s.id !== id) })), [update]);

  /** Forget everything for this language. */
  const reset = useCallback(() => {
    const s = read();
    const profiles = { ...s.profiles };
    delete profiles[lang];
    write({ ...s, profiles, lang: s.lang === lang ? undefined : s.lang });
  }, [lang]);

  const words = Object.values(profile?.words ?? {});
  return {
    started: !!profile,
    level: profile?.level,
    finished: profile?.finished ?? [],
    stories: profile?.stories ?? [],
    log: profile?.log ?? {},
    quiz: profile?.quiz ?? { right: 0, total: 0 },
    favorites: profile?.favorites ?? [],
    games: profile?.games ?? {},
    knownCount: words.filter((w) => displayState(w) === "known").length,
    learningCount: words.filter((w) => w.saved === "learning").length,
    allWords: words,
    streak: streakFrom(profile?.log ?? {}),
    start,
    select,
    pKnown,
    wordState,
    word,
    setWord,
    finishStory,
    addTime,
    recordQuiz,
    dueWords,
    grade,
    toggleFavorite,
    recordGame,
    addStory,
    removeStory,
    reset,
  };
}
