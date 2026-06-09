const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const EN_ROOT = path.join(ROOT, 'en');
const AR_ROOT = path.join(ROOT, 'ar');
const CONFIG = JSON.parse(fs.readFileSync(path.join(__dirname, 'seo-config.json'), 'utf8'));
const DOMAIN = CONFIG.domain.replace(/\/$/, '');

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
  'xc/index.html': 'agricultural/index.html',
  'xc/newsShow392.html': 'agricultural/newsShow389.html',
};

const EN_TO_AR = {};
for (const [arRel, enRel] of Object.entries(PATH_MAP)) {
  EN_TO_AR[enRel] = arRel;
}

const JUNK_DIR_PREFIXES = ['plugin/', 'fancybox/', 'images/'];
const SITEMAP_EXCLUDE_FILES = new Set(['shengbang2025.html']);

function arToEnRel(arRel) {
  for (const [ar, en] of Object.entries(PATH_MAP)) {
    if (ar === arRel) return en;
  }
  return arRel;
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

function isIdAliasPage(relPath) {
  return /\/id=\d+\.html$/i.test(relPath) || /^id=\d+\.html$/i.test(relPath);
}

function isJunkPath(relPath) {
  if (SITEMAP_EXCLUDE_FILES.has(relPath)) return true;
  return JUNK_DIR_PREFIXES.some((p) => relPath.startsWith(p));
}

function isErrorStub(content) {
  return /404\.safedog\.cn|safedogsite\/head\.png/i.test(content);
}

function productShowFromId(relPath) {
  const m = relPath.match(/id=(\d+)\.html$/i);
  if (!m) return null;
  return relPath.replace(/id=\d+\.html$/i, `productShow${m[1]}.html`);
}

function shouldIndex(relPath, content) {
  if (isIdAliasPage(relPath)) return false;
  if (isJunkPath(relPath)) return false;
  if (isErrorStub(content)) return false;
  return true;
}

function extractTitle(content) {
  const m = content.match(/<title>([^<]*)<\/title>/i);
  return m ? m[1].trim() : '';
}

function extractTopicFromBody(content, relPath) {
  if (/productShow\d+\.html$/i.test(relPath)) {
    const dir = relPath.replace(/productShow\d+\.html$/i, '');
    const id = relPath.match(/productShow(\d+)\.html/i)[1];
    const re = new RegExp(`productShow${id}\\.html"[^>]*>([^<]+)<`, 'i');
    const m = content.match(re);
    if (m && m[1].trim().length > 4) return m[1].replace(/\s+/g, ' ').trim();
  }

  const curLinks = [...content.matchAll(/<a[^>]*class="[^"]*cur[^"]*"[^>]*>([^<]+)<\/a>/gi)];
  for (let i = curLinks.length - 1; i >= 0; i--) {
    const text = curLinks[i][1].replace(/\s+/g, ' ').trim();
    if (text.length > 4 && !/^home$|^submit$|^more$/i.test(text)) return text;
  }
  const h1 = content.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1) {
    const text = h1[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    if (text.length > 4) return text.slice(0, 120);
  }
  return null;
}

function stripBrandSuffix(text, site) {
  const suffix = site === 'ar' ? CONFIG.titleSuffixAr : CONFIG.titleSuffixEn;
  let t = text.replace(/&amp;/g, '&').trim();
  const suffixEsc = suffix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  t = t.replace(new RegExp(`\\s*${suffixEsc}(\\s*${suffixEsc})*`, 'gi'), '');
  t = t.replace(/\s*\|\s*KIWL\s*·\s*PlasticMoldingHub(\s*\|\s*[^|]+)*/gi, '');
  t = t.replace(/\s*\|\s*KIWL[^|]*/gi, '');
  t = t.replace(/\.\.\.\s*$/, '').trim();
  if (t.includes('|')) t = t.split('|')[0].trim();
  return t;
}

function cleanTopic(title, site, bodyTopic) {
  let fromTitle = stripBrandSuffix(title, site)
    .replace(/-Shanghai Quantang Ecological Technology Group Co\., Ltd\.?\s*$/i, '')
    .replace(/شركة شنغهاي تشيوان تانغ[^-]*$/g, '')
    .trim();

  const parts = fromTitle.split('-').map((p) => p.trim()).filter(Boolean);
  if (parts.length > 1 && parts[parts.length - 1].length < 40) {
    fromTitle = parts.slice(0, -1).join(' - ');
  }

  let t = fromTitle;
  if (bodyTopic) {
    const fromBody = stripBrandSuffix(bodyTopic, site).trim();
    const titleLooksTruncated = /\.\.\.$/.test(fromTitle) || (fromTitle.length >= 48 && fromBody.length > fromTitle.length + 8);
    if (fromBody.length > 4 && (titleLooksTruncated || fromBody.length > fromTitle.length + 5 || fromTitle.length < 8)) {
      t = fromBody;
    }
  }

  if (t.length > 100) t = t.slice(0, 97).trim();
  return t || (site === 'ar' ? CONFIG.companyAr : CONFIG.companyEn);
}

function optimizeTitle(topic, site, relPath = '') {
  const suffix = site === 'ar' ? CONFIG.titleSuffixAr : CONFIG.titleSuffixEn;
  let main = stripBrandSuffix(topic, site);
  const isProduct = /productShow\d+\.html$/i.test(relPath);
  const maxTotal = isProduct ? 92 : 72;
  const maxMain = Math.max(45, maxTotal - suffix.length - 1);
  if (main.length > maxMain) {
    const cut = main.slice(0, maxMain);
    const lastSpace = cut.lastIndexOf(' ');
    main = lastSpace > 24 ? cut.slice(0, lastSpace) : cut.trim() + '...';
  }
  return `${main} ${suffix}`;
}

function sectionKey(relPath) {
  const seg = relPath.split('/')[0];
  if (relPath === 'index.html') return 'home';

  if (/^products_1/.test(seg)) return 'products_1';
  if (/^products_2/.test(seg)) return 'products_2';
  if (/^products_3/.test(seg)) return 'products_3';
  if (/^products_4/.test(seg)) return 'gyyyf';
  if (seg === 'gyyyf') return 'gyyyf';
  if (seg.startsWith('products')) return 'products';

  const appMap = {
    engineering: 'app_automotive',
    yil: 'app_medical',
    ryp: 'app_daily',
    txdz: 'app_electronics',
    jd: 'app_appliance',
    bz: 'app_packaging',
    wlhb: 'app_logistics',
    xc: 'app_shoe',
    wj: 'app_stationery',
    agricultural: 'app_agricultural',
  };
  if (appMap[seg]) return appMap[seg];

  if (['zhxw', 'sbdt', 'hyzx', 'yghd', 'jjfa', 'djwh', 'news'].includes(seg)) return 'news';
  if (seg === 'about') return 'about';
  if (seg === 'job') return 'job';
  if (seg === 'services') return 'services';
  if (seg === 'solution') return 'solution';
  return 'default';
}

function pageType(relPath) {
  if (/productShow\d+\.html$/i.test(relPath)) return 'product';
  if (/newsShow\d+\.html$/i.test(relPath) || /news\d+_\d+\.html$/i.test(relPath)) return 'news';
  if (relPath === 'index.html') return 'index';
  if (sectionKey(relPath).startsWith('app_')) return 'application';
  if (/^products/.test(relPath.split('/')[0]) || ['gyyyf'].includes(relPath.split('/')[0])) {
    return relPath.endsWith('index.html') ? 'productCategory' : 'default';
  }
  const key = sectionKey(relPath);
  if (['about', 'services', 'solution', 'job'].includes(key)) return key;
  if (key === 'news' && relPath.endsWith('index.html')) return 'news';
  return 'default';
}

/** Pyramid: tier3 (page) + tier2 (section) + tier1 (brand core) */
function getKeywords(relPath, site, topic) {
  const pyramid = CONFIG.keywordPyramid[site];
  const key = sectionKey(relPath);
  if (key === 'home') return pyramid.tier1;

  const tier1 = pyramid.tier1;
  const tier2 = pyramid.tier2[key] || pyramid.tier2.products || tier1;

  const tier3Parts = [];
  if (/productShow\d+\.html$/i.test(relPath) && topic) {
    const series = topic.match(/\b(SKII?|SK-HYB|SE|S|J6|V|SH|NS)\b/i);
    if (series) tier3Parts.push(`${series[0]} injection molding machine`);
    tier3Parts.push(topic.split(/[,，]/)[0].slice(0, 60));
  } else if (/newsShow|news\d+_/i.test(relPath) && topic) {
    tier3Parts.push(topic.slice(0, 50));
  } else if (topic && relPath.endsWith('index.html') && key !== 'home') {
    tier3Parts.push(topic.slice(0, 50));
  }

  const tier3 = tier3Parts.filter(Boolean).join(', ');
  return [tier3, tier2, tier1].filter(Boolean).join(', ');
}

function fillTemplate(tpl, topic) {
  return tpl.replace(/\{topic\}/g, topic);
}

function buildDescription(topic, site, relPath) {
  const descCfg = CONFIG.descriptions[site];
  const type = pageType(relPath);
  const key = sectionKey(relPath);

  let template;
  if (type === 'index' || key === 'home') template = descCfg.home;
  else if (type === 'product') template = descCfg.product;
  else if (type === 'productCategory') template = descCfg.productCategory;
  else if (type === 'application') template = descCfg.application;
  else if (type === 'news') template = descCfg.news;
  else if (descCfg[key]) template = descCfg[key];
  else template = descCfg.default;

  let desc = fillTemplate(template, topic);
  if (desc.length > 158) desc = desc.slice(0, 155).trim() + '...';
  return desc;
}

function pageUrl(site, relPath) {
  return `${DOMAIN}/${site}/${relPath === 'index.html' ? 'index.html' : relPath}`;
}

function alternateRel(relPath, site) {
  if (site === 'en') return EN_TO_AR[relPath] || relPath;
  return arToEnRel(relPath);
}

function sitemapPriority(relPath) {
  if (relPath === 'index.html') return '1.0';
  const type = pageType(relPath);
  if (type === 'productCategory' || relPath === 'solution/index.html' || relPath === 'products/index.html') {
    return '0.9';
  }
  if (type === 'product' || type === 'application') return '0.8';
  if (type === 'news') return '0.6';
  return '0.7';
}

function stripOldSeo(content) {
  return content
    .replace(/<!-- kiwl-seo -->[\s\S]*?<!-- \/kiwl-seo -->\n?/g, '')
    .replace(/<link rel="canonical"[^>]*>\n?/gi, '')
    .replace(/<link rel="alternate" hreflang="[^"]*"[^>]*>\n?/gi, '')
    .replace(/<meta property="og:[^"]+"[^>]*>\n?/gi, '')
    .replace(/<meta name="twitter:[^"]+"[^>]*>\n?/gi, '')
    .replace(/<meta name="robots" content="[^"]*"[^>]*>\n?/gi, '')
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\n?/gi, '');
}

