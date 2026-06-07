const fs = require('fs');
const path = require('path');

const BATCH_DIR = path.join(__dirname, 'translation-batches');
const EN_OUT = path.join(__dirname, 'en-ar-content.json');
const CN_OUT = path.join(__dirname, 'cn-ar-content.json');
const BAD = /QUERY LENGTH|EXCEEDED|MYMEMORY WARNING|VISIT HTTPS/i;

function merge(prefix, outFile) {
  const merged = {};
  if (fs.existsSync(outFile)) {
    const existing = JSON.parse(fs.readFileSync(outFile, 'utf8'));
    for (const [k, v] of Object.entries(existing)) {
      if (!BAD.test(v)) merged[k] = v;
    }
  }
  const files = fs.readdirSync(BATCH_DIR).filter((f) => f.startsWith(`${prefix}-batch-`) && f.endsWith('-done.json'));
  for (const f of files.sort()) {
    const data = JSON.parse(fs.readFileSync(path.join(BATCH_DIR, f), 'utf8'));
    Object.assign(merged, data);
  }
  const sorted = {};
  Object.keys(merged)
    .sort((a, b) => b.length - a.length)
    .forEach((k) => {
      sorted[k] = merged[k];
    });
  fs.writeFileSync(outFile, JSON.stringify(sorted, null, 2), 'utf8');
  console.log(`${prefix}: merged ${Object.keys(sorted).length} entries from ${files.length} batch files -> ${path.basename(outFile)}`);
  return Object.keys(sorted).length;
}

const en = merge('en', EN_OUT);
const cn = merge('cn', CN_OUT);
console.log(`Total: ${en + cn} translations`);
