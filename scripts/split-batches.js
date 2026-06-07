const fs = require('fs');
const path = require('path');

const SCRIPTS = __dirname;
const EN_MISSING = JSON.parse(fs.readFileSync(path.join(SCRIPTS, 'en-strings-missing.json'), 'utf8'));
const CN_MISSING = JSON.parse(fs.readFileSync(path.join(SCRIPTS, 'cn-phrases-missing.json'), 'utf8'));

const batchSize = 100;
const batchesDir = path.join(SCRIPTS, 'translation-batches');
fs.mkdirSync(batchesDir, { recursive: true });

function writeBatches(items, prefix) {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const idx = String(Math.floor(i / batchSize) + 1).padStart(2, '0');
    fs.writeFileSync(
      path.join(batchesDir, `${prefix}-batch-${idx}.json`),
      JSON.stringify(batch, null, 2),
      'utf8'
    );
  }
  console.log(`${prefix}: ${items.length} items -> ${Math.ceil(items.length / batchSize)} batches`);
}

writeBatches(EN_MISSING, 'en');
writeBatches(CN_MISSING, 'cn');
console.log('Batches written to scripts/translation-batches/');
