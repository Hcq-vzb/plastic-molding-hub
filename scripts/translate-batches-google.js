const fs = require('fs');
const path = require('path');
const { translate } = require('@vitalets/google-translate-api');

const BATCH_DIR = path.join(__dirname, 'translation-batches');
const CACHE = path.join(__dirname, 'translate-cache.json');
const cache = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, 'utf8')) : {};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function splitChunks(text, max = 350) {
  if (text.length <= max) return [text];
  const chunks = [];
  let rest = text;
  while (rest.length > max) {
    let cut = rest.lastIndexOf('. ', max);
    if (cut < 80) cut = rest.lastIndexOf(' ', max);
    if (cut < 80) cut = max;
    chunks.push(rest.slice(0, cut + 1).trim());
    rest = rest.slice(cut + 1).trim();
  }
  if (rest) chunks.push(rest);
  return chunks;
}

async function translateText(text, from) {
  if (cache[text]) return cache[text];
  if (/^[\d\w.\-_/\\]+$/.test(text) && text.length < 20) return text;
  if (text === 'Phone') {
    cache[text] = 'هاتف';
    return cache[text];
  }
  if (/分析器错误/.test(text)) {
    cache[text] = 'صفحة غير متاحة';
    return cache[text];
  }

  const chunks = splitChunks(text);
  const parts = [];
  for (const chunk of chunks) {
    const ck = `${from}->ar::${chunk}`;
    if (cache[ck]) {
      parts.push(cache[ck]);
      continue;
    }
    await sleep(200);
    try {
      const res = await translate(chunk, { from, to: 'ar' });
      cache[ck] = res.text;
      parts.push(res.text);
    } catch (e) {
      console.error('Chunk fail:', chunk.slice(0, 40), e.message);
      throw e;
    }
  }
  const merged = parts.join(' ');
  cache[text] = merged;
  fs.writeFileSync(CACHE, JSON.stringify(cache, null, 2), 'utf8');
  return merged;
}

async function processBatch(prefix, batchFile, force) {
  const doneFile = batchFile.replace('.json', '-done.json');
  const donePath = path.join(BATCH_DIR, doneFile);
  if (!force && fs.existsSync(donePath)) {
    const existing = JSON.parse(fs.readFileSync(donePath, 'utf8'));
    const bad = Object.values(existing).some((v) => /QUERY LENGTH|MYMEMORY WARNING/i.test(v));
    if (!bad) {
      console.log('Skip existing', doneFile);
      return;
    }
    fs.unlinkSync(donePath);
  }
  const items = JSON.parse(fs.readFileSync(path.join(BATCH_DIR, batchFile), 'utf8'));
  const from = prefix === 'cn' ? 'zh-CN' : 'en';
  const out = {};
  let i = 0;
  for (const text of items) {
    try {
      out[text] = await translateText(text, from);
      i++;
      if (i % 10 === 0) console.log(`${doneFile}: ${i}/${items.length}`);
    } catch (e) {
      console.error(`${doneFile} stopped at ${i}:`, e.message);
      break;
    }
  }
  fs.writeFileSync(path.join(BATCH_DIR, doneFile), JSON.stringify(out, null, 2), 'utf8');
  if (Object.keys(out).length === 0) {
    fs.unlinkSync(path.join(BATCH_DIR, doneFile));
    console.log(`Skipped empty ${doneFile}`);
  } else {
    console.log(`Wrote ${doneFile}: ${Object.keys(out).length}/${items.length}`);
  }
}

async function main() {
  const force = process.argv.includes('--force');
  const arg = process.argv.find((a) => a.match(/batch-/)) || 'all';
  const files = fs.readdirSync(BATCH_DIR).filter((f) => f.match(/^(en|cn)-batch-\d+\.json$/));
  for (const f of files.sort()) {
    const prefix = f.startsWith('cn') ? 'cn' : 'en';
    if (arg !== 'all' && !f.includes(arg)) continue;
    await processBatch(prefix, f, force);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
