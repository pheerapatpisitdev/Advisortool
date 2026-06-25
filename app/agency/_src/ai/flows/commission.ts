// Pure deterministic calculator (originally a Genkit flow with no LLM call —
// Genkit wrapper stripped during the port).
import { commissionInputSchema, commissionOutputSchema } from '@agency/lib/schemas';
import { z } from 'zod';

const getTorRate = (managerTenure: number, persistencyRate: number): number => {
  if (managerTenure === 1) { // <= 12 months
    if (persistencyRate >= 80) return 0.35;
    if (persistencyRate >= 75) return 0.30;
    if (persistencyRate >= 65) return 0.25;
    if (persistencyRate >= 55) return 0.20;
    if (persistencyRate >= 45) return 0.15;
    return 0;
  } else { // > 12 months
    if (persistencyRate >= 95) return 0.50;
    if (persistencyRate >= 85) return 0.45;
    if (persistencyRate >= 80) return 0.35;
    if (persistencyRate >= 75) return 0.30;
    if (persistencyRate >= 65) return 0.25;
    if (persistencyRate >= 55) return 0.20;
    if (persistencyRate >= 45) return 0.15;
    return 0;
  }
};

export async function commissionCalculator(
  input: z.infer<typeof commissionInputSchema>
): Promise<z.infer<typeof commissionOutputSchema>> {
    let totalTor = 0;
    let totalAdor = 0;
    let totalMdor = 0;
    
    const detailsByLevel: z.infer<typeof commissionOutputSchema>['detailsByLevel'] = {
        direct: undefined,
        child: [],
        grandchild: [],
    };

    // 1. Direct Unit
    if (input.direct && input.direct.nbc > 0) {
      const { nbc, applyAdor, managerTenure, persistencyRate } = input.direct;
      const torRate = getTorRate(managerTenure, persistencyRate);
      const tor = nbc * torRate;
      const ador = applyAdor ? tor * 0.6 : 0;
      totalTor += tor;
      totalAdor += ador;
      detailsByLevel.direct = { tor, ador };
    }

    // 2. Child Units
    if (input.child) {
        input.child.forEach(unit => {
            if(unit.nbc > 0) {
                const { nbc, unitAgeYear } = unit;
                const tor = nbc * 0.175;
                let mdor = 0;
                if (unitAgeYear === 1) { // not more than 1 year
                    mdor = nbc * 0.175;
                } else if (unitAgeYear === 2) { // 1-2 years
                    mdor = nbc * 0.0875;
                }
                totalTor += tor;
                totalMdor += mdor;
                detailsByLevel.child?.push({ tor, mdor });
            }
        });
    }

    // 3. Grandchild Units
    if (input.grandchild) {
        input.grandchild.forEach(unit => {
            if(unit.nbc > 0) {
                const { nbc } = unit;
                const tor = nbc * 0.035;
                totalTor += tor;
                detailsByLevel.grandchild?.push({ tor });
            }
        });
    }

    const monthlyIncome = totalTor + totalAdor + totalMdor;
    const quarterlyBonus = 0; // Set to 0 as per user feedback
    const totalAnnualIncome = monthlyIncome * 12;

    return {
      breakdown: {
        tor: totalTor,
        ador: totalAdor,
        mdor: totalMdor,
      },
      monthlyIncome,
      quarterlyBonus,
      totalAnnualIncome,
      detailsByLevel
    };
}
