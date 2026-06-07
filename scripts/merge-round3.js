const fs = require('fs');
const path = require('path');

function merge(intoFile, fromFile) {
  const into = JSON.parse(fs.readFileSync(intoFile, 'utf8'));
  const from = JSON.parse(fs.readFileSync(fromFile, 'utf8'));
  let added = 0;
  for (const [k, v] of Object.entries(from)) {
    if (!into[k]) {
      into[k] = v;
      added++;
    }
  }
  fs.writeFileSync(intoFile, JSON.stringify(into, null, 2), 'utf8');
  console.log(path.basename(intoFile), '+', added, 'keys, total', Object.keys(into).length);
}

const dir = __dirname;
merge(path.join(dir, 'en-ar-translations.json'), path.join(dir, 'en-ar-round3.json'));
merge(path.join(dir, 'en-ar-translations.json'), path.join(dir, 'en-ar-round4.json'));
merge(path.join(dir, 'cn-ar-translations.json'), path.join(dir, 'cn-ar-round3.json'));
