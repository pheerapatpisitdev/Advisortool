/* Advisortool — shared global header. Injects markup + wires interactions.
   Single source of truth for the shared top bar + print helper.
   Include once per tool page, as the first element inside <body>:
     <link rel="stylesheet" href="../assets/global-header.css" />
     <script src="../assets/global-header.js"></script>
*/
(function () {
  var headerScript = document.currentScript;
  var BRAND_ASSET_VERSION = '20260719-2';

  function brandAssetUrl(fileName) {
    if (fileName === 'advisortool-mark.png' && window.AZ_BRAND_MARK_URL) {
      return window.AZ_BRAND_MARK_URL;
    }
    if (fileName === 'advisortool-wordmark.png' && window.AZ_BRAND_WORDMARK_URL) {
      return window.AZ_BRAND_WORDMARK_URL;
    }
    if (headerScript && headerScript.src) {
      var assetUrl = new URL(fileName, headerScript.src);
      assetUrl.searchParams.set('v', BRAND_ASSET_VERSION);
      return assetUrl.href;
    }
    var fallbackUrl = new URL('../assets/' + fileName, window.location.href);
    fallbackUrl.searchParams.set('v', BRAND_ASSET_VERSION);
    return fallbackUrl.href;
  }

  function homeUrl() {
    if (headerScript && headerScript.src) {
      return new URL('../', headerScript.src).href;
    }
    return '../';
  }

  // Shared print helper for every tool. iOS/iPadOS cannot print from a page launched
  // via "Add to Home Screen" (standalone web-app mode) — window.print() is a silent
  // no-op there. Detect it and guide the user to open in Safari; otherwise defer the
  // call one task so Safari reliably opens the print/AirPrint sheet (it drops a
  // window.print() fired synchronously inside a click handler).
  window.azPrint = function () {
    var standalone = (window.navigator.standalone === true) ||
      (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
    if (standalone) {
      alert('พิมพ์ / บันทึก PDF ไม่ได้เมื่อเปิดจากไอคอนบนหน้าจอโฮม\n\n' +
        'กรุณาเปิดหน้านี้ในแอป Safari (แตะแถบที่อยู่แล้วเปิดใน Safari) แล้วกดปุ่มพิมพ์อีกครั้ง — ' +
        'หรือใช้ปุ่มแชร์ของ Safari แล้วเลือก “พิมพ์” / “บันทึกไปยังไฟล์”');
      return;
    }
    setTimeout(function () { try { window.print(); } catch (e) {} }, 0);
  };

  var ICON_CHECK = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
  var ICON_INFO = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>';

  var PRODUCT_NOTE = 'เครื่องมือนี้ใช้คำนวณและประกอบการนำเสนอเบื้องต้น ไม่ใช่ใบเสนอราคา ไม่ใช่ส่วนหนึ่งของสัญญาประกันภัย และไม่รับรองว่าอัตรายังมีผลในวันที่ใช้งาน โปรดตรวจสอบเอกสารผลิตภัณฑ์ อัตรา เงื่อนไข ความคุ้มครอง ข้อยกเว้น และหลักเกณฑ์ภาษีฉบับล่าสุดจากแหล่งทางการก่อนนำเสนอทุกครั้ง';
  var ADVISORY_NOTE = 'ผลลัพธ์เป็นการคำนวณหรือแบบประเมินเบื้องต้นจากข้อมูลที่กรอก ไม่ใช่คำแนะนำทางการเงิน ภาษี กฎหมาย หรือการรับรองคุณสมบัติ ผู้ใช้ควรตรวจสอบสมมติฐานและใช้วิจารณญาณก่อนนำผลไปใช้';
  var META_REVIEWED = 'ตรวจสถานะโปรแกรม 4 ส.ค. 2569 (ไม่ใช่วันที่รับรองอัตราผลิตภัณฑ์)';
  var TOOL_METADATA = {
    'life-treasure': { title: 'LifeTreasure', version: 'A2026-1 (ตามข้อความในหน้า)', source: 'ตารางอัตราและสูตรที่ฝังใน life-treasure/index.html; ไม่มีเอกสารต้นทางทางการอยู่ใน deploy ปัจจุบัน', note: PRODUCT_NOTE },
    '12pl': { title: '12PL', version: 'A2026-1 (ตาม metadata ในหน้า)', source: 'ตารางอัตราและสูตรที่ฝังใน 12pl/index.html; code ระบุว่าแปลงจาก workbook แต่ไฟล์ต้นทางไม่อยู่ใน deploy ปัจจุบัน', note: PRODUCT_NOTE },
    'easy-protect6': { title: 'Easy Protect 6', version: 'ไม่พบ version ในไฟล์ข้อมูล', source: 'easy-protect6/source/data/easy-protect-rates.json และ rider-rates.json; ต้องยืนยัน version/วันที่มีผลกับเจ้าของผลิตภัณฑ์', note: PRODUCT_NOTE },
    'lifeready': { title: 'Life Ready', version: 'A2026-1 (ตาม README/หน้า)', source: 'lifeready/data/premium.json และ cashvalue.json; README ระบุว่าถอดจาก workbook ซึ่งไม่ได้อยู่ใน deploy ปัจจุบัน', note: PRODUCT_NOTE },
    'ismart80-6': { title: 'iSmart 80/6', version: 'A2026-1', source: 'ismart80-6/source workbook, data/*.json และ groundtruth.json; มี validation เทียบ ground truth บางกรณี', note: PRODUCT_NOTE },
    'global-saving': { title: 'Global Saving Plus 15/8', version: 'ไม่ระบุวันที่มีผลใน data.js', source: 'global-saving/data.js และ factsheet data ในหน้า; มีลิงก์ไปหน้าผลการดำเนินงานของผู้ให้บริการสำหรับตรวจข้อมูลล่าสุด', note: PRODUCT_NOTE },
    'pension-smart95': { title: 'บำนาญ สมาร์ท 95', version: 'A2026-1', source: 'pension-smart95/data/db.json, data/tables และ test/oracle; มี automated verification ของ engine', note: PRODUCT_NOTE },
    'ihealthy': { title: 'iHealthy Ultra', version: 'ไม่ระบุวันที่มีผลใน data.js', source: 'ihealthy/data.js ซึ่งรวม premium/plan/benefit tables ที่แปลงจาก source เดิม; ต้องเทียบเอกสารผลิตภัณฑ์ล่าสุด', note: PRODUCT_NOTE },
    'ci123': { title: 'CI 123', version: 'ไม่ระบุวันที่มีผลใน data.js', source: 'ci123/data.js (premium table และรายการโรคที่แปลงจาก source เดิม); ต้องเทียบเอกสารผลิตภัณฑ์ล่าสุด', note: PRODUCT_NOTE },
    'ishield': { title: 'iShield', version: 'A2026-1 (ตามหน้า)', source: 'ตารางอัตรา/มูลค่าที่ฝังใน ishield/index.html; ไม่มีเอกสารต้นทางทางการอยู่ใน deploy ปัจจุบัน', note: PRODUCT_NOTE },
    'group-insurance': { title: 'Group Insurance', version: 'ไม่ระบุวันที่มีผลใน data.js', source: 'group-insurance/data.js และ translations.js ที่แปลงจาก source เดิม; ต้องยืนยันเรต/เงื่อนไขกับเอกสารล่าสุด', note: PRODUCT_NOTE },
    'fhc': { title: 'FHC', version: 'ไม่มี version ของแบบประเมินระบุในหน้า', source: 'สูตรและข้อความฝังใน fhc/index.html; ไม่มี authoritative methodology document ใน repo', note: ADVISORY_NOTE },
    'career-agent': { title: 'Career-Agent-Question', version: 'ไม่มี version ของแบบสอบถามระบุในหน้า', source: 'คำถาม 30 ข้อและเกณฑ์คะแนนฝังใน career-agent/index.html; ไม่มี authoritative methodology document ใน repo', note: ADVISORY_NOTE },
    'agency': { title: 'Agency Blueprint', version: 'ไม่มี version ตารางผลตอบแทนระบุใน source', source: 'สูตร/ตารางฝังใน agency/agency.js และหน้าเครื่องมือย่อย; ต้องให้เจ้าของยืนยันเกณฑ์ปัจจุบัน', note: ADVISORY_NOTE }
  };

  function esc(value) {
    return String(value).replace(/[&<>\"]/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char];
    });
  }

  function currentMetadata() {
    var segments = window.location.pathname.split('/').filter(Boolean);
    for (var i = segments.length - 1; i >= 0; i--) {
      if (TOOL_METADATA[segments[i]]) return TOOL_METADATA[segments[i]];
    }
    return null;
  }

  var header = document.createElement('header');
  header.className = 'az-gh';
  header.setAttribute('data-az-global-header', '');
  header.innerHTML =
    '<div class="az-gh__left">' +
      '<a href="' + homeUrl() + '" class="az-gh__home" aria-label="หน้าแรก Advisortool">' +
        '<img src="' + brandAssetUrl('advisortool-mark.png') + '" alt="" width="44" height="44">' +
      '</a>' +
      '<a href="' + homeUrl() + '" class="az-gh__brand" aria-label="Advisortool">' +
        '<img src="' + brandAssetUrl('advisortool-wordmark.png') + '" alt="Advisortool" width="188" height="36">' +
      '</a>' +
    '</div>' +
    '<div class="az-gh__right">' +
      '<button type="button" class="az-gh__info" aria-label="ข้อมูลแหล่งที่มาและข้อจำกัด" aria-haspopup="dialog">' + ICON_INFO + '</button>' +
      '<span class="az-gh__badge" aria-label="เข้าสู่ระบบแล้ว">' + ICON_CHECK + '</span>' +
    '</div>';

  // Insert as the first element of <body> so it stays pinned at the top.
  var body = document.body;
  if (body.firstChild) { body.insertBefore(header, body.firstChild); }
  else { body.appendChild(header); }

  var metadata = currentMetadata();
  var infoButton = header.querySelector('.az-gh__info');
  if (!metadata) {
    infoButton.hidden = true;
    return;
  }

  var modal = document.createElement('div');
  modal.className = 'az-meta';
  modal.hidden = true;
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'az-meta-title');
  modal.innerHTML =
    '<div class="az-meta__backdrop" data-az-meta-close></div>' +
    '<section class="az-meta__card">' +
      '<button type="button" class="az-meta__close" data-az-meta-close aria-label="ปิด">×</button>' +
      '<p class="az-meta__eyebrow">ข้อมูลเครื่องมือ</p>' +
      '<h2 id="az-meta-title">' + esc(metadata.title) + '</h2>' +
      '<dl>' +
        '<div><dt>รุ่นข้อมูล</dt><dd>' + esc(metadata.version) + '</dd></div>' +
        '<div><dt>หลักฐานในโปรเจกต์</dt><dd>' + esc(metadata.source) + '</dd></div>' +
        '<div><dt>วันที่ตรวจสถานะ</dt><dd>' + esc(META_REVIEWED) + '</dd></div>' +
      '</dl>' +
      '<p class="az-meta__note">' + esc(metadata.note) + '</p>' +
    '</section>';
  body.appendChild(modal);

  function closeMetadata() {
    modal.hidden = true;
    document.documentElement.classList.remove('az-meta-open');
    try { infoButton.focus(); } catch (e) {}
  }
  function openMetadata() {
    modal.hidden = false;
    document.documentElement.classList.add('az-meta-open');
    try { modal.querySelector('.az-meta__close').focus(); } catch (e) {}
  }
  infoButton.addEventListener('click', openMetadata);
  modal.addEventListener('click', function (event) {
    if (event.target && event.target.hasAttribute('data-az-meta-close')) closeMetadata();
  });
  document.addEventListener('keydown', function (event) {
    if (!modal.hidden && event.key === 'Escape') closeMetadata();
  });
})();
