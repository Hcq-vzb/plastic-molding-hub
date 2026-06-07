const { runFix } = require('./fix-upload-paths.js');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SKIP_DIRS = new Set(['node_modules', '.git', 'scripts']);

function collectHtmlFiles(dir, base = dir, list = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) {
      if (SKIP_DIRS.has(name)) continue;
      collectHtmlFiles(full, base, list);
    } else if (name.endsWith('.html')) {
      list.push({ full, rel: path.relative(base, full).replace(/\\/g, '/') });
    }
  }
  return list;
}

function resolveAsset(pageDir, urlPath) {
  const normalized = urlPath.replace(/\\/g, '/');
  if (/^(https?:|data:|javascript:)/i.test(normalized)) return true;
  const abs = path.resolve(pageDir, normalized.split('/').join(path.sep));
  return fs.existsSync(abs);
}

function auditImages() {
  let missing = 0;
  for (const { full, rel } of collectHtmlFiles(ROOT, ROOT)) {
    const dir = path.dirname(full);
    const content = fs.readFileSync(full, 'utf8');
    for (const m of content.matchAll(/(?:src|href|_src|attr-img)=["']([^"']+\.(?:jpg|jpeg|png|gif|webp|svg|JPG|PNG|GIF))["']/gi)) {
      const url = m[1];
      if (/sunbun\.(cc|cn)/i.test(url)) {
        console.log(`EXTERNAL ${rel}: ${url}`);
        missing++;
        continue;
      }
      if (!resolveAsset(dir, url)) {
        console.log(`MISSING ${rel}: ${url}`);
        missing++;
      }
    }
  }
  console.log(`Total missing/broken image refs: ${missing}`);
  return missing;
}

if (require.main === module) {
  const left = auditImages();
  process.exit(left ? 1 : 0);
}

module.exports = { auditImages };
