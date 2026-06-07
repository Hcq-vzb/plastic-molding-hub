const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const AR_ROOT = path.join(ROOT, 'ar');
const EN_ROOT = path.join(ROOT, 'en');
const TRANSLATIONS = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'cn-ar-translations.json'), 'utf8')
);
const EN_AR = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'en-ar-translations.json'), 'utf8')
);
const { replaceAnalytics } = require('./replace-analytics.js');
const { injectChatWidget } = require('./inject-chat-widget.js');
const { optimizePage, replaceDomainRefs } = require('./optimize-seo.js');

// Merge optional batch translation files
for (const file of ['en-ar-content.json', 'cn-ar-content.json']) {
  const p = path.join(__dirname, file);
  if (fs.existsSync(p)) {
    Object.assign(file.startsWith('en') ? EN_AR : TRANSLATIONS, JSON.parse(fs.readFileSync(p, 'utf8')));
  }
}

const PATH_MAP = {
  'about/about-1001.html': 'about/about-1105.html',
  'about/about-1012.html': 'about/about-1115.html',
  'zhxw/newsShow418.html': 'zhxw/newsShow419.html',
  'zhxw/newsShow406.html': 'zhxw/newsShow417.html',
  'zhxw/newsShow405.html': 'zhxw/newsShow416.html',
  'zhxw/newsShow404.html': 'zhxw/newsShow415.html',
  'zhxw/newsShow403.html': 'zhxw/newsShow414.html',
  'zhxw/newsShow402.html': 'zhxw/newsShow413.html',
  'zhxw/newsShow401.html': 'zhxw/newsShow412.html',
  'zhxw/newsShow400.html': 'zhxw/newsShow407.html',
  'zhxw/newsShow399.html': 'zhxw/newsShow408.html',
  'zhxw/newsShow398.html': 'zhxw/newsShow409.html',
  'zhxw/newsShow397.html': 'zhxw/newsShow411.html',
  'zhxw/news999_2.html': 'zhxw/news1103_2.html',
};

const SKIP_DIRS = new Set(['en', 'ar', 'scripts', 'node_modules', '.git']);

function newsArticleFingerprint(file, rel) {
  const c = fs.readFileSync(file, 'utf8');
  const cat = rel.split('/')[0];
  const dates = [...c.matchAll(/\d{4}-\d{2}-\d{2}/g)].map((m) => m[0]);
  const primaryDate = dates.find((d) => !d.startsWith('2014-')) || dates[0] || '';
  return `${cat}::${primaryDate}`;
}

function collectNewsArticles(dir, base, into) {
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) {
      if (SKIP_DIRS.has(name)) continue;
      collectNewsArticles(full, base, into);
    } else if (/^newsShow|^news\d+_/.test(name)) {
      const rel = path.relative(base, full).replace(/\\/g, '/');
      into[rel] = newsArticleFingerprint(full, rel);
    }
  }
}

function buildEnToCnNewsMap() {
  const enArticles = {};
  const cnArticles = {};
  collectNewsArticles(EN_ROOT, EN_ROOT, enArticles);
  collectNewsArticles(ROOT, ROOT, cnArticles);

  const fpToCn = {};
  for (const [rel, fp] of Object.entries(cnArticles)) {
    if (!fpToCn[fp]) fpToCn[fp] = rel;
  }

  const map = {};
  for (const [enRel, fp] of Object.entries(enArticles)) {
    if (fpToCn[fp]) map[enRel] = fpToCn[fp];
  }

  for (const [arRel, enRel] of Object.entries(PATH_MAP)) {
    if (/newsShow|^[\w]+\/news/.test(arRel)) map[enRel] = arRel;
  }

  // EN xc category maps to CN agricultural
  map['xc/newsShow392.html'] = 'agricultural/newsShow389.html';

  return map;
}

let NEWS_LINK_REPLACEMENTS = null;

function getNewsLinkReplacements() {
  if (NEWS_LINK_REPLACEMENTS) return NEWS_LINK_REPLACEMENTS;

  const enToCn = buildEnToCnNewsMap();
  const pairs = new Map();

  for (const [enRel, cnRel] of Object.entries(enToCn)) {
    pairs.set(enRel, cnRel);
    pairs.set(path.basename(enRel), path.basename(cnRel));
    pairs.set(`../${enRel}`, cnRel);
  }

  NEWS_LINK_REPLACEMENTS = [...pairs.entries()]
    .filter(([from, to]) => from !== to)
    .sort((a, b) => b[0].length - a[0].length);

  return NEWS_LINK_REPLACEMENTS;
}

