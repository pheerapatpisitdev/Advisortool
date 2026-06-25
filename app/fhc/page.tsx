"use client";
import dynamic from "next/dynamic";
import RouteLoading from "../../components/RouteLoading";

// client-only (matches the original static page; avoids Date() hydration mismatch)
const FhcQuestionnaire = dynamic(() => import("./_src/FhcQuestionnaire"), {
  ssr: false,
  loading: () => <RouteLoading />,
});

export default function Page() {
  return <FhcQuestionnaire />;
}
