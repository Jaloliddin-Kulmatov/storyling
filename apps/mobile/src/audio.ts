import { audio, type Span } from "@storyling/content";
import type { LangCode } from "@storyling/core";
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";
import { audioAssets } from "./audioAssets";

/**
 * Plays clips out of the bundled recordings: one file per story (a span per sentence)
 * and one per language (a span per lemma). Same files and timings as the web app.
 */
const players = new Map<string, AudioPlayer>();
let current: AudioPlayer | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
let token = 0;
let modeSet = false;

/** "/audio/ko-store.mp4" → "ko-store" */
const keyOf = (file: string) => file.replace(/^.*\//, "").replace(/\.mp4$/, "");

function player(file: string): AudioPlayer | null {
  const key = keyOf(file);
  const asset = audioAssets[key];
  if (asset === undefined) return null;
  let p = players.get(key);
  if (!p) {
    p = createAudioPlayer(asset);
    players.set(key, p);
  }
  return p;
}

export function stopAudio() {
  token++;
  if (timer) clearInterval(timer);
  timer = null;
  current?.pause();
  current = null;
}

/** Resolves true when the clip played to its end, false if stopped or unavailable. */
export async function playSpan(file: string, [start, end]: Span, rate = 1): Promise<boolean> {
  stopAudio();
  const mine = token;
  const p = player(file);
  if (!p) return false;
  if (!modeSet) {
    modeSet = true;
    // Play even when the phone's silent switch is on: learners expect to hear the story.
    await setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }
  current = p;
  p.setPlaybackRate(rate);
  await p.seekTo(Math.max(0, start - 0.04));
  if (mine !== token) return false;
  p.play();
  return new Promise((resolve) => {
    timer = setInterval(() => {
      if (mine !== token) return resolve(false);
      if (p.currentTime >= end + 0.06) {
        stopAudio();
        resolve(true);
      }
    }, 40);
  });
}

export function playSentence(storyId: string, index: number, rate = 1): Promise<boolean> {
  const a = audio.stories[storyId];
  const span = a?.s[index];
  return a && span ? playSpan(a.f, span, rate) : Promise.resolve(false);
}

export function playWord(lang: LangCode, lemma: string): Promise<boolean> {
  const a = audio.words[lang];
  const span = a?.w[lemma];
  return a && span ? playSpan(a.f, span) : Promise.resolve(false);
}

export function hasStoryAudio(storyId: string): boolean {
  return !!audio.stories[storyId];
}

// ── speech for texts without a recording ──
import * as Speech from "expo-speech";
import { language } from "@storyling/content";

export function speak(text: string, lang: LangCode, rate = 1): Promise<boolean> {
  stopAudio();
  Speech.stop();
  const mine = token;
  return new Promise((resolve) => {
    Speech.speak(text, {
      language: language(lang).tts,
      rate,
      onDone: () => resolve(mine === token),
      onStopped: () => resolve(false),
      onError: () => resolve(false),
    });
  });
}

/** A sentence: the recording when there is one, otherwise the device voice. */
export async function playSentenceAny(storyId: string, lang: LangCode, index: number, text: string, rate = 1): Promise<boolean> {
  if (hasStoryAudio(storyId)) return playSentence(storyId, index, rate);
  return speak(text, lang, rate);
}

/** A word: the recorded clip when there is one, otherwise the device voice. */
export async function playWordAny(lang: LangCode, lemma: string, surface: string): Promise<boolean> {
  if (audio.words[lang]?.w[lemma]) return playWord(lang, lemma);
  return speak(surface, lang);
}

export function stopAll() {
  stopAudio();
  Speech.stop();
}
