import { NavLink, Outlet } from 'react-router';

const items = [
    { to: '/admin', label: 'Dashboard' },
    { to: '/admin/events', label: 'Events' },
    { to: '/admin/people', label: 'People' },
    { to: '/admin/map', label: 'Map' },
    { to: '/admin/reports', label: 'Reports' },
    { to: '/admin/memos', label: 'Memos' },
    { to: '/admin/messages', label: 'Messages' },
    { to: '/admin/access', label: 'Access' },
    { to: '/admin/records', label: 'Records' },
];

// Desktop first: sidebar plus wide content.
export function AdminLayout() {
    return (
        <div className="flex min-h-screen">
            <aside className="hidden w-56 shrink-0 border-r border-gray-200 bg-white md:block">
                <div className="px-4 py-5 text-lg font-semibold text-red-700">DRRMO</div>
                <nav aria-label="Admin">
                    {items.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end
                            className={({ isActive }) =>
                                `block px-4 py-2 text-sm ${isActive ? 'bg-red-50 font-medium text-red-700' : 'text-gray-700 hover:bg-gray-100'}`
                            }
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
            </aside>
            <main className="min-w-0 flex-1 p-6">
                <Outlet />
            </main>
        </div>
    );
}
