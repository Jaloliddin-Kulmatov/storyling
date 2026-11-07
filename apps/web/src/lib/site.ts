"use client";

import { useEffect, useState } from "react";

export interface Site {
  announcement: string;
  hiddenLangs: string[];
}

const EMPTY: Site = { announcement: "", hiddenLangs: [] };
let load: Promise<Site> | null = null;

/** Switches set in the admin panel, read once per visit. */
export function useSite(): Site {
  const [site, setSite] = useState(EMPTY);
  useEffect(() => {
    load ??= fetch("/api/site").then((r) => (r.ok ? (r.json() as Promise<Site>) : EMPTY)).catch(() => EMPTY);
    void load.then(setSite);
  }, []);
  return site;
}
