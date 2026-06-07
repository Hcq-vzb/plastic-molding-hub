const d = require('./en-snippets-missing.json');
const pure = d.filter(
  (x) =>
    !/[\u0600-\u06FF\u4e00-\u9fff]/.test(x.text) &&
    !x.text.includes('function') &&
    !x.text.includes('document.write') &&
    !x.text.includes('$(window') &&
    !x.text.includes('[product:') &&
    x.text !== '&nbsp;' &&
    x.text !== '&nbsp;&nbsp;' &&
    x.text.length < 500
);
console.log('Pure EN:', pure.length);
pure.slice(0, 100).forEach((x) => console.log(x.count, x.text.slice(0, 160)));
