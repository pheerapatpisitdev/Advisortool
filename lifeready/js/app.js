// LifeReady — UI logic: build form, recalc, render, two-page flow. Uses window.DATA/CV/LR + config.js globals.
function segBtn(v,label,on){ return '<button type="button" role="radio" data-v="'+v+'" aria-checked="'+(on?'true':'false')+'" class="'+(on?'on':'')+'">'+label+'</button>'; }
function planShort(th){ return th.replace(/^ชำระเบี้ย\s*/,'').replace(/\s*Package$/,''); }
function buildSelects(){
  var ag=$('age'); if(ag){ var ao=''; for(var a=0;a<=80;a++){ ao+='<option value="'+a+'"'+(a===35?' selected':'')+'>'+a+'</option>'; } ag.innerHTML=ao; }
  var modeOrder=['รายเดือน','ราย 6 เดือน','รายปี'];
  $('modeSeg').innerHTML = modeOrder.map(function(name){ return DATA.modes.find(function(m){ return m.th===name; }); }).filter(Boolean).map(function(m){ return segBtn(m.th, m.th, m.th===STATE.mode); }).join('');
  $('planSeg').innerHTML = DATA.pptPlans.filter(function(p){ return p.seq<=4; }).map(function(p){ return segBtn(p.seq, planShort(p.th), String(p.seq)===String(STATE.seq)); }).join('');
}
function buildRiders(){
  var b=$('riderBody'); b.innerHTML='';
  RIDERS.forEach(function(r){
    var tr=document.createElement('tr'); tr.id='r_'+r.key;
    tr.innerHTML='<td><input type="checkbox" id="ck_'+r.key+'"></td>'+
      '<td><label class="rname" for="ck_'+r.key+'">'+r.name+'</label><br><span class="rdesc">'+r.desc+'</span><span class="rnote" id="note_'+r.key+'"></span></td>'+
      '<td id="ctl_'+r.key+'"></td>';
    b.appendChild(tr);
    $('ck_'+r.key).addEventListener('change',recalc);
  });
}
function ctlHTML(r,i){
  var v=STATE.riders[r.key]||{};
  if(r.ctl==='buy') return '<span class="muted" style="font-size:12px">เลือกช่องด้านซ้ายเพื่อซื้อ</span>';
  if(r.ctl==='pb') return '<select class="rin" id="in_pb_type"><option>PB Beyond</option><option>PB Fit</option></select>';
  if(r.ctl==='sa'||r.ctl==='saUnit') return '<input class="rin" type="number" id="in_'+r.key+'" value="'+(v.sa||r.smin||'')+'" step="10000"><div class="az-hint" id="hint_'+r.key+'"></div>';
  if(r.ctl==='planMEB'){ var o=MEB_PLANS(i.age).map(function(p){return '<option value="'+p+'">'+fmt0(p)+' บาท/วัน</option>'}).join(''); return '<select class="rin" id="in_'+r.key+'">'+o+'</select>'; }
  if(r.ctl==='planMHP'){ var o=MHP_PLANS(i.age).map(function(p){return '<option value="'+p[0]+'">'+p[1]+'</option>'}).join('');
    return '<select class="rin" id="in_mhp_plan">'+o+'</select><select class="rin" id="in_mhp_area" style="margin-top:4px"><option>ประเทศไทย</option><option>เอเชีย</option><option>ทั่วโลก</option></select><select class="rin" id="in_mhp_cov" style="margin-top:4px"><option value="Full">Full Coverage</option><option value="Deductible">มีความรับผิดส่วนแรก</option><option value="Copay">ร่วมจ่าย</option></select>'; }
  return '';
}
function numVal(id){ var e=$(id); return e?(parseFloat(String(e.value).replace(/,/g,''))||0):0; }
function getInputs(){ return { age:parseInt($('age').value)||0, sex:STATE.sex, mode:STATE.mode, seq:parseInt(STATE.seq), mainSA:numVal('mainSA'), occ:($('occ')?parseInt($('occ').value):1) }; }
function readRider(r,i){
  if(!$('ck_'+r.key) || !$('ck_'+r.key).checked) return null;
  if(r.ctl==='buy') return {buy:true};
  if(r.ctl==='pb'){ var t=$('in_pb_type'); return {buy:true, type:t?t.value:'PB Beyond', payerAge:parseInt($('payerAge').value)||0, payerSex:STATE.payerSex}; }
  if(r.ctl==='sa'||r.ctl==='saUnit'){ var el=$('in_'+r.key); return {sa:el?parseFloat(el.value)||0:0}; }
  if(r.ctl==='planMEB'){ var el=$('in_meb'); return {plan:el?parseInt(el.value):500}; }
  if(r.ctl==='planMHP'){ var p=$('in_mhp_plan'),a=$('in_mhp_area'),c=$('in_mhp_cov'); return {plan:p?parseInt(p.value):1, area:a?a.value:'ประเทศไทย', coverage:c?c.value:'Full'}; }
  return null;
}
function eligible(r,i){ return i.age>=r.min && i.age<=r.max; }
function planName(seq){ var p=DATA.pptPlans[seq-1]; return p?p.th:'-'; }
function matchRider(x,key){ var map={pb:'PB',wp:'WP',ap:'AP',ecare:'ECARE',meb:'MEB',dci:'DCI',pls:'PLS',mhp:'iHealthy',ci123:'CI 123'}; return x.name.indexOf(map[key])>=0; }
function amountLabel(r,v){
  if(r.key==='mhp') return 'แผน '+(['','Smart','Bronze','Silver','Gold','Diamond','Platinum'][v.plan]||v.plan)+' / '+v.area;
  if(r.key==='meb') return fmt0(v.plan)+' บาท/วัน';
  if(r.key==='pb') return v.type+' (ผู้ชำระ '+v.payerAge+' ปี)';
  if(r.key==='wp') return 'ยกเว้นเบี้ยฯ';
  if(v.sa) return fmt0(v.sa)+' บาท';
  return '-';
}

