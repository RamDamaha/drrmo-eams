# API Reference

Filled in per milestone. See ../../DOCUMENTATION_GUIDE.md. All endpoints are under `/api`, send and return JSON, and use the Sanctum session cookie. Call `GET /sanctum/csrf-cookie` once before the first POST.

## Auth (Core)

| Method and path | Who | Request | Response |
|---|---|---|---|
| `POST /api/login` | anyone | `email`, `password` | 200 with the same body as `/api/me`. 422 `invalid_credentials` for a wrong password or a disabled account. 429 `too_many_attempts` after 5 failures in a minute for the same email and IP |
| `POST /api/logout` | signed in | none | 204 |
| `POST /api/forgot-password` | anyone | `email` | 200 with `message`. The same answer whether or not the email has an account. A disabled account gets no email. 422 for a missing or malformed email. 429 `too_many_attempts` after 3 requests in 10 minutes from the same IP |
| `POST /api/reset-password` | anyone with a link | `token`, `email`, `password`, `password_confirmation` | 200 with `message`. The password needs at least 12 characters. Every session of the account ends. 422 `invalid_reset_link` for a wrong, used or expired (over 60 minutes) link, an unknown email or a disabled account. 422 with `errors.password` for a weak or mismatched password. 429 `too_many_attempts` after 10 tries in 10 minutes from the same IP |
| `GET /api/me` | signed in | none | 200 with `data`: `id`, `name`, `email`, `role`, `team`, `status`, `permissions` (list of codes), `consent.privacy_notice`, `consent.location_tracking`, `home` (`/admin` or `/me`) |
