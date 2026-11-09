import type { RouteObject } from 'react-router';
import { NotificationLog } from './pages/admin/NotificationLog';

// Added to the admin layout in the Core router.
export const adminNotificationRoutes: RouteObject[] = [
    { path: 'notifications', element: <NotificationLog /> },
];
