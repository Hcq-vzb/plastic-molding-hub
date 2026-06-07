const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function repairBrokenPrefixes(content, relPath) {
  const dir = path.dirname(relPath.replace(/\\/g, '/'));
  const parts = dir.split('/').filter(Boolean);
  const site = parts[0];

  if (site !== 'en' && site !== 'ar') return content;

  const imagesPrefix = `${'../'.repeat(parts.length - 1)}images/`;
  const uploadPrefix = `${'../'.repeat(parts.length)}upload/`;

  let fixed = content.replace(/\.\.\/(?:\.\.\/){2,}images\//g, imagesPrefix);
  fixed = fixed.replace(/\.\.\/(?:\.\.\/){3,}upload\//g, uploadPrefix);
  fixed = fixed.replace(/\.\.\/(?:\.\.\/){2,}upload\//g, uploadPrefix);

  fixed = fixed.replace(
    /((?:src|href|_src|attr-img)=["'])\.\.\/images\//g,
    `$1${imagesPrefix}`
  );

  if (parts.length >= 3) {
    fixed = fixed.replace(
      /((?:src|href|_src|attr-img)=["'])\.\.\/\.\.\/upload\//g,
      `$1${uploadPrefix}`
    );
    fixed = fixed.replace(/url\(\.\.\/\.\.\/upload\//g, `url(${uploadPrefix}`);
  }

  return fixed;
}

function collectHtmlFiles(dir, base = dir, list = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) {
      if (name === 'node_modules' || name === '.git' || name === 'scripts') continue;
      collectHtmlFiles(full, base, list);
    } else if (name.endsWith('.html')) {
      list.push({ full, rel: path.relative(base, full).replace(/\\/g, '/') });
    }
  }
  return list;
}

let updated = 0;
for (const { full, rel } of collectHtmlFiles(ROOT, ROOT)) {
  const original = fs.readFileSync(full, 'utf8');
  const fixed = repairBrokenPrefixes(original, rel);
  if (fixed !== original) {
    fs.writeFileSync(full, fixed, 'utf8');
    updated++;
  }
}
console.log(`Repaired broken image prefixes on ${updated} files`);
