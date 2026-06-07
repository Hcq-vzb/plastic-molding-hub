const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CN_DIR = path.join(ROOT, 'djwh');
const EN_DIR = path.join(ROOT, 'en', 'djwh');
const DICT = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'cn-en-djwh-content.json'), 'utf8')
);

const EN_INDEX = fs.readFileSync(path.join(EN_DIR, 'index.html'), 'utf8');
const headerEnd = EN_INDEX.indexOf('<div class="a_banner');
const footerStart = EN_INDEX.indexOf('<div class="footer">');
const newsStart = EN_INDEX.indexOf('<div class="news_2">');
const EN_HEADER = EN_INDEX.slice(0, headerEnd);
const EN_BANNER = EN_INDEX.slice(headerEnd, newsStart);
const EN_FOOTER = EN_INDEX.slice(footerStart);

function applyDict(content) {
  const keys = Object.keys(DICT).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (key.endsWith('_body')) continue;
    content = content.split(key).join(DICT[key]);
  }
  return content;
}

function fixEnPaths(content) {
  return content
    .replace(/src="\.\.\/upload\//g, 'src="../../upload/')
    .replace(/href="\.\.\/upload\//g, 'href="../../upload/')
    .replace(/_src="\.\.\/upload\//g, '_src="../../upload/')
    .replace(/url\(\.\.\/upload\//g, 'url(../../upload/')
    .replace(/attr-img="\.\.\/upload\//g, 'attr-img="../../upload/')
    .replace(/src="\.\.\/layer\//g, 'src="../../layer/')
    .replace(/href="\.\.\/dist\//g, 'href="../../dist/')
    .replace(/src="\.\.\/dist\//g, 'src="../../dist/')
    .replace(/js5e1f\.js\?v=2/g, 'js.js')
    .replace(/cssc4ca\.css\?1/g, 'css.css')
    .replace(/alert\('没有了'\)/g, "alert('No more')");
}

function injectBody(content, fileName) {
  const bodyKey = fileName.replace('.html', '_body');
  const body = DICT[bodyKey];
  if (!body) return content;
  return content.replace(
    /<div id="newsnr">[\s\S]*?<\/div>\s*\n\s*<div class="updown-div">/,
    `<div id="newsnr">\n                    ${body}\n                </div>\n                \n                <div class="updown-div">`
  );
}

function buildDetail(fileName) {
  const cn = fs.readFileSync(path.join(CN_DIR, fileName), 'utf8');
  const aboutStart = cn.indexOf('<div class="about_content">');
  const aboutEnd = cn.indexOf('<div class="footer">');
  let about = cn.slice(aboutStart, aboutEnd);
  about = applyDict(about);
  about = injectBody(about, fileName);
  about = fixEnPaths(about);

  let page = EN_HEADER + EN_BANNER + about + EN_FOOTER;
  page = applyDict(page);
  page = fixEnPaths(page);

  const title = about.match(/<div class="ny-news-tit">([^<]+)/);
  if (title) {
    page = page.replace(
      /<title>[^<]*<\/title>/,
      `<title>${title[1]} - “Red-core” KIWL-Shanghai Quantang Ecological Technology Group Co., Ltd. </title>`
    );
  }

  fs.writeFileSync(path.join(EN_DIR, fileName), page, 'utf8');
}

function buildIndex() {
  const cn = fs.readFileSync(path.join(CN_DIR, 'index.html'), 'utf8');
  const listStart = cn.indexOf('<div class="qgyl_wz">');
  const listEnd = cn.indexOf('<div class="footer">');
  let list = cn.slice(listStart, listEnd);
  list = applyDict(list);
  list = fixEnPaths(list);

  let page = EN_HEADER + EN_BANNER + list + EN_FOOTER;
  page = applyDict(page);
  page = fixEnPaths(page);
  fs.writeFileSync(path.join(EN_DIR, 'index.html'), page, 'utf8');
}

const detailFiles = fs
  .readdirSync(CN_DIR)
  .filter((name) => name.startsWith('newsShow') && name.endsWith('.html'));

buildIndex();
for (const file of detailFiles) buildDetail(file);
console.log(`Built en/djwh: index + ${detailFiles.length} detail pages`);

module.exports = { buildIndex, buildDetail, detailFiles };
