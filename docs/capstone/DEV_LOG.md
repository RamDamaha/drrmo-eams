# Development Log

One entry per merged story. Format in ../DOCUMENTATION_GUIDE.md section 4.

## 2026-11-05 · Planning and scaffold (core)
- What was built: planning documents, Laravel 13 and React 19 scaffold, CI, workflow docs
- Decision and why: one Laravel app serving one React SPA with two layouts, because the user base is about 60 people and a single server is enough
- Decision and why: Laravel Sail for local development, because XAMPP still ships PHP 8.2 and Laravel 13 needs 8.3
- Evidence: docs/PROJECT_PLAN.md, docs/ARCHITECTURE.md, first CI run on main
- Paper: Chapter 3 (development model, tools and technologies)

## 2026-11-05 · S1.1 Log in and log out, API side (core)
- What was built: `POST /api/login`, `POST /api/logout` and `GET /api/me` with Sanctum cookie sessions
- Decision and why: a disabled account gets the same answer as a wrong password, so the login form does not reveal which emails exist
- Decision and why: the 5 attempts per minute limit counts failures per email and IP, and clears after a good login. The over-limit event is written to the audit log because the security rules list it
- Problem met and fix: a logout test still saw the user because the test app reuses one guard object. The test now resets guards between requests, which a real server does on its own
- Evidence: tests/Feature/Core/AuthTest.php
- Paper: Chapter 3 (authentication), Chapter 4 (security test results)
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

## 2026-11-05 · S1.1 Log in and log out, screen side (core)
- What was built: phone-friendly login page, a `useMe` hook, route guards that keep signed-out visitors on /login and send admins to /admin and everyone else to /me
- Decision and why: the area guard compares the `home` value from /api/me instead of repeating role rules in React, so the server stays the single place that decides who goes where
- Decision and why: tests use plain Testing Library events because adding a user-event package is a separate Core change
- Evidence: resources/js/pages/Login.test.tsx
- Paper: Chapter 4 (login screen, add screenshot at 375 px width)
