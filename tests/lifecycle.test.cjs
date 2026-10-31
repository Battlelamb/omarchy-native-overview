// SPDX-License-Identifier: GPL-3.0-only
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(__dirname + '/../Overview.qml', 'utf8');
let passed = 0;
function pass(name) { passed++; console.log('PASS ' + name); }
function block(start) {
  let end = source.indexOf('{', start) + 1, depth = 1;
  const begin = end - 1;
  assert.ok(begin >= start, 'callback block missing');
  while (depth && end < source.length) {
    if (source[end] === '{') depth++;
    if (source[end] === '}') depth--;
    end++;
  }
  return source.slice(begin, end);
}
// Execute the actual QML JavaScript entry points, not a duplicate policy model.
function entry(name, context) {
  const start = source.indexOf('function ' + name + '(');
  assert.ok(start >= 0, name + ' entry point missing');
  const body = source.indexOf('{', start);
  vm.runInContext(source.slice(start, body) + block(body), context);
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
pass('open awaits lock verification before mapping or collecting clients');
c.close();
assert.equal(c.opening, false, 'close must cancel pending admission');
assert.equal(c.opened, false);
assert.equal(c.raw, '[]');
pass('close invalidates pending admission and clears client data');
c.root = c;
processHandler('lockProbe', 'onExited', c, 'completeProbe');
for (const [code, status] of [[0,0],[2,0],[124,0],[127,0],[1,1]]) {
  c.opening = true; c.opened = false; c.refresh.running = false;
  c.completeProbe(code, status);
  assert.equal(c.opened, false, `must reject probe ${code}/${status}`);
  assert.equal(c.opening, false);
  assert.equal(c.refresh.running, false);
}
pass('locked unknown timeout missing-helper and abnormal-exit results fail closed');
c.opening = true; c.completeProbe(1,0);
assert.equal(c.opened, true); assert.equal(c.opening, false); assert.equal(c.refresh.running, true);
pass('only a normal unlocked result admits overview');
c.close(); c.completeProbe(1,0);
assert.equal(c.opened, false); assert.equal(c.refresh.running, false);
c.lockProbe.running = true; c.open('{}');
assert.equal(c.opening, false); assert.equal(c.opened, false);
pass('cancelled or in-flight probes cannot reopen a closed overview');

// Virtual time replaces only the platform Timer/Process, not refresh policy.
let now = 0, deadline = null, launches = 0;
const r = vm.createContext({opened:true, opening:false, raw:'[]', query:'', selected:0,
  requestedAddress:'', requestedWorkspace:0, refreshPending:false,
  refresh:{running:false}, verify:{running:false}, shell:null, manifest:null,
  updateTimer:{running:false,
    start() { this.running = true; deadline = now + 80; },
    restart() { this.start(); },
    stop() { this.running = false; deadline = null; }}});
r.root = r;
for (const name of ['close', 'onRawEvent', 'queueRefresh', 'runRefresh']) {
  if (source.includes('function ' + name + '(')) entry(name, r);
}
const timer = source.slice(source.indexOf('id: updateTimer'));
const trigger = timer.match(/onTriggered: ([^\n}]+)/)[1].trim();
function tick(to) {
  while (deadline !== null && deadline <= to) {
    now = deadline; deadline = null; r.updateTimer.running = false;
    const before = r.refresh.running;
    vm.runInContext(trigger, r);
    if (!before && r.refresh.running) launches++;
  }
  now = to;
}
for (let t = 0; t < 800; t += 20) {
  tick(t); r.onRawEvent({});
  if (r.refresh.running) r.refresh.running = false;
}
assert.ok(launches >= 8, 'continuous events must not postpone every refresh');
pass('sustained 20ms events produce bounded refreshes without debounce starvation');
r.updateTimer.stop(); r.refresh.running = true;
r.onRawEvent({}); tick(now + 80);
assert.equal(r.refreshPending, true, 'an event during refresh must remain pending');
const refreshStart = source.indexOf('id: refresh');
const changed = source.slice(refreshStart).match(/onRunningChanged: ([^\n]+)/);
assert.ok(changed, 'refresh completion must service a pending event');
r.running = false; r.refresh.running = false;
vm.runInContext(changed[1], r);
assert.equal(r.refresh.running, true);
assert.equal(r.refreshPending, false);
r.refresh.running = false; vm.runInContext(changed[1], r);
assert.equal(r.refresh.running, false, 'one pending event must not become background polling');
pass('timer firing during active refresh is serviced once that refresh finishes');
r.onRawEvent({}); r.close();
tick(now + 160); vm.runInContext(changed[1], r); r.onRawEvent({});
assert.equal(r.refreshPending, false);
assert.equal(r.refresh.running, false);
assert.equal(r.updateTimer.running, false);
pass('close cancels pending work and late completion/events cannot restart polling');
function processHandler(id, event, context, name) {
  const start = source.indexOf('id: ' + id);
  const next = source.indexOf('\n    Process {', start);
  const section = source.slice(start, next < 0 ? source.indexOf('\n    OverlayWindow', start) : next);
  const match = section.match(new RegExp(event + ': ([^\\n]+)'));
  assert.ok(match, id + '.' + event + ' handler missing');
  const position = source.indexOf(match[0], start);
  const expression = match[1].includes('=> {')
    ? match[1].slice(0, match[1].indexOf('{')) + block(source.indexOf('{', position))
    : '() => { ' + match[1] + ' }';
  vm.runInContext(name + ' = ' + expression, context);
}
const windowModel = vm.createContext({});
vm.runInContext(fs.readFileSync(__dirname + '/../WindowModel.js', 'utf8'), windowModel);
const clients = Array.from({length:257}, (_, i) => ({address:'0x' + (i + 1).toString(16),
  mapped:true, title:i === 256 ? 'needle' : 'ordinary', class:'Editor', workspace:{id:1}, monitor:0}));
