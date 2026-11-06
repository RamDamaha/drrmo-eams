// Small fetch wrapper for the Laravel API. Owned by Core.
// Auth lives in two HttpOnly cookies (access and refresh token) that this code never reads.
// The X-Requested-With header marks calls as coming from the app (CSRF check on the server).

export class ApiError extends Error {
    constructor(
        public status: number,
        public body: unknown,
    ) {
        super(`API error ${status}`);
    }
}

// Calls that must never trigger a token refresh.
const noRefresh = new Set([
    '/api/login',
    '/api/refresh',
    '/api/logout',
    '/api/forgot-password',
    '/api/reset-password',
]);

let refreshing: Promise<boolean> | null = null;

// One refresh at a time. Every call that got a 401 meanwhile waits for the same answer.
export function refreshSession(): Promise<boolean> {
    refreshing ??= fetch('/api/refresh', {
        method: 'POST',
        headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        credentials: 'same-origin',
    })
        .then((response) => response.ok)
        .catch(() => false)
        .finally(() => {
            refreshing = null;
        });
    return refreshing;
}

function send(path: string, init: RequestInit): Promise<Response> {
    const headers = new Headers(init.headers);
    headers.set('Accept', 'application/json');
    headers.set('X-Requested-With', 'XMLHttpRequest');
    if (init.body && !(init.body instanceof FormData))
        headers.set('Content-Type', 'application/json');

    return fetch(path, { ...init, headers, credentials: 'same-origin' });
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
    let response = await send(path, init);

    // The access token lasts 15 minutes. On a 401, refresh once and try again.
    if (response.status === 401 && !noRefresh.has(path) && (await refreshSession())) {
        response = await send(path, init);
    }

    const body = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok) throw new ApiError(response.status, body);
    return body as T;
}
