# Planning Summary

One page to get up to speed. Details live in the linked documents.

## Status (5 Nov 2026)

- Planning documents written and pushed. **Feature work is on hold until the owner approves the plan.**
- Repo scaffold is on `main`: Laravel 13.40 (PHP 8.3), Sanctum, React 19 shell with AdminLayout and MobileLayout, Pest 4, Larastan, Pint, ESLint, Prettier, Vitest, Sail (PHP 8.3, MySQL 8.4, Mailpit).
- CI (GitHub Actions) passes on `main`. Labels and milestones M0 to M6 exist on GitHub.
- Backlog issues are **not** created yet. They are created from BACKLOG.md after approval.
- Branch protection and squash-only merge must be set by the owner in GitHub settings (the session cannot change repo settings).

## What the system does

A campus tool for about 30 to 60 people. The DRRMO creates events, sets duty requirements, assigns Marshals and Volunteers, and the system emails them. People see duties on their phones, acknowledge, and start duty, which shares approximate GPS every 30 seconds while the page is open. Designated reporters send a site report every 2 hours. The admin sees pins on a satellite map and a report feed. There is also a memo library, simple messages with DRRMO, an audit log and consent records under the Data Privacy Act.

## Owner's answers

| Topic | Answer |
|---|---|
| Guards, Staff, OJT, QR attendance | Dropped |
| Coordinators | No field assignments |
| Map access | Admin only, with the option to grant it to someone for a limited time |
| SMS | Email only (no truly free SMS API found) |
| Hosting | Free: Oracle Always Free VM, school server as plan B |
| Ping retention | 10 working days |
| Data protection officer | None today (flagged, see below) |

## Open decisions for the owner

1. Name a DPO. The NPC requires one for government agencies. Suggestion: the university DPO, with the DRRMO head as Compliance Officer for Privacy.
2. Oracle idle reclaim: upgrade to Pay As You Go (card needed, Always Free stays free), or use the school server.
3. ArcGIS Location Platform free account for the satellite layer, or OpenStreetMap only.
4. Confirm assumptions A1 to A9 in PROJECT_PLAN.md section 4 (Admin and Director share one role, statuses, reminder times, report timing).
5. Approve the 14 data model fixes in DATABASE.md section 1.
6. Confirm retention for photos (1 year), audit log (3 years), notification log (6 months).
7. Approve BACKLOG.md so issues can be created.

## Module split

Core plus seven modules, each owning its tables (20 in total): Personnel (4), Access (4), Events (5), Notifications (1), Monitoring (2), Information (2), Records (2). See MODULES.md.

## Next three tasks after approval

1. S0.3: Access and Personnel migrations, role and permission seeders, matrix test.
2. S1.1: Login, logout and `/api/me` with Sanctum cookie auth, plus consent middleware stub (S0.4 contracts).
3. S1.2 to S1.5: walking skeleton. Create event, add requirement, assign a person, the person sees it at phone width.

## Read first (new session)

1. CLAUDE.md
2. This file
3. docs/MODULES.md (rules at the top, then your module)
4. docs/WORKFLOWS.md (checklists)
5. CONTRIBUTING.md (Definition of Done)
6. The docs your module needs, listed in WORKING_WITH_CLAUDE_CODE.md section 3

## Environment notes for cloud sessions

- Composer downloads from `api.github.com` were blocked in the first session, so packages were installed with `--prefer-source`. The `phpstan/phpstan` package has no source, so it was placed in the Composer cache from a git clone. If `composer install` fails on phpstan, use the same trick or let CI run Larastan.
- Composer scripts need `COMPOSER_ALLOW_SUPERUSER=1` when running as root.
- No MySQL in the cloud container. Run tests locally with `DB_CONNECTION=sqlite DB_DATABASE=:memory: composer test`. CI uses real MySQL.
- Pest 5 needs PHP 8.4, so the project uses Pest 4 to match PHP 8.3 on the server.
- TypeScript is pinned to 6.0 because typescript-eslint does not support 7 yet.
- `npm audit` shows a moderate minimatch advisory inside the ESLint toolchain (dev only). Recheck when ESLint updates.
