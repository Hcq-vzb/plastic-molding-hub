const fs = require('fs');
const path = require('path');

const EN_ROOT = path.join(__dirname, '..', 'en');
const EN_AR = {
  ...JSON.parse(fs.readFileSync(path.join(__dirname, 'en-ar-translations.json'), 'utf8')),
  ...JSON.parse(fs.readFileSync(path.join(__dirname, 'en-ar-content.json'), 'utf8')),
};
const CN_AR = {
  ...JSON.parse(fs.readFileSync(path.join(__dirname, 'cn-ar-translations.json'), 'utf8')),
  ...JSON.parse(fs.readFileSync(path.join(__dirname, 'cn-ar-content.json'), 'utf8')),
};

function walk(dir, list = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full, list);
    else if (name.endsWith('.html')) list.push(full);
  }
  return list;
}

function extractText(html) {
  const texts = new Set();
  const attrs = html.match(/(?:title|alt|content|value|placeholder)="([^"]+)"/gi) || [];
  for (const a of attrs) {
    const m = a.match(/="([^"]+)"/);
    if (m && /[A-Za-z\u4e00-\u9fff]{3,}/.test(m[1])) texts.add(m[1]);
  }
  const body = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<!--[\s\S]*?-->/g, ' ');
  const re = />[^<]{4,}</g;
  let m;
  while ((m = re.exec(body)) !== null) {
    const t = m[0].slice(1, -1).replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&amp;/g, '&').trim();
    if (/[A-Za-z\u4e00-\u9fff]/.test(t) && t.length >= 4) texts.add(t);
  }
  return [...texts];
}

const missingEn = new Set();
const missingCn = new Set();

for (const file of walk(EN_ROOT)) {
  const html = fs.readFileSync(file, 'utf8');
  for (const t of extractText(html)) {
    if (/[\u4e00-\u9fff]/.test(t)) {
      if (!CN_AR[t]) missingCn.add(t);
    } else if (/[A-Za-z]/.test(t)) {
      if (!EN_AR[t]) missingEn.add(t);
    }
  }
}

const enOut = [...missingEn].sort((a, b) => b.length - a.length);
const cnOut = [...missingCn].sort((a, b) => b.length - a.length);
fs.writeFileSync(path.join(__dirname, 'en-missing-from-source.json'), JSON.stringify(enOut, null, 2), 'utf8');
fs.writeFileSync(path.join(__dirname, 'cn-missing-from-source.json'), JSON.stringify(cnOut, null, 2), 'utf8');
console.log('Missing from EN source not in dict: EN', enOut.length, 'CN', cnOut.length);
enOut.slice(0, 20).forEach((s) => console.log(' ', s.slice(0, 90)));
