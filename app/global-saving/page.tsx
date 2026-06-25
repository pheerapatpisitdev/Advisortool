"use client";
import dynamic from "next/dynamic";

const GlobalSavingApp = dynamic(() => import("./_src/App"), { ssr: false });

export default function Page() {
  return <GlobalSavingApp />;
}