var LAST=null;
function recalc(){
  var i=getInputs();
  RIDERS.forEach(function(r){
    var checked=$('ck_'+r.key)&&$('ck_'+r.key).checked;
    var row=$('r_'+r.key); if(row) row.classList.toggle('is-selected',!!checked);
    STATE.riders[r.key]=readRider(r,i)||STATE.riders[r.key]||{};
    var ctl=$('ctl_'+r.key);
    if(ctl && (!ctl.dataset.age || ctl.dataset.age!=String(i.age) || ctl.innerHTML==='')){
      ctl.innerHTML=ctlHTML(r,i); ctl.dataset.age=String(i.age);
      ctl.querySelectorAll('input,select').forEach(function(e){e.addEventListener('input',recalc);e.addEventListener('change',recalc);});
    }
  });
  $('pbExtra').style.display=($('ck_pb')&&$('ck_pb').checked)?'flex':'none';

  var inp=getInputs();
  RIDERS.forEach(function(r){
    if(!$('ck_'+r.key)||!$('ck_'+r.key).checked){ if($('note_'+r.key))$('note_'+r.key).textContent=''; return; }
    var rd=readRider(r,inp); if(!rd) return;
    var note='';
    if(!eligible(r,inp)) note='อายุไม่อยู่ในเกณฑ์ ('+r.min+'-'+r.max+' ปี)';
    else if((r.ctl==='sa'||r.ctl==='saUnit') && rd.sa){
      var mn=r.smin||0, mx=r.smax?r.smax(inp):Infinity;
      if(rd.sa<mn) note='ขั้นต่ำ '+fmt0(mn)+' บาท'; else if(rd.sa>mx) note='สูงสุด '+fmt0(mx)+' บาท';
    }
    if($('note_'+r.key)) $('note_'+r.key).textContent=note;
    inp[r.key]=note?null:rd;
    var h=$('hint_'+r.key); if(h && r.ctl==='sa') h.textContent='ทุน '+fmt0(r.smin||0)+' – '+fmt0(r.smax?r.smax(inp):0);
  });
  var res=LR.calc(DATA,CV,inp); LAST={res:res,inp:inp};
  // live feedback on input page
  var rateTxt=res.main.ok?(+res.main.rate.toFixed(4)):0;
  $('mainNote').textContent=res.main.ok?('รหัสแผน '+res.main.plancode+' · ชำระเบี้ย '+res.main.payYear+' ปี · อัตรา '+rateTxt+' /พันบาท'+(res.main.disc?(' · ส่วนลดทุนสูง '+res.main.disc):'')):('อายุ '+inp.age+' ปี ไม่อยู่ในเกณฑ์รับประกันของแผนนี้');
  if($('lrCaseSummary')) $('lrCaseSummary').innerHTML='<strong>LifeReady</strong> / '+inp.sex+' / '+inp.age+' ปี / '+planName(inp.seq);
  if($('lrLiveTotal')) $('lrLiveTotal').textContent=res.main.ok?(fmt(res.modeTotal)+' บาท'):'—';
  // keep the main-premium field in sync (unless the user is typing in it)
  if($('mainPrem') && document.activeElement!==$('mainPrem')) $('mainPrem').value = res.main.ok ? fmt(res.main.mode) : '';
  if($('page-result').style.display!=='none') render(res,inp);
}

