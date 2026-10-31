# Public release checklist

The local source is structured for Omarchy's standard plugin installer: manifest and all entry points at the repository root. Packaging and a local installation do **not** constitute marketplace approval.

## Before publication

1. Select the public repository/account and a private security contact with the owner. No guessed GitHub identity, repository URL or contact is included.
2. Review README limitations and the GPL-3.0-only donor notices. Retain the full corresponding source and LICENSE in every distributed source archive. Do not claim the original whole-shell resource gate passed.
3. Run `omarchy plugin validate .`, `bash test.sh` and `python3 scripts/check-package.py` on the exact release tree. Keep real installation receipts separately; do not publish private window metadata, local logs, credentials or real desktop screenshots.
4. Exercise install, disable/re-enable, open/close and shortcut removal. A full-shell restart, usable second-output rendering, accessibility, race and longer resource coverage are still outstanding unless a later receipt documents them.
5. Choose whether the documented limitations are appropriate for a clearly labelled initial release. This local package uses version 0.1.0, not a stable/official certification.
6. After explicit publication approval, publish the reviewed repository/commit and release source archive, then replace the README's `<repository-url>` placeholder with the real URL. Local `v0.1.0` tagging and archives do not push anything.
7. Submit through https://plugins.omarchy.org/publish.html using the real public GitHub repository, category and tags. Suggested category: Productivity; tags: windows, launcher, overview, workspace. Maintainers decide acceptance; never describe a prepared submission as an approved listing.

Current marketplace prerequisites were checked against https://plugins.omarchy.org/publish.html and https://plugins.omarchy.org/develop.html: root manifest, public GitHub repository, README/licence, safe install/removal; preview image optional. Requirements may change, so recheck before submitting.

## Local release commands

```bash
omarchy plugin validate .
bash test.sh
python3 scripts/check-package.py
# Only after changes are reviewed and committed:
git archive --format=tar --prefix=omarchy-native-overview-0.1.0/ HEAD | gzip -n > omarchy-native-overview-0.1.0.tar.gz
sha256sum omarchy-native-overview-0.1.0.tar.gz
```

Never archive `.git`, config backups, benchmark fixtures, process traces or private installation receipts into the public release. This repository intentionally contains only the runtime plugin, component tests and release documentation/tooling. Detailed prototype receipts remain outside this repository.
