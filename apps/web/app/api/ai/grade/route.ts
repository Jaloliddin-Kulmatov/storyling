import { NextResponse, type NextRequest } from "next/server";
import { gradeExam } from "@/server/ai";
import { currentUser } from "@/server/auth";
import { billingEnabled, FREE, isPro, useQuota } from "@/server/billing";
import { aiRoute, lang, str } from "@/server/route";

const grade = aiRoute(async (body) =>
  gradeExam(lang(body.lang), str(body.level, 4, "level"), body.kind === "speaking" ? "speaking" : "writing", str(body.task, 1500, "task"), str(body.answer, 3000, "answer")),
);

/** Free plan: one graded answer a day (only while paid plans are on). */
export async function POST(req: NextRequest) {
  if (billingEnabled()) {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "Sign in to get your answer graded.", upgrade: true }, { status: 401 });
    if (!(await isPro(user.id)) && !(await useQuota(user.id, "grade", FREE.gradesPerDay)))
      return NextResponse.json({ error: `The free plan includes ${FREE.gradesPerDay} graded answer a day. Upgrade to Pro for unlimited grading.`, upgrade: true }, { status: 402 });
  }
  return grade(req);
}