function render(res,inp){
  $('warnBox').innerHTML = res.main.ok?'':('<div class="warn">อายุ '+inp.age+' ปี ไม่อยู่ในเกณฑ์รับประกันของแผน “'+planName(inp.seq)+'” (รับอายุ '+res.main.amin+'–'+res.main.amax+' ปี) — กรุณากลับไปเลือกแผนหรือแก้ไขอายุ</div>');
  var body='<tr class="main"><td><span class="rn">สัญญาหลัก — ไลฟ์เรดดี้</span><br><span class="rd">'+(res.main.ok?('รหัส '+res.main.plancode+' · ชำระเบี้ย '+res.main.payYear+' ปี'):'')+'</span></td><td class="amt">'+fmt0(inp.mainSA)+' บาท</td><td class="pm">'+(res.main.ok?fmt(res.main.mode):'ไม่คุ้มครอง')+'</td></tr>';
  var nR=0;
  RIDERS.forEach(function(r){ if(!inp[r.key]) return; var rr=res.riders.find(function(x){return matchRider(x,r.key)}); if(!rr) return; nR++;
    body+='<tr><td><span class="rn">'+r.name+'</span><br><span class="rd">'+r.desc+'</span></td><td class="amt">'+amountLabel(r,inp[r.key])+'</td><td class="pm">'+fmt(rr.mode)+'</td></tr>'; });
  if(!nR) body+='<tr><td colspan="3" class="muted" style="text-align:center;padding:12px">ไม่ได้เลือกสัญญาเพิ่มเติม</td></tr>';
  $('bkBody').innerHTML=body;
  var riderSum=res.riders.reduce(function(s,x){return s+x.mode},0);
  $('bkFoot').innerHTML='<tr class="sub"><td colspan="2">รวมเบี้ยสัญญาเพิ่มเติม</td><td>'+fmt(riderSum)+' บาท</td></tr>'+
    '<tr class="grand"><td colspan="2">เบี้ยรวมต่องวด ('+inp.mode+')</td><td>'+fmt(res.modeTotal)+' บาท</td></tr>'+
    '<tr class="ann"><td colspan="2">เทียบเท่าเบี้ยรายปี</td><td>'+fmt(res.annualTotal)+' บาท/ปี</td></tr>';
  // KPI strip — reuses the totals already computed above (res.modeTotal / res.main), never recomputed
  var kT=$('kTotal');
  if(kT){
    kT.textContent=fmt(res.modeTotal)+' บาท';
    $('kTotalSub').textContent='งวด'+inp.mode;
    $('kMainSA').textContent=fmt0(inp.mainSA)+' บาท';
    $('kMainPrem').textContent=res.main.ok?(fmt(res.main.mode)+' บาท'):'ไม่คุ้มครอง';
  }
  if($('lrResultSubtitle')) $('lrResultSubtitle').textContent=inp.sex+' อายุ '+inp.age+' ปี · ทุนประกัน '+fmt0(inp.mainSA)+' บาท · '+planName(inp.seq)+' · '+inp.mode;
  renderBenefit(res,inp); renderCV(res,inp);
}
function renderBenefit(res,inp){
  var rows=[['<td class="cat" colspan="2">ความคุ้มครองสัญญาหลัก</td>'],
    ['<td>แบบประกันและระยะเวลาชำระเบี้ย</td><td>'+planName(inp.seq)+'</td>'],
    ['<td>กรณีเสียชีวิต (จำนวนเงินเอาประกันภัย)</td><td>'+fmt0(inp.mainSA)+' บาท</td>'],
    ['<td>ครบกำหนดสัญญา (อายุครบ 99 ปี)</td><td>'+fmt0(inp.mainSA)+' บาท</td>']];
  var rd=[];
  RIDERS.forEach(function(r){
    if(!inp[r.key]) return;
    rd.push('<td>'+r.name+' — '+r.desc+'</td><td>'+amountLabel(r,inp[r.key])+'</td>');
  });
  if(rd.length){ rows.push(['<td class="cat" colspan="2">ความคุ้มครองสัญญาเพิ่มเติม</td>']); rd.forEach(function(x){rows.push([x])}); }
  $('benefitTbl').innerHTML='<thead><tr><th>ความคุ้มครองและผลประโยชน์</th><th>จำนวนเงิน / รายละเอียด</th></tr></thead><tbody>'+rows.map(function(r){return '<tr>'+r[0]+'</tr>'}).join('')+'</tbody>';
  if($('dciSummary')){
    if(inp.dci){
      var dciR=res.riders.find(function(x){return x.name.indexOf('DCI')>=0;});
      var dciSA=inp.dci.sa||0;
      var dciPrem=dciR?dciR.annual:0;
      var prem2=Number(dciPrem).toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2});
      var spec=function(l,v){return '<div class="dci-spec"><span class="dci-spec__lbl">'+l+'</span><span class="dci-spec__val">'+v+'</span></div>';};
      $('dciSummary').innerHTML=
        '<section class="dci-doc" aria-labelledby="dciDocTitle">'+
          '<h3 class="dci-doc__title" id="dciDocTitle">คุ้มครองเสียชีวิตและโรคร้ายแรง 31 โรค (DCI)</h3>'+
          '<div class="dci-doc__specs">'+
            spec('ระยะเวลาคุ้มครอง','1 ปี')+
            spec('ระยะเวลาชำระเบี้ย','1 ปี')+
            spec('จำนวนเงินเอาประกันภัย', fmt0(dciSA)+' บาท')+
            spec('เบี้ยประกันภัย', prem2+' บาท')+
          '</div>'+
          '<p class="dci-doc__desc">กรณีแพทย์วินิจฉัยว่าเป็นโรคร้ายแรง 1 ใน 31 โรค หรือเสียชีวิตภายในระยะเวลา 1 ปี จะได้รับเงินจำนวน <b>'+fmt0(dciSA)+'</b> บาท</p>'+
          '<p class="dci-doc__subhead">31 โรคร้ายแรงประกอบด้วย</p>'+
          '<ol class="dci-doc__list">'+DCI_DISEASES.map(function(name){return '<li>'+name+'</li>';}).join('')+'</ol>'+
          '<p class="dci-doc__note">*ผู้เอาประกันที่อายุ 56 ปีขึ้นไป ต้องตรวจสุขภาพโดยแพทย์แต่งตั้งของบริษัททุกราย</p>'+
        '</section>';
    } else $('dciSummary').innerHTML='';
  }
}
var CV_DIFF_VISIBLE=true;
function applyCVDiffVisibility(){
  document.querySelectorAll('.cv-diff-col').forEach(function(el){el.classList.toggle('cv-diff-col--hidden',!CV_DIFF_VISIBLE);});
  var btn=$('cvDiffToggle'),lbl=$('cvDiffToggleLabel'),icon=btn&&btn.querySelector('.cv-diff-toggle__icon');
  if(btn) btn.setAttribute('aria-pressed',CV_DIFF_VISIBLE?'true':'false');
  if(lbl) lbl.textContent=CV_DIFF_VISIBLE?'ซ่อนคอลัมน์ส่วนต่าง':'แสดงคอลัมน์ส่วนต่าง';
  if(icon) icon.textContent=CV_DIFF_VISIBLE?'−':'+';
}
function toggleCVDiff(){ CV_DIFF_VISIBLE=!CV_DIFF_VISIBLE; applyCVDiffVisibility(); }
function renderCV(res,inp){
  $('cvSA').textContent=fmt0(inp.mainSA);
  var rows=res.main.ok?LR.cashValues(DATA,CV,inp,res.main):[];
  var payYear=res.main.ok?res.main.payYear:0;
  var thead='<thead><tr><th>อายุ</th><th>ปี</th><th>เบี้ยประกัน</th><th>เบี้ยประกันสะสม</th><th>มูลค่าเวนคืน</th><th class="cv-diff-col">ส่วนต่าง<br><span class="th-sub">(เวนคืน − เบี้ยสะสม)</span></th><th>ทุนประกัน</th></tr></thead>';
  var cum=0, breakeven=false, beAge=null, pts=[], rowsHtml=[];
  rows.forEach(function(r){
    var prem=r.year<=payYear?res.main.annual:0; cum+=prem;
    var diff=r.surrender-cum;
    var mark='', rowcls='';
    if(!breakeven && cum>0 && diff>=0){ breakeven=true; beAge=r.age; mark=' <span class="be">จุดคุ้มทุน</span>'; rowcls=' class="be-row"'; }
    var diffTxt='<span class="'+(diff>=0?'gain':'loss')+'">'+(diff>=0?'+':'−')+fmt0(Math.abs(Math.round(diff)))+'</span>';
    rowsHtml.push('<tr'+rowcls+'><td>'+r.age+'</td><td>'+r.year+'</td><td>'+(prem>0?fmt0(Math.round(prem)):'')+mark+'</td><td>'+fmt0(Math.round(cum))+'</td><td>'+fmt0(Math.round(r.surrender))+'</td><td class="cv-diff-col">'+diffTxt+'</td><td>'+fmt0(inp.mainSA)+'</td></tr>');
    pts.push({year:r.year, age:r.age, cum:cum, surr:r.surrender, sa:inp.mainSA, diff:diff});
  });
  var body=rowsHtml.length?rowsHtml.join(''):'<tr><td colspan="7" style="text-align:center;padding:20px" class="muted">ไม่มีข้อมูลมูลค่ากรมธรรม์สำหรับแผนนี้</td></tr>';
  $('cvTbl').innerHTML=thead+'<tbody>'+body+'</tbody>';
  // print twin: split the rows into 2–3 side-by-side columns so the whole table fits one A4 page
  if($('cvPrint')){
    if(rowsHtml.length){
      var theadP='<thead><tr><th>อายุ</th><th>ปี</th><th>เบี้ยประกัน</th><th>เบี้ยสะสม</th><th>เวนคืน</th><th class="cv-diff-col">ส่วนต่าง</th><th>ทุนประกัน</th></tr></thead>';
      var nCols=Math.max(2,Math.ceil(rowsHtml.length/33)), perCol=Math.ceil(rowsHtml.length/nCols), cols='';
      for(var c=0;c<nCols;c++) cols+='<div><table class="cv-table">'+theadP+'<tbody>'+rowsHtml.slice(c*perCol,(c+1)*perCol).join('')+'</tbody></table></div>';
      $('cvPrint').className='print-split print-only'+(nCols>2?' cols3':'');
      $('cvPrint').innerHTML=cols;
    } else { $('cvPrint').innerHTML=''; }
  }
  if($('cvChart')){ $('cvChart').innerHTML = pts.length ? buildCVChart(pts, beAge) : ''; if(pts.length) attachCVChart(); }
  applyCVDiffVisibility();
}

