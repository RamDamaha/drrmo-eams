import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { COOKIE_NOTICE_KEY } from '@/shared/cookieNotice';
import { CookieNotice } from './CookieNotice';
import { Login } from './Login';

function renderAt(path: string) {
    const router = createMemoryRouter(
        [
            { path: '/login', element: <Login /> },
            { path: '/cookies', element: <CookieNotice /> },
        ],
        { initialEntries: [path] },
    );
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
        <QueryClientProvider client={client}>
            <RouterProvider router={router} />
        </QueryClientProvider>,
    );
    return router;
}

beforeEach(() => {
    window.localStorage.clear();
    // The login screen asks who is signed in. Nobody is.
    vi.stubGlobal(
        'fetch',
        vi.fn(() => Promise.resolve(new Response('{}', { status: 401 }))),
    );
});

afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});

describe('cookie banner', () => {
    it('shows on the first visit with a Got it button and a link to the notice', async () => {
        renderAt('/login');

        const banner = await screen.findByRole('region', { name: 'Cookie notice' });
        expect(banner).toHaveTextContent('We do not track you or show ads.');
        expect(screen.getByRole('button', { name: 'Got it' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Read the cookie notice' })).toHaveAttribute(
            'href',
            '/cookies',
        );
    });

    it('hides after Got it, remembers it in local storage and stays hidden after a reload', async () => {
        renderAt('/login');
        fireEvent.click(await screen.findByRole('button', { name: 'Got it' }));

        expect(screen.queryByRole('region', { name: 'Cookie notice' })).not.toBeInTheDocument();
        expect(window.localStorage.getItem(COOKIE_NOTICE_KEY)).toBe('seen');

        // A reload: the whole app is built again from scratch.
        cleanup();
        renderAt('/login');
        await screen.findByRole('button', { name: 'Sign in' });
        expect(screen.queryByRole('region', { name: 'Cookie notice' })).not.toBeInTheDocument();
    });

    it('moves keyboard focus to the main content after Got it', async () => {
        renderAt('/login');
        fireEvent.click(await screen.findByRole('button', { name: 'Got it' }));

        expect(document.activeElement).toBe(screen.getByRole('main'));
    });

    it('stores the choice in local storage, never in a cookie', async () => {
        const before = document.cookie;
        renderAt('/login');
        fireEvent.click(await screen.findByRole('button', { name: 'Got it' }));

        expect(document.cookie).toBe(before);
    });

    it('does not cover the notice page itself', async () => {
        renderAt('/cookies');

        expect(await screen.findByRole('heading', { name: 'Cookie notice' })).toBeInTheDocument();
        expect(screen.queryByRole('region', { name: 'Cookie notice' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Got it' })).not.toBeInTheDocument();
    });

    it('opens the notice page from the banner link', async () => {
        const router = renderAt('/login');

        fireEvent.click(await screen.findByRole('link', { name: 'Read the cookie notice' }));

        expect(router.state.location.pathname).toBe('/cookies');
        expect(await screen.findByRole('heading', { name: 'Cookie notice' })).toBeInTheDocument();
    });

    it('has a Cookie notice link on the sign in screen even after the banner was dismissed', async () => {
        window.localStorage.setItem(COOKIE_NOTICE_KEY, 'seen');
        renderAt('/login');

        const links = await screen.findAllByRole('link', { name: 'Cookie notice' });
        expect(links[0]).toHaveAttribute('href', '/cookies');
        expect(screen.queryByRole('region', { name: 'Cookie notice' })).not.toBeInTheDocument();
    });

    it('still closes for this visit when the browser blocks local storage', async () => {
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
            throw new Error('blocked');
        });
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('blocked');
        });
        renderAt('/login');

        fireEvent.click(await screen.findByRole('button', { name: 'Got it' }));

        expect(screen.queryByRole('region', { name: 'Cookie notice' })).not.toBeInTheDocument();
    });

    it('does not trap focus: the form stays reachable', async () => {
        renderAt('/login');
        await screen.findByRole('region', { name: 'Cookie notice' });

        expect(screen.getByLabelText('Email')).toBeEnabled();
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
});

describe('cookie notice page', () => {
    it('lists every cookie the system sets with what it does and how long it is kept', async () => {
        renderAt('/cookies');
        await screen.findByRole('heading', { name: 'Cookie notice' });

        for (const name of ['drrmo_access', 'drrmo_refresh', 'drrmo-eams-session', 'XSRF-TOKEN']) {
            expect(screen.getByText(name)).toBeInTheDocument();
        }
        expect(screen.getByText('15 minutes')).toBeInTheDocument();
        expect(screen.getByText('7 days')).toBeInTheDocument();
        expect(screen.getAllByText('8 hours')).toHaveLength(2);
    });

    it('says the cookies are essential, there is no tracking and there is no choice to make', async () => {
        renderAt('/cookies');
        await screen.findByRole('heading', { name: 'Cookie notice' });

        expect(
            screen.getByText(/do not use cookies for tracking, advertising or analytics/),
        ).toBeInTheDocument();
        expect(
            screen.getByText(/you cannot sign in if your browser blocks them/),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('heading', { name: 'There is no cookie choice' }),
        ).toBeInTheDocument();
        // No switches or checkboxes: there are no optional cookies.
        expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
        expect(screen.queryByRole('switch')).not.toBeInTheDocument();
        expect(screen.getByText(/Data Privacy Act of 2012/)).toBeInTheDocument();
    });

    it('has a way back to the sign in screen', async () => {
        renderAt('/cookies');

        expect(await screen.findByRole('link', { name: 'Back to sign in' })).toHaveAttribute(
            'href',
            '/login',
        );
    });
});
