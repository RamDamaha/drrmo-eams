// Small fetch wrapper for the Laravel API. Owned by Core.
// Sends the session cookie and the XSRF token Laravel sets after /sanctum/csrf-cookie.

export class ApiError extends Error {
    constructor(
        public status: number,
        public body: unknown,
    ) {
        super(`API error ${status}`);
    }
}

function readCookie(name: string): string | null {
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set('Accept', 'application/json');
    const token = readCookie('XSRF-TOKEN');
    if (token) headers.set('X-XSRF-TOKEN', token);
    if (init.body && !(init.body instanceof FormData))
        headers.set('Content-Type', 'application/json');

    const response = await fetch(path, { ...init, headers, credentials: 'same-origin' });
    const body = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok) throw new ApiError(response.status, body);
    return body as T;
}
