"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => console.error(error), [error]);
  return (
    <div className="empty" style={{ padding: "64px 16px", textAlign: "center" }}>
      <h2>Something went wrong on this page</h2>
      <p className="muted">Your words and progress are safe.</p>
      <div className="row" style={{ justifyContent: "center", gap: 8 }}>
        <button className="btn primary" onClick={reset}>Try again</button>
        <a className="btn" href="./">Go home</a>
      </div>
    </div>
  );
}
