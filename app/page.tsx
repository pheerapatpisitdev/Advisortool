"use client";
import { useState } from "react";
import { ProductCard } from "../components/ProductCard";
import { categories, products } from "../components/hubData";

export default function Hub() {
  const [active, setActive] = useState("all");
  const shown =
    active === "all" ? products : products.filter((p) => p.category === active);

  return (
    <div className="az-shell">
      <main className="az-main">
        <h1 className="az-headline">
          <span className="az-slash" aria-hidden />
          เลือกผลิตภัณฑ์ที่ใช่สำหรับคุณ
        </h1>

        <div className="az-section-label">ผลิตภัณฑ์และแพ็คเกจแนะนำ</div>

        <div className="az-chips">
          {categories.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setActive(c.key)}
              className={`az-chip${active === c.key ? " az-chip--active" : ""}`}
            >
              {c.icon}
              {c.label}
            </button>
          ))}
        </div>

        <div className="az-grid" key={active}>
          {shown.map((p, i) => (
            <ProductCard key={p.href} p={p} index={i} />
          ))}
        </div>
      </main>
    </div>
  );
}
