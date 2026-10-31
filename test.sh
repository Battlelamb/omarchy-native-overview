#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-3.0-only
set -euo pipefail
ROOT=$(cd -- "$(dirname -- "$0")" && pwd)
exec bwrap --unshare-all --die-with-parent --new-session --clearenv \
  --ro-bind /usr /usr --symlink usr/lib /lib --symlink usr/lib /lib64 \
  --proc /proc --dev /dev --tmpfs /tmp --ro-bind "$ROOT" /work \
  --chdir /work --setenv HOME /tmp /usr/bin/bash -c \
  '/usr/bin/node tests/model.test.cjs && /usr/bin/node tests/lifecycle.test.cjs'
