import { NavLink, Outlet } from 'react-router';

const tabs = [
    { to: '/me', label: 'Duties' },
    { to: '/me/memos', label: 'Memos' },
    { to: '/me/messages', label: 'Messages' },
    { to: '/me/profile', label: 'Me' },
];

// Mobile first: top bar, one column, bottom navigation with large tap targets.
export function MobileLayout() {
    return (
        <div className="mx-auto flex min-h-screen max-w-2xl flex-col bg-white">
            <header className="sticky top-0 z-10 border-b border-gray-200 bg-white px-4 py-3">
                <span className="text-lg font-semibold text-red-700">DRRMO</span>
            </header>
            <main className="flex-1 px-4 py-4 pb-24">
                <Outlet />
            </main>
            <nav
                aria-label="Main"
                className="fixed inset-x-0 bottom-0 mx-auto grid max-w-2xl grid-cols-4 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)]"
            >
                {tabs.map((tab) => (
                    <NavLink
                        key={tab.to}
                        to={tab.to}
                        end
                        className={({ isActive }) =>
                            `flex min-h-14 items-center justify-center text-base ${isActive ? 'font-semibold text-red-700' : 'text-gray-600'}`
                        }
                    >
                        {tab.label}
                    </NavLink>
                ))}
            </nav>
        </div>
    );
}
