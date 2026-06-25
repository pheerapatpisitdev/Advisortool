import type { commissionInputSchema, commissionOutputSchema } from "@agency/lib/schemas";
import type { z } from "zod";

export type CalculatorFormValues = z.infer<typeof commissionInputSchema>;
export type CommissionResults = z.infer<typeof commissionOutputSchema>;
