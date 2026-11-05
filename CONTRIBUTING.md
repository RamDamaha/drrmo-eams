# Contributing

## Branches

- `main` is protected and always deployable. Nobody pushes to it directly.
- Work on short-lived branches named `type/short-name`, for example `feat/volunteer-toggle`, `fix/ping-rate-limit`, `docs/deployment`.
- Keep a branch to one story. Aim to merge within 2 or 3 days.
- Merge with **squash merge** only. The squash commit title follows Conventional Commits.
- Delete the branch after merge.

Branch protection on `main` (set in GitHub, Settings, Branches):

- Require a pull request before merging
- Require status checks: `PHP lint, analyse, test` and `JS lint, typecheck, test, build`
- Require branches to be up to date before merging
- Allow squash merge only (Settings, General, Pull Requests)

## Commits

We use [Conventional Commits](https://www.conventionalcommits.org/). Format:

```
type(module): short summary
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `ci`, `perf`, `style`.
Modules: `core`, `personnel`, `access`, `events`, `notifications`, `monitoring`, `information`, `records`.

Examples:

```
feat(events): block assigning inactive volunteers
fix(monitoring): keep queued pings when the upload times out
docs(core): add Oracle VM steps to DEPLOYMENT.md
```

Turn on the commit template once per clone:

```
git config commit.template .gitmessage
```

## Before you open a pull request

```
composer check     # Pint, Larastan, Pest
npm run check      # ESLint, Prettier, TypeScript, Vitest
npm run build
```

With Sail, prefix PHP commands: `./vendor/bin/sail composer check`.

## Definition of Done

A story is done when all of these are true:

1. Tests pass locally and in CI, and new behaviour has tests.
2. Every new endpoint is protected by a policy or gate, and there is a test for the forbidden case.
3. Sensitive actions write an audit log entry (list in docs/SECURITY_AND_PRIVACY.md section 4).
4. List queries only return the user's own rows unless a permission allows more.
5. No secrets, no real personal data, no `.env` file in the change.
6. Non-admin screens work at 360 px phone width without sideways scrolling.
7. The change stays inside its module, or shared files are changed in a separate `core` PR.
8. Docs are updated when behaviour, endpoints or tables change.
9. The PR template checklist is complete.

## Module ownership

Read docs/MODULES.md before you start. Only change your module's folders and tables. If you need something from another module, agree a contract first (a short PR that adds the interface to that module's `Contracts/` folder).

## Data rules

- Use made-up data in tests, seeders, screenshots and issues. Emails end in `@example.test`.
- Never paste real names, phone numbers or locations into issues or PRs.
