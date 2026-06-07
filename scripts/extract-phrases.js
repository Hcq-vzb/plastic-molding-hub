const fs = require('fs');
const path = require('path');

const AR_ROOT = path.join(__dirname, '..', 'ar');

function walk(dir, list = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full, list);
    else if (name.endsWith('.html')) list.push(full);
  }
  return list;
}

const re =
  /[\u4e00-\u9fff][\u4e00-\u9fff\s，。、；：！？（）《》「」【】｜·\dA-Za-z\-&;]+[\u4e00-\u9fff]|[\u4e00-\u9fff]{4,}/g;

const set = new Set();
for (const file of walk(AR_ROOT)) {
  const text = fs.readFileSync(file, 'utf8');
  let m;
  while ((m = re.exec(text)) !== null) set.add(m[0].trim());
}

const phrases = [...set].sort((a, b) => b.length - a.length);
console.log('Phrases:', phrases.length);
phrases.slice(0, 30).forEach((p) => console.log(p.length, p.slice(0, 120)));
