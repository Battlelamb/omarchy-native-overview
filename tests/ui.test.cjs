// SPDX-License-Identifier: GPL-3.0-only
// Source/binding contracts only: this is not a QML renderer or GPU/input test.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('./runtime-path.cjs')('Overview.qml'), 'utf8');
function section(id) {
  const at = source.indexOf('id: ' + id);
  assert.ok(at >= 0, id + ' UI item missing');
  const start = source.lastIndexOf('{', at);
  let end = start + 1, depth = 1;
  while (depth && end < source.length) {
    if (source[end] === '{') depth++;
    if (source[end] === '}') depth--;
    end++;
  }
  return source.slice(start, end);
}
function expression(text, name) {
  const found = text.match(new RegExp('(?:^|\\n)\\s*(?:readonly property \\w+ )?' + name.replaceAll('.', '\\.') + ': ([^\\n]+)'));
  assert.ok(found, name + ' expression missing');
  return found[1];
}
function value(text, name, context) { return vm.runInNewContext(expression(text, name), context); }
assert.match(source, /component Label: Text\s*\{\s*textFormat: Text.PlainText/);
assert.equal((source.match(/font.family: Style.font.menuFamily/g) || []).length, 1, 'text style belongs to the inline label');
assert.match(source, /LayoutMirroring.enabled: Commons.I18n.rightToLeft/);
assert.match(source, /LayoutMirroring.childrenInherit: true/);
assert.doesNotMatch(source, /TextInput|TextEdit|TextField|FilterInput|Gradient|ShaderEffect|Clipboard/);
console.log('PASS shared plain-text label, native tokens and RTL preserve the manual-input surface');
const card = section('card'), body = section('body'), preview = section('previewPane');
for (const [width, height, expectedWide] of [[1280,720,true], [800,600,false], [480,360,false]]) {
  const Style = {space:n => n};
  const panel = {width,height};
  const geometry = {width:value(card, 'width', {Style,panel}), height:value(card, 'height', {Style,panel})};
  assert.ok(geometry.width > 0 && geometry.width < width);
  assert.ok(geometry.height > 0 && geometry.height < height);
  const compact = value(card, 'compact', {...geometry, Style});
  const inset = compact ? 12 : 20;
  const wide = value(body, 'wide', {width:geometry.width - 2 * inset, Style});
  assert.equal(wide, expectedWide);
  const available = {height:Math.max(0, geometry.height - 2 * inset - 180), wide};
  const previewHeight = value(preview, 'height', {body:available, Style});
  assert.ok(previewHeight > 0 && previewHeight <= available.height);
  if (wide) assert.ok(previewHeight > 160, 'wide preview exceeds old thumbnail height');
}
assert.match(section('footer'), /anchors.bottom: parent.bottom/);
assert.match(section('footer'), /wrapMode: Text.WordWrap/);
assert.match(body, /footer.y - y/);
const loader = section('previewLoader');
assert.match(loader, /active: root.opened && !root.configuring && body.showPreview && root.matches.length > 0/);
for (const metadataY of [12, 100]) {
  const height = value(loader, 'height', {previewMetadata:{y:metadataY}, y:32, Style:{space:n => n}});
  assert.equal(height, Math.max(0, metadataY - 42), 'short previews never request a negative capture size');
}
assert.match(section('previewPane'), /strings.t\("preview"\)/);
assert.match(section('previewPane'), /selectedRow/);
assert.equal(value(section('previewMetadata'), 'height', {body:{wide:false}, implicitHeight:38}), 0,
  'stacked previews put compact metadata in the heading instead of spending capture height');
const details = section('previewDetails');
assert.equal(value(details, 'visible', {previewPane:{selectedRow:null}}), false,
  'empty preview must not repeat its selection hint as metadata');
assert.equal(value(details, 'visible', {previewPane:{selectedRow:{app:'foot'}}}), true);
console.log('PASS responsive geometry bindings switch to a stacked preview and reserve a wrapping footer');
for (const id of ['scopeButton', 'clearButton']) {
  const control = section(id);
  assert.match(control, /Accessible.name:/);
  assert.match(control, /Accessible.onPressAction:/);
}
assert.match(section('scopeButton'), /selected: root.workspaceOnly/);
assert.match(section('clearButton'), /visible: root.query.length > 0/);
console.log('PASS scope and clear controls expose accessible actions without input or clipboard controls');
console.log('RESULT 3 passed (source and binding contracts only)');
