import type { RouteObject } from 'react-router';
import { Events } from './pages/admin/Events';
import { EventDetail } from './pages/admin/EventDetail';
import { NewEvent } from './pages/admin/NewEvent';

// Added to the admin layout in the Core router.
export const adminEventRoutes: RouteObject[] = [
    { path: 'events', element: <Events /> },
    { path: 'events/new', element: <NewEvent /> },
    { path: 'events/:id', element: <EventDetail /> },
];
