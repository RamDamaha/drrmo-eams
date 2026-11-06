import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ForgotPassword } from './ForgotPassword';
import { Login } from './Login';
import { ResetPassword } from './ResetPassword';

const sameAnswer =
    'If that email has an account, we sent a link to reset the password. Check your inbox.';

function json(status: number, body: unknown) {
    return Promise.resolve(new Response(status === 204 ? null : JSON.stringify(body), { status }));
}

function renderAt(path: string) {
    const router = createMemoryRouter(
        [
            { path: '/login', element: <Login /> },
            { path: '/forgot-password', element: <ForgotPassword /> },
            { path: '/reset-password', element: <ResetPassword /> },
        ],
        { initialEntries: [path] },
    );
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
        <QueryClientProvider client={client}>
            <RouterProvider router={router} />
        </QueryClientProvider>,
    );
}

function lastBody(fetchMock: ReturnType<typeof vi.fn>, url: string) {
    const call = fetchMock.mock.calls.find(([called]) => called === url);
    return JSON.parse((call?.[1] as RequestInit).body as string);
}

afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
});

describe('forgot password', () => {
    it('is linked from the sign in screen', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(() => json(401, {})),
        );
        renderAt('/login');

        fireEvent.click(await screen.findByRole('link', { name: 'Forgot your password?' }));

        expect(await screen.findByRole('heading', { name: 'Forgot password' })).toBeInTheDocument();
    });

    it('shows the same message whatever the email is', async () => {
        const fetchMock = vi.fn((url: string) => {
            if (url === '/sanctum/csrf-cookie') return json(204, null);
            return json(200, { message: sameAnswer });
        });
        vi.stubGlobal('fetch', fetchMock);
        renderAt('/forgot-password');

        fireEvent.change(screen.getByLabelText('Email'), {
            target: { value: 'nobody@example.test' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Send reset link' }));

        expect(await screen.findByRole('status')).toHaveTextContent(sameAnswer);
        expect(lastBody(fetchMock, '/api/forgot-password')).toEqual({
            email: 'nobody@example.test',
        });
    });

    it('says to wait after too many requests', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn((url: string) =>
                url === '/sanctum/csrf-cookie' ? json(204, null) : json(429, {}),
            ),
        );
        renderAt('/forgot-password');

        fireEvent.change(screen.getByLabelText('Email'), {
            target: { value: 'a@example.test' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Send reset link' }));

        expect(await screen.findByRole('alert')).toHaveTextContent('Too many requests');
    });
});

describe('reset password', () => {
    const link = '/reset-password?token=abc123&email=marshal%40example.test';

    function fill(password: string, confirmation = password) {
        fireEvent.change(screen.getByLabelText('New password'), { target: { value: password } });
        fireEvent.change(screen.getByLabelText('Type it again'), {
            target: { value: confirmation },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Save new password' }));
    }

    it('sends the token, email and new password, then points to sign in', async () => {
        const fetchMock = vi.fn((url: string) => {
            if (url === '/sanctum/csrf-cookie') return json(204, null);
            return json(200, { message: 'Your password has been changed. You can sign in now.' });
        });
        vi.stubGlobal('fetch', fetchMock);
        renderAt(link);

        fill('a-long-new-password');

        expect(await screen.findByRole('status')).toHaveTextContent(
            'Your password has been changed',
        );
        expect(screen.getByRole('link', { name: 'Go to sign in' })).toBeInTheDocument();
        expect(lastBody(fetchMock, '/api/reset-password')).toEqual({
            token: 'abc123',
            email: 'marshal@example.test',
            password: 'a-long-new-password',
            password_confirmation: 'a-long-new-password',
        });
    });

    it('checks length and matching before calling the server', async () => {
        const fetchMock = vi.fn(() => json(200, {}));
        vi.stubGlobal('fetch', fetchMock);
        renderAt(link);

        fill('short');
        expect(await screen.findByRole('alert')).toHaveTextContent('Use at least 12 characters.');

        fill('a-long-new-password', 'a-different-password');
        await waitFor(() =>
            expect(screen.getByRole('alert')).toHaveTextContent('The two passwords do not match.'),
        );
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('explains an expired or used link', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn((url: string) =>
                url === '/sanctum/csrf-cookie'
                    ? json(204, null)
                    : json(422, { code: 'invalid_reset_link' }),
            ),
        );
        renderAt(link);

        fill('a-long-new-password');

        expect(await screen.findByRole('alert')).toHaveTextContent(
            'This reset link is not valid or has expired.',
        );
    });

    it('asks for a new link when the address is incomplete', () => {
        vi.stubGlobal('fetch', vi.fn());
        renderAt('/reset-password');

        expect(screen.getByRole('alert')).toHaveTextContent('This reset link is not complete.');
        expect(screen.getByRole('link', { name: 'Ask for a new link' })).toBeInTheDocument();
    });
});
