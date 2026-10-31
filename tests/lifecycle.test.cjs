// SPDX-License-Identifier: GPL-3.0-only
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(__dirname + '/../Overview.qml', 'utf8');
const ioSource = fs.readFileSync(__dirname + '/../BoundedProcess.qml', 'utf8');
let passed = 0;
function pass(name) { passed++; console.log('PASS ' + name); }
function block(text, start) {
  let end = text.indexOf('{', start) + 1, depth = 1;
  const begin = end - 1;
  assert.ok(begin >= start, 'callback block missing');
  while (depth && end < text.length) {
    if (text[end] === '{') depth++;
    if (text[end] === '}') depth--;
    end++;
  }
  return text.slice(begin, end);
}
function entry(text, name, context) {
  const start = text.indexOf('function ' + name + '(');
  assert.ok(start >= 0, name + ' entry point missing');
  const body = text.indexOf('{', start);
  vm.runInContext(text.slice(start, body) + block(text, body), context);
}
function callback(id, context) {
  const start = source.indexOf('id: ' + id);
  const handler = source.indexOf('onCompleted:', start);
  const body = source.indexOf('{', handler);
  vm.runInContext(id + 'Done = ' + source.slice(handler + 'onCompleted:'.length, body) + block(source, body), context);
  return context[id + 'Done'];
}
const windowModel = vm.createContext({});
vm.runInContext(fs.readFileSync(__dirname + '/../WindowModel.js', 'utf8'), windowModel);
// Only native Timer/Process creation is replaced. Execute both the real Overview
// callbacks and helper ownership methods; native signal/byte tests live separately.
function platform(done) {
  const io = vm.createContext({current:null, command:[], byteLimit:1048576, completed:done});
  io.owner = io;
  io.factory = {createObject(owner, props) {
    const run = {...props, output:'', bytes:0, finished:false, nativeRunning:false,
      stopRequested:false, destroy() { this.destroyed = true; }};
    Object.defineProperty(run, 'running', {
      get() { return this.nativeRunning; },
      set(value) { if (value) this.nativeRunning = true; else this.stopRequested = true; }
    });
    return run;
  }};
  Object.defineProperty(io, 'running', {get() { return io.current !== null; }});
  for (const name of ['start', 'cancel', 'finish', 'stopped']) entry(ioSource, name, io);
  io.complete = function(code=0, status=0, text='', error='', run=io.current) {
    assert.ok(run, 'native run must exist');
    run.nativeRunning = false; run.output = text; run.bytes = Buffer.byteLength(text);
    io.finish(run, code, status, error);
  };
  return io;
}
function fixture() {
  let now = 0, deadline = null;
  const c = vm.createContext({opened:false, opening:false, raw:'[]', query:'', selected:0,
    requestedAddress:'', requestedWorkspace:0, refreshPending:false, actionPending:false,
    actionError:'', shell:null, manifest:null, WindowModel:windowModel,
    Hyprland:{focusedWorkspace:{id:3}}, Qt:{callLater(){}}, keyboard:{forceActiveFocus(){}},
    updateTimer:{running:false, start() { this.running = true; deadline = now + 80; },
      stop() { this.running = false; deadline = null; }}});
  c.root = c;
  for (const name of ['open', 'close', 'dismiss', 'activate', 'queueRefresh', 'runRefresh', 'finishAction']) entry(source, name, c);
  for (const id of ['lockProbe', 'refresh', 'verify', 'focusAction']) c[id] = platform(callback(id, c));
  const busy = source.match(/readonly property bool actionBusy: ([^\n]+)/);
  assert.ok(busy, 'read-only progress guard missing');
  Object.defineProperty(c, 'actionBusy', {get() { return vm.runInContext(busy[1], c); }});
  Object.defineProperty(c, 'matches', {get() { return windowModel.rows(c.raw, c.query); }});
  entry(source, 'onRawEvent', c);
  const timer = source.slice(source.indexOf('id: updateTimer'));
  const trigger = timer.match(/onTriggered: ([^\n}]+)/)[1].trim();
  c.tick = function(to) {
    while (deadline !== null && deadline <= to) {
      now = deadline; deadline = null; c.updateTimer.running = false;
      vm.runInContext(trigger, c);
    }
    now = to;
  };
  c.admit = function() { c.open('{}'); c.lockProbe.complete(1, 0); };
  return c;
}
const c = fixture();
c.open('{}');
assert.equal(c.opened, false); assert.equal(c.refresh.running, false);
assert.equal(c.opening, true); assert.equal(c.lockProbe.running, true);
pass('open awaits lock verification before mapping or collecting clients');
const cancelledProbe = c.lockProbe.current;
c.close();
assert.equal(c.opening, false); assert.equal(c.opened, false); assert.equal(c.raw, '[]');
assert.equal(cancelledProbe.stopRequested, true);
pass('close invalidates pending admission and clears client data');
for (const [code, status, error] of [[0,0,''],[2,0,''],[124,0,''],[127,0,''],[1,1,''],[1,0,'outputLimit']]) {
  c.open('{}'); c.lockProbe.complete(code, status, '', error);
  assert.equal(c.opened, false, `reject probe ${code}/${status}/${error}`);
  assert.equal(c.opening, false); assert.equal(c.refresh.running, false);
}
pass('locked unknown timeout missing-helper and abnormal-exit results fail closed');
c.admit();
assert.equal(c.opened, true); assert.equal(c.opening, false); assert.equal(c.refresh.running, true);
pass('only a normal unlocked result admits overview');
c.close(); c.lockProbe.complete(1, 0, '', '', cancelledProbe);
assert.equal(c.opened, false); assert.equal(c.refresh.running, false);
c.open('{}'); const freshProbe = c.lockProbe.current;
c.lockProbe.complete(1, 0, '', '', cancelledProbe);
assert.equal(c.opening, true); assert.equal(c.lockProbe.current, freshProbe);
c.lockProbe.complete(1, 0);
pass('cancelled or in-flight probes cannot reopen or admit another opening');
c.close(); c.open('{}');
const failedProbe = c.lockProbe.current; failedProbe.nativeRunning = false;
c.lockProbe.stopped(failedProbe);
assert.equal(c.opening, false, 'FailedToStart without exited must clear admission');
assert.equal(c.lockProbe.running, false); c.open('{}'); assert.equal(c.opening, true);
c.lockProbe.complete(1, 0);
pass('lock FailedToStart without exited clears admission and permits retry');

