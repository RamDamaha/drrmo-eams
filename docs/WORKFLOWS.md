# Workflows

Step-by-step checklists for the things we do often. Use them as is. If a step does not apply, skip it and say why in the PR.

Related: [DOCUMENTATION_GUIDE.md](DOCUMENTATION_GUIDE.md) (code docs and the capstone paper), [CONTRIBUTING.md](../CONTRIBUTING.md) (branches, commits, Definition of Done), [WORKING_WITH_CLAUDE_CODE.md](WORKING_WITH_CLAUDE_CODE.md) (parallel sessions), [MODULES.md](MODULES.md) (who owns what).

---

## 1. Start a story

1. Pick the next story from [BACKLOG.md](BACKLOG.md) (or its GitHub issue) in the current milestone.
2. Check its module section in MODULES.md. Note the tables, endpoints and contracts it touches.
3. Update `main` and branch: `git fetch origin && git checkout -b feat/<short-name> origin/main`.
4. If the story needs another module's contract that does not exist yet, stop and do section 7 first.

## 2. Finish a story

1. `composer check`, `npm run check`, `npm run build` all pass.
2. Walk through the Definition of Done in CONTRIBUTING.md.
3. Update the docs listed in the story's checklist below (endpoint, table, permission, screen).
4. Add a DEV_LOG entry and any screenshots, following [DOCUMENTATION_GUIDE.md](DOCUMENTATION_GUIDE.md) section 4.
5. Open a PR using the template. Title in Conventional Commits form, for example `feat(events): block assigning inactive volunteers`. Add the module label, device label and milestone.
6. Squash merge after CI is green. Close the issue.

---

## 3. Create a new module

Do this only when the work does not fit any of the seven modules. Most new features belong in an existing one. A new module is a `core` change, so it goes in its own PR before any feature code.

**Decide**
- [ ] Write one paragraph: what the module does, which stage of the process flow it serves, and why no existing module fits.
- [ ] List the tables it will own. A table moves from another module only with that module owner's agreement, written in the PR.
- [ ] List what it depends on and what depends on it. No cycles.

**Docs (same PR)**
- [ ] MODULES.md: add a section in the same shape as the others (Owns, Endpoints, Policies, Contracts offered, Events fired, Frontend, Must not touch). Add a row to the summary table, fix the table count, and update the build order diagram.
- [ ] DATABASE.md: reserve the next free migration prefix range (for example `2026_01_01_8000xx`) in the migration order table, and add the tables to the diagram.
- [ ] SECURITY_AND_PRIVACY.md: add any new permission codes to the matrix.
- [ ] BACKLOG.md: add an epic and its stories.

**Code skeleton (same PR)**
- [ ] `app/Modules/<Name>/` with the standard folders (see MODULES.md) and a README.
- [ ] `app/Modules/<Name>/<Name>ServiceProvider.php` that loads `routes.php` under the `api` prefix with `auth:sanctum` middleware, and registers policies.
- [ ] Register the provider in `bootstrap/providers.php`.
- [ ] Empty `routes.php`.
- [ ] `resources/js/features/<name>/` with a README and an empty `routes.tsx`. Import it in `resources/js/app/router.tsx`.
- [ ] `tests/Feature/<Name>/` and `tests/Unit/<Name>/` folders.

**GitHub**
- [ ] Add the module label to `scripts/github-setup.sh` and run it: `scripts/github-setup.sh yoyodevc/drrmo-eams`.
- [ ] Add the module to the dropdown in `.github/ISSUE_TEMPLATE/story.yml` and the module list in `.gitmessage`, CONTRIBUTING.md and the PR template.

---

## 4. Add a table

- [ ] Confirm which module owns it. Only the owner creates it.
- [ ] Migration file uses the next number in the module's prefix range. Never edit a merged migration. Write a new one.
- [ ] Foreign keys follow the rules in DATABASE.md section 3 (restrict, cascade, nullOnDelete).
- [ ] Indexes for every column used in a `where`, `order by` or join on a list screen.
- [ ] Model in `app/Modules/<Module>/Models`, with casts and a factory using fake data only.
- [ ] If it holds personal data: add a retention rule to SECURITY_AND_PRIVACY.md and to the prune job, and include it in the personal data export.
- [ ] Update DATABASE.md (diagram, indexes) and the module's Owns line in MODULES.md.

## 5. Add an API endpoint

- [ ] Route in the module's `routes.php`, never in `routes/api.php`.
- [ ] Form Request for input validation.
- [ ] Policy method or gate check. Write a test for the allowed case and the forbidden case (wrong role, wrong owner, expired grant).
- [ ] List endpoints are paginated and scoped to the user's own rows unless a permission allows more.
- [ ] API Resource for the response. Never return a model directly, so hidden fields stay hidden.
- [ ] If it is a sensitive action (SECURITY_AND_PRIVACY.md section 4), call `AuditLogger` and test that the row is written.
- [ ] Rate limit if it can be hammered (pings, reports, login).
- [ ] Add it to the module's Endpoints list in MODULES.md.

## 6. Add a permission

- [ ] Access module PR only. Add the code to `PermissionSeeder` and the role mapping.
- [ ] Update the matrix in SECURITY_AND_PRIVACY.md in the same PR. The matrix test fails if the two differ.
- [ ] Say whether it is grantable, and any limits (event required, max length).

## 7. Add or change a contract between modules

- [ ] The owning module opens a small PR with only the interface in `Contracts/`, a working or fake implementation bound in its service provider, and a short PHPDoc on each method.
- [ ] The consuming module's owner reviews it.
- [ ] Merge before either side builds against it.
- [ ] A breaking change to a contract needs `BREAKING CHANGE:` in the commit footer and an update to every caller in the same PR.

## 8. Add a scheduled job or queued job

- [ ] Command in `app/Modules/<Module>/Console`, scheduled from the module's service provider.
- [ ] Idempotent. Running it twice must not send two emails or create two rows. Use a unique index or a "not yet done" check.
- [ ] Queued jobs set `tries` and `backoff`. Failures land in `failed_jobs` and show in the notification log where relevant.
- [ ] Add a row to the jobs table in ARCHITECTURE.md section 4.
- [ ] Test it with a frozen clock (`$this->travelTo(...)`).

## 9. Add a screen

- [ ] Check SCREENS.md for its layout and device priority. Add it there if it is new.
- [ ] Follow DESIGN_SYSTEM.md: tokens, shared components from `resources/js/shared/ui`, and the checklist in its section 12.
- [ ] Page in `resources/js/features/<module>/pages/admin` or `pages/mobile`.
- [ ] Data through a hook in `hooks/` that calls `api.ts`. No `fetch` inside components.
- [ ] Loading, empty, error and offline states (SCREENS.md bottom section).
- [ ] Mobile screens: check at 360 px width, no sideways scroll, tap targets at least 48 px.
- [ ] Route added to the module's `routes.tsx`.
- [ ] Screenshot in the PR at the right width.

## 10. Release to the server

- [ ] `main` is green.
- [ ] Back up the database (`scripts/backup-db.sh`).
- [ ] Deploy and run the smoke test in DEPLOYMENT.md.
- [ ] If something is wrong: `scripts/rollback.sh`, then restore the backup if a migration caused it.

## 11. Close a milestone

- [ ] All stories merged and their issues closed.
- [ ] Milestone documentation checklist done (DOCUMENTATION_GUIDE.md section 7).
- [ ] Demo works on a real phone over HTTPS.
