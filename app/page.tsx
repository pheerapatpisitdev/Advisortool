import { ProductCard } from "../components/ProductCard";
import { products } from "../components/hubData";

export default function Hub() {
  return (
    <div className="az-shell">
      <main className="az-main">
        <h1 className="az-headline">My App</h1>

        <div className="az-grid">
          {products.map((p, i) => (
            <ProductCard key={p.href} p={p} index={i} />
          ))}
        </div>
      </main>
    </div>
  );
}
