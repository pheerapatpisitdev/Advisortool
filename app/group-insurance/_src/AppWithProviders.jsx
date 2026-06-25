"use client";
import { LanguageProvider } from "./contexts/LanguageContext";
import App from "./App";

// Restores the provider tree that lived in the original Vite `main.jsx`
// (deleted during the Next port). App calls useLanguage(), which throws
// without this provider, so it must wrap App inside the ssr:false boundary.
export default function AppWithProviders() {
  return (
    <LanguageProvider>
      <App />
    </LanguageProvider>
  );
}
