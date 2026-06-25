// Pure deterministic calculator (Genkit wrapper stripped during the port).
import { z } from 'zod';
import { agentIncomeInputSchema, agentIncomeOutputSchema } from '@agency/lib/schemas';
import { insuranceProducts } from '@agency/lib/products';

const getQvbRate = (nbc: number): number => {
  if (nbc >= 150000) return 0.55;
  if (nbc >= 100000) return 0.50;
  if (nbc >= 75000) return 0.45;
  if (nbc >= 50000) return 0.35;
  if (nbc >= 25000) return 0.25;
  if (nbc >= 10000) return 0.12;
  return 0;
};

const getYebRate = (annualNbc: number): number => {
    if (annualNbc >= 600000) return 0.1375;
    if (annualNbc >= 400000) return 0.1250;
    if (annualNbc >= 300000) return 0.1125;
    if (annualNbc >= 200000) return 0.0875;
    if (annualNbc >= 100000) return 0.0625;
    if (annualNbc >= 40000) return 0.03;
    return 0;
};


export async function agentIncomeCalculator(
  input: z.infer<typeof agentIncomeInputSchema>
): Promise<z.infer<typeof agentIncomeOutputSchema>> {
    const { ape, productId, paymentMode, persistencyModifier } = input;

    const product = insuranceProducts.find(p => p.id === productId);
    if (!product) {
        throw new Error('Invalid product selected');
    }
    const { commissionRates } = product;
    const firstYearCommissionRate = commissionRates[0];

    const commission = ape * (firstYearCommissionRate / 100);

    let modeCreditRate = 1; // for semi-annually
    if (paymentMode === 'yearly') {
      modeCreditRate = 1.05;
    } else if (paymentMode === 'monthly') {
      modeCreditRate = 0.95;
    }

    const nbc = commission * modeCreditRate;
    
    const qvbRate = getQvbRate(nbc);
    const quarterlyBonus = nbc * qvbRate * (persistencyModifier / 100);

    const annualNbc = commission;
    const yebRate = getYebRate(annualNbc);
    const yearlyBonus = annualNbc * yebRate * (persistencyModifier / 100);

    const actualTotalIncome = commission + quarterlyBonus + yearlyBonus;

    const commissionProjection = commissionRates.map((rate, index) => ({
      year: index + 1,
      rate: rate,
      commission: ape * (rate / 100),
    }));

    const incomeProjection: { year: number; newBusinessIncome: number; renewalIncome: number; totalIncome: number; }[] = [];
    for (let projectionYear = 1; projectionYear <= 7; projectionYear++) {
        // Income from new business generated in `projectionYear`
        // This is always the first year commission + bonuses
        const newBusinessIncome = actualTotalIncome;

        // Income from renewals of business generated in years before `projectionYear`
        let renewalIncome = 0;
        // Loop through past business years
        for (let pastBusinessYear = 1; pastBusinessYear < projectionYear; pastBusinessYear++) {
            const commissionYearIndex = projectionYear - pastBusinessYear; // commission for year 2, 3, etc.
            if (commissionYearIndex < commissionRates.length) {
                const renewalRate = commissionRates[commissionYearIndex];
                renewalIncome += ape * (renewalRate / 100);
            }
        }
        
        const totalIncome = newBusinessIncome + renewalIncome;

        incomeProjection.push({ 
            year: projectionYear, 
            newBusinessIncome,
            renewalIncome,
            totalIncome
        });
    }

    return {
      commission,
      firstYearCommissionRate,
      nbc,
      modeCreditRate,
      quarterlyBonus,
      qvbRate,
      yearlyBonus,
      yebRate,
      actualTotalIncome,
      commissionProjection,
      incomeProjection,
    };
}
