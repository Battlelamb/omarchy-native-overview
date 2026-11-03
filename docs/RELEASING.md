# Release checks

Public source, a local installation, a tagged release and marketplace approval are separate states.

1. Preserve full licenses, pinned donor attribution and accurate preview provenance. Review current files for private identities, paths, captures and logs before publication; exclude backups and test receipts.
2. Use one `runtime/<manifest-version>/` tree. Advance its URL for changed builds so a running shell cannot retain an older component under the same path.
3. Run `omarchy plugin validate .`, `bash test.sh`, `bash tests/native-io.test.sh`, `bash tests/native-overview.test.sh "$TMPDIR/native-overview-evidence"` and `python3 scripts/check-package.py` on the exact source. Keep failed and incomplete gates visible in [VALIDATION.md](VALIDATION.md).
4. Verify the exact public main revision and its hosted checks before publishing another change. Use reviewed fast-forward commits, a public Git identity and no force push; never retarget an existing tag.
5. For an installation under an older plugin ID, coordinate checkout, enabled-state, menu and shortcut references while preserving the stable preference store. A source update alone does not rename an installed plugin. Verify the running revision, actual panel and preserved settings after the change; retain a rollback copy and do not restart the shell to conceal a stale component.
6. Create tags/releases or submit to the marketplace only when that separate step is authorized. Read the current official forms at submission time, then verify the real tag, assets or marketplace commit before claiming success.

The historical whole-shell resource gate remains failed. Component tests, source publication and screenshots do not establish complete action, GPU or upgrade qualification.

[Repository](https://github.com/Battlelamb/omarchy-native-overview) · [Hosted checks](https://github.com/Battlelamb/omarchy-native-overview/actions/workflows/checks.yml) · [Security](../SECURITY.md)
