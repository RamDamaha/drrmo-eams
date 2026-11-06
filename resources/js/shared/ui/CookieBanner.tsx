// First visit cookie message. A bar fixed to the bottom on phones and a floating card at the
// bottom right on desktop, so it never covers the maroon brand panel. It does not trap focus and
// does not block the page: people can ignore it and keep using the form.
// There are no optional cookies, so there is only "Got it", no accept or reject choice.
import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { hasSeenCookieNotice, rememberCookieNotice } from '@/shared/cookieNotice';
import { Button } from './Button';

export function CookieBanner() {
    const { pathname } = useLocation();
    const [seen, setSeen] = useState(hasSeenCookieNotice);

    // The notice page itself is where people read it, so no banner on top of it.
    if (seen || pathname === '/cookies') return null;

    function dismiss() {
        rememberCookieNotice();
        setSeen(true);
        // The button disappears, so put keyboard focus somewhere sensible instead of the body.
        document.querySelector<HTMLElement>('main')?.focus({ preventScroll: true });
    }

    return (
        <>
            {/* Room at the end of the page on phones, so the fixed bar never hides the last link. */}
            <div aria-hidden="true" className="h-52 sm:hidden" />
            <section
                aria-label="Cookie notice"
                className="fixed inset-x-0 bottom-0 z-20 animate-dialog-in border-t border-stone-200 bg-white px-6 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-raised sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-full sm:max-w-md sm:rounded-card sm:border-0 sm:p-5 sm:ring-1 sm:ring-stone-200"
            >
                <h2 className="text-base font-semibold text-stone-900">Cookies on this site</h2>
                <p className="mt-1 text-sm leading-relaxed text-pretty text-stone-600">
                    We only use cookies that keep you signed in and keep your account safe. We do
                    not track you or show ads.
                </p>
                <div className="mt-4 flex flex-row-reverse items-center justify-between gap-4">
                    <Button onClick={dismiss} className="px-7 sm:min-h-10 sm:px-4 sm:text-sm">
                        Got it
                    </Button>
                    <Link
                        to="/cookies"
                        className="flex min-h-12 items-center text-sm font-medium text-maroon-700 underline underline-offset-2 hover:text-maroon-800 sm:min-h-0"
                    >
                        Read the cookie notice
                    </Link>
                </div>
            </section>
        </>
    );
}
