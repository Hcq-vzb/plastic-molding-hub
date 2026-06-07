const fs = require('fs');
const path = require('path');
const dir = __dirname;
delete require.cache[require.resolve(path.join(dir, 'ar-batch-02-values.js'))];
const values = require(path.join(dir, 'ar-batch-02-values.js'));

values[94] = '\u0641\u064a 13 \u0641\u0628\u0631\u0627\u064a\u0631\u060c \u0632\u0627\u0631 \u0631\u0626\u064a\u0633 \u0627\u0644\u0644\u062c\u0646\u0629 \u0627\u0644\u0633\u064a\u0627\u0633\u064a\u0629 \u0627\u0644\u0627\u0633\u062a\u0634\u0627\u0631\u064a\u0629 \u0644\u0645\u062f\u064a\u0646\u0629 \u0648\u0646\u062a\u0634\u0648 \u062a\u0634\u0646 \u0632\u0648\u0631\u0648\u0646\u063a KIWL \u0644\u0644\u0625\u0634\u0631\u0627\u0641 \u0639\u0644\u0649 \u0625\u062c\u0631\u0627\u0621\u0627\u062a \u0627\u0644\u0648\u0642\u0627\u064a\u0629 \u0639\u0646\u062f \u0627\u0633\u062a\u0626\u0646\u0627\u0641 \u0627\u0644\u0625\u0646\u062a\u0627\u062c. \u0627\u0644\u0644\u062c\u0646\u0629 \u0641\u064a \u0648\u0646\u062a\u0634\u0648';

fs.writeFileSync(path.join(dir, 'ar-batch-02-values.js'), 'module.exports = ' + JSON.stringify(values, null, 2) + ';\n');

delete require.cache[require.resolve(path.join(dir, 'ar-batch-02-values.js'))];
const check = require(path.join(dir, 'ar-batch-02-values.js'));
const bad = check.filter((v) => /[a-z]{2,}/i.test(v.replace(/KIWL|SK\d+|SE\d+|PP|PE|PET|PLASTEX|Iran Plast|FMS|TUYAP|UFI|IE/gi, '')));
console.log('Latin issues:', bad.length);
