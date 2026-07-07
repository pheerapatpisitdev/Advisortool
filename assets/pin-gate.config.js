/* Advisortool — PIN gate configuration. แก้ค่าที่นี่ที่เดียว.
   หมายเหตุ: PIN ตรวจสอบฝั่งเซิร์ฟเวอร์ผ่าน Supabase (az_gate_verify RPC) แล้ว —
   ไฟล์นี้ไม่มีรายการ PIN อีกต่อไป เพิ่ม/ปิดรหัสได้ที่ตาราง az_gate_pins ใน Supabase เท่านั้น. */
window.PIN_GATE_CONFIG = {
  supabaseUrl: 'https://yovibeztstpexajpuyyb.supabase.co',
  supabaseAnonKey: 'sb_publishable_8LnqhRHZKBTI9qUueCahPA_lKEMNc0K',
  storageKey: 'az_gate',                // key ใน localStorage
  idleTimeoutMs: 12 * 60 * 60 * 1000,   // ไม่ใช้งานเกิน 12 ชม. → ล็อกใหม่ (sliding)
  maxAttempts: 5,                       // ใส่ผิดกี่ครั้งถึงล็อกชั่วคราว (ฝั่ง UI; เซิร์ฟเวอร์ก็บังคับเองด้วย)
  lockoutSeconds: 30,                   // ล็อกนานเท่าไร (วินาที)
  title: 'กรุณาใส่รหัสผ่าน',
  subtitle: 'Advisortool'
};