// Interactive vanilla SVG line chart — 4 series over policy year/age, hover to read each year.
var CVCHART=null;
// series colours: distinct hues that stay legible on the light background
var CV_SERIES=[
  {key:'cum',  name:'เบี้ยสะสม',            color:'#f59e0b'},
  {key:'surr', name:'มูลค่าเวนคืนเงินสด',   color:'#2563eb'},
  {key:'sa',   name:'ความคุ้มครองเสียชีวิต', color:'#111827'}
];
function buildCVChart(pts, beAge){
  var W=900,H=380, L=66,R=20,T=20,B=58;
  var iw=W-L-R, ih=H-T-B;
  var n=pts.length;
  var xMin=1, xMax=Math.max(2, pts[n-1].year);
  var yMax=0, yMin=0;
  pts.forEach(function(p){ CV_SERIES.forEach(function(s){ var v=p[s.key]; yMax=Math.max(yMax,v); yMin=Math.min(yMin,v); }); });
  function niceCeil(v){ if(v<=0)return 0; var pw=Math.pow(10,Math.floor(Math.log10(v))); return Math.ceil(v/pw)*pw; }
  yMax=niceCeil(yMax); if(yMin<0) yMin=-niceCeil(-yMin);
  var X=function(yr){ return L+(yr-xMin)/(xMax-xMin)*iw; };
  var Y=function(v){ return T+(yMax-v)/(yMax-yMin)*ih; };
  // precompute pixel coords for interaction
  var P=pts.map(function(p){ var o={year:p.year,age:p.age,xPix:X(p.year),v:{},y:{}};
    CV_SERIES.forEach(function(s){ o.v[s.key]=p[s.key]; o.y[s.key]=Y(p[s.key]); }); return o; });

  var svg='<svg viewBox="0 0 '+W+' '+H+'" class="cv-chart" preserveAspectRatio="xMidYMid meet" role="img">';
  // y gridlines + labels
  var ticks=6;
  for(var i=0;i<=ticks;i++){ var yv=yMin+(yMax-yMin)*i/ticks; var yy=Y(yv); var zero=Math.abs(yv)<1e-6;
    svg+='<line x1="'+L+'" y1="'+yy+'" x2="'+(W-R)+'" y2="'+yy+'" stroke="'+(zero?'#9aa7b4':'#eef1f5')+'" stroke-width="'+(zero?1.3:1)+'"/>';
    svg+='<text x="'+(L-8)+'" y="'+(yy+3.5)+'" text-anchor="end" class="cv-ax">'+fmtK(yv)+'</text>';
  }
  // x ticks: year (top) + age (bottom)
  var step=Math.max(1, Math.round((xMax-xMin)/9));
  var lastYr=pts[n-1].year, issueAge=pts[0].age-pts[0].year+1;
  var xs=[]; for(var yr=xMin;yr<=xMax;yr+=step) xs.push(yr); if(xs[xs.length-1]!==lastYr) xs.push(lastYr);
  xs.forEach(function(yr){ var xx=X(yr); var ag=issueAge+yr-1;
    svg+='<line x1="'+xx+'" y1="'+T+'" x2="'+xx+'" y2="'+(T+ih)+'" stroke="#f4f7fa" stroke-width="1"/>';
    svg+='<text x="'+xx+'" y="'+(T+ih+17)+'" text-anchor="middle" class="cv-ax">'+yr+'</text>';
    svg+='<text x="'+xx+'" y="'+(T+ih+30)+'" text-anchor="middle" class="cv-ax-age">'+ag+'ปี</text>';
  });
  svg+='<text x="'+(L+iw/2)+'" y="'+(H-4)+'" text-anchor="middle" class="cv-ax-t">สิ้นปีกรมธรรม์ที่ (อายุ)</text>';
  // break-even marker
  if(beAge!=null){ var beYr=beAge-issueAge+1; var bx=X(beYr);
    svg+='<line x1="'+bx+'" y1="'+T+'" x2="'+bx+'" y2="'+(T+ih)+'" stroke="#0f8a4d" stroke-width="1.3" stroke-dasharray="4 3"/>';
    svg+='<text x="'+bx+'" y="'+(T-5)+'" text-anchor="middle" class="cv-be">จุดคุ้มทุน · อายุ '+beAge+'</text>';
  }
  // series polylines
  CV_SERIES.forEach(function(s){
    var d=P.map(function(p){ return p.xPix.toFixed(1)+','+p.y[s.key].toFixed(1); }).join(' ');
    svg+='<polyline points="'+d+'" fill="none" stroke="'+s.color+'" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>';
  });
  // hover cursor + dots (hidden until hover)
  svg+='<g class="cv-cursor" style="display:none">';
  svg+='<line class="cv-cur-line" x1="0" y1="'+T+'" x2="0" y2="'+(T+ih)+'"/>';
  CV_SERIES.forEach(function(s){ svg+='<circle class="cv-dot" data-k="'+s.key+'" r="4" cx="0" cy="0" fill="'+s.color+'"/>'; });
  svg+='</g>';
  // transparent hit area
  svg+='<rect class="cv-hit" x="'+L+'" y="'+T+'" width="'+iw+'" height="'+ih+'" fill="transparent"/>';
  svg+='</svg>';

  // top legend (with live values) + hint + tooltip
  var last=P[n-1];
  var lg='<div class="cv-legend">'+CV_SERIES.map(function(s){
    return '<span class="lg"><i style="background:'+s.color+'"></i>'+s.name+' <b class="cv-lval" data-k="'+s.key+'">'+fmt0(Math.round(last.v[s.key]))+'</b></span>';
  }).join('')+'</div>';
  var hint='<div class="cv-hint">เลื่อนเมาส์หรือนิ้วบนกราฟเพื่อดูตัวเลขแต่ละปี</div>';
  var tip='<div class="cv-tip" style="display:none"></div>';

  CVCHART={ P:P, geom:{W:W,H:H,L:L,R:R,T:T,ih:ih,iw:iw}, issueAge:issueAge };
  return lg+hint+'<div class="cv-plot">'+svg+tip+'</div>';
}
function fmtK(v){ var n=Math.round(v); if(Math.abs(n)>=1000) return (n/1000).toLocaleString('en-US',{maximumFractionDigits:1})+'k'; return String(n); }