function shouldPreferCnIndex(relPath) {
  if (!relPath.endsWith('/index.html')) return false;
  const cnPath = path.join(ROOT, relPath);
  if (!fs.existsSync(cnPath)) return false;
  const cnContent = fs.readFileSync(cnPath, 'utf8');
  return /newsShow\d|news\d+_/.test(cnContent);
}

function fixEnNewsLinks(content) {
  for (const [from, to] of getNewsLinkReplacements()) {
    content = content.split(from).join(to);
  }
  return content;
}

function collectHtmlFiles(dir, base = dir, list = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const rel = path.relative(base, full).replace(/\\/g, '/');
    if (fs.statSync(full).isDirectory()) {
      if (SKIP_DIRS.has(name)) continue;
      collectHtmlFiles(full, base, list);
    } else if (name.endsWith('.html')) {
      list.push({ full, rel });
    }
  }
  return list;
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const name of fs.readdirSync(src)) {
    const s = path.join(src, name);
    const d = path.join(dest, name);
    if (fs.statSync(s).isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function resolveEnSource(relPath) {
  if (shouldPreferCnIndex(relPath)) return null;
  const mapped = PATH_MAP[relPath];
  if (mapped && fs.existsSync(path.join(EN_ROOT, mapped))) return mapped;
  if (fs.existsSync(path.join(EN_ROOT, relPath))) return relPath;
  return null;
}

function normEntities(s) {
  return s
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&');
}

function applyDict(content, dict, safe = true) {
  const keys = Object.keys(dict).sort((a, b) => b.length - a.length);
  const doctype = content.match(/^<!DOCTYPE[^>]*>/);
  let body = doctype ? content.slice(doctype[0].length) : content;

  function replaceInText(text) {
    for (const key of keys) {
      if (!key || key.length < 2) continue;
      text = text.split(key).join(dict[key]);
      const nk = normEntities(key);
      if (nk !== key && text.includes(nk)) {
        text = text.split(nk).join(dict[key]);
      }
    }
    return text;
  }

  if (safe) {
    const parts = body.split(/(<[^>]+>)/);
    for (let i = 0; i < parts.length; i++) {
      if (!parts[i].startsWith('<')) parts[i] = replaceInText(parts[i]);
    }
    body = parts.join('');
  } else {
    body = replaceInText(body);
  }

  return doctype ? doctype[0] + body : body;
}

function translateMetaAttrs(content, dict) {
  return content.replace(
    /(<meta name="(?:Description|Keywords|description|keywords)" content=")([^"]*)(")/gi,
    (match, pre, val, post) => {
      let t = val;
      const keys = Object.keys(dict).sort((a, b) => b.length - a.length);
      for (const key of keys) {
        if (!key) continue;
        t = t.split(key).join(dict[key]);
        const nk = normEntities(key);
        if (nk !== key) t = t.split(nk).join(dict[key]);
      }
      return pre + t + post;
    }
  );
}

function applyAllTranslations(content) {
  const enContentPath = path.join(__dirname, 'en-ar-content.json');
  const enUiPath = path.join(__dirname, 'en-ar-translations.json');
  const enContent = fs.existsSync(enContentPath)
    ? JSON.parse(fs.readFileSync(enContentPath, 'utf8'))
    : {};
  const enUi = JSON.parse(fs.readFileSync(enUiPath, 'utf8'));
  const allEn = { ...enContent, ...enUi };
  content = applyDict(content, allEn, true);
  content = applyDict(content, TRANSLATIONS, true);
  content = translateMetaAttrs(content, allEn);
  content = translateMetaAttrs(content, TRANSLATIONS);
  return content;
}

const SINGLE_CN_AR = {
  男: 'ذكر',
  女: 'أنثى',
  月: ' ',
  丨: ' | ',
  错误: 'خطأ',
};

function applyCnToAttributes(content, dict) {
  return content.replace(/(\s(?:placeholder|title|alt|value))="([^"]*)"/gi, (match, attr, val) => {
    if (!/[\u4e00-\u9fff]/.test(val)) return match;
    let translated = val;
    const keys = Object.keys(dict).sort((a, b) => b.length - a.length);
    for (const key of keys) {
      if (!key) continue;
      translated = translated.split(key).join(dict[key]);
    }
    return `${attr}="${translated}"`;
  });
}