function orgSchema(site) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'KIWL - Quantang Group',
    alternateName: CONFIG.siteName,
    url: DOMAIN,
    logo: `${DOMAIN}${CONFIG.defaultOgImage}`,
    description:
      site === 'ar'
        ? 'مصنع آلات حقن البلاستيك KIWL — مجموعة تشيوان تانغ منذ 2002'
        : 'KIWL injection molding machine manufacturer — Quantang Group since 2002',
    email: CONFIG.contactEmail,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: CONFIG.whatsapp,
      contactType: 'sales',
      availableLanguage: ['English', 'Arabic'],
    },
  };
}

function websiteSchema(site) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: `${CONFIG.siteName} | ${CONFIG.brand}`,
    url: `${DOMAIN}/${site}/index.html`,
    publisher: { '@type': 'Organization', name: 'KIWL - Quantang Group' },
    inLanguage: site === 'ar' ? 'ar' : 'en',
  };
}

function productSchema(topic, description, canonical) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: topic,
    description,
    url: canonical,
    brand: { '@type': 'Brand', name: CONFIG.brand },
    manufacturer: { '@type': 'Organization', name: 'KIWL - Quantang Group' },
  };
}

function articleSchema(topic, description, canonical) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: topic.slice(0, 110),
    description,
    url: canonical,
    publisher: {
      '@type': 'Organization',
      name: 'KIWL - Quantang Group',
      logo: { '@type': 'ImageObject', url: `${DOMAIN}${CONFIG.defaultOgImage}` },
    },
  };
}