const r = fixture(); r.admit(); r.refresh.complete(0,0,'[]');
let launches = 0;
for (let t = 0; t < 800; t += 20) {
  r.tick(t); r.onRawEvent({});
  if (r.refresh.running) { launches++; r.refresh.complete(0,0,'[]'); }
}
assert.ok(launches >= 8 && launches <= 10, 'continuous events must refresh without unbounded launches');
pass('sustained 20ms events produce bounded refreshes without debounce starvation');
r.updateTimer.stop(); r.refresh.start(); r.onRawEvent({}); r.tick(880);
assert.equal(r.refreshPending, true);
r.refresh.complete(0,0,'[]'); assert.equal(r.refresh.running, true); assert.equal(r.refreshPending, false);
r.refresh.complete(0,0,'[]'); assert.equal(r.refresh.running, false);
pass('timer firing during active refresh is serviced once that refresh finishes');
r.onRawEvent({}); r.refresh.start(); const oldRefresh = r.refresh.current;
r.close(); r.tick(1040); r.refresh.complete(0,0,'old', '', oldRefresh); r.onRawEvent({});
assert.equal(r.refreshPending, false); assert.equal(r.refresh.running, false); assert.equal(r.updateTimer.running, false);
pass('close cancels pending work and late completion/events cannot restart polling');
r.admit(); const newRefresh = r.refresh.current;
r.raw = 'new-session';
// A different cancelled run remains pending until after the new run starts.
r.close(); const lateRefresh = newRefresh; r.admit(); const activeRefresh = r.refresh.current;
r.raw = 'new-session'; r.refresh.complete(0,0,'old-session','',lateRefresh);
assert.equal(r.raw, 'new-session', 'cancelled refresh output must not repopulate a new admission');
assert.equal(r.refresh.current, activeRefresh, 'old completion must not clear the new run');
r.refresh.complete(0,0,'fresh-session'); assert.equal(r.raw, 'fresh-session');
pass('cancelled refresh output cannot repopulate a new admission or clear its refresh');
for (const [code,status,error] of [[1,0,''],[0,1,''],[0,0,'outputLimit'],[124,0,''],[-1,-1,'startFailed']]) {
  r.refresh.start(); r.raw = 'old-data'; r.refresh.complete(code,status,'untrusted',error);
  assert.equal(r.raw, '[]'); assert.equal(r.refresh.running, false);
}
pass('refresh failures timeouts and oversize responses never publish client data');

