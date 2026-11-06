# Security and Privacy

This system handles names, phone numbers, emergency contacts and location. Under the Data Privacy Act of 2012 (RA 10173) location history of identifiable people is personal information, so it gets the strictest rules in the app.

## 1. Permission matrix

Permissions are seeded codes. Roles have fixed sets. Extra access only comes from a time-limited grant.

| Code | What it allows | Admin | Marshal | Volunteer | Coordinator | Grantable |
|---|---|---|---|---|---|---|
| `people.view` | List and view all people | ✓ | | | | |
| `people.manage` | Create, edit, import people | ✓ | | | | |
| `volunteers.toggle` | Set volunteer active or inactive | ✓ | | | | |
| `access.manage` | Create and revoke grants | ✓ | | | | |
| `events.view_all` | See every event | ✓ | | | | |
| `events.manage` | Create and edit events and requirements | ✓ | | | | |
| `assignments.manage` | Assign, change, cancel | ✓ | | | | |
| `events.view_department` | See event notices for own department or campus wide | ✓ | | | ✓ | |
| `assignments.own` | See and acknowledge own assignments, start and end own duty | | ✓ | ✓ (only while active) | | |
| `location.send_own` | Send own pings while on duty | | ✓ | ✓ | | |
| `location.view` | See the map and ping trails | ✓ | | | | ✓ (time limited) |
| `reports.submit` | Submit site reports for one event | ✓ | | | | ✓ (event scoped, required) |
| `reports.view` | Read the site report feed | ✓ | | | | ✓ |
| `memos.view` | Search and read memos | ✓ | ✓ | ✓ | ✓ | |
| `memos.manage` | Post, edit, delete memos | ✓ | | | | |
| `messages.use` | Send and read own messages | ✓ | ✓ | ✓ | ✓ | |
| `messages.office_inbox` | Read and answer the DRRMO inbox | ✓ | | | | |
| `notifications.view` | Read the notification log | ✓ | | | | |
| `audit.view` | Read the audit log | ✓ | | | | |
| `data.export` | Export lists (CSV) | ✓ | | | | |
| `profile.own` | Read own profile, edit own contact number and emergency contacts, export own data | ✓ | ✓ | ✓ | ✓ | |

Notes:

- An inactive volunteer can log in, read memos and messages, and see past assignments. They cannot be assigned and cannot start duty or send pings.
- `reports.submit` grants must have an `event_id`. A grant without one is rejected.
- Grants for `location.view` must end within 7 days. This covers the "have the option" answer: the admin can give, for example, the ERT lead map access for one event day.
- Admin has every permission through the role. There is no "super admin bypass" in code. The admin role simply has all codes, so the audit and policy paths are the same for everyone.

Scoping rule: every list query is filtered to the user's own rows unless the user has the matching `*.view_all` style permission. Policies check both the permission and ownership.

## 2. Data Privacy Act checklist

| Principle or right | How the system handles it | Status |
|---|---|---|
| Transparency, privacy notice | Notice shown on first login and whenever its version changes. States purpose, data collected, who sees it, retention, contact. | Planned (M2) |
| Consent | Two records: privacy notice (needed to use the app), location tracking (needed to start duty). Stored with notice version, time and IP. | Planned (M2, M4) |
| Legitimate purpose | Location is used only to coordinate safety and response during an assigned shift. Not for attendance discipline or performance rating. Written in the notice. | Policy text, needs DRRMO sign-off |
| Proportionality, collect only what is needed | No birthdays, addresses, IDs or photos of people. Pings only while on duty. No tracking outside shifts. | Planned |
| Retention | Pings: 10 working days. Site report photos: 1 year (assumption). Audit log: 3 years (assumption). Notifications log: 6 months (assumption). Inactive accounts: reviewed yearly. | Needs owner confirmation for non-ping items |
| Access control | Roles, policies, grants, scoped queries, admin-only location | Planned (M2) |
| Audit trail | See section 4 | Planned (M0 stub, M6 viewer) |
| Right to access | `GET /api/me/data-export` gives a person their own data as JSON | Planned (M6) |
| Right to correct | People edit their own contact number and emergency contacts. Other corrections through the admin. | Planned (M2) |
| Right to object or withdraw | A person can withdraw location consent. They then cannot start duty, and the admin is told so they can reassign. | Planned (M4) |
| Security measures | HTTPS only, hashed passwords (bcrypt), private file storage, encrypted backups, least privilege on the server | Planned (M6) |
| Breach response | See section 7 | Procedure written, needs a named responsible person |
| Data Protection Officer | None today. NPC Advisory 2017-01 says each government agency "shall designate a DPO" and allows a Compliance Officer for Privacy for a sub-unit under the DPO. | **Open decision for the owner** |

