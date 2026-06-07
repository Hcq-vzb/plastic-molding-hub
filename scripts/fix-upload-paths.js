const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const UPLOAD = path.join(ROOT, 'upload');
const SKIP_DIRS = new Set(['node_modules', '.git', 'scripts']);

const uploadIndex = buildUploadIndex();

function buildUploadIndex() {
  const byName = new Map();
  const byPrefix = new Map();

  function walk(dir) {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      if (fs.statSync(full).isDirectory()) walk(full);
      else {
        const rel = path.relative(ROOT, full).replace(/\\/g, '/');
        byName.set(name.toLowerCase(), rel);
        const ts = name.match(/^(\d{8,14})/);
        if (ts) {
          for (const len of [14, 12, 10, 8]) {
            const key = ts[1].slice(0, len);
            if (!byPrefix.has(key)) byPrefix.set(key, rel);
          }
        }
      }
    }
  }

  if (fs.existsSync(UPLOAD)) walk(UPLOAD);
  return { byName, byPrefix };
}

function flattenUploadPath(urlPath) {
  return urlPath.replace(/upload\/(\d{4})(\d{2})\/(\d{2})\//g, 'upload/$1$2$3/');
}

function expandUploadPath(urlPath) {
  return urlPath.replace(/upload\/(\d{4})(\d{2})(\d{2})\//g, 'upload/$1/$2/$3/');
}

function pathExists(urlPath) {
  const rel = urlPath.replace(/^(\.\.\/)+/, '').replace(/\\/g, '/');
  const abs = path.join(ROOT, rel.split('/').join(path.sep));
  return fs.existsSync(abs);
}

function resolveUploadPath(urlPath) {
  const normalized = urlPath.replace(/\\/g, '/');
  const relPrefix = normalized.match(/^((?:\.\.\/)+)/);
  const prefix = relPrefix ? relPrefix[1] : '';
  const uploadPart = normalized.replace(/^((?:\.\.\/)+)/, '');

  const variants = new Set([
    uploadPart,
    flattenUploadPath(uploadPart),
    expandUploadPath(uploadPart),
    flattenUploadPath(expandUploadPath(uploadPart)),
  ]);

  for (const variant of variants) {
    const candidate = `${prefix}${variant}`;
    if (pathExists(candidate)) return candidate;
  }

  const fileName = path.posix.basename(normalized);
  const byName = uploadIndex.byName.get(fileName.toLowerCase());
  if (byName) return `${prefix}${byName}`;

  const ts = fileName.match(/^(\d{8,14})/);
  if (ts) {
    for (const len of [14, 12, 10, 8]) {
      const hit = uploadIndex.byPrefix.get(ts[1].slice(0, len));
      if (hit) return `${prefix}${hit}`;
    }
  }

  return null;
}

function normalizeExternalUpload(content) {
  return content
    .replace(/(?:\.\.\/)+sunbun\.cn\/upload\//gi, (match) => {
      const depth = (match.match(/\.\.\//g) || []).length;
      return `${'../'.repeat(depth)}upload/`;
    })
    .replace(/https?:\/\/(?:www\.)?sunbun\.(?:cc|cn)\/upload\//gi, 'upload/');
}

function syncImgTags(content) {
  return content.replace(/<img\b[^>]*>/gi, (tag) => {
    const src = tag.match(/\bsrc=["']([^"']+)["']/i);
    const altSrc = tag.match(/\b_src=["']([^"']+)["']/i);
    if (!src || !altSrc) return tag;

    const srcVal = src[1];
    const altVal = altSrc[1];
    const srcBad =
      /sunbun\.(cc|cn)/i.test(srcVal) ||
      (!pathExists(srcVal) && !resolveUploadPath(srcVal));
    if (!srcBad) return tag;

    const resolved = resolveUploadPath(altVal);
    if (!resolved) return tag;
    return tag
      .replace(/\bsrc=["'][^"']*["']/i, `src="${resolved}"`)
      .replace(/\b_src=["'][^"']*["']/i, `_src="${resolved}"`);
  });
}

function fixRelativeDepth(content, relPath) {
  const dir = path.dirname(relPath.replace(/\\/g, '/'));
  const parts = dir.split('/').filter(Boolean);
  if (!parts.length) return content;

  const site = parts[0];
  if (site !== 'en' && site !== 'ar') return content;

  const depthInSite = parts.length - 1;
  if (depthInSite >= 2) {
    const imagesPrefix = `${'../'.repeat(depthInSite)}images/`;
    content = content.replace(
      /((?:src|href|_src|attr-img)=["'])\.\.\/images\//g,
      `$1${imagesPrefix}`
    );
  }

  if (parts.length >= 3) {
    const uploadPrefix = `${'../'.repeat(parts.length)}upload/`;
    content = content.replace(
      /((?:src|href|_src|attr-img)=["'])\.\.\/\.\.\/upload\//g,
      `$1${uploadPrefix}`
    );
    content = content.replace(/url\(\.\.\/\.\.\/upload\//g, `url(${uploadPrefix}`);
  }

  return content;
}

function fixUploadRefs(content, relPath) {
  let updated = normalizeExternalUpload(content);
  if (relPath) updated = fixRelativeDepth(updated, relPath);
  updated = syncImgTags(updated);

  const patterns = [
    /((?:src|href|_src|attr-img|data-src|data-original)=["'])((?:\.\.\/)+upload\/[^"']+)(["'])/gi,
    /(url\(\s*["']?)((?:\.\.\/)+upload\/[^"')]+)(["']?\s*\))/gi,
    /(url\(\s*)((?:\.\.\/)+upload\/[^)]+)(\))/gi,
  ];

  for (const pattern of patterns) {
    updated = updated.replace(pattern, (match, p1, urlPath, p3) => {
      const resolved = resolveUploadPath(urlPath);
      if (resolved && resolved !== urlPath) return `${p1}${resolved}${p3}`;
      return match;
    });
  }

  return updated;
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

function auditMissing(content, pageRel) {
  const missing = [];
  const refs = content.matchAll(
    /(?:src|href|_src|attr-img)=["']((?:(?:\.\.\/)+upload\/[^"']+|(?:\.\.\/)+sunbun\.cn\/upload\/[^"']+))["']/gi
  );
  for (const m of refs) {
    const urlPath = m[1];
    if (/sunbun\.(cc|cn)/i.test(urlPath)) {
      missing.push({ page: pageRel, path: urlPath });
      continue;
    }
    const resolved = resolveUploadPath(urlPath);
    if (!resolved) missing.push({ page: pageRel, path: urlPath });
  }
  return missing;
}

function runFix() {
  let filesUpdated = 0;
  const stillMissing = [];

  for (const { full, rel } of collectHtmlFiles(ROOT, ROOT)) {
    const original = fs.readFileSync(full, 'utf8');
    let fixed = fixUploadRefs(original, rel);
    let pass = 0;
    while (fixed !== fixUploadRefs(fixed, rel) && pass < 3) {
      fixed = fixUploadRefs(fixed, rel);
      pass++;
    }
    if (fixed !== original) {
      fs.writeFileSync(full, fixed, 'utf8');
      filesUpdated++;
    }
    stillMissing.push(...auditMissing(fixed, rel));
  }

  const uniqueMissing = [...new Map(stillMissing.map((m) => [`${m.page}|${m.path}`, m])).values()];
  console.log(`Fixed upload paths on ${filesUpdated} files`);
  console.log(`Remaining missing upload references: ${uniqueMissing.length}`);
  if (uniqueMissing.length) {
    for (const item of uniqueMissing.slice(0, 40)) {
      console.log(`  ${item.page}: ${item.path}`);
    }
    if (uniqueMissing.length > 40) console.log(`  ... and ${uniqueMissing.length - 40} more`);
  }
  return uniqueMissing.length;
}

if (require.main === module) {
  runFix();
}

module.exports = { fixUploadRefs, resolveUploadPath, runFix };