function applyCnInScriptStrings(content, dict) {
  return content.replace(/layer\.tips\('([^']*)'/g, (match, val) => {
    if (!/[\u4e00-\u9fff]/.test(val)) return match;
    let translated = val;
    const keys = Object.keys(dict).sort((a, b) => b.length - a.length);
    for (const key of keys) {
      if (!key) continue;
      translated = translated.split(key).join(dict[key]);
    }
    return `layer.tips('${translated}'`;
  });
}

function applySingleCnChars(content, map) {
  for (const [from, to] of Object.entries(map)) {
    content = content.replace(new RegExp(`>(\\s*)${from}(\\s*)<`, 'g'), `>$1${to}$2<`);
  }
  return content;
}

function applyDeepCnTranslations(content) {
  const merged = { ...TRANSLATIONS, ...EN_AR, ...SINGLE_CN_AR };
  content = applyCnToAttributes(content, merged);
  content = applyCnInScriptStrings(content, merged);
  content = applySingleCnChars(content, SINGLE_CN_AR);
  content = content.replace(/\/\/[^\n]*/g, (comment) => {
    if (!/[\u4e00-\u9fff]/.test(comment)) return comment;
    let translated = comment;
    const keys = Object.keys(merged).sort((a, b) => b.length - a.length);
    for (const key of keys) {
      if (!/[\u4e00-\u9fff]/.test(key)) continue;
      translated = translated.split(key).join(merged[key]);
    }
    return translated;
  });
  return content;
}

