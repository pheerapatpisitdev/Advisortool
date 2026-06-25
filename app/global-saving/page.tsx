"use client";
import dynamic from "next/dynamic";

const GlobalSavingApp = dynamic(() => import("./_src/App"), { ssr: false });

export default function Page() {
  // .gs-frame scopes the CSS that keeps this app's sticky .tabbar nav below the
  // global AdvisorHeader (otherwise the header hides the calc/docs tabs on scroll).
  return (
    <div className="gs-frame">
      <GlobalSavingApp />
    </div>
  );
}