const clients = Array.from({length:257}, (_, i) => ({address:'0x' + (i + 1).toString(16),
  mapped:true, title:i === 256 ? 'needle' : 'ordinary', class:'Editor', workspace:{id:1}, monitor:0}));
const fresh = JSON.stringify(clients);
const d = fixture(); d.admit(); d.refresh.complete(0,0,fresh); d.query = 'needle';
function dispatch(bring=false) { d.activate(0, bring); d.verify.complete(0,0,fresh); }
d.activate(0, false); d.verify.current.nativeRunning = false;
assert.equal(d.actionBusy, true, 'fresh lookup guards the pre-start notification gap');
const lookup = d.verify.current; d.activate(0, false); assert.equal(d.verify.current, lookup);
d.verify.complete(0,0,fresh);
assert.equal(d.opened, true); assert.equal(d.query, 'needle'); assert.equal(d.raw, fresh);
assert.equal(d.requestedAddress, ''); assert.equal(d.actionBusy, true);
assert.deepEqual(Array.from(d.focusAction.command), ['/usr/bin/hyprctl', 'dispatch',
  'hl.dsp.focus({ window = "address:0x101" })']);
d.activate(0, false); assert.equal(d.verify.running, false);
pass('dispatch keeps overlay/search state until confirmed completion and blocks double activation');
d.focusAction.complete(1, 0, 'ok\n');
assert.equal(d.opened, true); assert.equal(d.query, 'needle');
assert.equal(d.actionError, 'actionFailed'); assert.equal(d.actionBusy, false);
pass('nonzero dispatch exit preserves state and exposes actionable translated failure');
dispatch(); const failedAction = d.focusAction.current; failedAction.nativeRunning = false;
d.focusAction.stopped(failedAction);
assert.equal(d.opened, true); assert.equal(d.actionError, 'actionStartFailed'); assert.equal(d.actionBusy, false);
pass('failed start without exited has distinct feedback and permits retry');
for (const [code,status,reply,error] of [[0,0,'error: rejected',''],[0,0,'',''],[0,0,'unexpected',''],[0,1,'ok',''],[124,0,'ok',''],[0,0,'ok','outputLimit']]) {
  dispatch(); d.focusAction.complete(code,status,reply,error);
  assert.equal(d.opened, true); assert.equal(d.actionError, 'actionFailed'); assert.equal(d.query, 'needle');
}
pass('text errors unknown acknowledgements abnormal exits timeouts and overflow cannot report success');
dispatch(); d.focusAction.complete(0,0,'ok\n');
assert.equal(d.opened, false); assert.equal(d.actionError, '');
pass('explicit acknowledgement with normal zero exit closes normally');
for (const [code,status] of [[0,0],[1,0],[0,1]]) {
  d.admit(); d.refresh.complete(0,0,fresh); d.query = 'needle'; dispatch();
  const cancelledAction = d.focusAction.current; d.dismiss();
  assert.equal(cancelledAction.stopRequested, true);
  d.admit(); d.refresh.complete(0,0,fresh); d.query = 'needle'; dispatch();
  const activeAction = d.focusAction.current; d.query = 'new search';
  const before = [d.opened,d.query,d.raw,d.actionError,d.actionPending,d.requestedAddress];
  d.focusAction.complete(code,status,'ok','',cancelledAction);
  assert.deepEqual([d.opened,d.query,d.raw,d.actionError,d.actionPending,d.requestedAddress], before);
  assert.equal(d.focusAction.current, activeAction, 'old action cannot finish the new pending action');
  d.focusAction.complete(1,0,'rejected'); d.close();
}
pass('user dismissal cancels dispatch and stale results cannot affect a later opening');
d.admit(); d.refresh.complete(0,0,fresh); d.query = 'needle';
d.lockProbe.start(); d.activate(0, false); assert.equal(d.verify.running, false);
d.lockProbe.complete(1,0); d.activate(0, false); d.lockProbe.start(); d.verify.complete(0,0,fresh);
assert.equal(d.focusAction.running, false); assert.equal(d.requestedAddress, ''); d.lockProbe.complete(1,0);
pass('activation and fresh-lookup completion cannot dispatch while lock probe is unresolved');
for (const [code,status,error] of [[1,0,''],[0,1,''],[124,0,''],[0,0,'outputLimit'],[-1,-1,'startFailed']]) {
  d.activate(0, false); d.verify.complete(code,status,fresh,error);
  assert.equal(d.focusAction.running, false); assert.equal(d.requestedAddress, '');
  assert.equal(d.actionError, error === 'startFailed' ? 'actionStartFailed' : 'actionFailed');
  assert.equal(d.query, 'needle'); assert.equal(d.actionBusy, false);
}
d.activate(0, false); const failedVerify = d.verify.current; failedVerify.nativeRunning = false;
d.verify.stopped(failedVerify); assert.equal(d.actionError, 'actionStartFailed'); assert.equal(d.actionBusy, false);
pass('fresh lookup failures failed starts timeouts and overflow preserve overlay and never dispatch');
dispatch(true);
assert.deepEqual(Array.from(d.focusAction.command), ['/usr/bin/hyprctl', 'dispatch',
  'hl.dsp.window.move({ workspace = 3, follow = false, window = "address:0x101" })']);
