import { ProductCard } from "../components/ProductCard";
import { products } from "../components/hubData";

export default function Hub() {
  return (
    <div className="az-shell">
      <main className="az-main">
        <h1 className="az-headline">เลือกผลิตภัณฑ์ที่ใช่สำหรับคุณ</h1>

        <div className="az-section-label">ผลิตภัณฑ์และแพ็คเกจแนะนำ</div>

        <div className="az-grid">
          {products.map((p, i) => (
            <ProductCard key={p.href} p={p} index={i} />
          ))}
        </div>
      </main>
    </div>
  );
}
