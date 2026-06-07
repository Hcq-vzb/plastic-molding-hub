const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SKIP_DIRS = new Set(['node_modules', '.git', 'scripts']);
const CONFIG = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'analytics-config.json'), 'utf8')
);
const GA_ID = (CONFIG.gaMeasurementId || '').trim();

const CNZZ_PATTERN =
  /\s*<script type="text\/javascript">document\.write\(unescape\("%3Cspan id='cnzz_stat_icon_1281243190'[\s\S]*?<\/script>/gi;

function gaHeadSnippet(id) {
  return `<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${id}');
</script>`;
}

function replaceAnalytics(content) {
  content = content.replace(CNZZ_PATTERN, '');

  if (!GA_ID || GA_ID.includes('XXXXXXXXXX')) {
    return content;
  }

  if (!content.includes('googletagmanager.com/gtag/js')) {
    content = content.replace(/<\/head>/i, `${gaHeadSnippet(GA_ID)}\n</head>`);
  } else {
    content = content.replace(
      /googletagmanager\.com\/gtag\/js\?id=G-[A-Z0-9]+/g,
      `googletagmanager.com/gtag/js?id=${GA_ID}`
    );
    content = content.replace(/gtag\('config',\s*'G-[A-Z0-9]+'\)/g, `gtag('config', '${GA_ID}')`);
  }

  return content;
}

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

function runReplace() {
  if (!GA_ID || GA_ID.includes('XXXXXXXXXX')) {
    console.warn('Warning: Set a real GA4 ID in scripts/analytics-config.json (gaMeasurementId).');
  }

  let updated = 0;
  let cnzzRemoved = 0;

  for (const { full, rel } of collectHtmlFiles(ROOT, ROOT)) {
    const original = fs.readFileSync(full, 'utf8');
    if (!CNZZ_PATTERN.test(original) && original.includes('googletagmanager.com/gtag/js')) {
      continue;
    }
    CNZZ_PATTERN.lastIndex = 0;
    const fixed = replaceAnalytics(original);
    if (fixed !== original) {
      fs.writeFileSync(full, fixed, 'utf8');
      updated++;
      if (CNZZ_PATTERN.test(original)) cnzzRemoved++;
      CNZZ_PATTERN.lastIndex = 0;
    }
  }

  console.log(`Updated analytics on ${updated} pages (CNZZ removed)`);
  if (GA_ID && !GA_ID.includes('XXXXXXXXXX')) {
    console.log(`Google Analytics ID: ${GA_ID}`);
  }
}

if (require.main === module) {
  runReplace();
}

module.exports = { replaceAnalytics, runReplace };
