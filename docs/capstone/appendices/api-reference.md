# API Reference

Filled in per milestone. See ../../DOCUMENTATION_GUIDE.md. All endpoints are under `/api`, send and return JSON, and use the Sanctum session cookie. Call `GET /sanctum/csrf-cookie` once before the first POST.

## Auth (Core)

| Method and path | Who | Request | Response |
|---|---|---|---|
| `POST /api/login` | anyone | `email`, `password` | 200 with the same body as `/api/me`. 422 `invalid_credentials` for a wrong password or a disabled account. 429 `too_many_attempts` after 5 failures in a minute for the same email and IP |
| `POST /api/logout` | signed in | none | 204 |
| `GET /api/me` | signed in | none | 200 with `data`: `id`, `name`, `email`, `role`, `team`, `status`, `permissions` (list of codes), `consent.privacy_notice`, `consent.location_tracking`, `home` (`/admin` or `/me`) |
