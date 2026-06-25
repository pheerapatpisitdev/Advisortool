
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { Language } from "@/lib/types";

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const translations: Record<string, Record<Language, string>> = {
    "language_button_text": { th: "ภาษา", en: "Language", ru: "Язык", zh: "语言", fr: "Langue" },
    // App Layout
    "meta_title": { th: "คำนวณเบี้ยประกันสุขภาพ", en: "Health Insurance Premium Calculator", ru: "Калькулятор страховых взносов", zh: "健康保险费计算器", fr: "Calculateur de Prime d'Assurance Santé" },
    "meta_description": { th: "เปรียบเทียบแผนประกันสุขภาพและคำนวณเบี้ยประกันของคุณ", en: "Compare health insurance plans and calculate your premium.", ru: "Сравните планы медицинского страхования и рассчитайте свой взнос.", zh: "比较健康保险计划并计算您的保费。", fr: "Comparez les plans d'assurance santé et calculez votre prime." },
    // Page Header
    "page_title": { th: "ประกันสุขภาพ iHealthy Ultra", en: "iHealthy Ultra Health Insurance", ru: "Медицинское страхование iHealthy Ultra", zh: "iHealthy Ultra 健康保险", fr: "Assurance Santé iHealthy Ultra" },
    "page_description": { th: "เปรียบเทียบแผนประกันสุขภาพของเราและคำนวณเบี้ยประกันส่วนบุคคลของคุณในไม่กี่วินาที", en: "Compare our health insurance plans and calculate your personal premium in seconds.", ru: "Сравните наши планы медицинского страхования и рассчитайте свой личный взнос за считанные секунды.", zh: "比较我们的健康保险计划，在几秒钟内计算出您的个人保费。", fr: "Comparez nos plans d'assurance santé et calculez votre prime personnelle en quelques secondes." },
    // Detailed Benefits Card
    "card_title": { th: "เปรียบเทียบผลประโยชน์", en: "Compare Benefits", ru: "Сравнить преимущества", zh: "比较福利", fr: "Comparer les Avantages" },
    "card_description": { th: "เปรียบเทียบผลประโยชน์โดยละเอียดและประเมินเบี้ยประกันของคุณตามอายุและเพศ", en: "Compare detailed benefits and estimate your premium based on age and gender.", ru: "Сравните подробные преимущества и оцените свой взнос в зависимости от возраста и пола.", zh: "比较详细的福利，并根据年龄和性别估算您的保费。", fr: "Comparez les avantages détaillés et estimez votre prime en fonction de l'âge et du sexe." },
    "age_label": { th: "อายุ", en: "Age", ru: "Возраст", zh: "年龄", fr: "Âge" },
    "age_tooltip": { th: "อายุของคุณเป็นปัจจัยสำคัญในการกำหนดค่าเบี้ยประกัน", en: "Your age is a key factor in determining your premium.", ru: "Ваш возраст является ключевым фактором при определении вашего взноса.", zh: "您的年龄是决定保费的关键因素。", fr: "Votre âge est un facteur clé dans la détermination de votre prime." },
    "gender_label": { th: "เพศ", en: "Gender", ru: "Пол", zh: "性别", fr: "Sexe" },
    "gender_tooltip": { th: "เพศอาจมีผลต่ออัตราเบี้ยประกันเนื่องจากความแตกต่างทางสถิติสุขภาพ", en: "Gender can affect premium rates due to health statistics differences.", ru: "Пол может влиять на ставки взносов из-за различий в статистике здоровья.", zh: "由于健康统计数据的差异，性别会影响保费费率。", fr: "Le sexe peut affecter les taux de prime en raison des différences dans les statistiques de santé." },
    "male": { th: "ชาย", en: "Male", ru: "Мужчина", zh: "男性", fr: "Homme" },
    "female": { th: "หญิง", en: "Female", ru: "Женщина", zh: "女性", fr: "Femme" },
    "frequency_label": { th: "งวดการชำระ", en: "Payment Frequency", ru: "Частота платежей", zh: "付款频率", fr: "Fréquence de Paiement" },
    "frequency_tooltip": { th: "เลือกความถี่ในการชำระเบี้ยประกัน", en: "Select how often you want to pay your premium.", ru: "Выберите, как часто вы хотите платить взнос.", zh: "选择您希望支付保费的频率。", fr: "Sélectionnez la fréquence à laquelle vous souhaitez payer votre prime." },
    "frequency_yearly": { th: "รายปี", en: "Yearly", ru: "Ежегодно", zh: "每年", fr: "Annuel" },
    "frequency_six_monthly": { th: "รายครึ่งปี", en: "Half-Yearly", ru: "Раз в полгода", zh: "每半年", fr: "Par semestre" },
    "frequency_monthly": { th: "รายเดือน", en: "Monthly", ru: "Ежемесячно", zh: "每月", fr: "Mensuel" },
    "premium_header": { th: "เบี้ยประกัน", en: "Premium", ru: "Премия", zh: "保费", fr: "Prime" },
    "yearly_short": { th: "/ปี", en: "/yr", ru: "/год", zh: "/年", fr: "/an" },
    "six_monthly_short": { th: "/ครึ่งปี", en: "/½yr", ru: "/полг.", zh: "/半年", fr: "/sem." },
    "monthly_short": { th: "/เดือน", en: "/mo", ru: "/мес", zh: "/月", fr: "/mois" },
    "total_benefit_header": { th: "ผลประโยชน์รวมสูงสุด (ต่อรอบปีกรมธรรม์ประกันภัย)", en: "Max Overall Benefit (per policy year)", ru: "Максимальное общее пособие (за год полиса)", zh: "最高总福利（每保单年度）", fr: "Prestation Totale Maximale (par année de police)" },
    "benefit_header": { th: "ความคุ้มครอง", en: "Coverage", ru: "Покрытие", zh: "承保范围", fr: "Couverture" },
    "not_covered": { th: "ไม่คุ้มครอง", en: "Not Covered", ru: "Не покрывается", zh: "不包括", fr: "Non Couvert" },
    "as_incurred": { th: "เหมาจ่ายตามจริง", en: "As Incurred", ru: "По факту", zh: "按实际发生", fr: "Tel que Incurré" },
    "baht": { th: "Baht", en: "Baht", ru: "Baht", zh: "Baht", fr: "Baht" },
    "per_day": { th: "/วัน", en: "/day", ru: "/день", zh: "/天", fr: "/jour" },
    "per_night": { th: "/คืน", en: "/night", ru: "/ночь", zh: "/晚", fr: "/nuit" },
    "share_summary_button": { th: "ส่งข้อความหาตัวแทน", en: "Message Agent", ru: "Сообщение агенту", zh: "给代理发消息", fr: "Envoyer un Message à l'Agent" },
    "contact_facebook_button": { th: "ติดต่อ Facebook", en: "Contact on Facebook", ru: "Связаться в Facebook", zh: "在 Facebook 上联系", fr: "Contacter sur Facebook" },
    "share_summary_title": { th: "สรุปแผนประกันสุขภาพ iHealthy Ultra", en: "iHealthy Ultra Health Insurance Plan Summary", ru: "Сводка плана медицинского страхования iHealthy Ultra", zh: "iHealthy Ultra 健康保险计划摘要", fr: "Résumé du Plan d'Assurance Santé iHealthy Ultra" },
    "share_summary_for": { th: "สำหรับอายุ {age} ปี, เพศ {gender}", en: "For age {age}, gender {gender}", ru: "Для возраста {age}, пол {gender}", zh: "年龄 {age}，性别 {gender}", fr: "Pour l'âge {age}, sexe {gender}" },
    "share_gender_male": { th: "ชาย", en: "Male", ru: "Мужчина", zh: "男性", fr: "Homme" },
    "share_gender_female": { th: "หญิง", en: "Female", ru: "Женщина", zh: "女性", fr: "Femme" },
    "share_max_benefit": { th: "ผลประโยชน์รวมสูงสุด", en: "Max Overall Benefit", ru: "Максимальное общее пособие", zh: "最高总福利", fr: "Prestation Totale Maximale" },
    "share_life_insurance": { th: "ทุนประกันชีวิต", en: "Life Insurance Coverage", ru: "Страхование жизни", zh: "人寿保险", fr: "Couverture d'Assurance Vie" },
    "share_opd": { th: "OPD", en: "OPD", ru: "Амбулаторное лечение", zh: "门诊", fr: "Consultation Externe" },
    "share_no_opd": { th: "ไม่มี", en: "None", ru: "Нет", zh: "无", fr: "Aucune" },
    "share_room_and_board": { th: "ค่าห้องและอาหาร", en: "Room and Board", ru: "Палата и питание", zh: "食宿", fr: "Chambre et Pension" },
    "share_per_day": { th: "/วัน", en: "/day", ru: "/день", zh: "/天", fr: "/jour" },
    "share_per_night": { th: "/คืน", en: "/night", ru: "/ночь", zh: "/晚", fr: "/nuit" },
    "share_per_year": { th: "/ต่อปี", en: "/per year", ru: "/в год", zh: "/每年", fr: "/par an" },
    "share_ipd": { th: "ผู้ป่วยใน IPD", en: "In-patient IPD", ru: "Стационар IPD", zh: "住院 IPD", fr: "Hospitalisation IPD" },
    "share_opd_outpatient": { th: "ผู้ป่วยนอก OPD", en: "Out-patient OPD", ru: "Амбулаторное OPD", zh: "门诊 OPD", fr: "Consultation Externe OPD" },
    "share_life_insurance_all_plans": { th: "ทุกแผนทุนประกันชีวิต", en: "All plans Life Insurance", ru: "Все планы: Страхование жизни", zh: "所有计划人寿保险", fr: "Tous les plans: Assurance Vie" },
    "share_can_buy_more": { th: "สามาถซื้อเพิ่มได้", en: "Can purchase additional", ru: "Можно приобрести дополнительно", zh: "可额外购买", fr: "Peut être acheté en supplément" },
    "share_monthly_first_note": { th: "*รายเดือนชำระครั้งแรก 2 งวด", en: "*Monthly: first payment covers 2 installments", ru: "*Ежемесячно: первый платёж за 2 периода", zh: "*月缴：首次支付2期", fr: "*Mensuel : premier paiement de 2 échéances" },
    "share_yearly_premium": { th: "เบี้ยประกันรายปี", en: "Yearly Premium", ru: "Годовая премия", zh: "年度保费", fr: "Prime Annuelle" },
    "share_baht": { th: "Baht", en: "Baht", ru: "Baht", zh: "Baht", fr: "Baht" },
    "share_plan_button": { th: "แชร์แผน", en: "Share Plan", ru: "Поделиться планом", zh: "分享计划", fr: "Partager le Plan" },
    "share_all_plans_button": { th: "แชร์รายละเอียดทั้ง 4 แผน", en: "Share All 4 Plans", ru: "Поделиться всеми 4 планами", zh: "分享所有4个计划", fr: "Partager les 4 Plans" },
    "share_all_plans_button_n": { th: "แชร์รายละเอียดทั้ง {n} แผน", en: "Share All {n} Plans", ru: "Поделиться всеми {n} планами", zh: "分享所有{n}个计划", fr: "Partager les {n} Plans" },
    "share_image_button": { th: "📸 แชร์เป็นรูปภาพ", en: "📸 Share as Image", ru: "📸 Поделиться как изображение", zh: "📸 分享为图像", fr: "📸 Partager sous forme d'image" },
    "share_image_downloaded": { th: "ดาวน์โหลดรูปภาพสำเร็จ!", en: "Image downloaded successfully!", ru: "Изображение успешно загружено!", zh: "图像下载成功！", fr: "Image téléchargée avec succès !" },
    "share_image_error": { th: "เกิดข้อผิดพลาด กรุณาลองใหม่", en: "Error generating image. Please try again.", ru: "Ошибка при создании изображения. Пожалуйста, попробуйте снова.", zh: "生成图像时出错。请重试。", fr: "Erreur lors de la génération de l'image. Veuillez réessayer." },
    "share_line_message": { th: "ดูรายละเอียดเพิ่มเติมได้ที่ลิงก์ด้านบน", en: "See more details at the link above", ru: "Подробнее по ссылке выше", zh: "更多详情请查看上方链接", fr: "Voir plus de détails sur le lien ci-dessus" },
    "overall_benefits.smart": { th: "3 ล้าน", en: "3M", ru: "3М", zh: "300万", fr: "3M" },
    "overall_benefits.bronze": { th: "10 ล้าน", en: "10M", ru: "10М", zh: "1000万", fr: "10M" },
    "overall_benefits.silver": { th: "15 ล้าน", en: "15M", ru: "15М", zh: "1500万", fr: "15M" },
    "overall_benefits.gold": { th: "25 ล้าน", en: "25M", ru: "25М", zh: "2500万", fr: "25M" },
    
    "waiting_period_button": { th: "ระยะเวลารอคอย", en: "Waiting Period", ru: "Период ожидания", zh: "等待期", fr: "Période d'Attente" },
    "waiting_period_title": { th: "ข้อกำหนดทั่วไปของสัญญาเพิ่มเติมเรื่องระยะเวลาที่ไม่คุ้มครอง (Waiting Period)", en: "General Provisions for the Waiting Period Rider", ru: "Общие положения о дополнительном соглашении о периоде ожидания", zh: "等待期附加条款总则", fr: "Dispositions Générales pour la Clause de Période d'Attente" },
    
    "waiting_period_approval_title": { th: "วันที่กรมธรรม์อนุมัติ", en: "Policy Approval Date", ru: "Дата утверждения полиса", zh: "保单批准日期", fr: "Date d'Approbation de la Police" },
    "waiting_period_approval_desc": { th: "คุ้มครองจากการบาดเจ็บจากอุบัติเหตุหรือต้องได้รับการผ่าตัดฉุกเฉิน", en: "Coverage for injury from an accident or requiring emergency surgery", ru: "Покрытие травм в результате несчастного случая или необходимости экстренной операции", zh: "承保因意外或需要紧急手术造成的伤害", fr: "Couverture pour les blessures dues à un accident ou nécessitant une chirurgie d'urgence" },

    "waiting_period_30_days_title": { th: "หลังจาก 30 วัน", en: "After 30 Days", ru: "Через 30 дней", zh: "30天后", fr: "Après 30 Jours" },
    "waiting_period_30_days_desc": { th: "คุ้มครองจากการเจ็บป่วยไม่ว่าจะต้องนอนโรงพยาบาล หรือเจ็บป่วยไปพบแพทย์เพื่อรับยากลับบ้าน (ผู้ป่วยนอก OPD ผู้ป่วยใน IPD)", en: "Coverage for sickness whether requiring hospitalization or outpatient care (OPD/IPD).", ru: "Покрытие на случай болезни, требующей госпитализации или амбулаторного лечения (OPD/IPD).", zh: "承保疾病，无论是需要住院还是门诊护理（OPD/IPD）。", fr: "Couverture pour les maladies nécessitant une hospitalisation ou des soins ambulatoires (OPD/IPD)." },

    "waiting_period_120_days_title": { th: "หลังจาก 120 วัน", en: "After 120 Days", ru: "Через 120 дней", zh: "120天后", fr: "Après 120 Jours" },
    "waiting_period_120_days_desc": { th: "คุ้มครองจากการเจ็บป่วยด้วยโรคดังต่อไปนี้:", en: "Coverage for the following diseases:", ru: "Покрытие следующих заболеваний:", zh: "承保以下疾病：", fr: "Couverture pour les maladies suivantes :" },
    "waiting_period_120_days_item_1": { th: "เนื้องอก ถุงน้ำ หรือมะเร็งทุกชนิด", en: "Tumors, cysts, or all types of cancer", ru: "Опухоли, кисты или все виды рака", zh: "肿瘤、囊肿或所有类型的癌症", fr: "Tumeurs, kystes ou tous types de cancer" },
    "waiting_period_120_days_item_2": { th: "ริดสีดวงทวาร", en: "Hemorrhoids", ru: "Геморрой", zh: "痔疮", fr: "Hémorroïdes" },
    "waiting_period_120_days_item_3": { th: "ไส้เลื่อนทุกชนิด", en: "All types of hernias", ru: "Все виды грыж", zh: "所有类型的疝气", fr: "Tous types de hernies" },
    "waiting_period_120_days_item_4": { th: "ต้อเนื้อ หรือต้อกระจก", en: "Pterygium or cataracts", ru: "Птеригиум или катаракта", zh: "翼状胬肉或白内障", fr: "Ptérygion ou cataractes" },
    "waiting_period_120_days_item_5": { th: "การตัดทอนซิล หรืออดีนอยด์", en: "Tonsillectomy or adenoidectomy", ru: "Тонзиллэктомия или аденоидэктомия", zh: "扁桃体切除术或腺样体切除术", fr: "Amygdalectomie ou adénoïdectomie" },
    "waiting_period_120_days_item_6": { th: "นิ่วทุกชนิด", en: "All types of stones", ru: "Все виды камней", zh: "所有类型的结石", fr: "Tous types de calculs" },
    "waiting_period_120_days_item_7": { th: "เส้นเลือดขอดที่ขา", en: "Varicose veins", ru: "Варикозное расширение вен", zh: "静脉曲张", fr: "Varices" },
    "waiting_period_120_days_item_8": { th: "เยื่อบุโพรงมดลูกเจริญผิดที่", en: "Endometriosis", ru: "Эндометриоз", zh: "子宫内膜异位症", fr: "Endométriose" },

    "waiting_period_12_months_title": { th: "หลังจาก 12 เดือน", en: "After 12 Months", ru: "Через 12 месяцев", zh: "12个月后", fr: "Après 12 Mois" },
    "waiting_period_12_months_desc": { th: "คุ้มครองผลประโยชน์เพิ่มเติม: ค่ารักษาพยาบาลสำหรับภาวะแทรกซ้อนก่อนและหลังการคลอดบุตร (เฉพาะแผน Silver และ Gold)", en: "Additional benefits coverage: Medical expenses for complications before and after childbirth (Silver and Gold plans only).", ru: "Дополнительное покрытие: медицинские расходы на осложнения до и после родов (только для планов Silver и Gold).", zh: "额外福利保障：分娩前后并发症的医疗费用（仅限白银和黄金计划）。", fr: "Couverture d'avantages supplémentaires : Frais médicaux pour complications avant et après l'accouchement (plans Silver et Gold uniquement)." },

    "waiting_period_footnote": { th: "*หรือวันที่บริษัทอนุมัติให้เพิ่มผลประโยชน์ของสัญญาเพิ่มเติมนี้ แล้วแต่กรณีใดจะเกิดขึ้นภายหลัง", en: "*Or the date the company approves the addition of this rider's benefits, whichever occurs later.", ru: "*Или дата, когда компания утвердит добавление льгот по этому дополнительному соглашению, в зависимости от того, что наступит позже.", zh: "*或公司批准增加此附加条款福利的日期，以较晚者为准。", fr: "*Ou la date à laquelle la compagnie approuve l'ajout des avantages de cette clause additionnelle, selon la date la plus tardive." },

    "close_button": { th: "ปิด", en: "Close", ru: "Закрыть", zh: "关闭", fr: "Fermer" },
    "download_pdf_button": { th: "ดาวน์โหลด PDF", en: "Download PDF", ru: "Скачать PDF", zh: "下载 PDF", fr: "Télécharger PDF" },
    "print_pdf_button": { th: "ปริ้น / บันทึก PDF", en: "Print / Save PDF", ru: "Печать / Сохранить PDF", zh: "打印 / 保存 PDF", fr: "Imprimer / Enregistrer PDF" },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// ฟังก์ชัน detect ภาษาจาก browser/OS
function detectBrowserLanguage(): Language {
  if (typeof window === "undefined") {
    return "th"; // Default สำหรับ server-side
  }

  // ตรวจสอบ localStorage ก่อน (user preference)
  const savedLanguage = localStorage.getItem("app-language") as Language | null;
  if (savedLanguage && ["th", "en", "ru", "zh", "fr"].includes(savedLanguage)) {
    return savedLanguage;
  }

  // Detect จาก browser language
  const browserLang = navigator.language || (navigator as any).userLanguage;
  
  // แปลง language code เป็น Language type
  // เช่น "en-US" -> "en", "th-TH" -> "th"
  const langCode = browserLang.split("-")[0].toLowerCase();
  
  // Map language codes ที่รองรับ
  const languageMap: Record<string, Language> = {
    th: "th",
    en: "en",
    ru: "ru",
    zh: "zh",
    fr: "fr",
  };

  return languageMap[langCode] || "th"; // Default เป็น "th" ถ้าไม่รองรับ
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("th");
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize language จาก browser/OS เมื่อ component mount
  useEffect(() => {
    const detectedLanguage = detectBrowserLanguage();
    setLanguage(detectedLanguage);
    setIsInitialized(true);
  }, []);

  // ฟังก์ชัน setLanguage ที่เก็บใน localStorage ด้วย
  const handleSetLanguage = (newLanguage: Language) => {
    setLanguage(newLanguage);
    if (typeof window !== "undefined") {
      localStorage.setItem("app-language", newLanguage);
    }
  };

  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
