import type { RouteObject } from 'react-router';
import { NotificationLog } from './pages/admin/NotificationLog';
import { MyNotifications } from './pages/mobile/MyNotifications';

// Added to the admin layout in the Core router.
export const adminNotificationRoutes: RouteObject[] = [
    { path: 'notifications', element: <NotificationLog /> },
];

// Added to the mobile layout in the Core router.
export const myNotificationRoutes: RouteObject[] = [
    { path: 'notifications', element: <MyNotifications /> },
];
