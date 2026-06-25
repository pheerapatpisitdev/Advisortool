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

      <span className="az-header__avatar" aria-label="โปรไฟล์">
        <User size={22} />
        <span className="az-header__check">
          <Check size={10} strokeWidth={3} />
        </span>
      </span>
    </header>
  );
}
