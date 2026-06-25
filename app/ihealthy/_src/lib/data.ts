import type { PlanName, Gender, Frequency } from "./types";
import { premiumData } from "./premium-data";

/**
 * Canonical, language-independent sentinels for special coverage values.
 * Stored in `benefitData` instead of localized display strings so that
 * rendering/sharing logic never has to match against translated text.
 */
export const AS_INCURRED = "AS_INCURRED";
export const NOT_COVERED = "NOT_COVERED";

export const planDetails = {
  smart: {
    name: { th: "SMART", en: "SMART", ru: "SMART", zh: "SMART", fr: "SMART" },
    description: {
      th: "ความคุ้มครอง 3 ล้านบาท เหมาะสำหรับผู้เริ่มต้น",
      en: "3 million baht coverage, ideal for getting started",
      ru: "Покрытие 3 млн бат, идеально для начала",
      zh: "300万泰铢保障，适合入门",
      fr: "Couverture 3 millions de bahts, idéale pour commencer",
    },
  },
  bronze: {
    name: { th: "BRONZE", en: "BRONZE", ru: "BRONZE", zh: "BRONZE", fr: "BRONZE" },
    description: {
      th: "ความคุ้มครองที่สมดุลพร้อมเบี้ยประกันที่จ่ายได้",
      en: "Balanced coverage with affordable premiums",
      ru: "Сбалансированное покрытие с доступными взносами",
      zh: "均衡的保障和实惠的保费",
      fr: "Couverture équilibrée avec des primes abordables",
    },
  },
  silver: {
    name: { th: "SILVER", en: "SILVER", ru: "SILVER", zh: "SILVER", fr: "SILVER" },
    description: {
      th: "ความคุ้มครองที่ครอบคลุมเพื่อความสบายใจ",
      en: "Comprehensive coverage for peace of mind",
      ru: "Комплексное покрытие для вашего спокойствия",
      zh: "全面的保障，让您安心",
      fr: "Couverture complète pour votre tranquillité d'esprit",
    },
    highlight: true,
  },
  gold: {
    name: { th: "GOLD", en: "GOLD", ru: "GOLD", zh: "GOLD", fr: "GOLD" },
    description: {
      th: "ความคุ้มครองระดับพรีเมียมพร้อมผลประโยชน์ระดับสูงสุด",
      en: "Premium coverage with top-tier benefits",
      ru: "Премиальное покрытие с первоклассными преимуществами",
      zh: "顶级福利的尊贵保障",
      fr: "Couverture premium avec des avantages de premier plan",
    },
  },
};

