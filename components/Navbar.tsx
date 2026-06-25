import Link from "next/link";

const links = [
  { href: "/", label: "หน้าแรก" },
  { href: "/ci123", label: "CI123" },
  { href: "/ihealthy", label: "iHealthyUltra" },
  { href: "/global-saving", label: "Global Saving" },
  { href: "/group-insurance", label: "Group Insurance" },
];

export default function Navbar() {
  return (
    <nav style={{ borderBottom: "1px solid #e8e6dc", background: "#faf9f5" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", gap: 20, padding: "12px 20px", alignItems: "center", flexWrap: "wrap" }}>
        <Link href="/" style={{ fontWeight: 700, color: "#141413", textDecoration: "none" }}>
          🏠 Hub
        </Link>
        {links.slice(1).map((l) => (
          <Link key={l.href} href={l.href} style={{ color: "#2a2a28", textDecoration: "none" }}>
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
