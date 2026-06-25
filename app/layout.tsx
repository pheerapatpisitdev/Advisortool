import type { Metadata } from "next";
import "./globals.css";
import "@fontsource/ibm-plex-sans-thai/400.css";
import "@fontsource/ibm-plex-sans-thai/500.css";
import "@fontsource/ibm-plex-sans-thai/600.css";
import "@fontsource/ibm-plex-sans-thai/700.css";
import AdvisorHeader from "../components/AdvisorHeader";

export const metadata: Metadata = {
  title: "AdvisorZone",
  description: "CI123 · iHealthyUltra · Global Saving Plus · Group Insurance",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>
        <AdvisorHeader />
        <main>{children}</main>
      </body>
    </html>
  );
}
