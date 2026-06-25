import { Loader2 } from "lucide-react";

// Fallback shown while a route's client-only bundle (dynamic ssr:false) is being
// fetched, so navigating into a sub-app no longer flashes a blank white screen.
export default function RouteLoading({ label = "กำลังโหลด…" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        minHeight: "calc(100dvh - 64px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        color: "#1f3aa0",
        fontFamily: "'IBM Plex Sans Thai', system-ui, sans-serif",
      }}
    >
      <Loader2 size={32} className="animate-spin" />
      <span style={{ fontSize: 14, color: "#64748b" }}>{label}</span>
    </div>
  );
}
