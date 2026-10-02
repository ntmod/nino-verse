import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const compiled = ts.transpileModule(fs.readFileSync('lib/translations.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const context = { exports: {} };
vm.runInNewContext(compiled, context);
const { en, th } = context.exports.translations;
assert.deepEqual(Object.keys(en).sort(), Object.keys(th).sort());
for (const [key, text] of Object.entries(th)) {
  assert.ok(text.trim(), `Empty Thai translation: ${key}`);
}
for (const dir of ['app', 'components']) {
  for (const file of fs.readdirSync(dir, { recursive: true }).filter(file => file.endsWith('.tsx'))) {
    for (const match of fs.readFileSync(`${dir}/${file}`, 'utf8').matchAll(/\bt\("([^"]+)"\)/g)) {
      assert.ok(en[match[1]], `Missing translation ${match[1]} in ${file}`);
    }
  }
}
console.log('Translation keys, Thai values and UI references verified.');
