import { createBrowserRouter, Navigate } from 'react-router';
import { AdminLayout } from '@/layouts/AdminLayout';
import { MobileLayout } from '@/layouts/MobileLayout';
import { Placeholder } from '@/pages/Placeholder';
import { NotFound } from '@/pages/NotFound';

// Owned by Core. Modules export route objects from features/<module>/routes.tsx
// and Core adds them here in a small PR.
export const router = createBrowserRouter([
    { path: '/', element: <Navigate to="/me" replace /> },
    {
        path: '/admin',
        element: <AdminLayout />,
        children: [{ index: true, element: <Placeholder title="Dashboard" /> }],
    },
    {
        path: '/me',
        element: <MobileLayout />,
        children: [{ index: true, element: <Placeholder title="My duties" /> }],
    },
    { path: '*', element: <NotFound /> },
]);
