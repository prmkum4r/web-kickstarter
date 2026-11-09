# Claude kickstarter — maintainer notes

This repo is a **template**, not an app. `init.mjs` turns a clone into a project by assembling `base/` + `stacks/<next|vite>/`. Read `README.md` § "Maintaining the kickstarter" for the layout.

## Rules

- **Structure parity is the product.** The generated `src/` tree must be identical on both stacks. Overlays may only add or replace files in `src/app/`, `src/platform/`, `docs/platform.md` and root config files. Shared code goes in `base/`. `scripts/verify-stacks.mjs` enforces this.
- **Stack-only files** (exist in one overlay only) must be listed in `STACK_ONLY_FILES` in `scripts/lib/assemble.mjs`. Anything else an overlay adds must exist in both overlays.
- **Placeholders only in `*.tmpl` files.** A real `CLAUDE.md` inside `base/` would load as a nested CLAUDE.md in this repo's own sessions. Available: `PROJECT_NAME` (npm slug), `PROJECT_TITLE`, `PROJECT_DESCRIPTION`, `STACK`, `STACK_SECTION` (from `stacks/<stack>/CLAUDE.stack.md`).
- **Script names are identical across stacks.** Change commands in `package.partial.json`, never add a script to one stack only.
- **Dependencies:** pin the same major of every shared dependency in `base/package.json`; stack-only ones go in the partial. After any change, run `npm run refresh-locks`. It rewrites `stacks/*/package-lock.json`.
  - ESLint stays on 9: `eslint-config-next`'s react, import and jsx-a11y plugins don't support 10 yet. npm prints a deprecation warning for 9; that's expected. Move both stacks to 10 together once Next's config supports it.
  - TypeScript stays on 6.0: `typescript-eslint` supports `<6.1`.
- **Docs, rules and skills inside `base/` describe the generated project**, so write them for that reader (paths like `src/features/…`, not `base/src/…`). When you change code in `base/` or an overlay, update the matching doc in `base/docs/` or `stacks/*/docs/platform.md` in the same change. The `.claude/rules` in `base/` map the code to those docs.
- **Rule globs must not overlap** and must cover all of `base/src/` plus each overlay's `src/`. The docs-check hook reports uncovered `src/` files as missing a module.
- **The docs-check hook must never break a session.** In hook modes it exits 0 on any internal error. Keep it zero-dependency. Extend `base/.claude/hooks/docs-check.test.mjs` with every behaviour change.

## Verify before reporting done

```bash
npm run verify          # both stacks: npm ci → npm run check → hook tests, plus parity checks
npm run verify:e2e      # + Playwright merge suite (needs `npx playwright install chromium`)
```

For changes to `init.mjs`, also copy the repo to a temp dir and run `node init.mjs --stack <s> --name demo -y --no-browsers` there. Never run init in this checkout: it deletes the template.

Never commit or push unless asked.
