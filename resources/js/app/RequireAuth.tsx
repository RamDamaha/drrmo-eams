// Keeps signed-out visitors on the login page and sends people to the area their role belongs to.
import { Navigate, Outlet } from 'react-router';
import { useMe } from './auth';

export function RequireAuth({ area }: { area: '/admin' | '/me' }) {
    const { data: me, isPending } = useMe();

    if (isPending) return <p className="p-4 text-gray-600">Loading...</p>;
    if (!me) return <Navigate to="/login" replace />;
    if (me.home !== area) return <Navigate to={me.home} replace />;

    return <Outlet />;
}

// "/" goes to the right home once we know who the person is.
export function HomeRedirect() {
    const { data: me, isPending } = useMe();

    if (isPending) return <p className="p-4 text-gray-600">Loading...</p>;

    return <Navigate to={me ? me.home : '/login'} replace />;
}
