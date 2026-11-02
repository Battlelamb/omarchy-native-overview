#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-3.0-only
set -euo pipefail
ROOT=$(cd -- "$(dirname -- "$0")/.." && pwd)
OUT=${1:?usage: bash tests/native-overview.test.sh OWNED_EVIDENCE_DIR}
mkdir -p "$OUT"
OUT=$(cd -- "$OUT" && pwd)
exec bwrap --unshare-all --die-with-parent --new-session --clearenv \
  --ro-bind /usr /usr --ro-bind /etc/fonts /etc/fonts --symlink usr/lib /lib --symlink usr/lib /lib64 \
  --proc /proc --dev /dev --tmpfs /tmp --ro-bind "$ROOT" /work --bind "$OUT" /evidence \
  --chdir /work --ro-bind "$ROOT/tests/fixtures/hyprctl" /usr/bin/hyprctl \
  --ro-bind "$ROOT/tests/fixtures/unlocked" /usr/bin/omarchy-hyprland-session-locked \
  --setenv HOME /tmp/home --setenv PATH /usr/bin --setenv LANG C.UTF-8 \
  --setenv XDG_RUNTIME_DIR /tmp/runtime --setenv XDG_CONFIG_HOME /tmp/home/.config \
  --setenv QT_QUICK_BACKEND software --setenv LIBGL_ALWAYS_SOFTWARE 1 --setenv PYTHONDONTWRITEBYTECODE 1 --setenv OVERVIEW_SANDBOX 1 \
  --setenv OVERVIEW_MUTATION "${OVERVIEW_MUTATION:-}" \
  /usr/bin/python3 tests/native-overview.py
