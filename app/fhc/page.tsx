"use client";
import dynamic from "next/dynamic";

// client-only (matches the original static page; avoids Date() hydration mismatch)
const FhcQuestionnaire = dynamic(() => import("./_src/FhcQuestionnaire"), { ssr: false });

export default function Page() {
  return <FhcQuestionnaire />;
}
