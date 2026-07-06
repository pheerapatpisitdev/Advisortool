/* Advisortool — shared global header. Injects markup + wires interactions.
   Single source of truth for the shared top bar + print helper.
   Include once per tool page, as the first element inside <body>:
     <link rel="stylesheet" href="../assets/global-header.css" />
     <script src="../assets/global-header.js"></script>
*/
(function () {
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

  var header = document.createElement('header');
  header.className = 'az-gh';
  header.setAttribute('data-az-global-header', '');
  header.innerHTML =
    '<div class="az-gh__left">' +
      '<a href="../" class="az-gh__home" aria-label="หน้าแรก">A</a>' +
      '<a href="../" class="az-gh__brand">Advisor<b>tool</b></a>' +
    '</div>' +
    '<div class="az-gh__right">' +
      '<span class="az-gh__badge" aria-label="เข้าสู่ระบบแล้ว">' + ICON_CHECK + '</span>' +
    '</div>';

  // Insert as the first element of <body> so it stays pinned at the top.
  var body = document.body;
  if (body.firstChild) { body.insertBefore(header, body.firstChild); }
  else { body.appendChild(header); }
})();
