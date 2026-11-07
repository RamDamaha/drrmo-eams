import type { RouteObject } from 'react-router';
import { Events } from './pages/admin/Events';
import { EventDetail } from './pages/admin/EventDetail';
import { NewEvent } from './pages/admin/NewEvent';
import { MyAssignments } from './pages/mobile/MyAssignments';

export const myDutiesRoute: RouteObject = { index: true, element: <MyAssignments /> };

// Added to the admin layout in the Core router.
export const adminEventRoutes: RouteObject[] = [
    { path: 'events', element: <Events /> },
    { path: 'events/new', element: <NewEvent /> },
    { path: 'events/:id/edit', element: <NewEvent /> },
    { path: 'events/:id', element: <EventDetail /> },
];
