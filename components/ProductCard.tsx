"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Product } from "./hubData";

export function ProductCard({ p, index }: { p: Product; index: number }) {
  return (
    <Link
      href={p.href}
      className="az-card"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="az-card__media" style={{ background: p.gradient }}>
        {p.imageSrc && (
          // Placeholder phase: the gradient + icon show until a real photo is
          // dropped at p.imageSrc. If the file is missing, hide the <img> so no
          // broken-image icon appears over the gradient.
          <img
            src={p.imageSrc}
            alt=""
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        )}
        <span className="az-card__icon">{p.icon}</span>
        {p.isNew && <span className="az-ribbon">NEW</span>}
      </div>

      <h2 className="az-band">{p.band}</h2>

      <div className="az-body">
        <p className="az-tagline">{p.tagline}</p>
        <ul className="az-bullets">
          {p.bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
        <span className="az-cta">
          เปิดแอป <ArrowRight size={16} />
        </span>
      </div>
    </Link>
  );
}
