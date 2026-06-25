"use client";
import './career.css';
import React, { useState, useMemo, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Send, User, FileText, BarChart3, MessageSquare, ListChecks } from 'lucide-react';
import Swal from 'sweetalert2';

const App = () => {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    personal: {},
    openEnded: {},
    mcq: {},
    supplementary: {}
  });

  useEffect(() => {
    if (step === 3) {
      const el = document.getElementById('results-top');
      if (el && 'scrollIntoView' in el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [step]);

  // คำตอบแบ่งออกเป็นส่วน (ส่วนที่ 1 ลักษณะบุคลิกภาพ - กลุ่มย่อย)
  const mcqSections = [
    { key: 'plan', label: 'การวางแผนและเป้าหมาย' },
    { key: 'learn', label: 'การเรียนรู้และพัฒนาตนเอง' },
    { key: 'self', label: 'มุมมองต่อตนเองและความมุ่งมั่น' },
    { key: 'social', label: 'บุคลิกภาพทางสังคม' },
    { key: 'business', label: 'ความคาดหวังทางธุรกิจ' },
    { key: 'insurance', label: 'ทัศนคติต่อประกันชีวิต' },
    { key: 'financial', label: 'การวางแผนการเงินและเกษียณ' },
  ];

  const mcqQuestions = [
    { id: 1, q: "หากเราวางแผนได้ดี ย่อมมีผลที่ดีตามมา", type: "likert", scoreType: "normal", section: "plan" },
    { id: 2, q: "ตราบใดที่ฉันทำงานที่ฉันรับผิดชอบได้ดี ฉันสามารถเลิกงานได้ตามที่ฉันต้องการ", type: "likert", scoreType: "inverse", section: "plan" },
    { id: 3, q: "ถ้ามีคนทำผิด ฉันจะได้บอกว่าเขาทำผิด", type: "likert", scoreType: "normal", section: "self" },
    { id: 4, q: "คนส่วนใหญ่เรียนรู้จากฉันในเรื่องต่าง ๆ", type: "likert", scoreType: "normal", section: "learn" },
    { id: 5, q: "หากเปิดใจยอมรับ การพัฒนาตนเองจะเกิดขึ้นได้เสมอ", type: "likert", scoreType: "normal", section: "learn" },
    { id: 6, q: "ฉันยอมรับคำวิจารณ์ เพราะมันเป็นสิ่งที่เป็นประโยชน์สำหรับฉัน", type: "likert", scoreType: "normal", section: "learn" },
    { id: 7, q: "ฉันคิดว่าฉันเองว่า ฉัน.......", type: "choice", scoreType: "normal", section: "self", options: ["ต้องเป็นที่ 1 หรือ ยอดเยี่ยมที่สุดเสมอ", "ยอมรับได้หากได้ลำดับที่ 2 หรือ 3 ในการแข่งขัน", "พึงพอใจในสถานการณ์ปัจจุบัน แต่ทุกสิ่งควรดีขึ้นกว่าเดิม", "เป็นนักจัดหาสิ่งที่ตอบสนองความจำเป็นขั้นพื้นฐานของชีวิตที่ยอดเยี่ยม", "ปล่อยให้ทุกอย่างเป็นไปตามโชคชะตา"] },
    { id: 8, q: "ฉันเห็นคุณค่าของการกำหนดเป้าหมายและบรรลุเป้าหมาย", type: "likert", scoreType: "normal", section: "plan" },
    { id: 9, q: "ฉันมีแผนประจำปี และเป้าหมายของฉัน สำเร็จ..... ต่อปี", type: "choice", scoreType: "normal", section: "plan", options: ["0", "1-2", "3-4", "มากกว่า 5", "เป้าหมายที่วางไว้ใช้เวลามากกว่า 1 ปี จึงจะสำเร็จได้"] },
    { id: 10, q: "คุณคิดว่าจะมีลูกค้าซื้อประกันชีวิตกับคุณกี่คน", type: "choice", scoreType: "normal", section: "business", options: ["น้อยกว่า 10", "10-50", "50-100", "100-150", "มากกว่า 150"] },
    { id: 11, q: "คุณคิดว่าจะมีลูกค้าจากตลาดธรรมชาติกี่เปอร์เซ็นต์จากลูกค้าทั้งหมด", type: "choice", scoreType: "normal", section: "business", options: ["1-20%", "20-40%", "40-60%", "60-80%", "80-100%"] },
    { id: 12, q: "คนที่ฉันรู้จัก เห็นด้วยกับการตัดสินใจเป็นตัวแทนประกันชีวิต", type: "likert", scoreType: "normal", section: "business" },
    { id: 13, q: "ฉันจะดำเนินการทุกอย่างตามแผนเสมอ", type: "likert", scoreType: "normal", section: "plan" },
    { id: 14, q: "หากเผชิญปัญหา หรือไม่เป็นไปตามแผนที่วางไว้ ฉันจะหยุด และล้มเลิกการดำเนินการ", type: "likert", scoreType: "inverse", section: "plan" },
    { id: 15, q: "คนที่ฉันรู้จักฉันเป็นอย่างดี มองว่า ฉันเป็นคนที่ :", type: "choice", scoreType: "normal", section: "self", options: ["ขับเคลื่อนด้วยเป้าหมายที่ชัดเจนและด้วยความทะเยอทะยาน", "กระตือรือร้นและมองหาความท้าทายใหม่ๆ", "เปิดรับความท้าทายใหม่ๆ แต่จะไม่เดินหน้าเข้าหาสิ่งนั้น", "มักนั่งรอให้อะไรบางอย่างเกิดขึ้น", "ความเปลี่ยนแปลงไม่มีผลกระทบกับฉัน"] },
    { id: 16, q: "ฉันสามารถควบคุมอารมณ์ได้เป็นอย่างดีในสถานการณ์ต่าง ๆ", type: "likert", scoreType: "normal", section: "self" },
    { id: 17, q: "ฉันมีแรงกระตุ้นในตนเอง และชอบความท้าทาย", type: "likert", scoreType: "normal", section: "self" },
    { id: 18, q: "ฉันต้องการคำแนะนำในการทำสิ่งต่าง ๆ เพื่อความมั่นใจในตนเอง", type: "likert", scoreType: "inverse", section: "self" },
    { id: 19, q: "ฉันชอบมีเพื่อนมาก และ พบปะผู้คนใหม่ ๆ", type: "likert", scoreType: "normal", section: "social" },
    { id: 20, q: "ฉันคิดว่าฉันเป็นคนที่", type: "choice", scoreType: "normal", section: "social", options: ["ชอบออกสังคมและเข้ากับคนง่าย", "เป็นมิตร และ ช่างพูด ช่างคุย", "มีส่วนร่วมในการพูดคุยด้วย", "สุขุม และ หนักแน่น", "ทำงานได้อย่างยอดเยี่ยมเมื่ออยู่ลำพัง"] },
    { id: 21, q: "ฉันชอบการมีส่วนร่วมในวงสนทนากับคนอื่น ๆ", type: "likert", scoreType: "normal", section: "social" },
    { id: 22, q: "หากไปในที่ไม่รู้จักใคร ฉันมักจะรอให้คนอื่นเริ่มชวนคุยก่อน", type: "likert", scoreType: "inverse", section: "social" },
    { id: 23, q: "ฉันไม่ยอมให้ใครมาทำให้ฉันรู้สึกด้อยกว่าได้", type: "likert", scoreType: "normal", section: "self" },
    { id: 24, q: "ฉันต้องรู้ว่ามีความคาดหวังอะไรจากฉัน ฉันจึงจะรู้สึกสบายใจ", type: "likert", scoreType: "inverse", section: "self" },
    { id: 25, q: "ความคุ้มครองของประกันชีวิต มีไว้สำหรับหัวหน้าครอบครัว หรือ คนที่หารายได้หลักเท่านั้น", type: "likert", scoreType: "inverse", section: "insurance" },
    { id: 26, q: "การประกันชีวิตยังไม่ได้เป็นที่ยอมรับของคนส่วนใหญ่", type: "likert", scoreType: "inverse", section: "insurance" },
    { id: 27, q: "ฉันไม่กล้านำเสนอประกันชีวิตให้กับคนรู้จัก การเริ่มต้นกับคนไม่รู้จักนั้นง่ายกว่า", type: "likert", scoreType: "inverse", section: "insurance" },
    { id: 28, q: "อายุที่เหมาะสมในการวางแผนการเกษียณอายุคือ.....ปี", type: "choice", scoreType: "normal", section: "financial", options: ["25 ถึง 35", "35 ถึง 40", "40 ถึง 45", "45 ถึง 50", "50 ถึง 55"] },
    { id: 29, q: "สิ่งสำคัญที่สุดในการวางแผนการเงินคือ การรวบรวมข้อมูลของลูกค้าก่อนให้คำแนะนำ", type: "likert", scoreType: "normal", section: "financial" },
    { id: 30, q: "ผู้ที่มีความมั่งคั่งทางการเงินเท่านั้น ที่ควรวางแผนการเงิน", type: "likert", scoreType: "inverse", section: "financial" },
  ];

  const likertOptions = ["เห็นด้วยอย่างยิ่ง", "เห็นด้วย", "ไม่มีความคิดเห็น", "ไม่เห็นด้วย", "ไม่เห็นด้วยอย่างยิ่ง"];
  const choiceLabels = ["ก.", "ข.", "ค.", "ง.", "จ."];

  // ลำดับการแสดงข้อ (ตามส่วน): ข้อ 1–30
  const orderedQuestions = useMemo(
    () => mcqSections.flatMap((sec) => mcqQuestions.filter((q) => q.section === sec.key)),
    []
  );

  const calculateScore = useMemo(() => {
    const orderedIds = mcqSections.flatMap((s) =>
      mcqQuestions.filter((q) => q.section === s.key).map((q) => q.id)
    );
    const displayOrderById = {};
    orderedIds.forEach((id, i) => { displayOrderById[id] = i + 1; });

    let total = 0;
    const details = [];
    const sectionTotals = {};
    mcqSections.forEach((s) => { sectionTotals[s.key] = { label: s.label, total: 0, details: [] }; });

    mcqQuestions.forEach((q) => {
      const answer = formData.mcq[q.id];
      const options = q.type === "likert" ? likertOptions : q.options;
      const index = options.indexOf(answer);

      let score = 0;
      if (answer) {
        if (q.scoreType === "normal") {
          score = 5 - index; // ก=5, จ=1
        } else {
          score = index + 1; // ก=1, จ=5
        }
        total += score;
      }

      const item = {
        id: q.id,
        displayOrder: displayOrderById[q.id] ?? q.id,
        question: q.q,
        score,
        answer: answer || "ไม่ได้ระบุ",
        label: index !== -1 ? choiceLabels[index] : "-",
        section: q.section
      };
      details.push(item);
      if (q.section && sectionTotals[q.section]) {
        sectionTotals[q.section].total += score;
        sectionTotals[q.section].details.push(item);
      }
    });

    const bySection = mcqSections.map((s) => ({
      key: s.key,
      label: s.label,
      total: sectionTotals[s.key]?.total ?? 0,
      details: sectionTotals[s.key]?.details ?? []
    }));

    return { total, details, bySection };
  }, [formData.mcq]);

  const getInterviewGuide = (qId, score, label) => {
    if (qId === 1) {
      return (label === "ก." || label === "ข.")
        ? "คุณพออธิบายเพิ่มเติมได้ไหมว่า คุณมีประสบการณ์อะไรที่ผ่านมาที่เกี่ยวข้องกับการวางแผน?"
        : "เหตุใดคุณจึงเลือกคำตอบข้อนี้? คุณมีประสบการณ์เรื่องการวางแผนอย่างไรบ้าง?";
    }
    if (qId === 2) {
      return (label === "ก." || label === "ข.")
        ? "ถ้าหากคุณเห็นเพื่อนร่วมงานของคุณเลิกงานตามใจชอบ คุณจะทำอย่างไร?"
        : "ทำไมคุณจึงรู้สึกว่าการเลิกงานตามความรับผิดชอบ (ไม่ใช่ตามเวลา) เป็นสิ่งที่เหมาะสม?";
    }
    if (qId === 3) {
      return (label === "ก." || label === "ข." || label === "ค.")
        ? "คุณจะตัดสินใจอย่างไรถึงความจำเป็นที่ต้องบอกพวกเขาว่าเขาทำผิดอยู่?"
        : "ทำไมคุณจึงเลือกที่จะไม่บอกเมื่อเห็นคนทำผิด?";
    }
    return null;
  };

  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: { ...prev[section], [field]: value }
    }));
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const submitAndShowResults = async () => {
    const payload = { formData, score: calculateScore };
    const sheetUrl = process.env.NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL;

    Swal.fire({
      title: 'กำลังบันทึกข้อมูล...',
      text: 'กรุณารอสักครู่',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      if (sheetUrl) {
        const res = await fetch(sheetUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) {
          throw new Error(data?.error || 'บันทึกไม่สำเร็จ');
        }
      } else {
        await fetch('/api/save-response', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      // พยายามส่งผลแบบสอบถามไปที่อีเมล (ถ้าตั้งค่า SMTP ไว้)
      try {
        await fetch('/api/send-results', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch {
        // ไม่ต้องขว้าง error ออกไป ให้การส่งแบบสอบถามสำเร็จได้ต่อ
      }

      Swal.close();
    } catch (err) {
      await Swal.fire({
        icon: 'error',
        title: 'บันทึกไม่สำเร็จ',
        text: err?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่',
      });
    }
    nextStep();
  };

  const shareSummaryToLine = () => {
    const personal = formData.personal ?? {};
    const openEnded = formData.openEnded ?? {};
    const total = calculateScore?.total ?? 0;
    const category =
      total >= 118 ? 'เขียว (118+)' : total >= 80 ? 'ส้ม (80–117)' : 'แดง (40–79 หรือต่ำกว่า)';
    const name = personal['ชื่อ-นามสกุล'] || '-';
    const phone = personal['หมายเลขโทรศัพท์'] || '-';
    const age = personal['อายุ'] || '-';
    const messageLines = [
      '📋 ผลแบบสอบถามความถนัดในอาชีพ',
      `ชื่อ-นามสกุล: ${name}`,
      `โทรศัพท์: ${phone}`,
      `อายุ: ${age}`,
      `คะแนนรวม: ${total} / 150`,
      `ระดับ: ${category}`,
      '',
      '📝 ประสบการณ์และทัศนคติ',
    ];
    const openBlocks = [
      ['ความสนใจ / งานอดิเรก', openEnded.interest],
      ['บุคคลที่คุณเคารพมากที่สุด', openEnded.roleModel],
      ['การตัดสินใจที่ยากที่สุด', openEnded.hardestDecision],
      ['ความล้มเหลวและการรับมือ', openEnded.failure],
      ['การทดสอบความซื่อสัตย์', openEnded.honesty],
      ['การดูแลผลประโยชน์ลูกค้า', openEnded.protectClient],
      ['การสร้างความสัมพันธ์ระยะยาว', openEnded.relationship],
    ];
    openBlocks.forEach(([label, ans]) => {
      if (ans) {
        messageLines.push(`• ${label}: ${String(ans).trim().slice(0, 180)}`);
      }
    });
    const text = messageLines.join('\n');
    const lineShareUrl = `https://line.me/R/msg/text/?${encodeURIComponent(text)}`;
    window.open(lineShareUrl, '_blank', 'noopener,noreferrer');
  };

  const renderWelcome = () => (
    <div className="text-center space-y-4 sm:space-y-6 py-4 sm:py-10 animate-fadeIn">
      <div className="flex justify-center">
        <img src="/career-agent/logo.png" alt="Career Agent Question (CAQ)" className="w-24 h-24 sm:w-32 sm:h-32 object-contain" />
      </div>
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-text-primary-light tracking-tight px-1">แบบสอบถามความถนัดในอาชีพ</h1>
      <p className="text-text-secondary max-w-lg mx-auto italic leading-relaxed text-sm sm:text-base px-1">
        " ท้ายที่สุดแล้ว เราคงต้องถามตัวเองว่าคนแบบไหนที่เราอยากจะเป็น "
        <br />— Leo Babauta
      </p>
      <div className="bg-bubble-user-light p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl text-left max-w-2xl mx-auto space-y-3 sm:space-y-4 border border-border-light">
        <h3 className="font-bold text-text-primary-light text-sm sm:text-base">คำชี้แจงก่อนเริ่ม</h3>
        <p className="text-text-secondary text-xs sm:text-sm">แบบสอบถามนี้มีจุดมุ่งหมายที่จะช่วยให้บริษัททำความเข้าใจผู้สมัครได้ดีขึ้น เพื่อการเตรียมความพร้อมในบทบาทของการเป็นตัวแทนประกันชีวิต</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-2">
          <div className="p-3 bg-surface-light rounded-lg border border-border-light">
            <span className="block text-[#D97757] font-bold text-sm">ส่วนที่ 1</span>
            <span className="text-xs text-text-secondary">ข้อมูลส่วนตัวและทัศนคติ</span>
          </div>
          <div className="p-3 bg-surface-light rounded-lg border border-border-light">
            <span className="block text-[#D97757] font-bold text-sm">ส่วนที่ 2</span>
            <span className="text-xs text-text-secondary">ลักษณะบุคลิกภาพ — คำถามปรนัย 30 ข้อ (แบ่งเป็น 7 กลุ่มย่อย)</span>
          </div>
        </div>
      </div>
      <button
        onClick={nextStep}
        className="min-h-[44px] px-6 sm:px-10 py-3 sm:py-4 bg-[#D97757] text-white rounded-xl font-bold hover:bg-[#E8845C] active:bg-[#C4623F] transition-all hover:shadow-lg active:scale-95 flex items-center mx-auto gap-2 text-sm sm:text-base"
      >
        เริ่มทำแบบสอบถาม <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
      </button>
    </div>
  );

  const renderPart1 = () => (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      <div className="flex items-center gap-3 border-b border-border-light pb-3 sm:pb-4">
        <div className="p-2 bg-[#D97757]/10 text-[#D97757] rounded-lg shrink-0"><User className="w-5 h-5 sm:w-6 sm:h-6" /></div>
        <h2 className="text-lg sm:text-xl font-bold text-text-primary-light">ข้อมูลส่วนตัว</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {['ชื่อ-นามสกุล', 'หมายเลขโทรศัพท์', 'อายุ', 'Email Address'].map((label, i) => (
          <div key={i} className="space-y-1.5">
            <label className="text-sm font-semibold text-text-secondary">{label}</label>
            {label === 'อายุ' ? (
              <select
                defaultValue=""
                className="w-full min-h-[44px] p-3 bg-bubble-user-light border border-border-light rounded-xl focus:bg-surface-light focus:ring-2 focus:ring-[#D97757] outline-none transition-all text-base text-text-primary-light"
                onChange={(e) => handleInputChange('personal', label, e.target.value)}
              >
                <option value="" disabled>กรุณาเลือกอายุ</option>
                {Array.from({ length: 31 }, (_, idx) => 20 + idx).map((age) => (
                  <option key={age} value={age}>{age}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                className="w-full min-h-[44px] p-3 bg-bubble-user-light border border-border-light rounded-xl focus:bg-surface-light focus:ring-2 focus:ring-[#D97757] outline-none transition-all text-base text-text-primary-light"
                onChange={(e) => handleInputChange('personal', label, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <label className="text-sm font-semibold text-text-secondary">สถานภาพสมรส</label>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {["โสด", "โสดแต่มีผู้อยู่ในอุปการะ", "สมรส", "สมรสและมีบุตร", "อื่นๆ"].map(status => (
            <button
              key={status}
              onClick={() => handleInputChange('personal', 'maritalStatus', status)}
              className={`min-h-[44px] px-3 sm:px-4 py-2.5 rounded-full border text-xs sm:text-sm transition-all touch-manipulation ${
                formData.personal.maritalStatus === status ? 'bg-[#D97757] border-[#D97757] text-white hover:bg-[#E8845C] active:bg-[#C4623F]' : 'bg-surface-light border-border-light text-text-secondary hover:border-[#D97757]'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 border-b border-border-light pb-3 sm:pb-4 pt-4 sm:pt-6">
        <div className="p-2 bg-[#D97757]/10 text-[#D97757] rounded-lg shrink-0"><FileText className="w-5 h-5 sm:w-6 sm:h-6" /></div>
        <h2 className="text-lg sm:text-xl font-bold text-text-primary-light">ประสบการณ์และทัศนคติ</h2>
      </div>

      <div className="space-y-4 sm:space-y-6">
        {[
          { id: 'interest', q: "ความสนใจ / งานอดิเรก ของคุณคืออะไร?" },
          { id: 'roleModel', q: "บุคคลที่คุณให้ความเคารพมากที่สุดคือใคร? เพราะอะไร?" },
          { id: 'hardestDecision', q: "ในการทำงานที่ผ่านมา คุณเคยตัดสินใจเรื่องใดที่คุณคิดว่ายากที่สุด? และส่งผลอย่างไร?" },
          { id: 'failure', q: "คุณเคยเผชิญกับความล้มเหลวร้ายแรงในชีวิตการทำงานหรือไม่? แล้วคุณรับมือกับเรื่องนั้นอย่างไร?" },
          { id: 'honesty', q: "ในการทำงานที่ผ่านมา คุณเคยถูกทดสอบความซื่อสัตย์ สุจริต บ้างหรือไม่? แล้วคุณรับมืออย่างไร?" },
          { id: 'protectClient', q: "คนทุกคนย่อมต้องได้รับการคุ้มครองดูแลผลประโยชน์ส่วนตัว คุณจะมีวิธีดูแลผลประโยชน์ให้ลูกค้าอย่างไร?" },
          { id: 'relationship', q: "คุณจะสร้างความสัมพันธ์กับลูกค้าในระยะยาวได้อย่างไรบ้าง?" }
        ].map((item) => (
          <div key={item.id} className="space-y-2">
            <label className="block text-xs sm:text-sm font-semibold text-text-primary-light leading-snug">{item.q}</label>
            <textarea
              className="w-full p-3 sm:p-4 bg-bubble-user-light border border-border-light rounded-xl focus:bg-surface-light focus:ring-2 focus:ring-[#D97757] outline-none min-h-[88px] sm:min-h-[100px] transition-all text-base text-text-primary-light placeholder:text-text-secondary"
              onChange={(e) => handleInputChange('openEnded', item.id, e.target.value)}
              placeholder="กรุณาระบุรายละเอียด..."
            />
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center pt-4 sm:pt-6 gap-3">
        <button onClick={prevStep} className="min-h-[44px] px-4 sm:px-6 py-2.5 text-text-secondary hover:text-text-primary-light font-medium text-sm sm:text-base touch-manipulation">ย้อนกลับ</button>
        <button onClick={nextStep} className="min-h-[44px] px-6 sm:px-10 py-3 bg-[#D97757] text-white rounded-xl font-bold hover:bg-[#E8845C] active:bg-[#C4623F] shadow-lg text-sm sm:text-base touch-manipulation">ถัดไป</button>
      </div>
    </div>
  );

  const renderPart2 = () => (
    <div className="space-y-6 sm:space-y-10 animate-fadeIn">
      <div className="bg-[#D97757]/10 p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-[#D97757]/20 flex gap-3 sm:gap-4 items-start">
        <div className="p-2 bg-[#D97757]/20 text-[#D97757] rounded-full shrink-0"><MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" /></div>
        <p className="text-text-primary-light text-xs sm:text-sm leading-relaxed">
          <strong>คำแนะนำ:</strong> อย่าใช้เวลาทบทวนคำถามนานเกินไป คำตอบแรกที่คุณได้จะเป็นคำตอบที่แม่นยำที่สุด
        </p>
      </div>

      <div className="space-y-8 sm:space-y-14">
        {mcqSections.map((sec) => {
          const sectionQuestions = mcqQuestions.filter((q) => q.section === sec.key);
          if (sectionQuestions.length === 0) return null;
          const startIndex = orderedQuestions.findIndex((q) => q.section === sec.key);
          return (
            <div key={sec.key} className="space-y-5 sm:space-y-8">
              <div className="flex items-center gap-3 pb-2 border-b-2 border-border-light">
                <span className="px-2.5 sm:px-3 py-1 bg-bubble-user-light text-text-primary-light rounded-lg text-xs sm:text-sm font-bold">
                  ส่วน: {sec.label}
                </span>
              </div>
              {sectionQuestions.map((q, idx) => (
                <div key={q.id} className="space-y-3 sm:space-y-5">
                  <h3 className="text-base sm:text-lg font-bold text-text-primary-light leading-snug">
                    <span className="text-[#D97757] mr-1.5 sm:mr-2 shrink-0">{startIndex + idx + 1}.</span>
                    <span className="break-words">{q.q}</span>
                  </h3>
                  <div className="grid grid-cols-1 gap-2 sm:gap-3">
                    {(q.type === "likert" ? likertOptions : q.options).map((opt, optIdx) => (
                      <label
                        key={optIdx}
                        className={`flex items-center gap-3 sm:gap-4 min-h-[48px] p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 cursor-pointer transition-all touch-manipulation ${
                          formData.mcq[q.id] === opt
                            ? 'border-[#D97757] bg-[#D97757]/10 shadow-md'
                            : 'border-border-light bg-surface-light hover:border-[#D97757]/50 hover:bg-bubble-user-light'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          checked={formData.mcq[q.id] === opt}
                          onChange={() => handleInputChange('mcq', q.id, opt)}
                          className="hidden"
                        />
                        <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          formData.mcq[q.id] === opt ? 'border-[#D97757] bg-[#D97757]/10' : 'border-border-light'
                        }`}>
                          {formData.mcq[q.id] === opt && <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-[#D97757] rounded-full" />}
                        </div>
                        <span className="text-text-primary-light font-medium text-sm sm:text-base break-words">
                          <span className="text-[#D97757] mr-1.5 sm:mr-2 opacity-80 font-bold shrink-0">{choiceLabels[optIdx]}</span>
                          {opt}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <div className="flex justify-between items-center gap-3 pt-6 sm:pt-10 border-t border-border-light">
        <button onClick={prevStep} className="min-h-[44px] px-4 sm:px-6 py-2.5 text-text-secondary hover:text-text-primary-light font-medium text-sm sm:text-base touch-manipulation">ย้อนกลับ</button>
        <button
          onClick={submitAndShowResults}
          className="min-h-[48px] px-6 sm:px-12 py-3 sm:py-4 bg-[#D97757] text-white rounded-xl sm:rounded-2xl font-black hover:bg-[#E8845C] active:bg-[#C4623F] flex items-center gap-2 sm:gap-3 shadow-xl transition-all hover:-translate-y-0.5 sm:hover:-translate-y-1 text-sm sm:text-base touch-manipulation"
        >
          ส่งแบบสอบถาม <Send className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
        </button>
      </div>
    </div>
  );

  const getScoreCategory = () => {
    const t = calculateScore.total;
    if (t >= 118) return { key: 'green', label: 'เขียว' };
    if (t >= 80) return { key: 'orange', label: 'ส้ม' };
    return { key: 'red', label: 'แดง' };
  };
  const scoreCategory = getScoreCategory();

  const renderSuccess = () => (
    <div id="results-top" className="space-y-6 sm:space-y-10 animate-scaleUp">
      <div className="text-center py-4 sm:py-6">
        <div className="flex justify-center mb-4 sm:mb-6">
          <div className="flex justify-center">
            <img src="/logo.png" alt="Career Agent Question (CAQ)" className="w-20 h-20 sm:w-24 sm:h-24 object-contain" />
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-text-primary-light tracking-tight px-1">ส่งแบบสอบถามเรียบร้อย</h1>
        <p className="text-text-secondary font-medium text-sm sm:text-base mt-1 px-1">สรุปคะแนนและคำตอบทั้งหมดของคุณปรากฏด้านล่าง</p>
      </div>

      {/* ผลการทำแบบสอบถาม - Three categories + scale */}
      <div className="space-y-4 sm:space-y-8">
        <h2 className="text-lg sm:text-2xl font-bold text-text-primary-light text-right">ผลการทำแบบสอบถาม</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* แดง 40-79 หรือต่ำกว่า */}
          <div className={`p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 ${scoreCategory.key === 'red' ? 'border-red-500 ring-2 ring-red-200' : 'border-red-100'} bg-red-50`}>
            <h3 className="font-bold text-red-800 mb-2 sm:mb-3 text-sm sm:text-base">แดง (คะแนน 40-79 หรือต่ำกว่า)</h3>
            <p className="text-xs sm:text-sm text-red-900/90 leading-relaxed">
              ผู้สมัครในกลุ่มนี้จะต้องใช้เวลาจากผู้จัดการค่อนข้างมาก ในการให้คำแนะนำ ฝึกอบรม พัฒนา และลงพื้นที่ทำงานร่วมกันเพื่อให้บรรลุความสำเร็จ ผู้จัดการต้องพร้อมที่จะทุ่มเทและใช้เวลาอย่างมากในการพัฒนาศักยภาพและสร้างแรงจูงใจให้พวกเขาบรรลุความสำเร็จในบทบาทนี้
            </p>
          </div>
          {/* ส้ม 80-117 */}
          <div className={`p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 ${scoreCategory.key === 'orange' ? 'border-orange-500 ring-2 ring-orange-200' : 'border-orange-100'} bg-orange-50`}>
            <h3 className="font-bold text-orange-800 mb-2 sm:mb-3 text-sm sm:text-base">ส้ม (คะแนน 80 ถึง 117)</h3>
            <p className="text-xs sm:text-sm text-orange-900/90 leading-relaxed">
              ผู้สมัครมีความเหมาะสมกับงานนี้ และจำเป็นต้องเรียนรู้อย่างเป็นระบบ จะต้องใช้เวลาจากผู้จัดการบ้างในการให้คำแนะนำและชี้แนะ รวมถึงการกำหนดทิศทางให้บรรลุความสำเร็จในงาน หลังจากนั้นผู้จัดการจะได้รับผลตอบแทนจากการทำงานของพวกเขา
            </p>
            <p className="mt-2 sm:mt-3 text-[10px] sm:text-xs font-semibold text-orange-700">KTAXA Advisor X · KTAXA Advisor</p>
          </div>
          {/* เขียว 118 ขึ้นไป */}
          <div className={`p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 ${scoreCategory.key === 'green' ? 'border-green-500 ring-2 ring-green-200' : 'border-green-100'} bg-green-50`}>
            <h3 className="font-bold text-green-800 mb-2 sm:mb-3 text-sm sm:text-base">เขียว (คะแนน 118 ขึ้นไป)</h3>
            <p className="text-xs sm:text-sm text-green-900/90 leading-relaxed">
              ผู้สมัครมีความมั่นใจในธุรกิจประกันชีวิตสูง มีแรงจูงใจในตนเองแข็งแกร่ง สามารถฝึกฝนได้ และมีแนวโน้มความสำเร็จในธุรกิจนี้สูงมาก ผู้จัดการควรใช้เวลากับกลุ่มนี้เพื่อสร้างแรงบันดาลใจและกระตุ้นให้พวกเขาบรรลุมาตรฐานสูงสุดเท่าที่จะเป็นไปได้
            </p>
            <p className="mt-2 sm:mt-3 text-[10px] sm:text-xs font-semibold text-green-700">AXA Prime</p>
          </div>
        </div>

        {/* Visual score scale 0–150 (แบบแถบ gradient + มาร์กเกอร์วงรี + เส้นประ) */}
        <div className="space-y-4 sm:space-y-5">
          {/* ป้ายเหนือแถบ + เส้นประลงมาหามาร์กเกอร์ */}
          <div className="relative h-14 sm:h-16 w-full">
            {/* เส้นประที่ 80 */}
            <div
              className="absolute bottom-0 top-0 w-px border-l-2 border-dashed border-blue-500 opacity-80"
              style={{ left: '53.33%', transform: 'translateX(-50%)' }}
              aria-hidden
            />
            {/* เส้นประที่ 118 */}
            <div
              className="absolute bottom-0 top-0 w-px border-l-2 border-dashed border-red-500 opacity-80"
              style={{ left: '78.67%', transform: 'translateX(-50%)' }}
              aria-hidden
            />
            <div
              className="absolute text-center whitespace-nowrap"
              style={{ left: '53.33%', transform: 'translateX(-50%)', bottom: '0' }}
            >
              <div className="text-[10px] sm:text-xs font-bold text-blue-600 leading-tight">KTAXA Advisor X</div>
              <div className="text-[10px] sm:text-xs font-bold text-blue-600 leading-tight">KTAXA Advisor</div>
            </div>
            <div
              className="absolute text-center whitespace-nowrap"
              style={{ left: '78.67%', transform: 'translateX(-50%)', bottom: '0' }}
            >
              <div className="text-[10px] sm:text-xs font-bold text-red-600 leading-tight">AXA Prime</div>
            </div>
          </div>

          {/* แถบ gradient + วงรีตัวเลขบนแถบ */}
          <div className="relative w-full" style={{ height: '2.5rem' }}>
            <div
              className="absolute inset-0 rounded-xl"
              style={{
                background: 'linear-gradient(to right, #dc2626 0%, #ea580c 35%, #ca8a04 55%, #16a34a 100%)',
              }}
            />
            {/* วงรีที่ 80 */}
            <div
              className="absolute top-1/2 left-[53.33%] -translate-x-1/2 -translate-y-1/2"
              title="คะแนน 80"
            >
              <span className="inline-block px-3 py-1 rounded-full bg-gray-200 text-blue-600 font-bold text-sm shadow-sm whitespace-nowrap">
                80
              </span>
            </div>
            {/* วงรีที่ 118 */}
            <div
              className="absolute top-1/2 left-[78.67%] -translate-x-1/2 -translate-y-1/2"
              title="คะแนน 118"
            >
              <span className="inline-block px-3 py-1 rounded-full bg-[#D97757] text-white font-bold text-sm shadow-sm whitespace-nowrap">
                118
              </span>
            </div>
          </div>

          {/* ตัวเลข 0 กับ 150 ใต้แถบ */}
          <div className="flex justify-between text-[10px] sm:text-xs font-bold text-text-secondary px-0.5">
            <span>0</span>
            <span>150</span>
          </div>
        </div>

        {/* Your score highlight */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 py-3 sm:py-4">
          <span className="text-text-secondary font-medium text-sm sm:text-base shrink-0">คะแนนรวมของคุณ</span>
          <span className="text-3xl sm:text-4xl font-black tabular-nums tracking-wider text-text-primary-light whitespace-nowrap px-1" aria-label={`คะแนน ${calculateScore.total}`}>{calculateScore.total}</span>
          <span
            className={`px-2.5 sm:px-3 py-1 rounded-full font-bold text-xs sm:text-sm text-white shrink-0 ${
              scoreCategory.key === 'red'
                ? 'bg-red-500'
                : scoreCategory.key === 'orange'
                  ? 'bg-[#D97757]'
                  : 'bg-green-500'
            }`}
          >
            {scoreCategory.label}
          </span>
        </div>

        {/* คะแนนแยกตามส่วน */}
        <div className="pt-4 sm:pt-6 border-t border-border-light">
          <h3 className="font-bold text-base sm:text-lg text-text-primary-light mb-3 sm:mb-4">คะแนนแยกตามส่วน (ลักษณะบุคลิกภาพ)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
            {calculateScore.bySection.map((sec) => (
              <div key={sec.key} className="flex items-center justify-between p-3 sm:p-4 bg-bubble-user-light rounded-lg sm:rounded-xl border border-border-light min-h-[44px]">
                <span className="text-xs sm:text-sm font-medium text-text-primary-light truncate pr-2">{sec.label}</span>
                <span className="text-base sm:text-lg font-bold text-text-primary-light tabular-nums shrink-0">{sec.total}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Personal info & open-ended answers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="p-4 sm:p-6 bg-surface-light rounded-xl sm:rounded-2xl border border-border-light space-y-3 sm:space-y-4">
          <h3 className="font-bold text-lg sm:text-xl text-text-primary-light flex items-center gap-2">
            <User className="w-4 h-4 sm:w-5 sm:h-5 text-[#D97757] shrink-0" />
            ข้อมูลส่วนตัว
          </h3>
          <dl className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
            <div className="flex justify-between gap-2 sm:gap-4">
              <dt className="text-text-secondary shrink-0">ชื่อ-นามสกุล</dt>
              <dd className="font-semibold text-text-primary-light text-right break-all">{formData.personal['ชื่อ-นามสกุล'] || '-'}</dd>
            </div>
            <div className="flex justify-between gap-2 sm:gap-4">
              <dt className="text-text-secondary shrink-0">หมายเลขโทรศัพท์</dt>
              <dd className="font-semibold text-text-primary-light text-right break-all">{formData.personal['หมายเลขโทรศัพท์'] || '-'}</dd>
            </div>
            <div className="flex justify-between gap-2 sm:gap-4">
              <dt className="text-text-secondary shrink-0">อายุ</dt>
              <dd className="font-semibold text-text-primary-light text-right">{formData.personal['อายุ'] || '-'}</dd>
            </div>
            <div className="flex justify-between gap-2 sm:gap-4">
              <dt className="text-text-secondary shrink-0">Email</dt>
              <dd className="font-semibold text-text-primary-light text-right break-all">{formData.personal['Email Address'] || '-'}</dd>
            </div>
            <div className="flex justify-between gap-2 sm:gap-4">
              <dt className="text-text-secondary shrink-0">สถานภาพสมรส</dt>
              <dd className="font-semibold text-text-primary-light text-right">{formData.personal.maritalStatus || '-'}</dd>
            </div>
          </dl>
        </div>

        <div className="p-4 sm:p-6 bg-surface-light rounded-xl sm:rounded-2xl border border-border-light space-y-3 sm:space-y-4">
          <h3 className="font-bold text-lg sm:text-xl text-text-primary-light flex items-center gap-2">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-[#D97757] shrink-0" />
            ประสบการณ์และทัศนคติ
          </h3>
          <div className="space-y-3 sm:space-y-4 text-xs sm:text-sm">
            {[
              {
                id: 'interest',
                q: 'ความสนใจ / งานอดิเรก ของคุณคืออะไร?',
              },
              {
                id: 'roleModel',
                q: 'บุคคลที่คุณให้ความเคารพมากที่สุดคือใคร? เพราะอะไร?',
              },
              {
                id: 'hardestDecision',
                q: 'ในการทำงานที่ผ่านมา คุณเคยตัดสินใจเรื่องใดที่คุณคิดว่ายากที่สุด? และส่งผลอย่างไร?',
              },
              {
                id: 'failure',
                q: 'คุณเคยเผชิญกับความล้มเหลวร้ายแรงในชีวิตการทำงานหรือไม่? แล้วคุณรับมือกับเรื่องนั้นอย่างไร?',
              },
              {
                id: 'honesty',
                q: 'ในการทำงานที่ผ่านมา คุณเคยถูกทดสอบความซื่อสัตย์ สุจริต บ้างหรือไม่? แล้วคุณรับมืออย่างไร?',
              },
              {
                id: 'protectClient',
                q: 'คนทุกคนย่อมต้องได้รับการคุ้มครองดูแลผลประโยชน์ส่วนตัว คุณจะมีวิธีดูแลผลประโยชน์ให้ลูกค้าอย่างไร?',
              },
              {
                id: 'relationship',
                q: 'คุณจะสร้างความสัมพันธ์กับลูกค้าในระยะยาวได้อย่างไรบ้าง?',
              },
            ].map((item) => (
              <div key={item.id} className="space-y-1 sm:space-y-1.5">
                <div className="font-semibold text-text-primary-light text-xs sm:text-sm leading-snug">{item.q}</div>
                <div className="rounded-lg sm:rounded-xl bg-bubble-user-light border border-border-light px-2.5 sm:px-3 py-2 text-text-primary-light min-h-[44px] whitespace-pre-wrap break-words">
                  {formData.openEnded[item.id] || 'ยังไม่ได้ระบุคำตอบ'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={shareSummaryToLine}
          className="min-h-[44px] mt-2 px-5 sm:px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md touch-manipulation bg-[#D97757] text-white hover:bg-[#E8845C] active:bg-[#C4623F]"
          title="เปิด LINE เพื่อแชร์สรุปคำตอบ (ไม่ต้องตั้งค่า token)"
        >
          แชร์ส่งคำตอบไปที่ LINE
        </button>
        <p className="text-[10px] text-text-secondary text-center max-w-xs">กดแล้วจะเปิด LINE ให้เลือกผู้รับส่งได้ทันที</p>
      </div>

      <div className="bg-bg-dark p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl text-center text-text-primary-dark space-y-3 sm:space-y-4">
        <h4 className="text-base sm:text-lg font-bold">บันทึกข้อมูลเรียบร้อยแล้ว</h4>
        <p className="text-text-secondary text-xs sm:text-sm max-w-md mx-auto italic">ข้อมูลทัศนคติเบื้องต้นนี้จะถูกส่งไปยังฝ่ายบริหารงานบุคคล เพื่อใช้ประกอบการพิจารณาคัดเลือกพนักงานใหม่ในลำดับต่อไป</p>
        <button
          onClick={() => window.location.reload()}
          className="min-h-[44px] mt-3 sm:mt-4 px-6 sm:px-8 py-2.5 sm:py-3 bg-surface-light text-text-primary-light rounded-xl font-bold hover:bg-bubble-user-light transition-all active:scale-95 shadow-xl text-sm sm:text-base touch-manipulation"
        >
          กลับไปเริ่มต้นใหม่
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-light py-4 px-3 sm:py-6 sm:px-4 md:py-10 md:px-4 font-sans">
      <div className="max-w-4xl mx-auto bg-surface-light rounded-2xl sm:rounded-3xl shadow-2xl shadow-border-light/50 border border-border-light overflow-hidden">
        {/* Progress Line */}
        {step > 0 && step < 3 && (
          <div className="w-full bg-[#D97757]/20 h-1.5 sm:h-2 flex">
            <div
              className="bg-[#D97757] h-full transition-all duration-1000 ease-in-out"
              style={{ width: `${(step / 2) * 100}%` }}
            />
          </div>
        )}

        <div className="p-4 sm:p-6 md:p-8 lg:p-16">
          {step === 0 && renderWelcome()}
          {step === 1 && renderPart1()}
          {step === 2 && renderPart2()}
          {step === 3 && renderSuccess()}
        </div>
      </div>
    </div>
  );
};

export default App;
