# DRRMO EAMS

Personnel Event Assignment and Monitoring System for the ZPPSU Disaster Risk Reduction and Management Office.

The DRRMO plans events, assigns Marshals and Volunteers, emails them, collects 2-hourly site reports, and sees approximate positions of on-duty people on a campus map. Built with Laravel 13, React 19, MySQL 8.

> Status: planning stage. No features are built yet, and feature work waits for the plan to be approved. Start with [docs/PROJECT_PLAN.md](docs/PROJECT_PLAN.md).

## Documents

| Document | What it covers |
|---|---|
| [PROJECT_PLAN.md](docs/PROJECT_PLAN.md) | Goals, scope, assumptions, risks, roadmap |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Diagrams, auth, jobs, GPS and report flows, map licence |
| [USER_FLOWS.md](docs/USER_FLOWS.md) | The ten day-in-the-life flows |
| [SCREENS.md](docs/SCREENS.md) | Every screen, desktop and mobile |
| [MODULES.md](docs/MODULES.md) | Module boundaries, endpoints, ownership |
| [DATABASE.md](docs/DATABASE.md) | Tables, gaps, migrations, indexes, seeders |
| [SECURITY_AND_PRIVACY.md](docs/SECURITY_AND_PRIVACY.md) | Permission matrix, Data Privacy Act checklist |
| [BACKLOG.md](docs/BACKLOG.md) | Epics and stories by milestone |
| [DEPLOYMENT.md](docs/DEPLOYMENT.md) | Server setup, deploy, backup, rollback |
| [DOCUMENTATION_GUIDE.md](docs/DOCUMENTATION_GUIDE.md) | Code docs and the capstone paper (chapters, dev log, figures) |
| [WORKFLOWS.md](docs/WORKFLOWS.md) | Checklists: new module, table, endpoint, permission, job, screen |
| [WORKING_WITH_CLAUDE_CODE.md](docs/WORKING_WITH_CLAUDE_CODE.md) | One session per module |
| [PLANNING_SUMMARY.md](docs/PLANNING_SUMMARY.md) | One-page summary and current status |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Branches, commits, Definition of Done |

## Local setup on Windows (default: Laravel Sail)

Why Sail and not XAMPP: Laravel 13 needs PHP 8.3 or newer, and the latest XAMPP release still ships PHP 8.2. Sail runs the exact PHP and MySQL versions we use on the server, inside Docker.

One-time install:

1. Install WSL2. Open PowerShell as administrator and run `wsl --install`. Restart when asked. This installs Ubuntu.
2. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/). In Settings, Resources, WSL integration, turn on Ubuntu.
3. Open the Ubuntu app and install Git: `sudo apt update && sudo apt install -y git`.

Get the project and run it:

```
cd ~
git clone https://github.com/OWNER/drrmo-eams.git
cd drrmo-eams
bash scripts/setup.sh
```

Keep the project inside the Ubuntu home folder (`~/`), not under `/mnt/c/`. It is much faster.

Open http://localhost for the app and http://localhost:8025 for Mailpit, which catches every email the app sends locally.

Everyday commands:

```
./vendor/bin/sail up -d          # start
./vendor/bin/sail npm run dev    # hot reload while coding
./vendor/bin/sail composer check # Pint, Larastan, Pest
./vendor/bin/sail npm run check  # ESLint, Prettier, TypeScript, Vitest
./vendor/bin/sail down           # stop
```

Tip: add `alias sail='./vendor/bin/sail'` to `~/.bashrc`.

Testing on your phone needs HTTPS for GPS. Use the staging server, or a tunnel such as `./vendor/bin/sail share`.

## Run without Docker (Herd plus XAMPP MariaDB)

Use this if Docker uses too much memory on your PC. It runs PHP and the database straight on Windows.

One-time install:

1. Install [Laravel Herd](https://herd.laravel.com/windows). It gives you PHP 8.3 or newer and Composer.
2. Install XAMPP. We only use its MySQL (MariaDB). Do not use XAMPP's PHP, it is too old.
3. In the XAMPP Control Panel, start MySQL. Create a database named `drrmo_eams` (utf8mb4, utf8mb4_unicode_ci). Create a second one named `testing` for the PHP tests.
4. Copy `.env.example` to `.env` and change these lines:

```
APP_URL=http://127.0.0.1:8000
DB_HOST=127.0.0.1
DB_USERNAME=root
DB_PASSWORD=
MAIL_MAILER=log
SANCTUM_STATEFUL_DOMAINS=localhost,localhost:8000,localhost:5173,127.0.0.1,127.0.0.1:8000
```

5. In the project folder run:

```
composer install
npm install
php artisan key:generate
php artisan migrate --seed
php artisan db:seed --class=DemoSeeder
```

XAMPP puts its old PHP on the system PATH. Check with `php -v`. If it shows 8.2, put Herd's folder (`C:\Users\<you>\.config\herd\bin`) first on the PATH, or only for VS Code with `terminal.integrated.env.windows` in `.vscode/settings.json`.

Every day:

1. Start MySQL in the XAMPP Control Panel.
2. In one terminal run `php artisan serve`.
3. In a second terminal run `npm run dev`. Skip this if you are not changing React code.
4. Open http://127.0.0.1:8000. Emails are written to `storage/logs/laravel.log`.

To stop, press Ctrl+C in both terminals and stop MySQL in XAMPP.

Run checks with `composer check` and `npm run check`. Note: XAMPP ships MariaDB 10.4, not MySQL 8. The server and CI use MySQL 8, so CI still catches database differences.

## Stack

| Part | Choice |
|---|---|
| Backend | Laravel 13 (PHP 8.3+), Sanctum SPA cookie auth, Gates and Policies, database queue and scheduler |
| Frontend | React 19, React Router 7, TanStack Query 5, Tailwind CSS 4, Vite 8, TypeScript |
| Map | Leaflet 1.9 with Esri World Imagery and OpenStreetMap |
| Database | MySQL 8 |
| Mail | Queued SMTP (Brevo free tier in production, Mailpit locally) |
| Quality | Pint, Larastan, Pest 4, ESLint, Prettier, Vitest, GitHub Actions |
