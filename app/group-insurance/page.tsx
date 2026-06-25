"use client";
import dynamic from "next/dynamic";
import RouteLoading from "../../components/RouteLoading";

const GroupInsuranceApp = dynamic(() => import("./_src/AppWithProviders"), {
  ssr: false,
  loading: () => <RouteLoading />,
});

export default function Page() {
  // .gi-frame keeps this app's own full-viewport fixed sidebar/menu below the
  // 64px global AdvisorHeader so the home button stays visible & clickable.
  return (
    <div className="gi-frame">
      <GroupInsuranceApp />
    </div>
  );
}
