import type { Metadata } from "next";
import { Suspense } from "react";
import { Onboarding } from "@/views/Onboarding";

export const metadata: Metadata = { title: "Choose a language" };

export default function StartPage() {
  return (
    <Suspense>
      <Onboarding />
    </Suspense>
  );
}
