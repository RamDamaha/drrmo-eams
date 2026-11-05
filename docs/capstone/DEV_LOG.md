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
