import type { RouteObject } from 'react-router';
import { Events } from './pages/admin/Events';
import { NewEvent } from './pages/admin/NewEvent';

// Added to the admin layout in the Core router.
export const adminEventRoutes: RouteObject[] = [
    { path: 'events', element: <Events /> },
    { path: 'events/new', element: <NewEvent /> },
];
