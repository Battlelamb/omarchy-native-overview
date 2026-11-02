# SPDX-License-Identifier: GPL-3.0-only
"""Missing dependency controls run against package-only copies, never the source."""
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile

assert os.environ.get('OVERVIEW_SANDBOX') == '1', 'use bash test.sh'
root = Path(__file__).resolve().parents[1]
runtime = Path(json.loads((root/'manifest.json').read_text())['entryPoints']['overlay']).parent
required = [str(runtime/name) for name in ['preferences.py','settings.py','Settings.qml','Options.js']]
required += ['tests/test_preferences.py','tests/settings.test.cjs','tests/native-overview.py',
             'tests/native-overview.test.sh','tests/fixtures/hyprctl','tests/fixtures/unlocked','tests/packaging.py']
for missing in required:
    with tempfile.TemporaryDirectory() as tmp:
        box=Path(tmp)/'package'
        shutil.copytree(root,box,ignore=shutil.ignore_patterns('.git','__pycache__'))
        (box/missing).unlink()
        result=subprocess.run(['/usr/bin/python3',str(box/'scripts/check-package.py')],capture_output=True,text=True)
        assert result.returncode!=0 and missing.split('/')[-1] in result.stderr, 'guard must require '+missing
        print('PASS missing package dependency rejected: '+missing)
print('RESULT '+str(len(required))+' missing-dependency controls passed')
