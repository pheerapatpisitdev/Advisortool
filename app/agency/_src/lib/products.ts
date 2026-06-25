export const insuranceProducts = [
  { id: 'ishield_5', name: 'iShield 5', commissionRates: [25, 10, 6.25, 3, 3, 0, 0] },
  { id: 'ishield_10', name: 'iShield 10', commissionRates: [35, 20, 10, 5, 3, 3, 1] },
  { id: 'ishield_15', name: 'iShield 15', commissionRates: [37, 25, 15, 8, 5, 3, 1] },
  { id: 'ishield_20', name: 'iShield 20', commissionRates: [40, 30, 20, 10, 5, 5, 1] },
  { id: 'term_life_plb_5_5', name: 'Term life PLB 5/5', commissionRates: [30, 16, 10, 0, 0, 0, 0] },
  { id: 'term_life_plb_10_10', name: 'Term life PLB 10/10', commissionRates: [30, 20, 10, 0, 0, 0, 0] },
  { id: 'term_life_plb_12_12', name: 'Term life PLB 12/12', commissionRates: [35, 20, 10, 0, 0, 0, 0] },
  { id: 'term_life_plb_15_15', name: 'Term life PLB 15/15', commissionRates: [35, 20, 10, 0, 0, 0, 0] },
  { id: 'life_ready_6y', name: 'Life Ready 6Y', commissionRates: [25, 10, 6.25, 5, 5, 5, 0] },
  { id: 'life_ready_12y', name: 'Life Ready 12Y', commissionRates: [30, 12, 7.5, 5, 5, 5, 5] },
  { id: 'life_ready_18y_gte_300k', name: 'Life Ready 18Y >=300k', commissionRates: [40, 16, 10, 5, 5, 5, 5] },
  { id: 'ihealthy_ultra_6_10', name: 'iHealthy Ultra - Full (6-10)', commissionRates: [90, 10, 5, 5, 5, 5, 5] },
  { id: 'ihealthy_ultra_11_80', name: 'iHealthy Ultra - Full (11-80)', commissionRates: [25, 15, 10, 5, 5, 5, 5] },
];

export type InsuranceProduct = {
  id: string;
  name: string;
  commissionRates: number[];
};
