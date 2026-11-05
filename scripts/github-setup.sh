#!/usr/bin/env bash
# Creates labels and milestones on the GitHub repo. Safe to run more than once.
# Needs the GitHub CLI logged in: gh auth login
# Usage: scripts/github-setup.sh OWNER/REPO
set -euo pipefail

REPO="${1:?Usage: scripts/github-setup.sh OWNER/REPO}"

label() { gh label create "$1" --repo "$REPO" --color "$2" --description "$3" --force; }

label core          "6b7280" "Core: shell, layouts, auth, shared files"
label personnel     "1d4ed8" "Personnel module"
label access        "7c3aed" "Access (RBAC) module"
label events        "047857" "Events and Assignments module"
label notifications "b45309" "Notifications module"
label monitoring    "b91c1c" "Monitoring: GPS and site reports"
label information   "0e7490" "Information: memos and messages"
label records       "374151" "Records: audit and consent"
label desktop       "c7d2fe" "Desktop-first screen"
label mobile        "fecaca" "Mobile-first screen"
label bug           "d73a4a" "Something is broken"
label privacy       "000000" "Touches personal data or the Data Privacy Act"
label story         "e5e7eb" "User story from the backlog"

milestone() {
  if ! gh api "repos/$REPO/milestones?state=all" --jq '.[].title' | grep -qx "$1"; then
    gh api "repos/$REPO/milestones" -f title="$1" -f description="$2" >/dev/null
    echo "Created milestone: $1"
  fi
}

milestone "M0 Foundations"                     "Repo, CI, layouts, login, seeders"
milestone "M1 Walking skeleton"                "Login, create event, assign, see it on mobile"
milestone "M2 Personnel and Access"            "People, contacts, volunteer toggle, consent, grants"
milestone "M3 Assignments and Notifications"   "Conflict checks, acknowledge, emails, reminders"
milestone "M4 Monitoring"                      "Duty, pings, map, site reports"
milestone "M5 Information"                     "Memos and messages"
milestone "M6 Records and launch"              "Audit viewer, retention, PWA, deployment, field test"

echo "Done. Labels and milestones are ready."
