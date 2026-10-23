import "server-only";
import { NextResponse } from "next/server";
import { currentUser, type Account } from "./auth";
import { dbEnabled } from "./db";

type Handler<T> = (user: Account | null, req: Request) => Promise<T>;

/** Wrapper for account routes: 503 when no database is configured, JSON errors, optional sign-in requirement. */
export function accountRoute<T>(handler: Handler<T>, opts: { auth: boolean } = { auth: true }) {
  return async (req: Request) => {
    if (!dbEnabled()) return NextResponse.json({ error: "Accounts are turned off on this server." }, { status: 503 });
    try {
      const user = await currentUser();
      if (opts.auth && !user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
      const out = await handler(user, req);
      return out instanceof Response ? out : NextResponse.json(out);
    } catch (e) {
      if (e instanceof HttpError) return NextResponse.json({ error: e.message }, { status: e.status });
      console.error(e);
      return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
    }
  };
}

export class HttpError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}
