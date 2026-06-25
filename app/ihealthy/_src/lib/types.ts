export type PlanName = "smart" | "bronze" | "silver" | "gold";

export type Gender = "male" | "female";

export type Frequency = "monthly" | "six-monthly" | "yearly";

export type Language = "th" | "en" | "ru" | "zh" | "fr";

export type LocalizedString = {
  th: string;
  en: string;
  ru: string;
  zh: string;
  fr: string;
};

export type SubBenefitItem = { id: string; text: LocalizedString };

export type Benefit = {
  id?: string;
  name: LocalizedString;
  smart: string;
  bronze: string;
  silver: string;
  gold: string;
  subBenefit?: LocalizedString;
  subBenefits?: (LocalizedString | SubBenefitItem)[];
};

export type BenefitCategory = {
  category: LocalizedString;
  benefits: Benefit[];
};

export type PlanDetails = {
  [key in PlanName]: {
    name: LocalizedString;
    description: LocalizedString;
    highlight?: boolean;
  };
};

export type AgePremium = {
  age: number;
  yearly: number;
};

export type PremiumData = {
  [key in PlanName]: {
    [key in Gender]: AgePremium[];
  };
};
