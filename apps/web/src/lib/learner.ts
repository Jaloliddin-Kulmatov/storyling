"use client";

import { configureStorage } from "@storyling/learner";

// The web keeps learner state in localStorage (browser only; the server render sees an empty store).
if (typeof window !== "undefined") configureStorage(window.localStorage);

export {
  defaultSettings,
  streakFrom,
  today,
  useCurrentLanguage,
  useHydrated,
  useLearner,
  useSettings,
  type DayLog,
  type Level,
  type Settings,
  type StoredWord,
  type UserStory,
} from "@storyling/learner";
