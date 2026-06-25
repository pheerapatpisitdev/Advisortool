"use client";
import dynamic from "next/dynamic";

const GroupInsuranceApp = dynamic(() => import("./_src/App"), { ssr: false });

export default function Page() {
  return <GroupInsuranceApp />;
}
