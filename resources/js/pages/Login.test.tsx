import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HomeRedirect, RequireAuth } from '@/app/RequireAuth';
import { Login } from './Login';

const marshal = {
    id: 1,
    name: 'Test Marshal',
    email: 'marshal@example.test',
    role: 'marshal',
    team: null,
    status: 'active',
    permissions: [],
    consent: { privacy_notice: true, location_tracking: false },
    home: '/me',
};

function json(status: number, body: unknown) {
    return Promise.resolve(new Response(status === 204 ? null : JSON.stringify(body), { status }));
}

function renderAt(path: string) {
    const router = createMemoryRouter(
        [
            { path: '/', element: <HomeRedirect /> },
            { path: '/login', element: <Login /> },
            {
                element: <RequireAuth area="/me" />,
                children: [{ path: '/me', element: <h1>My duties</h1> }],
            },
            {
                element: <RequireAuth area="/admin" />,
                children: [{ path: '/admin', element: <h1>Dashboard</h1> }],
            },
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

afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
});

describe('login flow', () => {
    it('sends a signed-out visitor to the login page', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(() => json(401, { message: 'Unauthenticated.' })),
        );
        renderAt('/me');
        expect(await screen.findByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    });

    it('signs in and lands on the phone area', async () => {
        const fetchMock = vi.fn((url: string) => {
            if (url === '/api/me') return json(401, {});
            if (url === '/sanctum/csrf-cookie') return json(204, null);
            return json(200, { data: marshal });
        });
        vi.stubGlobal('fetch', fetchMock);
        renderAt('/login');

        fireEvent.change(await screen.findByLabelText('Email'), {
            target: { value: 'marshal@example.test' },
        });
        fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password' } });
        fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

        expect(await screen.findByRole('heading', { name: 'My duties' })).toBeInTheDocument();
    });

    it('shows a clear message for a wrong password', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn((url: string) => {
                if (url === '/api/me') return json(401, {});
                if (url === '/sanctum/csrf-cookie') return json(204, null);
                return json(422, { code: 'invalid_credentials' });
            }),
        );
        renderAt('/login');

        fireEvent.change(await screen.findByLabelText('Email'), {
            target: { value: 'a@example.test' },
        });
        fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'nope' } });
        fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

        await waitFor(() =>
            expect(screen.getByRole('alert')).toHaveTextContent('The email or password is wrong.'),
        );
    });

    it('keeps a marshal out of the admin area', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(() => json(200, { data: marshal })),
        );
        renderAt('/admin');
        expect(await screen.findByRole('heading', { name: 'My duties' })).toBeInTheDocument();
    });
});
