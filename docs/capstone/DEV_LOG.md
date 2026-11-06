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

## 2026-11-05 · Demo users for local testing (personnel)
- What was built: DemoSeeder with four fake people (admin, marshal, volunteer, coordinator), all with the password "password"
- Decision and why: the seeder refuses to run in production, so test accounts with a known password can never reach a real server
- Evidence: tests/Feature/Personnel/DemoSeederTest.php

## 2026-11-05 · Fixes found during the owner's local check of S1.1 (core)
- What was built: a Sign out button in both layouts, a setup script that handles a root Ubuntu user and fails loudly, and a refreshed composer.lock hash
- Problem met and fix: on the owner's Windows PC Ubuntu defaults to root, so the Sail container could not write project files and setup.sh stopped without a clear message. The script now gives the group write access when it runs as root and prints a clear message if any step fails
- Problem met and fix: composer validate said the lock file was out of date. Only the content hash had drifted, so it was refreshed with no package changes
- Evidence: Login.test.tsx (sign out test), composer validate output
- Paper: Chapter 4 (testing on a real machine), Chapter 5 (limitations: setup differs per PC)

## 2026-11-06 · Sign out after an ended session, and a setup without Docker (core)
- What was built: Sign out now works when the session has already ended, and the README has a way to run the project without Docker
- Problem met and fix: when the session had expired, /api/logout returned 401 and the Sign out button did nothing. Now 401 and 419 count as already signed out, so the user goes to /login
- Decision and why: any other failure, such as a server error, shows "Could not sign out. Try again." and keeps the user signed in. Otherwise the screen would say signed out while the real session stays open on a shared phone
- Problem met and fix: Docker used about 2.8 GB of memory on the owner's 16 GB PC. Herd (PHP 8.5) and the MariaDB from XAMPP use about 0.5 GB for the same work
- Decision and why: MariaDB 10.4 is not MySQL 8, so the Docker setup and CI stay on MySQL 8 and still catch database differences. All migrations, seeders and 34 Pest tests passed on MariaDB 10.4 and PHP 8.5
- Evidence: Login.test.tsx (401 and 500 sign out tests), README section "Run without Docker"
- Paper: Chapter 4 (testing on a real machine), Chapter 5 (limitations: local database differs from the server)

## 2026-11-06 · Design system and the landing and login screen (core)
- What was built: DESIGN_SYSTEM.md with a ready to paste UI prompt, color and shape tokens in app.css, shared Button, TextField, PasswordField, Alert, Spinner and BrandLogos components, the ZPPSU and DRRMO logos as web assets and favicon, and a redesigned login screen
- Decision and why: maroon and gold come from the ZPPSU seal and are the base, while the DRRMO orange is kept for live or urgent states only, so the app feels official and urgent things still stand out
- Decision and why: the owner compared a fully flat version with the first draft and kept the first. The final version keeps its layout but drops the dot pattern, strong glows and the badge, so it looks finished without looking busy
- Decision and why: Public Sans is self hosted instead of loaded from Google Fonts, so the screen works on a weak campus connection and no visitor data goes to a third party
- Decision and why: there is no self service password reset yet, so the login screen tells people to ask the DRRMO office instead of showing a link that does nothing
- Evidence: resources/js/shared/ui/ui.test.tsx, Login.test.tsx, figures/m-login.png, figures/m-login-desktop.png
- Paper: Chapter 3 (user interface design), Chapter 4 (login screen)

## 2026-11-06 · Forgot and reset password (core)
- What was built: POST /api/forgot-password and POST /api/reset-password on Laravel's password broker, a Forgot password screen, a Reset password screen opened from the emailed link, and a shared AuthLayout so every signed-out screen uses the same brand frame
- Decision and why: forgot password gives the same answer whether or not the email has an account, so nobody can use it to find out who has an account
- Decision and why: a disabled account never gets a link and cannot use an old one, the same as at login
- Decision and why: links last 60 minutes and work once. After a reset every session of the account is deleted, so a lost phone that was still signed in is signed out
- Decision and why: new passwords need at least 12 characters. Length helps more than symbol rules, and a short sentence is easy to remember on a phone
- Decision and why: both requests are rate limited per IP (3 and 10 per 10 minutes) and write audit rows (auth.password_reset_requested, auth.password_reset_completed)
- Evidence: tests/Feature/Core/PasswordResetTest.php, resources/js/pages/PasswordReset.test.tsx
- Paper: Chapter 3 (account security), Chapter 4 (forgot and reset password screens)

## 2026-11-06 · JWT auth in HttpOnly cookies (core, access)
- What was built: a JWT guard (`auth:api`) with a 15 minute access token and a 7 day rotating refresh token, POST /api/refresh, logout that revokes, a `refresh_tokens` table, a CSRF origin check, a `jwt:secret` command, and a client that refreshes once on a 401 and retries
- Decision and why: the owner asked for JWT instead of the planned Sanctum sessions. The tokens are kept in HttpOnly, SameSite=Lax cookies, never in localStorage, so a script injected into a page cannot steal them
- Decision and why: the access token is short (15 minutes) because a JWT cannot be called back once issued. Logout and password reset still cut it off through a denylist in the cache
- Decision and why: refresh tokens are stored only as hashes and rotate on every use. Using an old one again means it was copied, so the whole sign in is revoked and audited. A 30 second grace lets two open tabs refresh at the same moment
- Decision and why: cookie auth needs CSRF protection, so every state changing call must carry `X-Requested-With` and come from an allowed origin
- Decision and why: Sanctum was removed because nothing else used it. Policies, gates and the permission matrix did not change
- Evidence: tests/Feature/Core/JwtAuthTest.php (cookies, refresh, reuse, logout, forged and alg none tokens, disabled accounts, origin check), resources/js/shared/api/client.test.ts
- Paper: Chapter 3 (authentication design and its trade offs), Chapter 4 (security tests)
