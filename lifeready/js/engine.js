// =====================================================================
// LifeReady premium engine — validated 1:1 vs the source .xlsx.
// Do NOT change rounding/lookups without re-checking tests.
// =====================================================================
// LifeReady premium engine. DATA=out_premium.json, CV=out_cv.json
window.LR=(function(){
function rd(x,n){ if(x<0) return -rd(-x,n); var p=Math.pow(10,n); return Math.floor(x*p + 1e-7)/p; }
function rnd(x,n){ var p=Math.pow(10,n); return Math.round(x*p)/p; } // ROUND

function genderLetter(sexTH){ return (sexTH==='ชาย'||sexTH==='M'||sexTH==='Male')?'M':'F'; }

function planInfo(D, seq, age, sa){
  // returns {plancode, termkey, payYear, payTerm}
  var payYear, plancode;
  if(seq===1){payYear=6; plancode='W99FU06';}
  else if(seq===2){payYear=12; plancode='W99FU12';}
  else if(seq===3){payYear=18; plancode=(sa<300000?'W99FU18':'W99FH18');}
  else if(seq===4){payYear=99-age; plancode=(sa<300000?'W99FU99':'W99FH99');}
  else if(seq===5){payYear=99-age; plancode='W99F99H';}
  else if(seq===6){payYear=99-age; plancode='W99F99M';}
  return {plancode:plancode, termkey:D.plancodeTerm[plancode], payYear:payYear};
}

function highSADisc(D, termkey, sa){
  var col = termkey.substring(0,2); // '06','12','18','99'
  if(['06','12','18','99'].indexOf(col)<0) col='99';
  var disc=0;
  for(var i=0;i<D.highSADiscount.length;i++){
    var b=D.highSADiscount[i];
    if(sa>=b.sa){ disc=b[col]; }
  }
  return disc||0;
}

function modeObj(D, modeTH){
  for(var i=0;i<D.modes.length;i++) if(D.modes[i].th===modeTH) return D.modes[i];
  return D.modes[0];
}

// MAIN
function calcMain(D, inp){
  var g=genderLetter(inp.sex);
  var pi=planInfo(D, inp.seq, inp.age, inp.mainSA);
  var b13=pi.termkey+g;
  var rateArr=D.mainRate[b13];
  var rate = rateArr? rateArr[inp.age] : null;
  var plan=D.pptPlans[inp.seq-1];
  var amin=plan?plan.min:0, amax=plan?plan.max:70;
  if(inp.age<amin || inp.age>amax || rate==null || rate===0)
    return {ok:false, ineligible:true, amin:amin, amax:amax, annual:0, mode:0, base:0, rate:0, plancode:pi.plancode, payYear:pi.payYear, termkey:pi.termkey, gender:g};
  var disc=highSADisc(D, pi.termkey, inp.mainSA);
  var m=modeObj(D, inp.mode);
  var annual=rd((rate-disc)*rd(inp.mainSA/1000,3),2);
  var mode=rd(annual*m.factor,2);
  var saCap=Math.min(inp.mainSA,30000000);
  var base=rd((rate-disc)*rd(saCap/1000,3),2); // I13 base for WP/PB
  return {ok:true, annual:annual, mode:mode, base:base, rate:rate, disc:disc, plancode:pi.plancode, payYear:pi.payYear, termkey:pi.termkey, gender:g};
}

function occMul(occ){ return (occ===4||occ==='4')?1.5:1; }

// returns array of rider results
function calcRiders(D, inp, main){
  var g=main.gender, age=inp.age, m=modeObj(D, inp.mode), f=m.factor;
  var out=[];
  function push(name, annual, mode, extra){ out.push(Object.assign({name:name, annual:rd(annual,2), mode:rd(mode,2)}, extra||{})); }

  // PB (Payor Benefit) - product 'PB Beyond' or 'PB Fit'
  if(inp.pb && inp.pb.buy){
    var pbType=inp.pb.type||'PB Beyond';
    var base=main.base;
    var rate=0, key='', col;
    if(age<=15){
      var pc = pbType==='PB Beyond'?'PBPDDCI':'PBPDD';
      col = Math.min(main.payYear, 25-age);
      key = pc + genderLetter(inp.pb.payerSex) + inp.pb.payerAge;
      var row=D.pbRateParent[key];
      rate = row? (row[String(col)]||0) : 0;
    } else {
      var pc2 = pbType==='PB Beyond'?'PBSDDCI':'PBSDD';
      col = main.payYear;
      key = pc2 + genderLetter(inp.pb.payerSex) + inp.pb.payerAge;
      var row2=D.pbRateSpouse[key];
      rate = row2? (row2[String(col)]||0) : 0;
    }
    var ann=rd(rate*rd(base/100,3),2);
    push('PB ('+pbType+')', ann, rd(ann*f,2), {sa:base, rate:rate, key:key, col:col});
  }
  // WP (Waiver) - WP Fit (WPTPD)
  if(inp.wp && inp.wp.buy && age>=16 && age<=70){
    var key='WPTPD'+g+age;
    var tbl = g==='M'?D.wpRateM:D.wpRateF;
    var row=tbl[key];
    var rate = row? (row[String(main.payYear)]||0):0;
    var ann=rd(rate*rd(main.base/100,3),2);
    push('WP Fit', ann, rd(ann*f,2), {sa:main.base, rate:rate, key:key, col:main.payYear});
  }
  // AP
  if(inp.ap && inp.ap.sa>0){
    var rate=D.apRate[String(inp.occ||1)]||0;
    var ann=rd(rate*inp.ap.sa/1000,2);
    push('AP (อุบัติเหตุ)', ann, rd(ann*f,2), {sa:inp.ap.sa, rate:rate});
  }
  // ECARE
  if(inp.ecare && inp.ecare.sa>0){
    var rate=D.ecareRate[String(inp.occ||1)]||0;
    var ann=rd(rate*inp.ecare.sa/1000,2);
    push('ECARE', ann, rd(ann*f,2), {sa:inp.ecare.sa, rate:rate});
  }
  // MEB
  if(inp.meb && inp.meb.plan){
    var row=D.mebRate[String(age)]||D.mebRate[age];
    var rate = row? (row[String(inp.meb.plan)]||0):0;
    var ann=rd(rate*occMul(inp.occ),2);
    push('MEB', ann, rd(ann*f,2), {sa:inp.meb.plan, rate:rate});
  }
  // DCI
  if(inp.dci && inp.dci.sa>0){
    var row=D.dciPlsRate['DCI-'+age];
    var rate=row?(row[g]||0):0;
    var ann=rd(rate*inp.dci.sa/1000,2);
    push('DCI', ann, rd(ann*f,2), {sa:inp.dci.sa, rate:rate});
  }
  // PLS (PLS10)
  if(inp.pls && inp.pls.sa>0){
    var pcode=inp.pls.plan||'PLS10';
    var row=D.dciPlsRate[pcode+'-'+age];
    var rate=row?(row[g]||0):0;
    var disc = inp.pls.sa>=1000000?1:(inp.pls.sa>=500000?0.5:0);
    var ann=rd((rate-disc)*inp.pls.sa/1000,2);
    push(pcode, ann, rd(ann*f,2), {sa:inp.pls.sa, rate:rate});
  }
  // iHealthy Ultra (MHP)
  if(inp.mhp && inp.mhp.plan){
    var covMap={'Full':'','Deductible':'D','Copay':'C'};
    var areaMap={'ประเทศไทย':'','เอเชีย':'A','ทั่วโลก':'W'};
    var cs=covMap[inp.mhp.coverage||'Full'];
    var asfx=areaMap[inp.mhp.area||'ประเทศไทย'];
    var ageType = age<11?'J':'S';
    var planNum=inp.mhp.plan; // 1..6
    var key=('MHP'+cs+planNum+ageType+asfx).trim()+'-'+g;
    var arr=D.mhpRate[key];
    var rate = arr? (arr[age]||0):0;
    var ann=rd(rate*occMul(inp.occ),2);
    push('iHealthy Ultra', ann, rd(ann*f,2), {sa:key, rate:rate});
  }
  // CI 123
  if(inp.ci123 && inp.ci123.sa>0){
    var S=inp.ci123.sa;
    var comps=[
      ['Major CI', S],
      ['Critical Care Benefit', S*0.25],
      ['Juvenile CI', S*0.25],
      ['Pre-Early CI', Math.min(S*0.20,100000)],
      ['Early to Intermediate CI', S*0.25],
      ['Special Conditions', S*0.10]
    ];
    var totMode=0, parts={};
    comps.forEach(function(c){
      var name=c[0], saC=c[1];
      var arr=D.ci123Rate[name+'-'+g];
      var r=arr?(arr[age]||0):0;
      if(name==='Juvenile CI' && age>18) r=0;
      var am=rd(r*rd(saC/1000,3),2);
      var an=rd(am*f,2); // mode premium
      parts[name]={sa:saC, rate:r, mode:an};
      totMode+=an;
    });
    var ann=rd(totMode*(modeObj(D,inp.mode).periods),2);
    push('CI 123 (โรคร้ายแรง)', ann, rd(totMode,2), {sa:S, parts:parts});
  }
  return out;
}

function calc(D, CV, inp){
  var main=calcMain(D, inp);
  var riders=calcRiders(D, inp, main);
  var m=modeObj(D, inp.mode);
  var modeTotal=rd(main.mode + riders.reduce(function(s,r){return s+r.mode;},0),2);
  var annualTotal=rd(main.annual + riders.reduce(function(s,r){return s+r.annual;},0),2);
  return {main:main, riders:riders, modeTotal:modeTotal, annualTotal:annualTotal, mode:m};
}

// CASH VALUE table
function cashValues(D, CV, inp, main){
  if(!main.ok) return [];
  var g=main.gender;
  var key=main.termkey+g+inp.age;
  var rec=CV[key];
  if(!rec) return [];
  var sa=inp.mainSA;
  var rows=[];
  var csvArr=rec.c||rec.p; // 'c' = full surrender curve to age 99; fall back to legacy 'p'
  var n=Math.min(99-inp.age, csvArr.length);
  for(var y=1;y<=n;y++){
    var age=inp.age+y-1; if(age>99) break; // policy year Y → attained age = issueAge + Y - 1 (matches official table)
    var csv=csvArr[y-1]||0;   // cash surrender value factor /1000 (มูลค่าเวนคืน)
    var pvl=rec.p[y-1]||0;
    var eti=rec.e[y-1]||0;
    var pen=rec.n[y-1]||0;
    var puImmediate=Math.max(pvl-1000,0)*sa/1000;
    var puValue=(pvl===0?0:Math.min(pvl,1000))*sa/1000;
    var etYears=0, etDays=0;
    if(eti && String(eti).length>=4){ var s=String(Math.round(eti)); etDays=parseInt(s.slice(-3),10); etYears=parseInt(s.slice(0,-3),10);}
    else if(eti){ etDays=eti; }
    var etImmediate=Math.max(pen-1000,0)*sa/1000;
    var etMaturity=(pen===0?0:Math.min(pen,1000))*sa/1000;
    rows.push({year:y, age:age, surrender:rnd(csv*sa/1000,2), puImmediate:rnd(puImmediate,2), puValue:rnd(puValue,2),
               etYears:etYears, etDays:etDays, etImmediate:rnd(etImmediate,2), etMaturity:rnd(etMaturity,2)});
  }
  return rows;
}

return {calc:calc, cashValues:cashValues, calcMain:calcMain, genderLetter:genderLetter, planInfo:planInfo};
})();
