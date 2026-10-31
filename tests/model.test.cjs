// SPDX-License-Identifier: GPL-3.0-only
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = path.join(__dirname, '../WindowModel.js');
assert.ok(fs.existsSync(source), 'window-list model is not implemented');
const model = vm.createContext({});
vm.runInContext(fs.readFileSync(source, 'utf8').replace(/^\.pragma library\s*/, ''), model);
let passed = 0;
function test(name, fn) { fn(); passed++; console.log('PASS ' + name); }
const windows = [
  {address:'0xabc', mapped:true, title:'Notes <img src="https://invalid/x">', class:'Editor', workspace:{id:1}, monitor:0},
  {address:'0xdef', mapped:true, title:'Build output', class:'Terminal', workspace:{id:6}, monitor:1},
  {address:'0x000', mapped:false, title:'Closed', class:'Editor', workspace:{id:1}, monitor:0}
];
test('filter mapped windows by title or class without interpreting markup', () => {
  const rows = model.rows(JSON.stringify(windows), 'EDITOR');
  assert.equal(rows.length, 1);
  assert.equal(rows[0].address, '0xabc');
  assert.equal(rows[0].title, windows[0].title);
  assert.equal(model.rows(JSON.stringify(windows), 'build')[0].workspace, 6);
});
test('reject malformed data and unsafe addresses before presenting actions', () => {
  for (const raw of ['{', '{}', 'null', JSON.stringify([null, {mapped:true,address:'0xabc);os.execute("bad")'}])]) {
    assert.equal(model.rows(raw, '').length, 0);
  }
  const huge = {...windows[0], title:'x'.repeat(9000)};
  assert.ok(model.rows(JSON.stringify([huge]), '')[0].title.length <= 512);
  assert.equal(model.rows(' '.repeat(1048577), '').length, 0);
});
test('focus command uses a fresh matching window and never interpolates titles', () => {
  assert.equal(typeof model.focusRequest, 'function', 'safe focus action missing');
  assert.equal(model.focusRequest('0xabc', JSON.stringify(windows)), 'hl.dsp.focus({ window = "address:0xabc" })');
  assert.equal(model.focusRequest('0xabc', JSON.stringify([windows[1]])), '');
  assert.equal(model.focusRequest('0xabc); bad()', JSON.stringify(windows)), '');
  assert.equal(model.focusRequest('0x000', JSON.stringify(windows)), '');
});
test('bring-to-workspace accepts only a fresh window and a bounded integer destination', () => {
  assert.equal(typeof model.moveRequest, 'function', 'workspace move action missing');
  assert.equal(model.moveRequest('0xabc', 3, JSON.stringify(windows)), 'hl.dsp.window.move({ workspace = 3, follow = false, window = "address:0xabc" })');
  for (const destination of [0, -1, 1.5, '3', '3}); bad()', 2147483647]) {
    assert.equal(model.moveRequest('0xabc', destination, JSON.stringify(windows)), '');
  }
  assert.equal(model.moveRequest('0xabc', 3, JSON.stringify([windows[1]])), '');
});
test('search and actions reach valid clients beyond the display cap', () => {
  const clients = Array.from({length:257}, (_, i) => ({...windows[0],
    address:'0x' + (i + 1).toString(16), title:i === 256 ? 'Unique late match' : 'Ordinary'}));
  const raw = JSON.stringify(clients);
  assert.equal(model.rows(raw, '').length, 256, 'display remains bounded');
  assert.equal(model.rows(raw, 'unique late')[0]?.address, clients[256].address);
  assert.equal(model.focusRequest(clients[256].address, raw), 'hl.dsp.focus({ window = "address:0x101" })');
  assert.equal(model.moveRequest(clients[256].address, 3, raw), 'hl.dsp.window.move({ workspace = 3, follow = false, window = "address:0x101" })');
  clients[256].mapped = false;
  assert.equal(model.focusRequest(clients[256].address, JSON.stringify(clients)), '');
  assert.equal(model.moveRequest(clients[256].address, 3, JSON.stringify(clients)), '');
  assert.equal(model.moveRequest('0x101); bad()', 3, raw), '');
  assert.equal(model.moveRequest('0xffff', 3, raw), '');
});
console.log(`RESULT ${passed} passed`);
