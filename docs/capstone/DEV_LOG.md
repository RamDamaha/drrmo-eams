# Development Log

One entry per merged story. Format in ../DOCUMENTATION_GUIDE.md section 4.

## 2026-11-05 · Planning and scaffold (core)
- What was built: planning documents, Laravel 13 and React 19 scaffold, CI, workflow docs
- Decision and why: one Laravel app serving one React SPA with two layouts, because the user base is about 60 people and a single server is enough
- Decision and why: Laravel Sail for local development, because XAMPP still ships PHP 8.2 and Laravel 13 needs 8.3
- Evidence: docs/PROJECT_PLAN.md, docs/ARCHITECTURE.md, first CI run on main
- Paper: Chapter 3 (development model, tools and technologies)

## 2026-11-05 · S0.3 Roles and permissions seeded (access)
- What was built: roles, permissions and role_permission tables, a PermissionMatrix class, idempotent seeders, and a test that compares the seeded data with the table in SECURITY_AND_PRIVACY.md
- Decision and why: the matrix lives in one PHP class and the docs table is checked against it by a test, so the code and the written rules cannot drift apart
- Decision and why: Admin and Director share one admin role for now, as the owner asked. Splitting them later means one enum case and one matrix column
- Problem met and fix: the first version of the docs parser lost empty table cells and shifted columns. Fixed by splitting each row on the pipes and dropping only the outer two
- Evidence: tests/Feature/Access/PermissionMatrixTest.php, PR #50
- Paper: Chapter 3 (access control design), Chapter 4 (permission matrix table)

## 2026-11-05 · Personnel tables (personnel)
- What was built: users (replacing the Laravel default), departments, emergency contacts and volunteer status log tables, models and a fake-data factory
- Decision and why: on-call availability (`status`) is kept apart from account disabling (`disabled_at`), because an inactive volunteer can still log in and read memos
- Decision and why: the User model moved into the Personnel module so the module owns its data
- Evidence: tests/Feature/Personnel/UserModelTest.php, PR #51
- Paper: Chapter 3 (ERD), appendix data dictionary

## 2026-11-05 · S0.4 Audit and consent contracts (records)
- What was built: audit_logs and consent_records tables, AuditLogger and ConsentChecker interfaces with database implementations
- Decision and why: audit rows are insert only and the model throws on update or delete, because the Data Privacy Act asks for a trustworthy record of who viewed location data
- Decision and why: consent is a history of rows, and the latest row decides, so withdrawal does not erase the earlier consent
- Evidence: tests/Feature/Records, PR #52
- Paper: Chapter 3 (data privacy handling), Chapter 4 (security results)
