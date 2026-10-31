#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-only
"""Offline release-layout checks; no installation, network or GUI actions."""
import json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
manifest = json.loads((root / 'manifest.json').read_text())
assert manifest['schemaVersion'] == 1
assert manifest['id'] == 'leviathan.native-overview'
assert manifest['version'] == '0.1.0'
assert manifest['license'] == 'GPL-3.0-only'
assert manifest['kinds'] == ['overlay']
assert manifest['entryPoints'] == {'overlay': 'Overview.qml'}
print('PASS release manifest identity/version/licence/entry point')
for name in ['Overview.qml', 'WindowPreview.qml', 'WindowModel.js', 'LICENSE', 'NOTICE.md',
             'README.md', 'SECURITY.md', 'CHANGELOG.md', 'docs/RELEASING.md', 'test.sh',
             'tests/model.test.cjs', 'tests/lifecycle.test.cjs']:
    assert (root / name).is_file(), name
assert 'GNU GENERAL PUBLIC LICENSE' in (root / 'LICENSE').read_text()
assert '2f2a376fdb2ad738bf55f693dd0b474b64bb0ab8' in (root / 'NOTICE.md').read_text()
print('PASS required source/tests/docs and retained donor notices')
catalogue = json.loads((root / 'i18n/en.json').read_text())
assert all(isinstance(catalogue.get(k), str) and catalogue[k] for k in
           ['title', 'search', 'detail', 'empty', 'help', 'previewUnavailable'])
for name in ['Overview.qml', 'WindowPreview.qml', 'WindowModel.js']:
    assert (root / name).read_text().startswith('// SPDX-License-Identifier: GPL-3.0-only')
print('PASS translation catalogue and source licence headers')
links = [str(p.relative_to(root)) for p in root.rglob('*')
         if '.git' not in p.relative_to(root).parts and p.is_symlink()]
assert not links, links
print('PASS no plugin symlinks')
print('RESULT 4 release-layout checks passed')
