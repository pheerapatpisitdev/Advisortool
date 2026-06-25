import type { ReactNode } from "react";
import { LayoutGrid, HeartPulse, PiggyBank, ActivitySquare, Users } from "lucide-react";

// Shared AdvisorZone-style palette (sampled from the reference design)
export const C = {
  navy: "#14266b", // deep headline navy
  brand: "#1f3aa0", // logo / card title band
  brand2: "#2b6cc4", // "Zone" + card tagline blue
  indigo: "#3b3fb6", // active category chip
  red: "#e2231a", // diagonal slash + NEW ribbon
  bg: "#f4f5f7", // page background
  ink: "#33415c", // body bullet text
  muted: "#6b7280",
  line: "#e5e7eb", // borders
  thai: "'IBM Plex Sans Thai', system-ui, sans-serif",
};

export type Category = {
  key: string;
  label: string;
  icon: ReactNode;
};

export const categories: Category[] = [
  { key: "all", label: "แนะนำทั้งหมด", icon: <LayoutGrid size={20} /> },
  { key: "health", label: "สุขภาพ", icon: <HeartPulse size={20} /> },
  { key: "saving", label: "ออม-เกษียณ", icon: <PiggyBank size={20} /> },
  { key: "ci", label: "โรคร้ายแรง", icon: <ActivitySquare size={20} /> },
  { key: "group", label: "กลุ่ม-องค์กร", icon: <Users size={20} /> },
];

export type Product = {
  category: string; // matches a Category.key (never "all")
  href: string;
  band: string; // product name shown on the blue title band
  tagline: string;
  bullets: string[];
  isNew?: boolean;
  gradient: string; // placeholder background until a real image is provided
  imageSrc?: string; // drop a file in /public/hub/* and set this to use a real photo
  icon: ReactNode; // shown over the placeholder
};

export const products: Product[] = [
  {
    category: "saving",
    href: "/global-saving",
    band: "Global Saving Plus 15/8",
    tagline: "ยกระดับแผนการเงินเพื่ออนาคต สู่โอกาสรับผลตอบแทนระดับโลก",
    bullets: [
      "ชำระเบี้ยฯ 8 ปี ให้ความคุ้มครอง 15 ปี",
      "รับเงินคืนทุกปี พร้อมโอกาสรับผลตอบแทนเพิ่มจากดัชนี Citi Grandmaster RC 5 Index",
      "ผลประโยชน์การันตีเงินคืนรวมสูงสุด 815% ของจำนวนเงินเอาประกันภัย",
    ],
    isNew: true,
    gradient: "linear-gradient(135deg, #1f3aa0 0%, #2b6cc4 55%, #4f9be0 100%)",
    imageSrc: "/hub/global-saving.jpg",
    icon: <PiggyBank size={56} strokeWidth={1.4} />,
  },
  {
    category: "health",
    href: "/ihealthy",
    band: "iHealthy Ultra",
    tagline: "ประกันสุขภาพเหมาจ่าย ดูแลครบ จบทุกความกังวล",
    bullets: [
      "เปรียบเทียบแผนประกันสุขภาพและคำนวณเบี้ยรายบุคคล",
      "ความคุ้มครองค่ารักษาพยาบาลแบบเหมาจ่าย",
      "ลดหย่อนภาษีได้",
    ],
    gradient: "linear-gradient(135deg, #0f766e 0%, #14a89a 55%, #5fd3c4 100%)",
    imageSrc: "/hub/ihealthy.jpg",
    icon: <HeartPulse size={56} strokeWidth={1.4} />,
  },
  {
    category: "ci",
    href: "/ci123",
    band: "CI 123 ประกันโรคร้ายแรง",
    tagline: "เจอ จ่าย ครบ — ดูแลค่าใช้จ่ายเมื่อตรวจพบโรคร้าย",
    bullets: [
      "คุ้มครองโรคร้ายแรงครอบคลุมหลายระยะ",
      "เครื่องคำนวณเบี้ยในตัว เลือกแผนได้เอง",
      "ลดหย่อนภาษีได้",
    ],
    gradient: "linear-gradient(135deg, #b91c1c 0%, #e2231a 55%, #f97316 100%)",
    imageSrc: "/hub/ci123.jpg",
    icon: <ActivitySquare size={56} strokeWidth={1.4} />,
  },
  {
    category: "group",
    href: "/group-insurance",
    band: "ประกันกลุ่ม Group Insurance",
    tagline: "แผนความคุ้มครองสำหรับองค์กร พร้อมใบเสนอราคา",
    bullets: [
      "ประกันสุขภาพกลุ่ม / อุบัติเหตุกลุ่ม",
      "สร้างใบเสนอราคาและดาวน์โหลด PDF ได้ทันที",
      "เลือกแผนตามประเภทธุรกิจ",
    ],
    gradient: "linear-gradient(135deg, #3b3fb6 0%, #6d5ae0 55%, #9a7af0 100%)",
    imageSrc: "/hub/group-insurance.jpg",
    icon: <Users size={56} strokeWidth={1.4} />,
  },
];
