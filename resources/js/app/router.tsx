import { createBrowserRouter } from 'react-router';
import { adminEventRoutes, myDutiesRoute } from '@/features/events/routes';
import { AdminLayout } from '@/layouts/AdminLayout';
import { MobileLayout } from '@/layouts/MobileLayout';
import { CookieNotice } from '@/pages/CookieNotice';
import { ForgotPassword } from '@/pages/ForgotPassword';
import { AccessRequests } from '@/features/personnel/pages/admin/AccessRequests';
import { Login } from '@/pages/Login';
import { RequestAccess } from '@/pages/RequestAccess';
import { VerifyEmail } from '@/pages/VerifyEmail';
import { WaitingForApproval } from '@/pages/WaitingForApproval';
import { ResetPassword } from '@/pages/ResetPassword';
import { Placeholder } from '@/pages/Placeholder';
import { HomeRedirect, RequireAuth } from './RequireAuth';
import { NotFound } from '@/pages/NotFound';

// Owned by Core. Modules export route objects from features/<module>/routes.tsx
// and Core adds them here in a small PR.
export const router = createBrowserRouter([
    { path: '/', element: <HomeRedirect /> },
    { path: '/login', element: <Login /> },
    { path: '/cookies', element: <CookieNotice /> },
    { path: '/register', element: <RequestAccess /> },
    { path: '/register/verify', element: <VerifyEmail /> },
    { path: '/register/pending', element: <WaitingForApproval /> },
    { path: '/forgot-password', element: <ForgotPassword /> },
    { path: '/reset-password', element: <ResetPassword /> },
    {
        element: <RequireAuth area="/admin" />,
        children: [
            {
                path: '/admin',
                element: <AdminLayout />,
                children: [
                    { index: true, element: <Placeholder title="Dashboard" /> },
                    { path: 'requests', element: <AccessRequests /> },
                    ...adminEventRoutes,
                ],
            },
        ],
    },
    {
        element: <RequireAuth area="/me" />,
        children: [
            {
                path: '/me',
                element: <MobileLayout />,
                children: [myDutiesRoute],
            },
        ],
    },
    { path: '*', element: <NotFound /> },
]);
