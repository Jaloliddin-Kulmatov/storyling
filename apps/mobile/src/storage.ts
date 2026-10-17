import { configureStorage } from "@storyling/learner";
import Storage from "expo-sqlite/kv-store";

// The phone keeps learner state in SQLite through expo-sqlite's synchronous key-value store.
configureStorage({
  getItem: (key) => Storage.getItemSync(key),
  setItem: (key, value) => Storage.setItemSync(key, value),
});
