import { configureStorage, configureTranslation, type KeyValueStorage } from "@storyling/learner";

// In a browser (Expo web preview), learner state lives in localStorage.
const kv: KeyValueStorage = {
  getItem: (key) => {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // storage unavailable (private mode); progress lasts for this visit only
    }
  },
};
configureStorage(kv);

const api = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");
configureTranslation({ storage: kv, ...(api ? { endpoint: `${api}/api/translate` } : {}) });