// Wire pointer interaction after the chart HTML is in the DOM.
function attachCVChart(){
  var wrap=$('cvChart'); if(!wrap||!CVCHART) return;
  var svg=wrap.querySelector('svg.cv-chart'), hit=wrap.querySelector('.cv-hit'),
      cursor=wrap.querySelector('.cv-cursor'), curLine=wrap.querySelector('.cv-cur-line'),
      tip=wrap.querySelector('.cv-tip'), plot=wrap.querySelector('.cv-plot');
  if(!svg||!hit) return;
  var G=CVCHART.geom, P=CVCHART.P;
  function nearest(vbx){ var best=P[0],bd=Infinity; for(var i=0;i<P.length;i++){ var dd=Math.abs(P[i].xPix-vbx); if(dd<bd){bd=dd;best=P[i];} } return best; }
  function show(p){
    cursor.style.display='';
    curLine.setAttribute('x1',p.xPix); curLine.setAttribute('x2',p.xPix);
    cursor.querySelectorAll('.cv-dot').forEach(function(c){ var k=c.getAttribute('data-k'); c.setAttribute('cx',p.xPix); c.setAttribute('cy',p.y[k]); });
    // legend live values
    wrap.querySelectorAll('.cv-lval').forEach(function(b){ var k=b.getAttribute('data-k'); var val=p.v[k]; b.textContent=(val<0?'−':'')+fmt0(Math.abs(Math.round(val))); b.style.color=(k==='diff')?(val>=0?'#0f8a4d':'#c0392b'):''; });
    // tooltip
    var rows=CV_SERIES.map(function(s){ var val=p.v[s.key]; var col=(s.key==='diff')?(val>=0?'#0f8a4d':'#c0392b'):s.color;
      return '<div class="r"><span><i style="background:'+s.color+'"></i>'+s.name+'</span><b style="color:'+col+'">'+(val<0?'−':'')+fmt0(Math.abs(Math.round(val)))+'</b></div>'; }).join('');
    tip.innerHTML='<div class="h">อายุ '+p.age+' ปี · สิ้นปีที่ '+p.year+'</div>'+rows;
    tip.style.display='';
    // position tooltip (convert viewBox px -> plot px)
    var rect=svg.getBoundingClientRect(); var sx=rect.width/G.W;
    var leftPx=p.xPix*sx, tipW=tip.offsetWidth||220;
    if(leftPx+14+tipW > rect.width) leftPx=leftPx-tipW-14; else leftPx=leftPx+14;
    leftPx=Math.max(4,Math.min(leftPx, rect.width-tipW-4));
    tip.style.left=leftPx+'px'; tip.style.top=(G.T*sx+6)+'px';
  }
  function hide(){ cursor.style.display='none'; tip.style.display='none';
    wrap.querySelectorAll('.cv-lval').forEach(function(b){ var k=b.getAttribute('data-k'); var val=P[P.length-1].v[k]; b.textContent=(val<0?'−':'')+fmt0(Math.abs(Math.round(val))); b.style.color=(k==='diff')?(val>=0?'#0f8a4d':'#c0392b'):''; });
  }
  function move(ev){ var t=ev.touches&&ev.touches[0]; var cx=t?t.clientX:ev.clientX;
    var rect=svg.getBoundingClientRect(); var vbx=(cx-rect.left)/rect.width*G.W; show(nearest(vbx)); if(t) ev.preventDefault(); }
  hit.addEventListener('mousemove',move);
  hit.addEventListener('mouseleave',hide);
  svg.addEventListener('touchstart',move,{passive:false});
  svg.addEventListener('touchmove',move,{passive:false});
  svg.addEventListener('touchend',hide);
}

