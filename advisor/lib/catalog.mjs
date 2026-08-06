export const PRODUCTS = Object.freeze([
  { id: 'life-treasure', name: 'LifeTreasure', category: 'ชีวิตและมรดก', goals: ['legacy', 'life'], summary: 'ประกันชีวิตตลอดชีพถึงอายุ 99 ปี ชำระเบี้ย 12 หรือ 18 ปี', calculatorUrl: '../life-treasure/?v=6', version: 'A2026-1' },
  { id: '12pl', name: '12PL', category: 'ชีวิตและออม', goals: ['saving', 'life', 'tax'], summary: 'ชำระเบี้ย 12 ปี คุ้มครองถึงอายุ 85 ปี พร้อมเงินครบกำหนด', calculatorUrl: '../12pl/', version: 'A2026-1' },
  { id: 'easy-protect6', name: 'Easy Protect 6', category: 'ชีวิตชำระสั้น', goals: ['life', 'short_pay'], summary: 'ชำระเบี้ย 6 ปี คุ้มครองถึงอายุ 99 ปี และเลือกสัญญาเพิ่มเติมได้', calculatorUrl: '../easy-protect6/', version: 'A2026-1' },
  { id: 'lifeready', name: 'Life Ready', category: 'ชีวิตตลอดชีพ', goals: ['life'], summary: 'คำนวณเบี้ยและผลประโยชน์แบบไม่มีเงินปันผล พร้อมตารางมูลค่ากรมธรรม์', calculatorUrl: '../lifeready/', version: 'A2026-1' },
  { id: 'ismart80-6', name: 'iSmart 80/6', category: 'ชีวิตและเงินคืน', goals: ['saving', 'life', 'short_pay'], summary: 'ชำระเบี้ย 6 ปี คุ้มครองถึงอายุ 80 ปี พร้อมเงินจ่ายคืนรายปี', calculatorUrl: '../ismart80-6/', version: 'A2026-1' },
  { id: 'global-saving', name: 'Global Saving Plus 15/8', category: 'ออมและดัชนี', goals: ['saving'], summary: 'ชำระเบี้ย 8 ปี คุ้มครอง 15 ปี ผลประโยชน์บางส่วนอ้างอิงดัชนี', calculatorUrl: '../global-saving/', version: 'ข้อมูลในเครื่องมือปัจจุบัน' },
  { id: 'pension-smart95', name: 'บำนาญ สมาร์ท 95', category: 'เกษียณและภาษี', goals: ['retirement', 'tax'], summary: 'บำนาญถึงอายุ 95 ปี มีทั้งชำระ 6 ปีและชำระถึงอายุเริ่มรับบำนาญ', calculatorUrl: '../pension-smart95/', version: 'A2026-1', serverCalculator: 'pension' },
  { id: 'ihealthy', name: 'iHealthy Ultra', category: 'สุขภาพเหมาจ่าย', goals: ['health'], summary: 'แผนสุขภาพ Smart, Bronze, Silver และ Gold ตามช่วงอายุ', calculatorUrl: '../ihealthy/', version: 'ข้อมูลในเครื่องมือปัจจุบัน', serverCalculator: 'ihealthy' },
  { id: 'ci123', name: 'CI 123', category: 'โรคร้ายแรง', goals: ['critical_illness'], summary: 'ความคุ้มครองโรคร้ายแรงหลายระยะ พร้อมตารางเบี้ยตามอายุ เพศ และทุน', calculatorUrl: '../ci123/', version: 'ข้อมูลในเครื่องมือปัจจุบัน', serverCalculator: 'ci123' },
  { id: 'ishield', name: 'iShield', category: 'ชีวิตและโรคร้ายแรง', goals: ['life', 'critical_illness'], summary: 'ชีวิตควบโรคร้ายแรงถึงอายุ 85 ปี มีระยะชำระเบี้ยหลายแบบ', calculatorUrl: '../ishield/', version: 'ข้อมูลในเครื่องมือปัจจุบัน' },
  { id: 'group-insurance', name: 'Group Insurance', category: 'ประกันกลุ่ม', goals: ['employee_benefits'], summary: 'สุขภาพกลุ่มและอุบัติเหตุกลุ่ม พร้อมใบเสนอราคาในเครื่องมือเฉพาะ', calculatorUrl: '../group-insurance/', version: 'ข้อมูลในเครื่องมือปัจจุบัน' },
  { id: 'fhc', name: 'FHC', category: 'สุขภาพการเงิน', goals: ['financial_health'], summary: 'แบบประเมินรายได้ เงินเก็บ หนี้สิน และสินทรัพย์สุทธิ', calculatorUrl: '../fhc/', version: 'ข้อมูลในเครื่องมือปัจจุบัน' },
  { id: 'career-agent', name: 'Career-Agent', category: 'ประเมินอาชีพ', goals: ['career'], summary: 'แบบประเมินความถนัดในอาชีพตัวแทน', calculatorUrl: '../career-agent/', version: 'ข้อมูลในเครื่องมือปัจจุบัน' },
  { id: 'agency', name: 'Agency Blueprint', category: 'บริหารตัวแทน', goals: ['agency'], summary: 'คำนวณค่าบริหาร รายได้ตัวแทน และแบบทดสอบผู้จัดการ', calculatorUrl: '../agency/', version: 'ข้อมูลในเครื่องมือปัจจุบัน' }
]);

export function searchProducts({ goals = [], query = '' } = {}) {
  const normalizedGoals = Array.isArray(goals) ? goals.map(String) : [];
  const terms = String(query).toLowerCase().split(/\s+/).filter(Boolean);
  const scored = PRODUCTS.map((product) => {
    const haystack = `${product.name} ${product.category} ${product.summary}`.toLowerCase();
    const goalScore = normalizedGoals.filter((goal) => product.goals.includes(goal)).length * 4;
    const termScore = terms.filter((term) => haystack.includes(term)).length;
    return { product, score: goalScore + termScore };
  }).filter(({ score }) => score > 0 || (!normalizedGoals.length && !terms.length));
  scored.sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name, 'th'));
  return {
    kind: 'product_search',
    matches: scored.slice(0, 6).map(({ product, score }) => ({ ...product, score })),
    caveat: 'ผลลัพธ์เป็นการคัดกรองตามเป้าหมาย ไม่ใช่คำรับรองว่าเหมาะสม ต้องตรวจสุขภาพ งบประมาณ เงื่อนไขรับประกัน และเอกสารบริษัทก่อนเสนอขาย'
  };
}

export function getProduct(id) {
  return PRODUCTS.find((product) => product.id === id) || null;
}