function buildJsonLd(opts) {
  const { topic, description, canonical, site, isHome, relPath } = opts;
  const graphs = [];
  if (isHome) {
    graphs.push(orgSchema(site), websiteSchema(site));
  } else if (/productShow\d+\.html$/i.test(relPath)) {
    graphs.push(productSchema(topic, description, canonical));
  } else if (/newsShow\d+\.html$/i.test(relPath) || /news\d+_\d+\.html$/i.test(relPath)) {
    graphs.push(articleSchema(topic, description, canonical));
  }
  if (!graphs.length) return '';
  const payload = graphs.length === 1 ? graphs[0] : { '@context': 'https://schema.org', '@graph': graphs };
  return `\n<script type="application/ld+json">\n${JSON.stringify(payload, null, 2)}\n</script>`;
}

function buildSeoBlock(opts) {
  const {
    title,
    description,
    keywords,
    canonical,
    enUrl,
    arUrl,
    site,
    isHome,
    relPath,
    topic,
    indexable,
  } = opts;
  const ogImage = `${DOMAIN}${CONFIG.defaultOgImage}`;
  const locale = site === 'ar' ? 'ar_SA' : 'en_US';
  const altLocale = site === 'ar' ? 'en_US' : 'ar_SA';
  const robots = indexable ? 'index, follow' : 'noindex, follow';
  const ogType =
    /productShow\d+\.html$/i.test(relPath) ? 'product' : /newsShow|news\d+_/i.test(relPath) ? 'article' : 'website';

  let block = `<!-- kiwl-seo -->
<link rel="canonical" href="${canonical}" />
<link rel="alternate" hreflang="en" href="${enUrl}" />
<link rel="alternate" hreflang="ar" href="${arUrl}" />
<link rel="alternate" hreflang="x-default" href="${enUrl}" />
<meta name="robots" content="${robots}" />
<meta property="og:type" content="${ogType}" />
<meta property="og:site_name" content="${CONFIG.siteName} | ${CONFIG.brand}" />
<meta property="og:title" content="${title.replace(/"/g, '&quot;')}" />
<meta property="og:description" content="${description.replace(/"/g, '&quot;')}" />
<meta property="og:url" content="${canonical}" />
<meta property="og:image" content="${ogImage}" />
<meta property="og:locale" content="${locale}" />
<meta property="og:locale:alternate" content="${altLocale}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${title.replace(/"/g, '&quot;')}" />
<meta name="twitter:description" content="${description.replace(/"/g, '&quot;')}" />
<meta name="twitter:image" content="${ogImage}" />`;

  block += buildJsonLd({ topic, description, canonical, site, isHome, relPath });
  block += '\n<!-- /kiwl-seo -->';
  return block;
}

