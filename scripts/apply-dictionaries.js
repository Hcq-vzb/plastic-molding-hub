const fs = require('fs');
const path = require('path');

const AR_ROOT = path.join(__dirname, '..', 'ar');
const TRANSLATIONS = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'cn-ar-translations.json'), 'utf8')
);
const EN_AR = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'en-ar-translations.json'), 'utf8')
);

for (const file of ['en-ar-content.json', 'cn-ar-content.json']) {
  const p = path.join(__dirname, file);
  if (fs.existsSync(p)) {
    Object.assign(file.startsWith('en') ? EN_AR : TRANSLATIONS, JSON.parse(fs.readFileSync(p, 'utf8')));
  }
}

function applyDict(content, dict) {
  const keys = Object.keys(dict).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (key) content = content.split(key).join(dict[key]);
  }
  return content;
}

function walk(dir, list = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full, list);
    else if (name.endsWith('.html')) list.push(full);
  }
  return list;
}

let updated = 0;
for (const file of walk(AR_ROOT)) {
  const original = fs.readFileSync(file, 'utf8');
  let content = applyDict(original, EN_AR);
  content = applyDict(content, TRANSLATIONS);
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    updated++;
  }
}
console.log(`Applied dictionaries to ${updated} files`);
