"use client";

import { audio, language, type Span } from "@storyling/content";
import type { LangCode } from "@storyling/core";

/**
 * Audio for the reader.
 * - Catalog stories play clips out of recorded files: one file per story (a span per sentence)
 *   and one per language (a span per lemma). Media elements keep natural pitch at 0.75×.
 * - Anything without a recording (the learner's own texts, rare words) uses the browser's
 *   speech engine, labeled "Browser voice" in the player.
 */
const elements = new Map<string, HTMLAudioElement>();
let current: HTMLAudioElement | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
let token = 0;

function element(file: string): HTMLAudioElement {
  let el = elements.get(file);
  if (!el) {
    el = new Audio(file);
    el.preload = "auto";
    elements.set(file, el);
  }
  return el;
}

export function stopAudio() {
  token++;
  if (timer) clearInterval(timer);
  timer = null;
  current?.pause();
  current = null;
  if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
}

/** Resolves true when the clip played to its end, false if stopped or failed. */
async function playSpan(file: string, [start, end]: Span, rate = 1): Promise<boolean> {
  stopAudio();
  const mine = token;
  const el = element(file);
  current = el;
  el.playbackRate = rate;
  el.currentTime = Math.max(0, start - 0.04);
  try {
    await el.play();
  } catch {
    return false;
  }
  return new Promise((resolve) => {
    timer = setInterval(() => {
      if (mine !== token) return resolve(false);
      if (el.currentTime >= end + 0.06 || el.ended) {
        stopAudio();
        resolve(true);
      }
    }, 40);
  });
}

export const canSpeak = () => typeof speechSynthesis !== "undefined";

/** Browser text-to-speech. Resolves true when finished. */
export function speak(text: string, lang: LangCode, rate = 1): Promise<boolean> {
  stopAudio();
  if (!canSpeak()) return Promise.resolve(false);
  const mine = token;
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    const tag = language(lang).tts;
    u.lang = tag;
    u.rate = rate;
    const voice = speechSynthesis.getVoices().find((v) => v.lang?.toLowerCase().startsWith(tag.slice(0, 2)));
    if (voice) u.voice = voice;
    u.onend = () => resolve(mine === token);
    u.onerror = () => resolve(false);
    speechSynthesis.speak(u);
  });
}

export const hasRecording = (storyId: string) => !!audio.stories[storyId];

/** Play one sentence: the recording when there is one, otherwise the browser voice. */
export function playSentence(storyId: string, lang: LangCode, index: number, text: string, rate = 1): Promise<boolean> {
  const a = audio.stories[storyId];
  const span = a?.s[index];
  return a && span ? playSpan(a.f, span, rate) : speak(text, lang, rate);
}

export function playWord(lang: LangCode, lemma: string, surface: string): Promise<boolean> {
  const a = audio.words[lang];
  const span = a?.w[lemma];
  return a && span ? playSpan(a.f, span) : speak(surface, lang);
}

/** Start downloading a story's audio so the first tap plays without delay. */
export function preload(storyId: string, lang: LangCode) {
  const s = audio.stories[storyId];
  const w = audio.words[lang];
  if (s) element(s.f);
  if (w) element(w.f);
}
