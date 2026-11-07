import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { AdminLayout } from './AdminLayout';

const admin = {
    id: 1,
    first_name: 'Test',
    last_name: 'Admin',
    name: 'Test Admin',
    email: 'admin@example.test',
    role: 'admin',
    team: null,
    status: 'active',
    permissions: [],
    consent: { privacy_notice: true, location_tracking: false },
    home: '/admin',
};

function renderAt(path: string) {
    const queryClient = new QueryClient();
    queryClient.setQueryData(['me'], admin);
    const router = createMemoryRouter(
        [
            {
                path: '/admin',
                element: <AdminLayout />,
                children: [
                    { index: true, element: <p>Dashboard page</p> },
                    { path: 'events/:id', element: <p>Event page</p> },
                ],
            },
        ],
        { initialEntries: [path] },
    );
    render(
        <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
        </QueryClientProvider>,
    );
}

afterEach(cleanup);

describe('AdminLayout', () => {
    it('marks Events as current on an event detail page, not Dashboard', () => {
        renderAt('/admin/events/5');
        const sidebar = within(screen.getByRole('complementary'));

        expect(sidebar.getByRole('link', { name: 'Events' })).toHaveAttribute(
            'aria-current',
            'page',
        );
        expect(sidebar.getByRole('link', { name: 'Dashboard' })).not.toHaveAttribute(
            'aria-current',
        );
        expect(sidebar.getByText('Test Admin')).toBeInTheDocument();
        expect(sidebar.getByText('Administrator')).toBeInTheDocument();
    });

    it('opens the phone menu and closes it after a link is chosen', () => {
        renderAt('/admin/events/5');
        const toggle = screen.getByRole('button', { name: 'Open menu' });
        expect(toggle).toHaveAttribute('aria-expanded', 'false');

        fireEvent.click(toggle);
        const menu = within(document.getElementById('admin-menu')!);
        expect(screen.getByRole('button', { name: 'Close menu' })).toHaveAttribute(
            'aria-expanded',
            'true',
        );

        fireEvent.click(menu.getByRole('link', { name: 'Dashboard' }));
        expect(document.getElementById('admin-menu')).toBeNull();
        expect(screen.getByText('Dashboard page')).toBeInTheDocument();
    });

    it('closes the phone menu with Escape', () => {
        renderAt('/admin');
        fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
        fireEvent.keyDown(window, { key: 'Escape' });
        expect(document.getElementById('admin-menu')).toBeNull();
    });
});
