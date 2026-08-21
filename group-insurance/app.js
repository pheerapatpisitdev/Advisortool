/* group-insurance — vanilla port of app/group-insurance/_src */
(function () {
  'use strict';

  var D = window.GI_DATA;
  var TR = window.GI_TRANSLATIONS;

  // ---- colors (from MultiGroupCalculator.jsx / docs) ----
  var GOLD = 'rgba(169, 145, 77, 1)';
  var TEAL = 'rgba(96, 127, 116, 1)';
  var NAVY = 'rgba(41, 45, 120, 1)';

  // ---- i18n ----
  var STORAGE_KEY = 'group-insurance-lang';
  var lang = (function () {
    try { return localStorage.getItem(STORAGE_KEY) || 'th'; } catch (e) { return 'th'; }
  })();
  document.documentElement.lang = lang;
  function setLang(l) {
    lang = (l === 'th') ? 'th' : 'en';
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
    document.documentElement.lang = lang;
    render();
  }
  function t(key) {
    var tbl = TR[lang] || {};
    return (key in tbl) ? tbl[key] : key;
  }
  function locale() { return lang === 'en' ? 'en-US' : 'th-TH'; }
  function fmt(n) { return Number(n).toLocaleString(locale()); }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // ---- premium calc (port of utils/multiGroupQuote.js) ----
  var PRODUCT_LIMITS = { health: { min: 10, max: 100 }, pa: { min: 5, max: 2000 } };

  function getHealthEmployeeRange(count) {
    if (count >= 51) return '51-100';
    if (count >= 26) return '26-50';
    return '10-25';
  }
  function getPaEmployeeRange(count) {
    if (count >= 1000) return '1,000-2,000';
    if (count >= 200) return '200-999';
    if (count >= 100) return '100-199';
    if (count >= 50) return '50-99';
    if (count >= 20) return '20-49';
    return '5-19';
  }
  function getBand(product, totalCount) {
    return product === 'pa' ? getPaEmployeeRange(totalCount) : getHealthEmployeeRange(totalCount);
  }

  function computeMultiGroupQuote(product, groups) {
    var isPa = product === 'pa';
    var totalCount = groups.reduce(function (s, g) { return s + (Number(g.count) || 0); }, 0);
    var band = getBand(product, totalCount);
    var lim = PRODUCT_LIMITS[product];
    var withinLimit = totalCount >= lim.min && totalCount <= lim.max;
    var mainTable = isPa ? D.paMainPremiums : D.healthIpdPremiums;

    var computedGroups = groups.map(function (g) {
      var count = Number(g.count) || 0;
      var mainPremium = (mainTable[g.bizType] && mainTable[g.bizType][band] && mainTable[g.bizType][band][g.planIdx]) || 0;
      var riderPremium = 0;
      if (g.includeRider) {
        if (isPa) {
          riderPremium = (D.paMePremiums[g.bizType] && D.paMePremiums[g.bizType][band] && D.paMePremiums[g.bizType][band][g.riderIdx]) || 0;
        } else {
          riderPremium = (D.healthOpdPremiums[g.bizType] && D.healthOpdPremiums[g.bizType][g.riderIdx]) || 0; // OPD ไม่ขึ้นกับ band
        }
      }
      var perPerson = mainPremium + riderPremium;
      var subtotal = perPerson * count;
      var out = {};
      for (var k in g) out[k] = g[k];
      out.count = count; out.mainPremium = mainPremium; out.riderPremium = riderPremium;
      out.perPerson = perPerson; out.subtotal = subtotal;
      return out;
    });

    var grandTotal = computedGroups.reduce(function (s, g) { return s + g.subtotal; }, 0);
    return { product: product, totalCount: totalCount, band: band, withinLimit: withinLimit, min: lim.min, max: lim.max, groups: computedGroups, grandTotal: grandTotal };
  }

  // ===================== STATE =====================
  var groupSeq = 0;
  function makeGroup(product) {
    groupSeq += 1;
    return {
      id: 'g' + groupSeq, name: '', bizType: 'biz1', planIdx: 0,
      includeRider: true, riderIdx: 0, count: product === 'pa' ? '5' : '10',
    };
  }

  var state = {
    currentPage: 'health',    // health | accident | businessType
    sidebarOpen: false,
    // calculators keyed by page
    health: { groups: [makeGroup('health')] },
    pa: { groups: [makeGroup('pa')] },
    bizSearch: '',
    bizLimit: 60,          // #5/#6: render a slice, not all 1,099 rows
    quote: { open: false, product: null, customerName: '', quoteNo: '', quoteDate: '' },
    donateOpen: false,
  };

  // ===================== ICONS (lucide inline) =====================
  function icon(name, cls) {
    cls = cls || 'w-5 h-5';
    var paths = {
      Building2: '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>',
      ShieldAlert: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="M12 8v4"/><path d="M12 16h.01"/>',
      Briefcase: '<rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
      ExternalLink: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
      Menu: '<line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>',
      X: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
      Users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
      Plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
      Trash2: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>',
      ChevronDown: '<path d="m6 9 6 6 6-6"/>',
      FileText: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
      Send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
      AlertTriangle: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
      Info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
      Search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
      Download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
      Eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
      Printer: '<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/>',
    };
    // every icon here sits next to a text label or an aria-label'd button, so it is
    // decorative: hide it from the a11y tree and keep it out of the tab order.
    return '<svg xmlns="http://www.w3.org/2000/svg" class="' + cls + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + (paths[name] || '') + '</svg>';
  }

  // ===================== PAGE CONFIG =====================
  var PAGES = [
    { key: 'health', titleKey: 'pageHealth', descKey: 'pageHealthDesc', iconName: 'Building2' },
    { key: 'accident', titleKey: 'pageAccident', descKey: 'pageAccidentDesc', iconName: 'ShieldAlert' },
    { key: 'businessType', titleKey: 'pageBusinessType', descKey: 'pageBusinessTypeDesc', iconName: 'Briefcase' },
  ];
  var EXTERNAL_LINKS = [
    { key: 'dbd', titleKey: 'linkDbd', descKey: 'linkDbdDesc', iconName: 'ExternalLink', href: 'https://datawarehouse.dbd.go.th/' },
  ];

  var BIZ_LABELS = { biz1: 'biz1Label', biz2: 'biz2Label', biz3: 'biz3Label' };
  var PA_BIZ_LABELS = { biz1: 'paBiz1Label', biz2: 'paBiz2Label', biz3: 'paBiz3Label' };

  // ===================== CALCULATOR helpers =====================
  function calcKey(page) { return page === 'accident' ? 'pa' : 'health'; }
  function productOf(page) { return page === 'accident' ? 'pa' : 'health'; }

  function buildBenefitMatrix(product, resultGroups, anyRider) {
    var isPa = product === 'pa';
    var rows = [];
    if (isPa) {
      D.paMainBenefits.forEach(function (b) {
        rows.push({ label: t(b.key), values: resultGroups.map(function (g) { return b.values[g.planIdx]; }) });
      });
      if (anyRider) {
        rows.push({ label: t('meSelected'), values: resultGroups.map(function (g) { return g.includeRider ? D.paMeCoverLevels[g.riderIdx] : '—'; }) });
      }
    } else {
      D.healthBenefits.filter(function (b) { return b.key !== 'hOpdPerVisit'; }).forEach(function (b) {
        rows.push({ label: t(b.key), values: resultGroups.map(function (g) { return b.values[g.planIdx]; }) });
      });
      if (anyRider) {
        var opd = D.healthBenefits.filter(function (b) { return b.key === 'hOpdPerVisit'; })[0];
        rows.push({ label: t('hOpdPerVisit'), values: resultGroups.map(function (g) { return g.includeRider ? opd.values[g.riderIdx] : '—'; }) });
      }
    }
    return rows;
  }

  function quoteContext(product) {
    var isPa = product === 'pa';
    var groups = state[isPa ? 'pa' : 'health'].groups;
    var result = computeMultiGroupQuote(product, groups);
    var bizLabels = isPa ? PA_BIZ_LABELS : BIZ_LABELS;
    var anyRider = result.groups.some(function (g) { return g.includeRider; });

    function planLabelOf(g) { return isPa ? ('P' + (g.planIdx + 1)) : (t('plan') + ' ' + (g.planIdx + 1)); }
    function riderTextOf(g) {
      if (!g.includeRider) return '';
      return isPa ? ('ME ' + D.paMeCoverLevels[g.riderIdx]) : ('OPD ' + t('plan') + ' ' + (g.riderIdx + 1));
    }

    var groupCols = result.groups.map(function (cg, i) {
      return {
        no: i + 1, name: cg.name, bizTypeLabel: t(bizLabels[cg.bizType]),
        planLabel: planLabelOf(cg), riderText: riderTextOf(cg), count: cg.count,
        includeRider: cg.includeRider, mainPremium: cg.mainPremium, riderPremium: cg.riderPremium,
        perPerson: cg.perPerson, subtotal: cg.subtotal,
      };
    });
    var benefitMatrix = buildBenefitMatrix(product, result.groups, anyRider);

    return {
      isPa: isPa, result: result, bizLabels: bizLabels, anyRider: anyRider,
      planLabelOf: planLabelOf, riderTextOf: riderTextOf,
      groupCols: groupCols, benefitMatrix: benefitMatrix,
      mainLabel: isPa ? t('mainPremium') : t('ipdPremium'),
      riderLabel: isPa ? t('mePremium') : t('opdPremium'),
      riderToggleLabel: isPa ? t('mePlan') : t('opdPlan'),
      riderMaxNote: isPa ? t('meMaxOne') : t('opdMaxOne'),
      productLabel: t(isPa ? 'productPa' : 'productHealth'),
    };
  }

  // ===================== RENDER: SIDEBAR =====================
  function renderSidebar() {
    var navBtns = PAGES.map(function (page) {
      var isActive = state.currentPage === page.key;
      return '' +
        '<button type="button" data-nav="' + page.key + '"' + (isActive ? ' aria-current="page"' : '') + ' class="w-full flex items-center gap-3 px-4 py-3.5 rounded-lg text-left transition-all duration-200 mb-1.5 ' +
        (isActive ? "bg-teal-600/80 text-white border-l-4 border-teal-400" : "text-teal-100 hover:bg-teal-700/50 hover:text-white border-l-4 border-transparent") + '">' +
        '<span class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ' + (isActive ? 'bg-teal-500 text-white' : 'bg-teal-700/60 text-teal-200') + '">' + icon(page.iconName, 'w-5 h-5') + '</span>' +
        '<div class="flex flex-col items-start min-w-0 flex-1">' +
        '<span class="font-semibold text-[15px] break-words">' + esc(t(page.titleKey)) + '</span>' +
        '<span class="text-xs break-words ' + (isActive ? 'text-teal-100' : 'text-teal-200') + '">' + esc(t(page.descKey)) + '</span>' +
        '</div></button>';
    }).join('');

    var linkBtns = EXTERNAL_LINKS.map(function (link) {
      return '' +
        '<a href="' + link.href + '" target="_blank" rel="noopener noreferrer" data-closesidebar="1" class="w-full flex items-center gap-3 px-4 py-3.5 rounded-lg text-left transition-all duration-200 mb-1.5 text-teal-100 hover:bg-teal-700/50 hover:text-white border-l-4 border-transparent">' +
        '<span class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-teal-700/60 text-teal-200">' + icon(link.iconName, 'w-5 h-5') + '</span>' +
        '<div class="flex flex-col items-start min-w-0 flex-1">' +
        '<span class="font-semibold text-[15px] break-words">' + esc(t(link.titleKey)) + '</span>' +
        '<span class="text-xs break-words text-teal-200">' + esc(t(link.descKey)) + '</span>' +
        '</div></a>';
    }).join('');

    return '' +
      (!state.sidebarOpen ? '<button type="button" data-opensidebar="1" class="lg:hidden fixed top-4 left-4 z-[200] w-12 h-12 rounded-lg bg-teal-700 text-white flex items-center justify-center shadow-lg border border-teal-600" aria-label="' + esc(t('openMenu')) + '">' + icon('Menu', 'w-6 h-6') + '</button>' : '') +
      '<div data-closesidebar="1" class="lg:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[90] transition-opacity ' + (state.sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none') + '"></div>' +
      '<aside class="fixed top-0 left-0 w-72 h-screen flex flex-col z-[100] transition-transform duration-300 ease-out lg:translate-x-0 ' + (state.sidebarOpen ? 'translate-x-0' : '-translate-x-full') + '">' +
      '<div class="h-full flex flex-col bg-teal-800 text-white shadow-xl">' +
      '<div class="relative p-6 border-b" style="border-bottom-color: rgba(95, 127, 116, 0.8); background-color: rgba(42, 71, 61, 1);">' +
      '<div class="flex items-center gap-3 pr-10">' +
      '<img src="../assets/advisortool-wordmark-v3.svg?v=20260810-logo-v3" alt="Advisortool" class="w-12 h-12 rounded-lg object-cover shadow-sm flex-shrink-0" />' +
      '<div class="min-w-0"><div class="text-lg font-bold text-white">' + esc(t('groupInsurance')) + '</div>' +
      '<p class="text-xs text-teal-200">' + esc(t('groupInsuranceSystem')) + '</p></div></div>' +
      '<button type="button" data-closesidebar="1" class="lg:hidden absolute top-1/2 right-4 -translate-y-1/2 w-9 h-9 rounded-lg flex items-center justify-center text-white/80 hover:bg-white/10" aria-label="' + esc(t('close')) + '">' + icon('X', 'w-5 h-5') + '</button>' +
      '</div>' +
      '<nav class="flex-1 py-3 pl-3 pr-5 overflow-y-auto overflow-x-hidden" style="background-color: rgba(42, 71, 61, 1); scrollbar-gutter: stable;">' + navBtns + linkBtns + '</nav>' +
      '<div class="p-4 border-t border-teal-700/80"><p class="text-[11px] text-teal-200 text-center">' + esc(t('copyright')) + '</p></div>' +
      '</div></aside>';
  }

  // ===================== RENDER: language toggle =====================
  function renderLangToggle() {
    return '' +
      '<div class="flex justify-end mb-4"><div class="flex rounded-lg border border-slate-200 overflow-hidden bg-slate-50">' +
      '<button type="button" data-lang="th" aria-pressed="' + (lang === 'th') + '" lang="th" class="px-4 py-1.5 text-sm font-medium transition-colors ' + (lang === 'th' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100') + '">TH</button>' +
      '<button type="button" data-lang="en" aria-pressed="' + (lang === 'en') + '" lang="en" class="px-4 py-1.5 text-sm font-medium transition-colors ' + (lang === 'en' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100') + '">EN</button>' +
      '</div></div>';
  }

  // ===================== RENDER: multi-group calculator =====================
  function renderCalculator(product) {
    var ctx = quoteContext(product);
    var isPa = ctx.isPa;
    var groups = state[isPa ? 'pa' : 'health'].groups;
    var result = ctx.result;
    var computedById = {};
    result.groups.forEach(function (g) { computedById[g.id] = g; });
    var bizTypes = isPa ? D.paBizTypes : D.healthBizTypes;
    var bizLabels = ctx.bizLabels;

    function riderLevelLabel(idx) { return isPa ? D.paMeCoverLevels[idx] : (t('plan') + ' ' + (idx + 1)); }

    var groupsHtml = groups.map(function (g, gi) {
      var cg = computedById[g.id];
      var bizOpts = bizTypes.map(function (b) {
        return '<option value="' + b.value + '"' + (g.bizType === b.value ? ' selected' : '') + '>' + esc(t(bizLabels[b.value])) + '</option>';
      }).join('');

      var planBtns = [0, 1, 2, 3, 4, 5].map(function (idx) {
        var active = g.planIdx === idx;
        return '<button type="button" data-plan="' + idx + '" data-gid="' + g.id + '" class="py-2.5 rounded-xl text-sm font-medium border transition-all ' +
          (active ? 'text-white shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-teal-300') + '"' +
          (active ? ' style="background-color:' + GOLD + ';border-color:' + GOLD + ';"' : '') + '>' + (isPa ? ('P' + (idx + 1)) : (idx + 1)) + '</button>';
      }).join('');

      var riderBtns = '';
      if (g.includeRider) {
        riderBtns = '<div class="grid grid-cols-6 gap-2">' + [0, 1, 2, 3, 4, 5].map(function (idx) {
          var disabled = idx > g.planIdx + 1;
          var active = g.riderIdx === idx;
          var cls = disabled ? 'opacity-40 cursor-not-allowed bg-slate-50 border-slate-100 text-slate-400'
            : (active ? 'text-white shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300');
          return '<button type="button" data-rider="' + idx + '" data-gid="' + g.id + '"' + (disabled ? ' disabled' : '') +
            ' class="py-2.5 rounded-xl text-xs font-medium border transition-all ' + cls + '"' +
            (!disabled && active ? ' style="background-color:' + TEAL + ';border-color:' + TEAL + ';"' : '') + '>' + esc(riderLevelLabel(idx)) + '</button>';
        }).join('') + '</div>';
      }

      return '' +
        '<section class="bg-white rounded-lg shadow-sm border border-slate-200 p-5 animate-slide-up">' +
        '<div class="flex items-center justify-between mb-4 gap-3">' +
        '<div class="flex items-center gap-2.5 min-w-0 flex-1">' +
        '<span class="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0" style="background-color:' + GOLD + ';">' + (gi + 1) + '</span>' +
        '<input type="text" id="gi-name-' + g.id + '" aria-label="' + esc(t('groupNamePlaceholder')) + '" data-field="name" data-gid="' + g.id + '" value="' + esc(g.name) + '" placeholder="' + esc(t('groupNamePlaceholder')) + '" class=""w-full max-w-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-600 transition-all" />' +
        '</div>' +
        (groups.length > 1 ? '<button type="button" data-removegroup="' + g.id + '" class="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg px-3 py-2 transition-colors">' + icon('Trash2', 'w-4 h-4') + ' ' + esc(t('removeGroup')) + '</button>' : '') +
        '</div>' +

        '<div class="grid grid-cols-1 md:grid-cols-2 gap-4">' +
        '<div><label for="gi-biz-' + g.id + '" class="text-sm font-medium text-slate-700 block mb-1.5">' + esc(t('bizType')) + '</label>' +
        '<div class="relative"><select id="gi-biz-' + g.id + '" data-field="bizType" data-gid="' + g.id + '" class="w-full bg-slate-50 border border-slate-200 rounded-lg pl-4 pr-10 py-2.5 text-slate-800 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-600 transition-all">' + bizOpts + '</select>' +
        '<span class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">' + icon('ChevronDown', 'w-5 h-5') + '</span></div></div>' +
        '<div><label for="gi-count-' + g.id + '" class="text-sm font-medium text-slate-700 block mb-1.5">' + esc(t('employeeCountShort')) + ' (' + esc(t('people')) + ')</label>' +
        '<input type="text" id="gi-count-' + g.id + '" inputmode="numeric" pattern="[0-9]*" data-field="count" data-gid="' + g.id + '" value="' + esc(g.count) + '" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-600 transition-all" /></div>' +
        '</div>' +

        '<div class="mt-4"><label class="text-sm font-medium text-slate-700 block mb-2">' + esc(isPa ? t('mainPlan') : t('ipdPlan')) + '</label>' +
        '<div class="grid grid-cols-6 gap-2">' + planBtns + '</div></div>' +

        '<div class="mt-4"><div class="flex items-center justify-between mb-2">' +
        '<label class="text-sm font-medium text-slate-700">' + esc(ctx.riderToggleLabel) + '</label>' +
        '<label class="gi-switch"><input type="checkbox" aria-label="' + esc(ctx.riderToggleLabel) + '" data-toggle-rider="' + g.id + '"' + (g.includeRider ? ' checked' : '') + '/><span class="track"></span></label>' +
        '</div>' + riderBtns +
        '<p class="text-xs text-slate-500 mt-2">' + esc(ctx.riderMaxNote) + '</p></div>' +

        '<div class="mt-4 pt-4 border-t border-slate-100 flex flex-wrap justify-between items-center gap-2 text-sm">' +
        '<span class="text-slate-500">' + esc(t('totalPerPerson')) + ': <span class="font-bold text-slate-800 tabular-nums">' + fmt(cg.perPerson) + '</span> ' + esc(t('baht')) + '</span>' +
        '<span class="font-semibold" style="color:' + NAVY + ';">' + esc(t('groupSubtotal')) + ': <span class="font-bold tabular-nums">' + fmt(cg.subtotal) + '</span> ' + esc(t('baht')) + '</span>' +
        '</div></section>';
    }).join('');

    // benefit table
    var theadCols = ctx.groupCols.map(function (g) {
      return '<th scope="col" class="px-2.5 py-3 font-semibold text-slate-900 text-right align-bottom">' +
        (g.name ? '<div>' + esc(g.name) + '</div>' : '') +
        '<div class="text-[11px] font-medium text-slate-500 mt-0.5">' + esc(g.bizTypeLabel) + '<br/>' + esc(g.planLabel) + '</div></th>';
    }).join('');

    var benefitRows = ctx.benefitMatrix.map(function (row, i) {
      return '<tr class="' + (i % 2 === 0 ? 'bg-white' : 'bg-slate-50/60') + '">' +
        '<th scope="row" class="px-4 py-3 text-slate-600 font-medium text-left sticky left-0 bg-inherit">' + esc(row.label) + '</th>' +
        row.values.map(function (v) { return '<td class="px-2.5 py-3 text-right font-bold text-slate-800 tabular-nums whitespace-nowrap">' + esc(v) + '</td>'; }).join('') +
        '</tr>';
    }).join('');

    var perPersonRow = '<tr class="border-t-2" style="border-color:' + GOLD + ';">' +
      '<td class="px-4 py-3 font-bold sticky left-0 bg-white" style="color:' + NAVY + ';">' + esc(t('totalPerPerson')) + '</td>' +
      ctx.groupCols.map(function (g) { return '<td class="px-2.5 py-3 text-right font-bold tabular-nums whitespace-nowrap" style="color:' + GOLD + ';">' + fmt(g.perPerson) + '</td>'; }).join('') + '</tr>';
    var subtotalRow = '<tr class="bg-slate-50">' +
      '<td class="px-4 py-3 font-bold sticky left-0 bg-slate-50" style="color:' + NAVY + ';">' + esc(t('groupSubtotal')) + '</td>' +
      ctx.groupCols.map(function (g) { return '<td class="px-2.5 py-3 text-right font-bold tabular-nums whitespace-nowrap" style="color:' + NAVY + ';">' + fmt(g.subtotal) + '</td>'; }).join('') + '</tr>';

    var summaryItems = result.groups.map(function (cg, i) {
      return '<div class="flex justify-between gap-2"><span class="text-teal-100 truncate">' + esc(t('groupNo')) + ' ' + (i + 1) + (cg.name ? ' · ' + esc(cg.name) : '') + '</span>' +
        '<span class="text-right font-bold tabular-nums whitespace-nowrap">' + fmt(cg.subtotal) + '</span></div>';
    }).join('');

    var warn = '';
    if (!result.withinLimit) {
      warn = '<div class="mb-4 flex items-start gap-2 rounded-lg bg-amber-400/20 border border-amber-300/40 px-4 py-3 text-amber-100 text-sm">' +
        icon('AlertTriangle', 'w-5 h-5 shrink-0 mt-0.5') +
        '<span>' + esc(t('limitWarningPrefix')) + ' ' + result.min.toLocaleString(locale()) + '–' + result.max.toLocaleString(locale()) + ' ' + esc(t('people')) + ' (' + esc(t('totalPeople')) + ': ' + fmt(result.totalCount) + ')</span></div>';
    }

    return '' +
      '<div class="space-y-4">' + groupsHtml + '</div>' +
      '<button type="button" data-addgroup="1" class="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 text-slate-600 py-3 font-semibold hover:border-teal-400 hover:text-teal-700 transition-colors">' + icon('Plus', 'w-5 h-5') + ' ' + esc(t('addGroup')) + '</button>' +

      '<div class="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mt-6 animate-slide-up">' +
      '<div class="px-6 py-4 flex items-center gap-2.5" style="background-color:' + NAVY + ';">' +
      '<span class="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-teal-100">' + icon('Info', 'w-4 h-4') + '</span>' +
      '<h2 class="font-bold text-white">' + esc(t('benefits')) + '</h2></div>' +
      '<div class="gi-hscroll"><div class="overflow-x-auto" data-hscroll="1"><table class="w-full text-left text-sm">' +
      '<caption class="gi-sr-only">' + esc(t('benefits')) + '</caption>' +
      '<thead><tr class="bg-slate-50 border-b border-slate-200">' +
      '<th scope="col" class="px-4 py-3 font-semibold text-slate-600 sticky left-0 bg-slate-50 min-w-[180px]">' + esc(t('coverage')) + '</th>' + theadCols + '</tr></thead>' +
      '<tbody class="divide-y divide-slate-50">' + benefitRows + perPersonRow + subtotalRow + '</tbody></table></div></div></div>' +

      '<div class="relative rounded-lg overflow-hidden shadow-lg border border-slate-200 mt-6 animate-slide-up">' +
      '<div class="relative p-6 md:p-8" style="color:#fff; background-color:' + NAVY + ';">' +
      warn +
      '<div class="flex flex-col md:flex-row md:items-center justify-between gap-6">' +
      '<div class="space-y-1">' +
      '<p class="text-teal-100 text-sm font-semibold flex items-center gap-2">' + icon('Users', 'w-4 h-4') + ' ' + esc(t('budgetSummary')) + '</p>' +
      '<div class="text-3xl md:text-4xl font-bold tracking-tight text-white">' + fmt(result.grandTotal) + '<span class="text-lg md:text-xl font-medium text-teal-100 ml-1">' + esc(t('perYear')) + '</span></div>' +
      '<p class="text-teal-200 text-sm">' + esc(t('totalPeople')) + ' ' + fmt(result.totalCount) + ' ' + esc(t('people')) + ' · ' + esc(t('bandUsed')) + ' ' + esc(result.band) + '</p>' +
      '</div>' +
      '<div class="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-teal-600/30 w-full md:w-64 shrink-0"><div class="space-y-1.5 text-sm">' + summaryItems + '</div></div>' +
      '</div>' +
      '<div class="mt-6 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 flex-wrap">' +
      '<p class="text-xs text-slate-100">' + esc(t('premiumNote')) + '</p>' +
      '<div class="flex flex-wrap gap-3">' +
      '<button type="button" data-openquote="' + product + '"' + (!result.withinLimit ? ' disabled' : '') + ' class="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 font-semibold text-white shadow-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed" style="background-color:' + GOLD + ';">' + icon('FileText', 'w-4 h-4') + ' ' + esc(t('quoteButton')) + '</button>' +
      '<button type="button" data-shareline="' + product + '"' + (!result.withinLimit ? ' disabled' : '') + ' class="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 font-semibold text-white shadow-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed" style="background-color:#06C755;">' + icon('Send', 'w-4 h-4') + ' ' + esc(t('shareToLine')) + '</button>' +
      '</div></div></div></div>';
  }

  // ===================== RENDER: pages =====================
  function renderHealthPage() {
    var img = lang === 'en' ? 'health-en.png' : 'health.png';
    return '<div class="max-w-5xl mx-auto">' +
      '<header class="mb-8 animate-slide-up"><div class="flex flex-col items-center">' +
      '<div class="w-full max-w-4xl flex justify-center mb-4"><img src="' + img + '" alt="' + esc(lang === 'en' ? 'Group Health Insurance' : 'ประกันสุขภาพกลุ่ม') + '" class="w-full h-auto object-contain" /></div>' +
      '<div class="text-center"><h1 class="text-2xl font-bold text-slate-900 tracking-tight">' + esc(t('healthTitle')) + '</h1>' +
      '<p class="text-slate-500 mt-0.5">' + esc(t('healthSubtitle')) + '</p></div></div></header>' +
      renderCalculator('health') +
      '<footer class="mt-12 text-center text-xs pb-8 text-slate-500"><p>' + esc(t('healthFooter')) + '</p></footer></div>';
  }

  function renderAccidentPage() {
    var img = lang === 'en' ? 'PA-EN.png' : 'PA.png';
    return '<div class="max-w-5xl mx-auto">' +
      '<header class="mb-8 animate-slide-up"><div class="flex flex-col items-center">' +
      '<div class="w-full max-w-4xl flex justify-center mb-4"><img src="' + img + '" alt="' + esc(lang === 'en' ? 'Group PA Package' : 'ประกันอุบัติเหตุ Group PA Package') + '" class="w-full h-auto object-contain" /></div>' +
      '<div class="text-center"><h1 class="text-2xl font-bold text-slate-900 tracking-tight">' + esc(t('paTitle')) + '</h1>' +
      '<p class="text-slate-500 mt-0.5">' + esc(t('paSubtitle')) + '</p></div></div></header>' +
      renderCalculator('pa') +
      // conditions table
      '<div class="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mt-6 animate-slide-up">' +
      '<h2 class="px-6 py-4 font-bold text-slate-900 border-b border-slate-200 bg-slate-50">' + esc(t('conditions')) + '</h2>' +
      '<div class="overflow-x-auto"><table class="w-full text-left text-sm">' +
      '<thead><tr class="bg-slate-50 border-b border-slate-200"><th class="px-6 py-3.5 font-semibold text-slate-600 w-48">' + esc(t('item')) + '</th><th class="px-6 py-3.5 font-semibold text-slate-600">' + esc(t('detail')) + '</th></tr></thead>' +
      '<tbody class="divide-y divide-slate-50">' +
      condRow('ageRange', 'ageDetail', true) +
      condRow('applicantCount', 'applicantDetail', false) +
      condRow('coverageStart', 'coverageStartDetail', true) +
      condRow('minPremium', 'minPremiumDetail', false) +
      condRow('paymentMethod', 'paymentDetail', true) +
      '</tbody></table></div>' +
      '<div class="px-6 py-4 border-t border-slate-100 flex justify-end">' +
      '<a href="https://drive.google.com/drive/folders/1L0lJevyKS-iui0ELeYdD_nwt92stqNqF?usp=sharing" target="_blank" rel="noopener noreferrer" class="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 font-semibold text-white bg-teal-600 shadow-sm transition-all hover:bg-teal-700 active:scale-[0.98]">' + icon('Download', 'w-4 h-4') + ' ' + esc(t('downloadDocuments')) + '</a></div></div>' +
      '<footer class="mt-12 text-center text-blue-600 text-xs pb-8"><p>' + esc(t('paFooter')) + '</p><p class="mt-2 text-slate-500">' + esc(t('appBy')) + '</p></footer></div>';
  }
  function condRow(itemKey, detailKey, white) {
    return '<tr class="' + (white ? 'bg-white' : 'bg-slate-50/60') + ' hover:bg-slate-50">' +
      '<td class="px-6 py-3.5 text-slate-600 font-medium">' + esc(t(itemKey)) + '</td>' +
      '<td class="px-6 py-3.5 text-slate-700">' + esc(t(detailKey)) + '</td></tr>';
  }

  var LEVEL_LABELS = {
    1: { th: 'ขั้น 1 (ความเสี่ยงต่ำมาก)', en: 'Level 1 (Very Low Risk)' },
    2: { th: 'ขั้น 2 (ความเสี่ยงต่ำ)', en: 'Level 2 (Low Risk)' },
    3: { th: 'ขั้น 3 (ความเสี่ยงปานกลาง)', en: 'Level 3 (Medium Risk)' },
    4: { th: 'ขั้น 4 (ความเสี่ยงสูง/ไม่คุ้มครอง)', en: 'Level 4 (High Risk/Not Covered)' },
  };
  var BIZ_PAGE = 60;
  function filterBizTypes() {
    var q = state.bizSearch.trim().toLowerCase();
    var all = D.businessTypes;
    return !q ? all : all.filter(function (b) {
      return b.code.indexOf(q) !== -1 || b.name.toLowerCase().indexOf(q) !== -1 || (b.note && b.note.toLowerCase().indexOf(q) !== -1);
    });
  }
  function bizRowsHtml(filtered) {
    function levelLabel(level) {
      var L = LEVEL_LABELS[level];
      return L ? L[lang === 'en' ? 'en' : 'th'] : String(level);
    }
    function levelClass(level) {
      return level === 1 ? 'bg-emerald-100 text-emerald-800'
        : level === 2 ? 'bg-teal-100 text-teal-800'
        : level === 3 ? 'bg-amber-100 text-amber-800'
        : 'bg-red-100 text-red-800';
    }
    return filtered.slice(0, state.bizLimit).map(function (b) {
      return '<tr class="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">' +
        '<th scope="row" class="px-4 py-2.5 font-mono text-slate-600 whitespace-nowrap text-left font-normal">' + esc(b.code) + '</th>' +
        '<td class="px-4 py-2.5 text-slate-800">' + esc(b.name) + '</td>' +
        '<td class="px-4 py-2.5 whitespace-nowrap"><span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ' + levelClass(b.level) + '">' + esc(levelLabel(b.level)) + '</span></td>' +
        '<td class="px-4 py-2.5 text-slate-600 text-xs">' + esc(b.note || '—') + '</td></tr>';
    }).join('');
  }
  function bizCountText(filtered) {
    return filtered.length.toLocaleString(locale()) + ' / ' + D.businessTypes.length.toLocaleString(locale()) + ' ' + t('bizTypeItems');
  }
  function bizMoreHtml(filtered) {
    var shown = Math.min(state.bizLimit, filtered.length);
    if (shown >= filtered.length) return '';
    return '<div class="p-4 border-t border-slate-100 text-center">' +
      '<button type="button" data-bizmore="1" class="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors" style="min-height:44px;">' +
      esc(t('showMore')) + ' (' + shown.toLocaleString(locale()) + '/' + filtered.length.toLocaleString(locale()) + ')</button></div>';
  }

  function renderBusinessTypePage() {
    var filtered = filterBizTypes();
    var rows = bizRowsHtml(filtered);

    return '<div class="max-w-6xl mx-auto">' +
      '<header class="mb-6 animate-slide-up"><div class="text-center">' +
      '<h1 class="text-2xl font-bold text-slate-900 tracking-tight">' + esc(t('bizTypePageTitle')) + '</h1>' +
      '<p class="text-slate-500 mt-0.5">' + esc(t('bizTypePageSubtitle')) + '</p>' +
      (lang === 'en' ? '<p class="mt-2 inline-block rounded-md bg-amber-50 border border-amber-200 px-3 py-1 text-xs text-amber-800">' + esc(t('bizTypeThOnly')) + '</p>' : '') +
      '</div></header>' +
      '<div class="mb-6 animate-slide-up"><div class="relative max-w-md mx-auto">' +
      '<span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">' + icon('Search', 'w-5 h-5') + '</span>' +
      '<input type="text" id="biz-search" value="' + esc(state.bizSearch) + '" placeholder="' + esc(t('searchBizType')) + '" class="w-full pl-12 pr-4 py-3 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-600 transition-all" aria-label="' + esc(t('searchBizType')) + '" /></div>' +
      '<p id="biz-count" aria-live="polite" class="text-sm text-slate-500 mt-2 text-center">' + esc(bizCountText(filtered)) + '</p></div>' +
      '<div class="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden animate-slide-up">' +
      '<div class="gi-hscroll"><div class="overflow-x-auto max-h-[calc(100vh-320px)] overflow-y-auto" data-biz-scroll="1" data-hscroll="1"><table class="w-full text-sm">' +
      '<caption class="gi-sr-only">' + esc(t('bizTypePageTitle')) + '</caption>' +
      '<thead class="sticky top-0 bg-slate-50 border-b border-slate-200 z-10"><tr>' +
      '<th scope="col" class="text-left px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">' + esc(t('bizCode')) + '</th>' +
      '<th scope="col" class="text-left px-4 py-3 font-semibold text-slate-700">' + esc(t('bizTypeName')) + '</th>' +
      '<th scope="col" class="text-left px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">' + esc(t('bizLevel')) + '</th>' +
      '<th scope="col" class="text-left px-4 py-3 font-semibold text-slate-700">' + esc(t('bizNote')) + '</th></tr></thead>' +
      '<tbody id="biz-tbody">' + rows + '</tbody></table></div></div>' +
      '<div id="biz-more">' + bizMoreHtml(filtered) + '</div>' +
      '<div id="biz-empty"' + (filtered.length === 0 ? '' : ' hidden') + ' class="py-12 text-center text-slate-500">' + esc(t('noSearchResults')) + '</div>' +
      '</div>' +
      '<p class="mt-6 text-sm text-slate-500 text-center">' + esc(t('bizTypePageFooter')) + '</p></div>';
  }

  // ===================== RENDER: donate footer =====================
  function renderDonateFooter() {
    var showHealthFooter = state.currentPage === 'health';
    return '<footer class="w-full border-t border-amber-100/60 bg-gradient-to-b from-amber-50/40 via-white to-white">' +
      '<div class="container mx-auto max-w-lg px-4 sm:px-6 py-6 sm:py-10 text-center">' +
      '<div class="mt-6 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-4 text-left">' +
      '<p class="text-xs sm:text-sm text-slate-600 leading-relaxed">' + esc(t('disclaimer1')) + '</p>' +
      '<p class="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">' + esc(t('disclaimer2')) + '</p>' +
      '<p class="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">' + esc(t('disclaimer3')) + '</p>' +
      '</div>' +
      (showHealthFooter ? '<div class="mt-8 text-center text-blue-600 text-xs pb-2"><p>' + esc(t('healthFooter')) + '</p><p class="mt-2 text-slate-500">' + esc(t('appBy')) + '</p></div>' : '') +
      '</div></footer>';
  }

  // ===================== RENDER: quote modal =====================
  function renderQuoteModal() {
    if (!state.quote.open) return '';
    var product = state.quote.product;
    var ctx = quoteContext(product);
    var docHtml = renderQuoteDocument(product, ctx, state.quote);

    return '<div data-quote-modal="1" role="dialog" aria-modal="true" aria-labelledby="quote-modal-title" class="fixed inset-0 z-[300] flex items-center justify-center p-4">' +
      '<div data-quoteclose="1" class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></div>' +
      '<div class="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">' +
      '<div class="flex items-center justify-between px-5 py-3.5 border-b border-slate-200" style="background-color:' + NAVY + ';">' +
      '<h3 id="quote-modal-title" class="font-bold text-white">' + esc(t('quotePreview')) + '</h3>' +
      '<button type="button" data-quoteclose="1" aria-label="' + esc(t('close')) + '" class="w-9 h-9 rounded-lg flex items-center justify-center text-white/80 hover:bg-white/10">' + icon('X', 'w-5 h-5') + '</button></div>' +
      '<div class="px-5 py-3 border-b border-slate-100 bg-slate-50">' +
      '<label for="quote-customer" class="text-sm font-medium text-slate-700 block mb-1.5">' + esc(t('customerName')) + '</label>' +
      '<input type="text" id="quote-customer" value="' + esc(state.quote.customerName) + '" placeholder="' + esc(t('customerNamePlaceholder')) + '" class="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-600 transition-all" /></div>' +
      '<div class="flex-1 overflow-auto bg-slate-200 p-4"><div data-quote-fit class="mx-auto" style="width:794px;"><div data-quote-scale style="transform-origin:top left;"><div class="bg-white shadow-md" style="width:794px;"><div id="quote-doc">' + docHtml + '</div></div></div></div></div>' +
      '<div class="px-5 py-3.5 border-t border-slate-200 flex flex-wrap justify-end gap-3">' +
      quoteActionBtn('view', 'Eye', t('quoteViewBtn'), false) +
      quoteActionBtn('print', 'Printer', t('quotePrintBtn'), false) +
      quoteActionBtn('download', 'Download', t('quoteDownloadBtn'), true) +
      '</div></div></div>';
  }
  function quoteActionBtn(kind, ic, label, primary) {
    return '<button type="button" data-pdf="' + kind + '" class="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-semibold text-sm transition-all disabled:opacity-60 ' +
      (primary ? 'text-white shadow-sm hover:opacity-90' : 'border border-slate-300 text-slate-700 hover:bg-slate-50') + '"' +
      (primary ? ' style="background-color:' + NAVY + ';"' : '') + '>' + icon(ic, 'w-4 h-4') + ' ' + esc(label) + '</button>';
  }

  // ----- PDF document layout (port of MultiGroupQuoteDocument.jsx) -----
  function renderQuoteDocument(product, ctx, q) {
    var titleKey = ctx.isPa ? 'quoteTitleMultiPa' : 'quoteTitleMultiHealth';
    var groups = ctx.groupCols;
    var benefitMatrix = ctx.benefitMatrix;
    var result = ctx.result;
    var colCount = groups.length;
    var colW = Math.max(34, 60 - colCount * 6);

    var labelCell = 'padding:7px 12px;color:#334155;font-size:12px;text-align:left;';
    var numCell = 'padding:7px 10px;text-align:right;font-weight:700;color:#0f172a;font-size:12px;white-space:nowrap;';

    var premiumRows = [];
    premiumRows.push({ label: ctx.mainLabel, get: function (g) { return fmt(g.mainPremium); } });
    if (ctx.anyRider) premiumRows.push({ label: ctx.riderLabel, get: function (g) { return g.includeRider ? fmt(g.riderPremium) : '—'; } });
    premiumRows.push({ label: t('totalPerPerson'), get: function (g) { return fmt(g.perPerson); }, accent: GOLD });
    premiumRows.push({ label: t('employeeCountShort') + ' (' + t('people') + ')', get: function (g) { return fmt(g.count); } });
    premiumRows.push({ label: t('groupSubtotal'), get: function (g) { return fmt(g.subtotal); }, accent: NAVY, strong: true });

    function infoRow(label, value) {
      return '<div style="display:flex;gap:8px;font-size:13px;"><span style="color:#64748b;min-width:90px;">' + esc(label) + ':</span><span style="font-weight:600;color:#0f172a;">' + esc(value) + '</span></div>';
    }
    function sectionTitle(txt) {
      return '<div style="margin:20px 0 8px;font-size:14px;font-weight:700;color:' + NAVY + ';display:flex;align-items:center;gap:8px;"><span style="width:4px;height:16px;background:' + GOLD + ';border-radius:2px;display:inline-block;"></span>' + esc(txt) + '</div>';
    }

    var colgroup = '<colgroup><col style="width:' + colW + '%;" />' + groups.map(function () { return '<col />'; }).join('') + '</colgroup>';

    var benefitThead = '<tr style="background:' + NAVY + ';color:#fff;">' +
      '<th style="' + labelCell + 'color:#fff;font-weight:700;vertical-align:bottom;">' + esc(t('coverage')) + '</th>' +
      groups.map(function (g) {
        return '<th style="padding:8px 10px;text-align:right;vertical-align:bottom;border-left:1px solid rgba(255,255,255,0.18);">' +
          '<div style="font-size:12px;font-weight:800;color:#fff;">' + esc(t('groupNo')) + ' ' + g.no + (g.name ? ' · ' + esc(g.name) : '') + '</div>' +
          '<div style="font-size:10px;font-weight:500;color:rgba(204,214,235,1);margin-top:2px;line-height:1.35;">' +
          esc(g.bizTypeLabel) + '<br/>' + esc(g.planLabel) + (g.riderText ? ' + ' + esc(g.riderText) : '') + '<br/>' + fmt(g.count) + ' ' + esc(t('people')) + '</div></th>';
      }).join('') + '</tr>';

    var benefitTbody = benefitMatrix.map(function (row, i) {
      return '<tr style="background:' + (i % 2 === 0 ? '#ffffff' : '#f8fafc') + ';border-top:1px solid #eef2f6;">' +
        '<td style="' + labelCell + '">' + esc(row.label) + '</td>' +
        row.values.map(function (v) { return '<td style="' + numCell + 'border-left:1px solid #eef2f6;">' + esc(v) + '</td>'; }).join('') + '</tr>';
    }).join('');

    var premiumTbody = premiumRows.map(function (row, i) {
      var bg = row.strong ? '#eef2f6' : (i % 2 === 0 ? '#ffffff' : '#f8fafc');
      var bt = row.strong ? ('1px solid ' + GOLD) : '1px solid #eef2f6';
      return '<tr style="background:' + bg + ';border-top:' + bt + ';">' +
        '<td style="' + labelCell + 'font-weight:' + (row.accent ? 700 : 400) + ';">' + esc(row.label) + '</td>' +
        groups.map(function (g) { return '<td style="' + numCell + 'border-left:1px solid #eef2f6;color:' + (row.accent || '#0f172a') + ';">' + esc(row.get(g)) + '</td>'; }).join('') + '</tr>';
    }).join('');

    return '<div style="width:794px;box-sizing:border-box;background:#ffffff;color:#0f172a;font-family:\'Sarabun\',\'Noto Sans Thai\',system-ui,-apple-system,sans-serif;padding:40px 44px;">' +
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid ' + NAVY + ';padding-bottom:18px;">' +
      '<div style="display:flex;align-items:center;gap:14px;"><img src="../assets/advisortool-wordmark-v3.svg?v=20260810-logo-v3" alt="Advisortool" crossorigin="anonymous" style="width:54px;height:54px;border-radius:10px;object-fit:cover;" />' +
      '<div><div style="font-size:20px;font-weight:800;color:' + NAVY + ';line-height:1.2;">' + esc(t('groupInsurance')) + '</div>' +
      '<div style="font-size:12px;color:' + TEAL + ';margin-top:2px;">' + esc(t('groupInsuranceSystem')) + '</div></div></div>' +
      '<div style="text-align:right;font-size:12px;color:#475569;"><div style="font-weight:700;">' + esc(t('quoteNoLabel')) + ': ' + esc(q.quoteNo) + '</div>' +
      '<div style="margin-top:2px;">' + esc(t('quoteDateLabel')) + ': ' + esc(q.quoteDate) + '</div></div></div>' +

      '<div style="margin-top:18px;font-size:17px;font-weight:800;color:' + NAVY + ';">' + esc(t(titleKey)) + '</div>' +

      '<div style="margin-top:14px;display:grid;grid-template-columns:1fr 1fr;gap:8px 20px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px 18px;">' +
      infoRow(t('customerName'), q.customerName || '—') +
      infoRow(t('selectProduct'), ctx.productLabel) +
      infoRow(t('totalPeople'), fmt(result.totalCount) + ' ' + t('people')) +
      infoRow(t('bandUsed'), result.band) + '</div>' +

      sectionTitle(t('benefits')) +
      '<table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;table-layout:fixed;">' + colgroup +
      '<thead>' + benefitThead + '</thead><tbody>' + benefitTbody + '</tbody></table>' +

      sectionTitle(t('premiumSummary')) +
      '<table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;table-layout:fixed;">' + colgroup +
      '<tbody>' + premiumTbody + '</tbody></table>' +

      '<div style="margin-top:18px;background:' + NAVY + ';color:#ffffff;border-radius:10px;padding:18px 22px;display:flex;justify-content:space-between;align-items:center;">' +
      '<div style="font-size:14px;font-weight:600;color:rgba(204,214,235,1);">' + esc(t('totalPremiumYear')) + ' · ' + fmt(result.totalCount) + ' ' + esc(t('people')) + '</div>' +
      '<div style="font-size:26px;font-weight:800;">' + fmt(result.grandTotal) + ' <span style="font-size:15px;font-weight:600;color:rgba(204,214,235,1);">' + esc(t('perYear')) + '</span></div></div>' +

      '<div style="margin-top:20px;font-size:11px;color:#64748b;line-height:1.7;">' +
      '<div>' + esc(t('premiumNote')) + '</div>' +
      '<div>* ' + esc(t('bandUsed')) + ': ' + esc(result.band) + ' (' + esc(t('totalPeople')) + ' ' + fmt(result.totalCount) + ' ' + esc(t('people')) + ')</div>' +
      '<div>* ' + esc(t('minPremium')) + ': ' + esc(t('minPremiumDetail')) + '</div></div></div>';
  }

  // ===================== ROOT RENDER =====================
  function pageTitleKey() {
    if (state.currentPage === 'health') return 'pageHealth';
    if (state.currentPage === 'accident') return 'pageAccident';
    return 'pageBusinessType';
  }
  function renderPageBody() {
    if (state.currentPage === 'health') return renderHealthPage();
    if (state.currentPage === 'accident') return renderAccidentPage();
    return renderBusinessTypePage();
  }

  // Play the entrance animation only on first load + nav switches, not on every
  // in-page re-render (typing, toggles, add/remove group). See .gi-anim in index.html.
  var animatePage = true;

  function render() {
    var html = '<div class="min-h-screen w-full flex' + (animatePage ? ' gi-anim' : '') + '">' +
      renderSidebar() +
      '<main class="flex-1 min-w-0 lg:ml-72 min-h-screen flex flex-col bg-[#fafbfc]">' +
      '<header class="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 pl-20 pr-4 lg:pl-8 lg:pr-8 py-4 shadow-sm">' +
      // not a heading: it repeats the page <h1> below it, and being a <h2> in front
      // of that <h1> made the outline run h1 > h2 > h1.
      '<p class="text-xl font-bold text-slate-900">' + esc(t(pageTitleKey())) + '</p>' +
      '<p class="text-slate-500 text-sm mt-0.5">' + esc(t('home')) + ' / ' + esc(t(pageTitleKey())) + '</p></header>' +
      '<div class="flex-1 p-4 md:p-6 lg:p-8">' + renderLangToggle() + renderPageBody() + '</div>' +
      renderDonateFooter() +
      '</main></div>' +
      renderQuoteModal();
    document.getElementById('app').innerHTML = html;
    animatePage = false; // subsequent re-renders (input/toggle) won't replay the animation
    // #2 the dialog / mobile drawer owns the screen — stop the page scrolling behind it
    document.documentElement.classList.toggle('gi-modal-open', state.quote.open || state.sidebarOpen);
    fitQuotePreview();      // #1
    markScrollableTables(); // #12
  }

  // #12 A sideways-scrolling table gives no hint that it scrolls. Flag the ones that
  // actually overflow so CSS can fade their right edge.
  function markScrollableTables() {
    document.querySelectorAll('#app [data-hscroll]').forEach(function (box) {
      var wrap = box.closest('.gi-hscroll');
      if (wrap) wrap.classList.toggle('is-scrollable', box.scrollWidth > box.clientWidth + 1);
    });
  }

  // #1 The quote sheet is a fixed 794px A4 page. On a phone that overflowed the modal
  // and forced the user to pan an A4 document sideways. Scale it to the space we have
  // and size the placeholder box to the scaled result so nothing overflows.
  function fitQuotePreview() {
    var fit = document.querySelector('[data-quote-fit]');
    var scaler = document.querySelector('[data-quote-scale]');
    if (!fit || !scaler) return;
    var avail = fit.parentElement.clientWidth - 32; // p-4 either side
    var scale = Math.min(1, avail / 794);
    scaler.style.transform = scale < 1 ? 'scale(' + scale + ')' : '';
    var sheet = scaler.firstElementChild;
    fit.style.width = Math.round(794 * scale) + 'px';
    fit.style.height = sheet ? Math.round(sheet.offsetHeight * scale) + 'px' : '';
  }

  // The PDF must be rasterised at full 794px width, never at the on-screen preview
  // scale, so drop the transform for the duration of the capture.
  function withQuoteUnscaled(fn) {
    var scaler = document.querySelector('[data-quote-scale]');
    var fit = document.querySelector('[data-quote-fit]');
    var prev = scaler ? scaler.style.transform : '';
    var prevW = fit ? fit.style.width : '';
    var prevH = fit ? fit.style.height : '';
    if (scaler) scaler.style.transform = '';
    if (fit) { fit.style.width = '794px'; fit.style.height = ''; }
    var restore = function () {
      if (scaler) scaler.style.transform = prev;
      if (fit) { fit.style.width = prevW; fit.style.height = prevH; }
    };
    return fn().then(function (v) { restore(); return v; }, function (e) { restore(); throw e; });
  }

  window.addEventListener('resize', function () { fitQuotePreview(); markScrollableTables(); });

  // ===================== ROUTING (#8) =====================
  // The three views used to live only in JS state: the URL never changed, so browser
  // Back left the tool entirely and no view could be linked to. Mirror them in the hash.
  var ROUTES = { health: 'health', accident: 'accident', businessType: 'business' };
  function pageFromHash() {
    var h = (location.hash || '').replace(/^#/, '');
    for (var k in ROUTES) if (ROUTES[k] === h) return k;
    return null;
  }
  function goto(page, push) {
    if (!ROUTES[page]) page = 'health';
    state.currentPage = page;
    state.sidebarOpen = false;
    animatePage = true;
    var hash = '#' + ROUTES[page];
    if (push && location.hash !== hash) history.pushState({ page: page }, '', hash);
    render();
    window.scrollTo(0, 0);   // land at the top of the new view, not mid-page
  }
  window.addEventListener('popstate', function () {
    var p = pageFromHash();
    state.currentPage = p || 'health';
    state.sidebarOpen = false;
    animatePage = true;
    render();
    window.scrollTo(0, 0);
  });

  // ===================== EVENTS =====================
  function findGroupArray() {
    return state[calcKey(state.currentPage)].groups;
  }
  function updateGroup(id, patch) {
    var gs = findGroupArray();
    for (var i = 0; i < gs.length; i++) if (gs[i].id === id) { for (var k in patch) gs[i][k] = patch[k]; break; }
  }

  document.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('[data-nav],[data-opensidebar],[data-closesidebar],[data-lang],[data-plan],[data-rider],[data-removegroup],[data-addgroup],[data-toggle-rider],[data-openquote],[data-shareline],[data-quoteclose],[data-pdf],[data-bizmore]') : null;
    if (!el) return;

    if (el.hasAttribute('data-nav')) { goto(el.getAttribute('data-nav'), true); return; }
    if (el.hasAttribute('data-opensidebar')) { state.sidebarOpen = true; render(); return; }
    if (el.hasAttribute('data-closesidebar')) { if (el.tagName === 'A') { return; } state.sidebarOpen = false; render(); return; }
    if (el.hasAttribute('data-lang')) { setLang(el.getAttribute('data-lang')); return; }

    if (el.hasAttribute('data-plan')) {
      var gid = el.getAttribute('data-gid'); var planIdx = parseInt(el.getAttribute('data-plan'), 10);
      var gs = findGroupArray();
      gs.forEach(function (g) { if (g.id === gid) { var ri = g.riderIdx > planIdx + 1 ? planIdx + 1 : g.riderIdx; g.planIdx = planIdx; g.riderIdx = ri; } });
      render(); return;
    }
    if (el.hasAttribute('data-rider')) {
      if (el.disabled) return;
      updateGroup(el.getAttribute('data-gid'), { riderIdx: parseInt(el.getAttribute('data-rider'), 10) }); render(); return;
    }
    if (el.hasAttribute('data-toggle-rider')) {
      // handled by change event below; ignore click bubbling for label
      return;
    }
    if (el.hasAttribute('data-removegroup')) {
      var rid = el.getAttribute('data-removegroup'); var arr = findGroupArray();
      if (arr.length > 1) state[calcKey(state.currentPage)].groups = arr.filter(function (g) { return g.id !== rid; });
      render(); return;
    }
    if (el.hasAttribute('data-addgroup')) {
      state[calcKey(state.currentPage)].groups.push(makeGroup(productOf(state.currentPage))); render(); return;
    }
    if (el.hasAttribute('data-openquote')) {
      if (el.disabled) return;
      var now = new Date();
      state.quote.open = true; state.quote.product = el.getAttribute('data-openquote');
      state.quote.customerName = '';
      state.quote.quoteNo = makeQuoteNo(now);
      state.quote.quoteDate = now.toLocaleDateString(lang === 'en' ? 'en-GB' : 'th-TH');
      render();
      // move focus into the modal for keyboard users
      var modalEl = document.querySelector('[data-quote-modal]');
      if (modalEl) { var f = modalEl.querySelector('input, button, a[href]'); if (f) f.focus(); }
      return;
    }
    if (el.hasAttribute('data-shareline')) { if (el.disabled) return; shareToLine(el.getAttribute('data-shareline')); return; }
    if (el.hasAttribute('data-quoteclose')) { state.quote.open = false; render(); return; }
    if (el.hasAttribute('data-pdf')) { runPdf(el.getAttribute('data-pdf'), el); return; }
    if (el.hasAttribute('data-bizmore')) { state.bizLimit += BIZ_PAGE; paintBizTable(); return; }
  });

  // input/change handlers — update state WITHOUT full re-render where it would steal focus
  document.addEventListener('input', function (e) {
    var el = e.target;
    if (el.id === 'biz-search') { state.bizSearch = el.value; state.bizLimit = BIZ_PAGE; scheduleBizPaint(); return; }
    if (el.id === 'quote-customer') { state.quote.customerName = el.value; rerenderQuoteDoc(); return; }
    if (el.getAttribute && el.getAttribute('data-field') === 'name') {
      updateGroup(el.getAttribute('data-gid'), { name: el.value });
      // name affects table headers/summary — re-render but restore focus
      rerenderKeepFocus(el);
      return;
    }
    if (el.getAttribute && el.getAttribute('data-field') === 'count') {
      var raw = el.value;
      if (raw === '' || /^\d+$/.test(raw)) {
        updateGroup(el.getAttribute('data-gid'), { count: raw });
        rerenderKeepFocus(el);
      } else {
        // revert invalid char
        var gid = el.getAttribute('data-gid'); var g = findGroupArray().filter(function (x) { return x.id === gid; })[0];
        el.value = g ? g.count : '';
      }
      return;
    }
  });

  document.addEventListener('change', function (e) {
    var el = e.target;
    if (el.getAttribute && el.getAttribute('data-field') === 'bizType') {
      updateGroup(el.getAttribute('data-gid'), { bizType: el.value }); render(); return;
    }
    if (el.getAttribute && el.hasAttribute('data-toggle-rider')) {
      var gid = el.getAttribute('data-toggle-rider'); var g = findGroupArray().filter(function (x) { return x.id === gid; })[0];
      if (g) updateGroup(gid, { includeRider: !g.includeRider }); render(); return;
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (state.quote.open) { state.quote.open = false; render(); }
      else if (state.sidebarOpen) { state.sidebarOpen = false; render(); }
      return;
    }
    // focus trap inside the quote modal
    if (e.key === 'Tab' && state.quote.open) {
      var modal = document.querySelector('[data-quote-modal]');
      if (!modal) return;
      var f = modal.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (!modal.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
      else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  // Re-render full app then restore focus + caret to the equivalent input
  function rerenderKeepFocus(srcEl) {
    var field = srcEl.getAttribute('data-field');
    var gid = srcEl.getAttribute('data-gid');
    var start = srcEl.selectionStart, end = srcEl.selectionEnd;
    render();
    var sel = '[data-field="' + field + '"][data-gid="' + gid + '"]';
    var next = document.querySelector(sel);
    if (next) {
      next.focus();
      try { next.setSelectionRange(start, end); } catch (e) {}
    }
  }

  // Repaint ONLY the business-type rows. This used to call the full render(): with
  // 1,099 rows that meant rebuilding ~525KB of innerHTML on every keystroke, which
  // measured 230-260ms per character on a mid-range phone (budget is ~100ms).
  // Touching just the <tbody> also means the search box is never replaced, so focus
  // and caret survive without having to be restored by hand.
  var bizPaintTimer = null;
  function paintBizTable() {
    var tbody = document.getElementById('biz-tbody');
    if (!tbody) return;
    var filtered = filterBizTypes();
    tbody.innerHTML = bizRowsHtml(filtered);
    var count = document.getElementById('biz-count');
    if (count) count.textContent = bizCountText(filtered);
    var more = document.getElementById('biz-more');
    if (more) more.innerHTML = bizMoreHtml(filtered);
    var empty = document.getElementById('biz-empty');
    if (empty) empty.hidden = filtered.length !== 0;
    markScrollableTables();
  }
  function scheduleBizPaint() {
    clearTimeout(bizPaintTimer);
    bizPaintTimer = setTimeout(paintBizTable, 180);
  }

  function rerenderQuoteDoc() {
    var doc = document.getElementById('quote-doc');
    if (!doc || !state.quote.open) return;
    var ctx = quoteContext(state.quote.product);
    doc.innerHTML = renderQuoteDocument(state.quote.product, ctx, state.quote);
    fitQuotePreview();
  }

  // ===================== LINE share =====================
  function shareToLine(product) {
    var ctx = quoteContext(product);
    var result = ctx.result;
    var isPa = ctx.isPa;
    var lines = [
      '💼 ' + t(isPa ? 'quoteTitleMultiPa' : 'quoteTitleMultiHealth'),
      '👥 ' + t('totalPeople') + ': ' + fmt(result.totalCount) + ' ' + t('people') + ' (' + t('bandUsed') + ' ' + result.band + ')',
      '',
    ];
    result.groups.forEach(function (cg, i) {
      lines.push(
        '▶ ' + t('groupNo') + ' ' + (i + 1) + (cg.name ? ' · ' + cg.name : '') + ': ' + t(ctx.bizLabels[cg.bizType]) + ' · ' + ctx.planLabelOf(cg) + (ctx.riderTextOf(cg) ? ' · ' + ctx.riderTextOf(cg) : ''),
        '   ' + fmt(cg.perPerson) + ' × ' + fmt(cg.count) + ' = ' + fmt(cg.subtotal) + ' ' + t('baht')
      );
    });
    lines.push('', '✅ ' + t('totalPremiumYear') + ': ' + result.grandTotal.toLocaleString(locale()) + ' ' + t('baht'));
    var text = lines.join('\n');
    // Opening a new window can silently fail (pop-up blocker, in-app browser). Say so,
    // and leave the message on the clipboard so the share is still completable.
    var win = window.open('https://line.me/R/msg/text/?' + encodeURIComponent(text), '_blank', 'noopener,noreferrer');
    if (win) { showToast(t('lineOpened'), false); return; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () { showToast(t('lineBlocked'), true); },
        function () { showToast(t('lineCopyFailed'), true); }
      );
    } else {
      showToast(t('lineCopyFailed'), true);
    }
  }

  // ===================== PDF =====================
  function pad(n) { return String(n).padStart(2, '0'); }
  function makeQuoteNo(now) {
    var ymd = '' + now.getFullYear() + pad(now.getMonth() + 1) + pad(now.getDate());
    var secOfDay = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    var seq = String(secOfDay % 1000).padStart(3, '0');
    return 'QT-' + ymd + '-' + seq;
  }

  var A4_W = 210, A4_H = 297;

  // Find a near-white horizontal scanline within [top, top+height) so page slices
  // land in the gaps between table rows instead of cutting through a row.
  // Searches UPWARD from idealBottom; returns the ideal cut if none found or if
  // the canvas is tainted (getImageData throws).
  function snapCutToRowGap(ctx, canvasWidth, top, idealBottom, maxSearchPx) {
    try {
      for (var s = 0; s < maxSearchPx; s++) {
        var y = idealBottom - 1 - s;
        if (y <= top + 4) break;
        var data = ctx.getImageData(0, y, canvasWidth, 1).data;
        var white = true;
        for (var i = 0; i < data.length; i += 4) {
          if (data[i] < 245 || data[i + 1] < 245 || data[i + 2] < 245) { white = false; break; }
        }
        if (white) return y + 1; // cut just below the white line
      }
    } catch (e) { /* tainted canvas — fall back to fixed slicing */ }
    return idealBottom;
  }

  function buildPdfFromElement(el) {
    return html2canvas(el, { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false }).then(function (canvas) {
      var jsPDF = window.jspdf.jsPDF;
      var doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      var imgHeightMM = (canvas.height * A4_W) / canvas.width;
      if (imgHeightMM <= A4_H) {
        doc.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, A4_W, imgHeightMM);
        return doc;
      }
      var pageHeightPx = (A4_H * canvas.width) / A4_W;
      var srcCtx = canvas.getContext('2d');
      // search window: up to ~12% of a page height (capped) to find a row gap
      var maxSearchPx = Math.min(Math.floor(pageHeightPx * 0.12), 220);
      var renderedPx = 0, pageIndex = 0;
      while (renderedPx < canvas.height) {
        var idealBottom = Math.min(renderedPx + pageHeightPx, canvas.height);
        var bottom = idealBottom;
        if (idealBottom < canvas.height) {
          bottom = snapCutToRowGap(srcCtx, canvas.width, renderedPx, idealBottom, maxSearchPx);
        }
        var sliceHeightPx = bottom - renderedPx;
        var pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width; pageCanvas.height = sliceHeightPx;
        var cx = pageCanvas.getContext('2d');
        cx.fillStyle = '#ffffff'; cx.fillRect(0, 0, canvas.width, sliceHeightPx);
        cx.drawImage(canvas, 0, renderedPx, canvas.width, sliceHeightPx, 0, 0, canvas.width, sliceHeightPx);
        var sliceHeightMM = (sliceHeightPx * A4_W) / canvas.width;
        if (pageIndex > 0) doc.addPage();
        doc.addImage(pageCanvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, A4_W, sliceHeightMM);
        renderedPx += sliceHeightPx; pageIndex += 1;
      }
      return doc;
    });
  }

  // one-time spinner keyframe (does not depend on tailwind's animate-spin being present)
  function ensureSpinCss() {
    if (document.getElementById('gi-spin-css')) return;
    var st = document.createElement('style');
    st.id = 'gi-spin-css';
    st.textContent = '@keyframes gi-spin{to{transform:rotate(360deg)}}.gi-spin{animation:gi-spin .8s linear infinite}';
    document.head.appendChild(st);
  }
  var SPINNER_SVG = '<svg class="gi-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" style="opacity:.25"/><path d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" stroke-width="4" stroke-linecap="round" style="opacity:.9"/></svg>';

  function showToast(msg, isError) {
    var el = document.getElementById('gi-pdf-error');
    if (!el) {
      el = document.createElement('div');
      el.id = 'gi-pdf-error';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      el.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:400;max-width:90vw;padding:10px 18px;border-radius:10px;color:#fff;font-size:14px;font-weight:600;box-shadow:0 6px 20px rgba(0,0,0,.25);opacity:0;transition:opacity .2s;';
      document.body.appendChild(el);
    }
    el.style.background = isError ? '#b91c1c' : '#166534';
    el.textContent = msg;
    requestAnimationFrame(function () { el.style.opacity = '1'; });
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.style.opacity = '0'; }, 3200);
  }

  function runPdf(kind, btn) {
    var el = document.getElementById('quote-doc');
    if (!el) return;
    if (btn && btn.disabled) return;
    var target = el.firstElementChild || el;

    // Open the target tab synchronously (inside the user gesture) so iOS/Safari
    // does not block the popup after the async html2canvas render finishes.
    // NOTE: no 'noopener' here — we need the handle to set its location later.
    var win = (kind === 'download') ? null : window.open('', '_blank');

    ensureSpinCss();
    var buttons = Array.prototype.slice.call(document.querySelectorAll('[data-pdf]'));
    buttons.forEach(function (b) { b.disabled = true; });
    var origHtml = btn ? btn.innerHTML : '';
    if (btn) btn.innerHTML = SPINNER_SVG + ' ' + esc(t('pdfGenerating'));

    withQuoteUnscaled(function () { return buildPdfFromElement(target); }).then(function (doc) {
      var product = state.quote.product;
      var prefix = product === 'pa' ? 'quote-group-pa' : 'quote-group-health';
      var filename = prefix + '-' + state.quote.quoteNo + '.pdf';
      if (kind === 'download') {
        doc.save(filename);
      } else {
        if (kind === 'print') { try { doc.autoPrint(); } catch (e) {} }
        var url = doc.output('bloburl');
        if (win) { win.location = url; }
        else { window.open(url, '_blank', 'noopener,noreferrer'); }
      }
    }).catch(function (err) {
      console.error('PDF generation failed', err);
      if (win) { try { win.close(); } catch (e) {} }
      showToast(t('pdfError'), true);
    }).then(function () {
      // finally: restore buttons regardless of outcome
      buttons.forEach(function (b) { b.disabled = false; });
      if (btn) btn.innerHTML = origHtml;
    });
  }

  // ===================== INIT =====================
  state.currentPage = pageFromHash() || 'health';
  if (!location.hash) history.replaceState({ page: state.currentPage }, '', '#' + ROUTES[state.currentPage]);
  render();
})();