function setHtmlLang(content, site) {
  if (site === 'ar') {
    if (!content.includes('lang="ar"')) {
      content = content.replace(
        /<html xmlns="http:\/\/www\.w3\.org\/1999\/xhtml">/,
        '<html xmlns="http://www.w3.org/1999/xhtml" lang="ar" dir="rtl">'
      );
    }
    return content;
  }
  if (content.includes('lang="en"')) return content;
  return content.replace(
    /<html xmlns="http:\/\/www\.w3\.org\/1999\/xhtml">/,
    '<html xmlns="http://www.w3.org/1999/xhtml" lang="en">'
  );
}

function replaceDomainRefs(content) {
  return content
    .replace(/https?:\/\/www\.sunbun\.cc/gi, DOMAIN)
    .replace(/http:\/\/www\.sunbun\.cc/gi, DOMAIN)
    .replace(/www\.sunbun\.cc/gi, 'www.plasticmoldinghub.com');
}

function upsertMeta(content, name, value, attr = 'name') {
  const re = new RegExp(`<meta ${attr}="${name}" content="[^"]*"\\s*/?>`, 'i');
  const tag = `<meta ${attr}="${name}" content="${value.replace(/"/g, '&quot;')}" />`;
  if (re.test(content)) return content.replace(re, tag);
  return content.replace(/<meta name="viewport"[^>]*\/?>/i, (m) => `${m}\n    ${tag}`);
}

