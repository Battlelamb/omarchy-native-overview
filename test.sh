#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-3.0-only
set -euo pipefail
ROOT=$(cd -- "$(dirname -- "$0")" && pwd)
exec bwrap --unshare-all --die-with-parent --new-session --clearenv \
  --ro-bind /usr /usr --symlink usr/lib /lib --symlink usr/lib /lib64 \
  --proc /proc --dev /dev --tmpfs /tmp --ro-bind "$ROOT" /work \
  --chdir /work --setenv HOME /tmp --setenv PATH /usr/bin --setenv OVERVIEW_SANDBOX 1 \
  --setenv PYTHONDONTWRITEBYTECODE 1 /usr/bin/bash -c \
  '/usr/bin/node tests/settings.test.cjs && /usr/bin/node tests/model.test.cjs && /usr/bin/node tests/lifecycle.test.cjs && /usr/bin/python3 -m unittest discover -s tests -p "test_*.py" -v && /usr/bin/python3 tests/packaging.py && /usr/bin/python3 scripts/check-package.py'
