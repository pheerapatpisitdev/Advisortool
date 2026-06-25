# AdvisorKu

รวมเว็บแอป 4 ตัวเข้าเป็นแอปเดียวด้วย **Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS** โดยมีหน้า Hub สไตล์ AdvisorZone เป็นหน้าแรกสำหรับเลือกเข้าแต่ละแอป

## Routes

| Route | แอป | รายละเอียด |
|-------|-----|-----------|
| `/` | **Hub** | หน้าแรกสไตล์ AdvisorZone — การ์ดผลิตภัณฑ์ |
| `/global-saving` | Global Saving Plus | เครื่องคำนวณเงินออม (Vite → client-only) |
| `/ihealthy` | iHealthy Ultra | เปรียบเทียบแผนประกันสุขภาพ (shadcn/ui) |
| `/ci123` | CI 123 | ประกันโรคร้ายแรง + เครื่องคำนวณเบี้ย |
| `/group-insurance` | Group Insurance | ใบเสนอราคาประกันกลุ่ม (Vite → client-only, PDF) |
| `/fhc` | แบบสอบถามคุณภาพชีวิต | ฟอร์มประเมินการเงิน + บันทึก Supabase (แปลงจาก static HTML) |

## เริ่มใช้งาน

ต้องมี Node.js 20+ (พัฒนาบน v22)

```bash
npm install      # ติดตั้ง dependencies
npm run dev      # รัน dev server → http://localhost:3000
npm run build    # build production
npm run start    # รัน production server
```

## โครงสร้าง

```
app/
├─ layout.tsx              # shell + AdvisorHeader (ทุกหน้า)
├─ globals.css             # Tailwind + ธีม + สไตล์ Hub (.az-*)
├─ page.tsx                # Hub (หน้าแรก)
├─ <app>/page.tsx          # route ของแต่ละแอป
└─ <app>/_src/             # โค้ดของแต่ละแอป (private, ไม่เป็น route)
components/
├─ AdvisorHeader.tsx       # header ร่วม
├─ ProductCard.tsx         # การ์ดผลิตภัณฑ์ใน Hub
└─ hubData.tsx             # ข้อมูลการ์ด
public/hub/                # วางรูปจริงของการ์ดที่นี่ (ดู README ข้างใน)
```

## หมายเหตุ

- **รูปการ์ดใน Hub** ตอนนี้เป็น gradient placeholder — วางไฟล์จริงใน `public/hub/`
  (`global-saving.jpg`, `ihealthy.jpg`, `ci123.jpg`, `group-insurance.jpg`) รูปจะขึ้นทับเอง
- สองแอปที่มาจาก Vite (Global Saving, Group Insurance) โหลดแบบ client-only (`ssr: false`)
  เพราะใช้ browser API (chart.js / jspdf / html2canvas / `window`)