d.focusAction.complete(0,0,'ok'); assert.equal(d.opened, false);
d.admit(); d.refresh.complete(0,0,fresh); d.query = 'needle';
d.activate(0, false); d.verify.complete(0,0,'[]');
assert.equal(d.focusAction.running, false); assert.equal(d.actionPending, false); assert.equal(d.requestedAddress, '');
pass('actual focus/move entrypoints reach client 257 and reject vanished fresh membership');
for (const [code,status] of [[0,0],[1,0],[0,1]]) {
  d.query = 'needle'; d.activate(0, false); const cancelled = d.verify.current; d.dismiss();
  assert.equal(cancelled.stopRequested, true);
  d.admit(); d.refresh.complete(0,0,fresh); d.query = 'needle'; d.activate(0, false);
  const replacement = d.verify.current;
  const state = () => [d.opened,d.opening,d.query,d.raw,d.actionError,d.actionPending,
    d.requestedAddress,d.requestedWorkspace,d.refresh.running,d.refreshPending,d.focusAction.running,d.actionBusy];
  const before = state(); d.verify.complete(code,status,fresh,'',cancelled);
  assert.deepEqual(state(), before); assert.equal(d.verify.current, replacement);
  d.verify.complete(0,0,fresh); d.focusAction.complete(1,0,'rejected');
}
pass('cancelled normal nonzero abnormal verification cannot mutate a new active verification');
const catalogue = JSON.parse(fs.readFileSync(__dirname + '/../i18n/en.json', 'utf8'));
for (const key of ['actionFailed', 'actionStartFailed']) assert.ok(catalogue[key]?.length);
assert.match(source, /textFormat: Text.PlainText\s+text: root.actionError \? strings.t\(root.actionError\)/);
assert.match(source, /interval: 250; repeat: true; running: root.opened/);
pass('failure footer uses live translated plain text and retains open lock polling');
console.log(`RESULT ${passed} passed`);
