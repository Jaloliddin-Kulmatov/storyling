"use client";

import { useEffect, useState } from "react";
import { useAccount } from "@/lib/account";

/** A calendar file with a daily repeating event and an alert: works on every phone without push notifications. */
function calendarFile(time: string, url: string) {
  const [h, m] = time.split(":");
  const d = new Date();
  const day = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Storyling//Reminder//EN", "BEGIN:VEVENT",
    `UID:storyling-daily-${Date.now()}@storyling`, `DTSTAMP:${day}T000000Z`,
    `DTSTART:${day}T${h}${m}00`, `DURATION:PT10M`, "RRULE:FREQ=DAILY",
    "SUMMARY:📚 10 minutes of reading (Storyling)", `DESCRIPTION:Read one story to keep your streak: ${url}`, `URL:${url}`,
    "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:Time to read", "TRIGGER:PT0M", "END:VALARM",
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
}

export function Reminders({ lang }: { lang: string }) {
  const a = useAccount();
  const [time, setTime] = useState("19:00");
  const [mail, setMail] = useState<{ on: boolean; email: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!a.enabled || !a.user) return;
    fetch("/api/reminders").then((r) => r.json()).then((d: { on?: boolean; email?: boolean }) => setMail({ on: !!d.on, email: !!d.email })).catch(() => {});
  }, [a.enabled, a.user]);

  const download = () => {
    const blob = new Blob([calendarFile(time, `${location.origin}/${lang}`)], { type: "text/calendar" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "storyling-reminder.ics";
    link.click();
    URL.revokeObjectURL(link.href);
  };
  const toggle = async () => {
    if (!mail) return;
    setBusy(true);
    const r = await fetch("/api/reminders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ on: !mail.on }) }).then((x) => x.json()).catch(() => null);
    if (r) setMail({ on: !!r.on, email: !!r.email });
    setBusy(false);
  };

  return (
    <section className="box reminder-box" aria-label="Daily reminder">
      <b>⏰ Daily reminder</b>
      <span className="small muted">People who practise at the same time every day keep their streak far longer.</span>
      <div className="row" style={{ alignItems: "center" }}>
        <input className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} aria-label="Reminder time" style={{ width: 130 }} />
        <button className="btn primary sm" onClick={download}>Add to my calendar</button>
      </div>
      {a.user && mail?.email && (
        <label className="row small" style={{ alignItems: "center", cursor: "pointer" }}>
          <input type="checkbox" checked={mail.on} disabled={busy} onChange={toggle} />
          Email me in the evening if I haven't practised that day
        </label>
      )}
    </section>
  );
}
