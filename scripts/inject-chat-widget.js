const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const EN_ROOT = path.join(ROOT, 'en');
const AR_ROOT = path.join(ROOT, 'ar');
const MARKER = 'chat-widget.js';

function assetPrefix(relPath) {
  const depth = relPath.split('/').length - 1;
  return depth === 0 ? '' : '../'.repeat(depth);
}

function injectChatWidget(content, relPath) {
  if (content.includes(MARKER)) return content;

  const prefix = assetPrefix(relPath);
  const css = `<link rel="stylesheet" type="text/css" href="${prefix}css/chat-widget.css" />`;
  const js = `<script src="${prefix}js/chat-widget.js" defer></script>`;

  content = content.replace(/<\/head>/i, `${css}\n</head>`);
  content = content.replace(/<\/body>/i, `${js}\n</body>`);
  return content;
}

function collectHtmlFiles(dir, base = dir, list = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) {
      if (name === 'node_modules' || name === '.git') continue;
      collectHtmlFiles(full, base, list);
    } else if (name.endsWith('.html')) {
      list.push({ full, rel: path.relative(base, full).replace(/\\/g, '/') });
    }
  }
  return list;
}

function runInject() {
  let updated = 0;
  for (const base of [EN_ROOT, AR_ROOT]) {
    if (!fs.existsSync(base)) continue;
    for (const { full, rel } of collectHtmlFiles(base, base)) {
      const original = fs.readFileSync(full, 'utf8');
      const fixed = injectChatWidget(original, rel);
      if (fixed !== original) {
        fs.writeFileSync(full, fixed, 'utf8');
        updated++;
      }
    }
  }
  console.log(`Injected chat widget on ${updated} EN/AR pages`);
}

if (require.main === module) {
  runInject();
}

module.exports = { injectChatWidget, runInject };
