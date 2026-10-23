import { configureStorage, configureTranslation, type KeyValueStorage } from "@storyling/learner";
import Storage from "expo-sqlite/kv-store";

// The phone keeps learner state in SQLite through expo-sqlite's synchronous key-value store.
const kv: KeyValueStorage = {
  getItem: (key) => Storage.getItemSync(key),
  setItem: (key, value) => Storage.setItemSync(key, value),
};
configureStorage(kv);

// Translations come from the Storyling server (EXPO_PUBLIC_API_URL, e.g. https://your-app.vercel.app). Without it, text stays English.
const api = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");
configureTranslation({ storage: kv, ...(api ? { endpoint: `${api}/api/translate` } : {}) });
