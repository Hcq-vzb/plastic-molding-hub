const fs = require('fs');
const path = require('path');

function norm(s) {
  return s
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function expandDict(dict) {
  const out = { ...dict };
  for (const [k, v] of Object.entries(dict)) {
    const n = norm(k);
    if (n !== k && !out[n]) out[n] = v;
    const q = k.replace(/'/g, '&#39;').replace(/"/g, '&quot;');
    if (q !== k && !out[q]) out[q] = v;
  }
  return out;
}

for (const file of ['en-ar-content.json', 'en-ar-translations.json', 'cn-ar-content.json', 'cn-ar-translations.json']) {
  const p = path.join(__dirname, file);
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  const expanded = expandDict(data);
  fs.writeFileSync(p, JSON.stringify(expanded, null, 2), 'utf8');
  console.log(file, Object.keys(data).length, '->', Object.keys(expanded).length);
}