function resolveCanonical(site, relPath, indexable) {
  if (isIdAliasPage(relPath)) {
    const productRel = productShowFromId(relPath);
    if (productRel) return pageUrl(site, productRel);
  }
  return pageUrl(site, relPath);
}

function optimizePage(content, relPath, site) {
  content = replaceDomainRefs(content);
  content = stripOldSeo(content);
  content = setHtmlLang(content, site);

  const indexable = shouldIndex(relPath, content);
  const isHome = relPath === 'index.html';
  const bodyTopic = extractTopicFromBody(content, relPath);
  const rawTitle = extractTitle(content);

  let topic = cleanTopic(rawTitle, site, bodyTopic);
  let title = optimizeTitle(topic, site, relPath);
  let description = buildDescription(topic, site, relPath);

  if (isHome) {
    topic = CONFIG.titles[site].home;
    title = optimizeTitle(topic, site, relPath);
    description = CONFIG.descriptions[site].home;
  }

  const keywords = getKeywords(relPath, site, topic);
  const canonical = resolveCanonical(site, relPath, indexable);
  const altRel = alternateRel(relPath, site);
  const normRel = (r) => (isIdAliasPage(r) ? productShowFromId(r) || r : r);
  const enUrl = site === 'en' ? canonical : pageUrl('en', normRel(altRel));
  const arUrl = site === 'ar' ? canonical : pageUrl('ar', normRel(altRel));

  content = content.replace(/<title>[^<]*<\/title>/i, `<title>${title.replace(/</g, '')}</title>`);
  content = upsertMeta(content, 'Description', description);
  content = upsertMeta(content, 'Keywords', keywords);

  const seoBlock = buildSeoBlock({
    title,
    description,
    keywords,
    canonical,
    enUrl,
    arUrl,
    site,
    isHome,
    relPath,
    topic,
    indexable,
  });
  content = content.replace(/<\/head>/i, `    ${seoBlock}\n</head>`);

  return content;
}

function buildHreflangLinks(site, relPath) {
  const altRel = alternateRel(relPath, site);
  const enRel = site === 'en' ? relPath : altRel;
  const arRel = site === 'ar' ? relPath : alternateRel(relPath, 'en');
  const norm = (s, r) => {
    const path = isIdAliasPage(r) ? productShowFromId(r) || r : r;
    return pageUrl(s, path);
  };
  return {
    en: norm('en', enRel),
    ar: norm('ar', arRel),
  };
}

