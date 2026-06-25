import Link from "next/link";

const apps = [
  { href: "/ci123", title: "CI123", desc: "ประกันโรคร้ายแรง — landing & เครื่องคำนวณเบี้ย" },
  { href: "/ihealthy", title: "iHealthyUltra", desc: "เปรียบเทียบแผนประกันสุขภาพ" },
  { href: "/global-saving", title: "Global Saving Plus", desc: "เครื่องคำนวณเงินออม 15/8" },
  { href: "/group-insurance", title: "Group Insurance", desc: "ใบเสนอราคาประกันกลุ่ม" },
];

export default function Hub() {
  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "48px 20px" }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, color: "#141413", marginBottom: 8 }}>เลือกแอป</h1>
      <p style={{ color: "#2a2a28", marginBottom: 32 }}>รวม 4 แอปไว้ในที่เดียว</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
        {apps.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            style={{ display: "block", padding: 20, borderRadius: 12, border: "1px solid #e8e6dc", background: "#fff", textDecoration: "none" }}
          >
            <div style={{ fontSize: 18, fontWeight: 700, color: "#d97757", marginBottom: 6 }}>{a.title}</div>
            <div style={{ color: "#2a2a28", fontSize: 14 }}>{a.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
