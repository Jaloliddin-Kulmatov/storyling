"use client";

import { FIT_LABEL, type Coverage } from "@storyling/core";
import Link from "next/link";
import type { ReactNode } from "react";
import type { AnyStory } from "@/lib/stories";
import { isUserStory, TOPIC_LABEL } from "@/lib/stories";

/** Small stroke icons (no emoji as UI glyphs). */
export const Icon = {
  today: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>,
  library: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true"><path d="M2 5h7a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H2zM22 5h-7a3 3 0 0 0-3 3v12a2 2 0 0 1 2-2h8z" /></svg>,
  words: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="6" width="14" height="14" rx="2" /><path d="M7 3h12a2 2 0 0 1 2 2v12" /></svg>,
  dict: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>,
  progress: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>,
  add: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>,
  settings: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg>,
  play: <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M7 4l13 8-13 8z" /></svg>,
  pause: <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>,
  prev: <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M18 5L8 12l10 7zM6 5h2v14H6z" /></svg>,
  next: <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M6 5l10 7-10 7zM16 5h2v14h-2z" /></svg>,
  speaker: <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" /><path d="M17 8a5 5 0 0 1 0 8" /></svg>,
  back: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>,
  close: <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>,
  spark: <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l2.2 5.6L20 9.5l-4.4 3.9L17 19l-5-3-5 3 1.4-5.6L4 9.5l5.8-.9z" /></svg>,
};

const ART: Record<string, ReactNode> = {
  food: <><circle cx="60" cy="58" r="30" fill="#F08A4B" /><rect x="26" y="50" width="68" height="10" rx="5" fill="#C4572A" /><path d="M48 26c-4-6 4-8 0-14M60 28c-4-6 4-8 0-14M72 26c-4-6 4-8 0-14" stroke="#C4572A" strokeWidth="3" fill="none" strokeLinecap="round" /></>,
  daily: <><rect x="40" y="16" width="40" height="64" rx="8" fill="#2F6FD6" /><rect x="45" y="24" width="30" height="44" rx="3" fill="#BCD9FF" /><circle cx="90" cy="24" r="8" fill="#FFB84D" /></>,
  work: <><rect x="34" y="20" width="52" height="64" rx="3" fill="#5A5FC8" /><g fill="#DCDCFF"><rect x="42" y="28" width="10" height="9" /><rect x="56" y="28" width="10" height="9" /><rect x="70" y="28" width="10" height="9" /><rect x="42" y="42" width="10" height="9" /><rect x="70" y="42" width="10" height="9" /></g><rect x="54" y="66" width="12" height="18" fill="#2E317D" /></>,
  weather: <><ellipse cx="60" cy="38" rx="30" ry="16" fill="#5B8FA8" /><circle cx="48" cy="32" r="13" fill="#5B8FA8" /><circle cx="68" cy="28" r="15" fill="#5B8FA8" /><path d="M42 62l-4 10M58 62l-4 10M74 62l-4 10" stroke="#2D6F8C" strokeWidth="3" strokeLinecap="round" /></>,
  animals: <><circle cx="60" cy="54" r="24" fill="#E0779A" /><path d="M40 40l2-22 14 14zM80 40l-2-22-14 14z" fill="#E0779A" /><circle cx="51" cy="52" r="3" fill="#5A1F33" /><circle cx="69" cy="52" r="3" fill="#5A1F33" /></>,
  travel: <><circle cx="84" cy="26" r="11" fill="#F2A200" /><path d="M8 86l34-46 20 26 14-16 36 36z" fill="#D48A1E" /></>,
  city: <><rect x="22" y="30" width="76" height="40" rx="10" fill="#1F9E74" /><g fill="#D6F5E8"><rect x="30" y="38" width="16" height="13" rx="2" /><rect x="52" y="38" width="16" height="13" rx="2" /><rect x="74" y="38" width="16" height="13" rx="2" /></g><circle cx="40" cy="74" r="6" fill="#145C45" /><circle cx="80" cy="74" r="6" fill="#145C45" /></>,
  home: <><path d="M24 50L60 22l36 28v34H24z" fill="#B5835A" /><rect x="52" y="60" width="16" height="24" fill="#6E4628" /></>,
  mine: <><rect x="30" y="18" width="52" height="64" rx="5" fill="#8A7CC6" /><path d="M40 32h32M40 42h32M40 52h22" stroke="#ECE8FB" strokeWidth="3" strokeLinecap="round" /></>,
};

export function Art({ topic, className = "" }: { topic: string; className?: string }) {
  const key = ART[topic] ? topic : "mine";
  return (
    <span className={`art art-${key} ${className}`} aria-hidden="true">
      <svg viewBox="0 0 120 90">{ART[key]}</svg>
    </span>
  );
}

export function FitBadge({ coverage }: { coverage: Coverage }) {
  return <span className={`pill fit-${coverage.fit}`}>{FIT_LABEL[coverage.fit]} · {coverage.percent}%</span>;
}

export function CoverageBar({ coverage }: { coverage: Coverage }) {
  return (
    <span className="covbar" aria-hidden="true">
      <i style={{ width: `${coverage.percent}%`, background: "var(--primary)" }} />
    </span>
  );
}

export function StoryCard({ story, coverage, read }: { story: AnyStory; coverage: Coverage; read: boolean }) {
  const topic = isUserStory(story) ? "mine" : story.topic;
  return (
    <Link href={`/${story.lang}/read/${story.id}`} className="story-card">
      <Art topic={topic} />
      <span className="body">
        <span className="t" lang={story.lang}>{story.title}</span>
        <span className="muted small">{story.titleEnglish || TOPIC_LABEL[topic]}</span>
        <CoverageBar coverage={coverage} />
        <span className="row small muted" style={{ justifyContent: "space-between", marginTop: 4 }}>
          <span>{story.level} · {story.minutes} min{read ? " · Read" : ""}</span>
          <FitBadge coverage={coverage} />
        </span>
      </span>
    </Link>
  );
}

export function StoryRow({ story, coverage, read }: { story: AnyStory; coverage: Coverage; read: boolean }) {
  const topic = isUserStory(story) ? "mine" : story.topic;
  return (
    <Link href={`/${story.lang}/read/${story.id}`} className="row-card">
      <Art topic={topic} />
      <span style={{ minWidth: 0, display: "grid", gap: 2 }}>
        <span className="t" lang={story.lang}>{story.title}</span>
        <span className="muted small">{story.titleEnglish || TOPIC_LABEL[topic]} · {story.level} · {story.minutes} min{read ? " · Read" : ""}</span>
      </span>
      <FitBadge coverage={coverage} />
    </Link>
  );
}

export function Toast({ text }: { text: string | null }) {
  return text ? <div className="toast" role="status">{text}</div> : null;
}
