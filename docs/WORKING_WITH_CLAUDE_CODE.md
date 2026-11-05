# Working with Claude Code

The modules are designed so several Claude Code sessions (or people) can work at the same time without stepping on each other. The rule of thumb: **one session, one module, one branch.**

## 1. Before any parallel work

1. The walking skeleton (M1) is merged into `main`. Parallel work starts after that.
2. The Records contracts (`AuditLogger`, `ConsentChecker`) and the Access contract (`PermissionChecker`) exist on `main`, even if only as simple implementations.
3. Any new contract between two modules is merged first, in a small PR that only adds the interface and a fake for tests.

## 2. Start a session for a module

Use a git worktree so each session has its own folder and branch:

```
git fetch origin
git worktree add ../drrmo-monitoring -b feat/monitoring-ping-engine origin/main
cd ../drrmo-monitoring
claude
```

Give the session this first message (change the module and story):

```
Read CLAUDE.md, docs/MODULES.md (the Monitoring section and the rules at the top),
docs/DATABASE.md and docs/SECURITY_AND_PRIVACY.md.
Then implement story S4.2 from docs/BACKLOG.md.
Only change files in app/Modules/Monitoring, resources/js/features/monitoring,
tests/*/Monitoring and Monitoring migrations (prefix 2026_01_01_4000xx).
If you need a change outside these, stop and tell me.
Run composer check and npm run check before you finish.
```

When the PR is merged, remove the worktree:

```
git worktree remove ../drrmo-monitoring
```

## 3. What each session reads first

| Session for | Read |
|---|---|
| Any module | CLAUDE.md, MODULES.md rules plus that module's section, the stories in BACKLOG.md |
| Personnel, Access, Records | SECURITY_AND_PRIVACY.md |
| Events | USER_FLOWS.md flows 1, 2, 8, 9 |
| Monitoring | ARCHITECTURE.md sections 5 and 6, USER_FLOWS.md flows 3, 4, 5, 7 |
| Notifications | ARCHITECTURE.md section 4 |
| Core or UI | SCREENS.md |

## 4. Avoiding merge conflicts

| Shared thing | Owner | How others change it |
|---|---|---|
| `routes/api.php`, `bootstrap/app.php`, `bootstrap/providers.php` | Core | Each module has its own `routes.php` and service provider. Registering a provider is a one-line `core` PR. |
| `resources/js/app/router.tsx` | Core | Modules export `routes.tsx`. Core imports it in a one-line PR. |
| Layouts, UI kit, API client | Core | Ask for the component in a `core` issue, or build it inside your feature folder first and move it later. |
| Migrations | Each module, fixed prefix range | Use the next number in your module's range from DATABASE.md. Never edit a merged migration. Add a new one. |
| Seeders for roles and permissions | Access | New permission codes go through an Access PR, and the matrix in SECURITY_AND_PRIVACY.md is updated in the same PR. |
| `composer.json`, `package.json` | Core | Add a dependency in its own small PR so lock files do not conflict. |
| Docs | The module that changes the behaviour | Edit only your module's section. |

Other habits that help:

- Rebase on `main` daily: `git fetch origin && git rebase origin/main`.
- Keep PRs small, one story each.
- Agree endpoint shapes (request and response JSON) in the issue before two sessions build both sides.
- Do not run two sessions on the same module at once.

## 5. Things a session must never do

- Commit `.env`, keys, real personal data, or database dumps.
- Write to another module's tables.
- Skip or delete tests to make CI pass.
- Push to `main`.
