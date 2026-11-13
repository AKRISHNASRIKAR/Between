# What belongs in Git

Reviewed 31 October 2026 against the working tree. No commit, staging operation, or remote push was performed. Existing edits from earlier work were preserved.

## Commit together

- Application source, shared contracts and tests, including new untracked files imported by existing screens. Committing only tracked modifications would leave this checkout incomplete.
- SQL migrations **and** `apps/api/drizzle/meta/_journal.json`. The pending 0010–0012 migrations belong with their schema/service/contract changes; do not ignore or omit them.
- `package.json` files **and** `bun.lock` whenever dependencies change. No dependency was added for this quiz pass.
- App configuration, config plugins, source illustrations and bundled icons/fonts/sounds/widget assets. Generated native directories are different from these source assets.
- Maintained documentation and the architecture learning artifact. Local screenshot review output is not maintained documentation.
- Sanitized environment templates: `apps/api/.env.example`, new `.env.test.example`, and `deploy/.env.production.example`. Copy templates locally and supply real secrets outside Git.

## Keep local

- Actual `.env`, `.env.test`, `.env.production` and other environment-specific files; signing keys/certificates and credentials.
- `node_modules`, `.expo`, generated `ios`/`android`, `.gradle-home`, bundles, installable IPA/APK/AAB files, SQLite/media data and caches.
- `.design-system`, `.ui-review`, `.playwright-mcp`, test coverage/results/reports and log files. These hold local captures, recordings, research and command output.

`.gitignore` now explicitly covers local review output, logs and build/test artifacts, and allows named `.env.*.example` templates. Previously the production example was accidentally ignored. Rules are deliberately targeted: **no global PNG, SVG, JSON, SQL, Markdown or HTML ignore** that would hide real assets, migrations or documentation.

## Before committing this large working tree

Review `git diff` and `git ls-files --others --exclude-standard` together. The checkout includes earlier product/theme/backend changes, not only this quiz revamp. Group coherent changes with their dependencies rather than pushing an arbitrary selection of modified screens. Review example files to ensure placeholders, then run:

```sh
bun run lint
bun run typecheck
bun test apps/mobile/src packages/contracts/src
```

Run API integration tests only with a disposable database whose name/URL you have checked; `apps/api/test/helpers.ts` truncates tables. Bootstrap its local configuration from `.env.test.example`. Recheck the known pet pause/resume failure documented in `product-audit.md` before claiming the complete backend suite passes.

Useful checks:

```sh
git ls-files -ci --exclude-standard
git ls-files --others --exclude-standard
git check-ignore -v apps/api/.env .ui-review/example.png apps/mobile/ios/Podfile
git diff --check
```

An ignore rule does not remove an already tracked file. This review found no tracked files matching the effective ignore rules and no tracked credential/environment files except the intended sanitized `.env.example`. Do not use broad `git rm --cached` commands on the working tree. The new example templates should remain visible as untracked source until deliberately staged.
