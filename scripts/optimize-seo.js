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
};

const EN_TO_AR = {};
for (const [arRel, enRel] of Object.entries(PATH_MAP)) {
  EN_TO_AR[enRel] = arRel;
}
EN_TO_AR['xc/newsShow392.html'] = 'agricultural/newsShow389.html';

function arToEnRel(arRel) {
  for (const [ar, en] of Object.entries(PATH_MAP)) {
    if (ar === arRel) return en;
  }
  if (arRel === 'agricultural/newsShow389.html') return 'xc/newsShow392.html';
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

function extractTitle(content) {
  const m = content.match(/<title>([^<]*)<\/title>/i);
  return m ? m[1].trim() : '';
}

function extractDescription(content) {
  const m = content.match(/<meta name="Description" content="([^"]*)"/i);
  return m ? m[1].trim() : '';
}

function cleanTopic(title, site) {
  let t = title
    .replace(/&amp;/g, '&')
    .replace(/-Shanghai Quantang Ecological Technology Group Co\., Ltd\.?\s*$/i, '')
    .replace(/شركة شنغهاي تشيوان تانغ[^-]*$/g, '')
    .trim();
  const parts = t.split('-').map((p) => p.trim()).filter(Boolean);
  if (parts.length > 1 && parts[parts.length - 1].length < 40) {
    t = parts.slice(0, -1).join(' - ');
  }
  if (parts.length === 1) t = parts[0];
  if (t.length > 80) t = t.slice(0, 77) + '...';
  return t || (site === 'ar' ? CONFIG.companyAr : CONFIG.companyEn);
}

function optimizeTitle(topic, site) {
  const suffix = site === 'ar' ? CONFIG.titleSuffixAr : CONFIG.titleSuffixEn;
  let main = topic;
  if (main.length > 52) main = main.slice(0, 49) + '...';
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

function getKeywords(relPath, site, topic) {
  const key = sectionKey(relPath);
  const pool = site === 'ar' ? CONFIG.keywordsAr : CONFIG.keywordsEn;
  let keywords = pool[key] || pool.default;

  if (/productShow\d+\.html$/i.test(relPath) && topic) {
    const series = topic.match(/\b(SKII?|SK-HYB|SE|S|J6|V|SH|NS)\b/i);
    if (series) {
      keywords = `${series[0]}, ${keywords}`;
    }
  }

  return keywords;
}

function buildDescription(topic, site, relPath) {
  const base =
    site === 'ar'
      ? `${topic}. KIWL (${CONFIG.companyAr}) تصنع آلات حقن البلاستيك منذ 2002 — حلول R&D والإنتاج والمبيعات والخدمة.`
      : `${topic}. KIWL (${CONFIG.companyEn}) manufactures injection molding machines since 2002 — R&D, production, sales and service.`;
  const cta =
    site === 'ar'
      ? ' تواصل معنا على www.plasticmoldinghub.com.'
      : ' Visit www.plasticmoldinghub.com for quotes and support.';
  let desc = base + cta;
  if (desc.length > 158) desc = desc.slice(0, 155) + '...';
  return desc;
}

function pageUrl(site, relPath) {
  return `${DOMAIN}/${site}/${relPath === 'index.html' ? 'index.html' : relPath}`;
}

function alternateRel(relPath, site) {
  if (site === 'en') return EN_TO_AR[relPath] || relPath;
  return arToEnRel(relPath);
}

function stripOldSeo(content) {
  return content
    .replace(/<!-- kiwl-seo -->[\s\S]*?<!-- \/kiwl-seo -->\n?/g, '')
    .replace(/<link rel="canonical"[^>]*>\n?/gi, '')
    .replace(/<link rel="alternate" hreflang="[^"]*"[^>]*>\n?/gi, '')
    .replace(/<meta property="og:[^"]+"[^>]*>\n?/gi, '')
    .replace(/<meta name="twitter:[^"]+"[^>]*>\n?/gi, '')
    .replace(/<meta name="robots" content="index, follow"[^>]*>\n?/gi, '')
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\n?/gi, '');
}

function orgSchema(site) {
  return JSON.stringify(
    {
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
    },
    null,
    2
  );
}

