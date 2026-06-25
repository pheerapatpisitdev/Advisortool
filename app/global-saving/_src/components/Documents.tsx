import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import './Factsheet.css';

// หน้า "เอกสารการลงทุน" — Factsheet ดัชนี Citi Grandmaster RC 5 Index
// แปลงจาก HTML/Chart.js สำเร็จรูปเป็น React + Chart.js (npm) โดยสโคป CSS ไว้ใต้ .factsheet
export default function Documents() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* DATA */
    const annualReturns: Record<number, number> = {
      2546: 7.87, 2547: 6.20, 2548: 6.36, 2549: 4.07, 2550: 5.22, 2551: 3.66, 2552: 0.97,
      2553: 5.58, 2554: 2.48, 2555: 6.23, 2556: 9.81, 2557: 5.62, 2558: -5.33, 2559: 5.51,
      2560: 7.45, 2561: 0.59, 2562: 11.58, 2563: 5.89, 2564: 2.42, 2565: -3.21, 2566: 3.31,
      2567: -0.16, 2568: 5.77,
    };
    const retYears = Object.keys(annualReturns).map(Number);
    const baseYear = 2545;
    const levelYears = [baseYear, ...retYears];
    let lvl = 100;
    const levels: { year: number; level: number; ret: number | null }[] = [
      { year: baseYear, level: 100, ret: null },
    ];
    retYears.forEach((y) => {
      lvl = lvl * (1 + annualReturns[y] / 100);
      levels.push({ year: y, level: +lvl.toFixed(2), ret: annualReturns[y] });
    });

    const groups = [
      { name: 'หุ้น', items: [
        { th: 'หุ้นสหรัฐฯ', en: 'US Equity', pct: 16.68, color: '#1E4E79' },
        { th: 'หุ้นยุโรป', en: 'Eurozone Equity', pct: 8.33, color: '#2E6CA4' },
        { th: 'หุ้นญี่ปุ่น', en: 'Japan Equity', pct: 2.78, color: '#5C9BD1' }] },
      { name: 'พันธบัตรรัฐบาล', items: [
        { th: 'พันธบัตรรัฐบาลสหรัฐฯ', en: 'US Gov Bond', pct: 20.08, color: '#1F6F5C' },
        { th: 'พันธบัตรรัฐบาลยุโรป', en: 'EU Gov Bond', pct: 20.08, color: '#2E9179' },
        { th: 'พันธบัตรรัฐบาลญี่ปุ่น', en: 'Japan Gov Bond', pct: 10.04, color: '#6BBFA3' }] },
      { name: 'ตราสารหนี้เอกชน', items: [
        { th: 'ตราสารหนี้เอกชน', en: 'Corporate Credit', pct: 11.37, color: '#6B5B95' }] },
      { name: 'โภคภัณฑ์', items: [
        { th: 'สินค้าโภคภัณฑ์อื่น', en: 'Other Commodities', pct: 7.09, color: '#C8772E' },
        { th: 'โลหะมีค่า', en: 'Precious Metals', pct: 3.54, color: '#C7A24E' }] },
    ];
    const assets: { th: string; en: string; pct: number; color: string; group: string }[] = [];
    groups.forEach((g) => g.items.forEach((it) => assets.push({ ...it, group: g.name })));

    Chart.defaults.font.family = "'IBM Plex Sans Thai','IBM Plex Sans',sans-serif";
    Chart.defaults.font.size = 11;
    Chart.defaults.color = '#5F6E7B';
    const C = { ink: '#0C1E30', goldDeep: '#876A24', muted: '#5F6E7B', line: '#E5E9EE' };
    const fmt = (n: number, d = 2) =>
      n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
    const signCls = (v: number) => (v > 0 ? 'pos' : v < 0 ? 'neg' : '');
    const signTxt = (v: number) => (v > 0 ? '+' : '') + fmt(v);

    const $ = <T extends Element>(sel: string) => root.querySelector(sel) as T;

    /* tooltip */
    const ttEl = document.createElement('div');
    ttEl.id = 'chartjs-tooltip';
    document.body.appendChild(ttEl);
    function externalTooltip(context: any, render: (tt: any) => string) {
      const { chart, tooltip } = context;
      if (tooltip.opacity === 0) {
        ttEl.style.opacity = '0';
        return;
      }
      ttEl.innerHTML = render(tooltip);
      const rect = chart.canvas.getBoundingClientRect();
      const x = window.pageXOffset + rect.left + tooltip.caretX;
      const y = window.pageYOffset + rect.top + tooltip.caretY;
      ttEl.style.opacity = '1';
      ttEl.style.transform = 'translateY(0)';
      let left = x - ttEl.offsetWidth / 2;
      const vpRight = window.pageXOffset + document.documentElement.clientWidth - 8;
      if (left + ttEl.offsetWidth > vpRight) left = vpRight - ttEl.offsetWidth;
      if (left < 8) left = 8;
      ttEl.style.left = left + 'px';
      ttEl.style.top = y - ttEl.offsetHeight - 12 + 'px';
    }

    /* LINE */
    const lineCtx = $<HTMLCanvasElement>('#lineChart');
    const lg = lineCtx.getContext('2d')!.createLinearGradient(0, 0, 0, 200);
    lg.addColorStop(0, 'rgba(199,162,78,.22)');
    lg.addColorStop(1, 'rgba(199,162,78,0)');
    const idxOf = (y: number) => levelYears.indexOf(y);
    const eventBands = [
      { from: 2557, to: 2558, text: 'วิกฤตหนี้กรีซ และจุดเปลี่ยนดอกเบี้ยสหรัฐฯ', row: 0 },
      { from: 2563, to: 2563, text: 'ช่วงสถานการณ์โควิด', row: 0 },
      { from: 2565, to: 2565, text: 'ตลาดผันผวนตามทิศทางดอกเบี้ยสหรัฐฯ', row: 1 },
    ];

    /* ป้ายคำอธิบายเหตุการณ์ — HTML overlay วางตรงหมุดเลขแต่ละตัว (สร้างครั้งเดียว, ตำแหน่งซิงก์ใน afterDraw) */
    const evWrap = $<HTMLDivElement>('.ev-labels');
    const evLabelEls = eventBands.map((b) => {
      const el = document.createElement('span');
      el.className = 'ev-label';
      el.textContent = b.text;
      evWrap.appendChild(el);
      return el;
    });

    const eventBandPlugin = {
      id: 'eventBands',
      beforeDatasetsDraw(chart: any) {
        const { ctx, chartArea: { bottom }, scales: { x } } = chart;
        if (!x) return;
        ctx.save();
        eventBands.forEach((b) => {
          const iF = idxOf(b.from), iT = idxOf(b.to);
          if (iF < 0 || iT < 0) return;
          const pF = x.getPixelForValue(iF), pT = x.getPixelForValue(iT);
          const step = Math.abs(x.getPixelForValue(1) - x.getPixelForValue(0));
          const bandLeft = pF - step * 0.45, bandRight = pT + step * 0.45;
          ctx.fillStyle = 'rgba(12,30,48,.05)';
          ctx.fillRect(bandLeft, 0, bandRight - bandLeft, bottom); // คลุมเต็มความสูงตั้งแต่บนสุด (หลังข้อความ)
        });
        ctx.restore();
      },
      afterDraw(chart: any) {
        const { chartArea: { left, right }, scales: { x } } = chart;
        if (!x) return;
        eventBands.forEach((b, k) => {
          const el = evLabelEls[k];
          const iF = idxOf(b.from), iT = idxOf(b.to);
          if (iF < 0 || iT < 0) { el.style.opacity = '0'; return; }
          const cx = (x.getPixelForValue(iF) + x.getPixelForValue(iT)) / 2;
          const w = el.offsetWidth;
          let lx = cx - w / 2;                       // จัดกึ่งกลางหัวแถบ
          if (lx < left) lx = left;                  // กันล้นซ้าย
          if (lx + w > right) lx = right - w;         // กันล้นขวา
          el.style.opacity = '1';
          el.style.left = `${lx}px`;
          el.style.top = `${6 + (b.row ?? 0) * 38}px`; // แถบชิดกันให้เหลื่อมลงมา 1 ระดับ
        });
      },
    };
    const lineChart = new Chart(lineCtx, {
      type: 'line',
      data: {
        labels: levelYears.map(String),
        datasets: [{
          data: levels.map((l) => l.level),
          borderColor: C.goldDeep, borderWidth: 2, backgroundColor: lg, fill: true, tension: 0.32,
          pointRadius: 0, pointHoverRadius: 4, pointHoverBackgroundColor: C.goldDeep,
          pointHoverBorderColor: '#fff', pointHoverBorderWidth: 2,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        animation: REDUCED ? false : { duration: 1200, easing: 'easeOutQuart' },
        interaction: { mode: 'index', intersect: false }, layout: { padding: { top: 88 } },
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: false,
            external: (c: any) => externalTooltip(c, (tt: any) => {
              const d = levels[tt.dataPoints[0].dataIndex];
              const r = d.ret == null
                ? '<div class="tt-sub">มูลค่าเริ่มต้น</div>'
                : `<div class="tt-sub">ปีนี้ <b class="${signCls(d.ret)}">${signTxt(d.ret)}%</b></div>`;
              return `<div class="tt-title">พ.ศ. ${d.year}</div><div class="tt-main">${fmt(d.level)}</div>${r}`;
            }),
          },
        },
        scales: {
          x: {
            grid: { display: false }, border: { color: C.line },
            ticks: {
              maxRotation: 0, autoSkip: false, color: C.muted, font: { size: 10 },
              callback: (_v: any, i: number) => {
                const y = levelYears[i];
                return (y - baseYear) % 3 === 0 ? y : '';
              },
            },
          },
          y: {
            suggestedMin: 80, grid: { color: 'rgba(12,30,48,.05)' }, border: { display: false },
            ticks: { stepSize: 50, color: C.muted, font: { size: 10, family: "'IBM Plex Sans Thai', sans-serif" } },
          },
        },
      },
      plugins: [eventBandPlugin],
    } as any);

    /* DONUT */
    const donutCtx = $<HTMLCanvasElement>('#donutChart');
    const centerEl = $<HTMLDivElement>('#donutCenter');
    let selected = -1;
    function setCenter(i: number) {
      if (i < 0) {
        centerEl.innerHTML =
          '<div class="dc-top">รวมทั้งพอร์ต</div><div class="dc-val">100<span class="u">%</span></div><div class="dc-name">9 กลุ่มสินทรัพย์</div>';
      } else {
        const a = assets[i];
        centerEl.innerHTML = `<div class="dc-top">${a.group}</div><div class="dc-val">${fmt(a.pct)}<span class="u">%</span></div><div class="dc-name">${a.th}</div>`;
      }
    }
    const donutChart = new Chart(donutCtx, {
      type: 'doughnut',
      data: {
        labels: assets.map((a) => a.th),
        datasets: [{
          data: assets.map((a) => a.pct),
          backgroundColor: assets.map((a) => a.color), borderColor: '#fff', borderWidth: 2,
          hoverBorderColor: '#fff', hoverOffset: 8, offset: assets.map(() => 0),
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '66%',
        animation: REDUCED ? false : { animateRotate: true, duration: 1000, easing: 'easeOutCubic' },
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        onHover: (_e: any, a: any[]) => {
          donutCtx.style.cursor = a.length ? 'pointer' : 'default';
          if (selected >= 0) return;
          if (a.length) { setCenter(a[0].index); highlightLegend(a[0].index); }
          else { setCenter(-1); highlightLegend(-1); }
        },
        onClick: (_e: any, a: any[]) => {
          if (!a.length) { selectAsset(-1); return; }
          const i = a[0].index;
          selectAsset(selected === i ? -1 : i);
        },
      },
    } as any);
    function selectAsset(i: number) {
      selected = i;
      (donutChart.data.datasets[0] as any).offset = assets.map((_, k) => (k === i ? 13 : 0));
      donutChart.update();
      setCenter(i);
      highlightLegend(i, true);
    }

    /* alloc summary */
    $<HTMLDivElement>('#allocSummary').innerHTML = groups
      .map((g) => {
        const s = g.items.reduce((a, it) => a + it.pct, 0);
        return `${g.name} <b>${fmt(s)}%</b>`;
      })
      .join('<span style="color:#C8D0D8">·</span> ');

    /* LEGEND */
    const legendEl = $<HTMLDivElement>('#legend');
    assets.forEach((it, i) => {
      const row = document.createElement('div');
      row.className = 'lg-item';
      row.dataset.i = String(i);
      row.tabIndex = 0;
      row.setAttribute('role', 'button');
      row.setAttribute('aria-label', `${it.th} ${fmt(it.pct)} เปอร์เซ็นต์`);
      row.innerHTML = `<span class="lg-swatch" style="background:${it.color}"></span><span class="lg-name">${it.th}</span><span class="lg-pct">${fmt(it.pct)}%</span>`;
      row.addEventListener('mouseenter', () => {
        if (selected < 0) {
          setCenter(i); highlightLegend(i);
          donutChart.setActiveElements([{ datasetIndex: 0, index: i }]);
          donutChart.update();
        }
      });
      row.addEventListener('mouseleave', () => {
        if (selected < 0) {
          setCenter(-1); highlightLegend(-1);
          donutChart.setActiveElements([]);
          donutChart.update();
        }
      });
      row.addEventListener('click', () => selectAsset(selected === i ? -1 : i));
      row.addEventListener('keydown', (ev: KeyboardEvent) => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          selectAsset(selected === i ? -1 : i);
        }
      });
      legendEl.appendChild(row);
    });
    const legendItems = [...legendEl.querySelectorAll<HTMLElement>('.lg-item')];
    function highlightLegend(i: number, pin = false) {
      legendItems.forEach((el) => {
        const k = +(el.dataset.i as string);
        el.classList.toggle('active', k === i);
        el.classList.toggle('dim', pin && i >= 0 && k !== i);
      });
    }

    /* BAR */
    const barCtx = $<HTMLCanvasElement>('#barChart');
    const barChart = new Chart(barCtx, {
      type: 'bar',
      data: {
        labels: retYears.map(String),
        datasets: [{
          data: retYears.map((y) => annualReturns[y]),
          backgroundColor: retYears.map((y) => (annualReturns[y] < 0 ? 'rgba(199,80,62,.85)' : 'rgba(31,138,107,.85)')),
          hoverBackgroundColor: retYears.map((y) => (annualReturns[y] < 0 ? '#C7503E' : '#1F8A6B')),
          borderRadius: 2, borderSkipped: false, maxBarThickness: 22,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        animation: REDUCED ? false : { duration: 800, easing: 'easeOutQuart', delay: (c: any) => (c.type === 'data' ? c.dataIndex * 18 : 0) },
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: false,
            external: (c: any) => externalTooltip(c, (tt: any) => {
              const i = tt.dataPoints[0].dataIndex, y = retYears[i], v = annualReturns[y];
              return `<div class="tt-title">พ.ศ. ${y}</div><div class="tt-main ${signCls(v)}">${signTxt(v)}%</div>`;
            }),
          },
        },
        onHover: (_e: any, a: any[]) => highlightCell(a.length ? retYears[a[0].index] : null),
        scales: {
          x: {
            grid: { display: false }, border: { color: C.line },
            ticks: {
              maxRotation: 0, autoSkip: false, color: C.muted, font: { size: 9 },
              callback: (_v: any, i: number) => (retYears[i] % 2 !== 0 ? retYears[i] : ''),
            },
          },
          y: {
            grid: { color: (ctx: any) => (ctx.tick.value === 0 ? 'rgba(12,30,48,.25)' : 'rgba(12,30,48,.05)') },
            border: { display: false },
            ticks: { color: C.muted, font: { size: 10, family: "'IBM Plex Sans Thai', sans-serif" }, callback: (v: any) => v + '%' },
          },
        },
      },
    } as any);

    /* TABLE */
    $<HTMLTableRowElement>('#tblYears').innerHTML =
      '<th class="rowlabel">ปี พ.ศ.</th>' + retYears.map((y) => `<th data-y="${y}">${y}</th>`).join('');
    $<HTMLTableRowElement>('#tblVals').innerHTML =
      '<td class="rowlabel">ผลตอบแทน</td>' +
      retYears
        .map((y) => {
          const v = annualReturns[y];
          return `<td class="val ${v < 0 ? 'neg' : 'pos'}" data-y="${y}">${signTxt(v)}</td>`;
        })
        .join('');
    function highlightCell(y: number | null) {
      root!.querySelectorAll('table.perf .hl').forEach((el) => el.classList.remove('hl'));
      if (y == null) return;
      root!.querySelectorAll(`table.perf [data-y="${y}"]`).forEach((el) => el.classList.add('hl'));
    }
    const tbl = $<HTMLTableElement>('table.perf');
    const onTblOver = (e: Event) => {
      const c = (e.target as HTMLElement).closest('[data-y]') as HTMLElement | null;
      if (c) highlightCell(+(c.dataset.y as string));
    };
    const onTblLeave = () => highlightCell(null);
    tbl.addEventListener('mouseover', onTblOver);
    tbl.addEventListener('mouseleave', onTblLeave);

    /* CLEANUP — destroy charts & purge imperative DOM (StrictMode-safe) */
    return () => {
      lineChart.destroy();
      donutChart.destroy();
      barChart.destroy();
      tbl.removeEventListener('mouseover', onTblOver);
      tbl.removeEventListener('mouseleave', onTblLeave);
      evWrap.innerHTML = '';
      legendEl.innerHTML = '';
      $<HTMLDivElement>('#allocSummary').innerHTML = '';
      $<HTMLTableRowElement>('#tblYears').innerHTML = '';
      $<HTMLTableRowElement>('#tblVals').innerHTML = '';
      ttEl.remove();
    };
  }, []);

  return (
    <div className="factsheet" ref={rootRef}>
      <div className="sheet">
        {/* HEADER */}
        <header className="head">
          <div className="head-brand">
            <img className="head-logo" src="/global-saving/logo.png" alt="Global Savings Plus 15/8" width={58} height={58} />
            <div>
              <p className="h-eyebrow">ดัชนีอ้างอิงหลายสินทรัพย์ · ควบคุมความผันผวน</p>
              <h1 className="h-title">Citi Grandmaster RC&nbsp;5 Index</h1>
            </div>
          </div>
          <div className="h-metrics">
            <div className="hm"><div className="v">4.15<span className="u">%</span></div><div className="l">ผลตอบแทนเฉลี่ยต่อปี</div></div>
            <div className="hm"><div className="v">4.08<span className="u">%</span></div><div className="l">ความผันผวนเฉลี่ยต่อปี</div></div>
            <div className="hm gold"><div className="v">1.02</div><div className="l">Sharpe ratio</div></div>
          </div>
        </header>

        <div className="body">
          <div className="main-grid">
            {/* ALLOCATION */}
            <section className="panel-alloc">
              <div className="panel-title"><span className="n">I</span><h2>สัดส่วนการลงทุนเฉลี่ย</h2></div>
              <div className="alloc-summary" id="allocSummary" />
              <div className="alloc-row">
                <div className="donut-wrap">
                  <canvas
                    id="donutChart"
                    role="img"
                    aria-label="แผนภูมิวงแหวนแสดงสัดส่วนการลงทุนเฉลี่ยแยกตามกลุ่มสินทรัพย์ ดูค่าแต่ละกลุ่มได้จากรายการข้างเคียง"
                  />
                  <div className="donut-center" id="donutCenter">
                    <div className="dc-top">รวมทั้งพอร์ต</div>
                    <div className="dc-val">100<span className="u">%</span></div>
                    <div className="dc-name">9 กลุ่มสินทรัพย์</div>
                  </div>
                </div>
                <div className="legend" id="legend" />
              </div>
              <p className="note">ข้อมูลเฉลี่ย ม.ค. 2548 – เม.ย. 2569 · ชี้/คลิกเพื่อดูรายตัว</p>
            </section>

            {/* INDEX LINE */}
            <section className="panel-index">
              <div className="panel-title"><span className="n">II</span><h2>การเคลื่อนไหวของราคาดัชนี</h2></div>
              <div className="chart-line-wrap">
                <canvas
                  id="lineChart"
                  role="img"
                  aria-label="กราฟเส้นแสดงการเคลื่อนไหวของดัชนี Citi Grandmaster RC 5 เริ่มต้นที่ 100 จุด ณ ธ.ค. 2545 ข้อมูลตั้งแต่ พ.ค. 2565 เป็นผลตอบแทนจริง ก่อนหน้านั้นเป็นการจำลองย้อนหลัง"
                />
                <div className="ev-labels" />
              </div>
              <p className="note">ดัชนีเริ่ม 100 จุด ณ ธ.ค. 2545 · คำนวณจากผลตอบแทนรายปีด้านล่าง</p>
            </section>
          </div>

          {/* ANNUAL RETURNS */}
          <section className="annual">
            <div className="panel-title">
              <span className="n">III</span>
              <h2>ผลตอบแทนรายปี <span style={{ fontWeight: 400, fontSize: '11px', color: 'var(--muted-2)' }}>(% ต่อปี)</span></h2>
            </div>
            <div className="chart-bar-wrap">
              <canvas
                id="barChart"
                role="img"
                aria-label="กราฟแท่งแสดงผลตอบแทนรายปีเป็นเปอร์เซ็นต์ ดูค่าตัวเลขทั้งหมดได้จากตารางด้านล่าง"
              />
            </div>
            <div className="table-scroll">
              <table className="perf">
                <thead><tr id="tblYears" /></thead>
                <tbody><tr id="tblVals" /></tbody>
              </table>
            </div>
          </section>

          {/* FOOTER */}
          <footer className="foot">
            <div>
              <div className="notes">ผลการดำเนินงานในอดีตมิได้เป็นสิ่งยืนยันหรือตัวชี้วัดผลการดำเนินงานในอนาคต · ตัวเลขผลตอบแทนเป็นค่าก่อนปรับด้วยอัตราการมีส่วนร่วมในผลตอบแทนที่เกิดจากการเปลี่ยนแปลงของดัชนี · ข้อมูลตั้งแต่ พ.ค. 2565 เป็นผลตอบแทนจริง ก่อนหน้านั้นเป็นการจำลองย้อนหลัง (Backtesting)</div>
              <div className="src">ที่มา: เอกสารข้อมูล Citi Grandmaster RC 5 Index</div>
              <a
                className="src-link"
                href="https://www.krungthai-axa.co.th/th/products/performance/global-saving-plus-15-8"
                target="_blank"
                rel="noopener noreferrer"
              >
                เอกสารข้อมูลดัชนี · ผลการดำเนินงานแบบเรียลไทม์ (กรุงไทย-แอกซา) ↗
              </a>
            </div>
            <a
              className="qr-ph"
              href="https://www.krungthai-axa.co.th/th/products/performance/global-saving-plus-15-8"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="เปิดเอกสารข้อมูลดัชนีและผลการดำเนินงานแบบเรียลไทม์ที่เว็บไซต์กรุงไทย-แอกซา"
            >
              ดูดัชนี<br />เรียลไทม์ ↗
            </a>
          </footer>
        </div>
      </div>
    </div>
  );
}
