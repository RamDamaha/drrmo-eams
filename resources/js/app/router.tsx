import { createBrowserRouter } from 'react-router';
import { AdminLayout } from '@/layouts/AdminLayout';
import { MobileLayout } from '@/layouts/MobileLayout';
import { Login } from '@/pages/Login';
import { Placeholder } from '@/pages/Placeholder';
import { HomeRedirect, RequireAuth } from './RequireAuth';
import { NotFound } from '@/pages/NotFound';

// Owned by Core. Modules export route objects from features/<module>/routes.tsx
// and Core adds them here in a small PR.
export const router = createBrowserRouter([
    { path: '/', element: <HomeRedirect /> },
    { path: '/login', element: <Login /> },
    {
        element: <RequireAuth area="/admin" />,
        children: [
            {
                path: '/admin',
                element: <AdminLayout />,
                children: [{ index: true, element: <Placeholder title="Dashboard" /> }],
            },
        ],
    },
    {
        element: <RequireAuth area="/me" />,
        children: [
            {
                path: '/me',
                element: <MobileLayout />,
                children: [{ index: true, element: <Placeholder title="My duties" /> }],
            },
        ],
    },
    { path: '*', element: <NotFound /> },
]);
