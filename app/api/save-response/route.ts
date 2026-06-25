import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Ported from Career-Agent-Question server/index.js — appends each response to
// data/responses.jsonl + a flat data/responses.csv (works on a self-hosted Node
// server; on ephemeral/serverless hosting the files won't persist).
function appendResponse(payload: any) {
  try {
    const dir = path.join(process.cwd(), "data");
    const jsonlFile = path.join(dir, "responses.jsonl");
    const csvFile = path.join(dir, "responses.csv");
    fs.mkdirSync(dir, { recursive: true });
    const record = {
      createdAt: new Date().toISOString(),
      formData: payload.formData ?? {},
      score: payload.score ?? {},
    };
    fs.appendFileSync(jsonlFile, `${JSON.stringify(record)}\n`, { encoding: "utf8" });

    const personal = record.formData.personal ?? {};
    const openEnded = record.formData.openEnded ?? {};
    const total = Number(record.score?.total ?? 0);
    const category =
      total >= 118 ? "เขียว (118+)" : total >= 80 ? "ส้ม (80–117)" : "แดง (40–79 หรือต่ำกว่า)";

    const csvHeaders = [
      "createdAt", "name", "phone", "age", "email", "maritalStatus", "totalScore", "level",
      "interest", "roleModel", "hardestDecision", "failure", "honesty", "protectClient", "relationship",
    ];
    const exists = fs.existsSync(csvFile);
    const escapeCsv = (v: any) => String(v ?? "").replace(/"/g, '""');
    if (!exists) fs.writeFileSync(csvFile, `${csvHeaders.join(",")}\n`, { encoding: "utf8" });

    const rowValues = [
      record.createdAt,
      personal["ชื่อ-นามสกุล"] || "", personal["หมายเลขโทรศัพท์"] || "", personal["อายุ"] || "",
      personal["Email Address"] || "", personal.maritalStatus || "", total, category,
      openEnded.interest || "", openEnded.roleModel || "", openEnded.hardestDecision || "",
      openEnded.failure || "", openEnded.honesty || "", openEnded.protectClient || "", openEnded.relationship || "",
    ];
    const csvLine = `${rowValues.map((v) => `"${escapeCsv(v)}"`).join(",")}\n`;
    fs.appendFileSync(csvFile, csvLine, { encoding: "utf8" });
  } catch (err) {
    console.error("Failed to append response", err);
  }
}

export async function POST(req: Request) {
  try {
    const payload = await req.json().catch(() => ({}));
    appendResponse(payload);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || "Failed to save response" }, { status: 500 });
  }
}