export const benefitData = [
  {
    category: { th: "ผลประโยชน์กรณีผู้ป่วยใน", en: "In-patient Benefits", ru: "Стационарные льготы", zh: "住院福利", fr: "Prestations Hospitalières" },
    benefits: [
      { id: "1", name: { th: "ค่าห้อง และค่าอาหาร ค่าบริการในโรงพยาบาล (ต่อวัน)", en: "Room & Board, Hospital Services (per day)", ru: "Палата и питание, больничные услуги (в день)", zh: "病房和膳食，医院服务（每天）", fr: "Chambre et Pension, Services Hospitaliers (par jour)" }, smart: "1,500 บาท", bronze: "3,000 บาท", silver: "5,500 บาท", gold: "9,000 บาท", subBenefit: { th: "ค่าห้อง และค่าอาหาร ค่าบริการในโรงพยาบาล กรณีเข้ารับการรักษาในห้องผู้ป่วยวิกฤติ (ICU)", en: "Room & Board, Hospital Services in ICU", ru: "Палата и питание, больничные услуги в отделении интенсивной терапии (ICU)", zh: "重症监护室（ICU）的病房和膳食，医院服务", fr: "Chambre et Pension, Services Hospitaliers en USI" } },
      {
        id: "2",
        name: { th: "ค่าบริการทางการแพทย์เพื่อการตรวจวินิจฉัย หรือบำบัดรักษา", en: "Medical Services for Diagnosis or Treatment", ru: "Медицинские услуги для диагностики или лечения", zh: "诊断或治疗的医疗服务", fr: "Services Médicaux pour Diagnostic ou Traitement" },
        smart: AS_INCURRED,
        bronze: AS_INCURRED,
        silver: AS_INCURRED,
        gold: AS_INCURRED,
        subBenefits: [
          { "id": "2.1", "text": { th: "ค่าบริการทางการแพทย์เพื่อการตรวจวินิจฉัย", en: "Medical services for diagnosis", ru: "Медицинские услуги для диагностики", zh: "诊断医疗服务", fr: "Services médicaux pour diagnostic" } },
          { "id": "2.2", "text": { th: "ค่าบริการทางการแพทย์เพื่อการบำบัดรักษา ค่าบริการโลหิต และส่วนประกอบของโลหิต และค่าบริการทางการพยาบาล", en: "Medical services for treatment, blood and blood components, and nursing services", ru: "Медицинские услуги для лечения, кровь и ее компоненты, а также услуги медсестер", zh: "治疗、血液和血液成分以及护理服务的医疗服务", fr: "Services médicaux pour traitement, sang et composants sanguins, et services infirmiers" } },
          { "id": "2.3", "text": { th: "ค่ายา ค่าสารอาหารทางหลอดเลือด และค่าเวชภัณฑ์", en: "Medicines, parenteral nutrition, and medical supplies", ru: "Лекарства, парентеральное питание и медицинские принадлежности", zh: "药品、肠外营养和医疗用品", fr: "Médicaments, nutrition parentérale et fournitures médicales" } },
          { "id": "2.4", "text": { th: "ค่ายา และค่าเวชภัณฑ์สิ้นเปลือง (เวชภัณฑ์ 1) สำหรับกลับบ้าน (สูงสุด 15 วัน ต่อการเข้ารับการรักษาตัวเป็นผู้ป่วยใน แต่ละครั้ง)", en: "Take-home medicines and medical supplies (Medical Supplies 1) (max 15 days per hospitalization)", ru: "Лекарства и медицинские принадлежности на дом (Медицинские принадлежности 1) (макс. 15 дней на одну госпитализацию)", zh: "带回家的药品和医疗用品（医疗用品1）（每次住院最多15天）", fr: "Médicaments et fournitures médicales à emporter (Fournitures Médicales 1) (max 15 jours par hospitalisation)" } }
        ]
      },
      { id: "3", name: { th: "ค่าผู้ประกอบวิชาชีพเวชกรรม (แพทย์) ตรวจรักษา", en: "Physician (Doctor) Fees for Treatment", ru: "Гонорары врача за лечение", zh: "医生治疗费", fr: "Honoraires du Médecin pour Traitement" }, smart: AS_INCURRED, bronze: AS_INCURRED, silver: AS_INCURRED, gold: AS_INCURRED },
      {
        id: "4",
        name: { th: "ค่ารักษาพยาบาลโดยการผ่าตัด (ศัลยกรรม) และหัตถการ", en: "Surgical and Procedure Expenses", ru: "Расходы на хирургическое вмешательство и процедуры", zh: "手术和程序费用", fr: "Frais de Chirurgie et Procédures" },
        smart: AS_INCURRED,
        bronze: AS_INCURRED,
        silver: AS_INCURRED,
        gold: AS_INCURRED,
        subBenefits: [
          { id: "4.1", text: { th: "ค่าห้องผ่าตัด และค่าห้องทำหัตถการ", en: "Operating room and procedure room fees", ru: "Плата за операционную и процедурную", zh: "手术室和程序室费用", fr: "Frais de salle d'opération et de salle de procédure" } },
          { id: "4.2", text: { th: "ค่ายา ค่าสารอาหารทางหลอดเลือด ค่าเวชภัณฑ์ และค่าอุปกรณ์การผ่าตัด และหัตถการ", en: "Medicines, parenteral nutrition, medical supplies, and surgical/procedural equipment", ru: "Лекарства, парентеральное питание, медицинские принадлежности и хирургическое/процедурное оборудование", zh: "药品、肠外营养、医疗用品和手术/程序设备", fr: "Médicaments, nutrition parentérale, fournitures médicales et équipement chirurgical/procédural" } },
          { id: "4.3", text: { th: "ค่าผู้ประกอบวิชาชีพเวชกรรม ทำศัลยกรรม และหัตถการ สำหรับแพทย์ทำศัลยกรรม และหัตถการ (รวมแพทย์ผู้ช่วยผ่าตัด) (Doctor fee)", en: "Fees for surgeon and assistant surgeon (Doctor fee)", ru: "Гонорары хирурга и ассистента хирурга (гонорар врача)", zh: "外科医生和助理外科医生费用（医生费）", fr: "Honoraires du chirurgien et de l'assistant chirurgien (honoraires du médecin)" } },
          { id: "4.4", text: { th: "ค่าผู้ประกอบวิชาชีพเวชกรรม วิสัญญีแพทย์ (Doctor fee)", en: "Anesthesiologist fees (Doctor fee)", ru: "Гонорары анестезиолога (гонорар врача)", zh: "麻醉师费（医生费）", fr: "Honoraires de l'anesthésiste (honoraires du médecin)" } },
          { id: "4.5", text: { th: "ค่ารักษาพยาบาลโดยการผ่าตัดเปลี่ยนอวัยวะ", en: "Organ transplant surgery expenses", ru: "Расходы на операцию по пересадке органов", zh: "器官移植手术费用", fr: "Frais de chirurgie de transplantation d'organes" } },
        ],
      },
      { id: "5", name: { th: "การผ่าตัดใหญ่ที่ไม่ต้องเข้าพักรักษาตัวเป็นผู้ป่วยใน (Day Surgery)", en: "Day Surgery", ru: "Дневная хирургия", zh: "日间手术", fr: "Chirurgie Ambulatoire" }, smart: AS_INCURRED, bronze: AS_INCURRED, silver: AS_INCURRED, gold: AS_INCURRED },
    ],
  },
  {
    category: { th: "ผลประโยชน์กรณีไม่ต้องเข้าพักรักษาตัวเป็นผู้ป่วยใน", en: "Out-patient Benefits", ru: "Амбулаторные льготы", zh: "门诊福利", fr: "Prestations Ambulatoires" },
    benefits: [
      {
        id: "6",
        name: { th: "ค่าบริการทางการแพทย์เพื่อการตรวจวินิจฉัย และค่ารักษาพยาบาลผู้ป่วยนอก", en: "Medical Services for Diagnosis and Out-patient Treatment", ru: "Медицинские услуги для диагностики и амбулаторного лечения", zh: "诊断和门诊治疗的医疗服务", fr: "Services Médicaux pour Diagnostic et Traitement Ambulatoire" },
        smart: AS_INCURRED,
        bronze: AS_INCURRED,
        silver: AS_INCURRED,
        gold: AS_INCURRED,
        subBenefits: [
          { id: "6.1", text: { th: "ค่าบริการทางการแพทย์ เพื่อการตรวจวินิจฉัยที่เกี่ยวข้องโดยตรงภายใน 30 วัน ก่อน และหลังการเข้าพักรักษาตัวเป็นผู้ป่วยใน", en: "Directly related diagnostic services within 30 days before and after hospitalization", ru: "Непосредственно связанные диагностические услуги в течение 30 дней до и после госпитализации", zh: "住院前后30天内直接相关的诊断服务", fr: "Services de diagnostic directement liés dans les 30 jours avant et après l'hospitalisation" } },
          { id: "6.2", text: { th: "ค่ารักษาพยาบาลผู้ป่วยนอก (OPD Follow up) ที่เกี่ยวข้องโดยตรงหลังการเข้าพักรักษาตัวเป็นผู้ป่วยใน ภายใน 30 วัน (สูงสุด 2 ครั้ง ต่อการเข้าพักรักษาตัวเป็นผู้ป่วยในแต่ละครั้ง ซึ่งไม่รวมค่าบริการทางการแพทย์เพื่อการตรวจวินิจฉัย)", en: "OPD follow-up treatment within 30 days after hospitalization (max 2 times per hospitalization, excluding diagnostic services)", ru: "Амбулаторное лечение в течение 30 дней после госпитализации (макс. 2 раза на одну госпитализацию, исключая диагностические услуги)", zh: "住院后30天内的门诊随访治疗（每次住院最多2次，不包括诊断服务）", fr: "Traitement de suivi ambulatoire dans les 30 jours après l'hospitalisation (max 2 fois par hospitalisation, excluant les services de diagnostic)" } }
        ]
      },
      { id: "7", name: { th: "ค่ารักษาพยาบาลการบาดเจ็บ กรณีผู้ป่วยนอก ภายใน 24 ชั่วโมง ของการเกิดอุบัติเหตุต่อครั้ง", en: "Accident-related out-patient treatment within 24 hours per incident", ru: "Амбулаторное лечение травм, связанных с несчастным случаем, в течение 24 часов за инцидент", zh: "每次事故24小时内与事故相关的门诊治疗", fr: "Traitement ambulatoire lié aux accidents dans les 24 heures par incident" }, smart: AS_INCURRED, bronze: AS_INCURRED, silver: AS_INCURRED, gold: AS_INCURRED },
      { id: "8", name: { th: "ค่าเวชศาสตร์ฟื้นฟู หลังการเข้าพักรักษาตัวเป็นผู้ป่วยในแต่ละครั้ง", en: "Rehabilitation after hospitalization", ru: "Реабилитация после госпитализации", zh: "住院后康复", fr: "Réadaptation après hospitalisation" }, smart: NOT_COVERED, bronze: NOT_COVERED, silver: NOT_COVERED, gold: NOT_COVERED },
      { id: "9", name: { th: "ค่าบริการทางการแพทย์เพื่อการบำบัดรักษาโรคไตวายเรื้อรัง โดยการล้างไตผ่านทางเส้นเลือด", en: "Medical services for chronic kidney failure treatment by hemodialysis", ru: "Медицинские услуги для лечения хронической почечной недостаточности гемодиализом", zh: "血液透析治疗慢性肾功能衰竭的医疗服务", fr: "Services médicaux pour le traitement de l'insuffisance rénale chronique par hémodialyse" }, smart: AS_INCURRED, bronze: AS_INCURRED, silver: AS_INCURRED, gold: AS_INCURRED },
      { id: "10", name: { th: "ค่าบริการทางการแพทย์เพื่อการบำบัดรักษาโรคเนื้องอก หรือมะเร็ง โดยรังสีรักษา รังสีร่วมรักษา เวชศาสตร์นิวเคลียร์รักษา", en: "Medical services for tumor or cancer treatment by radiotherapy, brachytherapy, nuclear medicine", ru: "Медицинские услуги для лечения опухолей или рака с помощью радиотерапии, брахитерапии, ядерной медицины", zh: "通过放射治疗、近距离放射治疗、核医学治疗肿瘤或癌症的医疗服务", fr: "Services médicaux pour le traitement des tumeurs ou du cancer par radiothérapie, curiethérapie, médecine nucléaire" }, smart: AS_INCURRED, bronze: AS_INCURRED, silver: AS_INCURRED, gold: AS_INCURRED },
      { id: "11", name: { th: "ค่าบริการทางการแพทย์เพื่อการบำบัดรักษาโรคมะเร็ง โดยเคมีบำบัด", en: "Medical services for cancer treatment by chemotherapy", ru: "Медицинские услуги для лечения рака химиотерапией", zh: "通过化学疗法治疗癌症的医疗服务", fr: "Services médicaux pour le traitement du cancer par chimiothérapie" }, smart: AS_INCURRED, bronze: AS_INCURRED, silver: AS_INCURRED, gold: AS_INCURRED },
      { id: "12", name: { th: "ค่าบริการรถพยาบาลฉุกเฉิน", en: "Emergency ambulance service", ru: "Служба скорой помощи", zh: "紧急救护车服务", fr: "Service d'ambulance d'urgence" }, smart: AS_INCURRED, bronze: AS_INCURRED, silver: AS_INCURRED, gold: AS_INCURRED },
      { id: "13", name: { th: "ค่ารักษาพยาบาล โดยการผ่าตัดเล็ก", en: "Minor surgery expenses", ru: "Расходы на малую хирургию", zh: "小手术费用", fr: "Frais de chirurgie mineure" }, smart: AS_INCURRED, bronze: AS_INCURRED, silver: AS_INCURRED, gold: AS_INCURRED },
    ],
  },
  {
    category: { th: "ผลประโยชน์ และความคุ้มครองอื่น ๆ (ต่อรอบปีกรมธรรม์ประกันภัย)", en: "Other Benefits and Coverages (per policy year)", ru: "Другие льготы и покрытия (за год полиса)", zh: "其他福利和保障（每保单年度）", fr: "Autres Prestations et Couvertures (par année de police)" },
    benefits: [
      { id: "14", name: { th: "ค่าพยาบาลพิเศษในโรงพยาบาล และ/หรือที่บ้าน หลังการเข้าพักรักษาตัวเป็นผู้ป่วยใน", en: "Special nursing care in hospital and/or at home after hospitalization", ru: "Специальный уход в больнице и/или на дому после госпитализации", zh: "住院后在医院和/或家中的特殊护理", fr: "Soins infirmiers spéciaux à l'hôpital et/ou à domicile après hospitalisation" }, smart: NOT_COVERED, bronze: NOT_COVERED, silver: AS_INCURRED, gold: AS_INCURRED },
      { id: "15", name: { th: "ค่าทันตกรรมเนื่องจากอุบัติเหตุ (ภายใน 7 วัน)", en: "Dental treatment due to accident (within 7 days)", ru: "Стоматологическое лечение в результате несчастного случая (в течение 7 дней)", zh: "因意外导致的牙科治疗（7天内）", fr: "Traitement dentaire dû à un accident (dans les 7 jours)" }, smart: NOT_COVERED, bronze: NOT_COVERED, silver: AS_INCURRED, gold: AS_INCURRED },
      { id: "16", name: { th: "ค่าศัลยกรรมในช่องปาก", en: "Oral surgery", ru: "Хирургия полости рта", zh: "口腔外科", fr: "Chirurgie buccale" }, smart: NOT_COVERED, bronze: NOT_COVERED, silver: AS_INCURRED, gold: AS_INCURRED },
      { id: "17", name: { th: "ภาวะแทรกซ้อนก่อน และหลังการคลอดบุตร (12MWP)", en: "Maternity complications before and after childbirth (12MWP)", ru: "Осложнения до и после родов (12MWP)", zh: "分娩前后的生育并发症（12个月等待期）", fr: "Complications maternelles avant et après l'accouchement (12MWP)" }, smart: NOT_COVERED, bronze: NOT_COVERED, silver: AS_INCURRED, gold: AS_INCURRED },
      { id: "18", name: { th: "ค่าปรึกษาแพทย์ และยารวมถึงใบสั่งยาสำหรับผู้ป่วยนอก", en: "Doctor consultation and prescription drugs for out-patient", ru: "Консультация врача и рецептурные препараты для амбулаторного лечения", zh: "门诊病人的医生咨询和处方药", fr: "Consultation médicale et médicaments sur ordonnance pour patients ambulatoires" }, smart: NOT_COVERED, bronze: NOT_COVERED, silver: "6,000 บาท", gold: "12,000 บาท" },
      { id: "19", name: { th: "ค่ากายภาพบำบัดสำหรับผู้ป่วยนอก", en: "Physiotherapy for out-patient", ru: "Физиотерапия для амбулаторных пациентов", zh: "门诊物理治疗", fr: "Physiothérapie pour patients ambulatoires" }, smart: NOT_COVERED, bronze: NOT_COVERED, silver: AS_INCURRED, gold: AS_INCURRED },
      { id: "20", name: { th: "ค่าชดเชยรายวัน", en: "Daily Hospital Cash", ru: "Ежедневное пособие на госпитализацию", zh: "每日住院现金", fr: "Indemnité Journalière d'Hospitalisation" }, smart: "1,000 บาท / คืน", bronze: "1,000 บาท / คืน", silver: "1,000 บาท / คืน", gold: "1,000 บาท / คืน" },
    ],
  },
];


export function calculatePremium(age: number, gender: Gender, plan: PlanName, frequency: Frequency): number {
  const planPremiums = premiumData[plan]?.[gender];

  if (!planPremiums) {
    return 0;
  }

  const agePremium = planPremiums.find(p => p.age === age);

  if (!agePremium) {
    // Find nearest lower age if exact match not found
    const lowerAge = [...planPremiums].reverse().find(p => p.age < age);
    if (!lowerAge) return 0; // or handle as an error
    return calculateByFrequency(lowerAge.yearly, frequency);
  }

  return calculateByFrequency(agePremium.yearly, frequency);
}

function calculateByFrequency(yearlyPremium: number, frequency: Frequency): number {
  let calculatedPremium = 0;
  switch (frequency) {
    case 'yearly':
      calculatedPremium = yearlyPremium;
      break;
    case 'six-monthly':
      calculatedPremium = yearlyPremium * 0.52;
      break;
    case 'monthly':
      calculatedPremium = yearlyPremium * 0.09;
      break;
    default:
      return 0;
  }
  return Math.round(calculatedPremium);
}
