/**
 * Batch translate missing strings using MyMemory free API (en->ar, zh->ar).
 * Saves progress to translate-cache.json after each batch.
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const SCRIPTS = __dirname;
const CACHE = path.join(SCRIPTS, 'translate-cache.json');
const EN_MISSING = path.join(SCRIPTS, 'en-strings-missing.json');
const CN_MISSING = path.join(SCRIPTS, 'cn-phrases-missing.json');
const EN_OUT = path.join(SCRIPTS, 'en-ar-content.json');
const CN_OUT = path.join(SCRIPTS, 'cn-ar-content.json');

const cache = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, 'utf8')) : {};
const enExisting = fs.existsSync(EN_OUT) ? JSON.parse(fs.readFileSync(EN_OUT, 'utf8')) : {};
const cnExisting = fs.existsSync(CN_OUT) ? JSON.parse(fs.readFileSync(CN_OUT, 'utf8')) : {};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function myMemoryTranslate(text, langpair) {
  return new Promise((resolve, reject) => {
    const q = encodeURIComponent(text.slice(0, 4500));
    const url = `https://api.mymemory.translated.net/get?q=${q}&langpair=${langpair}`;
    https
      .get(url, { timeout: 30000 }, (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try {
            const j = JSON.parse(data);
            if (j.responseStatus === 200 || j.responseData?.translatedText) {
              resolve(j.responseData.translatedText);
            } else {
              reject(new Error(j.responseDetails || 'API error'));
            }
          } catch (e) {
            reject(e);
          }
        });
      })
      .on('error', reject)
      .on('timeout', () => reject(new Error('timeout')));
  });
}

async function translateOne(text, langpair) {
  if (cache[text]) return cache[text];
  await sleep(350);
  const result = await myMemoryTranslate(text, langpair);
  cache[text] = result;
  fs.writeFileSync(CACHE, JSON.stringify(cache, null, 2), 'utf8');
  return result;
}

async function processList(items, langpair, existing, outFile, label) {
  let done = 0;
  let failed = 0;
  for (const text of items) {
    if (existing[text] || cache[text]) {
      existing[text] = existing[text] || cache[text];
      continue;
    }
    try {
      existing[text] = await translateOne(text, langpair);
      done++;
      if (done % 5 === 0) {
        fs.writeFileSync(outFile, JSON.stringify(existing, null, 2), 'utf8');
        console.log(`[${label}] translated ${done}, failed ${failed}, total ${Object.keys(existing).length}`);
      }
    } catch (e) {
      failed++;
      console.error(`[${label}] FAIL (${text.slice(0, 50)}...): ${e.message}`);
      if (failed > 20) {
        console.error(`[${label}] Too many failures, stopping batch`);
        break;
      }
    }
  }
  fs.writeFileSync(outFile, JSON.stringify(existing, null, 2), 'utf8');
  console.log(`[${label}] Done: +${done} new, ${failed} failed, ${Object.keys(existing).length} total`);
}

async function main() {
  const enList = fs.existsSync(EN_MISSING)
    ? JSON.parse(fs.readFileSync(EN_MISSING, 'utf8'))
    : [];
  const cnList = fs.existsSync(CN_MISSING)
    ? JSON.parse(fs.readFileSync(CN_MISSING, 'utf8'))
    : [];

  console.log(`EN to translate: ${enList.filter((s) => !enExisting[s]).length}`);
  console.log(`CN to translate: ${cnList.filter((s) => !cnExisting[s]).length}`);

  await processList(enList, 'en|ar', enExisting, EN_OUT, 'EN');
  await processList(cnList, 'zh-CN|ar', cnExisting, CN_OUT, 'CN');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
