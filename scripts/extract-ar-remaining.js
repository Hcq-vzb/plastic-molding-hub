const fs = require('fs');
const path = require('path');

const AR_ROOT = path.join(__dirname, '..', 'ar');
const EN_AR = JSON.parse(fs.readFileSync(path.join(__dirname, 'en-ar-translations.json'), 'utf8'));
const EN_CONTENT = fs.existsSync(path.join(__dirname, 'en-ar-content.json'))
  ? JSON.parse(fs.readFileSync(path.join(__dirname, 'en-ar-content.json'), 'utf8'))
  : {};
const CN = JSON.parse(fs.readFileSync(path.join(__dirname, 'cn-ar-translations.json'), 'utf8'));
const CN_CONTENT = fs.existsSync(path.join(__dirname, 'cn-ar-content.json'))
  ? JSON.parse(fs.readFileSync(path.join(__dirname, 'cn-ar-content.json'), 'utf8'))
  : {};
const ALL_EN = { ...EN_AR, ...EN_CONTENT };
const ALL_CN = { ...CN, ...CN_CONTENT };

function walk(dir, list = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full, list);
    else if (name.endsWith('.html')) list.push(full);
  }
  return list;
}

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

const enMissing = new Set();
const cnMissing = new Set();

for (const file of walk(AR_ROOT)) {
  const html = fs.readFileSync(file, 'utf8');
  const text = stripHtml(html);

  const cnParts = text.match(/[\u4e00-\u9fff][\u4e00-\u9fff\s，。、；：！？（）《》「」【】｜·\dA-Za-z\-&;]+|[\u4e00-\u9fff]{2,}/g);
  if (cnParts) {
    for (const p of cnParts) {
      const s = p.trim();
      if (s.length >= 2 && !ALL_CN[s]) cnMissing.add(s);
    }
  }

  const lines = text.split(/\n+/);
  for (const line of lines) {
    const s = line.trim();
    if (s.length < 4) continue;
    if (!/[A-Za-z]{4,}/.test(s)) continue;
    if (/^(English|EN|KIWL|SK|SE|CHINAPLAS|PLASTEX|TikTok|javascript|Mirrored|HTTrack|sunbun|plasticmoldinghub)/i.test(s)) continue;
    if (/\.(jpg|png|gif|webm|html|css|js|pdf)$/i.test(s)) continue;
    if (!ALL_EN[s]) enMissing.add(s);
  }
}

const enOut = path.join(__dirname, 'en-strings-round2.json');
const cnOut = path.join(__dirname, 'cn-phrases-round2.json');
fs.writeFileSync(enOut, JSON.stringify([...enMissing].sort((a, b) => b.length - a.length), null, 2), 'utf8');
fs.writeFileSync(cnOut, JSON.stringify([...cnMissing].sort((a, b) => b.length - a.length), null, 2), 'utf8');
console.log('Round2 EN:', enMissing.size, 'CN:', cnMissing.size);
[...enMissing].slice(0, 15).forEach((s) => console.log('EN:', s.slice(0, 100)));
