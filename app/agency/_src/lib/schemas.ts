import { z } from 'zod';
import { insuranceProducts } from './products';

export const commissionInputSchema = z.object({
  direct: z
    .object({
      nbc: z.coerce.number().min(0).default(0),
      applyAdor: z.boolean().default(false),
      managerTenure: z.coerce.number().min(1).max(2).default(1),
      persistencyRate: z.coerce.number().min(0).max(100).default(0),
    })
    .optional(),
  child: z
    .array(
      z.object({
        nbc: z.coerce.number().min(0).default(0),
        unitAgeYear: z.coerce.number().min(0).default(0),
      })
    )
    .optional(),
  grandchild: z
    .array(
      z.object({
        nbc: z.coerce.number().min(0).default(0),
      })
    )
    .optional(),
});

const unitResultSchema = z.object({
  tor: z.number(),
  ador: z.number().optional(),
  mdor: z.number().optional(),
});

export const commissionOutputSchema = z.object({
  breakdown: z.object({
    tor: z.number(),
    ador: z.number(),
    mdor: z.number(),
  }),
  monthlyIncome: z.number(),
  quarterlyBonus: z.number(),
  totalAnnualIncome: z.number(),
  detailsByLevel: z
    .object({
      direct: unitResultSchema.optional(),
      child: z.array(unitResultSchema).optional(),
      grandchild: z.array(unitResultSchema).optional(),
    })
    .optional(),
});

const productIds = insuranceProducts.map(p => p.id) as [string, ...string[]];

export const agentIncomeInputSchema = z.object({
    ape: z.coerce.number().min(0).default(0),
    productId: z.enum(productIds, {
        errorMap: () => ({ message: "กรุณาเลือกแบบประกัน" }),
    }),
    paymentMode: z.enum(['yearly', 'semi-annually', 'monthly']),
    persistencyModifier: z.coerce.number().min(0).max(130).default(100),
});

export const agentIncomeOutputSchema = z.object({
    commission: z.number(),
    firstYearCommissionRate: z.number(),
    nbc: z.number(),
    modeCreditRate: z.number(),
    quarterlyBonus: z.number(),
    qvbRate: z.number(),
    yearlyBonus: z.number(),
    yebRate: z.number(),
    actualTotalIncome: z.number(),
    commissionProjection: z.array(z.object({
        year: z.number(),
        rate: z.number(),
        commission: z.number(),
    })),
    incomeProjection: z.array(z.object({
        year: z.number(),
        newBusinessIncome: z.number(),
        renewalIncome: z.number(),
        totalIncome: z.number(),
    })),
});