function generateSitemap(indexablePages) {
  const urlEntries = new Map();

  for (const { site, rel } of indexablePages) {
    const loc = pageUrl(site, rel);
    if (urlEntries.has(loc)) continue;
    const hreflang = buildHreflangLinks(site, rel);
    urlEntries.set(loc, { loc, hreflang, rel, priority: sitemapPriority(rel) });
  }

  const sorted = [...urlEntries.values()].sort((a, b) => {
    if (a.priority !== b.priority) return parseFloat(b.priority) - parseFloat(a.priority);
    return a.loc.localeCompare(b.loc);
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${sorted
  .map(
    (entry) => `  <url>
    <loc>${entry.loc}</loc>
    <xhtml:link rel="alternate" hreflang="en" href="${entry.hreflang.en}" />
    <xhtml:link rel="alternate" hreflang="ar" href="${entry.hreflang.ar}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${entry.hreflang.en}" />
    <changefreq>weekly</changefreq>
    <priority>${entry.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml, 'utf8');
  return sorted.length;
}

function generateRobots() {
  const cnDirs = [
    'about', 'products', 'products_1', 'products_1_1', 'products_1_2', 'products_1_3',
    'products_1_4', 'products_1_5', 'products_2', 'products_2_1', 'products_2_2',
    'products_3', 'products_3_1', 'products_4_1', 'products_4_2', 'products_4_3',
    'products_4_4', 'products_4_5', 'products_4_6', 'gyyyf', 'solution', 'news',
    'zhxw', 'sbdt', 'hyzx', 'yghd', 'jjfa', 'djwh', 'services', 'job', 'engineering',
    'yil', 'ryp', 'txdz', 'jd', 'bz', 'wlhb', 'wj', 'agricultural', 'plugin',
  ];
  const lines = [
    'User-agent: *',
    'Allow: /en/',
    'Allow: /ar/',
    'Allow: /sitemap.xml',
    'Allow: /robots.txt',
    ...cnDirs.map((d) => `Disallow: /${d}/`),
    'Disallow: /scripts/',
    'Disallow: /*/id=*',
    'Disallow: /en/plugin/',
    'Disallow: /ar/plugin/',
    'Disallow: /en/fancybox/',
    'Disallow: /ar/fancybox/',
    'Disallow: /en/images/',
    'Disallow: /ar/images/',
    '',
    `Sitemap: ${DOMAIN}/sitemap.xml`,
    '',
  ];
  fs.writeFileSync(path.join(ROOT, 'robots.txt'), lines.join('\n'), 'utf8');
}

function optimizeRootIndex() {
  const indexPath = path.join(ROOT, 'index.html');
  if (!fs.existsSync(indexPath)) return;
  let content = fs.readFileSync(indexPath, 'utf8');
  content = replaceDomainRefs(content);
  content = stripOldSeo(content);
  const seo = `<!-- kiwl-seo -->
<meta name="robots" content="noindex, follow" />
<meta name="description" content="KIWL injection molding machines — hydraulic servo, electric & two-platen solutions. Official site: www.plasticmoldinghub.com" />
<link rel="canonical" href="${DOMAIN}/en/index.html" />
<link rel="alternate" hreflang="en" href="${DOMAIN}/en/index.html" />
<link rel="alternate" hreflang="ar" href="${DOMAIN}/ar/index.html" />
<link rel="alternate" hreflang="x-default" href="${DOMAIN}/en/index.html" />
<!-- /kiwl-seo -->`;
  content = content.replace(/<meta charset="utf-8" \/>/, `<meta charset="utf-8" />\n${seo}`);
  if (!content.includes('noindex')) {
    content = content.replace(/<!-- kiwl-seo -->/, `<!-- kiwl-seo -->\n<meta name="robots" content="noindex, follow" />`);
  }
  fs.writeFileSync(indexPath, content, 'utf8');
}

function runOptimize() {
  let updated = 0;
  const indexablePages = [];

  for (const [site, base] of [
    ['en', EN_ROOT],
    ['ar', AR_ROOT],
  ]) {
    if (!fs.existsSync(base)) continue;
    for (const { full, rel } of collectHtmlFiles(base, base)) {
      const original = fs.readFileSync(full, 'utf8');
      const fixed = optimizePage(original, rel, site);
      if (fixed !== original) {
        fs.writeFileSync(full, fixed, 'utf8');
        updated++;
      }
      const content = fixed;
      if (shouldIndex(rel, content)) {
        indexablePages.push({ site, rel });
      }
    }
  }

  optimizeRootIndex();
  const sitemapCount = generateSitemap(indexablePages);
  generateRobots();
  console.log(`SEO optimized on ${updated} EN/AR pages`);
  console.log(`Sitemap: ${sitemapCount} indexable URLs (with hreflang)`);
  console.log(`Domain: ${DOMAIN}`);
  console.log('Generated robots.txt and sitemap.xml');
}

if (require.main === module) {
  runOptimize();
}

module.exports = {
  optimizePage,
  runOptimize,
  replaceDomainRefs,
  shouldIndex,
  getKeywords,
  cleanTopic,
};
