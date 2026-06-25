"use client";
import dynamic from "next/dynamic";

// client-only (uses window, sweetalert2, useState)
const CareerAgentApp = dynamic(() => import("./_src/App"), { ssr: false });

export default function Page() {
  return <CareerAgentApp />;
}
