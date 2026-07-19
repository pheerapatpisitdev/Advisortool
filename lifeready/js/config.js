// LifeReady — config & helpers (riders, plan options, formatting). Loaded before app.js.
// ============ UI ============
var $=function(id){return document.getElementById(id)};
function fmt(n){ if(n===''||n==null||isNaN(n)) return '0'; return Number(n).toLocaleString('th-TH',{minimumFractionDigits:(n%1?2:0),maximumFractionDigits:2}); }
function fmt0(n){ return Number(n||0).toLocaleString('th-TH'); }
var STATE={ sex:'หญิง', payerSex:'ชาย', mode:'รายปี', seq:'3', riders:{} };

var RIDERS=[
 {key:'pb', name:'PB (พีบี)', desc:'คุ้มครองผู้ชำระเบี้ย', ctl:'pb', min:0,max:70},
 {key:'wp', name:'WP Fit', desc:'ยกเว้นเบี้ยฯ (ทุพพลภาพ)', ctl:'buy', min:16,max:70},
 {key:'ap', name:'AP', desc:'อุบัติเหตุ', ctl:'sa', min:0,max:60, smin:100000,
   smax:function(i){return i.age<16?Math.min(2*i.mainSA,3000000):Math.min(5*i.mainSA,10000000)}},
 {key:'ecare', name:'ECARE', desc:'อุบัติเหตุ (อีแคร์)', ctl:'sa', min:16,max:60, smin:100000,
   smax:function(i){return Math.min(5*i.mainSA,10000000)}},
 {key:'meb', name:'MEB', desc:'ชดเชยรายวัน', ctl:'planMEB', min:6,max:65},
 {key:'dci', name:'DCI', desc:'เสียชีวิตและโรคร้ายแรง 31 โรค', ctl:'sa', min:20,max:65, smin:200000, smax:function(i){return 10000000}},
 {key:'pls', name:'PLS10', desc:'คุ้มครองชีวิตเพิ่ม 10 ปี', ctl:'sa', min:20,max:59, smin:300000, smax:function(i){return 5*i.mainSA}},
 {key:'mhp', name:'iHealthy Ultra', desc:'ค่ารักษาพยาบาลเหมาจ่าย', ctl:'planMHP', min:6,max:80},
 {key:'ci123', name:'CI 123', desc:'โรคร้ายแรง 123', ctl:'sa', min:0,max:75, smin:100000, smax:function(i){return 10000000}}
];
var MEB_PLANS=function(age){ if(age<11) return [500]; if(age<16) return [500,1000]; return [500,1000,2000,3000,4000,5000]; };
var MHP_PLANS=function(age){ var p=[[1,'Smart (สมาร์ท)'],[2,'Bronze (บรอนซ์)']]; if(age>=11) p=p.concat([[3,'Silver (ซิลเวอร์)'],[4,'Gold (โกลด์)'],[5,'Diamond (ไดมอนด์)'],[6,'Platinum (แพลทินั่ม)']]); return p; };
// รายชื่อโรคร้ายแรงของ DCI ตามชีต "ผลประโยชน์ (Rider)" ในไฟล์ A2026-1
// (ข้อมูลเพื่อแสดงผลเท่านั้น ไม่เกี่ยวกับสูตรคำนวณเบี้ย)
var DCI_DISEASES=[
 'โรคสมองเสื่อมชนิดอัลไซเมอร์',
 'โรคโลหิตจางจากไขกระดูกไม่สร้างเม็ดโลหิต',
 'โรคเยื่อหุ้มสมองและไขสันหลังอักเสบจากเชื้อแบคทีเรีย',
 'เนื้องอกในสมอง ชนิดที่ไม่ใช่มะเร็ง',
 'ตาบอด',
 'โรคมะเร็งระยะลุกลาม',
 'ไตวายเรื้อรัง',
 'ตับวาย',
 'ภาวะโคม่า',
 'โรคหลอดเลือดหัวใจตีบตันที่ต้องรักษาด้วยการผ่าตัดต่อหลอดเลือด',
 'การสูญเสียการได้ยิน',
 'สมองอักเสบ',
 'โรคปอดระยะสุดท้าย',
 'ตับอักเสบระยะอันตราย',
 'กล้ามเนื้อหัวใจตายเฉียบพลันจากการขาดเลือด',
 'การผ่าตัดเปลี่ยนลิ้นหัวใจ',
 'การสูญเสียความสามารถในการพูด',
 'แผลไหม้ฉกรรจ์',
 'การผ่าตัดเปลี่ยนอวัยวะหรือปลูกถ่ายไขกระดูก',
 'โรคของเซลล์ประสาทควบคุมการเคลื่อนไหว',
 'โรคระบบประสาทมัลติเพิล สะเคลอโรสิส',
 'โรคกล้ามเนื้อเสื่อม',
 'อัมพาตของกล้ามเนื้อแขนหรือขา',
 'โรคพาร์กินสัน',
 'โรคโปลิโอ',
 'โรคแรงดันในหลอดเลือดแดงปอดสูงแบบปฐมภูมิ',
 'การสูญเสียอวัยวะโดยการตัด',
 'โรคหลอดเลือดสมองแตกหรืออุดตัน',
 'การผ่าตัดเส้นเลือดแดงใหญ่เอออร์ต้า',
 'ภาวะขั้นสุดท้าย',
 'การทุพพลภาพถาวรสิ้นเชิง'
];
