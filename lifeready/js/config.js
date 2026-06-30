// LifeReady — config & helpers (riders, plan options, formatting). Loaded before app.js.
// ============ UI ============
var $=function(id){return document.getElementById(id)};
function fmt(n){ if(n===''||n==null||isNaN(n)) return '0'; return Number(n).toLocaleString('th-TH',{minimumFractionDigits:(n%1?2:0),maximumFractionDigits:2}); }
function fmt0(n){ return Number(n||0).toLocaleString('th-TH'); }
var STATE={ sex:'หญิง', payerSex:'ชาย', riders:{} };

var RIDERS=[
 {key:'pb', name:'PB (พีบี)', desc:'คุ้มครองผู้ชำระเบี้ย', ctl:'pb', min:0,max:70},
 {key:'wp', name:'WP Fit', desc:'ยกเว้นเบี้ยฯ (ทุพพลภาพ)', ctl:'buy', min:16,max:70},
 {key:'ap', name:'AP', desc:'อุบัติเหตุ', ctl:'sa', min:0,max:60, smin:100000,
   smax:function(i){return i.age<16?Math.min(2*i.mainSA,3000000):Math.min(5*i.mainSA,10000000)}},
 {key:'ecare', name:'ECARE', desc:'อุบัติเหตุ (อีแคร์)', ctl:'sa', min:16,max:60, smin:100000,
   smax:function(i){return Math.min(5*i.mainSA,10000000)}},
 {key:'meb', name:'MEB', desc:'ชดเชยรายวัน', ctl:'planMEB', min:6,max:65},
 {key:'dci', name:'DCI', desc:'ทุพพลภาพ', ctl:'sa', min:20,max:65, smin:200000, smax:function(i){return 10000000}},
 {key:'pls', name:'PLS10', desc:'คุ้มครองชีวิตเพิ่ม 10 ปี', ctl:'sa', min:20,max:59, smin:300000, smax:function(i){return 5*i.mainSA}},
 {key:'mex', name:'MEX', desc:'ค่ารักษาพยาบาล (เหมาจ่าย)', ctl:'planMEX', min:0,max:70},
 {key:'mhp', name:'iHealthy Ultra', desc:'ค่ารักษาพยาบาลเหมาจ่าย', ctl:'planMHP', min:6,max:80},
 {key:'mci', name:'Roke Rai So Shield', desc:'มะเร็ง/โรคร้าย (โซ ชิลด์)', ctl:'planMCI', min:0,max:65},
 {key:'cpr', name:'CPR', desc:'โรคร้ายแรง', ctl:'sa', min:0,max:65, smin:300000, smax:function(i){return Math.min(5000000,5*i.mainSA)}},
 {key:'hic', name:'HIC', desc:'ชดเชยรายได้ (ต้องซื้อคู่ CPR)', ctl:'saUnit', min:0,max:65, smin:1000,smax:function(){return 10000}},
 {key:'ci123', name:'CI 123', desc:'โรคร้ายแรง 123', ctl:'sa', min:0,max:75, smin:100000, smax:function(i){return 10000000}}
];
var MEB_PLANS=function(age){ if(age<11) return [500]; if(age<16) return [500,1000]; return [500,1000,2000,3000,4000,5000]; };
var MEX_PLANS=function(age){ return age<=10?[1200,2200,3200]:[1200,2200,3200,4200,6200]; };
var MHP_PLANS=function(age){ var p=[[1,'Smart (สมาร์ท)'],[2,'Bronze (บรอนซ์)']]; if(age>=11) p=p.concat([[3,'Silver (ซิลเวอร์)'],[4,'Gold (โกลด์)'],[5,'Diamond (ไดมอนด์)'],[6,'Platinum (แพลทินั่ม)']]); return p; };
var MCI_PLANS=function(age){ var p=[['S','แผน S'],['M','แผน M']]; if(age>=11) p=p.concat([['L','แผน L'],['XL','แผน XL']]); return p; };
