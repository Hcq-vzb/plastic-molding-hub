/**
 * Split long text into chunks, translate via MyMemory (or cache), merge Arabic.
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const CACHE = path.join(__dirname, 'translate-cache.json');
const cache = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, 'utf8')) : {};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function myMemory(text, langpair) {
  return new Promise((resolve, reject) => {
    const q = encodeURIComponent(text);
    https
      .get(`https://api.mymemory.translated.net/get?q=${q}&langpair=${langpair}`, { timeout: 30000 }, (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try {
            const j = JSON.parse(data);
            const t = j.responseData?.translatedText || '';
            if (/MYMEMORY WARNING|QUERY LENGTH|EXCEEDED/i.test(t)) reject(new Error(t.slice(0, 80)));
            else resolve(t);
          } catch (e) {
            reject(e);
          }
        });
      })
      .on('error', reject);
  });
}

function splitChunks(text, max = 450) {
  if (text.length <= max) return [text];
  const chunks = [];
  let rest = text;
  while (rest.length > max) {
    let cut = rest.lastIndexOf('. ', max);
    if (cut < max * 0.4) cut = rest.lastIndexOf(' ', max);
    if (cut < max * 0.3) cut = max;
    chunks.push(rest.slice(0, cut + (rest[cut] === ' ' ? 0 : 1)).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) chunks.push(rest);
  return chunks;
}

async function translateLong(text, langpair) {
  if (cache[text]) return cache[text];
  const chunks = splitChunks(text);
  const parts = [];
  for (const chunk of chunks) {
    const key = `${langpair}::${chunk}`;
    if (cache[key]) {
      parts.push(cache[key]);
      continue;
    }
    await sleep(400);
    const t = await myMemory(chunk, langpair);
    cache[key] = t;
    parts.push(t);
    fs.writeFileSync(CACHE, JSON.stringify(cache, null, 2), 'utf8');
  }
  const merged = parts.join(' ');
  cache[text] = merged;
  fs.writeFileSync(CACHE, JSON.stringify(cache, null, 2), 'utf8');
  return merged;
}

module.exports = { translateLong, splitChunks, myMemory };
