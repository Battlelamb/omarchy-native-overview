// SPDX-License-Identifier: GPL-3.0-only
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const options = vm.createContext({});
const path = require('./runtime-path.cjs');
assert.ok(fs.existsSync(path('Options.js')), 'saved option validation is missing');
vm.runInContext(fs.readFileSync(path('Options.js'), 'utf8'), options);
const defaults = {defaultScope:'all',sortOrder:'existing',thumbnails:true};
assert.equal(JSON.stringify(options.defaults()), JSON.stringify(defaults));
assert.equal(options.valid(defaults), true);
for (const value of [null,[],{}, {...defaults,thumbnails:1}, {...defaults,sortOrder:'random'},
  {...defaults,defaultScope:'here'}, {...defaults,address:'0xabc'}]) assert.equal(options.valid(value), false);
assert.equal(options.decode('{"ok":true,"options":'+JSON.stringify(defaults)+'}').sortOrder, 'existing');
for (const text of ['{}','{','{"ok":false}', '{"ok":true,"options":{}}', 'x'.repeat(16385)])
  assert.equal(options.decode(text), null);
assert.equal(options.command('/literal $ file.py','save',defaults)[4], JSON.stringify(defaults));
assert.equal(options.command('/literal.py','dispatch',defaults), null);
assert.equal(options.command('/literal.py','save',{...defaults,address:'0x1'}), null);
console.log('PASS option defaults, strict schema, bounded replies and fixed literal preference verbs');
console.log('RESULT 1 passed');
