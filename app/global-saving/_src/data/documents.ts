// เอกสารการลงทุน (PDF สำเร็จรูป) — เพิ่ม/แก้ไขรายการได้ที่นี่
// ไฟล์จริงวางไว้ที่ public/docs/<file> เพื่อให้ Vite copy ลง dist
export type InvestmentDoc = {
  id: string;
  title: string;
  description: string;
  file: string; // ชื่อไฟล์ใน public/docs/
};

export const DOCUMENTS: InvestmentDoc[] = [
  {
    id: 'city',
    // TODO: แก้ชื่อ/คำอธิบายให้ตรงกับเนื้อหาไฟล์จริง
    title: 'เอกสารการลงทุน',
    description: 'เอกสารประกอบการนำเสนอ โกลบอล เซฟวิ่งส์ พลัส',
    file: 'city.pdf',
  },
];

// สร้าง URL ของไฟล์ให้ทำงานทั้งโดเมนรากและ subfolder (ตาม base: './')
export const docUrl = (file: string) => `/global-saving/docs/${file}`;
