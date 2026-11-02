# SPDX-License-Identifier: GPL-3.0-only
"""Run only inside the shipped offline test runner."""
import importlib.util
import json
import os
from pathlib import Path
import stat
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
RUNTIME = ROOT / Path(json.loads((ROOT / 'manifest.json').read_text())['entryPoints']['overlay']).parent


class PreferencesTest(unittest.TestCase):
    def setUp(self):
        self.assertEqual(os.environ.get('OVERVIEW_SANDBOX'), '1', 'use bash test.sh')
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.home = Path(self.tmp.name)
        self.env = dict(os.environ, HOME=str(self.home), XDG_CONFIG_HOME=str(self.home / '.config'))
        self.path = self.home / '.config/omarchy/lego/native-overview/preferences.json'

    def call(self, *args, ok=True):
        result = subprocess.run(['/usr/bin/python3', str(RUNTIME / 'settings.py'), *args], env=self.env,
                                capture_output=True, text=True, timeout=8)
        self.assertEqual(result.returncode, 0 if ok else 1, result.stderr + result.stdout)
        value = json.loads(result.stdout)
        self.assertEqual(value['ok'], ok)
        return value

    def test_first_read_no_write_and_ordinary_ancestor_permissions(self):
        ancestor = self.home / '.config/omarchy'
        ancestor.mkdir(parents=True, mode=0o755)
        before = stat.S_IMODE(ancestor.stat().st_mode)
        self.assertEqual(self.call('read')['options'], {'defaultScope':'all', 'sortOrder':'existing', 'thumbnails':True})
        self.assertFalse(self.path.parent.exists())
        self.assertEqual(stat.S_IMODE(ancestor.stat().st_mode), before)

    def test_save_read_and_reset_only_options(self):
        options = {'defaultScope':'current', 'sortOrder':'workspace', 'thumbnails':False}
        self.assertEqual(self.call('save', json.dumps(options))['options'], options)
        self.assertEqual(self.call('read')['options'], options)
        self.assertEqual(stat.S_IMODE(self.path.stat().st_mode), 0o600)
        data = json.loads(self.path.read_text())
        data['favorites'] = ['legacy-inert-id']
        self.path.write_text(json.dumps(data))
        self.call('reset')
        self.assertEqual(json.loads(self.path.read_text())['favorites'], ['legacy-inert-id'])
        self.assertEqual(self.call('read')['options']['defaultScope'], 'all')

    def test_malformed_payloads_preserve_saved_bytes(self):
        self.call('save', '{"sortOrder":"name"}')
        before = self.path.read_bytes()
        for raw in ['[]', '{', '{"thumbnails":1}', '{"defaultScope":"other"}', '{"sortOrder":"random"}',
                    '{"address":"0xabc"}', '{"sortOrder":"name","sortOrder":"workspace"}',
                    '{"thumbnails":NaN}', '{"sortOrder":"' + '界'*6000 + '"}']:
            self.call('save', raw, ok=False)
            self.assertEqual(self.path.read_bytes(), before)
        self.call('dispatch', ok=False)
        self.call('reset', 'extra', ok=False)

    def test_reused_helper_legacy_bounds_atomic_failure_and_locking(self):
        from unittest.mock import patch
        spec = importlib.util.spec_from_file_location('overview_preferences', RUNTIME/'preferences.py')
        assert spec is not None and spec.loader is not None
        helper = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(helper)
        with patch.dict(os.environ, self.env):
            helper.change('native-overview', {}, {})
            before = self.path.read_bytes()
            with patch.object(helper.os, 'replace', side_effect=OSError('test refusal')):
                with self.assertRaises(ValueError): helper.change('native-overview', {}, {})
            self.assertEqual(self.path.read_bytes(), before)
            self.assertEqual(list(self.path.parent.glob('.preferences-*')), [])
            legacy = helper.read('native-overview', {})
            legacy['collections'] = {str(i):[str(j)+'界'*250 for j in range(200)] for i in range(2)}
            raw = json.dumps(legacy, ensure_ascii=False).encode()
            self.assertGreater(len(raw), helper.WRITE_BYTES)
            self.assertLess(len(raw), helper.MAX_BYTES)
            self.path.write_bytes(raw)
            self.assertEqual(helper.read('native-overview', {}), legacy)
            with self.assertRaisesRegex(ValueError, '128 KiB'):
                helper.change('native-overview', {}, {})
            self.assertEqual(self.path.read_bytes(), raw)
            self.path.write_bytes(before)
            children=[]
            for i in range(6):
                pid=os.fork()
                if pid==0:
                    try: helper.put_collection('native-overview', {}, str(i), [str(i)])
                    except Exception: os._exit(1)
                    os._exit(0)
                children.append(pid)
            for pid in children:self.assertEqual(os.waitpid(pid,0)[1],0)
            self.assertEqual(len(helper.read('native-overview', {})['collections']),6)
            self.path.write_bytes(b' '*(helper.MAX_BYTES+1))
            with self.assertRaisesRegex(ValueError,'too large'):helper.read('native-overview', {})

    def test_symlink_and_corrupt_store_refused_without_replacement(self):
        self.call('save', '{}')
        self.path.write_text('{')
        self.call('reset', ok=False)
        self.assertEqual(self.path.read_text(), '{')
        self.path.unlink()
        target = self.home / 'unrelated'
        target.write_text('unchanged')
        self.path.symlink_to(target)
        self.call('save', '{}', ok=False)
        self.assertEqual(target.read_text(), 'unchanged')


if __name__ == '__main__':
    unittest.main()