function fixPaths(content, depth) {
  if (depth === 0) {
    return content
      .replace(/href="dist\//g, 'href="../dist/')
      .replace(/src="dist\//g, 'src="../dist/')
      .replace(/href="layer\//g, 'href="../layer/')
      .replace(/src="layer\//g, 'src="../layer/')
      .replace(/href="upload\//g, 'href="../upload/')
      .replace(/src="upload\//g, 'src="../upload/')
      .replace(/href="fancybox\//g, 'href="../fancybox/')
      .replace(/src="fancybox\//g, 'src="../fancybox/')
      .replace(/src="images\/(index_02|logo2|index_27)/g, 'src="../images/$1')
      .replace(/href="en\//g, 'href="../en/');
  }

  // Site-root assets (upload, layer, dist) live outside ar/
  content = content
    .replace(/href="\.\.\/dist\//g, 'href="../../dist/')
    .replace(/src="\.\.\/dist\//g, 'src="../../dist/')
    .replace(/href="\.\.\/layer\//g, 'href="../../layer/')
    .replace(/src="\.\.\/layer\//g, 'src="../../layer/')
    .replace(/href="\.\.\/upload\//g, 'href="../../upload/')
    .replace(/src="\.\.\/upload\//g, 'src="../../upload/')
    .replace(/href="\.\.\/fancybox\//g, 'href="../../fancybox/')
    .replace(/src="\.\.\/fancybox\//g, 'src="../../fancybox/')
    .replace(/url\(\.\.\/upload\//g, 'url(../../upload/');

  // AR-local assets (images, js, css) are one level up from ar/{section}/
  content = content
    .replace(/src="\.\.\/\.\.\/images\//g, 'src="../images/')
    .replace(/href="\.\.\/\.\.\/images\//g, 'href="../images/');

  content = content.replace(/href="\.\.\/en\//g, 'href="../../en/');

  return content;
}

function computeUploadPrefix(relPath, site) {
  const dirParts = path.dirname(relPath.replace(/\\/g, '/')).split('/').filter(Boolean);
  if (site === 'cn') {
    return '../'.repeat(dirParts.length);
  }
  return '../'.repeat(dirParts.length + 1);
}

function computeRootImagesPrefix(relPath, site) {
  return computeUploadPrefix(relPath, site);
}

function computeLocalImagesPrefix(relPath, site) {
  if (site === 'cn') {
    return computeRootImagesPrefix(relPath, site);
  }
  const dirParts = path.dirname(relPath.replace(/\\/g, '/')).split('/').filter(Boolean);
  if (dirParts.length === 0) return 'images/';
  return `${'../'.repeat(dirParts.length)}images/`;
}

function fixLocalImages(content, relPath, site) {
  const uploadPrefix = computeUploadPrefix(relPath, site);
  const rootImagesPrefix = computeRootImagesPrefix(relPath, site);
  const localImagesPrefix = computeLocalImagesPrefix(relPath, site);

  content = content.replace(
    /https?:\/\/(?:www\.)?sunbun\.cc\/upload\//gi,
    `${uploadPrefix}upload/`
  );
  content = content.replace(
    /\/\/(?:www\.)?sunbun\.cc\/upload\//gi,
    `${uploadPrefix}upload/`
  );
  content = content.replace(
    /https?:\/\/(?:www\.)?sunbun\.cc\/en\/images\//gi,
    site === 'en' ? localImagesPrefix : `${rootImagesPrefix}en/images/`
  );
  content = content.replace(
    /https?:\/\/(?:www\.)?sunbun\.cc\/images\//gi,
    `${rootImagesPrefix}images/`
  );

  const uploadAttrs = '(?:src|href|_src|attr-img|data-src|data-original)';
  content = content.replace(
    new RegExp(`(\\b${uploadAttrs}=)"\\/upload\\/`, 'g'),
    `$1"${uploadPrefix}upload/`
  );
  content = content.replace(
    new RegExp(`(\\b${uploadAttrs}=)'\\/upload\\/`, 'g'),
    `$1'${uploadPrefix}upload/`
  );

  if (site === 'en' || site === 'ar') {
    content = content.replace(
      /(\b(?:src|href)=)"\/en\/images\//g,
      `$1"${localImagesPrefix}`
    );
  } else {
    content = content.replace(
      /(\b(?:src|href)=)"\/en\/images\//g,
      `$1"${rootImagesPrefix}en/images/`
    );
  }

  content = content.replace(
    /(\b(?:src|href)=)"\/images\//g,
    `$1"${rootImagesPrefix}images/`
  );

  content = content.replace(/url\(\s*\/upload\//g, `url(${uploadPrefix}upload/`);
  content = content.replace(/url\(\s*'\/upload\//g, `url('${uploadPrefix}upload/`);
  content = content.replace(/url\(\s*"\/upload\//g, `url("${uploadPrefix}upload/`);
  content = content.replace(/url\(\s*\/images\//g, `url(${rootImagesPrefix}images/`);
  content = content.replace(/url\(\s*'\/images\//g, `url('${rootImagesPrefix}images/`);
  content = content.replace(/url\(\s*"\/images\//g, `url("${rootImagesPrefix}images/`);

  return content;
}

function fixLocalImagesAllSites() {
  let updated = 0;

  for (const { full, rel } of collectHtmlFiles(ROOT, ROOT)) {
    if (rel.startsWith('en/') || rel.startsWith('ar/')) continue;
    let content = fs.readFileSync(full, 'utf8');
    const fixed = fixLocalImages(content, rel, 'cn');
    if (fixed !== content) {
      fs.writeFileSync(full, fixed, 'utf8');
      updated++;
    }
  }

  for (const base of [EN_ROOT, AR_ROOT]) {
    if (!fs.existsSync(base)) continue;
    const site = base === EN_ROOT ? 'en' : 'ar';
    for (const { full, rel } of collectHtmlFiles(base, base)) {
      let content = fs.readFileSync(full, 'utf8');
      const fixed = fixLocalImages(content, rel, site);
      if (fixed !== content) {
        fs.writeFileSync(full, fixed, 'utf8');
        updated++;
      }
    }
  }

  console.log(`Fixed local image paths on ${updated} pages`);
}

function fixContactInfo(content) {
  content = content.replace(/sunbunpm@163\.com/g, 'cathy@plasticmoldinghub.com');
  content = content.replace(
    /<a href="https:\/\/www\.facebook\.com\/[^"]*"[^>]*>/gi,
    '<a href="javascript:;" class="social-link-disabled">'
  );
  content = content.replace(
    /<a href="https:\/\/www\.linkedin\.com\/[^"]*"[^>]*>/gi,
    '<a href="javascript:;" class="social-link-disabled">'
  );
  return content;
}

function fixFooterWhatsApp(content, site = 'en') {
  const label = site === 'ar' ? 'واتساب' : 'WhatsApp';
  return content.replace(
    /(<li><img src="[^"]*index_35\.jpg"><p>)(?:抖音号|Tiktok|TikTok|حساب Douyin|WhatsApp|واتساب)(<\/p><\/li>)/gi,
    `$1${label}$2`
  );
}

function fixContactInfoAllSites() {
  let updated = 0;
  for (const { full, rel } of collectHtmlFiles(ROOT, ROOT)) {
    if (rel.startsWith('en/') || rel.startsWith('ar/')) continue;
    let content = fs.readFileSync(full, 'utf8');
    const fixed = fixFooterWhatsApp(fixContactInfo(content), 'cn');
    if (fixed !== content) {
      fs.writeFileSync(full, fixed, 'utf8');
      updated++;
    }
  }
  for (const base of [EN_ROOT, AR_ROOT]) {
    if (!fs.existsSync(base)) continue;
    const site = base === AR_ROOT ? 'ar' : 'en';
    for (const { full } of collectHtmlFiles(base, base)) {
      let content = fs.readFileSync(full, 'utf8');
      const fixed = fixFooterWhatsApp(fixContactInfo(content), site);
      if (fixed !== content) {
        fs.writeFileSync(full, fixed, 'utf8');
        updated++;
      }
    }
  }
  console.log(`Updated contact/footer info on ${updated} pages`);
}

function injectServiceGoogleMap(content) {
  const mapIframe =
    '<iframe class="service-google-map" title="KIWL Location" src="https://maps.google.com/maps?q=Building+4,+Xingyuan+Road,+Nanfeng+Town,+Zhangjiagang+City,+Jiangsu,+China&amp;hl=en&amp;z=16&amp;output=embed" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>';
  return content.replace(
    /<div class="clasksi_top_right_content">\s*<img src="[^"]*01_about_27\.jpg"\s*\/?>\s*<\/div>/gi,
    `<div class="clasksi_top_right_content">${mapIframe}</div>`
  );
}

function fixArScripts(content) {
  return content
    .replace(/js\/js5e1f\.js/g, 'js/js.js')
    .replace(/js\/jsc81e\.js/g, 'js/js.js');
}

function addRtl(content, depth) {
  content = content.replace(
    /<html xmlns="http:\/\/www\.w3\.org\/1999\/xhtml">/,
    '<html xmlns="http://www.w3.org/1999/xhtml" lang="ar" dir="rtl">'
  );
  const rtlHref = depth === 0 ? 'css/rtl.css' : '../css/rtl.css';
  if (!content.includes('rtl.css')) {
    content = content.replace(
      /<meta http-equiv="Content-Type" content="text\/html; charset=utf-8" \/>/,
      `<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />\n    <link rel="stylesheet" type="text/css" href="${rtlHref}" />`
    );
  }
  return content;
}

function fixEnLangLinks(content, depth) {
  const enHref = `${'../'.repeat(depth + 1)}en/index.html`;
  const aboutBase = `${depth === 0 ? '' : '../'.repeat(depth)}about/about-1001.html`;

  // Language switcher on AR pages: point to English site
  content = content.replace(
    /<a href="(?:\.\.\/)*ar\/index\.html">(?:العربية|AR)<\/a>/gi,
    `<a href="${enHref}">English</a>`
  );
  content = content.replace(
    /<li><a href="(?:\.\.\/)*ar\/index\.html">(?:العربية|AR)<\/a><\/li>/gi,
    `<li><a href="${enHref}">EN</a></li>`
  );

  const imgPrefix = `${'../'.repeat(depth + 1)}images/`;
  content = content
    .replace(/src="\/en\/images\//g, `src="${imgPrefix}`)
    .replace(/href="\/en\/about\/about-1106\.html"/g, `href="${aboutBase}"`)
    .replace(/href="\/en\/whsb\/"/g, `href="${aboutBase}"`)
    .replace(/href="\/en\/ryzz\/"/g, `href="${aboutBase}"`)
    .replace(/href="\/en\/shzr\/"/g, `href="${aboutBase}"`);

  content = content.replace(/href="(?:\.\.\/)*en\/index\.html"/gi, `href="${enHref}"`);
  content = content.replace(
    /<li><a href="(?:\.\.\/)*en\/index\.html">English<\/a><\/li>/gi,
    `<li><a href="${enHref}">EN</a></li>`
  );

  return content;
}

function localizePage(content, relPath) {
  const depth = relPath.split('/').length - 1;
  content = replaceAnalytics(content);
  content = fixLocalImages(content, relPath, 'ar');
  content = fixPaths(content, depth);
  content = fixArScripts(content);
  content = applyAllTranslations(content);
  content = applyDeepCnTranslations(content);

  // Fix leftover Chinese date/fragments in mixed content
  const months = ['', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  content = content
    .replace(/(\d+)\s*月\s*(\d+)/g, (_, mon, day) => `${day} ${months[parseInt(mon, 10)] || mon}`)
    .replace(/100周年/g, 'الذكرى المئوية')
    .replace(/KIWL集团/g, 'مجموعة KIWL')
    .replace(/集团/g, 'المجموعة')
    .replace(/周年/g, 'الذكرى السنوية')
    .replace(/。/g, '.')
    .replace(/；/g, '؛')
    .replace(/ SHINES AT /g, ' تحضر ')
    .replace(/ ATTENDED THE /g, ' تحضر ')
    .replace(/Quantang Group/g, 'مجموعة تشيوان تانغ')
    .replace(/البلasticيك/g, 'البلاستيك')
    .replace(/alert\('没有了'\)/g, "alert('لا يوجد')")
    .replace(/font-family:\s*宋体/g, 'font-family: Arial')
    .replace(/font-family:\s*思源黑体/g, 'font-family: Arial')
    .replace(/<span style="font-family:宋体">月<\/span>/g, ' ')
    .replace(/<span style="font-family: 宋体">月<\/span>/g, ' ')
    .replace(/([\d])<span[^>]*>月<\/span>([\d])/g, '$1 $2');

  content = fixEnLangLinks(content, depth);

  content = fixEnNewsLinks(content);

  content = injectServiceGoogleMap(content);

  content = fixContactInfo(content);
  content = fixFooterWhatsApp(content, 'ar');
  content = injectChatWidget(content, relPath);
  content = optimizePage(content, relPath, 'ar');

  content = content
    .replace(/action="\.\.\/search\/""+/g, 'action="../search/"')
    .replace(/action="http:\/\/www\.sunbun\.cc\/search\//g, 'action="../search/"')
    .replace(/action="http:\/\/www\.sunbun\.cc\/en\/search\//g, 'action="../search/"')
    .replace(/value="搜索"/g, 'value="بحث"')
    .replace(/value="Submit"/g, 'value="بحث"');

  content = addRtl(content, depth);
  content = content.replace(/<a href="index\.html">首页<\/a>/g, '<a href="index.html">الرئيسية</a>');
  content = content.replace(/<a href="\.\.\/index\.html">首页<\/a>/g, '<a href="../index.html">الرئيسية</a>');
  content = content.replace(/<a href="\.\.\/index\.html">Home<\/a>/g, '<a href="../index.html">الرئيسية</a>');

  content = content
    .replace(/about\/about-1105\.html/g, 'about/about-1001.html')
    .replace(/about\/about-1115\.html/g, 'about/about-1012.html');

  // Translate text inside style="" attributes (font names etc.)
  content = content.replace(/style="([^"]*)"/gi, (m, style) => {
    let s = style;
    for (const [k, v] of Object.entries(TRANSLATIONS).sort((a, b) => b[0].length - a[0].length)) {
      if (/[\u4e00-\u9fff]/.test(k)) s = s.split(k).join(v);
    }
    return `style="${s}"`;
  });

  // Translate img title/alt with Chinese
  content = content.replace(/(title|alt)="([^"]*)"/gi, (m, attr, val) => {
    if (!/[\u4e00-\u9fff]/.test(val)) return m;
    let v = val;
    for (const [k, tv] of Object.entries(TRANSLATIONS).sort((a, b) => b[0].length - a[0].length)) {
      if (/[\u4e00-\u9fff]/.test(k)) v = v.split(k).join(tv);
    }
    return `${attr}="${v}"`;
  });

  return content;
}

function buildArHomepage() {
  let content = fs.readFileSync(path.join(EN_ROOT, 'index.html'), 'utf8');
  content = applyAllTranslations(content);
  content = content
    .replace(/about\/about-1105\.html/g, 'about/about-1001.html')
    .replace(/action="\.\.\/search\/""+/g, 'action="../search/"')
    .replace(/action="http:\/\/www\.sunbun\.cc\/en\/search\//g, 'action="../search/"')
    .replace(/value="Submit"/g, 'value="بحث"');
  content = addRtl(content, 0);
  content = localizePage(content, 'index.html');
  fs.writeFileSync(path.join(AR_ROOT, 'index.html'), content, 'utf8');
  console.log('Built ar/index.html from English template');
}

function buildArSite() {
  if (fs.existsSync(AR_ROOT)) fs.rmSync(AR_ROOT, { recursive: true, force: true });
  fs.mkdirSync(AR_ROOT, { recursive: true });
  NEWS_LINK_REPLACEMENTS = null;
  getNewsLinkReplacements();

  copyDir(path.join(EN_ROOT, 'js'), path.join(AR_ROOT, 'js'));
  copyDir(path.join(EN_ROOT, 'css'), path.join(AR_ROOT, 'css'));
  copyDir(path.join(EN_ROOT, 'images'), path.join(AR_ROOT, 'images'));

  const rtlCss = `/* Arabic RTL overrides */
html[dir="rtl"] body { direction: rtl; text-align: right; }
html[dir="rtl"] .menu ul,
html[dir="rtl"] .m_menu ul,
html[dir="rtl"] .foot_center ul { direction: rtl; }
html[dir="rtl"] .foot_left_1 { float: right; }
html[dir="rtl"] .foot_left_2 { float: right; margin-right: .4rem; margin-left: 0; }
html[dir="rtl"] .logo { float: right; }
html[dir="rtl"] .m_list { float: left; }
html[dir="rtl"] .banner_news_main li .font_1 { float: right; }
html[dir="rtl"] .banner_news_main li .font_2 { float: right; margin-right: .2rem; margin-left: 0; }
html[dir="rtl"] .banner_news_main li .font_3 { float: left; }
html[dir="rtl"] .claksi_foot_left::after { left: auto; right: 0; }
html[dir="rtl"] .l_a_banner_list-1 { left: auto; right: 0; }
html[dir="rtl"] .m_banner_left { left: auto; right: 1.2rem; transform: scaleX(-1); }
html[dir="rtl"] .m_banner_right { right: auto; left: 1.2rem; transform: scaleX(-1); }
html[dir="rtl"] .footer .foot_left_2 a { background-position: right .2rem center; padding-right: .58rem; padding-left: .2rem; }
html[dir="rtl"] .cdan_1, html[dir="rtl"] .cdan_2 { text-align: right; }
html[dir="rtl"] .main_w { text-align: right; }
html[dir="rtl"] .in_topbox .menu { text-align: right; }
html[dir="rtl"] .nav { text-align: right; }
html[dir="rtl"] .xwhd_s_c_t_1_3_right_4 { float: left; }
html[dir="rtl"] .xwhd_s_c_t_1_2_left { float: right; }
html[dir="rtl"] .xwhd_s_c_t_1_3_right { float: left; }
html[dir="rtl"] .job8 ul, html[dir="rtl"] .job2 ul { direction: rtl; }
html[dir="rtl"] .list-paddingleft-2 { padding-right: 0; padding-left: 0; }
html[dir="rtl"] .seaz { float: right; }
html[dir="rtl"] .seay { float: left; }
/* Fallback: show content if ScrollMagic/JS fails to load */
html[dir="rtl"] .not-animated { opacity: 1; visibility: visible; }
/* Inner pages: show dark header nav without waiting for scroll/JS */
html[dir="rtl"] .main:has(.l_a_banner) .main_tops {
  background: #fff;
}
html[dir="rtl"] .main:has(.l_a_banner) .main_tops .m_menu li,
html[dir="rtl"] .main:has(.l_a_banner) .main_tops .m_menu li a {
  color: #333;
}
html[dir="rtl"] .main:has(.l_a_banner) .main_tops .logo1 { display: block; }
html[dir="rtl"] .main:has(.l_a_banner) .main_tops .logo2 { display: none; }
html[dir="rtl"] .main:has(.l_a_banner) .main_tops .menu_wap {
  background: url(../images/menu_s.png) no-repeat center;
}
`;
  fs.writeFileSync(path.join(AR_ROOT, 'css', 'rtl.css'), rtlCss, 'utf8');

  const files = collectHtmlFiles(ROOT, ROOT);
  let fromEn = 0;
  let fromCn = 0;

  for (const { full, rel } of files) {
    if (rel === 'index.html') continue;
    const depth = rel.split('/').length - 1;
    const dest = path.join(AR_ROOT, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });

    const enRel = resolveEnSource(rel);
    let content;
    if (enRel) {
      content = fs.readFileSync(path.join(EN_ROOT, enRel), 'utf8');
      fromEn++;
    } else {
      content = fs.readFileSync(full, 'utf8');
      fromCn++;
    }
    content = localizePage(content, rel);
    fs.writeFileSync(dest, content, 'utf8');
  }

  console.log(`Built ${fromEn + fromCn} pages (${fromEn} from EN, ${fromCn} from CN)`);
  buildArHomepage();
}

function updateEnLanguageLinks() {
  const enFiles = collectHtmlFiles(EN_ROOT, EN_ROOT);
  let updated = 0;
  for (const { full, rel } of enFiles) {
    let content = fs.readFileSync(full, 'utf8');
    const original = content;
    const depth = rel.split('/').length - 1;
    const arPrefix = '../'.repeat(depth + 1) + 'ar/index.html';

    content = content
      .replace(/中文版/g, 'العربية')
      .replace(/<a href="(\.\.\/)+index\.html">中文<\/a>/g, `<a href="${arPrefix}">AR</a>`);

    if (rel === 'index.html') {
      content = content.replace(/href="\.\.\/index\.html"/g, 'href="../ar/index.html"');
    } else {
      const prefix = '../'.repeat(depth + 1);
      content = content.replace(
        new RegExp(`href="${prefix.replace(/\./g, '\\.')}index\\.html"`, 'g'),
        `href="${prefix}ar/index.html"`
      );
    }

    if (content !== original) {
      fs.writeFileSync(full, content, 'utf8');
      updated++;
    }
  }
  console.log(`Updated ${updated} English pages with Arabic language links`);
}

function fixEnAboutJobChinese() {
  const cnEnJobPath = path.join(__dirname, 'cn-en-job-content.json');
  if (!fs.existsSync(cnEnJobPath)) return;
  const dict = JSON.parse(fs.readFileSync(cnEnJobPath, 'utf8'));
  const targets = [];
  for (const rel of ['about/about-1105.html', 'about/about-1115.html']) {
    const full = path.join(EN_ROOT, rel);
    if (fs.existsSync(full)) targets.push(full);
  }
  for (const name of fs.readdirSync(path.join(EN_ROOT, 'job'))) {
    if (name.endsWith('.html')) targets.push(path.join(EN_ROOT, 'job', name));
  }
  let updated = 0;
  for (const full of targets) {
    let content = fs.readFileSync(full, 'utf8');
    const original = content;
    const keys = Object.keys(dict).sort((a, b) => b.length - a.length);
    for (const key of keys) {
      content = content.split(key).join(dict[key]);
    }
    if (content !== original) {
      fs.writeFileSync(full, content, 'utf8');
      updated++;
    }
  }
  console.log(`Fixed Chinese text on ${updated} English About/Job pages`);
}

function createRootRedirect() {
  const redirect = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta http-equiv="refresh" content="0; url=en/index.html" />
<title>Quantang Group</title>
<script>location.replace('en/index.html');</script>
</head>
<body>
<p><a href="en/index.html">English</a> | <a href="ar/index.html">العربية</a></p>
</body>
</html>`;
  fs.writeFileSync(path.join(ROOT, 'index.html'), redirect, 'utf8');
  console.log('Root index.html redirects to en/index.html');
}

if (process.argv.includes('--images-only')) {
  fixLocalImagesAllSites();
  require('./repair-image-paths.js');
  require('./fix-upload-paths.js').runFix();
} else if (process.argv.includes('--djwh-only')) {
  require('./build-en-djwh.js');
} else if (process.argv.includes('--site-info-only')) {
  fixContactInfoAllSites();
} else if (process.argv.includes('--chat-only')) {
  require('./inject-chat-widget.js').runInject();
} else if (process.argv.includes('--seo-only')) {
  require('./optimize-seo.js').runOptimize();
} else {
  buildArSite();
  updateEnLanguageLinks();
  fixEnAboutJobChinese();
  fixContactInfoAllSites();
  fixLocalImagesAllSites();
  require('./repair-image-paths.js');
  require('./fix-upload-paths.js').runFix();
  require('./build-en-djwh.js');
  require('./replace-analytics.js').runReplace();
  require('./inject-chat-widget.js').runInject();
  require('./optimize-seo.js').runOptimize();
  createRootRedirect();
}
