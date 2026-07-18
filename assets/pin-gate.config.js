/* Advisortool — PIN gate configuration. แก้ค่าที่นี่ที่เดียว.
   PIN ปกติตรวจสอบฝั่งเซิร์ฟเวอร์ผ่าน Supabase (az_gate_verify RPC).
   frontendPin ตรวจสอบใน browser ก่อนเรียก Supabase จึงใช้ได้แม้ Supabase ติดต่อไม่ได้.
   หมายเหตุ: รหัสฝั่ง frontend อ่านได้จาก source และไม่ใช่ security boundary. */
window.PIN_GATE_CONFIG = {
  supabaseUrl: 'https://yovibeztstpexajpuyyb.supabase.co',
  supabaseAnonKey: 'sb_publishable_8LnqhRHZKBTI9qUueCahPA_lKEMNc0K',
  frontendPin: '015495',                // ตรวจฝั่ง frontend ก่อน ไม่ต้องรอ Supabase
  supabaseTimeoutMs: 8000,              // timeout สำหรับรหัสปกติที่ต้องตรวจผ่าน Supabase
  storageKey: 'az_gate',                // key ใน localStorage
  idleTimeoutMs: 12 * 60 * 60 * 1000,   // ไม่ใช้งานเกิน 12 ชม. → ล็อกใหม่ (sliding)
  maxAttempts: 5,                       // ใส่ผิดกี่ครั้งถึงล็อกชั่วคราว (ฝั่ง UI; เซิร์ฟเวอร์ก็บังคับเองด้วย)
  lockoutSeconds: 30,                   // ล็อกนานเท่าไร (วินาที)
  title: 'กรุณาใส่รหัสผ่าน',
  subtitle: 'Advisortool'
};
