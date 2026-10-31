// SPDX-License-Identifier: GPL-3.0-only
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(__dirname + '/../Overview.qml', 'utf8');
// Execute the actual QML JavaScript entry points, not a duplicate policy model.
function entry(name, context) {
  const start = source.indexOf('    function ' + name + '(');
  assert.ok(start >= 0, name + ' entry point missing');
  const end = source.indexOf('\n    function ', start + 1);
  vm.runInContext(source.slice(start, end), context);
}
const c = vm.createContext({opened:false, opening:false, raw:'[]', query:'', selected:0,
  requestedAddress:'', requestedWorkspace:0, refresh:{running:false}, verify:{running:false},
  updateTimer:{stop(){}}, lockProbe:{running:false},
  Qt:{callLater(){}}, keyboard:{forceActiveFocus(){}}, shell:null, manifest:null});
entry('open', c); entry('close', c); entry('dismiss', c);
c.open('{}');
assert.equal(c.opened, false, 'unverified open must not map overlay or enable capture');
assert.equal(c.refresh.running, false, 'unverified open must not collect clients');
assert.equal(c.opening, true, 'open must request verification');
assert.equal(c.lockProbe.running, true, 'open must launch lock verification');
console.log('PASS open awaits lock verification before mapping or collecting clients');
c.close();
assert.equal(c.opening, false, 'close must cancel pending admission');
assert.equal(c.opened, false);
assert.equal(c.raw, '[]');
console.log('PASS close invalidates pending admission and clears client data');
c.root = c;
const probe = source.indexOf('id: lockProbe');
const start = source.indexOf('onExited: (code, status) => {', probe) + 'onExited: (code, status) => '.length;
assert.ok(probe >= 0 && source[start] === '{', 'lock probe completion callback missing');
let end = start + 1, depth = 1;
while (depth && end < source.length) {
  if (source[end] === '{') depth++;
  if (source[end] === '}') depth--;
  end++;
}
vm.runInContext('completeProbe = (code, status) => ' + source.slice(start, end), c);
for (const [code, status] of [[0,0],[2,0],[124,0],[127,0],[1,1]]) {
  c.opening = true; c.opened = false; c.refresh.running = false;
  c.completeProbe(code, status);
  assert.equal(c.opened, false, `must reject probe ${code}/${status}`);
  assert.equal(c.opening, false);
  assert.equal(c.refresh.running, false);
}
console.log('PASS locked unknown timeout missing-helper and abnormal-exit results fail closed');
c.opening = true; c.completeProbe(1,0);
assert.equal(c.opened, true); assert.equal(c.opening, false); assert.equal(c.refresh.running, true);
console.log('PASS only a normal unlocked result admits overview');
c.close(); c.completeProbe(1,0);
assert.equal(c.opened, false); assert.equal(c.refresh.running, false);
c.lockProbe.running = true; c.open('{}');
assert.equal(c.opening, false); assert.equal(c.opened, false);
console.log('PASS cancelled or in-flight probes cannot reopen a closed overview');
console.log('RESULT 5 passed');