const fresh = JSON.stringify(clients);
const d = vm.createContext({opened:true, opening:false, raw:fresh, query:'needle', selected:0,
  matches:windowModel.rows(fresh, 'needle'), requestedAddress:'', requestedWorkspace:0,
  actionPending:false, actionError:'', refreshPending:false,
  refresh:{running:false}, verify:{running:false}, focusAction:{running:false, command:[]},
  lockProbe:{running:false}, verifiedClients:{text:fresh}, actionReply:{text:'ok\n'},
  Hyprland:{focusedWorkspace:{id:3}}, updateTimer:{stop(){}}, shell:null, manifest:null,
  WindowModel:windowModel});
const busy = source.match(/readonly property bool actionBusy: ([^\n]+)/);
Object.defineProperty(d, 'actionBusy', {get() {
  return busy ? vm.runInContext(busy[1], d) : d.verify.running || d.focusAction.running;
}});
d.root = d;

for (const name of ['activate', 'close', 'dismiss', 'finishAction']) {
  if (source.includes('function ' + name + '(')) entry(name, d);
}
processHandler('verify', 'onExited', d, 'completeVerify');
d.activate(0, false); d.verify.running = false;
assert.equal(d.actionBusy, true, 'fresh lookup request must guard the pre-start notification gap');
d.activate(0, false); assert.equal(d.verify.running, false, 'pending lookup blocks another launch');
d.completeVerify(0, 0);
assert.equal(d.opened, true, 'dispatch must not dismiss before its result is known');
assert.equal(d.query, 'needle'); assert.equal(d.raw, fresh);
assert.equal(d.requestedAddress, '');
assert.deepEqual(Array.from(d.focusAction.command), ['/usr/bin/hyprctl', 'dispatch',
  'hl.dsp.focus({ window = "address:0x101" })']);
assert.ok(busy, 'read-only progress guard missing');
assert.equal(d.actionBusy, true);
d.activate(0, false); assert.equal(d.verify.running, false, 'cannot double-activate during dispatch');
pass('dispatch keeps overlay/search state until confirmed completion and blocks double activation');
processHandler('focusAction', 'onExited', d, 'completeAction');
processHandler('focusAction', 'onRunningChanged', d, 'actionRunningChanged');
d.focusAction.running = false; d.completeAction(1, 0); d.actionRunningChanged();
assert.equal(d.opened, true); assert.equal(d.query, 'needle');
assert.equal(d.actionError, 'actionFailed'); assert.equal(d.actionBusy, false);
pass('nonzero dispatch exit preserves state and exposes actionable translated failure');
d.activate(0, false); d.verify.running = false; d.completeVerify(0, 0);
d.focusAction.running = false; d.actionRunningChanged();
assert.equal(d.opened, true); assert.equal(d.actionError, 'actionStartFailed');
assert.equal(d.actionBusy, false);
pass('failed start without exited has distinct feedback and permits retry');
for (const [code, status, reply] of [[0,0,'error: rejected'], [0,0,''], [0,0,'unexpected'], [0,1,'ok']]) {
  d.activate(0, false); d.verify.running = false; d.completeVerify(0, 0);
  d.actionReply.text = reply; d.focusAction.running = false;
  d.completeAction(code, status); d.actionRunningChanged();
  assert.equal(d.opened, true, 'exit zero alone must not confirm a compositor action');
  assert.equal(d.actionError, 'actionFailed');
}
pass('text errors unknown acknowledgements and abnormal exits cannot report success');
d.activate(0, false); d.verify.running = false; d.completeVerify(0, 0);
d.actionReply.text = 'ok\n'; d.focusAction.running = false;
d.completeAction(0, 0); d.actionRunningChanged();
assert.equal(d.opened, false); assert.equal(d.actionError, '');
pass('explicit acknowledgement with normal zero exit closes normally');
for (const code of [0, 1]) {
  d.opened = true; d.query = 'needle';
  d.activate(0, false); d.verify.running = false; d.completeVerify(0, 0);
  d.dismiss(); d.focusAction.running = false; d.completeAction(code, 0); d.actionRunningChanged();
  assert.equal(d.opened, false); assert.equal(d.actionError, '');
  // Even a new admission must not be dismissed by the cancelled dispatch's old result.
  d.opened = true; d.completeAction(code, 0); d.actionRunningChanged();
  assert.equal(d.opened, true); assert.equal(d.actionError, '');
}
pass('user dismissal invalidates success/failure and stale results cannot affect a later opening');
d.lockProbe.running = true; d.activate(0, false);
assert.equal(d.verify.running, false, 'lock probe in flight must block activation');
d.lockProbe.running = false; d.activate(0, false);
d.verify.running = false; d.lockProbe.running = true; d.completeVerify(0, 0);
assert.equal(d.focusAction.running, false, 'probe started during fresh lookup must block dispatch');
assert.equal(d.requestedAddress, '');
d.lockProbe.running = false;
pass('activation and fresh-lookup completion cannot dispatch while lock probe is unresolved');
for (const [code, status] of [[1,0], [0,1]]) {
  d.activate(0, false); d.verify.running = false; d.completeVerify(code, status);
  assert.equal(d.focusAction.running, false); assert.equal(d.requestedAddress, '');
  assert.equal(d.actionError, 'actionFailed');
}
processHandler('verify', 'onRunningChanged', d, 'verifyRunningChanged');
d.activate(0, false); d.verify.running = false; d.verifyRunningChanged();
assert.equal(d.focusAction.running, false); assert.equal(d.requestedAddress, '');
assert.equal(d.actionError, 'actionStartFailed');
pass('fresh lookup failures and failed starts preserve overlay and never dispatch');
d.activate(0, true); d.verify.running = false; d.completeVerify(0, 0);
assert.deepEqual(Array.from(d.focusAction.command), ['/usr/bin/hyprctl', 'dispatch',
  'hl.dsp.window.move({ workspace = 3, follow = false, window = "address:0x101" })']);
