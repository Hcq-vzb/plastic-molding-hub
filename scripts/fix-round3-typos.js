const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'en-ar-round3.json');
let s = fs.readFileSync(file, 'utf8');
// Latin 'n' accidentally used in Arabic words
s = s.replace(/\u062d\u0642n/g, '\u062d\u0642\u0646'); // حق + n -> حقn
s = s.replace(/\u0627\u0644\u0633\u062db/g, '\u0627\u0644\u0633\u062d\u0628'); // السحb -> السحb
s = s.replace(/full swing/gi, '\u0639\u0644\u0649 \u0642\u062f\u0645 \u0648\u0633\u0627\u0642');
s = s.replace(/shenzhen/gi, '\u0634\u0646\u0632\u0647\u0646');
s = s.replace(/\u062a\u0634\u0646\u063atchou/gi, '\u062a\u0634\u0646\u063a\u062a\u0634\u0648');
s = s.replace(/s\u064ervo/gi, '\u0633\u064a\u0631\u0641\u0648');
s = s.replace(/S\u064ervo/g, '\u0633\u064a\u0631\u0641\u0648');
fs.writeFileSync(file, s);
console.log('Fixed');
