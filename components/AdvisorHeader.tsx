import Link from "next/link";
import { Home, User, Check } from "lucide-react";

// AdvisorZone-style top header, shown on every route (replaces the old navbar).
// The home icon returns to the Hub; products are chosen from the Hub cards.
export default function AdvisorHeader() {
  return (
    <header className="az-header">
      <Link href="/" className="az-header__icon" aria-label="หน้าแรก">
        <Home size={20} />
      </Link>

      <Link href="/" className="az-header__brand" style={{ textDecoration: "none" }}>
        <div className="az-header__logo">
          <span className="b1">Advisor</span>
          <span className="b2">Zone</span>
        </div>
        <div className="az-header__sub">
          app: 6.22.0 <span className="az-header__api">API</span>
        </div>
      </Link>

      <span className="az-header__avatar" aria-label="โปรไฟล์">
        <User size={22} />
        <span className="az-header__check">
          <Check size={10} strokeWidth={3} />
        </span>
      </span>
    </header>
  );
}