d.focusAction.running = false; d.completeAction(0, 0);
assert.equal(d.opened, false);
d.opened = true; d.verifiedClients.text = '[]';
d.activate(0, false); d.verify.running = false; d.completeVerify(0, 0);
assert.equal(d.focusAction.running, false); assert.equal(d.actionPending, false);
assert.equal(d.requestedAddress, '');
pass('actual focus/move entrypoints reach client 257 and reject vanished fresh membership');
entry('open', d);
d.Qt = {callLater(){}};
processHandler('lockProbe', 'onExited', d, 'completeProbe');
// Process termination is asynchronous: requesting stop does not complete the old verification.
let verifyRunning = false;
d.verify = {get running() { return verifyRunning; },
  set running(value) { if (value) verifyRunning = true; }};
const cancelledCompletions = [];
for (const [code, status] of [[0,0], [1,0], [0,1]]) {
  d.opened = true; d.verifiedClients.text = fresh;
  d.activate(0, false);
  assert.notEqual(d.requestedAddress, '', 'verification must be pending before dismissal');
  d.dismiss();
  assert.equal(d.requestedAddress, '');
  assert.equal(d.verify.running, true, 'cancelled process has not exited yet');
  d.open('{}'); d.lockProbe.running = false; d.completeProbe(1, 0);
  assert.equal(d.opened, true, 'new opening must be admitted before old completion');
  d.query = 'new search'; d.refresh.running = false;
  d.activate(0, false);
  assert.equal(d.requestedAddress, '', 'old running verification must block a new request');
  verifyRunning = false;
  const state = () => [d.opened, d.opening, d.query, d.raw, d.actionError, d.actionPending,
    d.requestedAddress, d.requestedWorkspace, d.refresh.running, d.refreshPending,
    d.focusAction.running, Array.from(d.focusAction.command), d.verify.running, d.actionBusy];
  const before = state();
  d.completeVerify(code, status); d.verifyRunningChanged();
  cancelledCompletions.push({code, status, before, after:state()});
}
assert.deepEqual(cancelledCompletions.map(result => result.after),
  cancelledCompletions.map(result => result.before),
  'cancelled normal/nonzero/abnormal verify completions must not mutate the new opening');
pass('cancelled verification cannot change a newly admitted opening on normal nonzero or abnormal exit');
const catalogue = JSON.parse(fs.readFileSync(__dirname + '/../i18n/en.json', 'utf8'));
for (const key of ['actionFailed', 'actionStartFailed']) assert.ok(catalogue[key]?.length);
assert.match(source, /textFormat: Text.PlainText\s+text: root.actionError \? strings.t\(root.actionError\)/);
assert.match(source, /interval: 250; repeat: true; running: root.opened/);
pass('failure footer uses live translated plain text and retains open lock polling');
console.log(`RESULT ${passed} passed`);
