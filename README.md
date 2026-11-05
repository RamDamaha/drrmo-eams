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
| [WORKING_WITH_CLAUDE_CODE.md](docs/WORKING_WITH_CLAUDE_CODE.md) | One session per module |
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

## Stack

| Part | Choice |
|---|---|
| Backend | Laravel 13 (PHP 8.3+), Sanctum SPA cookie auth, Gates and Policies, database queue and scheduler |
| Frontend | React 19, React Router 7, TanStack Query 5, Tailwind CSS 4, Vite 8, TypeScript |
| Map | Leaflet 1.9 with Esri World Imagery and OpenStreetMap |
| Database | MySQL 8 |
| Mail | Queued SMTP (Brevo free tier in production, Mailpit locally) |
| Quality | Pint, Larastan, Pest 4, ESLint, Prettier, Vitest, GitHub Actions |
