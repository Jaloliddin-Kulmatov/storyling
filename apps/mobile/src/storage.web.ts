import { configureStorage } from "@storyling/learner";

// In a browser (Expo web preview), learner state lives in localStorage.
configureStorage({
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
});
