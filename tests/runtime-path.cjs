// SPDX-License-Identifier: GPL-3.0-only
// Shared test lookup follows the manifest's immutable runtime URL.
const path = require('node:path');
const assert = require('node:assert/strict');
const manifest = require('../manifest.json');
assert.match(manifest.version, /^\d+\.\d+\.\d+$/);
const directory = 'runtime/' + manifest.version;
assert.equal(manifest.entryPoints.overlay, directory + '/Overview.qml');
module.exports = name => path.join(__dirname, '..', directory, name);
