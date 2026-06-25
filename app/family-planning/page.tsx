import { FamilyFinancialPlanningBoard } from "./_src/FamilyFinancialPlanningBoard";

// Self-contained static board (no hooks, no browser APIs) — renders server-side.
// board.css is fully scoped under .ffp-* so it does not leak to other routes.
export default function Page() {
  return <FamilyFinancialPlanningBoard />;
}
