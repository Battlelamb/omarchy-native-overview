#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-only
"""Offline release-layout checks; no installation, network or GUI actions."""
import json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
manifest = json.loads((root / 'manifest.json').read_text())
assert manifest['schemaVersion'] == 1
assert manifest['id'] == 'battlelamb.native-overview'
assert manifest['version'] == '0.3.1'
assert manifest['author'] == 'Battlelamb'
assert manifest['license'] == 'GPL-3.0-only'
assert manifest['kinds'] == ['overlay']
assert manifest['entryPoints'] == {'overlay': 'runtime/' + manifest['version'] + '/Overview.qml'}
print('PASS release manifest identity/version/licence/entry point')
runtime = root / 'runtime' / manifest['version']
assert manifest.get('keepLoaded') is True
assert {p.name for p in (root/'runtime').iterdir()} == {manifest['version']}, 'stale runtime tree'
for name in ['Overview.qml', 'BoundedProcess.qml', 'WindowPreview.qml', 'WindowModel.js', 'Settings.qml', 'Options.js', 'settings.py', 'preferences.py']:
    assert (runtime / name).is_file(), name
    assert not (root / name).exists(), 'duplicate or stale root runtime: ' + name
for name in ['LICENSE', 'NOTICE.md',
             'README.md', 'SECURITY.md', 'CHANGELOG.md', 'CONTRIBUTING.md', 'docs/RELEASING.md',
             'docs/VALIDATION.md', '.github/workflows/checks.yml', '.github/ISSUE_TEMPLATE/bug-report.yml', 'test.sh',
             'tests/test_preferences.py', 'tests/settings.test.cjs', 'tests/native-overview.py', 'tests/native-overview.test.sh',
             'tests/fixtures/hyprctl', 'tests/fixtures/unlocked', 'tests/packaging.py',
             'tests/model.test.cjs', 'tests/lifecycle.test.cjs', 'tests/ui.test.cjs', 'tests/runtime-path.cjs', 'tests/native-io.test.cjs', 'tests/native-io.test.sh']:
    assert (root / name).is_file(), name
assert 'GNU GENERAL PUBLIC LICENSE' in (root / 'LICENSE').read_text()
assert '2f2a376fdb2ad738bf55f693dd0b474b64bb0ab8' in (root / 'NOTICE.md').read_text()
print('PASS required source/tests/docs and retained donor notices')
catalogue = json.loads((runtime / 'i18n/en.json').read_text())
assert all(isinstance(catalogue.get(k), str) and catalogue[k] for k in
           ['title', 'search', 'detail', 'empty', 'help', 'previewUnavailable'])
for name in ['Overview.qml', 'BoundedProcess.qml', 'WindowPreview.qml', 'WindowModel.js', 'Settings.qml', 'Options.js', 'settings.py', 'preferences.py']:
    assert (runtime / name).read_text().startswith(('# SPDX-License-Identifier: GPL-3.0-only', '// SPDX-License-Identifier: GPL-3.0-only'))
print('PASS translation catalogue and source licence headers')
links = [str(p.relative_to(root)) for p in root.rglob('*')
         if '.git' not in p.relative_to(root).parts and p.is_symlink()]
assert not links, links
print('PASS no plugin symlinks')
print('RESULT 4 release-layout checks passed')
