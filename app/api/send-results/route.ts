import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const escapeHtml = (s: any) =>
  String(s ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#39;");

const toArrayEmails = (v: any) =>
  String(v || "").split(",").map((s) => s.trim()).filter(Boolean);

function buildEmailHtml(payload: any) {
  const personal = payload?.formData?.personal ?? {};
  const openEnded = payload?.formData?.openEnded ?? {};
  const total = payload?.score?.total ?? 0;
  const bySection = payload?.score?.bySection ?? [];

  const name = personal["ชื่อ-นามสกุล"] || personal.name || "-";
  const phone = personal["หมายเลขโทรศัพท์"] || personal.phone || "-";
  const age = personal["อายุ"] || personal.age || "-";
  const email = personal["Email Address"] || personal.email || "-";
  const maritalStatus = personal.maritalStatus || "-";

  const sectionRows = bySection
    .map((s: any) => `
        <tr>
          <td style="padding:8px 10px;border:1px solid #e5e7eb;">${escapeHtml(s.label)}</td>
          <td style="padding:8px 10px;border:1px solid #e5e7eb;text-align:right;font-weight:700;">${escapeHtml(s.total)}</td>
        </tr>`).join("");

  const openEndedRows = [
    ["ความสนใจ / งานอดิเรก ของคุณคืออะไร?", openEnded.interest],
    ["บุคคลที่คุณให้ความเคารพมากที่สุดคือใคร? เพราะอะไร?", openEnded.roleModel],
    ["ในการทำงานที่ผ่านมา คุณเคยตัดสินใจเรื่องใดที่คุณคิดว่ายากที่สุด? และส่งผลอย่างไร?", openEnded.hardestDecision],
    ["คุณเคยเผชิญกับความล้มเหลวร้ายแรงในชีวิตการทำงานหรือไม่? แล้วคุณรับมือกับเรื่องนั้นอย่างไร?", openEnded.failure],
    ["ในการทำงานที่ผ่านมา คุณเคยถูกทดสอบความซื่อสัตย์ สุจริต บ้างหรือไม่? แล้วคุณรับมืออย่างไร?", openEnded.honesty],
    ["คนทุกคนย่อมต้องได้รับการคุ้มครองดูแลผลประโยชน์ส่วนตัว คุณจะมีวิธีดูแลผลประโยชน์ให้ลูกค้าอย่างไร?", openEnded.protectClient],
    ["คุณจะสร้างความสัมพันธ์กับลูกค้าในระยะยาวได้อย่างไรบ้าง?", openEnded.relationship],
  ].map(([q, a]: any) => `
        <div style="margin-top:12px;">
          <div style="font-weight:700;margin-bottom:4px;">${escapeHtml(q)}</div>
          <div style="white-space:pre-wrap;background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:10px;">${escapeHtml(a || "-")}</div>
        </div>`).join("");

  return `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#111827;line-height:1.45;">
    <h2 style="margin:0 0 6px 0;">ผลการทำแบบสอบถาม</h2>
    <div style="color:#6b7280;margin-bottom:14px;">สรุปคะแนนและคำตอบ (ส่งอัตโนมัติจากระบบ)</div>
    <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:14px;">
      <div style="flex:1;min-width:240px;border:1px solid #e5e7eb;border-radius:14px;padding:12px;">
        <div style="color:#6b7280;font-weight:700;font-size:12px;">คะแนนรวม</div>
        <div style="font-size:34px;font-weight:900;margin-top:2px;">${escapeHtml(total)} / 150</div>
      </div>
      <div style="flex:2;min-width:280px;border:1px solid #e5e7eb;border-radius:14px;padding:12px;">
        <div style="font-weight:800;margin-bottom:8px;">ข้อมูลผู้ทำแบบสอบถาม</div>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:4px 0;color:#6b7280;">ชื่อ-นามสกุล</td><td style="padding:4px 0;font-weight:700;">${escapeHtml(name)}</td></tr>
          <tr><td style="padding:4px 0;color:#6b7280;">โทรศัพท์</td><td style="padding:4px 0;font-weight:700;">${escapeHtml(phone)}</td></tr>
          <tr><td style="padding:4px 0;color:#6b7280;">อายุ</td><td style="padding:4px 0;font-weight:700;">${escapeHtml(age)}</td></tr>
          <tr><td style="padding:4px 0;color:#6b7280;">อีเมล</td><td style="padding:4px 0;font-weight:700;">${escapeHtml(email)}</td></tr>
          <tr><td style="padding:4px 0;color:#6b7280;">สถานภาพสมรส</td><td style="padding:4px 0;font-weight:700;">${escapeHtml(maritalStatus)}</td></tr>
        </table>
      </div>
    </div>
    <div style="border:1px solid #e5e7eb;border-radius:14px;padding:12px;margin-bottom:14px;">
      <div style="font-weight:800;margin-bottom:8px;">คะแนนแยกตามส่วน</div>
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr>
          <th style="text-align:left;padding:8px 10px;border:1px solid #e5e7eb;background:#f9fafb;">ส่วน</th>
          <th style="text-align:right;padding:8px 10px;border:1px solid #e5e7eb;background:#f9fafb;">คะแนน</th>
        </tr></thead>
        <tbody>${sectionRows || `<tr><td style="padding:8px 10px;border:1px solid #e5e7eb;" colspan="2">-</td></tr>`}</tbody>
      </table>
    </div>
    <div style="border:1px solid #e5e7eb;border-radius:14px;padding:12px;">
      <div style="font-weight:800;margin-bottom:8px;">คำถามปลายเปิด</div>
      ${openEndedRows}
    </div>
  </div>`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const SMTP_HOST = process.env.SMTP_HOST;
    const SMTP_USER = process.env.SMTP_USER;
    const SMTP_PASS = process.env.SMTP_PASS;
    const MAIL_FROM = process.env.MAIL_FROM;

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !MAIL_FROM) {
      return NextResponse.json({ ok: true, skippedEmail: true, reason: "smtp_not_configured" });
    }

    const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
    const SMTP_SECURE = String(process.env.SMTP_SECURE || "").toLowerCase() === "true";
    const RESULT_TO = process.env.RESULT_TO || "";

    const to = toArrayEmails(RESULT_TO);
    const applicantEmail =
      body?.formData?.personal?.["Email Address"] || body?.formData?.personal?.email || "";
    if (applicantEmail && String(process.env.SEND_TO_APPLICANT || "").toLowerCase() === "true") {
      to.push(String(applicantEmail).trim());
    }

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST, port: SMTP_PORT, secure: SMTP_SECURE,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    const name = body?.formData?.personal?.["ชื่อ-นามสกุล"] || "-";
    const total = body?.score?.total ?? 0;
    await transporter.sendMail({
      from: MAIL_FROM, to,
      subject: `ผลแบบสอบถาม (${name}) คะแนนรวม ${total}/150`,
      html: buildEmailHtml(body),
    });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || "Failed to send email" }, { status: 500 });
  }
}
