import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPassword } from "@/views/ResetPassword";

export const metadata: Metadata = { title: "Set a new password", robots: { index: false } };

export default function Page() {
  return <Suspense><ResetPassword /></Suspense>;
}
