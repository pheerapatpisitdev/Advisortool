import type { ReactNode } from "react";
import { HeartPulse, PiggyBank, ActivitySquare, Users, Wallet, ClipboardList } from "lucide-react";

export type Product = {
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
  {
    href: "/family-planning",
    band: "Family Financial Planning",
    tagline: "วางแผนการเงินครอบครัวแบบเห็นภาพรวมทั้งกระดาน",
    bullets: [
      "มองเห็นเป้าหมายและความเสี่ยงทางการเงินของครอบครัว",
      "จัดลำดับความสำคัญของแผนแต่ละด้าน",
      "ใช้เป็นเครื่องมือพูดคุยวางแผนกับครอบครัว",
    ],
    gradient: "linear-gradient(135deg, #0e7490 0%, #06b6d4 55%, #67e8f9 100%)",
    imageSrc: "/hub/family-planning.jpg",
    icon: <Wallet size={56} strokeWidth={1.4} />,
  },
  {
    href: "/fhc",
    band: "แบบสอบถามคุณภาพชีวิต",
    tagline: "ประเมินสุขภาพการเงินและคุณภาพชีวิตอย่างรอบด้าน",
    bullets: [
      "กรอกอายุ รายได้ เงินเก็บ หนี้สิน คำนวณสดทันที",
      "สรุปภาพรวมสินทรัพย์สุทธิและค่าความสามารถ",
      "ส่งสรุปไป LINE ได้ทันที",
    ],
    gradient: "linear-gradient(135deg, #b45309 0%, #d97757 55%, #fbbf24 100%)",
    imageSrc: "/hub/fhc.jpg",
    icon: <ClipboardList size={56} strokeWidth={1.4} />,
  },
];
