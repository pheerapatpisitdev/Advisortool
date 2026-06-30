/* Advisortool — shared global header. Injects markup + wires interactions.
   Single source of truth for the cross-tool nav menu.
   Include once per tool page, as the first element inside <body>:
     <link rel="stylesheet" href="../assets/global-header.css" />
     <script src="../assets/global-header.js"></script>
*/
(function () {
  // Single source of truth for the cross-tool menu (paths relative to a tool folder).
  var TOOLS = [
    ['../lifeready/',        'ไลฟ์เรดดี้ Life Ready — ประกันชีวิตตลอดชีพ'],
    ['../global-saving/',    'Global Saving Plus 15/8'],
    ['../ihealthy/',         'iHealthy Ultra'],
    ['../ci123/',            'CI 123 ประกันโรคร้ายแรง'],
    ['../ishield/',          'iShield — ประกันโรคร้ายแรงตลอดชีพ'],
    ['../group-insurance/',  'ประกันกลุ่ม Group Insurance'],
    ['../fhc/',              'FHC — แบบสอบถามคุณภาพชีวิต'],
    ['../career-agent/',     'Career-Agent-Question'],
    ['../agency/',           'Agency Blueprint']
  ];

  var ICON_HOME = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>';
  var ICON_MENU = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';
  var ICON_CHEV = '<svg class="az-gh__chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>';
  var ICON_USER = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
  var ICON_CHECK = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  var links = TOOLS.map(function (t) {
    return '<a href="' + esc(t[0]) + '" role="menuitem"><span class="az-gh__dot"></span>' + esc(t[1]) + '</a>';
  }).join('');

  var header = document.createElement('header');
  header.className = 'az-gh';
  header.setAttribute('data-az-global-header', '');
  header.innerHTML =
    '<div class="az-gh__left">' +
      '<a href="../" class="az-gh__home" aria-label="หน้าแรก">' + ICON_HOME + '</a>' +
      '<a href="../" class="az-gh__brand">Advisortool</a>' +
    '</div>' +
    '<div class="az-gh__right">' +
      '<div class="az-gh__menu" id="azGh">' +
        '<button class="az-gh__btn" type="button" aria-haspopup="true" aria-expanded="false">' + ICON_MENU + '<span>เครื่องมือ</span>' + ICON_CHEV + '</button>' +
        '<div class="az-gh__panel" role="menu">' + links + '</div>' +
      '</div>' +
      '<span class="az-gh__avatar" aria-label="โปรไฟล์">' + ICON_USER + '<span class="az-gh__check">' + ICON_CHECK + '</span></span>' +
    '</div>';

  // Insert as the first element of <body> so it stays pinned at the top.
  var body = document.body;
  if (body.firstChild) { body.insertBefore(header, body.firstChild); }
  else { body.appendChild(header); }

  var menu = header.querySelector('#azGh');
  var btn = menu.querySelector('.az-gh__btn');
  var items = [].slice.call(menu.querySelectorAll('.az-gh__panel a'));

  function close() { menu.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }
  function open() { menu.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); }

  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    if (menu.classList.contains('open')) { close(); }
    else { open(); if (items[0]) items[0].focus(); }
  });
  document.addEventListener('click', function (e) { if (!menu.contains(e.target)) close(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { close(); btn.focus(); }
  });
  // Roving arrow-key navigation within the menu.
  menu.addEventListener('keydown', function (e) {
    if (!menu.classList.contains('open')) return;
    var i = items.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); (items[i + 1] || items[0]).focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); (items[i - 1] || items[items.length - 1]).focus(); }
  });
})();
