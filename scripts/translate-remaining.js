const fs = require('fs');
const path = require('path');
const { translate } = require('@vitalets/google-translate-api');

const AR_ROOT = path.join(__dirname, '..', 'ar');
const CACHE_FILE = path.join(__dirname, 'translate-cache.json');

const cache = fs.existsSync(CACHE_FILE)
  ? JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'))
  : {};

function collectHtmlFiles(dir, list = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) collectHtmlFiles(full, list);
    else if (name.endsWith('.html')) list.push(full);
  }
  return list;
}

function extractChineseSegments(text) {
  const segments = new Set();
  const re = /[\u4e00-\u9fff][\u4e00-\u9fff\s，。、；：！？（）《》「」【】｜·\dA-Za-z\-&;]+[\u4e00-\u9fff]|[\u4e00-\u9fff]{2,}/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const s = m[0].trim();
    if (s.length >= 2) segments.add(s);
  }
  return [...segments].sort((a, b) => b.length - a.length);
}

async function translateText(text) {
  if (cache[text]) return cache[text];
  await new Promise((r) => setTimeout(r, 120));
  const res = await translate(text, { from: 'zh-CN', to: 'ar' });
  cache[text] = res.text;
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');
  return res.text;
}

async function main() {
  const files = collectHtmlFiles(AR_ROOT);
  const allSegments = new Set();
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    extractChineseSegments(text).forEach((s) => allSegments.add(s));
  }

  const segments = [...allSegments].sort((a, b) => b.length - a.length);
  console.log(`Found ${segments.length} unique Chinese segments to translate`);

  let done = 0;
  for (const seg of segments) {
    if (!cache[seg]) {
      try {
        await translateText(seg);
        done++;
        if (done % 10 === 0) console.log(`Translated ${done}/${segments.length - Object.keys(cache).length + done}`);
      } catch (e) {
        console.error('Failed:', seg.slice(0, 40), e.message);
      }
    }
  }

  let updated = 0;
  for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    const original = content;
    for (const seg of segments) {
      if (cache[seg]) content = content.split(seg).join(cache[seg]);
    }
    if (content !== original) {
      fs.writeFileSync(file, content, 'utf8');
      updated++;
    }
  }
  console.log(`Applied translations to ${updated} files`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
