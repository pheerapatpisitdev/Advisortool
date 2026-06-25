"use client";
import dynamic from "next/dynamic";
import RouteLoading from "../../components/RouteLoading";

// client-only (uses window, sweetalert2, useState)
const CareerAgentApp = dynamic(() => import("./_src/App"), {
  ssr: false,
  loading: () => <RouteLoading />,
});

export default function Page() {
  return <CareerAgentApp />;
}
