const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SKIP = new Set(['en', 'ar', 'scripts', 'node_modules', '.git']);

function collectCnHtml(dir, base = dir, list = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const rel = path.relative(base, full).replace(/\\/g, '/');
    if (fs.statSync(full).isDirectory()) {
      if (SKIP.has(name)) continue;
      collectCnHtml(full, base, list);
    } else if (name.endsWith('.html')) {
      list.push({ full, rel });
    }
  }
  return list;
}

function addNoindex(content) {
  if (/content="noindex/i.test(content)) return content;
  const tag = '<meta name="robots" content="noindex, follow" />';
  if (content.includes('<!-- kiwl-seo -->')) {
    return content.replace(/<!-- kiwl-seo -->/, `<!-- kiwl-seo -->\n${tag}`);
  }
  return content.replace(/<meta name="viewport"[^>]*\/?>/i, (m) => `${m}\n    ${tag}`);
}

function run() {
  let updated = 0;
  for (const { full } of collectCnHtml(ROOT, ROOT)) {
    const original = fs.readFileSync(full, 'utf8');
    const fixed = addNoindex(original);
    if (fixed !== original) {
      fs.writeFileSync(full, fixed, 'utf8');
      updated++;
    }
  }
  console.log(`Added noindex to ${updated} Chinese root pages`);
}

if (require.main === module) run();

module.exports = { run };
