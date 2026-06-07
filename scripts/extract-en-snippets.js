const fs = require('fs');
const path = require('path');

const AR_ROOT = path.join(__dirname, '..', 'ar');
const EN_AR = JSON.parse(fs.readFileSync(path.join(__dirname, 'en-ar-translations.json'), 'utf8'));
const EN_CONTENT = fs.existsSync(path.join(__dirname, 'en-ar-content.json'))
  ? JSON.parse(fs.readFileSync(path.join(__dirname, 'en-ar-content.json'), 'utf8'))
  : {};
const ALL = { ...EN_AR, ...EN_CONTENT };

const BRANDS = /^(KIWL|SK|SE|SV|SH|NS|J6|CHINAPLAS|PLASTEX|TikTok|Douyin|English|EN|AR|PDF|Word|EXCEL|CAD|Pro\/ENGINEER|Solid Works|China Core|FMS|PLC|IoT|ISO|OEM|ODM|USB|WiFi|HTML|CSS|JS|PET|PMMA|ABS|PC|PA|PVC|PE|PP)$/i;

function walk(dir, list = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full, list);
    else if (name.endsWith('.html')) list.push(full);
  }
  return list;
}

function norm(s) {
  return s.replace(/\s+/g, ' ').trim();
}

const snippets = new Map();

for (const file of walk(AR_ROOT)) {
  const html = fs.readFileSync(file, 'utf8');
  const parts = html.split(/(<[^>]+>)/);
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].startsWith('<')) continue;
    const text = norm(parts[i]);
    if (!text || text.length < 3) continue;
    if (!/[A-Za-z]{3,}/.test(text)) continue;
    if (/^[\d\s\W]+$/.test(text)) continue;
    if (ALL[text]) continue;
    if (BRANDS.test(text)) continue;
    if (/^https?:\/\//.test(text)) continue;
    if (/\.(jpg|png|gif|html|css|js|pdf|webm)$/i.test(text)) continue;
    snippets.set(text, (snippets.get(text) || 0) + 1);
  }
}

const sorted = [...snippets.entries()].sort((a, b) => b[1] - a[1] || b[0].length - a[0].length);
const out = sorted.map(([s, c]) => ({ text: s, count: c }));
fs.writeFileSync(path.join(__dirname, 'en-snippets-missing.json'), JSON.stringify(out, null, 2), 'utf8');
console.log('Missing snippets:', out.length);
out.slice(0, 40).forEach(({ text, count }) => console.log(count, text.slice(0, 120)));
