const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

/**
 * แปลง DOM element เป็นเอกสาร jsPDF ขนาด A4
 * รองรับเนื้อหายาวหลายหน้าด้วยการ slice ภาพตามความสูงหน้า
 * โหลด jspdf/html2canvas แบบ dynamic เพื่อไม่ถ่วงโหลดหน้าแรก
 * @param {HTMLElement} el
 * @returns {Promise<import('jspdf').jsPDF>}
 */
export async function buildPdfFromElement(el) {
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
  ]);

  const canvas = await html2canvas(el, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
    logging: false,
  });

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // ความสูงของภาพเมื่อปรับให้กว้างเท่าหน้า A4
  const imgHeightMM = (canvas.height * A4_WIDTH_MM) / canvas.width;

  if (imgHeightMM <= A4_HEIGHT_MM) {
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    doc.addImage(imgData, 'JPEG', 0, 0, A4_WIDTH_MM, imgHeightMM);
    return doc;
  }

  // เนื้อหายาวเกิน 1 หน้า — slice เป็นหลายหน้า
  const pageHeightPx = (A4_HEIGHT_MM * canvas.width) / A4_WIDTH_MM;
  let renderedPx = 0;
  let pageIndex = 0;

  while (renderedPx < canvas.height) {
    const sliceHeightPx = Math.min(pageHeightPx, canvas.height - renderedPx);

    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = canvas.width;
    pageCanvas.height = sliceHeightPx;
    const ctx = pageCanvas.getContext('2d');
    ctx.drawImage(
      canvas,
      0, renderedPx, canvas.width, sliceHeightPx,
      0, 0, canvas.width, sliceHeightPx
    );

    const sliceHeightMM = (sliceHeightPx * A4_WIDTH_MM) / canvas.width;
    const imgData = pageCanvas.toDataURL('image/jpeg', 0.95);
    if (pageIndex > 0) doc.addPage();
    doc.addImage(imgData, 'JPEG', 0, 0, A4_WIDTH_MM, sliceHeightMM);

    renderedPx += sliceHeightPx;
    pageIndex += 1;
  }

  return doc;
}

/** เปิดดู PDF ในแท็บใหม่ */
export async function viewPdf(el) {
  const doc = await buildPdfFromElement(el);
  window.open(doc.output('bloburl'), '_blank', 'noopener,noreferrer');
}

/** ดาวน์โหลด PDF เป็นไฟล์ */
export async function downloadPdf(el, filename) {
  const doc = await buildPdfFromElement(el);
  doc.save(filename);
}

/** เปิด PDF แล้วสั่งพิมพ์ */
export async function printPdf(el) {
  const doc = await buildPdfFromElement(el);
  doc.autoPrint();
  window.open(doc.output('bloburl'), '_blank', 'noopener,noreferrer');
}
