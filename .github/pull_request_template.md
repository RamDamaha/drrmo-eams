## What and why

<!-- One or two sentences. Link the issue: Closes #123 -->

## Module and device

- Module: <!-- personnel, access, events, notifications, monitoring, information, records, core -->
- Device: <!-- desktop, mobile, both -->

## How to test

1.
2.

## Screenshots (UI changes)

<!-- Phone width (375 px) for mobile screens, desktop width for admin screens -->

## Definition of Done

- [ ] Tests added or updated, and `composer check` and `npm run check` pass
- [ ] Every new endpoint is covered by a policy or gate, with a test for the forbidden case
- [ ] Sensitive actions write an audit log entry (see docs/SECURITY_AND_PRIVACY.md section 4)
- [ ] List queries are scoped to the user's own rows unless a permission allows more
- [ ] No secrets, real personal data or `.env` in the diff
- [ ] Non-admin screens work at 360 px width without sideways scrolling
- [ ] Only this module's tables and folders changed, or the shared change is labelled `core`
- [ ] Docs updated (MODULES.md, DATABASE.md, USER_FLOWS.md) if behaviour or contracts changed
