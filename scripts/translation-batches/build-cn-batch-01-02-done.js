const fs = require('fs');
const path = require('path');
const dir = __dirname;

function build(batchNum) {
  const keys = JSON.parse(fs.readFileSync(path.join(dir, `cn-batch-0${batchNum}.json`), 'utf8'));
  const values = require(path.join(dir, `ar-batch-0${batchNum}-values.js`));
  if (values.length !== keys.length) {
    console.error(`Batch 0${batchNum}: expected ${keys.length} translations, got ${values.length}`);
    process.exit(1);
  }
  const out = {};
  keys.forEach((k, i) => { out[k] = values[i]; });
  fs.writeFileSync(path.join(dir, `cn-batch-0${batchNum}-done.json`), JSON.stringify(out, null, 2), 'utf8');
  console.log(`Batch 0${batchNum}: ${Object.keys(out).length}/${keys.length} OK`);
}

build(1);
build(2);
console.log('Done.');
