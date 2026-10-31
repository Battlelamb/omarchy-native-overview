#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-3.0-only
set -euo pipefail
ROOT=$(cd -- "$(dirname -- "$0")/.." && pwd)
exec bwrap --unshare-all --die-with-parent --new-session --clearenv \
  --ro-bind /usr /usr --ro-bind /etc/fonts /etc/fonts --symlink usr/lib /lib --symlink usr/lib /lib64 \
  --proc /proc --dev /dev --tmpfs /tmp --ro-bind "$ROOT" /work \
  --chdir /work --setenv HOME /tmp --setenv PATH /usr/bin --setenv LANG C.UTF-8 \
  --setenv XDG_RUNTIME_DIR /tmp/runtime --setenv QT_QPA_PLATFORM offscreen \
  --setenv QSG_RHI_BACKEND software --setenv NATIVE_IO_SANDBOX 1 \
  --setenv NATIVE_IO_MUTATION "${NATIVE_IO_MUTATION:-}" \
  /usr/bin/node tests/native-io.test.cjs
