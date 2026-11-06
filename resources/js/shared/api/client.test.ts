import { afterEach, describe, expect, it, vi } from 'vitest';
import { api, ApiError } from './client';

function json(status: number, body: unknown = {}) {
    return Promise.resolve(new Response(status === 204 ? null : JSON.stringify(body), { status }));
}

function calls(fetchMock: ReturnType<typeof vi.fn>): string[] {
    return fetchMock.mock.calls.map(([url]) => url as string);
}

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('api client', () => {
    it('marks every call as coming from the app and sends cookies', async () => {
        const fetchMock = vi.fn<typeof fetch>(() => json(200, { ok: true }));
        vi.stubGlobal('fetch', fetchMock);

        await api('/api/me');

        const init = fetchMock.mock.calls[0][1] as RequestInit;
        expect(new Headers(init.headers).get('X-Requested-With')).toBe('XMLHttpRequest');
        expect(init.credentials).toBe('same-origin');
    });

    it('refreshes once on a 401 and retries the call', async () => {
        let meCalls = 0;
        const fetchMock = vi.fn((url: string) => {
            if (url === '/api/refresh') return json(204);
            meCalls += 1;
            return meCalls === 1 ? json(401) : json(200, { data: 'me' });
        });
        vi.stubGlobal('fetch', fetchMock);

        await expect(api('/api/me')).resolves.toEqual({ data: 'me' });
        expect(calls(fetchMock)).toEqual(['/api/me', '/api/refresh', '/api/me']);
    });

    it('shares one refresh between calls that fail at the same time', async () => {
        const seen = new Map<string, number>();
        const fetchMock = vi.fn((url: string) => {
            seen.set(url, (seen.get(url) ?? 0) + 1);
            if (url === '/api/refresh') return json(204);
            return seen.get(url) === 1 ? json(401) : json(200, { url });
        });
        vi.stubGlobal('fetch', fetchMock);

        await Promise.all([api('/api/a'), api('/api/b'), api('/api/c')]);

        expect(calls(fetchMock).filter((url) => url === '/api/refresh')).toHaveLength(1);
    });

    it('gives up with the 401 when the refresh fails', async () => {
        const fetchMock = vi.fn((url: string) => (url === '/api/refresh' ? json(401) : json(401)));
        vi.stubGlobal('fetch', fetchMock);

        await expect(api('/api/me')).rejects.toMatchObject({ status: 401 });
        expect(calls(fetchMock)).toEqual(['/api/me', '/api/refresh']);
    });

    it('never refreshes for login, logout or the refresh call itself', async () => {
        const fetchMock = vi.fn(() => json(401));
        vi.stubGlobal('fetch', fetchMock);

        for (const path of ['/api/login', '/api/logout', '/api/refresh']) {
            await expect(api(path, { method: 'POST' })).rejects.toBeInstanceOf(ApiError);
        }
        expect(calls(fetchMock)).toEqual(['/api/login', '/api/logout', '/api/refresh']);
    });
});
