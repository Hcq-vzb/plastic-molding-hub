const fs = require('fs');
const path = require('path');
const { optimizePage } = require('./optimize-seo.js');

const file = path.join(__dirname, '../en/products_1_1/productShow956.html');
const content = fs.readFileSync(file, 'utf8');
const fixed = optimizePage(content, 'products_1_1/productShow956.html', 'en');
const title = fixed.match(/<title>([^<]*)<\/title>/i)[1];
const name = fixed.match(/"name": "([^"]+)"/)?.[1];
console.log('title:', title);
console.log('schema name:', name);
