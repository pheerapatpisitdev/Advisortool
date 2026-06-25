/**
 * คำนวณใบเสนอราคาแบบหลายกลุ่ม (Multi-Group Quote)
 * - band คิดจาก "จำนวนคนรวมทั้งใบ" แล้วทุกกลุ่มใช้ band เดียวกัน
 * - bizType / แผน / rider (OPD หรือ ME) แยกอิสระต่อกลุ่ม
 */
import {
  healthIpdPremiums,
  healthOpdPremiums,
  paMainPremiums,
  paMePremiums,
  getHealthEmployeeRange,
  getPaEmployeeRange,
} from '../data/insuranceData';

/** เงื่อนไขจำนวนคนรวมต่อผลิตภัณฑ์ */
export const PRODUCT_LIMITS = {
  health: { min: 10, max: 100 },
  pa: { min: 5, max: 2000 },
};

/** คืน employeeRange (band) ตามผลิตภัณฑ์จากจำนวนคนรวม */
export function getBand(product, totalCount) {
  return product === 'pa'
    ? getPaEmployeeRange(totalCount)
    : getHealthEmployeeRange(totalCount);
}

/**
 * @param {'health'|'pa'} product
 * @param {Array<{bizType,planIdx,includeRider,riderIdx,count}>} groups
 */
export function computeMultiGroupQuote(product, groups) {
  const isPa = product === 'pa';
  const totalCount = groups.reduce((s, g) => s + (Number(g.count) || 0), 0);
  const band = getBand(product, totalCount);
  const { min, max } = PRODUCT_LIMITS[product];
  const withinLimit = totalCount >= min && totalCount <= max;

  const mainTable = isPa ? paMainPremiums : healthIpdPremiums;

  const computedGroups = groups.map((g) => {
    const count = Number(g.count) || 0;
    const mainPremium = mainTable[g.bizType]?.[band]?.[g.planIdx] ?? 0;
    let riderPremium = 0;
    if (g.includeRider) {
      riderPremium = isPa
        ? (paMePremiums[g.bizType]?.[band]?.[g.riderIdx] ?? 0)
        : (healthOpdPremiums[g.bizType]?.[g.riderIdx] ?? 0); // OPD ไม่ขึ้นกับ band
    }
    const perPerson = mainPremium + riderPremium;
    const subtotal = perPerson * count;
    return { ...g, count, mainPremium, riderPremium, perPerson, subtotal };
  });

  const grandTotal = computedGroups.reduce((s, g) => s + g.subtotal, 0);

  return { product, totalCount, band, withinLimit, min, max, groups: computedGroups, grandTotal };
}
