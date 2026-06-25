"use client";
import dynamic from "next/dynamic";

const GroupInsuranceApp = dynamic(() => import("./_src/AppWithProviders"), { ssr: false });

export default function Page() {
  return <GroupInsuranceApp />;
}
