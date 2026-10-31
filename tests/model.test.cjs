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
test('reject non-string address values without coercion or exceptions', () => {
  const addresses = [null, 123, ['0xabc'], {toString:null}, {toString:0,valueOf:0}, []];
  let nested = ['0xabc'];
  for (let i = 0; i < 500; i++) nested = [nested];
  addresses.push(nested);
  for (const address of addresses) {
    const raw = JSON.stringify([{...windows[0], address}]);
    assert.doesNotThrow(() => model.rows(raw, ''));
    assert.equal(model.rows(raw, '').length, 0, 'an address must be a primitive string');
    assert.equal(model.focusRequest('0xabc', raw), '');
    assert.equal(model.moveRequest('0xabc', 3, raw), '');
  }
});
test('reject trailing line terminators in otherwise valid addresses', () => {
  for (const suffix of ['\n', '\r', '\r\n', '\u2028', '\u2029']) {
    const address = '0xabc' + suffix;
    const raw = JSON.stringify([{...windows[0], address}]);
    assert.equal(model.rows(raw, '').length, 0, 'the entire address must match');
    assert.equal(model.focusRequest(address, raw), '');
    assert.equal(model.moveRequest(address, 3, raw), '');
  }
});
test('enforce the input cap in UTF-8 bytes for ASCII CJK and emoji', () => {
  const limit = 1048576;
  const base = JSON.stringify([{...windows[0],title:''}]);
  const budget = limit - Buffer.byteLength(base, 'utf8');
  for (const unit of ['x', '界', '😀']) {
    const size = Buffer.byteLength(unit, 'utf8');
    const title = unit.repeat(Math.floor(budget / size)) + 'x'.repeat(budget % size);
    const atLimit = JSON.stringify([{...windows[0],title}]);
    const aboveLimit = JSON.stringify([{...windows[0],title:title+'x'}]);
    assert.equal(Buffer.byteLength(atLimit, 'utf8'), limit);
    assert.equal(model.rows(atLimit, '').length, 1, 'exact byte limit must remain usable');
    assert.equal(Buffer.byteLength(aboveLimit, 'utf8'), limit + 1);
    assert.equal(model.rows(aboveLimit, '').length, 0, 'a code-unit limit must not admit excess bytes');
    assert.equal(model.focusRequest('0xabc', aboveLimit), '');
    assert.equal(model.moveRequest('0xabc', 3, aboveLimit), '');
  }
});
test('seeded malformed client schemas fail closed without throwing', () => {
  let seed = 85901329;
  function next() { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return seed >>> 0; }
  const addresses = ['0xabc','0xF123','0xabc;bad()',null,123,['0xabc'],{toString:null},{valueOf:null,toString:0},[]];
  const values = [null,0,false,true,'',[],{},1,1.5,'1'];
  for (let i = 0; i < 25000; i++) {
    let client = {...windows[0],address:addresses[next()%addresses.length]};
    if (next()%3 === 0) {
      const field = ['mapped','workspace','monitor','title','class'][next()%5];
      client[field] = field === 'workspace' ? {id:values[next()%values.length]} : values[next()%values.length];
    }
    const expected = client.mapped === true && typeof client.address === 'string'
      && /^0x[0-9a-fA-F]{1,16}$/.test(client.address)
      && client.workspace && Number.isInteger(client.workspace.id) && Number.isInteger(client.monitor)
      && typeof client.title === 'string' && typeof client.class === 'string';
    const raw = JSON.stringify([client]);
    let rows;
    assert.doesNotThrow(() => { rows = model.rows(raw, ''); });
    assert.equal(rows.length, expected ? 1 : 0, 'seeded schema case ' + i);
    if (!expected) assert.equal(model.focusRequest('0xabc', raw), '');
  }
});
test('byte guard agrees with UTF-8 oracle across mixed and unpaired surrogates', () => {
  for (const pattern of ['a','界','😀','\ud800','\udc00','a界😀\ud800x\udc00']) {
    for (const units of [349525,349526,524288,1048575,1048576,1048577]) {
      const raw = pattern.repeat(Math.ceil(units/pattern.length)).slice(0,units);
      assert.equal(model.fitsInputLimit(raw), Buffer.byteLength(raw,'utf8') <= 1048576,
        'UTF-8 boundary with ' + units + ' UTF-16 units');
    }
  }
});
console.log(`RESULT ${passed} passed`);