// Reverse-solve: given a target main-plan premium PER MODE, find the sum assured.
// rate & high-SA discount both depend on SA (seq 3/4 switch plancode at 300k), so iterate.
function saFromPremium(inp, targetModePrem){
  var factor=1; DATA.modes.forEach(function(mm){ if(mm.th===inp.mode) factor=mm.factor; });
  if(!targetModePrem || targetModePrem<=0 || !factor) return 0;
  var annualTarget=targetModePrem/factor;
  var sa=annualTarget*1000/55, prev=-1; // seed assuming rate ~55 /พันบาท
  for(var it=0; it<14; it++){
    var m=LR.calcMain(DATA, Object.assign({}, inp, {mainSA:Math.max(sa,1000)}));
    if(!m || m.rate==null || m.rate===0) return 0;
    var denom=m.rate-(m.disc||0);
    if(denom<=0) return 0;
    var next=annualTarget/denom*1000;
    if(Math.abs(next-prev)<1){ sa=next; break; }
    prev=sa; sa=next;
  }
  return Math.round(sa/1000)*1000; // round to nearest 1,000 บาท
}

function goResult(){ recalc(); render(LAST.res,LAST.inp); $('page-input').style.display='none'; $('page-result').style.display='block'; window.scrollTo(0,0);
  if($('stepA')) $('stepA').classList.remove('az-active');
  if($('stepB')) $('stepB').classList.add('az-active');
  if($('stepBar')) $('stepBar').classList.add('az-done');
}
function goInput(){ $('page-result').style.display='none'; $('page-input').style.display='block'; window.scrollTo(0,0);
  if($('stepB')) $('stepB').classList.remove('az-active');
  if($('stepA')) $('stepA').classList.add('az-active');
  if($('stepBar')) $('stepBar').classList.remove('az-done');
}
// iOS/iPadOS cannot print from a "Add to Home Screen" web app (standalone mode) —
// window.print() is a silent no-op there. Detect it and guide the user to open in
// Safari; otherwise defer the call so Safari reliably opens the print/AirPrint sheet.
function printResult(){
  var standalone = (window.navigator.standalone === true) ||
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
  if (standalone) {
    alert('พิมพ์ / บันทึก PDF ไม่ได้เมื่อเปิดจากไอคอนบนหน้าจอโฮม\n\n' +
      'กรุณาเปิดหน้านี้ในแอป Safari (แตะแถบที่อยู่แล้วเปิดใน Safari) แล้วกดปุ่มพิมพ์อีกครั้ง — ' +
      'หรือใช้ปุ่มแชร์ของ Safari แล้วเลือก “พิมพ์” / “บันทึกไปยังไฟล์”');
    return;
  }
  setTimeout(function(){ try { window.print(); } catch (e) {} }, 0);
}

