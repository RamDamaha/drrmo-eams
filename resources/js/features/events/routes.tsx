import type { RouteObject } from 'react-router';
import { useMe } from '@/app/auth';
import { Dashboard } from './pages/admin/Dashboard';
import { Events } from './pages/admin/Events';
import { EventNotices } from './pages/mobile/EventNotices';
import { EventDetail } from './pages/admin/EventDetail';
import { NewEvent } from './pages/admin/NewEvent';
import { MyAssignments } from './pages/mobile/MyAssignments';

// Coordinators see read only event notices; marshals and volunteers see their own duties.
function MyHome() {
    const me = useMe();
    return me.data?.role === 'coordinator' ? <EventNotices /> : <MyAssignments />;
}

export const myDutiesRoute: RouteObject = { index: true, element: <MyHome /> };

export const dashboardRoute: RouteObject = { index: true, element: <Dashboard /> };

// Added to the admin layout in the Core router.
export const adminEventRoutes: RouteObject[] = [
    { path: 'events', element: <Events /> },
    { path: 'events/new', element: <NewEvent /> },
    { path: 'events/:id/edit', element: <NewEvent /> },
    { path: 'events/:id', element: <EventDetail /> },
];