function buildSeoBlock(opts) {
  const { title, description, keywords, canonical, enUrl, arUrl, site, isHome } = opts;
  const ogImage = `${DOMAIN}${CONFIG.defaultOgImage}`;
  const locale = site === 'ar' ? 'ar_SA' : 'en_US';
  const altLocale = site === 'ar' ? 'en_US' : 'ar_SA';

  let block = `<!-- kiwl-seo -->
<link rel="canonical" href="${canonical}" />
<link rel="alternate" hreflang="en" href="${enUrl}" />
<link rel="alternate" hreflang="ar" href="${arUrl}" />
<link rel="alternate" hreflang="x-default" href="${enUrl}" />
<meta name="robots" content="index, follow" />
<meta property="og:type" content="website" />
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

  if (isHome) {
    block += `\n<script type="application/ld+json">\n${orgSchema(site)}\n</script>`;
  }
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

function optimizePage(content, relPath, site) {
  content = replaceDomainRefs(content);
  content = stripOldSeo(content);
  content = setHtmlLang(content, site);

  const rawTitle = extractTitle(content);
  const isHome = relPath === 'index.html';

  let topic = cleanTopic(rawTitle, site);
  let title = optimizeTitle(topic, site);
  let description = buildDescription(topic, site, relPath);

  if (isHome) {
    if (site === 'en') {
      topic = 'Injection Molding Machines Manufacturer';
      title = `Injection Molding Machines Manufacturer ${CONFIG.titleSuffixEn}`;
      description =
        'KIWL (Quantang Group) manufactures hydraulic servo, electric and two-platen injection molding machines since 2002. Request a quote at www.plasticmoldinghub.com.';
    } else {
      topic = 'مصنع آلات حقن البلاستيك';
      title = `مصنع آلات حقن البلاستيك ${CONFIG.titleSuffixAr}`;
      description =
        'KIWL (مجموعة تشيوان تانغ) تصنع آلات حقن هيدروليكية وكهربائية وثنائية اللوحة منذ 2002. تواصل معنا على www.plasticmoldinghub.com.';
    }
  }

  const keywords = getKeywords(relPath, site, topic);
  const canonical = pageUrl(site, relPath);
  const altRel = alternateRel(relPath, site);
  const enUrl = site === 'en' ? canonical : pageUrl('en', altRel);
  const arUrl = site === 'ar' ? canonical : pageUrl('ar', altRel);

  content = content.replace(/<title>[^<]*<\/title>/i, `<title>${title.replace(/</g, '')}</title>`);
  content = upsertMeta(content, 'Description', description);
  content = upsertMeta(content, 'Keywords', keywords);

  const seoBlock = buildSeoBlock({ title, description, keywords, canonical, enUrl, arUrl, site, isHome });
  content = content.replace(/<\/head>/i, `    ${seoBlock}\n</head>`);

  return content;
}

function generateSitemap() {
  const urls = [];
  for (const site of ['en', 'ar']) {
    const base = site === 'en' ? EN_ROOT : AR_ROOT;
    if (!fs.existsSync(base)) continue;
    for (const { rel } of collectHtmlFiles(base, base)) {
      urls.push(pageUrl(site, rel));
    }
  }
  urls.push(`${DOMAIN}/`);
  urls.push(`${DOMAIN}/index.html`);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls
  .map(
    (u) => `  <url>
    <loc>${u}</loc>
    <changefreq>weekly</changefreq>
    <priority>${u.includes('/index.html') && !u.includes('/', 8) ? '1.0' : '0.7'}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml, 'utf8');
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
    'Allow: /index.html',
    'Allow: /sitemap.xml',
    'Allow: /robots.txt',
    ...cnDirs.map((d) => `Disallow: /${d}/`),
    'Disallow: /scripts/',
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
  const seo = `<!-- kiwl-seo -->
<meta name="description" content="KIWL injection molding machines — hydraulic servo, electric & two-platen solutions. Official site: www.plasticmoldinghub.com" />
<link rel="canonical" href="${DOMAIN}/en/index.html" />
<link rel="alternate" hreflang="en" href="${DOMAIN}/en/index.html" />
<link rel="alternate" hreflang="ar" href="${DOMAIN}/ar/index.html" />
<link rel="alternate" hreflang="x-default" href="${DOMAIN}/en/index.html" />
<!-- /kiwl-seo -->`;
  if (!content.includes('kiwl-seo')) {
    content = content.replace(/<meta charset="utf-8" \/>/, `<meta charset="utf-8" />\n${seo}`);
  }
  fs.writeFileSync(indexPath, content, 'utf8');
}

function runOptimize() {
  let updated = 0;
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
    }
  }
  optimizeRootIndex();
  generateSitemap();
  generateRobots();
  console.log(`SEO optimized on ${updated} EN/AR pages`);
  console.log(`Domain: ${DOMAIN}`);
  console.log('Generated robots.txt and sitemap.xml');
}

if (require.main === module) {
  runOptimize();
}

module.exports = { optimizePage, runOptimize, replaceDomainRefs };
