import type { Metadata } from "next";
import { Suspense } from "react";
import { Pricing } from "@/views/Pricing";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Storyling is free to start. Pro adds unlimited stories, AI-graded writing and speaking, and the AI tutor.",
};

export default function Page() {
  return <Suspense><Pricing /></Suspense>;
}
