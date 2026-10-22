"use client";

import { language } from "@storyling/content";
import type { LangCode } from "@storyling/core";
import { useMemo, useState } from "react";
import type { Band, Channel, Video } from "@/lib/channels";
import { useLearner } from "@/lib/learner";
import { Icon } from "@/components/ui";

const BAND_LABEL: Record<Band, string> = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" };

function ago(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 864e5);
  if (days < 1) return "today";
  if (days < 7) return `${days} ${days === 1 ? "day" : "days"} ago`;
  if (days < 60) return `${Math.floor(days / 7)} wk ago`;
  return `${Math.floor(days / 30)} mo ago`;
}

/** Watch: recent videos from learner-friendly YouTube channels, filtered by difficulty, played in place. */
export function Watch({ lang, videos, channels }: { lang: LangCode; videos: Video[]; channels: Channel[] }) {
  const meta = language(lang);
  const learner = useLearner(lang);
  const bands = (["beginner", "intermediate", "advanced"] as Band[]).filter((b) => videos.some((v) => v.band === b));
  // Start on the band that fits the learner: placement level 0–1 is beginner.
  const start: Band | "all" = (learner.level ?? 0) <= 1 && bands.includes("beginner") ? "beginner" : "all";
  const [band, setBand] = useState<Band | "all">(start);
  const [channel, setChannel] = useState<string>("all");
  const list = useMemo(
    () => videos.filter((v) => (band === "all" || v.band === band) && (channel === "all" || v.channelId === channel)),
    [videos, band, channel],
  );
  const [playing, setPlaying] = useState<Video | null>(null);
  const current = playing ?? list[0] ?? null;

  return (
    <>
      <div className="page-head">
        <div><div className="eyebrow">{meta.name} · {videos.length} videos</div><h1>Watch</h1></div>
      </div>

      <div className="level-tabs" role="tablist" aria-label="Difficulty">
        <button role="tab" aria-selected={band === "all"} onClick={() => { setBand("all"); setPlaying(null); }}>All</button>
        {bands.map((b) => (
          <button key={b} role="tab" aria-selected={band === b} onClick={() => { setBand(b); setPlaying(null); }}>
            {BAND_LABEL[b]} <small>{videos.filter((v) => v.band === b).length}</small>
          </button>
        ))}
      </div>
      {channels.length > 1 && (
        <div className="filters" role="group" aria-label="Channel" style={{ margin: "12px 0 16px" }}>
          <button className="chip" aria-pressed={channel === "all"} onClick={() => { setChannel("all"); setPlaying(null); }}>All channels</button>
          {channels.map((c) => (
            <button key={c.id} className="chip" aria-pressed={channel === c.id} onClick={() => { setChannel(c.id); setPlaying(null); }}>{c.name}</button>
          ))}
        </div>
      )}

      {current ? (
        <div className="player-card">
          <div className="yt">
            <iframe
              key={current.id}
              src={`https://www.youtube-nocookie.com/embed/${current.id}?rel=0&cc_load_policy=1&cc_lang_pref=${lang}&hl=en`}
              title={current.title}
              allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              loading="lazy"
            />
          </div>
          <div className="pc-body">
            <span className="row small"><span className="lvl">{BAND_LABEL[current.band]}</span><span className="muted">{current.channel} · {ago(current.published)}</span></span>
            <b className="pc-title">{current.title}</b>
            <span className="muted small">Tip: turn on subtitles (CC) in the player. Slow the video down with the gear icon if it is too fast.</span>
            <a className="small" href={`https://www.youtube.com/watch?v=${current.id}`} target="_blank" rel="noopener noreferrer">Open on YouTube</a>
          </div>
        </div>
      ) : (
        <div className="empty"><p className="muted" style={{ margin: 0 }}>No videos here right now. Try another level.</p></div>
      )}

      <div className="video-grid">
        {list.map((v) => (
          <button key={v.id} className={`video-card${current?.id === v.id ? " on" : ""}`} onClick={() => { setPlaying(v); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
            <span className="thumb-v">
              <img src={`https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`} alt="" loading="lazy" />
              <span className="play-badge" aria-hidden="true">{Icon.play}</span>
            </span>
            <span className="vc-title">{v.title}</span>
            <span className="muted small">{v.channel} · {ago(v.published)}</span>
          </button>
        ))}
      </div>

      <div className="section-h"><h2>Channels</h2></div>
      <div className="list">
        {channels.map((c) => (
          <a key={c.id} className="trow channel-row" href={`https://www.youtube.com/channel/${c.id}`} target="_blank" rel="noopener noreferrer">
            <span><b>{c.name}</b><span className="g" style={{ display: "block" }}>{c.note}</span></span>
            <span className="btn sm">Open channel</span>
          </a>
        ))}
      </div>
      <p className="muted small" style={{ marginTop: 14 }}>Videos belong to their creators and play from YouTube. Storyling shows each channel's latest uploads.</p>
    </>
  );
}
