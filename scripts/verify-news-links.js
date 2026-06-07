const fs = require('fs');
const path = require('path');

const AR = path.join(__dirname, '..', 'ar');
const missing = [];

function resolveHref(fromDir, href) {
  const clean = href.split('#')[0];
  if (!clean || clean.startsWith('http') || clean.startsWith('javascript')) return null;
  if (clean.startsWith('/')) {
    return path.join(AR, clean.replace(/^\//, '').replace(/^en\//, ''));
  }
  return path.resolve(fromDir, clean);
}

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full);
    else if (name.endsWith('.html')) {
      const content = fs.readFileSync(full, 'utf8');
      for (const m of content.matchAll(/href=["']([^"']*newsShow[^"']*)["']/g)) {
        const target = resolveHref(path.dirname(full), m[1]);
        if (target && !fs.existsSync(target)) {
          missing.push({
            page: path.relative(AR, full).replace(/\\/g, '/'),
            href: m[1],
            expected: path.relative(path.join(__dirname, '..'), target).replace(/\\/g, '/'),
          });
        }
      }
    }
  }
}

walk(AR);
console.log(`Broken relative newsShow links: ${missing.length}`);
missing.slice(0, 40).forEach((x) => console.log(`${x.page} -> ${x.href}`));
if (missing.length > 40) console.log(`... and ${missing.length - 40} more`);
