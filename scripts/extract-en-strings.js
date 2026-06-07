const fs = require('fs');
const path = require('path');

const EN_ROOT = path.join(__dirname, '..', 'en');

function walk(dir, list = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full, list);
    else if (name.endsWith('.html')) list.push(full);
  }
  return list;
}

function stripTags(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

const existing = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'en-ar-translations.json'), 'utf8')
);

const set = new Set();
for (const file of walk(EN_ROOT)) {
  const html = fs.readFileSync(file, 'utf8');
  const title = html.match(/<title>([^<]*)<\/title>/i);
  if (title) set.add(title[1].trim());
  const desc = html.match(/content="([^"]{20,})"/gi);
  if (desc) desc.forEach((d) => {
    const m = d.match(/content="([^"]+)"/i);
    if (m) set.add(m[1].trim());
  });
  const text = stripTags(html);
  const parts = text.split(/(?<=[.!?])\s+|\n+/);
  for (const p of parts) {
    const s = p.trim();
    if (/[A-Za-z]{3,}/.test(s) && s.length >= 4 && s.length <= 800) set.add(s);
  }
  const attrs = html.match(/(?:title|alt|value|placeholder)="([^"]{3,})"/gi) || [];
  for (const a of attrs) {
    const m = a.match(/="([^"]+)"/);
    if (m && /[A-Za-z]/.test(m[1])) set.add(m[1].trim());
  }
}

const missing = [...set]
  .filter((s) => !existing[s] && !Object.keys(existing).some((k) => s.includes(k) || k.includes(s)))
  .sort((a, b) => b.length - a.length);

console.log('Total EN strings:', set.size);
console.log('Already in dict:', set.size - missing.length);
console.log('Missing:', missing.length);
fs.writeFileSync(
  path.join(__dirname, 'en-strings-missing.json'),
  JSON.stringify(missing, null, 2),
  'utf8'
);
missing.slice(0, 20).forEach((s) => console.log(s.length, s.slice(0, 100)));
