import React from "react";
import { renderToString } from "react-dom/server";
import { calculateQuote } from "./calculator";
import { App, Results } from "./main";

const inputHtml = renderToString(<App />);
const resultHtml = renderToString(<Results quote={calculateQuote({ age: 30, gender: "M", mode: "annual", sumAssured: 500_000 })} onBack={() => undefined} />);
const html = `${inputHtml}${resultHtml}`;
for (const expected of [
  "Easy Protect 6",
  "งวดการชำระเบี้ยประกันภัย",
  "29,750.00",
  "ข้อมูลผู้เอาประกันภัย",
  "สัญญาเพิ่มเติม",
  "คำนวณและดูผลประโยชน์",
  "กำไร",
  "กราฟเปรียบเทียบเบี้ยสะสม มูลค่าเวนคืน และความคุ้มครอง",
  "จุดคุ้มทุน",
]) {
  if (!html.includes(expected)) throw new Error(`render missing: ${expected}`);
}

console.log(JSON.stringify({ renderedCharacters: html.length, requiredContent: "passed" }, null, 2));
