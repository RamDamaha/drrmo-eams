// Cookie notice (M-Cookie notice in SCREENS.md). Public page in plain, short sentences.
// The cookie names and lifetimes below must match the server settings (config/jwt.php and
// config/session.php). tests/Feature/Core/CookieNoticeTest.php checks that they do.
import { Link } from 'react-router';
import { BrandLogos } from '@/shared/ui/BrandLogos';

interface CookieInfo {
    name: string;
    purpose: string;
    lifetime: string;
}

const cookies: CookieInfo[] = [
    {
        name: 'drrmo_access',
        purpose: 'Shows the system that you are signed in. It is hidden from page scripts.',
        lifetime: '15 minutes',
    },
    {
        name: 'drrmo_refresh',
        purpose:
            'Renews your sign in so you do not retype your password every 15 minutes. It is replaced each time it is used and removed when you sign out.',
        lifetime: '7 days',
    },
    {
        name: 'drrmo-eams-session',
        purpose:
            'A technical cookie from the web framework, set when a page opens. It does not sign you in.',
        lifetime: '8 hours',
    },
    {
        name: 'XSRF-TOKEN',
        purpose:
            'A technical protection token from the web framework. It helps stop other sites from sending requests in your name.',
        lifetime: '8 hours',
    },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="mt-8">
            <h2 className="text-lg font-semibold text-stone-900">{title}</h2>
            <div className="mt-2 space-y-3 text-stone-700">{children}</div>
        </section>
    );
}

export function CookieNotice() {
    return (
        <div className="min-h-dvh bg-stone-50">
            <header className="on-dark bg-maroon-900 text-white">
                <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-4">
                    <BrandLogos size="sm" className="shrink-0 text-white" />
                    <Link to="/login" className="text-sm font-medium text-gold-300 hover:underline">
                        Back to sign in
                    </Link>
                </div>
            </header>

            <main className="mx-auto max-w-3xl px-6 pt-8 pb-16">
                <div className="brand-stripe h-1 w-12 rounded-full" aria-hidden="true" />
                <h1 className="mt-5 text-2xl font-semibold tracking-tight text-stone-900 sm:text-[1.75rem]">
                    Cookie notice
                </h1>
                <p className="mt-2 text-pretty text-stone-700">
                    This system uses a few cookies. They keep you signed in and protect your
                    account. We do not use cookies for tracking, advertising or analytics.
                </p>
                <p className="mt-2 text-sm text-stone-500">Last updated: 6 November 2026</p>

                <Section title="The cookies we set">
                    <ul className="space-y-3">
                        {cookies.map((cookie) => (
                            <li
                                key={cookie.name}
                                className="rounded-card border border-stone-200 bg-white p-4"
                            >
                                <p className="font-mono text-sm font-semibold break-all text-stone-900">
                                    {cookie.name}
                                </p>
                                <p className="mt-1 text-pretty">{cookie.purpose}</p>
                                <p className="mt-2 text-sm text-stone-600">
                                    <span className="font-medium text-stone-800">Kept for:</span>{' '}
                                    {cookie.lifetime}
                                </p>
                            </li>
                        ))}
                    </ul>
                </Section>

                <Section title="There is no cookie choice">
                    <p>
                        All of these cookies are essential. The system does not work without them,
                        and you cannot sign in if your browser blocks them.
                    </p>
                    <p>
                        There are no optional cookies, so there is nothing to switch on or off. That
                        is why the cookie message has only a Got it button.
                    </p>
                </Section>

                <Section title="What else your browser keeps">
                    <p>
                        When you press Got it, your browser remembers that in its local storage.
                        This is not a cookie. It holds one word and no personal data. If you clear
                        the site data, the message shows again.
                    </p>
                </Section>

                <Section title="Your information">
                    <p>
                        The Data Privacy Act of 2012 (RA 10173) protects the information we keep
                        about you. The privacy notice explains what we collect and why.
                    </p>
                </Section>

                <Section title="Questions">
                    <p>
                        Ask the ZPPSU Disaster Risk Reduction and Management Office, Zamboanga City.
                    </p>
                </Section>
            </main>
        </div>
    );
}