function initSeg(segId,stateKey){ $(segId).querySelectorAll('button').forEach(function(btn){ btn.addEventListener('click',function(){ $(segId).querySelectorAll('button').forEach(function(b){b.classList.remove('on');b.setAttribute('aria-checked','false');}); btn.classList.add('on'); btn.setAttribute('aria-checked','true'); STATE[stateKey]=btn.dataset.v; recalc(); }); }); }
window.addEventListener('DOMContentLoaded',function(){
  buildSelects(); buildRiders();
  initSeg('sexSeg','sex'); initSeg('payerSexSeg','payerSex');
  initSeg('modeSeg','mode'); initSeg('planSeg','seq');
  ['age','mainSA','occ','payerAge'].forEach(function(id){ var e=$(id); if(e){e.addEventListener('input',recalc);e.addEventListener('change',recalc);} });
  // live thousands-separator while typing in the money fields
  function groupCommas(el,allowDot){
    var raw=String(el.value).replace(allowDot?/[^0-9.]/g:/[^0-9]/g,'');
    if(raw===''){ el.value=''; return; }
    var parts=raw.split('.'); var dec=allowDot&&parts.length>1?'.'+parts.slice(1).join(''):'';
    var caretEnd = el.selectionStart===el.value.length;
    el.value=Number(parts[0]||0).toLocaleString('en-US')+dec;
    if(caretEnd){ el.selectionStart=el.selectionEnd=el.value.length; }
  }
  if($('mainSA')) $('mainSA').addEventListener('input',function(){ groupCommas($('mainSA'),false); });
  // เบี้ยสัญญาหลัก/งวด → คำนวณทุนประกันย้อนกลับ
  var mp=$('mainPrem');
  if(mp) mp.addEventListener('input',function(){
    groupCommas(mp,true);
    var inp=getInputs();
    var sa=saFromPremium(inp, numVal('mainPrem'));
    if(sa>0){ $('mainSA').value=fmt0(sa); recalc(); }
  });
  if($('cvDiffToggle')) $('cvDiffToggle').addEventListener('click',toggleCVDiff);
  recalc();
});
