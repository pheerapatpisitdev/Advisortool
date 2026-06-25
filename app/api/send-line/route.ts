import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// NOTE: LINE Notify was shut down by LINE (Mar 2025). Kept for parity — it
// gracefully skips when no token is configured.
export async function POST(req: Request) {
  try {
    const token = process.env.LINE_NOTIFY_TOKEN;
    if (!token) {
      return NextResponse.json({ ok: true, skippedLine: true, reason: "line_not_configured" });
    }
    const body = await req.json().catch(() => ({}));
    const personal = body?.formData?.personal ?? {};
    const openEnded = body?.formData?.openEnded ?? {};
    const total = body?.score?.total ?? 0;
    const category =
      total >= 118 ? "เขียว (118+)" : total >= 80 ? "ส้ม (80–117)" : "แดง (40–79 หรือต่ำกว่า)";

    const lines = [
      "📋 ผลแบบสอบถามความถนัดในอาชีพ",
      `ชื่อ-นามสกุล: ${personal["ชื่อ-นามสกุล"] || "-"}`,
      `โทรศัพท์: ${personal["หมายเลขโทรศัพท์"] || "-"}`,
      `อายุ: ${personal["อายุ"] || "-"}`,
      `คะแนนรวม: ${total} / 150`,
      `ระดับ: ${category}`,
      "",
      "📝 ประสบการณ์และทัศนคติ",
    ];
    ([
      ["ความสนใจ / งานอดิเรก", openEnded.interest],
      ["บุคคลที่คุณเคารพมากที่สุด", openEnded.roleModel],
      ["การตัดสินใจที่ยากที่สุด", openEnded.hardestDecision],
      ["ความล้มเหลวและการรับมือ", openEnded.failure],
      ["การทดสอบความซื่อสัตย์", openEnded.honesty],
      ["การดูแลผลประโยชน์ลูกค้า", openEnded.protectClient],
      ["การสร้างความสัมพันธ์ระยะยาว", openEnded.relationship],
    ] as [string, any][]).forEach(([label, ans]) => {
      if (ans) lines.push(`• ${label}: ${String(ans).trim().slice(0, 180)}`);
    });

    const params = new URLSearchParams();
    params.append("message", lines.join("\n"));
    const response = await fetch("https://notify-api.line.me/api/notify", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    if (!response.ok) throw new Error((await response.text().catch(() => "")) || "LINE Notify error");
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || "Failed to send to LINE" }, { status: 500 });
  }
}
