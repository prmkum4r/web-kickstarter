# Agent workflow — how work is done in this repo

Working agreements for every task. They are the difference between a change that gets accepted and one that gets sent back.

## 1. Read before writing

- **Read the real files first.** Before creating or editing anything, read 2–3 siblings that do something similar and mirror them. `ls` the folder rather than trusting memory: shared components, tokens and helpers grow.
- **Use the local skills** in `.claude/skills/` when the task matches (`create-component`, `edit-component`, `add-service`, `add-module`, `lint-audit`, `sync-docs`).
- **Code should look like the rest of the repo**, not like a fresh abstraction. If a pattern exists, use it; if it's missing something, extend it compatibly instead of bypassing it.

## 2. Ant Design first, hand-built UI last

- Before writing custom markup or state, check whether an AntD component already does it (`Layout`, `Menu`, `Tabs`, `Segmented`, `Card`, `Descriptions`, `Table`, `Dropdown`, `Tooltip`, `Result`, `Empty`, `Skeleton`).
- Size and colour AntD through **theme tokens** in `src/styles/theme.ts` before writing SCSS overrides. Use SCSS only for what tokens can't express; avoid `!important`.
- For a local re-theme, use a nested `ConfigProvider theme={…}` rather than fighting specificity.
- When a design and AntD differ, prefer AntD and **state the trade-off** in your summary.

## 3. Scope control

- Change what the task needs. Fix rule violations **on the lines you touched**; report violations elsewhere in the file instead of silently rewriting them. A bug fix that arrives as a 300-line refactor is hard to review and hard to revert.
- Mention every file touched outside the obvious scope, and why.

## 4. Respect the owner's work

- The working tree often contains the owner's uncommitted edits. A file that "changed on disk" changed deliberately. **Never revert it.** If it looks wrong, say so instead of undoing it.
- The docs-check hook ignores files that were already dirty when your session started, so the owner's edits never trigger it.

## 5. Git

- **Never commit, push or stage unless asked.**
- When asked to stage only some changes, snapshot `git status --porcelain` before editing and stage only what you changed.

## 6. Docs are part of the change

- Read the module's doc before changing it (it auto-loads when you touch the module's files).
- Update the doc **in the same change**. When you stop, the docs-check hook lists docs that may be stale: update them, or reply `No doc impact: <reason>` if the change genuinely doesn't affect them (pure refactor, test-only, typo).
- A new area of `src/` without a rule is reported by the hook. Run the **add-module** skill, or widen the right rule's `paths:`.

## 7. Verification (before reporting done)

1. `npm run check`: lint → typecheck → unit tests → build. This is the one gate every skill uses.
2. For UI changes, look at it: run the `dev` launch config (port 3000) and check the screen at **375px** and desktop width. Measure with `getComputedStyle` / `getBoundingClientRect` rather than eyeballing scaled screenshots.
3. If you changed anything in [testing-contract.md](testing-contract.md), update the specs in the same change and run `npm run test:e2e:merge`.
4. Never run `@deploy` e2e specs on your own: they may create real data in shared environments.

## 8. Reporting

- Say what was verified and how (which commands, which screens), and **what was not verified**.
- Call out visual changes to shared components: they ripple app-wide.
- List deviations from the request or design, and anything you skipped.
