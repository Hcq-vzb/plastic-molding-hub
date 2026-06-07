const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'en-ar-round4.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const fixed = {};
for (const [k, v] of Object.entries(data)) {
  let val = v
    .replace(/\u062d\u0642n/g, '\u062d\u0642\u0646')
    .replace(/preform/gi, '\u062a\u0634\u0643\u064a\u0644')
    .replace(/\u0648u/g, '\u0648\u0648')
    .replace(/\bqiu\b/gi, '\u0642\u064a\u0648')
    .replace(/Mr\. \u0648\u0648/g, '\u0627\u0644\u0633\u064a\u062f \u0648\u0648')
    .replace(/tchou/gi, '\u062a\u0634\u0648')
    .replace(/\u062a\u0634i\u0648\u0627\u0646/g, '\u062a\u0634\u064a\u0648\u0627\u0646')
    .replace(/perform PET/gi, 'PET')
    .replace(/ \u0623\u0633\u0631\u0639 /g, ' ')
    .replace(/\u0627\u0644\u0633\u0631\u0639\u0629/g, '\u0627\u0644\u0633\u0631\u0639\u0629');
  fixed[k] = val;
}
// Fix wrong keys with Latin i in Arabic
const keysFixed = {};
for (const [k, v] of Object.entries(fixed)) {
  const nk = k.replace(/\u062a\u0634i\u0648\u0627\u0646/g, '\u062a\u0634\u064a\u0648\u0627\u0646');
  keysFixed[nk] = v.replace(/\u062a\u0634i\u0648\u0627\u0646/g, '\u062a\u0634\u064a\u0648\u0627\u0646');
}
fs.writeFileSync(file, JSON.stringify(keysFixed, null, 2), 'utf8');
console.log('Fixed round4', Object.keys(keysFixed).length);
