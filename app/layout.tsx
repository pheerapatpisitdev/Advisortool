import type { Metadata } from "next";
import "./globals.css";
import Navbar from "../components/Navbar";

export const metadata: Metadata = {
  title: "Combined App",
  description: "CI123 · iHealthyUltra · Global Saving Plus · Group Insurance",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
