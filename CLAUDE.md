# CLAUDE.md

Project: ZPPSU DRRMO Personnel Event Assignment and Monitoring System. Laravel 13 + React 19 + MySQL 8, one repo, one server.

## Read first

- docs/MODULES.md: module boundaries and the rules at the top. Stay inside your module.
- docs/SECURITY_AND_PRIVACY.md: permission matrix and audit rules.
- docs/DATABASE.md: tables, migration prefixes, indexes.
- CONTRIBUTING.md: branches, Conventional Commits, Definition of Done.
- docs/WORKFLOWS.md: checklists for a new module, table, endpoint, permission, job or screen.
- docs/PLANNING_SUMMARY.md: current status and open decisions.

## Rules

- Every endpoint needs a policy or gate, and a test for the forbidden case.
- Sensitive actions call the Records `AuditLogger` contract.
- List queries are scoped to the user's own rows unless a permission allows more.
- Location data is admin only (or an active `location.view` grant). Viewing it is audited.
- Non-admin screens are mobile first (360 to 430 px). Admin screens are desktop first.
- Use made-up data only. Emails end in `@example.test`.
- Never commit `.env` or secrets. Never push to `main`.
- Write docs in plain, short sentences. No em dashes.

## Commands

- PHP: `composer check` (Pint, Larastan, Pest). Fix style with `composer format`.
- JS: `npm run check` (ESLint, Prettier, tsc, Vitest), `npm run build`.
- With Sail, prefix with `./vendor/bin/sail`.
