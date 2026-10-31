# Community release checklist

The plugin uses Omarchy's normal repository-root manifest and installer contract. Packaging, local use, public release and marketplace approval are different states.

## Current state

- Local v0.1.0 is installed and remains frozen; do not delete or move its tag or origin.
- Public early pre-release: [v0.1.1](https://github.com/Battlelamb/omarchy-native-overview/releases/tag/v0.1.1).
- Publishing account: `Battlelamb`.
- Public repository: [Battlelamb/omarchy-native-overview](https://github.com/Battlelamb/omarchy-native-overview); owner, visibility, tag target and release assets were read back.
- [Hosted CI passed on the release-source commit](https://github.com/Battlelamb/omarchy-native-overview/actions/runs/41176718409); private vulnerability reporting is enabled. Marketplace submission and Reddit posting remain separate steps, not claims of maintainer approval.

## Before the public write

1. Resolve concrete independent-review findings. Preserve donor attribution and the full GPL licence. Do not claim the original whole-shell resource gate passed or imply an official Omarchy affiliation.
2. Run `omarchy plugin validate .`, `bash test.sh`, `python3 scripts/check-package.py`, and the component commands used by `.github/workflows/checks.yml` on the exact tree. A prepared workflow is not hosted CI evidence.
3. Review the public file list and git identity. Exclude backups, local receipts, process traces and real desktop screenshots. No test fixture/observer is part of runtime installation.
4. Show the owner the concrete proposed repository, early-release version, marketplace submission and Reddit title/body. Obtain approval before public creation/push/submission/posting. An owner-approved initial community release can document remaining coverage; do not quietly present it as fully certified.

## After publication is authorized

1. Create the public repository with explicit settings and publish the reviewed source; read back its owner/name, visibility, default branch and exact commit. Replace the prepared README status with the real publication state before the reviewed public push. Keep the installed local frozen origin unchanged unless a separate update is intended.
2. Enable owner-controlled GitHub private vulnerability reporting and verify the feature before advertising it. Do not invent an email/contact.
3. Run/read the hosted checks. Do not claim CI green until GitHub reports it on the exact source commit. Component CI does not render Omarchy or test a GPU.
4. Create the new `v0.1.1` tag/release and source archive for the reviewed commit. Read back tag target, release state, asset hashes/size and public URLs. Never repoint v0.1.0.
5. Submit through https://plugins.omarchy.org/publish.html. Actual issue-form choices: category **Desktop**; three allowed tags **Hyprland, Launcher, Quickshell**. The repository-public checklist item stays unchecked until its public URL has been verified. Submission is not maintainer approval.
6. Recheck r/omarchy's rules and posting account. Its observed self-promotion rule asks for **I Made a Thing** flair, useful context and moderate posting. Use the approved draft with a verified release URL and no claimed marketplace approval. Read back the exact post URL/title/body/community/flair after publishing. Do not repeat promotional posts or crosspost indiscriminately.

## Local candidate checks

```bash
omarchy plugin validate .
bash test.sh
python3 scripts/check-package.py
# A source archive after the final reviewed commit:
git archive --format=tar --prefix=omarchy-native-overview-0.1.1/ HEAD | gzip -n > omarchy-native-overview-0.1.1.tar.gz
sha256sum omarchy-native-overview-0.1.1.tar.gz
```

Use a separate ignored output directory for assets. Do not archive `.git`, configuration backups, benchmark fixtures, raw process traces or private installation receipts. Keep full corresponding source and GPL notices with any distributed source archive.

## Sources checked

- https://plugins.omarchy.org/publish.html
- https://plugins.omarchy.org/develop.html
- https://github.com/omacom/omarchy-plugin-marketplace/blob/6e577c5a3b38a7e4bc01817814f0f28b4e5d33f0/.github/ISSUE_TEMPLATE/submit-plugin.yml
- https://www.reddit.com/r/omarchy/ (live public sidebar rules)

These requirements were read on 2026-10-31. Recheck at submission. A preview image is optional; do not substitute an invented screenshot or an unlabeled synthetic fixture for a real-app demo.
