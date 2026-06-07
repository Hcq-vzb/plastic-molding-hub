const fs = require('fs');
const path = require('path');
const dir = __dirname;

function writeBatch(batchNum, translations) {
  const keys = JSON.parse(fs.readFileSync(path.join(dir, `cn-batch-0${batchNum}.json`), 'utf8'));
  const out = {};
  const missing = [];
  for (const k of keys) {
    if (translations[k]) {
      out[k] = translations[k];
    } else {
      missing.push(k.slice(0, 60) + '...');
    }
  }
  const outPath = path.join(dir, `cn-batch-0${batchNum}-done.json`);
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');
  console.log(`Batch 0${batchNum}: ${Object.keys(out).length}/${keys.length} keys`);
  if (missing.length) {
    console.error('Missing:', missing.length);
    missing.forEach(m => console.error('  -', m));
    process.exit(1);
  }
}

const batch01 = require('./cn-batch-01-ar-data.js');
const batch02 = require('./cn-batch-02-ar-data.js');

writeBatch(1, batch01);
writeBatch(2, batch02);
console.log('Done.');
