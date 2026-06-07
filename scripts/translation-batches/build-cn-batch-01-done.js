const fs = require('fs');
const path = require('path');

const keys = JSON.parse(fs.readFileSync(path.join(__dirname, 'cn-batch-01.json'), 'utf8'));
const parts = [
  require('./cn-batch-01-ar-part1'),
  require('./cn-batch-01-ar-part2'),
  require('./cn-batch-01-ar-part3'),
  require('./cn-batch-01-ar-part4'),
];

const translations = Object.assign({}, ...parts);
const out = {};
const missing = [];

for (const key of keys) {
  if (translations[key] === undefined) {
    missing.push(key.slice(0, 80));
  } else {
    out[key] = translations[key];
  }
}

const outFile = path.join(__dirname, 'cn-batch-01-done.json');
fs.writeFileSync(outFile, JSON.stringify(out, null, 2), 'utf8');

console.log('Written:', outFile);
console.log('Count:', Object.keys(out).length, '/', keys.length);
if (missing.length) {
  console.log('MISSING:', missing.length);
  missing.forEach((m) => console.log(' -', m));
  process.exit(1);
}

// Verify all source keys present
const allPresent = keys.every((k) => Object.prototype.hasOwnProperty.call(out, k));
console.log('All source keys present:', allPresent);
if (!allPresent) process.exit(1);