## 3. Consent flow

1. First login: the app shows the privacy notice (version, for example `2026-11-v1`). The person taps "I have read and agree". A CONSENT_RECORD row with purpose `privacy_notice` is written. Until then every API call except notice, consent and logout returns 403 with code `consent_required`.
2. First Start duty: a second, short screen explains location sharing (when it runs, who sees it, how long it is kept). Agreeing writes purpose `location_tracking`. Then the browser asks for location permission.
3. If the notice version changes, step 1 repeats on the next login.
4. Withdrawal: Profile has a "Stop location consent" button. It sets `withdrawn_at`. Start duty is then blocked with a clear message.

## 4. Audit rules

Write an AUDIT_LOG row for:

- Assignment created, changed, cancelled, status override, headcount override (with reason)
- Permission grant created or revoked
- Volunteer status change
- Person created, role changed, account disabled
- Any view of location data: map load, trail view (one row per request, not per pin)
- Any delete: memo, event, requirement, emergency contact
- Any export: CSV lists, personal data export
- Login failures above the throttle limit, password resets
- Consent given or withdrawn

Audit rows are insert only. The app has no update or delete route for them, and the scheduled prune keeps them for 3 years.

## 5. HTTPS, cookies and headers

- HTTPS everywhere with Let's Encrypt. HTTP redirects to HTTPS. HSTS once the domain is stable.
- `.env`: `SESSION_SECURE_COOKIE=true`, `SESSION_HTTP_ONLY=true`, `SESSION_SAME_SITE=lax`, `SESSION_DRIVER=database`, `SESSION_LIFETIME=480`, `SESSION_ENCRYPT=true`.
- `SANCTUM_STATEFUL_DOMAINS` set to the real domain only. `APP_DEBUG=false` in production.
- Headers from Nginx: `X-Content-Type-Options: nosniff`, `Referrer-Policy: same-origin`, `X-Frame-Options: DENY`, a Content Security Policy that allows only our origin plus the two tile hosts for images.
- `Permissions-Policy: geolocation=(self), camera=(self)`.

## 6. Rate limits and upload rules

| Endpoint | Limit |
|---|---|
| `POST /api/login` | 5 per minute per email and IP |
| `POST /api/forgot-password` | 3 per 10 minutes per IP, and one email per account per minute |
| `POST /api/reset-password` | 10 per 10 minutes per IP |
| `POST /api/me/assignments/{id}/pings` | 10 requests per minute per user, max 50 points per request |
| `POST /api/me/report-slots/{id}` | 6 per minute per user |
| Other API | 120 per minute per user |

Uploads:

| Upload | Allowed types | Max size | Storage |
|---|---|---|---|
| Memo file | PDF, DOCX, JPG, PNG | 10 MB | `storage/app/private/memos`, served only through `GET /api/memos/{id}/file` after a policy check |
| Site report photo | JPG, PNG, HEIC converted to JPG | 8 MB before upload. The phone resizes to 1600 px on the long side before sending. | `storage/app/private/reports`, served through the API |

Files get random names. Original names are kept only in the database. MIME type is checked from the file content, not the extension. Nothing user-uploaded is ever placed in `public/`.

## 7. Breach response (short version)

1. Contain: log everyone out by emptying the `sessions` table, rotate `APP_KEY` only if needed, change server and SMTP passwords.
2. Assess: use the audit log and server logs to find what data and whose.
3. Notify: the university DPO, and the National Privacy Commission and affected people within 72 hours when the NPC rules require it (NPC Circular 16-03, confirm current rules with the DPO).
4. Record: write what happened, what was done, and what changes to make.
5. The responsible person for each step must be named before launch.
