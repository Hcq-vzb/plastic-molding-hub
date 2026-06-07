const fs = require('fs');
const path = require('path');

const AR_ROOT = path.join(__dirname, '..', 'ar');
const existing = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'cn-ar-translations.json'), 'utf8')
);

const re =
  /[\u4e00-\u9fff][\u4e00-\u9fff\s，。、；：！？（）《》「」【】｜·\dA-Za-z\-&;]+[\u4e00-\u9fff]|[\u4e00-\u9fff]{4,}/g;

function walk(dir, list = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full, list);
    else if (name.endsWith('.html')) list.push(full);
  }
  return list;
}

const set = new Set();
for (const file of walk(AR_ROOT)) {
  const text = fs.readFileSync(file, 'utf8');
  let m;
  while ((m = re.exec(text)) !== null) set.add(m[0].trim());
}

const missing = [...set]
  .filter((s) => !existing[s])
  .sort((a, b) => b.length - a.length);

fs.writeFileSync(
  path.join(__dirname, 'cn-phrases-missing.json'),
  JSON.stringify(missing, null, 2),
  'utf8'
);
console.log('Missing CN phrases:', missing.length);
