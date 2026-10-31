// SPDX-License-Identifier: GPL-3.0-only
// Run only through native-io.test.sh: no host sockets, network or real HOME.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const cp = require('node:child_process');
assert.equal(process.env.NATIVE_IO_SANDBOX, '1', 'use bash tests/native-io.test.sh');
fs.mkdirSync('/tmp/runtime', {recursive:true, mode:0o700});
let helper = fs.readFileSync(require('./runtime-path.cjs')('BoundedProcess.qml'), 'utf8');
if (process.env.NATIVE_IO_MUTATION) {
  const mutation = process.env.NATIVE_IO_MUTATION;
  const [before, after] = mutation === 'unbounded-collector'
    ? ['/usr/bin/head -c "$limit"', '/usr/bin/cat']
    : mutation === 'accept-stale-run'
      ? ['var accepted = current === run;', 'var accepted = true;'] : [];
  assert.ok(before && helper.includes(before), 'known mutation must match source');
  helper = helper.replace(before, after);
}
let passed = 0;
function run(name, body, {missingTimeout = false, limit = 1024, childPidFile = ''} = {}) {
  const dir = fs.mkdtempSync('/tmp/native-io-');
  assert.ok(helper.includes('StdioCollector { id: collected }'), 'collector observation must attach');
  fs.writeFileSync(dir + '/BoundedProcess.qml', (missingTimeout
    ? helper.replace('"/usr/bin/timeout"', '"/no-such-timeout"') : helper)
    .replace('StdioCollector { id: collected }', `StdioCollector { id: collected
      onDataChanged: {
        console.log("COLLECTOR bytes=" + data.byteLength);
        if (typeof data.byteLength !== "number" || data.byteLength > run.limit + 1) console.log("FAIL unbounded native collector");
      }
    }`));
  fs.writeFileSync(dir + '/shell.qml', `import QtQuick
import Quickshell
ShellRoot {
  id: test
  property int completions: 0
  property double began: Date.now()
  function check(ok, message) { if (!ok) { console.log("FAIL " + message); Qt.exit(1); } }
  BoundedProcess { id: io; byteLimit: ${limit} }
  Timer { interval: 6000; running: true; onTriggered: { console.log("FAIL watchdog"); Qt.exit(1); } }
  ${body}
}`);
  const result = cp.spawnSync('/usr/bin/timeout', ['--kill-after=1', '9', '/usr/bin/qs', '-p', dir + '/shell.qml'],
    {encoding:'utf8', timeout:12000, env:process.env});
  const log = (result.stdout || '') + (result.stderr || '');
  console.log(`NATIVE ${name}\n${log}`);
  assert.equal(result.status, 0, name + ' native process exit');
  assert.match(log, /PASS native-case/, name + ' assertion receipt');
  assert.doesNotMatch(log, /FAIL |Error:|ReferenceError|TypeError/, name + ' no QML failure');
  if (childPidFile) {
    const pid = fs.readFileSync(childPidFile, 'utf8').trim();
    assert.match(pid, /^\d+$/);
    const path = '/proc/' + pid + '/stat';
    const state = fs.existsSync(path) ? fs.readFileSync(path, 'utf8').split(') ')[1][0] : 'gone';
    assert.ok(state === 'gone' || state === 'Z', name + ' must not leave a running child');
    console.log('CHILD_TERMINATED pid=' + pid + ' state=' + state);
  }
  console.log('PASS ' + name); passed++;
}
function completion(command, checks, options) {
  return run(options.name, `Component.onCompleted: {
    io.completed.connect(function(code, status, text, error) {
      completions++; check(completions === 1, "exactly one completion"); ${checks}; settle.start();
    });
    io.command = ${JSON.stringify(command)}; io.start();
  }
  Timer { id: settle; interval: 100; onTriggered: { console.log("PASS native-case"); Qt.exit(0); } }`, options);
}
completion(['/usr/bin/printf', 'ok\n'], 'check(code === 0 && status === 0 && text === "ok\\n" && error === "", "normal output/exit")', {name:'normal stdout and normal exit'});
completion(['/usr/bin/printf', '$(not-a-command); "literal"'], 'check(text === \'$(not-a-command); "literal"\' && error === "", "arguments remain literal")', {name:'shell metacharacters in arguments remain literal'});
completion(['/usr/bin/bash', '-c', 'printf rejected; exit 7'], 'check(code === 7 && status === 0 && text === "rejected" && error === "", "nonzero preserved")', {name:'nonzero exit remains failure-capable'});
completion(['/no-such-client-command'], 'check(code === 127 && status === 0, "missing wrapped executable denied")', {name:'missing wrapped executable cannot succeed'});
completion(['/usr/bin/bash', '-c', 'printf "\\303\\251\\360\\237\\230\\200"'], 'check(text === "é😀" && error === "", "UTF-8 round trip")', {name:'UTF-8 output is decoded after bounded collection'});
completion(['/usr/bin/head', '-c', '1024', '/dev/zero'], 'check(text.length === 1024 && error === "", "exact limit accepted")', {name:'exact ASCII byte boundary accepted'});
completion(['/usr/bin/head', '-c', '2097152', '/dev/zero'], 'check(error === "outputLimit" && text === "", "ASCII overflow rejected before publication")', {name:'large ASCII stream is capped'});
completion(['/usr/bin/bash', '-c', 'for ((i=0;i<600;i++)); do printf "\\303\\251"; done'], 'check(error === "outputLimit" && text === "", "UTF-8 bytes not UTF-16 units")', {name:'multibyte stream is capped by bytes'});
fs.writeFileSync('/tmp/utf8-limit', 'é'.repeat(1048576 / 2));
fs.writeFileSync('/tmp/utf8-overflow', 'é'.repeat(1048576 / 2 + 1));
completion(['/usr/bin/head', '-c', '1048576', '/dev/zero'], 'check(text.length === 1048576 && error === "", "production ASCII byte boundary")', {name:'production 1MiB ASCII limit accepted', limit:1048576});
completion(['/usr/bin/cat', '/tmp/utf8-limit'], 'check(text.length === 1048576 / 2 && error === "", "production UTF-8 byte boundary")', {name:'production 1MiB UTF-8 limit accepted', limit:1048576});
completion(['/usr/bin/cat', '/tmp/utf8-overflow'], 'check(error === "outputLimit" && text === "", "production UTF-8 overflow")', {name:'production 1MiB UTF-8 overflow rejected', limit:1048576});
completion(['/usr/bin/head', '-c', '2097152', '/dev/zero'], 'check(error === "outputLimit" && text === "", "production ASCII overflow")', {name:'production 1MiB ASCII overflow rejected', limit:1048576});
completion(['/usr/bin/bash', '-c', 'echo $$ > /tmp/native-hanging-child.pid; trap "" TERM; while :; do /usr/bin/sleep 1; done'], 'check(error === "" && (code === 124 || code === 137 || status !== 0), "timeout cannot succeed"); check(Date.now() - began < 4200, "hard deadline")', {name:'TERM-ignoring child has OS-enforced deadline', childPidFile:'/tmp/native-hanging-child.pid'});
completion(['/usr/bin/printf', 'never'], 'check(error === "startFailed" && code === -1 && text === "", "FailedToStart completion")', {name:'native FailedToStart without exited completes once', missingTimeout:true});
run('cancelled old run cannot complete a replacement run', `
  Component.onCompleted: {
    io.completed.connect(function(code, status, text, error) {
      completions++; check(completions === 1 && text === "new" && error === "", "only new run completes");
    });
    io.command = ["/usr/bin/bash", "-c", "echo $$ > /tmp/native-cancelled-child.pid; trap '' TERM; printf old; /usr/bin/sleep 4"];
    io.start();
  }
  Timer { interval: 100; running: true; onTriggered: {
    io.cancel(); check(!io.running, "cancel releases logical ownership");
    io.command = ["/usr/bin/bash", "-c", "/usr/bin/sleep 1.6; printf new"]; io.start();
  } }
  Timer { interval: 1400; running: true; onTriggered: {
    check(io.running && completions === 0, "old exit cannot clear the still-active replacement");
  } }
  Timer { interval: 3600; running: true; onTriggered: {
    check(completions === 1 && !io.running, "old exit cannot notify or clear replacement");
    console.log("PASS native-case"); Qt.exit(0);
  } }
`, {childPidFile:'/tmp/native-cancelled-child.pid'});
run('immediate cancellation cannot notify a new request', `
  Component.onCompleted: {
    io.completed.connect(function(code, status, text, error) {
      completions++; check(text === "new" && error === "", "immediate cancellation ownership");
    });
    io.command = ["/usr/bin/printf", "old"]; io.start(); io.cancel();
    io.command = ["/usr/bin/printf", "new"]; io.start();
  }
  Timer { interval: 3500; running: true; onTriggered: {
    check(completions === 1 && !io.running, "exactly one native completion"); console.log("PASS native-case"); Qt.exit(0);
  } }
`);
run('destroyed request owner cannot strand a command beyond its deadline', `
  property var retiringOwner: null
  Component {
    id: requestOwner
    Item {
      property alias request: owned
      BoundedProcess { id: owned }
    }
  }
  Component.onCompleted: {
    retiringOwner = requestOwner.createObject(io);
    retiringOwner.request.command = ["/usr/bin/bash", "-c", "echo $$ > /tmp/native-owner-destroyed.pid; trap '' TERM; while :; do /usr/bin/sleep 1; done"];
    retiringOwner.request.start();
  }
  Timer { interval: 250; running: true; onTriggered: { retiringOwner.destroy(); retiringOwner = null; } }
  Timer { interval: 4100; running: true; onTriggered: { console.log("PASS native-case"); Qt.exit(0); } }
`, {childPidFile:'/tmp/native-owner-destroyed.pid'});
// Record the real pipeline process group before cancellation; no host PIDs enter this fixture.
const unloadProducer = `import os,pathlib,json
members=[]
for p in pathlib.Path('/proc').iterdir():
 if not p.name.isdigit(): continue
 try:
  fields=(p/'stat').read_text().rpartition(') ')[2].split()
  if int(fields[2])==os.getpgrp(): members.append({'pid':int(p.name),'comm':(p/'comm').read_text().strip()})
 except (FileNotFoundError,ProcessLookupError): pass
parent=int((pathlib.Path('/proc')/str(os.getpgrp())/'stat').read_text().rpartition(') ')[2].split()[1])
if parent not in [p['pid'] for p in members]: members.append({'pid':parent,'comm':(pathlib.Path('/proc')/str(parent)/'comm').read_text().strip()})
pathlib.Path('/tmp/native-unloaded-pipeline.json').write_text(json.dumps(members))
os.execl('/usr/bin/sleep','sleep','30')`;
run('cancel then Loader unload terminates the sampled command pipeline', `
  Loader { id: unloadable; sourceComponent: Component { BoundedProcess {} } }
  Component.onCompleted: {
    check(unloadable.item !== null, "loaded request owner");
    unloadable.item.command = ${JSON.stringify(['/usr/bin/python3', '-c', unloadProducer])};
    unloadable.item.start();
  }
  Timer { interval: 400; running: true; onTriggered: { unloadable.item.cancel(); unloadable.active = false; } }
  Timer { interval: 4500; running: true; onTriggered: { console.log("PASS native-case"); Qt.exit(0); } }
`);
const pipeline = JSON.parse(fs.readFileSync('/tmp/native-unloaded-pipeline.json', 'utf8'));
assert.ok(pipeline.length >= 4, 'sample the real command pipeline, not just its immediate supervisor');
for (const role of ['bash', 'head', 'timeout']) assert.ok(pipeline.some(p => p.comm === role), 'sampled pipeline contains ' + role);
for (const p of pipeline) {
  assert.ok(Number.isInteger(p.pid) && p.pid > 0);
  const stat = '/proc/' + p.pid + '/stat';
  const state = fs.existsSync(stat) ? fs.readFileSync(stat, 'utf8').split(') ')[1][0] : 'gone';
  assert.ok(state === 'gone' || state === 'Z', p.comm + ' must stop after cancel/unload');
  console.log('PIPELINE_TERMINATED pid=' + p.pid + ' comm=' + p.comm + ' state=' + state);
}
console.log(`RESULT ${passed} passed`);
